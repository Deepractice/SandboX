/**
 * JSON-RPC 2.0 helpers for WebSocket communication.
 */

import type { JsonRpcRequest, JsonRpcResponse } from "@sandboxxjs/core/protocol";

let nextId = 1;

export function createRequest(method: string, params?: unknown): JsonRpcRequest {
  return { jsonrpc: "2.0", method, params, id: nextId++ };
}

export function createResponse(id: string | number, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", result, id };
}

export function createErrorResponse(
  id: string | number,
  code: number,
  message: string
): JsonRpcResponse {
  return { jsonrpc: "2.0", error: { code, message }, id };
}

export function parseMessage(data: string): JsonRpcRequest | JsonRpcResponse {
  return JSON.parse(data);
}

export function isRequest(msg: unknown): msg is JsonRpcRequest {
  return typeof msg === "object" && msg !== null && "method" in msg && "id" in msg;
}

export function isResponse(msg: unknown): msg is JsonRpcResponse {
  return typeof msg === "object" && msg !== null && !("method" in msg) && "id" in msg;
}
