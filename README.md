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

记忆库一栏由两部分组成：各工作区内名为 `memory` 的目录（`<工作区>/memory`、`.dsh/memory`、`.agents/memory`），
以及 `memoryRoots` 配置的目录（默认为空）。两者都没有时，整栏省略。
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
combines named `memory` directories found inside each workspace with any directories listed in
`memoryRoots` (empty by default), and is omitted when neither yields a library;
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
| 记忆库 | 工作区内 `<ws>/memory`、`.dsh/memory`、`.agents/memory`，以及 `memoryRoots` 配置的目录（默认空） | 按组列出库与文件（名称、大小、日期） |
| 技能 | 四个扫描根：项目 `.dsh/skills`、项目 `.agents/skills`、用户 `~/.dsh/skills`、用户 `~/.agents/skills`，以及配置的 `extraSkillRoots` | 描述全文、文件路径、来源根 |
| MCP 服务器 | profile 补丁 + 全局补丁层 + `extraPatchFiles` 中的 `dsh-mcp-client` 行 | 补丁行 id、env 变量名、目标、所属预设 |
| 智能体预设 | profile 补丁 + 全局补丁层 + `extraPatchFiles` 中的预设行，以及内置的 `standard`、`ptc`、`minimal`、`cordis` | 补丁行、标题 |

| Group | Source | Expanded |
|------|------|------|
| Instructions | `~/.dsh/AGENTS.md` plus the four candidate files from the project root down to the working directory | The `##` headings of each file |
| Memory libraries | Workspace `<ws>/memory`, `.dsh/memory`, `.agents/memory`, plus directories configured in `memoryRoots` (empty by default) | Libraries and files grouped, with name, size, date |
| Skills | Four scan roots: project `.dsh/skills`, project `.agents/skills`, user `~/.dsh/skills`, user `~/.agents/skills`, plus configured `extraSkillRoots` | Full description, file path, source root |
| MCP servers | `dsh-mcp-client` rows in the profile patch, the global patch layer, and `extraPatchFiles` | Patch row id, env variable names, target, owning preset |
| Agent presets | Preset rows in the profile patch, the global patch layer, and `extraPatchFiles`, plus the built-in `standard`, `ptc`, `minimal`, `cordis` | Patch row, title |

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

### 3.3 配置 · *Configuration*

记忆库默认只从各工作区内的 `memory` 目录发现。如需加入其他位置，在 DSH 设置页的插件配置中填写：

| 键 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| `memoryRoots` | string[] | `[]` | 记忆库根目录列表（默认空）。每个根下的直接子目录算一个库；同名库合并为一组；同名文件保留修改时间较新的一份 |
| `extraSkillRoots` | string[] | `[]` | 额外技能根目录。每个直接子目录含 SKILL.md 或 `<名字>.md` 即算一个技能 |
| `extraPatchFiles` | string[] | `[]` | 额外补丁文件，用于补充 MCP 与智能体预设 |

路径可以写 `~`，会被展开为 home。

*Memory libraries are discovered from named `memory` directories inside each workspace. Additional
plugin configuration on the DSH settings page:*

| Key | Type | Default | Description |
|------|------|------|------|
| `memoryRoots` | string[] | `[]` | Memory-library roots (empty by default). Each direct child directory counts as one library; same-name libraries merge into one group, and same-name files keep the newest copy |
| `extraSkillRoots` | string[] | `[]` | Extra skill roots. Each direct child directory containing `SKILL.md` or `<name>.md` counts as one skill |
| `extraPatchFiles` | string[] | `[]` | Extra patch files, used to add MCP servers and Agent Presets |

*A leading `~` is expanded to the home directory.*

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

| 限制 | 说明 |
|------|------|
| 面板只读 | 不提供编辑、启停与删除 |
| 内置预设只能看到名称 | 其定义不在 profile 补丁里，面板读不到，因此不能展开 |
| 只识别名为 memory 的目录 | 不做模糊匹配；名字不同的记忆目录需要用 memoryRoots 指定 |
| 技能描述最多 1000 字 | 超出部分以省略号结尾 |
| 工作区取最近更新的一个 | 可能不是当前会话所在的工作区 |
| 不标示当前会话使用的预设 | 只列出已定义的预设，不判断哪一个正在生效 |
| 不列 bundle 内置技能 | 内置技能分散在各 bundle 内，无法统一枚举；只显示文件系统上的技能 |
| 不自动读取 customSkillDirs | 该配置属于另一个插件；需要时用 extraSkillRoots 手动补 |
| 「打开」在部分环境下降级为「复制路径」 | 属预期行为，点击后完整路径进入剪贴板 |

| Limitation | Note |
|------|------|
| Read-only | No editing, toggling, or deleting |
| Built-in presets show names only | Their definitions are not in the profile patch, so the panel cannot read or expand them |
| Only directories named memory are recognised | No fuzzy matching; use memoryRoots for differently named memory directories |
| Skill descriptions are capped at 1000 characters | Longer ones end with an ellipsis |
| The workspace is the most recently updated one | It may not be the workspace of the current session |
| The preset in use by a session is not marked | Only defined presets are listed; which one is active is not determined |
| Bundle-embedded skills are not listed | They are spread across bundles and cannot be enumerated uniformly; only skills on the filesystem are shown |
| `customSkillDirs` is not read automatically | That setting belongs to another plugin; use `extraSkillRoots` when needed |
| "Open" degrades to "Copy path" in some environments | Expected behaviour; clicking places the full path on the clipboard |

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
