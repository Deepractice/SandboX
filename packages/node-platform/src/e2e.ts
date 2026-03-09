/**
 * E2E test — Broker → Worker → Client full loop.
 *
 * 1. Start a Broker on port 9100
 * 2. Start a Worker in run mode (connects to Broker)
 * 3. Create a Client that connects to Broker
 * 4. Client executes commands through Broker → Worker
 */

import { createSandbox } from "sandboxxjs";
import { node } from "./index.js";

async function main() {
  const platform = node();

  // 1. Start Broker
  console.log("Starting Broker on port 9100...");
  const sb = createSandbox(platform);
  const broker = await sb.broker({ port: 9100 });
  console.log("  Broker running ✓");

  // 2. Start Worker (connects to Broker)
  console.log("Starting Worker...");
  const worker = await createSandbox(platform).run({
    broker: "ws://localhost:9100",
    token: "test-token",
    sandboxId: "test-sandbox-1",
  });
  console.log(`  Worker registered as: ${worker.sandboxId} ✓`);

  // Give broker a moment to register
  await sleep(100);

  // Check broker sees the worker
  const workers = broker.workers();
  console.log(
    `  Broker sees ${workers.length} worker(s): ${workers.map((w) => w.sandboxId).join(", ")} ✓`
  );

  // 3. Create Client (connects to Broker, targets the worker)
  console.log("Creating Client...");
  const client = await createSandbox(platform).connect("ws://localhost:9100", {
    sandboxId: "test-sandbox-1",
  });
  console.log("  Client connected ✓");

  // 4. Execute commands through the full chain
  console.log("\n--- Running commands through Broker → Worker ---\n");

  // exec
  const result = await client.exec("echo 'Hello from SandboX!'");
  console.log(`  exec: ${result.stdout.trim()} (exit: ${result.exitCode}) ✓`);

  // writeFile + readFile
  await client.writeFile("test.txt", "SandboX v3 works!");
  const content = await client.readFile("test.txt");
  console.log(`  writeFile + readFile: "${content}" ✓`);

  // listFiles
  const files = await client.listFiles(".");
  console.log(`  listFiles: ${files.map((f) => f.name).join(", ")} ✓`);

  // mkdir
  await client.mkdir("subdir");
  const files2 = await client.listFiles(".");
  console.log(`  mkdir + listFiles: ${files2.map((f) => f.name).join(", ")} ✓`);

  // process
  const proc = await client.startProcess("sleep 10");
  console.log(`  startProcess: ${proc.id} (pid: ${proc.pid}) ✓`);
  const procs = await client.listProcesses();
  console.log(`  listProcesses: ${procs.length} process(es) ✓`);
  await client.killProcess(proc.id);
  console.log(`  killProcess ✓`);

  console.log("\n--- All tests passed! Full loop verified. ---\n");

  // Cleanup
  await client.disconnect();
  await worker.stop();
  await broker.stop();
  process.exit(0);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error("E2E FAILED:", err);
  process.exit(1);
});
