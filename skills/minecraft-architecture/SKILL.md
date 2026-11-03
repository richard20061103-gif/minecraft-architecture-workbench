---
name: minecraft-architecture
description: Survey, design, preview and safely construct Minecraft architecture, interiors and landscapes with rigorous aesthetics, circulation, lighting and rollback.
---

# Minecraft Architecture

One skill handles the full project. Reuse approved decisions and surveys. Scale effort to the change. An open preview does not authorize a world edit; an explicit construction request does. Once construction is authorized, do the whole bounded job without repeated aesthetic approval stops. The user owns final aesthetic acceptance.

## Route once, then execute

1. **Scope and evidence.** Identify concept, NBT preview, or live construction; world/version, approved bounds, protected objects and available tools. Reuse records only when world, bounds and freshness match. Survey missing facts once, then rescan only affected contacts. See [site survey](references/site-survey.md).
2. **Architectural plan.** Establish approach, silhouette, dominant style, material hierarchy, terrain connection, views, floor-by-floor uses, supports, stairs, furniture, paving and lighting. Trace eaves to real supports and stairs to landings and destinations. Inspect both distant silhouette and human-height experience. Use [aesthetic review](references/aesthetic-review.md), [floor design](references/floors.md) and [lighting](references/lighting.md).
3. **Buildable artifact.** Fix coordinates, levels, material states, circulation clearances, water boundaries and lighting openings. Generate exterior, interior and cutaway previews where useful. Use `scripts/run-build.mjs` and `scripts/preview.mjs`; read the [recipe API](references/recipe-api.md) only when needed. A browser model is not proof of in-game behavior.
4. **Live deployment.** On an explicit construction request, use MCPFabric rather than screen automation. Confirm the connected world and version. On other Java 1.21.x versions, run the static compatibility check and keep the experimental label. Capture live before-states, including explicit air at changed cells, and block entities; make a recoverable backup, compute a bounded diff, preflight every changed cell and stage ordered conditional commands. Read [deployment](references/deployment.md). Do not paste a broad structure over changed terrain merely to save time.
5. **Objective closeout.** Read back the changed area once. Check support, stair clearance, collision, water and actual `blockLight` where relevant. Make at most one targeted repair pass per failure and one recheck; report unresolved facts instead of looping. The user performs final aesthetic acceptance.

## Non-negotiable distinctions

- Preview and live construction have different permissions and evidence. A preview may propose floor and lighting systems but cannot prove in-game brightness, pathing, water behavior or entities.
- Light targets are project-specific acceptance criteria. Use the Dallas City Hall values and dark-point guardrails in [lighting](references/lighting.md) only for that project; do not impose them on unrelated builds without a user request.
- Vanilla `blockLight` and `skyLight` are separate 0–15 values, not physical lux or colored light. Test version-specific glass, carpet, slab and stair behavior in-game. A visually sealed opaque lamp cavity does not illuminate the room.
- Keep source and placement provenance. The supplied floor and hidden-light guides are methods; their linked video examples were not all verified frame by frame.
- Never publish personal saves, raw site captures, exact coordinates, deployment journals or third-party tutorial frames. Public case studies must be newly authored and anonymized.
- If world identity, version, bounds or expected before-state differs, stop writes and preserve the prepared artifact. An open-world region-file copy may lag live changes; pair it with a live rollback journal.

## References by task

- [Floor design](references/floors.md): floor modules, palette, thresholds, furniture and light integration.
- [Lighting](references/lighting.md): concealed light patterns, full census and stratified sampling mathematics.
- [Recipe API](references/recipe-api.md): NBT recipe functions and runner options. Read [Lodestone block states](references/lodestone/default-pack-block-states.md) only for nontrivial states; other Lodestone docs are under `references/lodestone/`.
- [Site survey](references/site-survey.md): bounded exploration and cache validity.
- [Aesthetic review](references/aesthetic-review.md): composition, structure, interiors and terrain.
- [Deployment](references/deployment.md): MCPFabric diff, preflight, conditional batches and rollback.
