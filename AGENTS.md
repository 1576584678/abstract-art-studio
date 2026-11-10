# AGENTS.md — abstract-art-studio

> 本文件供 AI 编码 Agent（Codex / Claude Code / Cursor / WorkBuddy 等）在本项目中工作时遵循。
> 产品需求与范围见同目录 `PRD.md`。

## 项目简介
纯前端、零后端的「上传图片 → 生成抽象画」工具。用户自带模型 API Key（BYOK），部署到 GitHub Pages。任何人可免费用，模型费用自担。

## 技术栈（推荐基线）
- 构建：**Vite + TypeScript**（strict 模式）
- UI：**React**（默认；Svelte 亦可，二选一）
- 样式：**CSS Modules**（默认，减少依赖；Tailwind 备选）
- 无后端、无数据库、无 SSR
- 部署：**GitHub Pages**（静态托管 `dist/`）

## 目录结构（建议）
```
src/
  adapters/      # Provider 适配层：replicate.ts / openaiCompatible.ts / stability.ts
  presets/       # 抽象风格预设（提示词 + 默认强度）
  components/    # UI 组件
  lib/           # 图片压缩、Key 加解密、storage 封装
  App.tsx
vite.config.ts
.github/workflows/deploy.yml   # Pages 自动部署
```

## 架构与关键约束
1. **纯前端**：所有逻辑在浏览器运行；不得引入服务端代码或环境变量 secrets。
2. **BYOK**：API Key 仅由用户配置，存于浏览器 localStorage（**必须加密**）。**严禁**将 Key 写入代码、URL、console、日志或提交到仓库。
3. **CORS 优先**：Provider 必须支持浏览器跨域直连；上线前务必用真实请求验证 CORS（见 PRD RK-01）。若不通，走 PRD v2 的 Cloudflare Worker 代理方案，不要偷偷加后端。
4. **隐私**：用户图片仅发送至用户配置的模型服务；不得上传到其他任何第三方；不得持久化用户图片。
5. **无状态**：不收集 PII；本地统计（生成次数等）不出端。

## 编码约定
- TypeScript strict 模式；提交 `package-lock.json`（依赖锁版本）。
- Provider 适配统一接口，屏蔽同步 / 异步差异：
  ```ts
  interface GenRequest { image: string; prompt: string; strength: number; model?: string; }
  interface GenResult { imageUrl?: string; imageBase64?: string; error?: string; }
  function generate(req: GenRequest): Promise<GenResult>;
  ```
- 所有用户输入（提示词、图像）不得 `eval` / `innerHTML` 注入；防 XSS。
- 输出契约（PRD FR-04 / AI 专项）：返回图像或明确错误，不得静默失败。

## 常用命令
- 安装：`npm install`
- 开发：`npm run dev`
- 构建：`npm run build`（输出 `dist/`）
- 预览：`npm run preview`
- 类型检查：`npm run typecheck`（即 `tsc --noEmit`）
- 测试：`npm test`（Vitest）

## 测试
- 单测（Vitest）：图片压缩、Key 加解密、Provider 适配层的请求 / 响应映射（用 mock `fetch`）。
- **不对接真实模型做 CI**；用 mock adapter 验证主流程。
- E2E（可选 Playwright）：上传 → 生成（mock）→ 下载 主流程。

## 安全红线（Agent 必须遵守）
- 绝不把用户 Key 或任何 secret 写入源码或打印。
- 不引入会外发用户数据的第三方脚本。
- 修改 Provider 适配时保持输出契约：返回图像或明确错误，不得静默失败 / 伪装成功。

## 不要做的事
- 不要添加后端服务 / 数据库 / 账号系统（除非 PRD v2 明确）。
- 不要假设某 Provider 一定支持 CORS，先验证。
- 不要为了让功能跑通而绕过 Key 本地存储 / 加密约束。
- 不要将用户图片发送至除用户所配置模型服务外的任何地址。
