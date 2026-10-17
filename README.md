# dsh-mounts

[![版本](https://img.shields.io/github/v/tag/fuguangbeta/dsh-mounts?label=%E7%89%88%E6%9C%AC&color=blue)](https://github.com/fuguangbeta/dsh-mounts/tags)
![平台](https://img.shields.io/badge/%E5%B9%B3%E5%8F%B0-DeepSeek%20Harness-0078D4)
![只读](https://img.shields.io/badge/%E8%AE%BF%E9%97%AE-%E4%BB%85%E5%8F%AA%E8%AF%BB-4CAF50)
[![许可](https://img.shields.io/github/license/fuguangbeta/dsh-mounts?label=%E8%AE%B8%E5%8F%AF)](https://github.com/fuguangbeta/dsh-mounts/blob/main/LICENSE)
[![Star](https://img.shields.io/github/stars/fuguangbeta/dsh-mounts?label=Star&color=yellow)](https://github.com/fuguangbeta/dsh-mounts/stargazers)

## 关于本工具 · *About This Tool*

dsh-mounts 是 DeepSeek Harness 的一个只读侧栏面板。它把当前 profile 里配了哪些东西列在一页：
预规定、记忆库、技能、MCP 服务器、智能体预设。

它不注册工具，不往上下文里塞内容，不写文件，也不联网。装上它之后，模型收到的提示词和装之前一样。

用得上的场合，是想确认"我到底配了什么"。它不判断这些配置是否生效——某个 MCP 在补丁里有一行，
不代表进程正在跑；某个技能出现在列表里，也不代表这一轮加载过。

记忆库那一栏读的是一个写死的路径 `~/.zcode/cli/memories/projects/`。有这个目录就列出文件，
没有的话整块不显示。所以如果你没用过 ZCode，这一栏不会出现——不是坏了，是没有可列的东西。
DSH 本身不读这个目录，它真正自动注入的是各工作区的 `AGENTS.md` 和 `AGENTS.local.md`，
那部分在「预规定」一栏。

面板不读文件内容。要看正文，点每行的「打开」，交给系统默认程序。这个按钮依赖 DSH 自带的
Session Remote，拿不到的时候会变成「复制路径」。

它没有编辑、开关、删除这类功能，短期内也不打算加。定位就是一张清单。

dsh-mounts is a read-only sidebar panel for DeepSeek Harness. It lists what the current profile has
configured — instructions, memory libraries, skills, MCP servers, and agent presets — on a single page.

It registers no tools, adds nothing to the context, writes no files, and does not use the network.
With it installed, the prompt the model receives is the same as before.

It is useful when you want to confirm what you have configured. It does not tell you whether that
configuration is active: an MCP row in the patch does not mean the process is running, and a skill in
the list does not mean it was loaded this turn.

The memory-library section reads one hard-coded path, `~/.zcode/cli/memories/projects/`.
If that directory exists the files are listed; if not, the whole section is hidden. So unless you have
used ZCode, you will not see it — it is not broken, there is simply nothing to list. DSH never reads
that directory; what DSH actually injects are the `AGENTS.md` and `AGENTS.local.md` files
in each workspace, shown in the first section.

The panel does not read file contents. To read a file, use the "Open" button and let the system's
default application handle it. That button relies on DSH's built-in Session Remote and falls back to
"Copy path" when the Remote is unavailable.

There is no editing, toggling, or deleting, and none is planned. It is meant to be a list.

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

示意图里的项目名、大小、日期都是编的。仓库不放真实截图——图里会带上本机路径和用户名。

示意图也没有做右对齐：中文在等宽字体里占两列，靠空格对齐换一个编辑器就会散。

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

打开时停在 L1，默认什么都不展开。展开后显示的都是这个条目自己的字段。

---

## 安装 · *Installation*

需要 **Creator 模式**（`cordis` preset），只有那个预设带 `plugin_manager`。

1. 把本仓库放到任意工作区（clone 或 GitHub 的 **Download ZIP** 都行，不依赖 npm）
2. 用 `plugin_manager` 的 `install_bundle`，`target` 指向本包目录的绝对路径
3. 读返回的 `application` 和 `warnings` 确认结果

profile 的 `package.json` 和 `cordis.patch.yml` 交给 `install_bundle` 处理，
不要手工改，也不要在 profile 目录跑 pnpm——官方指南里有同样的说明。

装完侧栏就能看到「挂载清单」。改客户端代码后硬刷新（Ctrl+Shift+R）生效；
改 Host 代码要用 `plugin_manager` 把 `include:mounts-panel` 关→开重新 import。

---

## 安全 · *Security*

设计上尽量少开口子：

- 不写文件，不启子进程，不发起出站请求
- 只开一个 HTTP 端点 `GET /dsh-mounts/api`
- 该端点只允许 loopback 的 `Host` 头（`127.0.0.1` / `localhost` / `[::1]`），
  其余返回 **403**，用来挡 DNS rebinding
- 只接受 **GET / HEAD**，其余返回 **405**
- `Cache-Control: no-store`
- 不带自定义 `cwd` 参数，不会被用来探测任意目录
- 不返回文件内容：记忆库只 `stat`，技能只取 frontmatter 里的 description

「打开」不自建端点，用的是 DSH 现成的 Session Remote，路径由 Host 侧复核。

---

## 已知限制 · *Known Limitations*

| 限制 | 原因 | 影响 |
|------|------|------|
| 内置预设只有名字 | 定义在 bundle（`app.asar`）内，第三方读不到 | 只能显示 id，不能展开 |
| 记忆库路径写死 | 只认 `~/.zcode/cli/memories/projects/` | 没有这个目录时整块隐藏；别处的目录不会被发现 |
| 技能描述上限 400 字 | 控制响应体积 | 超长时末尾加「…」 |
| MCP 的预设列是推导的 | API 没有 MCP→预设 的映射 | 推不出来就留空 |
| 工作区是猜的 | 取注册表里 `updatedAt` 最新的那个 | 可能不是你当前会话所在的 |
| 「打开」依赖 Session Remote | 不自建端点 | 拿不到时降级为「复制路径」 |
| 不显示"当前预设" | 注册表只有全局默认值，拿不到会话绑定 | 这个列表不代表当前会话用的是哪个 |

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

DeepSeek Harness 0.2.1-rc.2 or later. Installation requires Creator mode (the `cordis` preset);
everyday use does not. Windows is the verified platform; others are untested. No third-party dependencies.

---

## 常见问题 · *Frequently Asked Questions*

**装完了侧栏没有「挂载清单」？**
先确认 `install_bundle` 返回的 `application` 是 `applied`。装是装上了但看不到，
一般是页面缓存——按 Ctrl+Shift+R 硬刷新；还不行就退出 DSH 重新打开。

**改了代码，页面上还是旧样子？**
客户端改动用硬刷新。改了 Host 侧（`index.js`）则必须用 `plugin_manager` 把
`include:mounts-panel` 关→开一次，模块才会重新 import。

**面板显示的工作区不是我当前所在的那个？**
已知限制。面板取的是注册表里最近更新的工作区，不是会话级绑定。

**「打开」按钮变成了「复制路径」？**
这个页面拿不到 Session Remote，属于正常降级。点一下会把完整路径复制到剪贴板，粘到资源管理器即可。

**为什么不能直接在面板里看记忆文件的正文？**
因为那需要在端点里加一个读文件的口子，而端点本身没有会话鉴权，只能靠 Host 头挡。
这个口子一开，就不只是记忆库了。所以只提供「打开」，交给系统程序。

---

## 开发 · *Development*

    dsh-mounts/
      package.json       包清单 + dsh.bundle + dsh.client
      cordis.patch.yml   一行 insert：mounts-panel
      index.js           Host 半边：只读扫描 + GET /dsh-mounts/api
      client.js          Web 半边：侧栏一级面板 + main keyed 槽
      locale/{zh,en}.json
      icon.svg

- `client.js` 改动 → 硬刷新（Ctrl+Shift+R）
- `index.js` 改动 → `plugin_manager` 把 `include:mounts-panel` 关→开
- 读盘文本先做 `\r\n?` → `\n` 规范化。CRLF 的 `SKILL.md` 会让 frontmatter 解析失败，
  而且失败是静默的——description 变成空字符串，界面上只看到一个「—」

---

## 许可 · *License*

MIT。见 [LICENSE](LICENSE)。

---

## 支持 · *Support*

用着有问题就开个 issue，附上 DSH 版本和你看到的现象。截图的话，路径里的用户名可以打码。
