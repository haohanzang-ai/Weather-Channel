# Architecture

## The rule

**No scientific number may live in a UI file.** Every model constant — thresholds, weights, scaling factors — lives in `js/science-constants.js` with its unit, provenance status, written rationale and source.

**Where the rule is not yet fully met, and why that is stated here rather than glossed:**

- The per-species tables (`PLANT_ENV_PROFILES` in `js/stress.js`, `PLANT_TOLERANCES` in `js/scanner.js`) are *data*, not model constants, and they still live beside UI code. They are labelled as species-level literature-derived estimates that are not individually cited.
- Those two tables are also **duplicated on different axes** — stress-onset thresholds in one, annual climate envelope in the other — covering different species sets. Neither derives from the other, so they can drift. Consolidating them behind one schema is outstanding work.
- The centralisation test currently enforces the rule for the Tetens coefficients specifically. Extending it to every constant is outstanding work.

The reason is specific: this app's failure mode is not a crash, it is a silently wrong number. If a threshold lives inside a render function, editing a layout can change a scientific result and nothing will notice. Centralising the constants and testing the pure functions means a UI change *cannot* move a result.

## Layers

```
                        ┌─────────────────────────────┐
   DATA / CONSTANTS     │ science-constants.js        │  thresholds, weights,
                        │ claims-registry.js          │  claims, retired claims
                        │ data/plant_genes_*.json     │  gene records + evidence tier
                        └──────────────┬──────────────┘
                                       │
                        ┌──────────────▼──────────────┐
   MODELS (pure)        │ tolerance-model.js          │  no DOM, no fetch, no globals
                        │ evidence-confidence.js      │  ← where most tests aim
                        └──────────────┬──────────────┘
                                       │
                        ┌──────────────▼──────────────┐
   ADAPTERS             │ stress.js  bioenergy-engine │  shape app state → model input,
                        │ location.js (providers)     │  model output → view model
                        └──────────────┬──────────────┘
                                       │
                        ┌──────────────▼──────────────┐
   UI                   │ renderers, model-cards.js,  │  presentation only
                        │ scenario.js, gene-atlas.js  │
                        └─────────────────────────────┘
```

Dependencies point downward only. `tolerance-model.js` cannot reach the DOM; `model-cards.js` contains no arithmetic.

## Data flow

```
  User picks species ──┐
                       ├──> appState ──> locFetchEnvironment(lat, lon)
  User picks location ─┘                          │
                                                  │ Promise.allSettled — one provider
                                                  │ failing never blocks the others
                          ┌───────────────────────┼───────────────────────┐
                          ▼                       ▼                       ▼
                  Open-Meteo forecast     Open-Meteo archive        NWS alerts
                  (temp, RH, VPD, soil)   (30-day ET₀, precip)      (two-step)
                          └───────────────────────┼───────────────────────┘
                                                  ▼
                                          envData { ..., errors[] }
                                          missing fields stay null → UNKNOWN
                                                  │
                                                  ▼
                      heatStressTerm · waterDeficitProxyTerm · vpdTerm · soilStressTerm
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          ▼                       ▼                       ▼
                 computeToleranceMatch   computeProductivityProxy   computeInputCompleteness
                          └───────────────────────┼───────────────────────┘
                                                  ▼
                                     computeSuitabilityIndex
                                                  │
                     evidenceConfidenceCompute ───┤  computed in parallel, never derived
                     (separate, per layer)        │  from the score itself
                                                  ▼
                              renderAgScore → renderBioScore → renderReport
                              WHY panels · confidence ladder · unknowns
```

## Design decisions worth defending

**Missing terms are dropped and weights renormalised, never scored as zero.** Treating an absent measurement as "no stress" inflates the score precisely where the app knows least. The renormalisation is surfaced in the UI, and `tests/test-models.js` asserts the naive alternative scores higher — the test documents the bug that was avoided.

**Confidence is computed independently of the score, and reported per layer.** Deriving confidence from the score would make them the same number wearing two hats. They take different inputs and answer different questions.

**Confidence ceilings are structural, not tunable.** They encode facts about the app that better data cannot change: no tissue is measured, no cultivar is known, no model is validated. A ceiling is enforced in `_mk()` and asserted in tests, so it cannot be quietly relaxed by editing a threshold.

**End-to-end confidence is the minimum, not the mean.** An average would let a HIGH environment layer mask a LOW bioenergy layer — the exact misdirection the app exists to prevent.

**Explanations are generated from the result object.** The `WHY?` table is rendered from the same `contributors` array that produced the score, so the two cannot disagree. A prose explanation written separately would drift on the first weight change.

**Providers fail independently.** `Promise.allSettled` plus per-source error collection means an archive outage degrades one term to `UNKNOWN` rather than emptying the analysis, and the Evidence Confidence engine sees the failure and lowers the environment layer accordingly.

**Scenarios never mutate the baseline.** `applyScenario` deep-copies, and `scenario.js` keeps the measured `envData` aside, so "restore measured conditions" is exact rather than a re-fetch that would return different weather.

## Testing strategy

The models are pure, so the tests call the *same* functions the UI calls — there is no parallel test implementation that can drift.

| Suite | Guards against |
|---|---|
| `test-models.js` | Wrong maths; boundary-off-by-one; missing data scored as zero; renormalisation errors; scenario mutation; regression on four pinned fixtures |
| `test-confidence.js` | A ceiling being relaxed; confidence increasing downstream; salinity being inferred from geography; a layer failing to explain itself |
| `test-pipeline.js` | The adapter layer diverging from the model layer; hidden global dependencies; the hourly-index and archive-summation bugs returning; pathway process classes being conflated |
| `test-integrity.js` (guided review) | The demo path drifting out of its 90–120s window, losing a pipeline beat, or pointing a step at a selector the app no longer renders |
| `test-integrity.js` | The science audit regressing — retired claims reappearing, the 540% figure losing its scope, a constant being copied back into a UI file, a model losing its EXPERIMENTAL label, or AI claims drifting in **either** direction |

`test-integrity.js` is the unusual one: it greps the source tree rather than calling functions. It exists because the most likely way this project degrades is not a broken calculation but a well-meaning edit that reintroduces an overstated claim.

## Adding a species

1. Add the profile to `PLANT_ENV_PROFILES` in `js/stress.js` with sourced thresholds.
2. Add the display record to `SCAN_PLANTS` in `js/scanner.js`.
3. If gene records exist, add `data/plant_genes_<species>.json` with an `evidenceLevel` per gene.
4. Run `npm test` — the fixtures will catch anything that shifts existing results.

Two Texas-specific constants do live in the model layer: `texasEnvelopeLowF` and `texasEnvelopeHighF`, the anchors for the species heat-envelope score. They are declared in `science-constants.js` with their rationale, and adapting the app to another region means changing those two values plus the bounds check that lowers confidence outside Texas. Nothing else is region-specific — the stress terms, composites and confidence engine are all region-agnostic.
