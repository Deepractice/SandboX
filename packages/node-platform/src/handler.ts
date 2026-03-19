/**
 * RPC handler — dispatches JSON-RPC requests to a Sandbox instance via RpcHandlerRegistry.
 */

import type { Sandbox } from "@sandboxxjs/core";
import type { JsonRpcRequest, JsonRpcResponse } from "@sandboxxjs/core/protocol";
import { RpcHandlerRegistry, ok } from "@deepracticex/rpc";
import { createErrorResponse, createResponse } from "./rpc.js";

/**
 * Create a registry with all sandbox RPC methods registered.
 */
export function createSandboxRegistry(): RpcHandlerRegistry<Sandbox> {
  const registry = new RpcHandlerRegistry<Sandbox>();

  registry.register("exec.run", "Execute a command and return stdout/stderr", async (sandbox, params) => {
    const p = params as Record<string, unknown>;
    const result = await sandbox.exec(p.command as string, {
      cwd: p.cwd as string | undefined,
      timeout: p.timeout as number | undefined,
    });
    return ok(result);
  });

  registry.register("fs.read", "Read file content", async (sandbox, params) => {
    const p = params as Record<string, unknown>;
    const content = await sandbox.readFile(p.path as string);
    return ok({ content });
  });

  registry.register("fs.write", "Write content to file", async (sandbox, params) => {
    const p = params as Record<string, unknown>;
    await sandbox.writeFile(p.path as string, p.content as string);
    return ok({});
  });

  registry.register("fs.list", "List directory contents", async (sandbox, params) => {
    const p = params as Record<string, unknown>;
    const files = await sandbox.listFiles(p.path as string);
    return ok({ files });
  });

  registry.register("fs.mkdir", "Create directory", async (sandbox, params) => {
    const p = params as Record<string, unknown>;
    await sandbox.mkdir(p.path as string, { recursive: p.recursive as boolean | undefined });
    return ok({});
  });

  registry.register("fs.delete", "Delete file/directory", async (sandbox, params) => {
    const p = params as Record<string, unknown>;
    await sandbox.deleteFile(p.path as string);
    return ok({});
  });

  registry.register("process.start", "Start a background process", async (sandbox, params) => {
    const p = params as Record<string, unknown>;
    const result = await sandbox.startProcess(p.command as string, {
      cwd: p.cwd as string | undefined,
    });
    return ok(result);
  });

  registry.register("process.kill", "Kill a running process", async (sandbox, params) => {
    const p = params as Record<string, unknown>;
    await sandbox.killProcess(p.processId as string);
    return ok({});
  });

  registry.register("process.list", "List all running processes", async (sandbox, _params) => {
    const processes = await sandbox.listProcesses();
    return ok({ processes });
  });

  registry.register("sandbox.destroy", "Destroy the sandbox instance", async (sandbox, _params) => {
    await sandbox.destroy();
    return ok({});
  });

  return registry;
}

// Singleton registry — created once
let _registry: RpcHandlerRegistry<Sandbox> | null = null;

function getRegistry(): RpcHandlerRegistry<Sandbox> {
  if (!_registry) _registry = createSandboxRegistry();
  return _registry;
}

/**
 * Handle a JSON-RPC request — bridges RpcHandlerRegistry to SandboX wire format.
 */
export async function handleRequest(sandbox: Sandbox, req: JsonRpcRequest): Promise<JsonRpcResponse> {
  const registry = getRegistry();
  const response = await registry.handle(sandbox, req.method, (req.params ?? {}) as Record<string, unknown>);

  if (response.success) {
    return createResponse(req.id, response.data);
  }
  return createErrorResponse(req.id, response.code, response.message);
}
