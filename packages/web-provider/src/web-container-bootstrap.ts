import type { SandboxBootstrap } from "@sandboxxjs/core";
import { WebContainer } from "@webcontainer/api";

export class WebContainerBootstrap implements SandboxBootstrap {
  private wc: WebContainer | null = null;

  async boot(): Promise<void> {
    this.wc = await WebContainer.boot({ coep: "credentialless" });
  }

  getContainer(): WebContainer {
    if (!this.wc) throw new Error("WebContainer not booted — call boot() first");
    return this.wc;
  }
}
