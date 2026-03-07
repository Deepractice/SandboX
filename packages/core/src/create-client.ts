/**
 * createSandboxClient — the runtime implementation of SandboxClient.
 *
 * Platform-agnostic: uses standard WebSocket API (available in Node 22+, browsers).
 * Platform differences are injected via SandboxProvider, which supplies
 * Executor, FileSystem, and ProcessManager components.
 */

import type { SandboxClient, SandboxClientOptions } from "./client";
import type {
  ClientMessage,
  ErrorMessage,
  FsResultMessage,
  ResultMessage,
  ServiceMessage,
} from "./protocol";
import type { SandboxProvider } from "./provider";

export function createSandboxClient(provider: SandboxProvider): SandboxClient {
  const executor = provider.createExecutor();
  const fs = provider.createFileSystem();
  const pm = provider.createProcessManager();

  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let isConnected = false;

  async function connect(options: SandboxClientOptions): Promise<void> {
    const { wsUrl, sandboxId, token, heartbeatInterval = 30_000 } = options;

    return new Promise((resolve, reject) => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Step 3: Register
        const registerMsg: ClientMessage = { type: "register", sandboxId, token };
        ws!.send(JSON.stringify(registerMsg));
      };

      ws.onmessage = (event) => {
        const data = typeof event.data === "string" ? event.data : "";
        let msg: ServiceMessage;
        try {
          msg = JSON.parse(data);
        } catch {
          return;
        }

        if (msg.type === "registered") {
          // Step 4: Ready
          isConnected = true;
          heartbeatTimer = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              const hb: ClientMessage = { type: "heartbeat" };
              ws.send(JSON.stringify(hb));
            }
          }, heartbeatInterval);
          resolve();
          return;
        }

        // Step 5: Command — handle and respond
        handleCommand(msg);
      };

      ws.onerror = () => {
        if (!isConnected) reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = () => {
        cleanup();
      };
    });
  }

  async function handleCommand(msg: ServiceMessage): Promise<void> {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    try {
      switch (msg.type) {
        // Executor
        case "exec": {
          const result = await executor.exec(msg.command, {
            cwd: msg.cwd,
            timeout: msg.timeout,
          });
          const reply: ResultMessage = {
            type: "result",
            id: msg.id,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
          };
          ws.send(JSON.stringify(reply));
          break;
        }

        // FileSystem
        case "fs.read": {
          const content = await fs.readFile(msg.path);
          sendFsResult(msg.id, { content });
          break;
        }

        case "fs.write": {
          await fs.writeFile(msg.path, msg.content);
          sendFsResult(msg.id, { written: true });
          break;
        }

        case "fs.list": {
          const files = await fs.listFiles(msg.path);
          sendFsResult(msg.id, files);
          break;
        }

        case "fs.mkdir": {
          await fs.mkdir(msg.path, { recursive: msg.recursive });
          sendFsResult(msg.id, { created: true });
          break;
        }

        case "fs.delete": {
          await fs.deleteFile(msg.path);
          sendFsResult(msg.id, { deleted: true });
          break;
        }

        // ProcessManager
        case "process.start": {
          const proc = await pm.start(msg.command, { cwd: msg.cwd });
          sendFsResult(msg.id, proc);
          break;
        }

        case "process.kill": {
          await pm.kill(msg.processId);
          sendFsResult(msg.id, { killed: true });
          break;
        }

        case "process.list": {
          const procs = await pm.list();
          sendFsResult(msg.id, procs);
          break;
        }
      }
    } catch (err) {
      const errorMsg: ErrorMessage = {
        type: "error",
        id: (msg as { id?: string }).id || "unknown",
        message: err instanceof Error ? err.message : "Command failed",
      };
      ws.send(JSON.stringify(errorMsg));
    }
  }

  function sendFsResult(id: string, data: unknown): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const reply: FsResultMessage = { type: "fs.result", id, data };
    ws.send(JSON.stringify(reply));
  }

  function cleanup(): void {
    isConnected = false;
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    ws = null;
  }

  async function disconnect(): Promise<void> {
    if (ws) {
      ws.close();
      cleanup();
    }
  }

  return {
    connect,
    disconnect,
    get connected() {
      return isConnected;
    },
  };
}
