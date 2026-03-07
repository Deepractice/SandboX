/**
 * Bootstrap entry point for web sandboxes.
 *
 * This script is loaded as a standalone bundle in a hidden iframe.
 * It reads all connection params from URL search params, boots WebContainer,
 * and connects sandbox-client to the Bridge DO.
 *
 * URL format: /webcontainer/:sandboxId?wsUrl=wss://...&token=xxx
 * All connection info is provided by the server — bootstrap only consumes.
 */

import { createSandboxClient } from "@sandboxxjs/core";
import { WebContainerProvider } from "./web-container-provider";

async function main() {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const sandboxId = pathParts[pathParts.length - 1];
  const wsUrl = url.searchParams.get("wsUrl");
  const token = url.searchParams.get("token");

  if (!sandboxId || !wsUrl || !token) {
    console.error("[webcontainer] Missing sandboxId, wsUrl, or token in URL");
    return;
  }

  console.log(`[webcontainer] Booting sandbox ${sandboxId}...`);

  const provider = new WebContainerProvider();
  const client = createSandboxClient(provider);

  try {
    await client.connect({ wsUrl, sandboxId, token });
    console.log("[webcontainer] Connected to Bridge");
  } catch (err) {
    console.error("[webcontainer] Boot failed:", err);
  }
}

main();
