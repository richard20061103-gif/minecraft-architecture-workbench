# Release checklist

The unified installer and packaging workflow are documented in [installation](docs/INSTALL.md) and the [validation record](docs/VALIDATION.md). Publish only the reviewed candidate: `node scripts/package-release.mjs` refuses a dirty working tree. A matching `v<package version>` tag triggers the cross-platform checks and creates the GitHub release with two ZIPs and SHA256SUMS.txt after those checks pass. Existing releases are not overwritten. The new installer still requires a freshly launched game connection check before it can be described as verified end to end.

1. Run `npm run check` and the skill's example NBT build. Open the workbench with a sample project and check the interactive viewer.
2. Run `npm pack --dry-run` inside `skills/minecraft-architecture`; inspect the file list for the single skill, pinned lockfile, license and reference files.
3. Search the staged repository for personal paths, IPs, world IDs, coordinates, raw screenshots, save files, secrets and generated journals. Publish only the three newly written anonymous case notes.
4. Check `NOTICE`, both Apache license copies and pinned Lodestone MIT attribution. The builder source is derived from the Apache-2.0 project listed in `NOTICE`.
5. On Java 1.21.8, verify a fresh-world preview, a protected-position refusal, a before-state conflict refusal, a small conditional data pack deployment and inverse preflight. Keep a world backup.
6. For each additional released Java 1.21.x version, record its game data version, data pack format, supported block states and MCPFabric capability list. Mark live construction experimental until that version receives in-game verification. Never silently treat an NBT viewer result as live support.
7. Review all four README languages for the same installation, compatibility and safety claims. Tag a release only after these checks pass. Pushing source is separate from creating the release tag; do not tag an unverified candidate.
