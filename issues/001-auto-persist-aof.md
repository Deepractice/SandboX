# 001: Auto-Persist State with AOF Pattern

## 背景

当前 StateLog 支持录制操作，但需要用户手动保存。这不符合"开箱即用"的理念，也容易丢失数据。

## 当前问题

### 1. Sandbox 没有 ID

```typescript
const sandbox = createSandbox({ ... });
// sandbox.id → undefined ❌
```

用户无法识别和管理多个 sandbox 实例。

### 2. 需要手动保存（API 冗长）

```typescript
import { createStateStore } from "@sandboxxjs/state";

const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: { enableRecord: true },
});

// 执行操作
await sandbox.fs.write("config.json", "{}");

// 手动保存（用户需要自己管理 key）
const store = createStateStore({ type: "resourcex" });
const log = sandbox.getStateLog();
await store.saveLog("my-custom-key", log.toJSON()); // ❌ 冗长且易错
```

**问题：**

- 暴露了内部 API (`@sandboxxjs/state`, `StateStore`)
- 用户需要管理 key
- 忘记保存会丢失数据
- API 冗长（3 步操作）

### 3. 没有自动持久化

如果程序崩溃或忘记保存，所有状态丢失。

## 设计决策（2026-01-16 讨论确定）

### 决策 1：Sandbox ID

- **位置**：BaseSandbox 层，所有实例都有 ID
- **格式**：`sandbox-{nanoid}`，例如 `sandbox-V1StGXR8_Z5jdHi`
- **自定义**：暂不支持用户自定义 ID，全部自动生成

### 决策 2：Store 配置

- **简化**：`enableRecord: true` = 自动持久化（无需单独的 `autoPersist` 参数）
- **默认**：resourcex store（持久化到文件）
- **测试**：`store: "memory"` 用于测试场景

### 决策 3：AOF 追加实现

- **方案**：原生 `fs.appendFile` + JSON Lines 格式
- **路径**：ResourceX 负责路径解析（`~/.agentvm/sandbox/state-logs/`）
- **追加**：原生 fs 实现，不依赖 ResourceX 的写入能力

### 决策 4：listLogs 实现

- **方案**：原生 fs 读目录，和 append 配对
- **原因**：ResourceX 暂不支持 list 操作

### 决策 5：恢复机制

- **方案**：不内置 `restoreFrom`，用户自己处理恢复逻辑
- **API**：保持现有 `initializeLog` 参数
- **原因**：恢复数据源不一定是文件，用户自己决定

## 期望设计

### AOF (Append-Only File) 模式

参考 **Redis AOF**、**MySQL binlog**、**Dockerfile** 的设计：

```
每个写操作 → 立即追加到文件 → 异步写入，不阻塞
```

**用户 API（极简）：**

```typescript
import { createSandbox } from "sandboxxjs";

// 自动生成 ID，enableRecord = 自动持久化
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: {
    enableRecord: true, // 自动持久化到 resourcex
  },
});

console.log(sandbox.id); // "sandbox-V1StGXR8_Z5jdHi" ✅ 自动生成

// 每个操作自动追加到文件（JSON Lines 格式）
await sandbox.fs.write("config.json", "{}");
// → 自动追加：~/.agentvm/sandbox/state-logs/sandbox-V1StGXR8_Z5jdHi.jsonl
//   {"op":"fs.write","args":{"path":"config.json","data":"{}"}}

sandbox.env.set("KEY", "value");
// → 自动追加同一文件
//   {"op":"env.set","args":{"key":"KEY","value":"value"}}

// 不需要手动 save！崩溃也不会丢数据
```

**恢复（用户自己处理）：**

```typescript
import { loadStateLog } from "@sandboxxjs/state";

// 用户自己加载（从文件、数据库、API 等）
const json = await loadFromSomewhere();
const log = loadStateLog(json);

// 传入 initializeLog
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: {
    initializeLog: log,
  },
});

// 状态已恢复
const config = await sandbox.fs.read("config.json"); // "{}"
sandbox.env.get("KEY"); // "value"
```

## 技术方案

### 1. Sandbox ID 生成

```typescript
// packages/core/src/Sandbox.ts
import { nanoid } from "nanoid";

export class BaseSandbox implements ISandbox {
  public readonly id: string;

  constructor(config: SandboxConfig) {
    // 自动生成唯一 ID（不支持自定义）
    this.id = `sandbox-${nanoid()}`;
    // 示例：sandbox-V1StGXR8_Z5jdHi
  }
}
```

