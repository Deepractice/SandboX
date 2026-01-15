/**
 * Error types for SandboX
 */

export class SandboxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxError";
  }
}

export class ExecutionError extends SandboxError {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionError";
  }
}

export class TimeoutError extends SandboxError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class IsolationError extends SandboxError {
  constructor(message: string) {
    super(message);
    this.name = "IsolationError";
  }
}

export class FileSystemError extends SandboxError {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemError";
  }
}
