# dsh-mounts

[![版本](https://img.shields.io/github/v/tag/fuguangbeta/dsh-mounts?label=%E7%89%88%E6%9C%AC&color=blue)](https://github.com/fuguangbeta/dsh-mounts/tags)
![平台](https://img.shields.io/badge/%E5%B9%B3%E5%8F%B0-DeepSeek%20Harness-0078D4)
![只读](https://img.shields.io/badge/%E8%AE%BF%E9%97%AE-%E4%BB%85%E5%8F%AA%E8%AF%BB-4CAF50)
[![许可](https://img.shields.io/github/license/fuguangbeta/dsh-mounts?label=%E8%AE%B8%E5%8F%AF)](https://github.com/fuguangbeta/dsh-mounts/blob/main/LICENSE)
[![Star](https://img.shields.io/github/stars/fuguangbeta/dsh-mounts?label=Star&color=yellow)](https://github.com/fuguangbeta/dsh-mounts/stargazers)

## 关于本工具 · *About This Tool*

dsh-mounts 是 DeepSeek Harness 的只读侧栏面板，将当前 profile 的挂载内容归为五类，同页呈现。
面板不注册工具，不注入上下文，不写文件，不发起网络请求。安装不改变模型所见的提示词。

面板的用途限于确认配置内容，不判定其是否生效：补丁中存在 MCP 行，不代表对应进程正在运行；
技能出现在列表中，不代表本轮已加载。

记忆库一栏读取固定路径 `~/.zcode/cli/memories/projects/`，路径存在时列出文件，否则整栏省略。
DSH 不读取该目录；DSH 自动注入的内容为各工作区的 `AGENTS.md` 与 `AGENTS.local.md`，
归入「预规定」一栏。

面板不读取文件内容。记忆库仅取 `stat` 元数据，技能仅取 frontmatter 中的 description。
查看正文使用每行的「打开」，交由系统默认程序处理；该操作使用 DSH 内置的 Session Remote，
不可用时降级为「复制路径」。功能范围限于只读呈现，不提供编辑、启停与删除。

This is a read-only sidebar panel for DeepSeek Harness. It presents the mounts of the current profile
in five groups on one page. It registers no tools, adds nothing to the context, writes no files, and
does not use the network; installing it does not change the prompt the model receives. Its purpose is
to report what is configured, not whether it is active: an MCP row in the patch does not imply a
running process, and a listed skill was not necessarily loaded this turn. The memory-library group
reads a fixed path, `~/.zcode/cli/memories/projects/`, and is omitted when that path is absent;
DSH does not read it, and what DSH injects are the `AGENTS.md` and `AGENTS.local.md` files
of each workspace, reported in the first group. File contents are never read: the memory libraries are
only `stat`-ed and skills contribute the description line from their frontmatter. Reading a file
is delegated to the system default application through DSH's Session Remote, with a copy-path fallback.
The scope is read-only presentation.

---

## 1. 界面 · *Interface*

### 1.1 初始状态 · *Initial State*

面板在打开时的状态：

```
挂载清单  [只读]  [刷新]
这个 profile 实际挂载了什么：预规定 · 记忆库 · 技能 · MCP · 智能体预设

▸ 预规定 (2)
▸ 记忆库 (6 个库 · 34 个文件)
▸ 技能 (7)
▸ MCP 服务器 (3)
▸ 智能体预设 (5)
```

*The panel in its initial state.*

### 1.2 记忆库展开至文件级 · *Library Expanded to Files*

```
▾ 记忆库 (6 个库 · 34 个文件)
   ▾ my-app (14 个文件 · 最近 2026-10-16)
       MEMORY.md · 6.7 KB · 2026-10-16 · [打开]
       overview.md · 12.9 KB · 2026-10-17 · [打开]
       …
   ▸ another-project (9 个文件 · 最近 2026-10-06)
   ▸ …
```

两图为示意，数据非实测。*Both figures are illustrative; the data is not measured.*

### 1.3 栏目与数据来源 · *Groups and Data Sources*

| 栏 | 来源 | 展开后 |
|------|------|------|
| 预规定 | `~/.dsh/AGENTS.md`，以及项目根至当前目录链上的四个候选文件 | 各文件的 `##` 章节标题 |
| 记忆库 | `~/.zcode/cli/memories/projects/*/memory/` | 库列表，文件列表（名称、大小、日期） |
| 技能 | 四个扫描根：项目 `.dsh/skills`、项目 `.agents/skills`、用户 `~/.dsh/skills`、用户 `~/.agents/skills` | 描述全文、文件路径、来源根 |
| MCP 服务器 | profile 补丁中的 `dsh-mcp-client` 行 | 补丁行 id、env 变量名、目标 |
| 智能体预设 | profile 自定义预设，以及内置的 `standard`、`ptc`、`minimal`、`cordis` | 补丁行、标题 |

| Group | Source | Expanded |
|------|------|------|
| Instructions | `~/.dsh/AGENTS.md` plus the four candidate files from the project root down to the working directory | The `##` headings of each file |
| Memory libraries | `~/.zcode/cli/memories/projects/*/memory/` | Library list, then file list (name, size, date) |
| Skills | Four scan roots: project `.dsh/skills`, project `.agents/skills`, user `~/.dsh/skills`, user `~/.agents/skills` | Full description, file path, source root |
| MCP servers | `dsh-mcp-client` rows in the profile patch | Patch row id, env variable names, target |
| Agent presets | Profile-defined presets plus the built-in `standard`, `ptc`, `minimal`, `cordis` | Patch row, title |

---

## 2. 层级与展开 · *Hierarchy*

| 层级 | 触发 | 内容 |
|------|------|------|
| L1 | 打开面板 | 五个栏目标题及计数 |
| L2 | 点击栏目标题 | 该栏条目 |
| L3 | 点击条目 | 该条目自身的字段 |
| L3+ | 点击记忆库的库标题 | 文件列表，每行可「打开」 |

初始状态停留在 L1。展开内容仅涉及被展开条目自身的字段。

| Level | Trigger | Content |
|------|------|------|
| L1 | Opening the panel | The five group titles and their counts |
| L2 | Clicking a group title | The entries of that group |
| L3 | Clicking an entry | The fields of that entry |
| L3+ | Clicking a memory-library title | The file list, each row openable |

The initial state rests at L1. An expansion only ever shows the fields of the expanded entry itself.

---

## 3. 安装 · *Installation*

### 3.1 安装步骤 · *Steps*

需要 Creator 模式（`cordis` preset），该预设提供 `plugin_manager`。

1. 将本仓库放入任一工作区。可 clone，亦可使用 GitHub 的 Download ZIP；不依赖 npm。
2. 调用 `plugin_manager` 的 `install_bundle`，`target` 指向本包目录的绝对路径。
3. 检查返回的 `application` 与 `warnings`。

profile 的 `package.json` 与 `cordis.patch.yml` 由 `install_bundle` 维护。手工修改
或于 profile 目录执行 pnpm 均不符合官方流程。

Creator mode (the `cordis` preset) is required, as it provides `plugin_manager`. Place the
repository in any workspace, by clone or by GitHub's Download ZIP; npm is not involved. Call
`install_bundle` with `target` set to the absolute path of this package, then inspect the
returned `application` and `warnings`. The profile's `package.json` and
`cordis.patch.yml` are maintained by `install_bundle`; editing them by hand, or running pnpm
inside the profile directory, is outside the official procedure.

### 3.2 代码改动生效方式 · *Applying Code Changes*

客户端依赖（`client.js`）改动通过硬刷新（Ctrl+Shift+R）生效。Host 侧依赖（`index.js`）
改动需以 `plugin_manager` 将 `include:mounts-panel` 关→开，触发模块重新 import。

Client-side changes (`client.js`) take effect on a hard refresh (Ctrl+Shift+R). Host-side changes
(`index.js`) require toggling `include:mounts-panel` off and on through `plugin_manager`
so the module is imported again.

---

## 4. 安全模型 · *Security Model*

- 不写文件，不启动子进程，不发起出站请求。
- 仅暴露一个 HTTP 端点 `GET /dsh-mounts/api`。
- 该端点仅接受 loopback 的 `Host` 头（`127.0.0.1`、`localhost`、`[::1]`），
  其余返回 403，用于阻断 DNS rebinding。
- 仅接受 GET 与 HEAD，其余返回 405。响应带 `Cache-Control: no-store`。
- 不接受 `cwd` 参数。
- 不返回文件内容：记忆库仅 `stat`，技能仅取 frontmatter 的 description。

「打开」不新建端点，使用 DSH 现有的 Session Remote，路径由 Host 侧复核。

- *No files are written, no subprocess is started, no outbound request is made.*
- *One HTTP endpoint is exposed: `GET /dsh-mounts/api`.*
- *It accepts only a loopback `Host` header (`127.0.0.1`, `localhost`, `[::1]`) and
  returns 403 otherwise, which blocks DNS rebinding.*
- *It accepts only GET and HEAD and returns 405 otherwise; responses carry `Cache-Control: no-store`.*
- *It does not accept a `cwd` parameter.*
- *It returns no file contents: memory libraries are only `stat`-ed and skills contribute the
  frontmatter description.*

The "Open" action creates no endpoint; it uses DSH's existing Session Remote and the path is
re-validated on the Host side.

---

## 5. 已知限制 · *Known Limitations*

| 限制 | 原因 | 影响 |
|------|------|------|
| 内置预设仅显示名称 | 定义位于 bundle（`app.asar`）内，第三方不可读 | 仅列出 id，不可展开 |
| 记忆库路径固定 | 仅识别 `~/.zcode/cli/memories/projects/` | 路径缺失时整栏省略；其他位置不被识别 |
| 技能描述上限 400 字 | 控制响应体积 | 超限时末尾加省略号 |
| MCP 的预设列由数量推导 | API 未提供 MCP 与预设的映射 | 无法唯一推导时留空 |
| 工作区取注册表中最新的一个 | 无会话级绑定 | 可能与当前会话所在工作区不同 |
| 「打开」依赖 Session Remote | 不新建端点 | 不可用时降级为「复制路径」 |
| 不标示当前预设 | 注册表仅存全局默认值 | 该列表不表示当前会话所用预设 |

| Limitation | Cause | Effect |
|------|------|------|
| Built-in presets show names only | They are defined inside the bundle (`app.asar`), unreadable to third parties | Only ids are listed; they cannot be expanded |
| The memory-library path is fixed | Only `~/.zcode/cli/memories/projects/` is recognised | The group is omitted when absent; other locations are not detected |
| Skill descriptions are capped at 400 characters | To bound the response size | Longer ones end with an ellipsis |
| The MCP preset column is derived from counts | The API exposes no MCP-to-preset mapping | Left blank when no unique match exists |
| The workspace is the most recently updated in the registry | There is no session-level binding | It may differ from the workspace of the current session |
| "Open" depends on the Session Remote | No endpoint is added | It degrades to "Copy path" when unavailable |
| The current preset is not marked | The registry holds only a global default | The list does not indicate the preset a session uses |

---

## 6. 开发 · *Development*

    dsh-mounts/
      package.json       包清单、dsh.bundle、dsh.client
      cordis.patch.yml   单条 insert：mounts-panel
      index.js           Host 侧：只读扫描与 GET /dsh-mounts/api
      client.js          Web 侧：侧栏一级面板与 main keyed 槽
      locale/{zh,en}.json
      icon.svg

读盘文本先做 `\r\n?` 到 `\n` 的规范化。CRLF 的 `SKILL.md` 会使 frontmatter 解析静默失败，
description 退化为空字符串。

Text read from disk is normalised from `\r\n?` to `\n` first. A CRLF `SKILL.md` makes
frontmatter parsing fail silently and the description degrade to an empty string.

---

## 系统要求 · *System Requirements*

| 项 | 要求 |
|------|------|
| DSH | >= 0.2.1-rc.2 |
| 安装 | Creator 模式（`cordis` preset） |
| 日常使用 | 不要求 Creator 模式 |
| 客户端服务 | `remote`、`remote.session`、`connection`、`locale` |
| 平台 | Windows 已验证，其余未测试 |
| 第三方依赖 | 无 |

| Item | Requirement |
|------|------|
| DSH | >= 0.2.1-rc.2 |
| Installation | Creator mode (the `cordis` preset) |
| Everyday use | Creator mode not required |
| Client services | `remote`, `remote.session`, `connection`, `locale` |
| Platform | Windows verified; other platforms untested |
| Third-party dependencies | None |

---

## 常见问题 · *Frequently Asked Questions*

**安装后侧栏无「挂载清单」。**
确认 `install_bundle` 返回的 `application` 为 `applied`。若已应用仍不可见，先行硬刷新
（Ctrl+Shift+R）；无效则重启 DSH。

**改动代码后界面无变化。**
参见 §3.2。

**显示的工作区与当前会话不符。**
面板取注册表中最近更新的工作区，无会话级绑定，见 §5。

**「打开」显示为「复制路径」。**
该页面无法取得 Session Remote，属预期降级。点击后完整路径进入剪贴板。

**为何不提供正文预览。**
正文预览需要在端点中开放文件读取，而该端点仅以 Host 头作准入控制，不做会话鉴权。故仅提供「打开」。

***The sidebar shows no "挂载清单" after installation.*** *Confirm that `install_bundle` returned
`application: applied`. If it is applied but still invisible, perform a hard refresh
(Ctrl+Shift+R); if that fails, restart DSH.*

***The interface does not change after a code edit.*** *See §3.2.*

***The displayed workspace is not the one of the current session.*** *The panel takes the most recently
updated workspace in the registry and has no session-level binding. See §5.*

***"Open" appears as "Copy path".*** *The page cannot reach the Session Remote, which is the expected
degradation. Clicking places the full path on the clipboard.*

***Why is there no inline preview of file contents?*** *A preview would require opening file reads on the
endpoint, which is admitted only by the Host header and carries no session authentication. The "Open"
action is provided instead.*

---

## 许可 · *License*

MIT，见 [LICENSE](LICENSE)。*MIT, see [LICENSE](LICENSE).*

---

## 反馈 · *Feedback*

问题请提交 issue，附 DSH 版本与复现步骤。
*Please open an issue, including the DSH version and reproduction steps.*
