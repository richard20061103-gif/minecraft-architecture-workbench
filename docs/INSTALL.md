# Installation and first run

The **full workbench ZIP** contains the unified installer. The skill-only ZIP remains available for advanced users who already manage their own dependencies. An AI agent/account, Minecraft and its launcher are separate prerequisites; AI usage may cost money.

## Windows

Extract the full ZIP to a permanent folder and double-click `install.cmd`. The launcher uses Node.js 22.16+ when present. Otherwise it asks before obtaining an official LTS portable runtime from nodejs.org, checks its SHA-256 against the official distribution manifest and installs it in user-local app data. It does not modify system PATH or require administrator privileges.

The terminal wizard selects a Codex/default or custom skill destination, installs locked dependencies, generates and parses an example NBT, and optionally configures a selected Minecraft instance. It asks before replacing a different existing skill and keeps a backup. Dependency-install failure leaves the original skill in place. Reload your agent afterward; file installation does not prove that a running agent has loaded the skill.

## Agent installation / macOS / Linux

Ask an agent with network, filesystem and execution access to download the repository into a permanent directory, read this guide, and execute from its root:

```text
node bin/mc-architecture.mjs setup --yes
node bin/mc-architecture.mjs doctor
node bin/mc-architecture.mjs demo
node bin/mc-architecture.mjs serve --project .workbench/demo
```

If Node is missing on macOS/Linux, install a supported official LTS first. CI is configured for these systems, but claim actual validation only after the corresponding jobs pass. Custom agents can use `setup --skill-dir "PATH" --yes`. Codex home can be set with `--home`. Explicit `--replace-skill` backs up a differing existing skill; do not choose it without reviewing the existing installation.

Open the printed workbench URL and verify that the model actually renders and rotates. `demo` validates NBT parsing, not browser graphics. Multiple views use one preview server and its actual resolved URL. Keep the process running while using the page.

Downloads can use existing proxy environment variables or, on Windows, the already configured system proxy, without changing system settings or disabling certificate verification. Proxy-aware download workers require Node 24.5+ or 22.21+; use `install.cmd --portable-node` to obtain a recent user-local LTS when needed. GitHub API rate limits are reported rather than retried indefinitely.

## Game bridge

Select an existing isolated **Fabric or NeoForge Java 1.21.x game instance**, not a world-save directory. Install the loader in the launcher first. The installer does not create a Minecraft installation or modify saves. When metadata is ambiguous it refuses to guess; verified `--mc-version` and `--loader` overrides are available.

```text
node bin/mc-architecture.mjs bridge setup --instance "INSTANCE" --yes
node bin/mc-architecture.mjs bridge check --instance "INSTANCE"
```

The installer resolves compatible stable MCPFabric and required mods from its official Modrinth release records, verifies their SHA-512 hashes, and obtains the MCP server from the official GitHub repository at a recorded commit. Individual source blobs are hash-checked, dependencies are installed from the upstream lockfile, and the client is built locally. Upstream licenses are retained. This requires network access and may hit GitHub rate limits.

An existing mod is not silently replaced. Use `--replace-mod` only after review; old JARs/dependencies are renamed to backups to avoid duplicate versions, and failed JAR writes are rolled back. Existing game configuration is preserved. New configuration uses authenticated localhost and defaults to read-only; use `--allow-world-write` explicitly to enable block writes and commands. This grants capability, not blanket permission to edit worlds. Tokens stay in local game configuration and are read by the launcher at runtime. Existing conflicting Codex MCP entries are preserved and a local merge fragment is provided. Other agents need to register the generated launcher themselves.

Restart the selected MC instance and reload agent MCP configuration. `installed` only means files/configuration are ready. `connected` verifies the mod/version response; for multiple same-version instances, also verify the actual world with your agent. `worldReady` requires a loaded world; `writeAvailable` and `commandAvailable` report capabilities. No connection is claimed while the game is closed. Live building still requires authorization, a correct-world check and a recoverable backup.

Java 1.21.8 is the established live baseline; other 1.21.x versions remain experimental. A missing compatible mod release leaves design and preview usable and reports that construction is unavailable.

## Local records and removal

`.workbench/` contains machine paths and setup records: keep it local. Do not upload credentials, saves or deployment journals. Release packaging uses committed public files only. To remove the installation, stop preview processes, remove only this skill, and use `.workbench/bridge/installation.json` to review specific mods/configuration/backups. No installer command recursively deletes Minecraft instances or worlds.

For detailed Chinese instructions, see [中文](INSTALL.zh-CN.md). Japanese and Spanish quick starts are in the main README; the command interface is the same.

On Windows, double-click workbench.cmd to open the example, or run workbench.cmd doctor in a terminal. It uses the recorded Node runtime path, including a portable installation that is not on PATH.
