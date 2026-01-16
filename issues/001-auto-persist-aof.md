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

## 期望设计

### AOF (Append-Only File) 模式

参考 **Redis AOF**、**MySQL binlog**、**Dockerfile** 的设计：

```
每个写操作 → 立即追加到文件 → 异步写入，不阻塞
```

**用户 API（极简）：**

```typescript
import { createSandbox } from "sandboxxjs";

// 自动生成 ID，自动持久化
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: {
    enableRecord: true,
    autoPersist: true, // 自动持久化
  },
});

console.log(sandbox.id); // "sandbox-abc123" ✅ 自动生成

// 每个操作自动追加到文件
await sandbox.fs.write("config.json", "{}");
// → 自动追加：~/.deepractice/sandbox/state-logs/sandbox-abc123.json
//   [{"op":"fs.write","args":{"path":"config.json","data":"{}"}}]

sandbox.env.set("KEY", "value");
// → 自动追加同一文件
//   [{"op":"fs.write",...},{"op":"env.set","args":{"key":"KEY","value":"value"}}]

// 不需要手动 save！崩溃也不会丢数据
```

**恢复（通过 ID）：**

```typescript
// 列出所有 sandbox
const sandboxes = await listSandboxes();
// → ["sandbox-abc123", "sandbox-def456"]

// 从 ID 恢复
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: {
    restoreFrom: "sandbox-abc123", // 自动加载 StateLog
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
export class BaseSandbox implements ISandbox {
  public readonly id: string;

  constructor(config: SandboxConfig) {
    // 生成唯一 ID
    this.id = config.id ?? `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // 示例：sandbox-1737019200000-a7b3c9
  }
}
```

### 2. 自动持久化机制

**Config 扩展：**

```typescript
export interface StateConfig {
  env?: Record<string, string>;
  initializeLog?: StateLog;
  enableRecord?: boolean;

  // 新增
  autoPersist?: boolean; // 自动持久化
  restoreFrom?: string; // 从 ID 恢复
}
```

**createState 扩展：**

```typescript
export interface CreateStateOptions {
  sandbox: Sandbox;
  env?: Record<string, string>;
  enableRecord?: boolean;

  // 新增
  autoPersist?: boolean;
  sandboxId?: string; // Sandbox ID for persistence
}

export function createState(options: CreateStateOptions): StateResult {
  const { sandbox, enableRecord, autoPersist, sandboxId } = options;

  // 如果开启自动持久化，创建 store
  let store: StateStore | undefined;
  if (autoPersist) {
    store = createStateStore({ type: "resourcex" });
  }

  // ... 创建 base instances

  if (enableRecord) {
    const stateLog = buildStateLog();

    // Proxy 拦截时，同时异步追加到文件
    const recordingProxy = createRecordingProxy(base, namespace, stateLog, {
      onRecord:
        autoPersist && store && sandboxId
          ? async (entry) => {
              // 异步追加到文件（不阻塞）
              await store.appendEntry(sandboxId, entry).catch((err) => {
                console.error(`[SandboX] Failed to persist entry:`, err);
              });
            }
          : undefined,
    });

    return { fs, env, storage, stateLog };
  }
}
```

### 3. StateStore 新增 append 方法

```typescript
export interface StateStore {
  // 现有
  saveLog(key: string, data: string): Promise<void>;
  loadLog(key: string): Promise<string | null>;
  deleteLog(key: string): Promise<void>;
  listLogs(): Promise<string[]>;

