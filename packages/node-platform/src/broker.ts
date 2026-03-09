/**
 * NodeBroker — registry + router + discovery + proxy.
 *
 * Workers connect and register their sandboxId.
 * Clients connect, target a sandboxId, and send commands.
 * Broker forwards commands to the right Worker and relays responses back.
 */

import type { Broker, BrokerConfig } from "@sandboxxjs/core";
import type { JsonRpcRequest, JsonRpcResponse } from "@sandboxxjs/core/protocol";
import { ErrorCodes } from "@sandboxxjs/core/protocol";
import WebSocket, { WebSocketServer } from "ws";
import { createErrorResponse, isRequest, isResponse, parseMessage } from "./rpc.js";

interface RegisteredWorker {
  ws: WebSocket;
  sandboxId: string;
  connectedAt: number;
}

export async function createNodeBroker(config: BrokerConfig): Promise<Broker> {
  const workerMap = new Map<string, RegisteredWorker>();
  // Broker-level proxy id mapping: proxyId → { originalId, clientWs }
  const proxyMap = new Map<number, { originalId: string | number; clientWs: WebSocket }>();
  let isRunning = true;
  let nextProxyId = 1;

  const wss = new WebSocketServer({
    port: config.port,
    host: config.hostname ?? "0.0.0.0",
  });

  await new Promise<void>((resolve) => wss.on("listening", resolve));

  wss.on("connection", (ws) => {
    let role: "worker" | "client" | "unknown" = "unknown";
    let workerSandboxId: string | undefined;
    let clientTargetId: string | undefined;

    ws.on("message", async (data) => {
      const msg = parseMessage(data.toString());

      // Worker registration
      if (isRequest(msg) && msg.method === "worker.register") {
        role = "worker";
        const params = msg.params as { sandboxId: string; token: string };
        workerSandboxId = params.sandboxId;
        workerMap.set(params.sandboxId, {
          ws,
          sandboxId: params.sandboxId,
          connectedAt: Date.now(),
        });
        ws.send(
          JSON.stringify({ jsonrpc: "2.0", result: { sandboxId: params.sandboxId }, id: msg.id })
        );
        return;
      }

      // Client targeting a sandbox
      if (isRequest(msg) && msg.method === "client.target") {
        role = "client";
        const params = msg.params as { sandboxId: string };
        clientTargetId = params.sandboxId;
        ws.send(JSON.stringify({ jsonrpc: "2.0", result: { ok: true }, id: msg.id }));
        return;
      }

      // Worker responding to a forwarded request — look up in broker-level proxyMap
      if (role === "worker" && isResponse(msg)) {
        const mapping = proxyMap.get(msg.id as number);
        if (mapping) {
          proxyMap.delete(msg.id as number);
          const clientResponse: JsonRpcResponse = {
            jsonrpc: "2.0",
            result: msg.result,
            error: msg.error,
            id: mapping.originalId,
          };
          if (mapping.clientWs.readyState === WebSocket.OPEN) {
            mapping.clientWs.send(JSON.stringify(clientResponse));
          }
        }
        return;
      }

      // Client sending a sandbox command — proxy to Worker
      if (role === "client" && isRequest(msg) && clientTargetId) {
        const worker = workerMap.get(clientTargetId);
        if (!worker || worker.ws.readyState !== WebSocket.OPEN) {
          const err = createErrorResponse(
            msg.id,
            ErrorCodes.WORKER_NOT_FOUND,
            `Worker ${clientTargetId} not found`
          );
          ws.send(JSON.stringify(err));
          return;
        }

        const proxyId = nextProxyId++;
        proxyMap.set(proxyId, { originalId: msg.id, clientWs: ws });

        const proxied: JsonRpcRequest = {
          jsonrpc: "2.0",
          method: msg.method,
          params: msg.params,
          id: proxyId,
        };
        worker.ws.send(JSON.stringify(proxied));
        return;
      }

      if (isRequest(msg) && role === "unknown") {
        const err = createErrorResponse(
          msg.id,
          ErrorCodes.INVALID_REQUEST,
          "Call client.target first to select a sandbox"
        );
        ws.send(JSON.stringify(err));
      }
    });

    ws.on("close", () => {
      if (role === "worker" && workerSandboxId) {
        workerMap.delete(workerSandboxId);
      }
    });
  });

  return {
    stop: async () => {
      isRunning = false;
      wss.close();
    },
    get running() {
      return isRunning;
    },
    workers: () =>
      Array.from(workerMap.values()).map((w) => ({
        sandboxId: w.sandboxId,
        connectedAt: w.connectedAt,
      })),
  };
}
