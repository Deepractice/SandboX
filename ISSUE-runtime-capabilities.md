# [RFC] SandboX 架构重设计：专业沙箱 + Mixin 组合

## 核心理念

### 1. 专业沙箱 vs 通用沙箱

**不做**：大而全的通用沙箱（给你一台云电脑，你自己装）
**要做**：小而精的专业沙箱（预构建好，开箱即用）

```
不是：  AI → 通用沙箱 → "我要装 pandas" → 等待 → 执行
而是：  AI → 找到 DataScienceSandbox → 直接执行
```

**原因**：

- 云服务要求：快、精、轻量
- 企业级要求：开箱即用、确定性强
- 成本考虑：预构建一次 vs 每次都装
- 未来：AI 可以创造新的专业沙箱

### 2. 基础沙箱 + Mixin 组合

```
基础 Sandbox（4 个核心 API）
     │
     │ + mixin
     ▼
┌─────────────┬─────────────┬─────────────┐
│  withFS     │ withExecute │  withXxx    │
│  文件操作   │  代码执行    │  其他能力   │
└─────────────┴─────────────┴─────────────┘
     │
     │ 组合
     ▼
NodeSandbox / PythonSandbox / CustomSandbox
```

---

## 一、基础 Sandbox API

最精简的核心能力：

```typescript
interface Sandbox {
  /**
   * 执行 shell 命令
   */
  shell(command: string): Promise<ShellResult>;

  /**
   * 上传文件到沙箱（主进程 → 沙箱）
   */
  upload(path: string, data: string | Buffer): Promise<void>;

  /**
   * 从沙箱下载文件（沙箱 → 主进程）
   */
  download(path: string): Promise<string | Buffer>;

  /**
   * 销毁沙箱
   */
  destroy(): Promise<void>;
}
```

### ShellResult

```typescript
interface ShellResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}
```

---

## 二、Mixin 能力扩展

### 2.1 FS 能力

```typescript
interface WithFS {
  fs: {
    read(path: string): Promise<string>;
    write(path: string, data: string): Promise<void>;
    list(path: string): Promise<string[]>;
    exists(path: string): Promise<boolean>;
    delete(path: string): Promise<void>;
  };
}

// Mixin 实现
function withFS<T extends new (...args: any[]) => Sandbox>(Base: T) {
  return class extends Base implements WithFS {
    fs = {
      read: async (path: string) => {
        /* ... */
      },
      write: async (path: string, data: string) => {
        /* ... */
      },
      list: async (path: string) => {
        /* ... */
      },
      exists: async (path: string) => {
        /* ... */
      },
      delete: async (path: string) => {
        /* ... */
      },
    };
  };
}
```

### 2.2 Execute 能力

```typescript
interface WithExecute {
  execute(code: string): Promise<ExecuteResult>;
}

// Node Execute Mixin
function withNodeExecute<T extends new (...args: any[]) => Sandbox>(Base: T) {
  return class extends Base implements WithExecute {
    async execute(code: string): Promise<ExecuteResult> {
      return this.shell(`node -e '${code}'`);
    }
  };
}

// Python Execute Mixin
function withPythonExecute<T extends new (...args: any[]) => Sandbox>(Base: T) {
  return class extends Base implements WithExecute {
    async execute(code: string): Promise<ExecuteResult> {
      return this.shell(`python -c '${code}'`);
    }
  };
}
```

---

## 三、特化沙箱组合

```typescript
// 基础沙箱
class BaseSandbox implements Sandbox {
  shell(cmd) {
    /* ... */
  }
  upload(path, data) {
    /* ... */
  }
  download(path) {
    /* ... */
  }
  destroy() {
    /* ... */
  }
}

// 组合出特化沙箱
const FSSandbox = withFS(BaseSandbox);
const NodeSandbox = withNodeExecute(withFS(BaseSandbox));
const PythonSandbox = withPythonExecute(withFS(BaseSandbox));

// 类型
type NodeSandbox = Sandbox & WithFS & WithExecute;
type PythonSandbox = Sandbox & WithFS & WithExecute;
type FSSandbox = Sandbox & WithFS;
```

---

## 四、配置结构

```typescript
interface SandboxConfig {
  // 隔离器类型（必填）
  isolator: "local" | "cloudflare" | "e2b" | "docker";

  // 运行时类型（默认 "shell"）
  runtime?: "shell" | "node" | "python";

  // 通用配置
  limits?: {
    timeout?: number;
    memory?: number;
    cpu?: number;
  };

  // Node 特化配置（当 runtime: "node" 时）
  node?: {
    packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  };

  // Python 特化配置（当 runtime: "python" 时）
  python?: {
    pythonVersion?: string;
    useVenv?: boolean;
  };
}
```

---

## 五、使用示例

### 基础沙箱

```typescript
const sandbox = createSandbox({ isolator: "local" });

// 只有 shell, upload, download, destroy
await sandbox.shell("echo hello");
await sandbox.upload("/tmp/data.txt", "hello");
const data = await sandbox.download("/tmp/data.txt");
await sandbox.destroy();
```

### Node 沙箱

```typescript
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
});

// 基础能力 + fs + execute
await sandbox.upload("/app/data.json", jsonData);
await sandbox.execute(`
  const data = require('/app/data.json');
  console.log(data);
`);
await sandbox.fs.write("/app/output.txt", "result");
const result = await sandbox.download("/app/output.txt");
await sandbox.destroy();
```

### Python 沙箱

```typescript
const sandbox = createSandbox({
  isolator: "local",
  runtime: "python",
});

await sandbox.upload("/data/input.csv", csvData);
await sandbox.execute(`
  import pandas as pd
  df = pd.read_csv('/data/input.csv')
  df.to_csv('/data/output.csv')
`);
const result = await sandbox.download("/data/output.csv");
await sandbox.destroy();
```

---

## 六、目录结构

```
packages/core/src/
├── Sandbox.ts              # 基础沙箱
├── mixins/                 # Mixin 能力
│   ├── withFS.ts
│   ├── withNodeExecute.ts
│   └── withPythonExecute.ts
├── isolators/              # 隔离器
│   ├── Isolator.ts
│   ├── LocalIsolator.ts
│   └── CloudflareIsolator.ts
├── types.ts
└── index.ts
```

---

## 七、实施计划

### Phase 1: 基础沙箱

- [ ] 重构 Sandbox 类，只保留 4 个核心 API
- [ ] 实现 shell()
- [ ] 实现 upload() / download()
- [ ] 实现 destroy()
- [ ] 更新 LocalIsolator

### Phase 2: Mixin 系统

- [ ] 实现 withFS mixin
- [ ] 实现 withNodeExecute mixin
- [ ] 实现 withPythonExecute mixin
- [ ] 类型定义

### Phase 3: createSandbox 工厂

- [ ] 根据 runtime 配置自动组合 mixin
- [ ] 返回正确的类型

### Phase 4: 测试

- [ ] 更新 BDD 测试
- [ ] 添加 mixin 组合测试

---

## 八、设计优势

1. **极简核心**：基础沙箱只有 4 个 API
2. **按需组合**：能力通过 mixin 自由组合
3. **类型安全**：TypeScript mixin 提供完整类型支持
4. **易于扩展**：新能力只需新 mixin
5. **专业沙箱**：预构建、开箱即用

---

**Created**: 2025-01-15
**Status**: RFC (Request for Comments)
**Labels**: `architecture`, `breaking-change`, `enhancement`