  // 新增
  appendEntry(sandboxId: string, entry: StateLogEntry): Promise<void>;
  save(sandbox: Sandbox): Promise<void>; // 高层 API
}
```

**appendEntry 实现（AOF）：**

```typescript
async appendEntry(sandboxId: string, entry: StateLogEntry): Promise<void> {
  const logUrl = this.logUrl(sandboxId);

  // 读取现有内容
  let entries: StateLogEntry[] = [];
  try {
    const exists = await this.rx.exists(logUrl);
    if (exists) {
      const resource = await this.rx.resolve(logUrl);
      entries = JSON.parse(resource.content as string);
    }
  } catch {
    // 文件不存在，从空开始
  }

  // 追加新 entry
  entries.push(entry);

  // 写回文件
  await this.rx.deposit(logUrl, JSON.stringify(entries));
}
```

**save 高层 API：**

```typescript
async save(sandbox: Sandbox): Promise<void> {
  const log = (sandbox as any).getStateLog?.();
  if (!log) {
    throw new Error("Sandbox does not support state recording");
  }
  await this.saveLog(sandbox.id, log.toJSON());
}
```

### 4. restoreFrom 实现

```typescript
// packages/core/src/mixins/withState.ts
constructor(config: SandboxConfig) {
  super(config);

  const stateConfig = config.state;

  // 如果指定 restoreFrom，自动加载
  if (stateConfig?.restoreFrom) {
    const store = createStateStore({ type: "resourcex" });
    const json = await store.loadLog(stateConfig.restoreFrom);
    if (json) {
      stateConfig.initializeLog = loadStateLog(json);
    }
  }

  // ... 后续逻辑
}
```

### 5. listSandboxes 工具函数

```typescript
// packages/sandboxxjs/src/index.ts
export async function listSandboxes(): Promise<string[]> {
  const store = createStateStore({ type: "resourcex" });
  return await store.listLogs();
}
```

## 性能优化（可选）

### 问题：每次 append 都 read-modify-write

**优化方案 A - 批量写入：**

```typescript
// 每隔 1s 或 100 条 flush 一次
class BufferedStateStore {
  private buffer: Map<string, StateLogEntry[]> = new Map();

  async appendEntry(sandboxId: string, entry: StateLogEntry) {
    // 加入缓冲区
    const entries = this.buffer.get(sandboxId) ?? [];
    entries.push(entry);
    this.buffer.set(sandboxId, entries);

    // 定时或达到阈值时 flush
    this.scheduleFlush(sandboxId);
  }
}
```

**优化方案 B - 使用 ResourceX list + append：**

等 ResourceX 支持 `append()` 操作后直接追加。

## 实现步骤

### Phase 1: 基础设施（必须）

1. **Sandbox 添加 ID**
   - [ ] 在 `BaseSandbox` 构造函数生成 ID
   - [ ] 支持 `config.id` 自定义 ID
   - [ ] 导出 `id` 属性

2. **StateStore 高层 API**
   - [ ] 添加 `save(sandbox)` 方法
   - [ ] 添加 `load(id)` 返回 StateLog
   - [ ] 添加 `listSandboxes()` 工具函数

3. **测试**
   - [ ] 单元测试：Sandbox ID 生成
   - [ ] BDD 测试：使用 sandbox.id 保存/恢复

### Phase 2: 自动持久化（推荐）

4. **Config 扩展**
   - [ ] 添加 `state.autoPersist` 配置
   - [ ] 添加 `state.restoreFrom` 配置

5. **AOF 追加**
   - [ ] StateStore 添加 `appendEntry()` 方法
   - [ ] createState 集成 store（传入 sandboxId）
   - [ ] Proxy 录制时自动追加到文件

6. **restoreFrom 实现**
   - [ ] withState 构造时检查 `restoreFrom`
   - [ ] 自动从 store 加载 StateLog

7. **测试**
   - [ ] 单元测试：appendEntry AOF
   - [ ] BDD 测试：autoPersist 自动保存
   - [ ] BDD 测试：restoreFrom 自动恢复

### Phase 3: 性能优化（可选）

8. **批量写入**
   - [ ] 实现 BufferedStateStore
   - [ ] 配置 flush 策略（时间间隔、条目数）

## 测试要求

### BDD 场景（必须）

```gherkin
@persistence @auto
Scenario: Sandbox auto-generates unique ID
  Given I create a sandbox with state recording enabled
  Then the sandbox should have a unique ID
  And the ID should start with "sandbox-"

@persistence @auto
Scenario: Auto-persist on every operation
  Given I create a sandbox with auto-persist enabled
  When I write "data" to file "test.txt"
  And I set environment variable "KEY" to "value"
  Then the StateLog file should exist at "~/.deepractice/sandbox/state-logs/{id}.json"
  And the file should contain 2 entries

@persistence @restore
Scenario: Restore from sandbox ID
  Given I create a sandbox with auto-persist enabled
  And I write "original" to file "data.txt"
  And I save the sandbox ID
  When I destroy the sandbox
  And I create a new sandbox with restoreFrom the saved ID
  Then file "data.txt" should exist
  And the file content should be "original"

