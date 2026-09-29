'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   TexasClimate — Central Scientific Constant & Model Registry
   ──────────────────────────────────────────────────────────────────────────────
   SINGLE SOURCE OF TRUTH for every threshold, weight, and scientific magic
   number used anywhere in the app. Nothing scientific may be hard-coded in a
   UI file. Every entry carries:

     value      — the number actually used in computation
     unit       — physical unit (or 'dimensionless' / 'weight')
     status     — one of TC_STATUS (how much the number can be trusted)
     rationale  — WHY this number, in plain language
     source     — where it came from (paper, agency, or "author-chosen")

   If a number is an author-chosen heuristic, it says so. We do not dress
   heuristics up as calibrated science.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── Evidence / provenance status vocabulary ─────────────────────────────────
   Used for BOTH data values and model constants. Every number surfaced in the
   UI must carry exactly one of these. */
const TC_STATUS = {
  LIVE:         'LIVE',          // measured/modeled value fetched from a live API this session
  DERIVED:      'DERIVED',       // computed from LIVE inputs by a documented equation
  LITERATURE:   'LITERATURE',    // taken from a published source, cited
  EXPERIMENTAL: 'EXPERIMENTAL',  // TexasClimate heuristic; not calibrated or validated
  USER_INPUT:   'USER_INPUT',    // supplied by the person using the app
  UNKNOWN:      'UNKNOWN',       // not available — never silently replaced with a default
};

const TC_STATUS_META = {
  LIVE:         { label: 'LIVE',         icon: '◉', cls: 'st-live',  desc: 'Fetched from a live data provider during this session.' },
  DERIVED:      { label: 'DERIVED',      icon: '∑', cls: 'st-drv',   desc: 'Calculated from live inputs using a documented equation.' },
  LITERATURE:   { label: 'LITERATURE',   icon: '❝', cls: 'st-lit',   desc: 'Value published in a cited source. Not measured here.' },
  EXPERIMENTAL: { label: 'EXPERIMENTAL', icon: '⚗', cls: 'st-exp',   desc: 'TexasClimate heuristic. Not calibrated against field data.' },
  USER_INPUT:   { label: 'USER INPUT',   icon: '✎', cls: 'st-usr',   desc: 'Entered or confirmed by you. Not independently verified.' },
  UNKNOWN:      { label: 'UNKNOWN',      icon: '?', cls: 'st-unk',   desc: 'Not available. Deliberately left blank rather than assumed.' },
};

/* ── Model versions ────────────────────────────────────────────────────────── */
const TC_MODELS = {
  tolerance: {
    id: 'tc-etm',
    name: 'TexasClimate Environmental Tolerance Model',
    version: '1.0',
    status: TC_STATUS.EXPERIMENTAL,
    output: 'Environmental Tolerance Match (0–100, unitless index)',
  },
  productivity: {
    id: 'tc-psp',
    name: 'TexasClimate Productivity Stress Proxy',
    version: '1.0',
    status: TC_STATUS.EXPERIMENTAL,
    output: 'Productivity Stress Proxy (0–100, unitless index)',
  },
  suitability: {
    id: 'tc-bsi',
    name: 'TexasClimate Bioenergy Suitability Index',
    version: '1.0',
    status: TC_STATUS.EXPERIMENTAL,
    output: 'Bioenergy Suitability Index (0–100, unitless index)',
  },
  confidence: {
    id: 'tc-ece',
    name: 'TexasClimate Evidence Confidence Engine',
    version: '1.0',
    status: TC_STATUS.EXPERIMENTAL,
    output: 'Evidence Confidence (HIGH / MEDIUM / LOW) + reasons',
  },
  pathway: {
    id: 'tc-pcm',
    name: 'TexasClimate Pathway Compatibility Heuristic',
    version: '1.0',
    status: TC_STATUS.EXPERIMENTAL,
    output: 'Per-pathway compatibility score (0–100, unitless index)',
  },
  chem: {
    id: 'tc-scr',
    name: 'TexasClimate Stress Chemistry Risk Heuristic',
    version: '1.0',
    status: TC_STATUS.EXPERIMENTAL,
    output: 'Qualitative risk category (Low / Medium / High) per chemistry axis',
  },
};

