/**
 * Built-in Client — connects to a Worker or Broker via standard WebSocket.
 *
 * Works in both browser and Node.js 22+ (no external dependencies).
 * Implements Sandbox interface by sending JSON-RPC 2.0 requests.
 */

import type { Client, ExecOptions, ExecResult, FileInfo, ProcessInfo } from "@sandboxxjs/core";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id: number;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: { code: number; message: string };
  id: number;
}

let nextId = 1;

export async function connect(
  serverUrl: string,
  options?: { token?: string; sandboxId?: string }
): Promise<Client> {
  const ws = await openWebSocket(serverUrl);
  const pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (reason: Error) => void;
    }
  >();

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(typeof event.data === "string" ? event.data : "") as JsonRpcResponse;
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
      const req: JsonRpcRequest = {
        jsonrpc: "2.0",
        method,
        params,
        id: nextId++,
      };
      pending.set(req.id, { resolve, reject });
      ws.send(JSON.stringify(req));
    });
  }

  // If connecting through a Broker with a sandboxId, register the target
  if (options?.sandboxId) {
    await call("client.target", {
      sandboxId: options.sandboxId,
      token: options.token,
    });
  }

  return {
    exec: (command: string, opts?: ExecOptions) =>
      call("exec.run", { command, ...opts }) as Promise<ExecResult>,

    startProcess: (command: string, opts?: { cwd?: string }) =>
      call("process.start", { command, ...opts }) as Promise<ProcessInfo>,

    killProcess: (processId: string) => call("process.kill", { processId }) as Promise<void>,

    listProcesses: () =>
      call("process.list").then((r) => (r as { processes: ProcessInfo[] }).processes),

    readFile: (path: string) =>
      call("fs.read", { path }).then((r) => (r as { content: string }).content),

    writeFile: (path: string, content: string) =>
      call("fs.write", { path, content }) as Promise<void>,

    listFiles: (path: string) =>
      call("fs.list", { path }).then((r) => (r as { files: FileInfo[] }).files),

    mkdir: (path: string, opts?: { recursive?: boolean }) =>
      call("fs.mkdir", { path, ...opts }) as Promise<void>,

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

function openWebSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", () => reject(new Error(`WebSocket connection failed: ${url}`)));
  });
}