@persistence @list
Scenario: List all sandboxes
  Given I create 3 sandboxes with auto-persist
  When I list all sandboxes
  Then the list should contain 3 sandbox IDs
```

### 单元测试（必须）

- `StateStore.appendEntry()` - AOF 追加测试
- `StateStore.save(sandbox)` - 高层 API 测试
- Sandbox ID 生成唯一性测试

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

### SandboX StateLog (当前)

```json
[
  { "op": "fs.write", "args": { "path": "config.json", "data": "{}" } },
  { "op": "env.set", "args": { "key": "NODE_ENV", "value": "prod" } },
  { "op": "storage.set", "args": { "key": "version", "value": "1.0.0" } }
]
```

已经是 binlog 格式，只差自动追加。

## API 设计总结

### 用户层 API（sandboxxjs）

```typescript
// 创建 - 自动 ID + 自动持久化
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: {
    autoPersist: true,
  },
});

console.log(sandbox.id); // "sandbox-1737019200-a7b3c9"

// 操作 - 自动追加到文件
await sandbox.fs.write("config.json", "{}");

// 恢复 - 通过 ID
const restored = createSandbox({
  isolator: "local",
  runtime: "node",
  state: {
    restoreFrom: "sandbox-1737019200-a7b3c9",
  },
});

// 列出所有 sandbox
import { listSandboxes } from "sandboxxjs";
const ids = await listSandboxes(); // ["sandbox-...", ...]
```

### 底层 API（@sandboxxjs/state，可选使用）

```typescript
// 高层 API
await store.save(sandbox);
const log = await store.load(sandboxId);

// 底层 API（已有）
await store.saveLog(key, json);
await store.appendEntry(sandboxId, entry);
```

## 实现优先级

| Phase   | 功能                | 优先级 | 理由                   |
| ------- | ------------------- | ------ | ---------------------- |
| Phase 1 | Sandbox ID          | **高** | 基础设施，必须先有     |
| Phase 1 | StateStore 高层 API | **高** | 简化用户体验           |
| Phase 2 | autoPersist (AOF)   | **中** | 核心功能，但可以先手动 |
| Phase 2 | restoreFrom         | **中** | 配合 autoPersist       |
| Phase 3 | 批量优化            | **低** | 性能优化，先跑通再说   |

**建议：** 先实现 Phase 1（Sandbox ID + 高层 API），再考虑 Phase 2（自动持久化）。

## 技术细节

### 异步追加不阻塞

```typescript
// 录制时异步写入，不影响主流程
proxy.set = (...args) => {
  const result = base.set(...args);

  // 异步追加（catch 错误但不抛出）
  if (autoPersist) {
    store.appendEntry(sandboxId, entry).catch((err) => {
      console.error(`[SandboX] Persist failed:`, err);
    });
  }

  return result;
};
```

### 文件格式（JSON Lines 可选）

当前：单个 JSON 数组

```json
[{"op":"fs.write",...},{"op":"env.set",...}]
```

可选：JSON Lines（每行一个 entry，真正的 AOF）

```
{"op":"fs.write",...}
{"op":"env.set",...}
```

**优点：**

- 追加更高效（不需要 parse 整个文件）
- 支持超大文件

**缺点：**

- 不是标准 JSON（需要专门解析）

**建议：** Phase 1 用 JSON 数组，Phase 3 优化时考虑 JSON Lines。

## 相关文件

- `packages/core/src/Sandbox.ts` - 添加 ID
- `packages/core/src/types.ts` - 扩展 StateConfig
- `packages/state/src/StateStore.ts` - 添加 append 和高层 API
- `packages/state/src/createState.ts` - 集成 autoPersist
- `packages/sandboxxjs/src/index.ts` - 导出 listSandboxes

## 成功标准

1. 用户无需了解 `@sandboxxjs/state` 就能使用持久化
2. Sandbox 自动生成唯一 ID
3. `autoPersist: true` 时，每个操作自动保存到文件
4. `restoreFrom: id` 时，自动恢复状态
5. 所有 BDD 测试通过

---

**Status**: Open
**Priority**: High
**Labels**: enhancement, state, persistence, dx
**Assignee**: TBD
**Created**: 2026-01-16