/* ── Physical constants & equations ───────────────────────────────────────────
   These ARE calibrated science: standard, published, unit-checked. */
const TC_PHYSICS = {
  tetens_a: {
    value: 0.6108, unit: 'kPa', status: TC_STATUS.LITERATURE,
    rationale: 'Coefficient of the Tetens/Magnus saturation vapour pressure equation, es = 0.6108·exp(17.27·T/(T+237.3)), T in °C.',
    source: 'Allen et al. (1998), FAO Irrigation & Drainage Paper 56, Eq. 11.',
  },
  tetens_b: {
    value: 17.27, unit: 'dimensionless', status: TC_STATUS.LITERATURE,
    rationale: 'Exponent numerator of the Tetens equation.',
    source: 'Allen et al. (1998), FAO-56, Eq. 11.',
  },
  tetens_c: {
    value: 237.3, unit: '°C', status: TC_STATUS.LITERATURE,
    rationale: 'Exponent denominator offset of the Tetens equation.',
    source: 'Allen et al. (1998), FAO-56, Eq. 11.',
  },
};

/* ── Model weights ────────────────────────────────────────────────────────────
   IMPORTANT — READ BEFORE CITING THESE NUMBERS.
   Every weight below is EXPERIMENTAL. They were chosen by the author to rank
   stressors in a defensible order (heat and water dominate for C4 bioenergy
   grasses in Texas), NOT fitted to field yield data. No regression, no
   validation set, no calibration. They are documented here so a reviewer can
   see and challenge them, and so a single edit changes the whole app. */
const TC_WEIGHTS = {
  tolerance: {
    _meta: {
      status: TC_STATUS.EXPERIMENTAL,
      model: TC_MODELS.tolerance,
      rationale: 'Ordering reflects the consensus that thermal and water limitation are the primary constraints on warm-season perennial grass establishment; VPD and surface soil moisture are treated as secondary because they are shorter-timescale and (for soil) shallow-layer signals. The specific magnitudes are author-chosen, not fitted.',
      source: 'Author-chosen ordering informed by Sanderson et al. (2006) Bioresource Technology 99(2):479–485 and Barney et al. (2009) Plant Science 177(6):724–732. NOT calibrated against those studies.',
      sumsTo: 1.0,
    },
    heat:  0.40,
    water: 0.35,
    vpd:   0.15,
    soil:  0.10,
  },
  productivity: {
    _meta: {
      status: TC_STATUS.EXPERIMENTAL,
      model: TC_MODELS.productivity,
      rationale: 'Biomass accumulation is more sensitive to sub-lethal stress than survival is: a plant can persist through conditions that stop growth. Heat and water are therefore weighted higher here than in the tolerance model, and the soil term is dropped because 0–1 cm soil moisture is a poor predictor of season-scale growth.',
      source: 'Author-chosen. Directionally consistent with stress-physiology literature (e.g. Barney et al. 2009); magnitudes not fitted.',
      sumsTo: 1.0,
    },
    heat:  0.45,
    water: 0.40,
    vpd:   0.15,
  },
  waterComposite: {
    _meta: {
      status: TC_STATUS.EXPERIMENTAL,
      rationale: 'The 30-day climate water deficit proxy is weighted above instantaneous surface soil moisture because it integrates a month of atmospheric demand, whereas the 0–1 cm layer responds to the last rain shower.',
      source: 'Author-chosen.',
      sumsTo: 1.0,
    },
    deficit: 0.60,
    soil:    0.40,
  },
  suitability: {
    _meta: {
      status: TC_STATUS.EXPERIMENTAL,
      model: TC_MODELS.suitability,
      rationale: 'A composite roll-up so that a single number can head the report. Environment (tolerance + productivity + water) carries 55% because it is the part driven by live measurement; chemistry and conversion carry 30% because they are literature-inferred; environmental co-benefit and input completeness are deliberately small.',
      source: 'Author-chosen. This index has no validation set and predicts nothing about realized field yield.',
      sumsTo: 1.0,
    },
    tolerance:    0.20,
    productivity: 0.20,
    water:        0.15,
    chemSafety:   0.15,
    conversion:   0.15,
    envBenefit:   0.10,
    inputs:       0.05,
  },
  chemRisk: {
    _meta: {
      status: TC_STATUS.EXPERIMENTAL,
      model: TC_MODELS.chem,
      rationale: 'Weights inside the stress-chemistry heuristic. The DIRECTION of each relationship is supported by stress-physiology literature (drought and high VPD drive osmolyte accumulation; UV, heat and drought drive phenolic synthesis; woody tissue is inherently more recalcitrant). The MAGNITUDES are author-chosen and the thresholds between Low, Medium and High are arbitrary cut points.',
      source: 'Author-chosen. No compound concentration is measured anywhere in this app, so none of these could be fitted even in principle.',
    },
    osmolyteDrought: 0.60, osmolyteVpd: 0.40,   // drought vs VPD contribution to osmolyte pressure
    camFactor:       0.35,                       // CAM species use a different water strategy
    phenolicHeat: 0.40, phenolicDrought: 0.40, phenolicUv: 0.20,
    fermOsmolyte: 0.40, fermPhenolic: 0.35, fermRecalcitrance: 0.25,
    inhibitorBase: { high: 0.70, medium: 0.40, low: 0.15, unknown: 0.40 },
    inhibitorHeatGain: 0.15, inhibitorDroughtGain: 0.10,
    recalcitranceWoodyBase: 60, recalcitranceHerbBase: 25,
    recalcitranceDroughtGain: 0.15, recalcitranceHeatGain: 0.08,
    uvThreshold: 5,   // UV index above which we treat UV as a stressor at all
    uvPerUnit:   10,  // score points per UV index unit above the threshold
  },
};