### 2. StateConfig 扩展

```typescript
export interface StateConfig {
  env?: Record<string, string>;
  initializeLog?: StateLog;
  enableRecord?: boolean;

  // 新增：store 类型（默认 resourcex，测试用 memory）
  store?: "resourcex" | "memory";
}
```

**说明**：

- `enableRecord: true` = 自动持久化（无需单独的 `autoPersist`）
- `store` 默认 `"resourcex"`，测试时可设为 `"memory"`
- 不添加 `restoreFrom`，用户自己处理恢复

### 3. createState 扩展

```typescript
export interface CreateStateOptions {
  sandbox: Sandbox;
  env?: Record<string, string>;
  enableRecord?: boolean;
  store?: "resourcex" | "memory";
  sandboxId: string; // Sandbox ID for persistence
}

export function createState(options: CreateStateOptions): StateResult {
  const { sandbox, enableRecord, store = "resourcex", sandboxId } = options;

  // 创建 store 实例
  const stateStore = createStateStore({ type: store });

  // ... 创建 base instances

  if (enableRecord) {
    const stateLog = buildStateLog();

    // Proxy 拦截时，异步追加到文件
    const recordingProxy = createRecordingProxy(base, namespace, stateLog, {
      onRecord: async (entry) => {
        // 异步追加（不阻塞主流程）
        stateStore.appendEntry(sandboxId, entry).catch((err) => {
          console.error(`[SandboX] Failed to persist entry:`, err);
        });
      },
    });

    return { fs, env, storage, stateLog };
  }
}
```

### 4. StateStore 新增方法

```typescript
export interface StateStore {
  // 现有
  saveLog(key: string, data: string): Promise<void>;
  loadLog(key: string): Promise<string | null>;
  deleteLog(key: string): Promise<void>;
  listLogs(): Promise<string[]>;

  // 新增
  appendEntry(sandboxId: string, entry: StateLogEntry): Promise<void>;
}
```

**appendEntry 实现（原生 fs + JSON Lines）：**

```typescript
import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";

// ResourceXStateStore
async appendEntry(sandboxId: string, entry: StateLogEntry): Promise<void> {
  const filePath = this.logPath(sandboxId); // ~/.agentvm/sandbox/state-logs/{id}.jsonl

  // 确保目录存在
  await mkdir(dirname(filePath), { recursive: true });

  // 追加一行 JSON（真正的 AOF）
  const line = JSON.stringify(entry) + "\n";
  await appendFile(filePath, line, "utf-8");
}

private logPath(sandboxId: string): string {
  return `${this.basePath}/state-logs/${sandboxId}.jsonl`;
}
```

**loadLog 更新（支持 JSON Lines）：**

```typescript
import { readFile } from "fs/promises";

async loadLog(key: string): Promise<string | null> {
  const filePath = this.logPath(key);
  try {
    const content = await readFile(filePath, "utf-8");
    // JSON Lines → JSON Array
    const entries = content
      .trim()
      .split("\n")
      .filter(line => line)
      .map(line => JSON.parse(line));
    return JSON.stringify(entries);
  } catch {
    return null;
  }
}
```

## 性能优化（可选，未来考虑）

当前方案使用 JSON Lines + `fs.appendFile`，已经是真正的 AOF，无需 read-modify-write。

如果未来遇到性能瓶颈，可考虑：

**批量写入：**

```typescript
// 每隔 100ms 或 10 条 flush 一次
class BufferedStateStore {
  private buffer: Map<string, StateLogEntry[]> = new Map();

  async appendEntry(sandboxId: string, entry: StateLogEntry) {
    const entries = this.buffer.get(sandboxId) ?? [];
    entries.push(entry);
    this.buffer.set(sandboxId, entries);
    this.scheduleFlush(sandboxId);
  }
}
```

## 实现步骤

### Phase 1: 基础设施

1. **Sandbox 添加 ID**
   - [ ] 安装 `nanoid` 依赖
   - [ ] 在 `BaseSandbox` 构造函数生成 ID（`sandbox-{nanoid}`）
   - [ ] 导出 `id` 属性
   - [ ] 更新类型定义

2. **StateConfig 扩展**
   - [ ] 添加 `store?: "resourcex" | "memory"` 配置

3. **StateStore 新增方法**
   - [ ] 添加 `appendEntry()` 方法（原生 fs + JSON Lines）
   - [ ] 更新 `loadLog()` 支持 JSON Lines 格式

