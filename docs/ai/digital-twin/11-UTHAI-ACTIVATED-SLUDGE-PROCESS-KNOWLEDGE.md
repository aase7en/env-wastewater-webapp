# Uthai Hospital Wastewater Treatment — Activated Sludge Process Knowledge

Status: USER-CONFIRMED PROCESS TOPOLOGY REFERENCE

Last updated: 2026-08-24

## Purpose

This file is durable project knowledge for design, Digital Twin, process-flow UI, analytics, alarms, simulation, and future data integration for the wastewater treatment system at **โรงพยาบาลอุทัย**.

The user explicitly identified the treatment process as an **Activated Sludge** system and supplied a hand-drawn process/layout diagram on 2026-08-24. Future agents must use this file as the process-topology reference instead of reconstructing the plant from chat memory.

This document records what the supplied diagram supports. It does **not** assert live equipment state, valve state, flow rate, operating schedule, control logic, or dimensions that are not shown/confirmed.

## Source

User-supplied diagram filename:

`ผัง+Job บ่อบำบัด.png`

Source received: 2026-08-24

SHA-256 of the uploaded source used for this reading:

`5df05707a1211d3b70ca1f01e11807b8c514cc8197e2632230489ef8eee42043`

The raw diagram is **not committed to this repository** because it depicts hospital infrastructure. Preserve raw drawings privately unless the user explicitly approves repository/public storage. This written abstraction is the repository SSoT.

## System Type

User-confirmed treatment type:

**Activated Sludge**

The diagram explicitly shows the characteristic biological-treatment loop:

- aeration tank;
- sedimentation/clarifier tank;
- return sludge line and return-sludge pumps;
- excess-sludge wasting line;
- sludge drying beds;
- final chlorination/contact stage.

## Process Topology — High-Level

For software and Digital Twin purposes, treat the wastewater system as several connected flow loops rather than one straight pipe.

### A. Main liquid-treatment path

```text
Wastewater collection system
        ↓
Pump sump / wastewater holding-pump basin
  - coarse trash screen
  - wastewater pump 1
  - wastewater pump 2
        ↓
Fine screening at aeration inlet
        ↓
Aeration Tank
  - aerator 1
  - aerator 2
        ↓  overflow from aeration tank
Sedimentation / Clarifier Tank
        ↓  clarifier overflow
Flow-measurement weir basin
        ↓
Chlorine contact tank
        ↓
Treated effluent discharge
```

The diagram also shows a labelled **`By pass บ่อสูบ`** arrangement on the influent route near the aeration inlet. The diagram establishes that this bypass path exists, but does not define valve logic, when it is used, or whether it is normally open/closed.

### B. Return Activated Sludge (RAS) loop

```text
Sedimentation / Clarifier Tank
        ↓
sludge suction pipe
        ↓
return-sludge pumps
        ↓
return sludge pipe
        ↓
Aeration Tank
```

This loop is important to the Activated Sludge process model. In UI/Digital Twin language it should be represented separately from the clarified-water outlet.

Do not infer individual return-pump status unless a real data source exists.

### C. Waste / Excess Activated Sludge (WAS) path

```text
Sedimentation / Clarifier Tank
        ↓
excess-sludge line
        ↓
Sludge drying beds
```

The diagram shows a dedicated excess-sludge path from the settling/sludge-pumping area toward the drying beds.

### D. Sludge-drying filtrate return

```text
Sludge drying beds
        ↓
filtrate / remaining wastewater from drying-bed filtration
        ↓
return toward the wastewater collection / pump-sump side
```

The diagram labels this return as:

`น้ำเสียที่เหลือจากการกรอง-ลานตากตะกอน`

For future process graphs, this is a **recycle/return edge**, not final treated discharge.

### E. Chlorine dosing path

The control building contains, as drawn:

- chlorine dosing pump 1;
- chlorine dosing pump 2;
- chlorine-solution storage tank;
- chlorine dosing pipe.

The dosing pipe is drawn to the final-treatment area at the flow-measurement/contact-tank side.

```text
Chlorine solution storage
        ↓
Dosing pump(s)
        ↓
Chlorine dosing line
        ↓
Flow-measurement / chlorine-contact stage
```

Do not infer which dosing pump is duty/standby or running without an explicit operating record or telemetry source.

### F. Emergency overflow path

The diagram explicitly labels:

`ท่อน้ำเสียกรณีฉุกเฉิน-ล้น`