/* ── Score thresholds (banding) ───────────────────────────────────────────────
   Presentation-layer cut points. Cosmetic, not scientific — they decide which
   colour a bar is, never what a number is. */
const TC_BANDS = {
  _meta: { status: TC_STATUS.EXPERIMENTAL, rationale: 'Presentation banding only. Author-chosen round numbers.', source: 'Author-chosen.' },
  good: 70,   // >= good  → favourable
  fair: 45,   // >= fair  → intermediate
  // < fair → unfavourable
  stressHigh: 60,
  stressMid:  30,
};

/* ── Environmental model parameters ──────────────────────────────────────────*/
const TC_ENV = {
  vpdFloorKPa: {
    value: 0.5, unit: 'kPa', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Below roughly 0.5 kPa, atmospheric drying demand is low enough that we score zero VPD stress for every species. A single floor across all species is a simplification.',
    source: 'Author-chosen, informed by the general observation that most C3/C4 crops keep stomata open below ~0.5–1.0 kPa (Grossiord et al. 2020, New Phytologist 226(6):1550–1566).',
  },
  vpdSubThresholdCeiling: {
    value: 40, unit: 'score points', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'VPD below the species threshold is capped at 40/100 stress so that sub-threshold conditions can never dominate the composite.',
    source: 'Author-chosen.',
  },
  vpdPerKPaAbove: {
    value: 25, unit: 'score points per kPa', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Linear penalty slope above the species VPD threshold. Real stomatal response is non-linear and species-specific.',
    source: 'Author-chosen.',
  },
  deficitReferenceMm: {
    value: 60, unit: 'mm per 30 days', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Scaling denominator for the 30-day climate water deficit proxy. A 60 mm reference-ET-minus-precipitation shortfall over a month is treated as a substantial deficit for scoring purposes.',
    source: 'Author-chosen. This is a scaling choice, not a published drought threshold.',
  },
  deficitSensitivity: {
    value: 150, unit: 'score points per normalised deficit unit', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Multiplier converting the tolerance-scaled, reference-normalised deficit into a 0-100 stress score. It is the most consequential single number in the water term — it sets how fast stress rises per millimetre of shortfall — and it was chosen so that a drought-sensitive species reaches severe stress at roughly the reference deficit while a tolerant species does not. It was previously hard-coded in two files and documented in neither.',
    source: 'Author-chosen. Not fitted to any observed plant response.',
  },
  soilOptimalMultiplier: {
    value: 2.5, unit: 'dimensionless', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Soil moisture is treated as non-limiting at 2.5× the species stress minimum. Real optima depend on soil texture and rooting depth, neither of which we have.',
    source: 'Author-chosen.',
  },
  texasEnvelopeLowF: {
    value: 85, unit: '°F', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Lower anchor for the Texas heat-envelope match. A species whose heat stress begins at or below 85 °F will be stressed through most of a Texas summer afternoon, so it scores 0 on this axis.',
    source: 'Author-chosen anchor, set from the observation that summer daily maxima across most of Texas routinely exceed 85 °F.',
  },
  texasEnvelopeHighF: {
    value: 120, unit: '°F', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Upper anchor for the Texas heat-envelope match, set at the Texas record high. A species that tolerates heat beyond the hottest temperature the state has recorded gains nothing further on this axis, so the score saturates. Previously this was 130 °F, a temperature Texas has never reached, which made the top of the scale unreachable and meaningless.',
    source: 'Author-chosen anchor at the Texas record high temperature (120 °F, Seymour 1936 and Monahans 1994).',
  },
  soilSubOptimalCeiling: {
    value: 70, unit: 'score points', status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Soil stress between the minimum and the optimum is capped below 100 because the 0–1 cm layer alone cannot demonstrate whole-root-zone stress.',
    source: 'Author-chosen.',
  },
};

