# dsh-mounts

[![版本](https://img.shields.io/github/v/tag/fuguangbeta/dsh-mounts?label=%E7%89%88%E6%9C%AC&color=blue)](https://github.com/fuguangbeta/dsh-mounts/tags)
![平台](https://img.shields.io/badge/%E5%B9%B3%E5%8F%B0-DeepSeek%20Harness-0078D4)
![只读](https://img.shields.io/badge/%E8%AE%BF%E9%97%AE-%E4%BB%85%E5%8F%AA%E8%AF%BB-4CAF50)
[![许可](https://img.shields.io/github/license/fuguangbeta/dsh-mounts?label=%E8%AE%B8%E5%8F%AF)](https://github.com/fuguangbeta/dsh-mounts/blob/main/LICENSE)
[![Star](https://img.shields.io/github/stars/fuguangbeta/dsh-mounts?label=Star&color=yellow)](https://github.com/fuguangbeta/dsh-mounts/stargazers)

## 关于本工具 · *About This Tool*

dsh-mounts 是 DeepSeek Harness 的一个**只读侧栏面板**。它做的事情很单一：把「这个 profile 实际挂了什么」摊在一页——预规定、记忆库、技能、MCP 服务器、智能体预设。

它不注册任何工具、不注入任何上下文、不写任何文件、不联网。装与不装，模型看到的提示词完全一样——它只是给你看的一张清单。

有几件事需要提前说明。

**它显示的是"存在"，不是"已生效"。** 比如某个 MCP 行出现在补丁里，不代表那个进程正在跑；某个技能出现在列表里，不代表它这一轮被加载过。这是清单，不是仪表盘。

**记忆库那一块读的不是 DSH 的东西。** `~/.zcode/cli/memories/projects/` 是 ZCode 的记忆库，DSH 完全不读它们。这里只是列出来让你知道有哪些文件、各自多大、什么时候改的。真正的"项目记忆"另有一个文件：工作区的 `AGENTS.local.md`，那个是自动注入的。

**它不读文件内容。** 记忆库只做 `stat`（名字、大小、时间），技能只取 frontmatter 里那一行 description。想看正文，用每行的「打开」，交给系统默认程序。

**「打开」依赖 DSH 自带的 Session Remote。** 拿不到时会自动降级成「复制路径」——不会出现点了没反应的情况，也不会因此新增任何端点。

如果你只是想确认"我到底配了什么"，这个面板够用；如果你想在面板里读文件、改配置、开关能力，它不做这些，也不打算做——**能改的面板迟早会改坏东西**。

dsh-mounts is a **read-only sidebar panel** for DeepSeek Harness. It does one narrow thing: lays out everything a profile actually mounts — instructions, memory libraries, skills, MCP servers, and agent presets — on a single page.

It registers no tools, injects no context, writes no files, and never touches the network. With or without it installed, the prompt the model sees is byte-for-byte identical. It is a list you read, nothing more.

A few things are worth saying plainly.

**It shows what exists, not what is active.** An MCP row appearing in the patch does not mean that process is running; a skill appearing in the list does not mean it was loaded this turn. This is an inventory, not a dashboard.

**The memory-library section does not read DSH's own data.** `~/.zcode/cli/memories/projects/` belongs to ZCode, and DSH never reads it. The panel lists those files — names, sizes, timestamps — for visibility only. The actual "project memory" is a different file: `AGENTS.local.md` in the workspace, which DSH injects automatically.

**It never reads file contents.** The memory libraries are only `stat`-ed; skills contribute just the one-line description from their frontmatter. To read a file, use the "Open" button and let the system's default application handle it.

**"Open" relies on DSH's built-in Session Remote.** When that is unavailable the button degrades to "Copy path" on its own — it never silently does nothing, and it never adds an endpoint to make opening work.

Ideal if you want to confirm what you have configured. Not for reading files, editing settings, or toggling capabilities inside the panel — **a panel that can change things will eventually break something.**

---

## 长什么样 · *What It Looks Like*

```
挂载清单  [只读]  [刷新]
这个 profile 实际挂载了什么：预规定 · 记忆库 · 技能 · MCP · 智能体预设

▸ 预规定 (2)
▸ 记忆库 (6 个库 · 34 个文件)
▸ 技能 (7)
▸ MCP 服务器 (3)
▸ 智能体预设 (5)
```

展开「记忆库」，再点开其中一个库：

```
▾ 记忆库 (6 个库 · 34 个文件)
   ▾ my-app (14 个文件 · 最近 2026-10-16)
       MEMORY.md · 6.7 KB · 2026-10-16 · [打开]
       overview.md · 12.9 KB · 2026-10-17 · [打开]
       …
   ▸ another-project (9 个文件 · 最近 2026-10-06)
   ▸ …
```

> 这是示意图，**数据为示例**。仓库**不附真实截图**——面板会显示本机绝对路径、用户名、目录结构，
> 截图等于把本机环境公开一遍。
>
> 示意图里没有做右对齐：中文在等宽字体里占两列，靠空格对齐在不同编辑器里会散架。

---

## 五块内容 · *The Five Sections*

| 块 | 从哪来 | 展开后看到 |
|------|------|------|
| **预规定** | `~/.dsh/AGENTS.md` + 项目根到当前目录链上的四个候选文件 | 每份文件的 `##` 章节标题 |
| **记忆库** | `~/.zcode/cli/memories/projects/*/memory/` | 库列表 → 文件列表（名字 · 大小 · 日期） |
| **技能** | 四个扫描根：项目 `.dsh/skills` → 项目 `.agents/skills` → 用户 `~/.dsh/skills` → 用户 `~/.agents/skills` | 完整描述、文件路径、来源根 |
| **MCP 服务器** | profile 补丁里的 `dsh-mcp-client` 行 | 补丁行 id、env 变量名、目标 |
| **智能体预设** | profile 自定义的 + 内置 `standard/ptc/minimal/cordis` | 补丁行、标题 |

## 折叠与详情 · *Folding and Details*

| 层级 | 点哪里 | 看到什么 |
|------|------|------|
| L1 | 打开面板 | 五个块标题 + 各自的计数 |
| L2 | 块标题 | 该块的条目列表 |
| L3 | 条目 | 该条目自己的字段 |
| L3+ | 记忆库的库标头 | 文件列表，每行可「打开」 |

打开时全部停在 L1，**默认什么都不展开**。所有展开都只涉及条目自身的信息，不会去索引别处的文件。

---

## 安装 · *Installation*

推荐走 DSH 官方路径。需要 **Creator 模式**（`cordis` preset）——只有那个预设带 `plugin_manager`。

1. 把本仓库放到任意工作区（clone 或 GitHub 的 **Download ZIP** 都行，不依赖 npm）
2. 用 `plugin_manager` 的 `install_bundle`，`target` 指向本包目录的**绝对路径**
3. 读返回的 `application` 和 `warnings` 确认结果

> ⛔ **不要**手工改 profile 的 `package.json` / `cordis.patch.yml`，也不要在 profile 目录跑 pnpm。
> 官方指南明确禁止，`install_bundle` 会处理这些。

装完侧栏就能看到「挂载清单」。改客户端代码后**硬刷新**（Ctrl+Shift+R）生效；
改 Host 代码要用 `plugin_manager` 把 `include:mounts-panel` 关→开重新 import。

---

## 安全 · *Security*

本插件刻意收窄了攻击面：

**不写文件、不 spawn 进程、不发起出站网络请求。**

唯一对外暴露的是一个 HTTP 端点 `GET /dsh-mounts/api`：

- 只允许 loopback 的 `Host` 头（`127.0.0.1` / `localhost` / `[::1]`），
  其余一律 **403** —— 这是防 DNS rebinding 的
- 只接受 **GET / HEAD**，其余 **405**
- `Cache-Control: no-store`
- 自定义的 `cwd` 参数被移除，不会变成任意目录探测器

**不返回任何文件内容。** 记忆库只 `stat`，技能只取 frontmatter 的 description。

「打开」动作**不自建端点**：走 DSH 现成的 Session Remote，由 Host 侧用组合文件系统复核路径。

---

## 已知限制 · *Known Limitations*

| 限制 | 原因 | 影响 |
|------|------|------|
| 内置预设只有名字 | 定义在 bundle（`app.asar`）内，第三方读不到 | 只能显示 id，不能展开 |
| 记忆库路径写死 | 只认 `~/.zcode/cli/memories/projects/` | 别的工具的记忆库不会出现 |
| 技能描述上限 400 字 | 控制响应体积 | 超长时末尾加「…」 |
| MCP 的预设列是推导的 | API 没有 MCP→预设 的映射 | 推不出来就留空 |
| 工作区是猜的 | 取注册表里 `updatedAt` 最新的那个 | 可能不是你当前会话所在的 |
| 「打开」依赖 Session Remote | 不自建端点 | 拿不到时降级为「复制路径」 |
| 面板不显示"当前预设" | 注册表只有全局默认值，拿不到会话绑定 | 这个列表不代表当前会话用的是哪个 |

---

## 系统要求 · *System Requirements*

| 项 | 要求 |
|------|------|
| **DSH** | >= 0.2.1-rc.2 |
| **安装** | 需要 Creator 模式（`cordis` preset） |
| **日常使用** | 不需要 Creator 模式 |
| **客户端服务** | `remote` / `remote.session` / `connection` / `locale` |
| **平台** | Windows 已验证，其余未测试 |
| **第三方依赖** | 无 |

DeepSeek Harness 0.2.1-rc.2 or later. Installation requires Creator mode (the `cordis` preset); everyday use does not. Windows is the verified platform; others are untested. No third-party dependencies.

---

## 常见问题 · *Frequently Asked Questions*

**装完了侧栏没有「挂载清单」？**
先确认 `install_bundle` 返回的 `application` 是 `applied`。已经装上了但看不到，多半是页面缓存——按 **Ctrl+Shift+R** 硬刷新；还不行就退出 DSH 重新打开。

**改了代码，页面上还是旧样子？**
客户端改动用硬刷新；改了 Host 侧（`index.js`）则必须用 `plugin_manager` 把
`include:mounts-panel` 关→开一次，模块才会重新 import。

**面板显示的工作区不是我当前所在的那个？**
已知限制。面板取的是注册表里最近更新的工作区，不是会话级绑定。

**「打开」按钮变成了「复制路径」？**
说明这个页面拿不到 Session Remote，属于正常降级。点一下会把完整路径复制到剪贴板，粘到资源管理器即可打开。

**为什么面板里看不到 ZCode 记忆库的正文？**
有意为之。读文件内容需要在端点里开一个文件读取口子，那会把 `~/.dsh/.credentials.yaml`
这类文件一起暴露出去。所以只提供「打开」，交给系统程序。

---

## 开发 · *Development*

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

## 许可 · *License*

MIT。见 [LICENSE](LICENSE)。

---

## 支持 · *Support*

这是一个小工具，用着顺手就好。发现问题请开 issue，附上 DSH 版本和面板截图（**记得先遮掉路径里的用户名**）。
