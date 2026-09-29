'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   TexasClimate — Evidence Confidence Engine  (model tc-ece v1.0, EXPERIMENTAL)
   ──────────────────────────────────────────────────────────────────────────────
   Evidence Confidence answers "how much should you trust this?".
   It is COMPLETELY SEPARATE from suitability. A location can score 90/100 for
   suitability with LOW confidence, or 30/100 with MEDIUM confidence. Conflating
   the two is the single most common way a tool like this misleads people.

   The core design decision: confidence is reported PER PIPELINE LAYER, and it
   can only ever decrease as you move down the pipeline.

     ENVIRONMENT  → what we measured                (can reach HIGH)
     STRESS       → measurement vs. published limit (capped at MEDIUM)
     TOLERANCE    → our uncalibrated composite      (capped at MEDIUM)
     BIOLOGY      → literature-associated mechanism (capped at MEDIUM)
     BIOENERGY    → inferred conversion consequence (capped at LOW)

   Those caps are not pessimism for its own sake. They follow from facts about
   this app that do not change with better weather data:
     · none of the composite models has been validated against field outcomes;
     · no cultivar is known, and tolerance varies widely within a species;
     · no plant tissue is measured, so every chemistry statement is inference.

   Because of the caps, the BIOENERGY layer is never HIGH. If it ever displays
   HIGH, that is a bug — tests/test-confidence.js asserts it cannot.
   ════════════════════════════════════════════════════════════════════════════ */

const TC_CONFIDENCE = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };
const LAYER_LABEL = { environment:'Environment', stress:'Stress', tolerance:'Tolerance',
                      biology:'Biology', bioenergy:'Bioenergy' };
const _TC_CONF_RANK  = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const _TC_CONF_NAME  = { 3: 'HIGH', 2: 'MEDIUM', 1: 'LOW' };

/** Ceilings imposed by what this app structurally cannot know. */
const TC_LAYER_CEILING = {
  environment: TC_CONFIDENCE.HIGH,
  stress:      TC_CONFIDENCE.MEDIUM,
  tolerance:   TC_CONFIDENCE.MEDIUM,
  biology:     TC_CONFIDENCE.MEDIUM,
  bioenergy:   TC_CONFIDENCE.LOW,
};

const TC_CEILING_REASON = {
  environment: null,
  stress:      'Capped at MEDIUM: stress is scored against published species thresholds, but no plant tissue is measured and no cultivar is known.',
  tolerance:   'Capped at MEDIUM: the tolerance composite uses author-chosen weights that have never been fitted or validated against field outcomes.',
  biology:     'Capped at MEDIUM: mechanisms are associated in the literature with this stress type. Nothing about gene activity in your plant is observed.',
  bioenergy:   'Capped at LOW: conversion consequences are inferred from environment through two layers of literature. No biomass, cell-wall chemistry, or fermentation performance is measured.',
};

/* Freshness thresholds for live data, in minutes. */
const TC_FRESHNESS = {
  fresh: 60,    // under an hour — current
  stale: 360,   // over six hours — treat as stale
};

/** Clamp a confidence to a ceiling. */
function _cap(conf, ceiling) {
  return _TC_CONF_NAME[Math.min(_TC_CONF_RANK[conf], _TC_CONF_RANK[ceiling])];
}

