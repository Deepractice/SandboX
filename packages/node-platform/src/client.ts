/**
 * NodeClient — connects to a Worker or Broker via WebSocket.
 * Implements Sandbox by sending JSON-RPC requests.
 */

import type {
  Client,
  ClientConfig,
  ExecOptions,
  ExecResult,
  FileInfo,
  ProcessInfo,
} from "@sandboxxjs/core";
import type { JsonRpcResponse } from "@sandboxxjs/core/protocol";
import WebSocket from "ws";
import { createRequest } from "./rpc.js";

export async function createNodeClient(config: ClientConfig): Promise<Client> {
  const ws = await connect(config.serverUrl);
  const pending = new Map<
    string | number,
    {
      resolve: (value: unknown) => void;
      reject: (reason: Error) => void;
    }
  >();

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString()) as JsonRpcResponse;
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) {
      p.reject(new Error(`${msg.error.message} (code: ${msg.error.code})`));
    } else {
      p.resolve(msg.result);
    }
  });

  function call(method: string, params?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = createRequest(method, params);
      pending.set(req.id, { resolve, reject });
      ws.send(JSON.stringify(req));
    });
  }

  // If connecting through a Broker with a sandboxId, register the target
  if (config.sandboxId) {
    await call("client.target", { sandboxId: config.sandboxId, token: config.token });
  }

  return {
    exec: (command: string, options?: ExecOptions) =>
      call("exec.run", { command, ...options }) as Promise<ExecResult>,

    startProcess: (command: string, options?: { cwd?: string }) =>
      call("process.start", { command, ...options }) as Promise<ProcessInfo>,

    killProcess: (processId: string) => call("process.kill", { processId }) as Promise<void>,

    listProcesses: () =>
      call("process.list").then((r) => (r as { processes: ProcessInfo[] }).processes),

    readFile: (path: string) =>
      call("fs.read", { path }).then((r) => (r as { content: string }).content),

    writeFile: (path: string, content: string) =>
      call("fs.write", { path, content }) as Promise<void>,

    listFiles: (path: string) =>
      call("fs.list", { path }).then((r) => (r as { files: FileInfo[] }).files),

    mkdir: (path: string, options?: { recursive?: boolean }) =>
      call("fs.mkdir", { path, ...options }) as Promise<void>,

    deleteFile: (path: string) => call("fs.delete", { path }) as Promise<void>,

    destroy: () => call("sandbox.destroy") as Promise<void>,

    disconnect: async () => {
      for (const p of pending.values()) {
        p.reject(new Error("Client disconnected"));
      }
      pending.clear();
      ws.close();
    },

    get connected() {
      return ws.readyState === WebSocket.OPEN;
    },
  };
}

function connect(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}
