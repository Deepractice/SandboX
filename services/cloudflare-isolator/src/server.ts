/**
 * Cloudflare Isolator Server
 * Local HTTP server that executes code using Docker
 * Can be compiled to binary with: bun build --compile
 */

interface ExecuteRequest {
  code: string;
  runtime: string;
  env?: Record<string, string>;
  timeout?: number;
}

const PORT = Number(process.env.PORT) || 8080;

Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", runtime: "bun" });
    }

    // Execute code
    if (url.pathname === "/execute" && request.method === "POST") {
      try {
        const body = (await request.json()) as ExecuteRequest;
        const result = await executeCode(body);
        return Response.json(result);
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`✓ Cloudflare Isolator Server listening on http://localhost:${PORT}`);

/**
 * Execute code using Docker
 */
async function executeCode(request: ExecuteRequest) {
  const { code, runtime, env = {}, timeout = 30000 } = request;
  const startTime = Date.now();

  // Build docker command
  const image = getDockerImage(runtime);
  const command = getCommand(runtime, code);

  // Build env args
  const envArgs = Object.entries(env).flatMap(([k, v]) => ["-e", `${k}=${v}`]);

  try {
    // Execute in Docker container
    const proc = Bun.spawn(
      [
        "docker",
        "run",
        "--rm",
        "-i",
        ...envArgs,
        "--network",
        "none", // No network access
        "--memory",
        "128m",
        "--cpus",
        "0.5",
        image,
        ...command,
      ],
      {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    // Wait for completion with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        proc.kill();
        reject(new Error("Timeout"));
      }, timeout);
    });

    await Promise.race([proc.exited, timeoutPromise]);

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    return {
      success: proc.exitCode === 0,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: proc.exitCode || 0,
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Timeout") {
      return {
        success: false,
        error: `Execution timed out after ${timeout}ms`,
        exitCode: -1,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    }
    throw error;
  }
}

function getDockerImage(runtime: string): string {
  switch (runtime) {
    case "node":
      return "node:22-alpine";
    case "python":
      return "python:3.11-alpine";
    case "bash":
      return "alpine:latest";
    default:
      return "node:22-alpine";
  }
}

function getCommand(runtime: string, code: string): string[] {
  switch (runtime) {
    case "node":
      return ["node", "--eval", code];
    case "python":
      return ["python3", "-c", code];
    case "bash":
      return ["sh", "-c", code];
    default:
      return ["node", "--eval", code];
  }
}
