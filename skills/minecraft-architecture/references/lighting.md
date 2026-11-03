# Lighting design and acceptance

Design light in three roles: circulation, task and accent. Use a few coherent physical systems such as recessed ceiling/cove, upper wall wash, wall-foot, step-side, cabinet/plinth, ground seam, path marker or waterfront-edge light. Give each source a real propagation opening and conceal it from ordinary sightlines. Use `minecraft:light` only when command/creative mode is authorized and physical fixtures cannot meet the design; record each coordinate and level for rollback. Vanilla colored glass does not color block light. Test actual version-specific opacity and collision.

## Define the measurement population

Set a bounded zone, floor elevations, time/weather and walkability mask before reading values. Measure `blockLight` at a consistent eye-height cell above each eligible walkable floor position; adjust for slab/carpet height. Store `skyLight` separately. Keep known risk points (stairs, landings, corners, recesses, exhibit backs, glazing and furniture gaps) separate from area-sample means, but include them in minimum/dark-point reporting. Report every floor and materially different room/zone, then compute an overall area-weighted mean. A bright hall must not mask a dark room.

Use project-specific targets. For the Dallas City Hall project only, indoor mean 9–11 inclusive, outdoor occupied path/plaza mean 5–8 inclusive; measured interior minimum >=7 and P05 >=8, outdoor minimum >=3. These are project criteria, not universal safety or lighting standards.

## Full census, preferred when practical

Read every eligible integer x/z position. For each zone report N, arithmetic mean, median, minimum, nearest-rank P05 (`ceil(0.05 N)` after sorting), count and share below its lower bound, plus risk-point coordinates. Compare unrounded means to thresholds; round only for display. A census certifies only the declared mask, height and world/time state.

## When a census is too costly

Choose spatial strata before seeing light values: at least separate floors; split distinct rooms/corridors/atrium edges/outdoor areas. Draw a reproducible random sample without replacement across each whole footprint, recording the random seed and selection method. Record population N_h, sample n_h >=2, sample mean x̄_h, sample variance s²_h and weight W_h=N_h/N, where N=ΣN_h. A stratum fully measured is a census stratum and contributes zero sampling variance. If adjacent cells are strongly correlated, define spatial blocks before sampling and treat each sampled block—not every cell inside it—as one sampling unit.

`μ̂ = Σ_h W_h x̄_h`

`v_h = W_h² (1 − n_h/N_h) s²_h/n_h`

`SE = √(Σ_h v_h)`

For an approximate 95% interval use `μ̂ ± t_(0.975,ν) SE`, with Satterthwaite `ν = (Σ_h v_h)² / Σ_h [v_h²/(n_h−1)]`, summing only over sampled strata with `v_h > 0` and `n_h >= 2`. If every stratum is a census, report the exact mean without an interval. If the denominator is zero or the approximation is not meaningful, do not claim a confidence interval. The mean criterion passes only when the entire interval lies inside the target band. Use one preplanned sample; if it is inconclusive, make one planned sample expansion or census the uncertain zone. If that still cannot establish a pass, report “inconclusive” rather than repeatedly increasing sample size. Report stratum counts, seed/selection method, estimate, interval and assumptions.

A regular grid is deterministic coverage, not a probability sample, so it has no probability confidence interval. An interval for the mean does not prove the true minimum or P05, nor certify unmeasured cells. To certify a minimum or P05, census the declared walkable mask; a sample can report these only as diagnostics. For the Dallas City Hall thresholds, an estimated mean alone is not a full light acceptance: report the minimum/P05 as unverified unless the mask was censused. Inspect all known risk points in either case.

## Correction loop and report

Map failing points to coordinates and causes. Make the single bounded correction pass allowed by the main workflow, then remeasure the affected zone once using the same mask; check adjacent zones only if the change can influence them. If the criterion still fails, report the unresolved values instead of repeating. Keep pre/post raw readings, source coordinates, rollback data and limitations. A preview or screenshot cannot pass an in-game light audit.

## Workbench input files

`mc-architecture lighting` takes a readings array of `{zone,x,y,z,blockLight}` and a zones array of `{id,population,lower,upper,min,p05Min}`. `population` must equal the number of measured eligible cells for that zone; coordinates must be unique. The CLI refuses to label incomplete or duplicate readings a full census. `min` and `p05Min` are optional independent pass criteria. Keep the declared walkability mask, eye height, time/weather and sky light alongside the raw file for reproducibility.

`mc-architecture lighting-sample` takes `{method:"random-without-replacement",seed,strata:[{id,population,values:[...]}]}` and a target `{lower,upper}`. The tool reports weighted mean, finite-population variance, Satterthwaite degrees of freedom and a conservative tabulated 95% t interval. A constant sample smaller than its population has no certifying interval. It does not certify an unmeasured minimum or fifth percentile. Record how spatial blocks were selected when neighboring cells correlate.
