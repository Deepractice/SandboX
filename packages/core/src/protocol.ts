/**
 * Sandbox protocol — WebSocket message types between sandbox-client and service.
 *
 * This protocol covers lifecycle steps 3-5:
 *   Register: client sends RegisterMessage, service responds RegisteredMessage
 *   Ready:    heartbeat keeps connection alive
 *   Command:  service sends commands, client returns results
 *
 * All sandbox-clients (cloud, web, future types) speak this same protocol.
 *
 * Lifecycle: Allocate → Prepare → Register → Ready → Command
 *                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */

// ==================== Client → Service ====================

export interface RegisterMessage {
  type: "register";
  sandboxId: string;
  token: string;
}

export interface ResultMessage {
  type: "result";
  id: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface FsResultMessage {
  type: "fs.result";
  id: string;
  data: unknown;
}

export interface ErrorMessage {
  type: "error";
  id: string;
  message: string;
}

export interface HeartbeatMessage {
  type: "heartbeat";
}

// ==================== Service → Client ====================

export interface ExecMessage {
  type: "exec";
  id: string;
  command: string;
  cwd?: string;
  timeout?: number;
}

export interface FsReadMessage {
  type: "fs.read";
  id: string;
  path: string;
}

export interface FsWriteMessage {
  type: "fs.write";
  id: string;
  path: string;
  content: string;
}

export interface FsListMessage {
  type: "fs.list";
  id: string;
  path: string;
}

export interface FsMkdirMessage {
  type: "fs.mkdir";
  id: string;
  path: string;
  recursive?: boolean;
}

export interface FsDeleteMessage {
  type: "fs.delete";
  id: string;
  path: string;
}

export interface ProcessStartMessage {
  type: "process.start";
  id: string;
  command: string;
  cwd?: string;
}

export interface ProcessKillMessage {
  type: "process.kill";
  id: string;
  processId: string;
}

export interface ProcessListMessage {
  type: "process.list";
  id: string;
}

export interface RegisteredMessage {
  type: "registered";
  sandboxId: string;
}

// ==================== Union types ====================

/** Messages sent from sandbox-client to service */
export type ClientMessage =
  | RegisterMessage
  | ResultMessage
  | FsResultMessage
  | ErrorMessage
  | HeartbeatMessage;

/** Messages sent from service to sandbox-client */
export type ServiceMessage =
  | ExecMessage
  | FsReadMessage
  | FsWriteMessage
  | FsListMessage
  | FsMkdirMessage
  | FsDeleteMessage
  | ProcessStartMessage
  | ProcessKillMessage
  | ProcessListMessage
  | RegisteredMessage;