A separate emergency/overflow line is drawn from the pump-sump side across to the final-treatment side, terminating at the flow-measurement-weir area before/around the chlorine-contact stage.

This line must be modeled as an **exception/emergency route**, visually distinct from the normal Activated Sludge treatment path. The drawing does not specify activation conditions, valve state, compliance conditions, or whether the route is currently usable.

## Process Assets Shown in the Diagram

Use these canonical software names when practical, while retaining Thai labels in the UI:

| Canonical asset | Thai label / meaning from diagram | Notes |
|---|---|---|
| `influent_collection` | น้ำเสียจากระบบรวบรวม | Upstream wastewater collection header |
| `pump_sump` | บ่อพักน้ำเสีย-บ่อสูบ | Contains coarse screen and 2 wastewater pumps |
| `coarse_screen` | ตะแกรงดักขยะหยาบ | At pump-sump influent area |
| `wastewater_pump_1` | ปั๊มบ่อน้ำเสีย 1 | Status not provided by diagram |
| `wastewater_pump_2` | ปั๊มบ่อน้ำเสีย 2 | Status not provided by diagram |
| `fine_screen` | ตะแกรงกรองขยะแบบละเอียด | At/near aeration-tank inlet |
| `aeration_tank` | บ่อเติมอากาศ | Diagram annotates 50 ลบ.ม. |
| `aerator_1` | เครื่องเติมอากาศ 1 | Individual live state unknown unless sourced |
| `aerator_2` | เครื่องเติมอากาศ 2 | Individual live state unknown unless sourced |
| `secondary_clarifier` | บ่อตกตะกอน | Diagram annotates 15.42 ลบ.ม. |
| `grease_trap_subbasin` | บ่อย่อยดักไขมัน | Shown within/adjacent to clarifier structure |
| `sludge_suction_pipe` | ท่อดูดตะกอน | Clarifier sludge withdrawal/suction line |
| `ras_pumps` | ปั๊มสูบตะกอนหมุนเวียน | Two pump symbols shown |
| `ras_line` | ท่อส่งตะกอนหมุนเวียน | Returns settled sludge to aeration |
| `was_line` | ท่อส่งตะกอนส่วนเกิน | Sends excess sludge toward drying beds |
| `sludge_drying_beds` | ลานทรายตากตะกอน | Multiple drying-bed compartments shown |
| `flow_measurement_weir` | บ่อฝาย วัดปริมาณน้ำไหล | Immediately before chlorine-contact section in drawing |
| `chlorine_contact_tank` | บ่อสัมผัสคลอรีน | Final disinfection/contact section |
| `chlorine_solution_storage` | ถังเก็บสารละลายคลอรีน | Located in control building |
| `chlorine_dosing_pump_1` | เครื่องจ่ายคลอรีน 1 | Duty state not specified |
| `chlorine_dosing_pump_2` | เครื่องจ่ายคลอรีน 2 | Duty state not specified |
| `chlorine_dosing_line` | ท่อจ่ายคลอรีน | Runs to final-treatment stage |
| `treated_effluent_outfall` | น้ำทิ้งผ่านการบำบัดแล้ว | Final discharge shown leaving chlorine contact tank |
| `pump_sump_bypass` | By pass บ่อสูบ | Existence shown; control logic not shown |
| `emergency_overflow_line` | ท่อน้ำเสียกรณีฉุกเฉิน-ล้น | Exception route, not normal process path |
| `drying_bed_filtrate_return` | น้ำเสียที่เหลือจากการกรอง-ลานตากตะกอน | Return/recycle to upstream collection side |

## Dimensions / Capacity Annotations Visible in the User Diagram

Record these as **diagram annotations**, not reconciled engineering calculations:

- pump sump: `3.7 m ระดับน้ำ` shown; `1.5 m` horizontal dimension shown;
- aeration tank: `5 m ยาว`, `5 m กว้าง`, `2 m ระดับน้ำ`, label `50 ลบ.ม.`;
- clarifier: label `15.42 ลบ.ม.`, `3.6 m ยาว`, `3.6 m กว้าง`, `3.5 m ระดับน้ำ`, and `0.7 m ฐาน` shown;
- sludge drying bed area: `3 m กว้าง`, `0.5 m จากระดับทราย` and `1.5 m ยาว` annotations shown;
- flow-measurement weir area: `1.5 m ยาว` shown;
- chlorine contact tank: `0.7 m ระดับน้ำ` shown.