4. **createState 集成**
   - [ ] 接收 `sandboxId` 和 `store` 参数
   - [ ] Proxy 录制时调用 `store.appendEntry()`

5. **withState 更新**
   - [ ] 传递 `sandbox.id` 和 `store` 配置给 createState

### Phase 2: 测试

6. **单元测试**
   - [ ] Sandbox ID 生成唯一性
   - [ ] StateStore.appendEntry() JSON Lines 格式
   - [ ] StateStore.loadLog() 解析 JSON Lines

7. **BDD 测试**
   - [ ] Sandbox 自动生成 ID
   - [ ] enableRecord 自动持久化

## 测试要求

### BDD 场景

```gherkin
@persistence @id
Scenario: Sandbox auto-generates unique ID
  Given I create a sandbox with state recording enabled
  Then the sandbox should have a unique ID
  And the ID should match pattern "sandbox-[a-zA-Z0-9_-]+"

@persistence @auto
Scenario: Auto-persist on every operation (enableRecord = autoPersist)
  Given I create a sandbox with enableRecord true
  When I write "data" to file "test.txt"
  And I set environment variable "KEY" to "value"
  Then the StateLog file should exist at "~/.agentvm/sandbox/state-logs/{id}.jsonl"
  And the file should contain 2 lines

@persistence @memory
Scenario: Memory store for testing
  Given I create a sandbox with store "memory"
  When I write "data" to file "test.txt"
  Then no file should be created on disk
  And the StateLog should still record the operation
```

### 单元测试

- Sandbox ID 生成唯一性测试
- `StateStore.appendEntry()` - JSON Lines 追加测试
- `StateStore.loadLog()` - JSON Lines 解析测试

## 参考实现

### Redis AOF

```
# appendonly.aof
SET key1 "value1"
SET key2 "value2"
DEL key1
```

每个命令追加到文件，重启时重放所有命令。

### Docker Image Layers

```dockerfile
FROM node:20
RUN npm install    # Layer 1
COPY . /app        # Layer 2
RUN npm build      # Layer 3
```

每个操作是独立的层，可以缓存和复用。

### SandboX StateLog (JSON Lines 格式)

```
{"op":"fs.write","args":{"path":"config.json","data":"{}"}}
{"op":"env.set","args":{"key":"NODE_ENV","value":"prod"}}
{"op":"storage.set","args":{"key":"version","value":"1.0.0"}}
```

每行一个 JSON 对象，支持真正的 append。

## API 设计总结

### 用户层 API（sandboxxjs）

```typescript
// 创建 - 自动 ID + enableRecord = 自动持久化
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: {
    enableRecord: true, // 自动持久化到 ~/.agentvm/sandbox/state-logs/{id}.jsonl
  },
});

console.log(sandbox.id); // "sandbox-V1StGXR8_Z5jdHi"

// 操作 - 自动追加到文件
await sandbox.fs.write("config.json", "{}");

// 恢复 - 用户自己处理
import { loadStateLog } from "@sandboxxjs/state";
const log = loadStateLog(jsonFromSomewhere);
const restored = createSandbox({
  isolator: "local",
  runtime: "node",
  state: { initializeLog: log },
});
```

### 底层 API（@sandboxxjs/state）

```typescript
// StateStore API
await store.appendEntry(sandboxId, entry); // AOF 追加
await store.loadLog(sandboxId); // 加载（支持 JSON Lines）
await store.saveLog(key, json); // 保存
await store.deleteLog(key); // 删除
```

## 相关文件

- `packages/core/src/Sandbox.ts` - 添加 ID
- `packages/core/src/types.ts` - 扩展 StateConfig（添加 store）
- `packages/state/src/StateStore.ts` - 添加 appendEntry，更新 loadLog
- `packages/state/src/createState.ts` - 集成 store 和 sandboxId
- `packages/core/src/mixins/withState.ts` - 传递 id 和 store 配置

## 成功标准

1. Sandbox 自动生成唯一 ID（`sandbox-{nanoid}`）
2. `enableRecord: true` 时，每个操作自动追加到 `.jsonl` 文件
3. `store: "memory"` 可用于测试（不写文件）
4. 所有 BDD 测试通过

## 未来工作（不在本 issue 范围）

- `listSandboxes()` - 涉及生命周期管理
- `restoreFrom` - 用户自己处理恢复
- 批量写入优化

---

**Status**: Open
**Priority**: High
**Labels**: enhancement, state, persistence, dx
**Assignee**: TBD
**Created**: 2026-01-16
**Updated**: 2026-01-16（设计决策讨论完成）
