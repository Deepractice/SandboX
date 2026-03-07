/**
 * SandboxAllocator — provisions sandbox resources.
 *
 * Step 1 of the lifecycle: Allocate.
 *
 * The allocator creates a sandbox environment and returns a SandboxContainer
 * with status "pending". The sandbox is NOT ready for commands yet —
 * it becomes ready only after a sandbox-client connects and registers.
 *
 * Lifecycle: Allocate → Prepare → Register → Ready → Command
 *            ^^^^^^^^
 */

export type SandboxContainerType = "cloud" | "web";

export type SandboxStatus = "pending" | "ready" | "destroyed";

export interface SandboxContainer {
  id: string;
  type: SandboxContainerType;
  status: SandboxStatus;
  createdAt: number;
  source?: string;
  /** Connection info for sandbox-client to register */
  connection: {
    wsUrl: string;
    token: string;
  };
  /** Platform-specific extension data */
  metadata?: Record<string, unknown>;
}

export interface AllocateRequest {
  type?: SandboxContainerType;
  sandboxId?: string;
  source?: string;
}

export interface SandboxAllocator {
  /** Allocate a sandbox — returns container with status "pending" */
  allocate(request: AllocateRequest): Promise<SandboxContainer>;
  /** Release sandbox resources */
  deallocate(sandboxId: string): Promise<void>;
  /** List all sandboxes */
  list(): Promise<SandboxContainer[]>;
  /** Get a single sandbox by id */
  get(sandboxId: string): Promise<SandboxContainer | null>;
  /** Update sandbox status (called by registry on registration) */
  updateStatus(sandboxId: string, status: SandboxStatus): Promise<void>;
}
