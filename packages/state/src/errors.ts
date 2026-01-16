/**
 * Error types for @sandboxxjs/state
 */

export class StateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateError";
  }
}

export class FileSystemError extends StateError {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemError";
  }
}
