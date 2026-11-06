# 安装与第一次使用

## Windows：从完整项目 ZIP 开始

1. 从本仓库 Releases 下载 **workbench 完整包**，解压到准备长期保留的目录。不要在压缩包里直接运行文件。
2. 双击 `install.cmd`。已有 Node.js 22.16+ 时直接进入向导；没有时，会询问是否从 nodejs.org 下载用户目录内的 LTS 便携环境。下载会对照官方 SHA-256 清单校验，不修改系统 PATH、不要求管理员权限。拒绝下载则结束。
3. 回车使用 Codex 的默认技能目录，或输入其他 agent 的完整技能目录。只有 Codex 的 MCP 配置支持自动写入；其他 agent 可使用生成的连接脚本自行配置。
4. 确认后安装技能和锁定版本的依赖。已有不同内容的技能会先询问是否备份更新；失败时保留原技能。不要把 `node_modules` 手动复制进安装目录。
5. 安装器生成并解析一个示例 NBT。成功后按提示运行工作台，打开输出的实际地址。首次启动需要构建浏览器依赖，请等加载完成。
6. 重新加载 agent；有些客户端需要新开对话或重启。安装器无法替所有客户端完成这一步，完成文件复制不会被表述为“agent 已加载”。
7. 在新对话中使用 `$minecraft-architecture` 描述需求。第一次先要预览。

## 让 agent 代办安装

把仓库地址交给一个有网络、本地文件与命令执行能力的 agent，并要求：

> 将本仓库下载到一个长期保留的本地目录。阅读 docs/INSTALL.zh-CN.md。在仓库根目录执行 node bin/mc-architecture.mjs setup --yes，再执行 doctor 和 demo。不要覆盖不同版本的现有技能；遇到冲突先说明。预览通过后告诉我如何重新加载技能。实际游戏连接单独配置，不修改存档。

Node 不符合要求时，在 Windows 使用 `install.cmd`；macOS/Linux 从 Node 官方来源安装支持的 LTS，再运行相同 CLI。这两个系统有 CI 检查配置，只有实际通过的运行记录才能称为该平台实测。

常用命令（均在仓库根目录）：

```text
node bin/mc-architecture.mjs setup --yes
node bin/mc-architecture.mjs doctor
node bin/mc-architecture.mjs demo
node bin/mc-architecture.mjs serve --project .workbench/demo
```

`setup --skill-dir "完整路径" --yes` 用于自选技能目录。`--home` 指定 Codex 主目录。仅在审阅旧技能后使用 `--replace-skill`；旧目录会保留为备份。`doctor` 检查环境/依赖；`demo` 生成并解析 NBT；工作台启动并不等于浏览器渲染已通过，第一次还应确认网页能显示和旋转模型。

## 连接 Minecraft

AI 助手、Minecraft 与游戏启动器需由用户准备。本项目不提供账号或 AI 额度，也不负责创建整套 Minecraft 运行实例。

1. 在启动器中选择或新建 **Fabric / NeoForge 的 Java 1.21.x 实例**。普通原版或 Forge 实例不能直接装这些模组。尽量使用独立测试实例。
2. 在安装向导中选中该实例的游戏目录，即包含 `mods`、`config` 的目录，**不是 saves 下的存档目录**。无法从实例 JSON 验证版本和加载器时会停止；核实后可显式传入 `--mc-version` 和 `--loader`。
3. 安装器从 MCPFabric 的官方 Modrinth 发布记录解析兼容稳定版及所需依赖，校验发布的 SHA-512 后放入 mods。MCP 客户端源码来自官方 GitHub，按明确提交下载、逐文件核对 Git blob 哈希，使用上游锁文件安装并构建。本项目不会把第三方 JAR 或客户端冒充自研成果。
4. 首次没有桥接配置时创建仅监听 `127.0.0.1`、需要令牌认证的配置。向导会询问是否允许建筑写入/命令；未选择时默认只读。令牌仅在本地配置中保存，agent 启动脚本运行时读取，不输出到报告。已有配置和无关 MCP 条目保留。
5. 已有 MCPFabric 或不同版本的依赖时，先检查现状。明确更新时加 `--replace-mod`，旧 JAR 会改名备份，避免同时加载两个版本。模组写入失败会恢复这批文件。
6. **重启选中的 Minecraft 实例**，并重新加载 agent 的 MCP 配置。程序不能把“JAR 下载成功”当作“游戏已连接”。如果 Codex 已有不同的 mcpfabric 配置，不会覆盖，会提供本地配置片段供合并。
7. 打开所需世界后运行连接检查。配置了只读模式时会报告没有写入能力。任何实际施工仍需用户明确授权及现场备份。

```text
node bin/mc-architecture.mjs bridge setup --instance "实例目录" --yes
node bin/mc-architecture.mjs bridge check --instance "实例目录"
```

确实要赋予所选实例建筑和命令能力时，在首次 `bridge setup` 后增加 `--allow-world-write`。这赋予工具能力，不代表授权修改任意世界。已有模组更新需同时显式选择 `--replace-mod`。Minecraft 正在运行时，安装仅在下次启动生效。

## 成功状态和排错

- **技能安装成功**：文件与依赖就绪；agent 可能仍需重载。
- **示例生成成功**：NBT 可解析；继续打开网页确认画面。
- **桥接安装成功**：兼容文件和连接配置就绪；游戏可能仍需重启。
- **connected=true**：选中版本的桥接已响应身份检查；多实例同版本时还要在 agent 中核对实际世界。
- **worldReady=true**：游戏里已有服务器/世界。
- **writeAvailable=true / commandAvailable=true**：有对应工具权限，施工仍需要授权。

网络失败会返回具体步骤，不重复下载无限重试。GitHub 限流时请稍后再试。网页地址以启动输出为准；多视图共用同一个预览服务，避免端口猜测和重复缓存构建。停止进程会关闭工作台与预览服务。

下载器会使用已配置的代理环境变量；Windows 下也可读取现有系统代理用于本次下载，不修改系统设置。代理下载需要 Node 24.5+ 或 22.21+；旧版本可运行 `install.cmd --portable-node` 获取用户目录内的新 LTS。证书校验保持开启。

本机安装记录位于仓库 `.workbench/`，包含用户路径，应留在本地。不要将整个工作目录、配置文件、令牌或真实存档上传 GitHub。使用发布脚本打包已提交的公开文件。

## 卸载

先停掉预览进程。只删除本工具安装的 `minecraft-architecture` 技能目录；有旧版本备份时可恢复。桥接卸载请依据 `.workbench/bridge/installation.json` 逐项处理本次安装的 JAR、连接配置及备份，保留游戏存档和其他模组。首发不提供自动递归删除整个游戏目录的操作。

Windows 使用便携 Node 时，可直接双击 workbench.cmd 启动示例网页；在终端中也可运行 workbench.cmd doctor 等命令。它读取安装记录中的 Node 路径，不依赖系统 PATH。
