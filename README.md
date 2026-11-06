# Minecraft Architecture Workbench

An agent skill for planning Minecraft architecture and landscapes, surveying sites, and preparing builds for preview or construction. It gives your agent a design process to follow alongside your own references and preferences.

The repository now contains one installable skill, a local browser workbench and a command-line tool. The agent does the design; the workbench makes the project, models and audit records inspectable. Live construction still needs a compatible game bridge.

[English](#english) · [简体中文](#简体中文) · [日本語](#日本語) · [Español](#español)

## English

### Start here: unified installation

Download the **full workbench ZIP** from Releases and extract it into a permanent folder. On Windows, double-click `install.cmd`: the wizard can obtain a verified, user-local official Node LTS runtime, install the skill and pinned dependencies, and generate an example NBT. It can also install compatible MCPFabric into an explicitly selected existing Fabric/NeoForge instance and prepare Codex configuration. Reload the agent afterward. Installation does not modify world saves.

For agents or macOS/Linux with Node.js 22.16+, run `node bin/mc-architecture.mjs setup --yes`, then `node bin/mc-architecture.mjs doctor` and `node bin/mc-architecture.mjs demo`. Run `npm start` to view that generated example. A fresh installation no longer starts with an empty project. Windows/Codex is the primary validation target; other OSes have CI jobs and must retain their verification status until those jobs pass.

Read the [installation guide](docs/INSTALL.md) for custom destinations, protected upgrades, bridge setup/check, restart requirements and troubleshooting. The skill-only ZIP is for users who manage dependencies manually. An AI agent/account and Minecraft remain separate prerequisites; AI usage may cost money.

After the Windows wizard, double-click `workbench.cmd` to open the example; it also works with the portable Node runtime that is not on PATH.

### What this project does

The skill helps an AI agent develop a build from the first site survey through design and review. Every project must plan its occupied floors and paving, thresholds, room use and lighting alongside silhouette, materials, entrances, circulation and terrain. Floor design and a lighting strategy are required workflow passes for buildings, plazas, paths and landscapes; their scope scales to the project. In-game lighting measurements are required when the agent has a live bridge. The project can be used for gardens, museums, houses and other styles; it does not enforce a Japanese aesthetic.

It also encourages the agent to record the area it has inspected and reuse suitable survey data. This reduces repeated investigation, but an old record still needs to be checked against later edits. The skill gives the agent instructions; the quality of a particular build depends on the brief, available tools and review. It cannot guarantee a perfect result in one attempt.

### What you need

- An AI agent that can load skills, such as Codex.
- A local copy of this project. Download the repository as a ZIP and extract it, or clone the repository.
- Node.js 22.16 or newer for the bundled NBT export and browser preview tools. Install the pinned dependencies in the skill folder with `npm ci --omit=dev` on first use.
- A compatible game connection or bridge, with read/write capabilities, only if you want the agent to inspect or edit an actual Minecraft world. This project does not include a bridge.

The NBT preview tool and the game connection have different jobs. Generating a model does not place it in Minecraft. Available block states, entities and placement features depend on your Minecraft version and the tools you use.

### Step-by-step installation

1. Extract this project. Inside `skills/`, locate `minecraft-architecture` and copy that single folder. Floor planning, lighting design/audit and the NBT build workflow are integrated into this skill.
2. Place this single folder in your agent's skills directory. For Codex, the usual location is `~/.codex/skills/`. On Windows this is typically `C:\Users\YOUR_NAME\.codex\skills\`; replace `YOUR_NAME` with your Windows account name. The resulting file should be `skills/minecraft-architecture/SKILL.md`.
3. Restart or reload the agent so it can discover the skill.
4. If you need NBT previews, run `npm ci --omit=dev` inside `minecraft-architecture` once. The builder scripts and pinned dependencies are bundled; no second Codex skill is needed.
5. Start a new conversation and ask the agent to use `$minecraft-architecture`. If the skill is not recognized, check the folder path and restart the agent again.

### Local workbench and CLI

From the repository root, run `node bin/mc-architecture.mjs init --project my-build --name "My build" --version 1.21.8`, then `node bin/mc-architecture.mjs serve --project my-build`. Open the printed local address. Put a generated NBT path in `my-build/project.json` under `artifacts.model` to see it in the workbench. Keep artifacts inside the project directory. `artifacts.interior` and `artifacts.cutaway` add alternate views; `artifacts.diff`, `artifacts.preflight` and `artifacts.lighting` show audit summaries. Restart the server after changing model paths. The skill's `run-build.mjs` and `preview.mjs` create the NBT and interactive viewer.

The CLI also offers `diff`, `preflight`, `rollback`, `compat`, `stage`, `lighting` and `lighting-sample`; run `node bin/mc-architecture.mjs help` for exact arguments. `diff` compares two complete sparse maps of exact coordinate/block-state records inside declared bounds, where omitted cells mean air. Each map must be `{ "complete": true, "bounds": { "min": [x,y,z], "max": [x,y,z] }, "blocks": [...] }`; a partial map is rejected. `preflight` requires a fresh explicit reading, including air, for every changed cell. `stage` writes conditional data pack functions and an inverse journal; the agent must verify the world, back it up, install the staged pack and invoke the functions through a bridge. The app never writes to a world on its own. For versions other than 1.21.8, `stage` requires an explicit verified data pack format; 1.21.9 and later use the new pack metadata schema. See [deployment](skills/minecraft-architecture/references/deployment.md) and [lighting math](skills/minecraft-architecture/references/lighting.md).

Java 1.21.8 is the established live baseline. Other released Java 1.21.x versions are experimental: run `compat` with a game probe and target palette to check version, data version, data pack metadata, world and bridge tools, then verify block states in-game. A preview may still be made without live-write support. The three [anonymized case studies](examples/) include newly drawn diagrams and illustrative local-coordinate layouts; no personal save or original tutorial frames are included.

### Your first preview

Tell the agent what to build, the approximate size, your references and what you want delivered. For example:

```text
Use $minecraft-architecture to design a modern hillside museum in Minecraft.
The site is about 100 by 80 blocks. Include an entrance plaza, a generous
central gallery, usable stairs and a lighting plan. Keep the existing trees
where possible. Create an interactive 3D preview; do not edit my world yet.
```

For a site-specific proposal, give the agent a world connection or an existing site survey if one is available. If neither is available, it can develop a concept from your descriptions, but it cannot claim to have inspected the terrain. Review the model from outside, inside and from a cutaway; ask for changes in a new version when needed.

### Building in a world

When you are ready, tell the agent which world and area it may change. It should confirm the world identity using the connection, take a recoverable backup, inspect the affected area and use a compatible write tool. Tell it which buildings, containers and landscape features to preserve. The skill calls for checks on stairs, water boundaries and other relevant risks before placement. Keep the backup until you are happy with the result.

A browser preview is a design aid. Its night mode does not establish actual in-game light levels, and it may not simulate fish, water behavior or every block state. Vanilla Minecraft block light itself has no warm or cool color based on the source; resource packs and shaders can affect appearance.

### Reusing survey data

Record each survey's world, dimension, bounds, source and timestamp with the project files. Reuse only records that cover the current task and remain valid after later edits. Refresh changed contacts rather than surveying the whole site again. Keep world data local unless you intend to share it.

### Troubleshooting

- **The skill is not found:** Check that `SKILL.md` is directly inside the skill folder and reload the agent.
- **The preview cannot start:** Check Node.js and run `npm ci --omit=dev` in the skill folder. The local preview server must remain running while you view it.
- **The agent cannot inspect or build in Minecraft:** A preview alone is insufficient. Check that a compatible bridge is installed, connected to the intended world and has the required capabilities.
- **The site has changed:** Tell the agent what was edited. It should refresh affected regions before using old survey records or placing blocks.

### License and attribution

This project is licensed under [Apache-2.0](LICENSE). The bundled builder scripts and documentation derive from [minecraft-builder-skill](https://github.com/mattzh72/minecraft-builder-skill) (Apache-2.0); the pinned [Lodestone](https://github.com/mattzh72/lodestone) dependency is MIT-licensed. Their notices remain with the bundled skill. Minecraft is a trademark of Mojang. This independent project is not affiliated with Mojang.

---

## 简体中文

### 从这里开始：统一安装

从 Releases 下载 **workbench 完整包**并解压到长期保留的目录。在 Windows 双击 `install.cmd`，按向导安装技能、锁定依赖并生成示例。缺少合适 Node 时，会先询问是否从官方来源下载经过校验的用户目录便携运行环境。实际游戏连接可在向导中选择已有的 Fabric/NeoForge 实例，安装兼容 MCPFabric 并配置 Codex。完成后仍需重新加载 agent；安装不会修改存档。

已有 Node.js 22.16+ 的 agent 或 macOS/Linux 用户，在仓库根目录依次运行 `node bin/mc-architecture.mjs setup --yes`、`node bin/mc-architecture.mjs doctor`、`node bin/mc-architecture.mjs demo`。随后 `npm start` 打开示例工作台，按输出地址查看模型。首发重点验证 Windows/Codex；其他系统的 CI 配置不等于已经实机通过。

完整步骤见[中文安装教程](docs/INSTALL.zh-CN.md)。技能单独包保留给熟悉手动配置的用户。AI 助手/账号和 Minecraft 需另备，AI 调用可能产生费用。桥接“已安装”和“已连接到游戏”会分别报告。

Windows 安装后双击 `workbench.cmd` 打开示例。它会使用安装记录中的 Node，即使系统 PATH 没有 Node 也能启动。

### 这个项目能做什么

这是一个供 AI 助手使用的 Minecraft 建筑设计技能。它把场地勘探、建筑设计、预览和施工前检查串成一套流程，提醒助手同时考虑外观、室内动线、材料、灯光和周围地形。你可以用它设计庭院、博物馆、住宅等不同风格的作品。

技能会要求助手记录已经调查过的范围，尽量复用仍然有效的资料。它提供的是工作方法，实际效果取决于需求、工具和检查情况，无法保证一次生成就达到最终效果。

### 开始前准备

1. 准备一个支持加载技能的 AI 助手，例如 Codex。
2. 下载并解压本项目。可以从 GitHub 下载 ZIP 或克隆仓库。
3. 如需导出 NBT 和打开网页预览，准备 Node.js 22.16 或更新版本；构建脚本已经包含在唯一的技能目录里。
4. 如果需要助手读取或修改游戏存档，还要另外准备能连接游戏的工具，例如具有相应读写能力的兼容桥接工具。本项目不包含这个连接工具。
5. 勘探记录可保存为普通项目文件，无需额外的 Python 工具。

### 手把手安装

1. 打开解压后的项目文件夹，在 `skills/` 中找到唯一的 `minecraft-architecture` 文件夹并复制。地板规划、照明设计与验收、NBT 建造流程都已整合在这个技能里。
2. 将这一个文件夹放进助手的技能目录。Codex 通常使用 `~/.codex/skills/`；Windows 上一般是 `C:\Users\你的用户名\.codex\skills\`。安装后应能找到 `skills/minecraft-architecture/SKILL.md`。
3. 重启或重新加载助手，让它发现这个技能。
4. 如需 NBT 预览，在 `minecraft-architecture` 文件夹中运行一次 `npm ci --omit=dev`。构建脚本与依赖清单已随唯一技能打包。
5. 开一个新对话，输入 `$minecraft-architecture` 并描述需求。如果助手找不到技能，检查文件夹层级，再重启一次。

### 本地工作台与命令行

在仓库根目录运行 `node bin/mc-architecture.mjs init --project my-build --name "我的建筑" --version 1.21.8`，再运行 `node bin/mc-architecture.mjs serve --project my-build`，打开输出的本机地址。把生成的 NBT 路径写入 `my-build/project.json` 的 `artifacts.model`，即可在工作台查看旋转模型。`help` 命令列出差异生成、现场预检、回退、数据包分批施工和照明统计的参数。工作台本身不会写入存档；实际施工要由智能体确认世界、备份并通过兼容桥接执行。三个[匿名案例](examples/)保留决策与修正过程，不包含真实存档、原坐标或教程截图。

Java 1.21.8 已做实机验证；其他已发布的 Java 1.21.x 暂列实验性。施工前需核对该版本的方块状态、NBT 数据版本、数据包格式和桥接能力。没有兼容桥接仍可设计、导出和预览。

### 做出第一个预览

说明建筑类型、尺寸、参考图、希望保留的东西，以及这次只要预览还是要进入游戏施工。例如：

```text
使用 $minecraft-architecture，设计一座山坡上的现代博物馆。
场地约 100 × 80 格，包含入口广场、宽敞的中央展厅、可走的楼梯和照明。
尽可能保留现有树木。先生成可旋转的 3D 预览，暂时不要修改存档。
```

如果需要根据真实地形设计，可以提供可用的世界连接或已有勘探记录。没有这些资料时，助手仍能根据描述制作概念方案，但不能声称已经调查过地形。预览时可以查看外观、室内和剖面，把需要修改的地方集中告诉助手。

### 进入游戏施工

明确告诉助手可以修改哪个世界、哪片区域，以及哪些建筑、箱子和地形需要保留。施工前应通过连接工具确认世界身份，做好可恢复备份，并检查受影响区域。生成 NBT 或打开网页预览不会自动在游戏中放置方块。

网页夜景只能帮助判断设计方向，不能证明游戏内的实际亮度，也未必模拟鱼、水流和全部方块状态。原版 Minecraft 的方块光不会因光源不同而产生暖色或冷色；材质包和光影可以改变视觉效果。

### 复用勘探资料

在项目文件中记录每次勘探的世界、维度、坐标范围、来源和时间。只复用覆盖当前任务且未被后续修改推翻的资料；场地变动时只补查受影响位置。存档和勘探资料默认留在本地。

### 遇到问题

- **找不到技能**：确认 `SKILL.md` 直接位于 `minecraft-architecture` 文件夹内，重启助手。
- **网页预览打不开**：检查 Node.js、构建器和依赖是否安装，预览服务运行期间才能访问本机页面。
- **无法读取或建造**：检查游戏连接工具是否连接了正确世界，以及是否具备需要的读写能力。
- **场地发生变化**：告诉助手变化位置，让它补查受影响的区域，再使用旧记录施工。

本项目采用 [Apache-2.0](LICENSE) 许可。构建器和 Lodestone 分别采用自己的许可，详见英文部分的链接；Minecraft 是 Mojang 的商标，本项目与 Mojang 无关联。

---

## 日本語

### 統合インストール

Releases から **workbench 完全版 ZIP** をダウンロードし、保存しておく場所に展開します。Windows では `install.cmd` をダブルクリックします。必要な場合は公式 Node LTS のユーザー用ポータブル環境を確認付きで取得し、チェックサムを検証します。スキルと固定依存関係をインストールし、サンプル NBT を生成します。選択した既存の Fabric/NeoForge インスタンスには対応 MCPFabric と Codex 接続を設定できます。ワールドは変更しません。完了後はエージェントと、必要に応じてゲームを再起動してください。

Node.js 22.16 以降を用意した環境では、ルートで `node bin/mc-architecture.mjs setup --yes`、`node bin/mc-architecture.mjs doctor`、`node bin/mc-architecture.mjs demo` を順に実行し、`npm start` で表示します。主な検証対象は Windows/Codex です。他 OS は CI の実行結果を確認してください。インストール済み、接続済み、ワールド操作可能の状態は別々に報告します。詳しくは [インストールガイド](docs/INSTALL.md) を参照してください。AI エージェント、利用料金、Minecraft 本体は別途必要です。

### できること

Minecraft の建築や景観を計画する AI エージェント向けのスキルです。敷地調査、外観、室内動線、素材、照明、地形とのつながりを一つの作業として扱います。庭園だけでなく、美術館や住宅など、さまざまな様式に使えます。

調査済みの範囲は記録して再利用できます。ただし、調査後に地形が変わった場合は再確認が必要です。このスキルだけで完成度や一度での完成を保証するものではありません。

### 用意するものとインストール

1. Codex など、スキルを読み込める AI エージェントを用意します。
2. このプロジェクトをダウンロードして展開し、`skills/minecraft-architecture` フォルダーを探します。
3. フォルダーごとエージェントのスキル保存先へコピーします。Codex の通常の保存先は `~/.codex/skills/` です。Windows では通常 `C:\Users\ユーザー名\.codex\skills\` です。コピー後に `minecraft-architecture/SKILL.md` が存在することを確認してください。
4. エージェントを再起動または再読み込みします。
5. NBT とブラウザープレビューを使う場合は Node.js 22.16 以降を用意し、`minecraft-architecture` フォルダーで `npm ci --omit=dev` を一度実行します。ビルダースクリプトは同じスキルに含まれています。
6. 新しい会話で `$minecraft-architecture` と指定します。認識されない場合はフォルダー構造を確認して再起動してください。

### ローカル作業画面と CLI

リポジトリのルートで `node bin/mc-architecture.mjs init --project my-build --name "My build" --version 1.21.8` を実行し、続けて `node bin/mc-architecture.mjs serve --project my-build` を実行します。表示されたローカル URL を開きます。生成した NBT のパスを `my-build/project.json` の `artifacts.model` に記入すると、回転可能なモデルを表示できます。`help` で差分、事前検査、復元、分割施工、照明集計のコマンドを確認できます。画面だけではワールドを書き換えません。実際の施工にはワールド確認、バックアップと対応する接続ツールが必要です。[匿名化した三つの事例](examples/)には個人のセーブデータや元の座標を含めていません。

Java 1.21.8 は実機確認済みです。他の公開済み 1.21.x は実験的対応で、ブロック状態、NBT データバージョン、データパック形式、接続機能の確認が必要です。

### 最初の依頼例

```text
$minecraft-architecture を使い、約 100 × 80 ブロックの敷地に
現代的な美術館を設計してください。入口広場、中央展示室、歩ける階段、
照明を含め、既存の木をできるだけ残してください。
まず 3D プレビューを作り、ワールドはまだ変更しないでください。
```

実際の地形に合わせるには、ワールドへの接続または既存の調査資料が必要です。資料がなければ、説明に基づく構想として設計します。外観だけでなく、室内や断面も確認してください。

ゲーム内の読み取り・建設には、対応する別の接続ツールが必要です。建設を依頼するときは対象ワールドと範囲、残したい建物や持ち物を指定してください。変更前にワールドの識別、復元可能なバックアップ、施工範囲の確認を行います。プレビューから自動的にブロックは配置されません。

プレビューの夜景は実際の明るさや水流、魚の再現を保証しません。バニラのブロック光は光源ごとに暖色・寒色へ変化しませんが、シェーダーやリソースパックで見え方は変わります。

### 調査記録とトラブルシューティング

調査範囲、ワールド、ディメンション、取得日時と出典をプロジェクトファイルに記録します。後で変更された場所だけ再調査し、古い記録の鮮度と安全性を確認します。

スキルが見つからない場合は `SKILL.md` の位置を確認します。プレビューが開かない場合は Node.js と構築ツールの依存関係、ローカルサーバーの動作を確認してください。ゲームに接続できない場合は、対応する接続ツールと対象ワールドを確認します。

本プロジェクトは [Apache-2.0](LICENSE) です。外部ツールのライセンスは英語版をご覧ください。Minecraft は Mojang の商標であり、本プロジェクトは Mojang と提携していません。

---

## Español

### Instalación unificada

Descarga el **ZIP completo workbench** desde Releases y extráelo en una carpeta permanente. En Windows abre `install.cmd`: el asistente puede descargar, con tu confirmación, un Node LTS portátil oficial, verificar su suma de comprobación, instalar la habilidad y las dependencias fijadas, y generar un NBT de ejemplo. También puede instalar MCPFabric compatible en una instancia Fabric/NeoForge existente que selecciones y preparar la conexión de Codex. No modifica partidas. Recarga el agente y reinicia el juego cuando se indique.

Con Node.js 22.16 o posterior, ejecuta desde la raíz `node bin/mc-architecture.mjs setup --yes`, `node bin/mc-architecture.mjs doctor` y `node bin/mc-architecture.mjs demo`. Después, `npm start` abre el ejemplo. Windows/Codex es el objetivo principal de validación; comprueba los resultados de CI para otros sistemas. Instalado, conectado y con capacidad de escribir son estados distintos. Consulta la [guía](docs/INSTALL.md). El agente y su cuenta, los posibles costes de IA y Minecraft se preparan por separado.

### Qué hace

Esta habilidad ayuda a un agente de IA a planificar arquitectura y paisajes de Minecraft. Reúne el estudio del terreno con las decisiones sobre volumen, materiales, recorridos, interiores e iluminación. Sirve para jardines, museos, viviendas y otros estilos.

El agente puede registrar las zonas ya estudiadas y reutilizar los datos que sigan siendo válidos. Si el terreno cambia, debe revisar las zonas afectadas. La habilidad guía el trabajo, pero la calidad final depende de las indicaciones, las herramientas y la revisión; no garantiza un resultado perfecto al primer intento.

### Requisitos e instalación

1. Usa un agente capaz de cargar habilidades, como Codex.
2. Descarga y descomprime este proyecto. Busca la carpeta `skills/minecraft-architecture`.
3. Copia la carpeta completa al directorio de habilidades del agente. En Codex suele ser `~/.codex/skills/`; en Windows normalmente es `C:\Users\TU_USUARIO\.codex\skills\`. Comprueba que la ruta final termine en `minecraft-architecture/SKILL.md`.
4. Reinicia o recarga el agente para que detecte la habilidad.
5. Para exportar NBT y abrir vistas previas, usa Node.js 22.16 o posterior y ejecuta una vez `npm ci --omit=dev` dentro de `minecraft-architecture`. Los scripts de construcción ya están incluidos en esa única habilidad.
6. Inicia una conversación nueva y solicita `$minecraft-architecture`. Si no aparece, revisa la ruta y reinicia el agente.

### Panel local y CLI

En la raíz del repositorio, ejecuta `node bin/mc-architecture.mjs init --project my-build --name "Mi edificio" --version 1.21.8` y luego `node bin/mc-architecture.mjs serve --project my-build`. Abre la dirección local indicada. Escribe la ruta del NBT generado en `my-build/project.json`, dentro de `artifacts.model`, para verlo en el panel interactivo. El comando `help` muestra cómo crear diferencias, revisar el estado actual, preparar una reversión, dividir la obra en funciones y calcular la iluminación. El panel por sí solo no modifica el mundo: la construcción requiere verificar el mundo, guardar una copia y usar una conexión compatible. Los [tres casos anonimizados](examples/) no contienen partidas personales, coordenadas originales ni fotogramas del tutorial.

Java 1.21.8 se ha comprobado en el juego. Las demás versiones publicadas de Java 1.21.x son experimentales: hay que verificar estados de bloques, versión de datos NBT, formato del paquete y capacidades de la conexión antes de construir.

### Primera vista previa

Describe el edificio, el tamaño, las referencias, lo que debe conservarse y el resultado que esperas. Por ejemplo:

```text
Usa $minecraft-architecture para diseñar un museo moderno en una ladera.
El terreno mide aproximadamente 100 × 80 bloques. Incluye una plaza de entrada,
una galería central, escaleras transitables e iluminación. Conserva los árboles
si es posible. Genera primero una vista 3D y no modifiques todavía mi mundo.
```

Para adaptar el diseño a un lugar real, proporciona una conexión al mundo o un estudio previo del terreno. Sin esos datos, el agente puede preparar una propuesta conceptual, pero no afirmar que ha inspeccionado el lugar. Revisa también el interior y los cortes del edificio.

### Construcción y seguridad

Para leer o modificar un mundo hace falta una conexión compatible con las capacidades necesarias; este proyecto no incluye esa conexión. Indica el mundo, los límites de la obra y los elementos que deben conservarse. Antes de colocar bloques, el agente debe confirmar el mundo, preparar una copia recuperable y revisar la zona afectada. Crear un archivo NBT o una vista previa no coloca bloques en el juego.

La iluminación nocturna del visor es orientativa: no demuestra el nivel de luz del juego ni reproduce necesariamente peces, líquidos o todos los estados de los bloques. La luz de bloques de Minecraft original no cambia de color según la fuente; los sombreadores y paquetes de recursos pueden alterar su aspecto.

### Registro de estudios y ayuda

Guarda en los archivos del proyecto el mundo, la dimensión, los límites, la fuente y la fecha de cada estudio. Vuelve a estudiar solo las zonas modificadas y comprueba que los registros anteriores sigan siendo válidos.

Si el agente no encuentra la habilidad, comprueba la ubicación de `SKILL.md` y reinícialo. Si falla la vista previa, revisa Node.js, las dependencias del constructor y el servidor local. Si falla la conexión al juego, comprueba la herramienta de conexión y el mundo seleccionado.

Este proyecto usa [Apache-2.0](LICENSE). Consulta los enlaces de la sección inglesa para las licencias de las herramientas externas. Minecraft es una marca de Mojang; este proyecto independiente no está afiliado a Mojang.
