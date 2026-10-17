# dsh-mounts

> DeepSeek Harness 侧栏里的「**挂载清单**」面板 —— 一眼看清这个 profile 到底挂了什么。

在 DSH 里，"我挂了什么"散落在五个地方：预规定、记忆库、技能、MCP、智能体预设。
这个面板把它们摊在同一页，**纯只读**，默认全部折叠，想看哪块点哪块。

---

## 长什么样

```
┌──────────────────────────────────────────────────────────────────┐
│  挂载清单                                        [只读]   [刷新]  │
│  这个 profile 实际挂载了什么：记忆链、技能、MCP 与 Agent Preset    │
├──────────────────────────────────────────────────────────────────┤
│  ▸ 预规定                                                    2   │
│  ▸ 记忆库                                    6 个库 · 34 个文件  │
│  ▸ 技能                                                      7   │
│  ▸ MCP 服务器                                                3   │
│  ▸ 智能体预设                                                5   │
└──────────────────────────────────────────────────────────────────┘
```

展开「记忆库」，再点开其中一个库：

```
  ▾ 记忆库                                       6 个库 · 34 个文件
     ▾ my-app · 14 个文件                         2026-10-16
         MEMORY.md                     6.7 KB · 2026-10-16   [打开]
         overview.md                  12.9 KB · 2026-10-17   [打开]
         …
     ▸ another-project · 9 个文件                          2026-10-06
     ▸ …
```

> 这是示意图，**数据为示例**。仓库**不附真实截图**——面板会显示本机绝对路径、用户名、目录结构，
> 截图等于把本机环境公开一遍。

---

## 五块内容

| 块 | 说明 |
|---|---|
| **预规定** | 全局 `~/.dsh/AGENTS.md` + 项目根到 cwd 链上的 `AGENTS.md` / `CLAUDE.md` / `AGENTS.local.md` / `CLAUDE.local.md` |
| **记忆库** | `~/.zcode/cli/memories/projects/*/memory/` 下的独立记忆库，每个库一个列表。**DSH 不读取这些文件**，这里只是清单 |
| **技能** | 四个扫描根：项目 `.dsh/skills` → 项目 `.agents/skills` → 用户 `~/.dsh/skills` → 用户 `~/.agents/skills` |
| **MCP 服务器** | profile 补丁里的 `dsh-mcp-client` 行：serverName、transport、命令或 URL、env 变量名 |
| **智能体预设** | profile 定义的预设 + 内置的 `standard / ptc / minimal / cordis`，标出「当前」与「部署默认」 |

## 折叠与详情

- 打开面板时五块**全部折叠**，只显示标题行
- 点块标题 → 展开该块的条目
- 点条目 → 展开它**自己的字段**：章节标题 / 完整描述与路径 / 补丁行与 env / 目标
- 「记忆库」多一层：点库标头 → 文件列表；每个文件带「**打开**」，用系统默认程序打开，
  拿不到 Remote 时降级为「复制路径」

所有展开都只显示该条目自身的信息，**不会去索引别处的文件**。

---

## 安装

> 也可以用 GitHub 的 **Download ZIP** 解开，效果一样——不依赖 npm。

推荐走 DSH 官方路径（需要 **Creator 模式 / `cordis` preset**，只有它有 `plugin_manager`）：

1. 把本仓库放到任意工作区
2. 用 `plugin_manager` 的 `install_bundle`，`target` 指向本包目录的**绝对路径**
3. 读返回的 `application` 和 `warnings` 确认结果

> ⛔ **不要**手工改 profile 的 `package.json` / `cordis.patch.yml`，也不要在 profile 目录跑 pnpm —— 官方指南明确禁止，`install_bundle` 会处理这些。

改完客户端代码**硬刷新页面**（Ctrl+Shift+R）；改 Host 代码用 `plugin_manager` 把 `include:mounts-panel` 关→开重新 import。

---

## 安全

本插件是**只读查看器**，设计上刻意收窄了攻击面：

- **不写文件**、**不 spawn 进程**、**不发起出站网络请求**
- 唯一 HTTP 端点是 `GET /dsh-mounts/api`：
  - 只允许 loopback `Host` 头（`127.0.0.1` / `localhost` / `[::1]`），其余一律 **403**（防 DNS rebinding）
  - 只接受 **GET / HEAD**，其余 **405**
  - `Cache-Control: no-store`
  - 自定义的 `cwd` 参数被**移除**，不会变成任意目录探测器
- **不返回任何文件内容**：记忆库只做 `stat`（文件名、大小、修改时间），技能只取 frontmatter 的 description
- 「打开」动作**不自建端点**：走 DSH 现成的 Session Remote（`remote.session.openWorkspacePath`），
  由 Host 侧用组合文件系统复核路径；Remote 不可用时自动降级为「复制路径」

---

## 已知限制

- **内置 Preset 只有名字**：定义在 bundle 里（`app.asar` 内），第三方插件读不了，所以只能列出 id，不能展开。
- **记忆库路径是写死的**：只认 `~/.zcode/cli/memories/projects/`，别的工具的记忆库不会被发现。
- **技能描述上限 400 字**：超过的会在末尾加「…」。
- **MCP 的 preset 列是推导的**：取「MCP 数 == 服务器总数」的唯一 preset，推不出来就留空。
  API 里没有 MCP→preset 的映射（要精确得在 Host 侧按补丁子树归属）。
- **工作区是猜测的**：取 workspace 注册表里 `updatedAt` 最新的一个，不是会话级精确绑定。
  切换工作区后可能显示的不是当前会话所在的那个。
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

- `client.js` 改动 → **硬刷新**（Ctrl+Shift+R）
- `index.js` 改动 → `plugin_manager` 把 `include:mounts-panel` 关→开
- 读盘文本一律先 `\r\n?` → `\n` 规范化：CRLF 的 `SKILL.md` 曾让 frontmatter 解析静默变空

---

## License

MIT
