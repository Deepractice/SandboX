import { describe, expect, it, mock, afterEach } from "bun:test";
import { ExecutionError } from "../errors.js";
import { ForgeIsolator } from "./ForgeIsolator.js";

describe("ForgeIsolator", () => {
	const originalFetch = global.fetch;

	afterEach(() => {
		global.fetch = originalFetch;
	});

	describe("constructor", () => {
		it("constructor_noArgs_usesDefaultGatewayUrl", () => {
			const isolator = new ForgeIsolator("shell");
			expect((isolator as unknown as { gatewayUrl: string }).gatewayUrl).toBe(
				"http://127.0.0.1:3456",
			);
		});
	});

	describe("destroy", () => {
		it("destroy_noSandboxId_resolvesWithoutError", async () => {
			const isolator = new ForgeIsolator("shell");
			await expect(isolator.destroy()).resolves.toBeUndefined();
		});
	});

	describe("shell", () => {
		it("shell_gatewayUnavailable_throwsExecutionError", async () => {
			const isolator = new ForgeIsolator("shell", "http://127.0.0.1:19999");
			global.fetch = mock(() =>
				Promise.resolve(
					new Response(null, { status: 503, statusText: "Service Unavailable" }),
				),
			);

			await expect(isolator.shell("echo hello")).rejects.toThrow(ExecutionError);
		});
	});
});