Some visible geometric annotations do not obviously reconcile with the displayed volume labels. **Do not correct or derive design dimensions from this drawing alone.** Treat exact civil dimensions/volumes as needing confirmation from as-built/GA drawings or the user.

## Digital Twin / UI Modeling Rules

### 1. Separate water flow from sludge flow

Normal clarified-water flow, RAS recycle, WAS wasting, chlorine dosing, filtrate return, bypass, and emergency overflow must be different graph edges/states. Do not collapse them into a single animated line.

### 2. Activated Sludge loop is structural

For future multi-stage Twin views, the minimum truthful process topology is:

```text
Aeration → Clarifier → RAS → Aeration
                   ↘ WAS → Drying beds
```

This loop is more important to process understanding than decorative animation.

### 3. Flow direction is not equipment state

A pipe drawn in the source diagram proves a connection/path. It does **not** prove that flow is occurring now.

Therefore:

- pipe exists ≠ currently flowing;
- pump exists ≠ running;
- bypass exists ≠ active;
- emergency overflow exists ≠ overflowing;
- chlorine system exists ≠ dosing now.

### 4. Preserve data honesty

Use the existing project rules:

- Unknown ≠ Zero
- Unknown ≠ Normal
- Unknown ≠ Stopped
- Missing ≠ Safe
- Stale ≠ Live
- Forecast ≠ Observed

For this wastewater topology specifically:

- unknown pump/aerator state must render as unknown/neutral;
- do not animate bypass/emergency flow unless an explicit simulation mode or real state says it is active;
- do not assign individual aerator status from aggregate plant data;
- do not infer water level from the drawn design-level annotation as a live level;
- do not infer pipe colors as standardized operational statuses. Colors in the source drawing are visual route cues only until the user defines their meaning.

### 5. Simulation mode may exercise exception paths

What-if/simulation can intentionally animate:

- pump-sump bypass;
- emergency overflow;
- loss of aeration;
- RAS interruption;
- excess-sludge wasting;
- chlorine dosing interruption;

but every such state must be explicitly marked `simulation` and never appear as observed/latest/live data.

## Recommended Process Graph for Code

Future process/domain models may use a directed graph such as:

```text
influent_collection
  → pump_sump
  → fine_screen
  → aeration_tank
  → secondary_clarifier
  → flow_measurement_weir
  → chlorine_contact_tank
  → treated_effluent_outfall

secondary_clarifier
  → ras_pumps
  → aeration_tank

secondary_clarifier
  → sludge_drying_beds
  → drying_bed_filtrate_return
  → pump_sump / upstream collection side

chlorine_solution_storage
  → chlorine_dosing_pump
  → chlorine_dosing_line
  → final-treatment stage

pump_sump / influent route
  → pump_sump_bypass (exception path)

pump_sump side
  → emergency_overflow_line (exception path)
  → flow_measurement_weir/final-treatment side
```

The exact hydraulic tie-in of bypass and emergency lines should stay marked `needs_confirmation` until a clearer as-built/P&ID or user confirmation resolves it.

## What This Source Does Not Confirm

Do not invent any of the following from this diagram:

- current pump/aerator ON/OFF state;
- valve positions;
- normal duty/standby pump assignment;
- actual flow rate;
- actual current water level;
- sludge concentration/MLSS/SVI;
- DO per aerator or per zone;
- RAS/WAS flow rate;
- chlorine dose or residual;
- HRT/SRT;
- exact operating sequence for bypass/emergency overflow;
- exact north orientation or true physical distances between all assets;
- precise underground pipe routing;
- civil dimensions beyond the explicit labels in the drawing.

## Design Priority Result

When the Digital Twin expands beyond the current Aeration Tank vertical slice, preserve the site-authentic visual direction already approved, but use this file to keep the **process connections** correct.

A future full wastewater Twin should visually distinguish at least:

1. influent / screening / pump-sump zone;
2. aeration biological-treatment zone;
3. clarifier + RAS/WAS sludge-management zone;
4. sludge drying zone;
5. flow measurement + chlorine-contact/final effluent zone;
6. chlorine dosing/control-building connection;
7. bypass/emergency routes as non-normal paths.

The process graph and the 3D site scene are complementary: **3D answers where; this topology answers how wastewater and sludge move through the Activated Sludge system.**
