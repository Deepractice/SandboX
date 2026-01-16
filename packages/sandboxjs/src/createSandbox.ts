/**
 * Factory function for creating Sandbox instances
 */

import {
  BaseSandbox,
  withFS,
  withNodeExecute,
  withPythonExecute,
  type SandboxConfig,
  type Sandbox,
  type NodeSandbox,
  type PythonSandbox,
} from "@sandboxxjs/core";

/**
 * Create sandbox based on config
 * - runtime: "shell" -> BaseSandbox (4 core APIs)
 * - runtime: "node" -> NodeSandbox (+ fs + execute)
 * - runtime: "python" -> PythonSandbox (+ fs + execute)
 */

export function createSandbox(config: SandboxConfig & { runtime: "node" }): NodeSandbox;
export function createSandbox(config: SandboxConfig & { runtime: "python" }): PythonSandbox;
export function createSandbox(config: SandboxConfig): Sandbox;

export function createSandbox(config: SandboxConfig): Sandbox | NodeSandbox | PythonSandbox {
  const runtime = config.runtime || "shell";

  switch (runtime) {
    case "node": {
      const NodeSandbox = withNodeExecute(withFS(BaseSandbox));
      return new NodeSandbox(config);
    }
    case "python": {
      const PythonSandbox = withPythonExecute(withFS(BaseSandbox));
      return new PythonSandbox(config);
    }
    default: {
      return new BaseSandbox(config);
    }
  }
}
