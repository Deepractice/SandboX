/**
 * Sandbox Protocol — JSON-RPC 2.0 based communication.
 *
 * All three roles (Client, Broker, Worker) speak this protocol.
 * Methods map 1:1 to the Sandbox interface.
 */

import {
  ErrorCodes as BaseErrorCodes,
  type RpcProtocol,
} from "@deepracticex/rpc";

// ============================================================
// JSON-RPC 2.0 base types (re-export with SandboX-specific shapes)
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
// Error codes — standard + sandbox-specific
// ============================================================

export const ErrorCodes = {
  ...BaseErrorCodes,
  // Sandbox-specific
  WORKER_NOT_FOUND: -33001,
  WORKER_DISCONNECTED: -33002,
  EXECUTION_TIMEOUT: -33003,
} as const;

// ============================================================
// RPC Protocol export
// ============================================================

export const protocol: RpcProtocol = {
  namespace: "sandbox",
  version: "2.4.0",
  methods: [
    { name: "exec.run", description: "Execute a command and return stdout/stderr" },
    { name: "process.start", description: "Start a background process" },
    { name: "process.kill", description: "Kill a running process" },
    { name: "process.list", description: "List all running processes" },
    { name: "fs.read", description: "Read file content" },
    { name: "fs.write", description: "Write content to file" },
    { name: "fs.list", description: "List directory contents" },
    { name: "fs.mkdir", description: "Create directory" },
    { name: "fs.delete", description: "Delete file/directory" },
    { name: "sandbox.destroy", description: "Destroy the sandbox instance" },
  ],
};
