# Site Visual Reference — Uthai Hospital Wastewater Treatment

Status: PARTIALLY VERIFIED FROM USER-SUPPLIED PHOTOGRAPHS

Last updated: 2026-08-21

## Reference Asset Policy

The original hospital-site reference photographs are archived privately outside Git at:

`L:\My Drive\A-Wiki-Data\raw\environment\env-wastewater-webapp\digital-twin\site-reference\2026-08-21`

Inventory:

- `ground/`: 6 original ground photographs
- `drone/`: 3 original drone photographs
- `README.md`: classification and handling rules
- `MANIFEST.sha256`: integrity hashes for all 9 images

The external game screenshots are not part of this confidential raw archive. This file preserves their high-level style observations without storing or copying the images.

A future agent may inspect the private folder when the Drive is mounted. If it is unavailable, continue from this written brief or ask the user to restore access. Do not add original hospital photographs, drone imagery, or scanned construction drawings to the public repository/frontend bundle without explicit permission and a privacy/security review.

## Ground Reference Set — Observed Physical Features

### Operations building

- small cream/off-white building
- gray-blue corrugated roof and broad eaves
- glass double doors
- dark blue Thai/English wastewater-treatment sign
- lawn, hedge, potted plants, and a maintained garden-like edge

### Low rectangular process basins

- parallel, open, low concrete compartments
- internal partition walls and channels
- exposed turquoise PVC pipework
- salmon/red valve handles
- gray utility shed nearby
- water/solids appearance varies; some compartments contain leaves or dark material

### Settling basin area

- larger raised rectangular concrete basin
- internal bridge/baffle/weir-like elements visible
- blue Thai sign reading `บ่อตกตะกอน`
- pump assembly under a small red corrugated canopy
- beige and turquoise pipework

### Aeration Tank — Phase 1 focal asset

- tall cream/warm-gray rectangular concrete basin
- blue Thai sign reading `บ่อเติมอากาศ`
- red ladder/rail/piping on the left/near side
- two visible equipment positions at the water surface
- visibly disturbed/churning brown-gray water
- grass, hedge, trees, and nearby hospital buildings around the tank

The exact equipment type and dimensions are not confirmed by photographs alone.

## Process-topology reference added 2026-08-24

The user supplied a hand-drawn wastewater process/layout diagram and explicitly confirmed that Uthai Hospital uses an **Activated Sludge** process. Its durable process interpretation is recorded in:

`11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`

Use that file for hydraulic/process connections (main liquid path, RAS, WAS, sludge-drying filtrate return, chlorination, bypass/emergency paths). This site-visual-reference file remains authoritative for visual appearance and spatial/photo evidence. The process drawing establishes connection topology, but does not by itself resolve exact site coordinates, underground pipe geometry, valve logic, or live equipment state.

## Drone Reference Set — Spatial Context

Observed/inferred:

- hospital campus contains dense low-rise buildings with many blue roofs and solar panels
- คลองข้าวเม่า runs along the vegetated edge of the hospital site
- the treatment area appears likely to be the small cluster of open basins near the upper-right/canal-side portion of the top-down images
- vegetation separates parts of the treatment zone from the canal

Uncertain:

- exact treatment-zone boundary
- true north/orientation
- exact distance from each basin to the canal
- inlet/outlet or discharge route
- elevation differences

Do not convert the likely location into a precise model until the user annotates the boundary or a site plan confirms it.

## Style Reference Set — High-Level Qualities Only

The user likes a cozy fishing-game presentation with:

- three-quarter/isometric composition
- warm sunlit atmosphere
- saturated but natural color separation
- simplified rounded forms
- clear foreground/midground/background layers
- readable water as a focal material
- natural framing with grass, rocks, plants, and small structures
- strong mobile portrait readability

Do not copy:

- characters or fish
- fishing mechanics
- HUD, currency, minimap, joysticks, or game buttons
- exact palette, map, textures, props, or layout
- copyrighted visual assets

## Approved Translation into the Twin

### Scene tone

Professional operational diorama with a warm, approachable physical world. The surrounding UI remains Aura, not game UI.

### Camera

- three-quarter overhead view
- focal tank fills most of the scene
- enough top surface is visible to understand water/aeration behavior
- maintain a stable mobile composition rather than unlimited exploration

### Phase 1 environment

Include only minimal context needed for recognition:

- grass platform
- restrained hedge/plant masses
- turquoise pipe accent
- red ladder/rail accent
- blue tank sign

Defer the full hospital campus, operations building, canal geometry, and other treatment stages.

### Water

- muted teal/olive/brown base appropriate to wastewater
- restrained sky/cyan highlights
- no clear ornamental-pond appearance
- no fish, lilies, visible pebbled bottom, or purity cues
- unknown level remains unknown; do not invent a default water height in latest/manual mode

### Aeration equipment and motion

- physical equipment may be represented neutrally at two observed positions
- current telemetry is aggregate; do not show independent unit status
- when aggregate state is true or explicit demo data is active, show a system-level aeration/turbulence cue
- when state is unknown, no running animation and DOM text remains `ไม่มีข้อมูล`
- reduced motion uses a stable still cue without continuous movement

### Selection

- prefer a subtle base/rim/ground contact highlight
- do not recolor the whole tank as a status indicator
- preserve DOM focus and non-Canvas selection access

## Highest-Value Additional References

Priority order:

1. Annotated drone image marking treatment-zone boundary, Aeration Tank, settling tank, operations building, entrance, canal side, and north if known.
2. Closest available 90-degree top-down drone crop of the treatment zone.
3. Oblique drone or ground photographs from four corners of the treatment zone.
4. General Arrangement/site plan with scale, north arrow, labels, and tank dimensions.
5. Aeration Tank plan and section/elevation with length, width, wall height, design water level, equipment positions, pipes, ladder, and walkway.
6. Equipment schedule or close photographs sufficient to identify the aeration equipment type and count.

Not needed yet:

- reinforcement schedules
- foundation details
- whole-hospital electrical plans
- full building plans
- detailed drawings for later treatment stages

## Scanned Drawing Guidance

- photograph/scan perpendicular to the page
- include title block, drawing number, scale, revision, and north arrow where present
- use overlapping images if the sheet is too large
- crop/redact unrelated hospital security or patient-area information
- treat drawings as reference material, not public frontend assets