/** Turn a penalty total into a confidence level. */
function _fromPenalty(p) {
  if (p <= 1) return TC_CONFIDENCE.HIGH;
  if (p <= 4) return TC_CONFIDENCE.MEDIUM;
  return TC_CONFIDENCE.LOW;
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main entry point.
   env    — appState.envData (may be null)
   plant  — appState.plant   (may be null)
   stress — appState.stressScores (may be null)
   opts   — { now, hasSpeciesProfile, hasCultivar, soilECProvided, isScenario }
   Returns { layers: {...}, overall, limiting, unknowns, improvements }
   ════════════════════════════════════════════════════════════════════════════ */
function evidenceConfidenceCompute(env, plant, stress, opts) {
  opts = opts || {};
  const now = opts.now || new Date();
  const reasons = { environment: [], stress: [], tolerance: [], biology: [], bioenergy: [] };
  const unknowns = [];
  const improvements = [];
  let pEnv = 0, pStress = 0, pTol = 0, pBio = 0, pFuel = 0;

  /* ── Layer 1: ENVIRONMENT ──────────────────────────────────────────────── */
  if (!env) {
    reasons.environment.push('No environment has been retrieved yet.');
    pEnv += 10;
    unknowns.push({ what: 'Local environment', why: 'No location measured yet.' });
  } else {
    // Which inputs actually arrived
    const haveTemp    = env.current?.temp     != null;
    const haveRH      = env.current?.humidity != null;
    const haveArchive = env.archive30?.deficit != null;
    const haveSoil    = env.hourlySoil != null;
    const vpdModeled  = env.hourlyVPD  != null;

    if (haveTemp) reasons.environment.push('Air temperature retrieved live from Open-Meteo.');
    else { pEnv += 4; reasons.environment.push('Air temperature unavailable.');
           unknowns.push({ what: 'Air temperature', why: 'The weather provider did not return a current observation.' }); }

    if (haveRH) reasons.environment.push('Relative humidity retrieved live.');
    else { pEnv += 2; unknowns.push({ what: 'Relative humidity', why: 'Not returned by the provider; VPD cannot be derived without it.' }); }

    if (haveArchive) reasons.environment.push(`30-day reference ET and precipitation retrieved from the Open-Meteo archive (${env.archive30.days} days).`);
    else { pEnv += 2; reasons.environment.push('30-day archive unavailable — the water deficit proxy cannot be computed.');
           unknowns.push({ what: '30-day water balance', why: 'The archive endpoint did not respond.' }); }

    if (haveSoil) reasons.environment.push('Surface soil moisture (0–1 cm) retrieved live.');
    else { pEnv += 1; unknowns.push({ what: 'Surface soil moisture', why: 'Not available for this point.' }); }

    // Measured vs modeled: everything from a reanalysis/forecast model is MODELED,
    // not a sensor at your coordinates. This is the honest framing.
    reasons.environment.push(vpdModeled
      ? 'VPD comes from the provider\'s own hourly field rather than our fallback equation.'
      : 'VPD is DERIVED here from temperature and humidity using the FAO-56 Tetens equation, not supplied by the provider.');
    if (!vpdModeled && haveTemp && haveRH) pEnv += 1;

    reasons.environment.push('All values are gridded model output interpolated to your coordinates, not readings from an instrument at your site.');
    pEnv += 1; // structural: never a true point measurement

    // Recency
    const ageMin = env.fetchTime ? Math.round((now - new Date(env.fetchTime)) / 60000) : null;
    if (ageMin == null) { pEnv += 1; reasons.environment.push('Retrieval time unknown.'); }
    else if (ageMin > TC_FRESHNESS.stale) { pEnv += 3; reasons.environment.push(`Data is ${ageMin} minutes old and should be treated as STALE.`); }
    else if (ageMin > TC_FRESHNESS.fresh) { pEnv += 1; reasons.environment.push(`Data is ${ageMin} minutes old.`); }
    else reasons.environment.push(`Data retrieved ${ageMin} minute(s) ago.`);

    // Geographic relevance — the app's plant profiles are written for Texas
    if (env.lat != null && env.lon != null) {
      const inTexas = env.lat >= 25.5 && env.lat <= 36.6 && env.lon >= -107 && env.lon <= -93;
      if (!inTexas) { pEnv += 2;
        reasons.environment.push('Coordinates fall outside Texas. The weather data is still valid, but the plant profiles and framing were assembled for Texas conditions.'); }
    }

    // Provider failures
    if (env.errors && env.errors.length) {
      pEnv += Math.min(3, env.errors.length);
      reasons.environment.push(`${env.errors.length} data source(s) failed and were left blank rather than filled with defaults.`);
    }

    if (!haveSoil)    improvements.push({ input: 'Soil moisture through the root zone', gain: 'Would replace a 0–1 cm surface proxy with the water the plant can actually reach — the single largest source of error in the water term.', how: 'A soil moisture probe at 10–30 cm, or a local mesonet station.' });
    if (!haveArchive) improvements.push({ input: '30-day precipitation and reference ET history', gain: 'Would let the model see accumulated water deficit instead of only this moment.', how: 'Retry when the Open-Meteo archive endpoint is reachable.' });
  }

  /* ── Layer 2: STRESS ───────────────────────────────────────────────────── */
  // Each layer scores its OWN evidence sufficiency. Upstream weakness is not
  // re-charged as a penalty here; it is enforced structurally by the monotonic
  // rule below (a layer can never be more confident than the layer feeding it).
  pStress = 0;
  if (!plant) {
    pStress += 10;
    reasons.stress.push('No plant selected, so no tolerance thresholds apply.');
  } else {
    const speciesProfile = opts.hasSpeciesProfile !== false;
    if (speciesProfile) reasons.stress.push(`Published tolerance thresholds are available for ${plant.name}.`);
    else { pStress += 3; reasons.stress.push('No species-specific profile — generic default thresholds are in use.');
           unknowns.push({ what: 'Species-specific thresholds', why: 'This species has no profile; the generic default is a placeholder, not evidence.' }); }

    // Cultivar is essentially never known, and it matters a lot
    if (opts.hasCultivar) reasons.stress.push('A cultivar was specified, narrowing the tolerance range.');
    else {
      pStress += 2;
      reasons.stress.push('Cultivar is UNKNOWN. Heat and drought tolerance vary substantially between cultivars of the same species, and upland and lowland switchgrass ecotypes differ markedly.');
      unknowns.push({ what: 'Cultivar / ecotype', why: 'Within-species variation in tolerance can be larger than the between-site difference this analysis is measuring.' });
      improvements.push({ input: 'Cultivar or ecotype name', gain: 'Would replace species-average thresholds with values for the plant actually being grown.', how: 'Enter it in Step 1 if you know what was planted.' });
    }

    // Growth stage
    reasons.stress.push('Growth stage is UNKNOWN. The same conditions affect a seedling and an established stand very differently.');
    pStress += 1;
    unknowns.push({ what: 'Growth stage', why: 'Establishment-year plants are far more vulnerable than established perennial stands.' });
    improvements.push({ input: 'Growth stage', gain: 'Would allow a crop coefficient (Kc) to be applied, converting reference ET into an actual crop water demand.', how: 'Record it in Field Observation Mode.' });

    // Salinity is structurally unknown unless measured
    if (opts.soilECProvided) reasons.stress.push('A measured soil EC value was supplied, so salinity is treated as USER INPUT rather than UNKNOWN.');
    else {
      reasons.stress.push('Soil salinity is UNKNOWN. This app does not infer it from coastal proximity, because distance to the coast is not a measurement of soil EC.');
      unknowns.push({ what: 'Soil salinity (EC)', why: 'Depends on parent material, irrigation water quality and drainage. Not derivable from location.' });
      improvements.push({ input: 'Soil electrical conductivity (EC, dS/m)', gain: 'Would turn salinity from UNKNOWN into a scored stressor.', how: 'A soil test from your county extension office.' });
    }

    if (stress && stress.missing && stress.missing.length) pStress += Math.min(3, stress.missing.length);
  }

  /* ── Layer 3: TOLERANCE COMPOSITE ──────────────────────────────────────── */
  // Base cost: the weights are uncalibrated. Beyond that, the tolerance layer
  // varies with how much of the model actually ran — a score computed from two
  // of four terms is a weaker claim than one computed from all four, even when
  // the numbers are identical, and it should not report the same confidence.
  pTol = 2;
  reasons.tolerance.push('The composite combines stressors using author-chosen weights. They order the stressors sensibly but were never fitted to yield data.');
  reasons.tolerance.push('The result is a relative index for comparing places and species, not a prediction of survival or yield.');
  const droppedTerms = opts.droppedTerms ?? (stress && stress.terms
    ? Object.values(stress.terms).filter(t => !t || t.score == null).length : 0);
  if (droppedTerms > 0) {
    pTol += droppedTerms >= 2 ? 3 : 1;
    reasons.tolerance.push(`${droppedTerms} of the 4 stress terms could not be computed, so the weights were renormalised over the rest. The index rests on a smaller part of the model than intended.`);
  } else if (stress) {
    reasons.tolerance.push('All four stress terms were available, so no weight renormalisation was needed.');
  }
  improvements.push({ input: 'Observed outcomes at known sites', gain: 'Would let the weights be fitted rather than chosen, which is the step that would move this model from EXPERIMENTAL toward validated.', how: 'Not yet implemented — see the validation plan in docs/VALIDATION-PLAN.md.' });

  /* ── Layer 4: BIOLOGY ──────────────────────────────────────────────────── */
  pBio = 2;
  reasons.biology.push('Mechanisms shown are ASSOCIATED IN PUBLISHED LITERATURE with this stress type in this or a related species.');
  reasons.biology.push('No gene expression, protein, or metabolite in your plant is measured. Nothing here is an observation of your plant.');
  if (!plant) {
    pBio += 6;
  } else if (opts.geneRecordCount === 0) {
    pBio += 4;
    reasons.biology.push(`No curated gene records exist for ${plant.name} in this app, so no mechanism can be shown for it at all.`);
  } else if (plant.key !== 'switchgrass') {
    pBio += 3;
    reasons.biology.push(`Evidence for ${plant.name} is thinner than for switchgrass, where most curated records sit. Mechanisms shown may be carried over from better-studied relatives.`);
  } else if (opts.topGeneTier != null && opts.topGeneTier >= 4) {
    pBio += 2;
    reasons.biology.push('The gene records relevant to this stress are tier 4–5: putative orthologs projected from model species, not experiments in switchgrass.');
  }
  improvements.push({ input: 'Tissue sampling and RT-qPCR or RNA-seq', gain: 'Would replace literature association with measured expression in your plant.', how: 'Requires a lab. Out of scope for this app.' });

  /* ── Layer 5: BIOENERGY ────────────────────────────────────────────────── */
  pFuel = 5;
  reasons.bioenergy.push('Conversion consequences are HYPOTHESES built on the biology layer. Weather does not measure lignin, cellulose, S:G ratio, biomass, or fermentation performance.');
  reasons.bioenergy.push('Pathway compatibility scores are heuristics based on the plant\'s general chemistry class, not on an assay of this plant.');
  if (opts.chemInputsMissing) {
    pFuel += 2;
    reasons.bioenergy.push('Part of the stress-chemistry heuristic ran without its inputs (UV index or water deficit history), so even the heuristic is operating on partial information.');
  }
  improvements.push({ input: 'Compositional analysis of harvested biomass', gain: 'Would replace every inferred chemistry statement with a measurement.', how: 'NREL Laboratory Analytical Procedures for biomass composition.' });

  if (opts.isScenario) {
    [pEnv, pStress, pTol, pBio, pFuel] = [pEnv, pStress, pTol, pBio, pFuel].map(x => x + 2);
    Object.keys(reasons).forEach(k => reasons[k].unshift('EXPERIMENTAL SCENARIO: one or more inputs were modified by hand and no longer describe observed conditions.'));
  }

  // Build in pipeline order, enforcing the monotonic rule: a downstream layer
  // can never be MORE confident than the layer that feeds it. This is what makes
  // "confidence degrades along the pipeline" a structural guarantee rather than
  // a slogan.
  const layers = {};
  let prev = null;
  for (const [name, penalty, why] of [
    ['environment', pEnv,    reasons.environment],
    ['stress',      pStress, reasons.stress],
    ['tolerance',   pTol,    reasons.tolerance],
    ['biology',     pBio,    reasons.biology],
    ['bioenergy',   pFuel,   reasons.bioenergy],
  ]) {
    layers[name] = _mk(name, penalty, why, prev);
    prev = layers[name];
  }

  // Overall is the WEAKEST layer, never an average. An average would let a
  // strong measurement layer hide a weak inference layer.
  const order = ['environment', 'stress', 'tolerance', 'biology', 'bioenergy'];
  let limiting = 'environment';
  let overallRank = 9;
  for (const k of order) {
    if (_TC_CONF_RANK[layers[k].level] < overallRank) { overallRank = _TC_CONF_RANK[layers[k].level]; limiting = k; }
  }

  // The end-to-end level is always LOW, because the bioenergy layer is capped
  // there by design. That is honest but uninformative as a headline — it never
  // changes, so a reader learns nothing by watching it. The informative signal
  // is WHERE the ladder first drops and WHY, which does vary: with data
  // availability, with species, and with how much of the model actually ran.
  let firstDrop = null;
  for (let i = 1; i < order.length; i++) {
    const prevL = layers[order[i - 1]], curL = layers[order[i]];
    if (_TC_CONF_RANK[curL.level] < _TC_CONF_RANK[prevL.level]) {
      firstDrop = {
        layer: order[i],
        label: LAYER_LABEL[order[i]],
        from: prevL.level, to: curL.level,
        cause: curL.limitedBy,   // 'evidence' | 'ceiling' | 'upstream'
        because: curL.limitedBy === 'ceiling'
          ? 'a structural limit of this app, which better data cannot lift'
          : curL.limitedBy === 'upstream'
            ? 'the layer feeding it is already weaker'
            : 'the evidence available for this specific analysis',
      };
      break;
    }
  }

  return {
    layers,
    overall: _TC_CONF_NAME[overallRank],
    firstDrop,
    limiting,
    limitingLabel: LAYER_LABEL[limiting],
    unknowns,
    improvements: _dedupe(improvements),
    model: 'TexasClimate Evidence Confidence Engine v1.0 (EXPERIMENTAL)',
  };

  function _mk(layer, penalty, why, upstream) {
    const raw    = _fromPenalty(penalty);          // from this layer's own evidence
    const capped = _cap(raw, TC_LAYER_CEILING[layer]); // structural ceiling
    // Monotonic rule: never exceed the layer upstream.
    const level  = upstream ? _cap(capped, upstream.level) : capped;
    const out = { level, uncapped: raw, capped, penalty, why: why.slice(), limitedBy: null };

    if (upstream && _TC_CONF_RANK[level] < _TC_CONF_RANK[capped]) {
      out.limitedBy = 'upstream';
      out.why.push(`Held to ${level} because the layer it depends on is only ${upstream.level}. A conclusion cannot be more certain than its inputs.`);
    } else if (_TC_CONF_RANK[capped] < _TC_CONF_RANK[raw] && TC_CEILING_REASON[layer]) {
      out.limitedBy = 'ceiling';
      out.why.push(TC_CEILING_REASON[layer]);
    } else {
      // Previously this branch also claimed "Capped at MEDIUM: ..." whenever the
      // level merely EQUALLED the ceiling — including when the layer's own
      // evidence produced that level and no cap was applied. In an app whose
      // whole proposition is that the explanation comes from the same object as
      // the result, that explanation was wrong, and wrong in the default path.
      // A ceiling is only reported when it actually bound.
      out.limitedBy = 'evidence';
      out.why.push('This level reflects the evidence available for this layer; no structural ceiling was needed to hold it here.');
    }
    return out;
  }
  function _dedupe(arr) {
    const seen = new Set();
    return arr.filter(x => { if (seen.has(x.input)) return false; seen.add(x.input); return true; });
  }
}

/** One-sentence plain-language summary of why confidence is what it is. */
function evidenceConfidenceSentence(ec) {
  if (!ec) return '';
  if (ec.firstDrop) {
    return `Confidence falls from ${ec.firstDrop.from} to ${ec.firstDrop.to} at the ` +
           `${ec.firstDrop.label.toLowerCase()} step, because of ${ec.firstDrop.because}. ` +
           `End to end the chain is ${ec.overall}.`;
  }
  return `Every layer is ${ec.overall}. ` + (ec.layers[ec.limiting].why[0] || '');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TC_CONFIDENCE, TC_LAYER_CEILING, TC_FRESHNESS, LAYER_LABEL,
                     evidenceConfidenceCompute, evidenceConfidenceSentence };
}
