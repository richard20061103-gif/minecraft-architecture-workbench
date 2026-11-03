# Live deployment through MCPFabric

An explicit live-construction request authorizes the bounded work; an open preview does not. Call `get_status` first, then verify active world ID, edition/version, dimension, intended bounds, protected objects and player position. Do not use screen automation as a fallback if the bridge is missing.

1. Export a complete proposed block map for the declared bounds (omitted cells mean air). The `diff` CLI requires both before and after maps to declare `complete:true` and identical bounds; never pass a partial capture as complete. Scan the live before-state. Capture exact block states, including explicit `minecraft:air`, at every changed cell, and block entities at every replaced/protected cell. A region read that reports IDs alone is insufficient for non-default states. Never assume an omitted live reading is air.
2. Take a recoverable backup and a live rollback journal. A copied region file from an open world may lag live state; do not rely on it alone.
   For another 1.21.x game version, run `mc-architecture compat --project project.json --probe game-probe.json --blocks target-blocks.json --out compat-report.json`. The probe is a locally recorded, verified summary of game version, NBT data version, data pack format, current world/dimension, bridge tool availability and known block IDs. The check catches mismatches; it does not prove that a target block state renders or functions correctly in-game. `stageReady` means these static gates passed, not that a live deployment was tested.
3. Build a bounded diff with `mc-architecture diff`; run `preflight` against the live scan. Every changed cell must equal its expected before-state or already equal its target. Resolve conflicts before any further writes. The generated order places additions/replacements bottom-up and removals top-down; inspect gravity blocks, rails, doors, plants and fluids for dependencies that need a separate targeted pass.
4. Stage conditional function batches with `mc-architecture stage --plan plan.json --out staged-build --version 1.21.8` (default 300 commands). For another 1.21.x version also supply its verified `--pack-format`; 1.21.9+ uses the newer `min_format`/`max_format` metadata. Install the pack only into the verified world, reload, check that it is enabled, then execute batches in order through MCPFabric. Validate the target version's block registry, NBT data version and pack format first. The bridge may report a function as “running” with `success=false`; readback determines actual completion.
5. Read the diff area once after construction. Check target blocks, stair/rail states, roof joints, water containment and occupied-zone lighting where relevant. Keep results and rollback plan.
6. To roll back, preflight the inverse against the current world. Never blindly restore if the user has edited the area since construction.

Broad `/place template` is reserved for an explicitly replaceable volume with a verified before-state. Otherwise it can destroy unrelated live blocks.

Minimal probe shape (replace example values with readings from the actual game and bridge):

```json
{"edition":"java","version":"1.21.8","dataVersion":4440,"packFormat":"81","worldId":"example-world","dimension":"minecraft:overworld","bridgeTools":["get_status","get_block","get_blocks_region","run_command"],"knownBlockIds":["minecraft:air","minecraft:stone"]}
```
