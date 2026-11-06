# Validation record for the first release candidate

Local validation date: 2026-11-06. Primary environment: Windows x64, Node.js 24.14.0. The download/bootstrap branch also obtained and launched official Node.js 26.13.0 LTS in an isolated project test directory after checking the official SHA-256 manifest. No system PATH, personal skill directory or real game instance was modified by these installer tests.

| Check | Evidence / status |
|---|---|
| Existing architectural core | Automated diff/protected-cell, conditional stage, rollback, lighting mathematics and compatibility tests pass |
| Fresh skill installation | Installed the actual complete skill and pinned dependencies into an isolated Codex home; doctor reports ready; example NBT parses |
| Repeat and failure recovery | Tests cover repeat setup, refusal of a differing existing skill, failed dependency update leaving original intact, and preserving unrelated skills |
| Preview lifecycle | Tests cover multiple views on one renderer service, paths containing spaces, actual resolved preview ports, occupied ports, shutdown and NBT HTTP responses |
| Browser rendering | Opened the generated example in the local workbench and visually confirmed rendered geometry in the embedded 3D viewer |
| Compatible bridge installation | Real official MCPFabric 0.8.0 + Java 1.21.8 Fabric and Fabric API 0.136.1 downloads/hash checks completed in a no-save test instance; upstream client source built from the matching v0.8.0 commit; Codex configuration generated in an isolated home |
| Bridge updates | Replaced the test-instance mod with a retained backup; conflicting existing MCP entries are preserved |
| Connection reporting | Automated authenticated mock-server checks distinguish wrong game version, no loaded world and absent write access; checks against closed real/test games correctly report not connected |
| Live Minecraft construction | Java 1.21.8 remains the established project baseline from previous actual deployments. The new installer has not yet been verified through a newly launched game with its newly generated connection configuration |
| macOS/Linux | CI matrix configured for Ubuntu, macOS and Windows with Node 22.16 and 24; results must be checked after pushing. Local Windows results do not establish other-platform support |
| Other MC versions/loaders | Compatible release selection is implemented, but other Java 1.21.x versions and NeoForge remain experimental until separately tested in-game |

The automated suite currently contains 16 tests. CI and local test output are the source of truth when this count changes. A generated NBT is not proof of graphical rendering; installed JARs are not proof of game connection; connected read access is not construction authorization.

## Before publishing

1. Run `npm run check`, `doctor`, `demo`, then open the example and verify rendering.
2. With a selected isolated game instance, restart the game, open a disposable world and run `bridge check`. Verify the actual world and capabilities through the agent. Keep new-installer live validation marked pending until this is done.
3. Inspect staged public files for personal paths, credentials, saves, raw site data and journals. `.workbench/` must stay untracked.
4. Commit reviewed files, run `node scripts/package-release.mjs`, and inspect the resulting ZIPs and SHA256SUMS.txt. Both archives must retain licenses and notices; the full package must include install.cmd and both installation guides.
5. Push reviewed source and inspect the CI results. Creating a matching `v<package version>` tag (or `v<package version>-rc.N` candidate tag) triggers tests and release packaging. Candidate tags are published as GitHub prereleases. Use `node scripts/package-release.mjs --tag v1.0.0-rc.1` when packaging that candidate locally. The release workflow refuses to overwrite an existing release.

An existing manual release at the same tag needs explicit reconciliation; do not silently replace its files. Release artifacts are built from the tagged commit, not from a developer's installation cache or uncommitted working tree.

Persistent write/command permission activation was not executed during installer QA: automatic approval review rejected that test. Fresh setup was tested with read-only bridge permissions. User opt-in permission handling is implemented but remains unverified by a real permission-change test.
