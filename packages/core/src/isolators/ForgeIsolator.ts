/**
 * Forge Isolator - Executes code via HTTP calls to a Forge microVM gateway
 */

import { ExecutionError, FileSystemError } from "../errors.js";
import type {
	EvaluateResult,
	ExecuteResult,
	RuntimeType,
	ShellResult,
} from "../types.js";
import { Isolator, type IsolatorOptions } from "./Isolator.js";

export class ForgeIsolator extends Isolator {
	private readonly gatewayUrl: string;
	private sandboxId: string | null = null;

	constructor(runtime: RuntimeType, gatewayUrl = "http://127.0.0.1:3456") {
		super(runtime);
		this.gatewayUrl = gatewayUrl;
	}

	private async ensureSandbox(): Promise<string> {
		if (this.sandboxId) return this.sandboxId;

		const res = await fetch(`${this.gatewayUrl}/v1/sandbox`, {
			method: "POST",
		});
		if (!res.ok) {
			throw new ExecutionError(
				`failed to create forge sandbox: ${res.status} ${res.statusText}`,
			);
		}
		const body = (await res.json()) as { id: string };
		this.sandboxId = body.id;
		return this.sandboxId;
	}

	async shell(
		command: string,
		options: IsolatorOptions = {},
	): Promise<ShellResult> {
		const id = await this.ensureSandbox();
		const startTime = Date.now();

		const res = await fetch(`${this.gatewayUrl}/v1/sandbox/${id}/shell`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ command }),
			signal: options.timeout
				? AbortSignal.timeout(options.timeout)
				: undefined,
		});

		if (!res.ok) {
			throw new ExecutionError(
				`forge shell request failed: ${res.status} ${res.statusText}`,
			);
		}

		const result = (await res.json()) as ShellResult;
		return {
			...result,
			executionTime: result.executionTime ?? Date.now() - startTime,
		};
	}

	async execute(
		code: string,
		options: IsolatorOptions = {},
	): Promise<ExecuteResult> {
		const id = await this.ensureSandbox();
		const startTime = Date.now();

		const res = await fetch(`${this.gatewayUrl}/v1/sandbox/${id}/execute`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code, runtime: this.runtime }),
			signal: options.timeout
				? AbortSignal.timeout(options.timeout)
				: undefined,
		});

		if (!res.ok) {
			throw new ExecutionError(
				`forge execute request failed: ${res.status} ${res.statusText}`,
			);
		}

		const result = (await res.json()) as ExecuteResult;
		return {
			...result,
			executionTime: result.executionTime ?? Date.now() - startTime,
		};
	}

	async evaluate(
		expr: string,
		options: IsolatorOptions = {},
	): Promise<EvaluateResult> {
		const startTime = Date.now();
		let code: string;

		switch (this.runtime) {
			case "node":
				code = `console.log(${expr})`;
				break;
			case "python":
				code = `print(${expr})`;
				break;
			default:
				throw new ExecutionError(
					`unsupported runtime for evaluate: ${this.runtime}`,
				);
		}

		const result = await this.execute(code, options);

		if (!result.success) {
			throw new ExecutionError(
				result.stderr || `evaluation failed with exit code ${result.exitCode}`,
			);
		}

		return {
			value: result.stdout.trim(),
			executionTime: result.executionTime ?? Date.now() - startTime,
		};
	}

	async upload(data: Buffer, remotePath: string): Promise<void> {
		const id = await this.ensureSandbox();

		const res = await fetch(`${this.gatewayUrl}/v1/sandbox/${id}/upload`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: data.toString("base64"), path: remotePath }),
		});

		if (!res.ok) {
			throw new FileSystemError(
				`forge upload failed: ${res.status} ${res.statusText}`,
			);
		}
	}

	async download(remotePath: string): Promise<Buffer> {
		const id = await this.ensureSandbox();
		const url = `${this.gatewayUrl}/v1/sandbox/${id}/download?path=${encodeURIComponent(remotePath)}`;

		const res = await fetch(url);
		if (!res.ok) {
			throw new FileSystemError(
				`forge download failed: ${res.status} ${res.statusText}`,
			);
		}

		return Buffer.from(await res.arrayBuffer());
	}

	async destroy(): Promise<void> {
		if (!this.sandboxId) return;

		try {
			await fetch(`${this.gatewayUrl}/v1/sandbox/${this.sandboxId}`, {
				method: "DELETE",
			});
		} finally {
			this.sandboxId = null;
		}
	}
}
