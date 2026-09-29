# TexasClimate — Evidence-Aware Bioenergy Crop Resilience Explorer

**[→ Open the live site](https://haohanzang-ai.github.io/Weather-Channel/)**

A weather app tells you what the weather *is*. TexasClimate asks what it may *mean* — biologically — for a bioenergy crop growing in it, and tells you how strong the evidence behind that answer actually is.

```
LOCATION → ENVIRONMENT → STRESS → PLANT TOLERANCE → BIOLOGICAL MECHANISM → BIOENERGY IMPLICATION → EVIDENCE
```

---

## The problem

Texas has a genuine bioenergy question: switchgrass and other perennial feedstocks grow on marginal land that food crops cannot use, and the state has more marginal land than almost anywhere. But whether a given crop suits a given place is a *biological* question — about heat thresholds, water balance, stomatal limitation and cell-wall chemistry — and the tools a student, teacher or grower can actually reach are weather apps. Weather apps stop at the number.

The gap is not data. Open-Meteo will give anyone reference evapotranspiration for any coordinate for free. The gap is **interpretation you can check**: what does 158 mm of 30-day water deficit mean for *this* plant, through what mechanism, with what consequence, and how much should you believe it?

## The idea

One pipeline, run end to end, where **every value carries its provenance and every conclusion carries its confidence** — and where confidence *degrades visibly* as you move from measurement toward inference.

That last part is the thing that makes this different from a dashboard. Most tools that combine data sources produce one confident-looking number. This one produces a number *and* an argument about how much that number is worth, and the argument is generated from the same objects that produced the number, so the two cannot drift apart.

## What makes it defensible

**Six provenance labels, applied to every value in the app.**

| Label | Meaning |
|---|---|
| `LIVE` | Fetched from a provider this session |
| `DERIVED` | Computed from live inputs by a documented equation |
| `LITERATURE` | Published and cited, not measured here |
| `EXPERIMENTAL` | Our own heuristic; uncalibrated |
| `USER INPUT` | Entered or confirmed by you |
| `UNKNOWN` | Not available — deliberately blank, never defaulted |

`UNKNOWN` is a first-class status, not an error state. Where a value is missing, the model **drops the term and renormalises its weights** rather than scoring it as zero stress. Scoring an absent measurement as "no problem" would inflate the result exactly where the app knows least; the renormalisation is reported in the UI, and `tests/test-models.js` asserts that the naive alternative would indeed score higher.

**Suitability and confidence are separate outputs.**

They were previously one number called the "Bioenergy Confidence Score", which conflated *how well this scores* with *how much you should believe it*. They are now:

- **Bioenergy Suitability Index** (0–100) — a ranking position under a stated set of assumptions.
- **Evidence Confidence** (HIGH / MEDIUM / LOW) — computed separately, reported **per pipeline layer**.

A location can score 85 with LOW confidence. That means it ranks well under our assumptions *and* our assumptions are weakly supported. Both halves are the answer.

**Confidence can only fall along the pipeline.**

```
ENVIRONMENT  →  STRESS  →  TOLERANCE  →  BIOLOGY  →  BIOENERGY
   HIGH          MEDIUM      MEDIUM       MEDIUM       LOW      ← ceilings
```

The ceilings are structural, not pessimism. They follow from facts that better weather data cannot fix:

- No plant tissue is measured anywhere in this app, so the stress layer cannot reach HIGH.
- No composite model has been validated against field outcomes, so the tolerance layer cannot.
- Nothing about gene activity in your plant is observed, so the biology layer cannot.
- Conversion consequences are inference on top of inference, so the bioenergy layer is capped at LOW.

A downstream layer can also never exceed the layer feeding it — a conclusion is not more certain than its inputs. Both rules are enforced in code and asserted in `tests/test-confidence.js`; if the bioenergy layer ever displays HIGH, that is a failing test, not a judgement call.

The end-to-end confidence is the **weakest** layer, never an average. An average would let a strong measurement layer conceal a weak inference layer, which is precisely the failure this app exists to avoid.

**Every score explains itself.** A `WHY?` panel on each result shows, per term: the measured input and unit, the reference it was compared against, the nominal and effective weight, the points contributed, and the provenance label. It is generated from the same object the score came from.

```
Environmental Tolerance Match: 37/100        Evidence Confidence: MEDIUM

Input                  Measured      Compared against                       Weight  Points  Source
Water-demand proxy     158 mm/30 d   60 mm ref, scaled by tolerance 80/100   35%     −16    DERIVED
Heat                   38 °C         onset 35 °C, critical 45 °C             40%     −12    DERIVED
Surface soil moisture  0.09 m³/m³    stress min 0.15, non-limiting 0.375     10%     −10    DERIVED
VPD                    4.51 kPa      species threshold 2.5 kPa               15%      −9    DERIVED

Model: TexasClimate Environmental Tolerance Model v1.0  [EXPERIMENTAL]
```

---

## The demo path

Press **⚖ Guided Review** in the header. It runs a guided ~116-second walk through the pipeline — deliberately inside the 90–120 second window a three-minute video allows, with headroom for an intro and a close.

It drives the **real interface on live data**: it selects switchgrass, fetches current conditions for a Texas location, then spotlights each stage in the same DOM every user sees. Eight beats, matching the pipeline rather than the menu:

| | Beat | |
|---|---|---|
| 1 | The question a weather app cannot answer | 12s |
| 2 | Live environment, labelled by source | 15s |
| 3 | Measurement against published limits | 14s |
| 4 | **Every number shows its work** — the WHY panel | 20s |
| 5 | **Confidence falls as certainty does** — the ladder | 16s |
| 6 | Mechanism, with its evidence tier | 13s |
| 7 | What we do not know, and what would fix it | 14s |
| 8 | Under the hood — model cards, corrections log, tests | 12s |

Steps 4 and 5 get the most time on purpose; they are the two things that distinguish this from a dashboard.

If a step's target is missing — a provider failed, a section didn't render — the path says so and continues. Nothing is faked to cover a gap, which would be an odd way to demonstrate a tool built around evidence honesty. `tests/test-integrity.js` asserts the path still fits its time window and that every step targets something the app actually renders.

This replaced a 12-step slideshow that rendered its own mock panels beside the app. A feature tour teaches the menu instead of the idea, and showing a reviewer a simulation of a product that works is a credibility cost for no gain. That page is kept as an offline concept reference and now labels its static panels as such.

## Scientific corrections

This app previously made claims it could not support. They were removed or rewritten, and — because a tool asking to be trusted on uncertainty should show its own error history — the corrections are **displayed in the app** under Science → Model Cards, and stored in `js/claims-registry.js` as `TC_RETIRED_CLAIMS`. Fifteen are logged, including corrections found by a hostile review of an earlier version of this audit. The most consequential:

| Claim | Problem | Resolution |
|---|---|---|
| Switchgrass "produces 540% more energy than it consumes" | Stated as raw energy in vs. out and as a property of the species. The study measured renewable output against **nonrenewable** input, on 10 specific Northern Great Plains farms | Rewritten and scoped everywhere it appears |
| "Uses 98% less water than corn ethanol" | No identifiable source, and a single cross-crop water ratio is not meaningful | **Removed.** Replaced with the actual finding: water embodied in corn ethanol varies by ~3 orders of magnitude between U.S. states depending on irrigation share |
| "784 gal water/gal fuel" for corn, "6–14" for cellulosic | Universal figures, compared without a shared system boundary | **Removed from all UI** |
| "200–280 GJ/ha/yr" switchgrass vs "120–160" corn, cited to Schmer et al. | **Misattribution** — neither figure is in that paper, which reports ~60 GJ/ha/yr and makes no corn comparison | **Removed.** No GJ/ha comparison is shown, because we do not have two figures on a common boundary |
| Proline and glycine betaine called "fermentation inhibitors" | Overgeneralised. Their accumulation under stress is well supported; a general inhibitory effect on industrial fermentation is not | Rewritten. The documented inhibitors in lignocellulosic processing are pretreatment-derived (furfural, HMF, acetic acid, phenolics) |
| Coastal proximity shown as a salinity score | Distance to the coast is not a measurement of soil salinity | **Removed.** Salinity is `UNKNOWN` unless you supply a measured soil EC |
| Biogas grouped with gasification | Category error — anaerobic digestion is biological (→ CH₄ + CO₂); gasification is thermochemical (→ syngas) | Pathways now separated by process class |
| VPD "needs a wet-bulb sensor" | Misleading — VPD comes from temperature and RH by a standard equation | Rewritten to state the real limits: screen-level vs. leaf-level, and hourly averaging hiding the midday peak |
| Biofuel Lab scores called "AI prototype estimates **calibrated** to published literature", with a methods table citing DSSAT/APSIM, CRU TS4.06, SPI-6/PDSI, LandScan and SoilGrids | **Fabricated methodology.** None of those pipelines exists in the codebase, no calibration was performed, and the file's own scenario note already called the values "mock data" | Every method string replaced with "Author-chosen illustrative value — no dataset"; the tab carries a standing "illustrative model, not data" notice |
| A "Survival Chance" — "probability that industrialization could persist over a 20-year horizon" | An explicit probability computed from invented inputs | Renamed **Composite Outlook Score** and described as an index |
| Soil carbon at 1.1–2.3 tCO₂/ha/yr, cited to the DOE Billion-Ton Report, and used to compute a "CO₂ Sequestered" total | The Billion-Ton Report is a feedstock supply assessment; the figure could not be verified against it | **Withdrawn everywhere**, including from the calculator, which now reports UNKNOWN rather than computing from an unverifiable rate |
| Fu et al. (2011) cited as *Nature Biotechnology* | Wrong journal — it is *PNAS* 108(9):3803–3808 | Corrected, and the 38% result scoped to transgenic lines under laboratory conditions |
| "**No AI is used anywhere in this application**" | **This over-correction was itself false.** Field Observation Mode runs a real MobileNet v2 CNN locally via TensorFlow.js. A denial is as inaccurate as the inflated branding it replaced | Rewritten to state exactly what runs; a test now checks AI claims in **both** directions |
| The scanner's "% visual confidence" | It is MobileNet's softmax probability for an **ImageNet class**, not the probability that the plant is the named species. ImageNet contains almost no bioenergy crops | Relabelled "ImageNet class probability", with the keyword-map heuristic and its lack of validation stated at the point of use |

Terminology was corrected in the same pass, because the old names made claims the app could not support:

- Survival Score → **Environmental Tolerance Match** (it was never a survival probability)
- Productivity Score → **Productivity Stress Proxy** (nothing about productivity is measured)
- Bioenergy Confidence Score → **Bioenergy Suitability Index** + separate **Evidence Confidence**
- ET₀ − precipitation → **Climate Water Deficit Proxy** (it omits crop coefficient, soil storage, rooting depth and irrigation, all of which sit between it and real plant water stress)
- Data Quality → **Input Completeness** (it counts which providers answered; it says nothing about accuracy)
- Plant-to-Fuel Scanner → **Field Observation Mode** (there *is* a real local MobileNet classifier, but it is an ImageNet model suggesting a species, never identifying one — see below)
- AI Assistant → **Science Assistant** (it is deterministic intent matching, not a model)

An automated test suite enforces every one of these. `tests/test-integrity.js` greps the entire codebase for the retired wording and fails the build if any of it reappears outside a documented correction — so the audit cannot silently regress.

---

## What machine learning this app does and does not use

Stated plainly, because it is the kind of thing a reviewer will check in the source:

- **One real neural network.** Field Observation Mode lazy-loads MobileNet v2 through TensorFlow.js and runs it **in your browser** — the photograph never leaves your device. It classifies the image into an ImageNet category, and a keyword map converts that into a *suggested* plant.
- **That suggestion is weak, and the app says so where it appears.** ImageNet contains almost no bioenergy crops, and the keyword map has never been validated against labelled plant photographs. The percentage shown is MobileNet's confidence in an **ImageNet class**, not the probability that the plant is that species. Your confirmation is what sets the species.
- **Nothing else is a model.** The composite indices are weighted arithmetic. The summaries are template-filled from live values. The Science Assistant is deterministic intent matching — the full set of answers it can give is literally written in `js/chatbot.js`.
- **No language model or generative model is used anywhere.**

Both failure modes here are real, and this project made both: it first branded rule-based components as "AI", and then, while correcting that, overshot into stating that no AI was used anywhere — which was false. `tests/test-integrity.js` now checks for over-claims and denials in both directions.

## Architecture

Strict separation of **data**, **models** and **UI**. The rule that matters: **no scientific number may live in a UI file.**

```
js/
├── science-constants.js    Every threshold, weight and constant — with unit,
│                           status, rationale and source. Single source of truth.
├── claims-registry.js      Every load-bearing scientific claim, with its scope,
│                           evidence tier and a direct DOI. Plus the retired ones.
├── tolerance-model.js      PURE computation. No DOM, no fetch, no globals.
│                           This is the layer the tests exercise.
├── evidence-confidence.js  The confidence engine and its structural ceilings.
├── model-cards.js          Model documentation, corrections log, claim registry UI.
├── judge-path.js           Guided ~116s path through the real pipeline.
├── scenario.js             What-if transforms, always marked EXPERIMENTAL.
├── stress.js               Species profiles + adapter onto the model layer + UI.
├── bioenergy-engine.js     Pathways, suitability, WHY panels (adapter + UI).
├── location.js             Provider adapters and app state.
└── gene-atlas.js           Mechanism explorer with a 5-tier evidence ladder.

tests/
├── harness.js              Zero-dependency test harness. No install step.
├── fixtures.js             Regression fixtures with pinned outputs.
├── test-models.js          Maths, boundaries, missing data, unit conversion.
├── test-confidence.js      Structural guarantees of the confidence engine.
├── test-pipeline.js        The adapter, chemistry and pathway layers, plus the
│                           provider-response helpers.
├── test-integrity.js       Polices the science audit against the source tree.
└── run.js                  Runs everything.
```

The Tetens saturation-vapour-pressure coefficients (0.6108, 17.27, 237.3) previously appeared in four separate files, each with a slightly different rounding step. They now exist **once**, in `science-constants.js`, and a test fails if they reappear anywhere else. That is the pattern for every constant in the app.

### Why this separation earns its keep

`tolerance-model.js` has no DOM access and no side effects, so the same functions that render the UI are the ones the tests call — there is no separate "test implementation" that can drift from the real one. A change to a renderer therefore *cannot* silently move a scientific result, which is the specific failure mode a project like this is most exposed to.

## Models

Six models produce every number. **None has been validated against field outcomes**, and each says so in its own model card (Science → Model Cards) rather than in a footnote.

| Model | Version | Output | Validation |
|---|---|---|---|
| Environmental Tolerance Model | 1.0 | Tolerance Match 0–100 | None |
| Productivity Stress Proxy | 1.0 | Proxy 0–100 | None |
| Bioenergy Suitability Index | 1.0 | Index 0–100 | None |
| Evidence Confidence Engine | 1.0 | HIGH/MEDIUM/LOW per layer | None (and hard to validate in principle — there is no ground truth for how confident someone should have been) |
| Pathway Compatibility Heuristic | 1.0 | Score 0–100 per route | None |
| Stress Chemistry Risk Heuristic | 1.0 | Low/Medium/High per axis | None |

The weights are **author-chosen, not fitted**. They order stressors in a defensible way — heat and water dominate for warm-season perennial grasses — but there was no regression, no training set and no calibration, and the constants file says so in the same place it defines them. Two of the seven Suitability sub-scores are themselves heuristics, so roughly 30% of that index is heuristics stacked on heuristics. That is stated on its model card.

## Data sources

| Source | Used for | Notes |
|---|---|---|
| [Open-Meteo Forecast](https://open-meteo.com/) | Temperature, humidity, wind, UV, VPD, soil moisture, reference ET | Gridded model output interpolated to your coordinates — **not** an instrument at your site. The app says so |
| [Open-Meteo Archive](https://open-meteo.com/) | 30-day reference ET and precipitation | Drives the water deficit proxy |
| [Open-Meteo Air Quality](https://open-meteo.com/) | US AQI, PM2.5, PM10 | Context only |
| [NWS api.weather.gov](https://www.weather.gov/documentation/services-web-api) | Active alerts | Two-step: `/points` → zone → alerts |

No API keys, no backend, no build step. Failures are surfaced as `UNKNOWN`, never filled with defaults.

## Testing

```bash
npm test        # 462 assertions, zero dependencies
```

Covers: VPD against hand-computed values; the adapter layer agreeing with the model layer term for term; unit conversion round-trips; every threshold boundary (exactly at onset, exactly at critical, above, below); missing-data handling on every path; weight renormalisation; contributor accounting summing back to the score; scenario transforms not mutating the baseline; provider-failure behaviour; the confidence engine's structural ceilings and monotonicity; claim-registry schema; and the science audit itself.

Regression fixtures pin four representative analyses (hot dry Austin, mild Austin, degraded providers, a poorly matched species). If a code change moves any pinned number, the suite fails and the change must be justified.

## Limitations

Stated plainly, because they are the point:

- **Nothing about any plant is measured.** No tissue, no water potential, no gas exchange, no composition. Every biological statement is literature association.
- **Weather cannot measure lignin, cellulose, S:G ratio, phenolics, biomass, moisture, ash or fermentation performance.** Every conversion statement is a hypothesis.
- **No model is calibrated.** The indices rank; they do not predict.
- **Current conditions are not long-term suitability.** The app uses current weather plus a 30-day window. Historical climate normals, seasonality, extreme-event frequency and growing-season length are **not implemented**, and a long-term suitability assessment requires them. The app says this where the distinction matters rather than letting today's weather stand in for a climate.
- **Cultivar, growth stage and soil salinity are always `UNKNOWN`** unless you supply them. Within-species tolerance variation can exceed the between-site differences being measured.
- Blind to soil texture, rooting depth, nitrogen, pests, disease, stand age, management, cost, logistics and policy.

**Not for production, investment, siting, land-use or policy decisions.**

## Scientific responsibility

Three rules governed every change:

1. **When evidence is insufficient: `UNKNOWN` beats invented certainty, and `EXPERIMENTAL` beats fake validation.**
2. **A claim that cannot be verified is qualified, downgraded or removed — never propped up with a plausible-looking citation.** Every DOI in the claim registry was checked against the source during the audit; two figures were removed specifically because the cited paper did not contain them.
3. **Corrections are published, not buried.** The retired-claims log is a feature of the app.

## Real-world validation

**No user testing has been conducted, and none is claimed.** `docs/VALIDATION-PLAN.md` sets out a protocol for testing with students and teachers — the task, the success criterion, and a results table that is deliberately empty until real sessions are run. Fabricated survey data would contradict the entire premise of the project.

## Roadmap

Nearest-term, in order of value to the core idea:

1. **Historical climate normals** — the single largest scientific gap. Would enable an honest long-term suitability assessment separate from current conditions.
2. **Crop coefficient (Kc) by growth stage** — would convert the reference-ET proxy into an actual crop water demand, upgrading the weakest term in the model.
3. **Soil texture and root-zone water holding capacity** — would replace the 0–1 cm surface layer with water the plant can reach.
4. **Consolidate the two species tables.** `PLANT_ENV_PROFILES` (stress thresholds) and `PLANT_TOLERANCES` (annual climate envelope) describe different axes for different species sets, and neither derives from the other, so they can drift apart. One schema behind one registry.
5. **Weight calibration against observed outcomes** — the step that would move any model from `EXPERIMENTAL` toward validated.

Explicitly *not* prioritised: more crops, more genes, more dashboards. Focus beats feature count.

## Run locally

```bash
git clone https://github.com/haohanzang-ai/Weather-Channel.git
cd Weather-Channel
npm test          # verify the science first
npx serve .       # then open the printed URL
```

No build step. Vanilla JS, HTML and CSS.

---

Built in Texas, for Texas.
