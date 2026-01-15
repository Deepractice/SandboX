/**
 * Cloudflare Worker for SandboX execution
 * Receives code execution requests and runs them in Containers
 */

import { Container, getContainer } from "@cloudflare/containers";

export class SandboxContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "5m";
}

interface ExecuteRequest {
  code: string;
  runtime: string;
  env?: Record<string, string>;
  timeout?: number;
}

interface Env {
  SANDBOX_CONTAINER: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Execute code
    if (url.pathname === "/execute" && request.method === "POST") {
      try {
        const body = (await request.json()) as ExecuteRequest;
        const sessionId = url.searchParams.get("session") || "default";

        // Get container instance
        const container = getContainer(env.SANDBOX_CONTAINER, sessionId);

        // Forward execution request to container
        const response = await container.fetch(
          new Request("http://container/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        );

        return response;
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