/* ── Input completeness weighting ────────────────────────────────────────────
   NOT a scientific model: literally "how many of the inputs did we get". */
const TC_INPUT_COMPLETENESS = {
  _meta: {
    status: TC_STATUS.EXPERIMENTAL,
    rationale: 'Counts which providers answered. Weighted by how much each input changes the result, not by data quality. Renamed from "Data Quality" because it measures availability, not quality.',
    source: 'Author-chosen.',
  },
  current:   30,   // current weather (temperature/humidity) — drives heat + VPD
  archive30: 25,   // 30-day archive — drives the water deficit proxy
  vpd:       15,   // provider-modeled hourly VPD (better than our Tetens fallback)
  soil:      15,   // surface soil moisture
  aqi:       10,   // air quality (context only)
  alerts:     5,   // NWS alerts (context only)
};

/* ── Helpers ─────────────────────────────────────────────────────────────────*/

/** Render a provenance badge for any status key. Non-colour-only: carries text. */
function tcStatusBadge(status, extra) {
  const m = TC_STATUS_META[status] || TC_STATUS_META.UNKNOWN;
  const title = m.desc + (extra ? ' ' + extra : '');
  return `<span class="tc-status-badge ${m.cls}" title="${String(title).replace(/"/g, '&quot;')}">` +
         `<span class="tc-status-icon" aria-hidden="true">${m.icon}</span>${m.label}</span>`;
}

/** Band a 0–100 "higher is better" score into a colour + word. */
function tcBand(v) {
  if (v == null) return { color: 'var(--text3)', word: 'Unknown', status: TC_STATUS.UNKNOWN };
  if (v >= TC_BANDS.good) return { color: '#5DDBA8', word: 'Favourable',   status: null };
  if (v >= TC_BANDS.fair) return { color: '#F5A623', word: 'Intermediate', status: null };
  return { color: '#D64545', word: 'Unfavourable', status: null };
}

/** Band a 0–100 "higher is worse" stress score. */
function tcStressBand(v) {
  if (v == null) return { color: 'var(--text3)', word: 'Unknown' };
  if (v >= TC_BANDS.stressHigh) return { color: '#D64545', word: 'High' };
  if (v >= TC_BANDS.stressMid)  return { color: '#F5A623', word: 'Moderate' };
  return { color: '#5DDBA8', word: 'Low' };
}

/** Full human-readable model stamp, e.g. for report footers. */
function tcModelStamp(model) {
  return `${model.name} v${model.version} · ${model.status}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TC_STATUS, TC_STATUS_META, TC_MODELS, TC_PHYSICS, TC_WEIGHTS,
                     TC_BANDS, TC_ENV, TC_INPUT_COMPLETENESS, tcStatusBadge, tcBand,
                     tcStressBand, tcModelStamp };
}
