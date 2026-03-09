/**
 * NodeWorker — executes sandbox commands.
 *
 * Two modes:
 *   serve({ port }) — WebSocket server, clients connect directly
 *   run({ broker, token }) — WebSocket client, connects to Broker
 */

import { randomUUID } from "node:crypto";
import type { RunConfig, ServeConfig, Worker } from "@sandboxxjs/core";
import type { WorkerBuilder } from "@sandboxxjs/core/platform";
import type { JsonRpcRequest } from "@sandboxxjs/core/protocol";
import WebSocket, { WebSocketServer } from "ws";
import { handleRequest } from "./handler.js";
import { NodeLocalSandbox } from "./local.js";
import { createRequest, isRequest, parseMessage } from "./rpc.js";

export function createNodeWorkerBuilder(): WorkerBuilder {
  return {
    serve: (config) => serveWorker(config),
    run: (config) => runWorker(config),
  };
}

/** serve mode — listen for direct client connections */
async function serveWorker(config: ServeConfig): Promise<Worker> {
  const sandboxId = randomUUID();
  const sandbox = new NodeLocalSandbox(sandboxId);
  let isRunning = true;

  const wss = new WebSocketServer({
    port: config.port,
    host: config.hostname ?? "0.0.0.0",
  });

  await new Promise<void>((resolve) => wss.on("listening", resolve));

  wss.on("connection", (ws) => {
    ws.on("message", async (data) => {
      const msg = parseMessage(data.toString());
      if (isRequest(msg)) {
        const response = await handleRequest(sandbox, msg as JsonRpcRequest);
        ws.send(JSON.stringify(response));
      }
    });
  });

  return {
    exec: (cmd, opts) => sandbox.exec(cmd, opts),
    startProcess: (cmd, opts) => sandbox.startProcess(cmd, opts),
    killProcess: (id) => sandbox.killProcess(id),
    listProcesses: () => sandbox.listProcesses(),
    readFile: (p) => sandbox.readFile(p),
    writeFile: (p, c) => sandbox.writeFile(p, c),
    listFiles: (p) => sandbox.listFiles(p),
    mkdir: (p, o) => sandbox.mkdir(p, o),
    deleteFile: (p) => sandbox.deleteFile(p),
    destroy: () => sandbox.destroy(),

    stop: async () => {
      isRunning = false;
      await sandbox.destroy();
      wss.close();
    },
    get running() {
      return isRunning;
    },
    get sandboxId() {
      return sandboxId;
    },
  };
}

/** run mode — connect to a Broker and register */
async function runWorker(config: RunConfig): Promise<Worker> {
  const sandboxId = config.sandboxId ?? randomUUID();
  const sandbox = new NodeLocalSandbox(sandboxId);
  let isRunning = true;

  const ws = await new Promise<WebSocket>((resolve, reject) => {
    const socket = new WebSocket(config.broker);
    socket.on("open", () => resolve(socket));
    socket.on("error", reject);
  });

  // Register with the Broker
  const registerReq = createRequest("worker.register", {
    sandboxId,
    token: config.token,
  });
  ws.send(JSON.stringify(registerReq));

  // Handle incoming requests from Broker
  ws.on("message", async (data) => {
    const msg = parseMessage(data.toString());
    if (isRequest(msg)) {
      const response = await handleRequest(sandbox, msg as JsonRpcRequest);
      ws.send(JSON.stringify(response));
    }
  });

  // Heartbeat
  const heartbeatMs = config.heartbeatInterval ?? 30_000;
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, heartbeatMs);

  return {
    exec: (cmd, opts) => sandbox.exec(cmd, opts),
    startProcess: (cmd, opts) => sandbox.startProcess(cmd, opts),
    killProcess: (id) => sandbox.killProcess(id),
    listProcesses: () => sandbox.listProcesses(),
    readFile: (p) => sandbox.readFile(p),
    writeFile: (p, c) => sandbox.writeFile(p, c),
    listFiles: (p) => sandbox.listFiles(p),
    mkdir: (p, o) => sandbox.mkdir(p, o),
    deleteFile: (p) => sandbox.deleteFile(p),
    destroy: () => sandbox.destroy(),

    stop: async () => {
      isRunning = false;
      clearInterval(heartbeat);
      await sandbox.destroy();
      ws.close();
    },
    get running() {
      return isRunning;
    },
    get sandboxId() {
      return sandboxId;
    },
  };
}
