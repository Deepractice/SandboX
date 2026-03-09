/**
 * Sandbox Protocol — JSON-RPC 2.0 based communication.
 *
 * All three roles (Client, Broker, Worker) speak this protocol.
 * Methods map 1:1 to the Sandbox interface.
 */

// ============================================================
// JSON-RPC 2.0 base types
// ============================================================

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id: string | number;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: JsonRpcError;
  id: string | number;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ============================================================
// Sandbox RPC methods — maps to Sandbox interface
// ============================================================

export type SandboxMethod =
  | "exec.run"
  | "fs.read"
  | "fs.write"
  | "fs.list"
  | "fs.mkdir"
  | "fs.delete"
  | "process.start"
  | "process.kill"
  | "process.list"
  | "sandbox.destroy";

// ============================================================
// Method params and results
// ============================================================

export interface ExecRunParams {
  command: string;
  cwd?: string;
  timeout?: number;
}

export interface ExecRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface FsReadParams {
  path: string;
}

export interface FsReadResult {
  content: string;
}

export interface FsWriteParams {
  path: string;
  content: string;
}

export interface FsListParams {
  path: string;
}

export interface FsListResult {
  files: Array<{
    name: string;
    type: "file" | "directory" | "symlink";
    size?: number;
  }>;
}

export interface FsMkdirParams {
  path: string;
  recursive?: boolean;
}

export interface FsDeleteParams {
  path: string;
}

export interface ProcessStartParams {
  command: string;
  cwd?: string;
}

export interface ProcessStartResult {
  id: string;
  pid?: number;
  command: string;
  status: string;
}

export interface ProcessKillParams {
  processId: string;
}

export interface ProcessListResult {
  processes: Array<{
    id: string;
    pid?: number;
    command: string;
    status: string;
  }>;
}

// ============================================================
// Worker registration protocol
// ============================================================

export interface RegisterParams {
  sandboxId: string;
  token: string;
}

export interface RegisterResult {
  sandboxId: string;
}

// ============================================================
// Error codes
// ============================================================

export const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  WORKER_NOT_FOUND: -33001,
  WORKER_DISCONNECTED: -33002,
  EXECUTION_TIMEOUT: -33003,
} as const;
