# First-run readiness

The full repository provides shared CLI and Windows wizard installation: https://github.com/richard20061103-gif/minecraft-architecture-workbench . Read its README and docs/INSTALL.md before setup. The installed skill stays self-contained for NBT generation; installing the full workbench is optional when the user already has working build/preview tools.

When the user asks to install the repository, download it to a persistent directory and use `node bin/mc-architecture.mjs setup --yes`, `doctor`, then `demo` from its root. Review existing differing skills before `--replace-skill`. Windows `install.cmd` handles a missing Node runtime with an explicit download prompt. Do not assume an arbitrary agent can load skills or that file installation has reloaded a running client.

`doctor` reports local prerequisites. `demo` parses a generated NBT, but the browser must still be opened to confirm graphics. `serve --project .workbench/demo` starts that example. Use its actual printed URL and keep the server alive while delivering a preview; never invent a successful preview URL from a requested port.

`bridge setup --instance DIR --yes` installs the compatible MCPFabric and required dependencies for a user-selected existing instance and prepares Codex connection configuration. Existing differing mods require reviewed `--replace-mod`. The bridge's upstream server is downloaded and built separately; it is not bundled as our own code. New game configurations default to authenticated localhost and read-only unless `--allow-world-write` is explicitly requested. Installation does not edit saves or automatically grant construction authorization.

After game/client restart, `bridge check --instance DIR` distinguishes connection, loaded world and write/command capabilities. Verify the actual world through the bridge before construction, especially when multiple instances exist. If the bridge is unavailable, keep design and NBT preview usable, state the missing step once, and do not try UI automation or repeated unbounded probes.
