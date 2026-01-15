/**
 * Container executor - runs inside Docker container
 * Listens on port 8080 and executes code requests
 */

const http = require("http");
const { spawn } = require("child_process");

const PORT = 8080;

const server = http.createServer(async (req, res) => {
  if (req.url === "/execute" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { code, runtime, env = {} } = JSON.parse(body);

        // Build command based on runtime
        let command;
        switch (runtime) {
          case "node":
            command = ["node", "--eval", code];
            break;
          case "python":
            command = ["python3", "-c", code];
            break;
          case "bash":
            command = ["bash", "-c", code];
            break;
          default:
            throw new Error(`Unsupported runtime: ${runtime}`);
        }

        // Execute code
        const result = await executeCommand(command, env);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: result.exitCode === 0,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            metadata: {
              executionTime: result.duration,
              timestamp: new Date().toISOString(),
            },
          })
        );
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: error.message,
          })
        );
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

function executeCommand(command, env) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(command[0], command.slice(1), {
      env: { ...process.env, ...env },
      timeout: 30000,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0,
        duration: Date.now() - startTime,
      });
    });
  });
}

server.listen(PORT, () => {
  console.log(`Sandbox executor listening on port ${PORT}`);
});
