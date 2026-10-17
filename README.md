# dsh-mounts

> DeepSeek Harness 侧栏里的「**挂载清单**」面板 —— 一眼看清这个 profile 到底挂了什么。

在 DSH 里，"我挂了什么"散落在四处：预规定、技能、MCP、Agent Preset。
这个面板把它们摊在一屏，**纯只读**，三层可展开。

---

## 长什么样

```
┌──────────────────────────────────────────────────────────────────┐
│  挂载清单                                        [只读]   [刷新]  │
│  这个 profile 实际挂载了什么：记忆链、技能、MCP 与 Agent Preset    │
├──────────────────────────────────────────────────────────────────┤
│  ▾ 预规定 / 记忆                                            2    │
│     ✓ ~/.dsh/AGENTS.md                          4.2 KB ·  6 节   │
│     ✓ AGENTS.local.md                           3.1 KB ·  4 节   │
│  ▸ 技能                                                     7    │
│  ▸ MCP 服务器                                               3    │
│  ▸ Agent Preset                                             1    │
└──────────────────────────────────────────────────────────────────┘
```

> 这是示意图，**数据为示例**。仓库**不附真实截图**——面板会显示本机绝对路径、用户名、目录结构，
> 截图等于把本机环境公开一遍。

---

## 四块内容

| 块 | 说明 |
|---|---|
| **预规定 / 记忆** | 全局 `~/.dsh/AGENTS.md` + 项目根到 cwd 链上的 `AGENTS.md` / `CLAUDE.md` / `AGENTS.local.md` / `CLAUDE.local.md`，各自的 `##` 章节标题 |
| **技能** | 四个扫描根（项目 `.dsh/skills` → 项目 `.agents/skills` → 用户 `~/.dsh/skills` → 用户 `~/.agents/skills`），每条含大小、来源、详情里的完整描述与路径；**还会列出技能正文提到的外部路径**（标注"未注入，需手动读取"） |
| **MCP 服务器** | profile 补丁里的 `dsh-mcp-client` 行：serverName、transport、命令或 URL、env 变量名 |
| **Agent Preset** | profile 里定义的预设 + 注册表的 `default` / `selectedDefault` |

## 三层展开

    L1  四块摘要（一屏放得下）
    L2  块内条目（点块标题展开）
    L3  条目详情（点条目展开）

技能的外部路径可以继续展开成**文件列表**（名字 + 大小 + 修改时间），每个文件带一个「**打开**」按钮，
用系统默认程序打开；目录则在资源管理器里打开。

---

## 安装

> 也可以用 GitHub 的 **Download ZIP** 解开，效果一样——不依赖 npm。

推荐走 DSH 官方路径（需要 **Creator 模式 / `cordis` preset**，只有它有 `plugin_manager`）：

1. 把本仓库放到任意工作区
2. 用 `plugin_manager` 的 `install_bundle`，`target` 指向本包目录的**绝对路径**
3. 读返回的 `application` 和 `warnings` 确认结果

> ⛔ **不要**手工改 profile 的 `package.json` / `cordis.patch.yml`，也不要在 profile 目录跑 pnpm —— 官方指南明确禁止，`install_bundle` 会处理这些。

改完客户端代码**刷新页面**即可；改 Host 代码用 `plugin_manager` 把 `include:mounts-panel` 关→开重新 import。

---

## 安全

本插件是**只读查看器**，设计上刻意收窄了攻击面：

- **不写文件**、**不 spawn 进程**、**不发起出站网络请求**
- 唯一 HTTP 端点是 `GET /dsh-mounts/api`：
  - 只允许 loopback `Host` 头（`127.0.0.1` / `localhost` / `[::1]`），其余一律 **403**（防 DNS rebinding）
  - 只接受 **GET / HEAD**，其余 **405**
  - `Cache-Control: no-store`
  - 自定义的 `cwd` 参数被**移除**，不会变成任意目录探测器
- **不返回任何文件内容**，只返回路径与元数据（文件名、大小、时间）
- 「打开」动作**不自建端点**：走 DSH 现成的 Session Remote（`remote.session.openWorkspacePath`），由 Host 侧用组合文件系统复核路径；Remote 不可用时自动降级为「复制路径」

---

## 已知限制

- **内置 Preset 只显示名字**：它们定义在 bundle 里（`app.asar` 内），第三方插件无法读取，所以只列出 `standard / ptc / minimal / cordis`。
- **MCP 的 preset 列是推导的**：取「MCP 数 == 服务器总数」的唯一 preset，推不出来就留空。API 里没有 MCP→preset 的映射（要精确得在 Host 侧按补丁子树归属）。
- **工作区是猜测的**：取 workspace 注册表里 `updatedAt` 最新的一个，不是会话级精确绑定。切换工作区后可能显示的不是当前会话所在的那个。
- **「打开」依赖 Session Remote**：在拿不到 Remote 的部署里会显示「复制路径」。

---

## 兼容性

- DSH **>= 0.2.1-rc.2**
- Client 侧依赖：`remote` / `remote.session` / `connection` / `locale`
- Windows 优先（路径与打开行为按 Windows 验证）；其余平台未测试

---

## 开发

    dsh-mounts/
      package.json       包清单 + dsh.bundle + dsh.client
      cordis.patch.yml   一行 insert：mounts-panel
      index.js           Host 半边：只读扫描 + GET /dsh-mounts/api
      client.js          Web 半边：侧栏一级面板 + main keyed 槽
      locale/{zh,en}.json
      icon.svg

- `client.js` 改动 → 刷新页面
- `index.js` 改动 → `plugin_manager` 把 `include:mounts-panel` 关→开
- 读盘文本一律先 `\r\n?` → `\n` 规范化：CRLF 的 `SKILL.md` 曾让 frontmatter 解析静默变空

---

## License

MIT
