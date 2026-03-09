/**
 * RPC handler — dispatches JSON-RPC requests to a Sandbox instance.
 */

import type { Sandbox } from "@sandboxxjs/core";
import type { JsonRpcRequest } from "@sandboxxjs/core/protocol";
import { ErrorCodes } from "@sandboxxjs/core/protocol";
import { createErrorResponse, createResponse } from "./rpc.js";

export async function handleRequest(sandbox: Sandbox, req: JsonRpcRequest) {
  try {
    const p = req.params as Record<string, unknown> | undefined;
    let result: unknown;

    switch (req.method) {
      case "exec.run":
        result = await sandbox.exec(p?.command as string, {
          cwd: p?.cwd as string | undefined,
          timeout: p?.timeout as number | undefined,
        });
        break;
      case "fs.read":
        result = { content: await sandbox.readFile(p?.path as string) };
        break;
      case "fs.write":
        await sandbox.writeFile(p?.path as string, p?.content as string);
        result = {};
        break;
      case "fs.list":
        result = { files: await sandbox.listFiles(p?.path as string) };
        break;
      case "fs.mkdir":
        await sandbox.mkdir(p?.path as string, { recursive: p?.recursive as boolean | undefined });
        result = {};
        break;
      case "fs.delete":
        await sandbox.deleteFile(p?.path as string);
        result = {};
        break;
      case "process.start":
        result = await sandbox.startProcess(p?.command as string, {
          cwd: p?.cwd as string | undefined,
        });
        break;
      case "process.kill":
        await sandbox.killProcess(p?.processId as string);
        result = {};
        break;
      case "process.list":
        result = { processes: await sandbox.listProcesses() };
        break;
      case "sandbox.destroy":
        await sandbox.destroy();
        result = {};
        break;
      default:
        return createErrorResponse(
          req.id,
          ErrorCodes.METHOD_NOT_FOUND,
          `Unknown method: ${req.method}`
        );
    }

    return createResponse(req.id, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return createErrorResponse(req.id, ErrorCodes.INTERNAL_ERROR, message);
  }
}
