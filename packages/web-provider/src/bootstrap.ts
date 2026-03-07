/**
 * Bootstrap entry point for web sandboxes.
 *
 * This script is loaded as a standalone bundle in a hidden iframe.
 * It auto-reads connection params from the URL, boots WebContainer,
 * and connects sandbox-client to the Bridge DO.
 *
 * URL format: /webcontainer/:sandboxId?token=xxx
 * The wsUrl is derived from the page's own origin.
 */

import { createSandboxClient } from "@sandboxxjs/core";
import { WebContainerProvider } from "./web-container-provider";

async function main() {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const sandboxId = pathParts[pathParts.length - 1];
  const token = url.searchParams.get("token");

  if (!sandboxId || !token) {
    console.error("[webcontainer] Missing sandboxId or token in URL");
    return;
  }

  const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${url.host}/ws?sandboxId=${sandboxId}&token=${token}&userId=bootstrap`;

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
