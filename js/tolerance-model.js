'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   TexasClimate — Model layer (pure computation, no DOM)
   ──────────────────────────────────────────────────────────────────────────────
   Every function here is a pure function of its arguments. No fetching, no
   rendering, no global state. That is what makes tests/ possible, and it is
   what stops a UI edit from silently changing a scientific result.

   Every score returns not just a number but its CONTRIBUTORS: for each term,
   the input value, its unit, the reference it was compared against, the weight
   applied, and how many points it cost. That structure is what the "WHY?"
   panel renders — the explanation is generated from the same object that
   produced the number, so the two cannot drift apart.
   ════════════════════════════════════════════════════════════════════════════ */

/* Node/browser interop.
   Deliberately NOT `var { ... } = require(...)`: a `var` at top level hoists
   even when the guarding branch never runs, so in the browser it would redeclare
   the `const TC_STATUS` that science-constants.js already defines and throw
   "Identifier 'TC_STATUS' has already been declared", taking the entire model
   layer down with it. Assigning onto globalThis under Node lets the rest of this
   file use the same bare names in both environments with no declaration at all. */
if (typeof module !== 'undefined' && module.exports) {
  Object.assign(globalThis, require('./science-constants.js'));
}

/* ── Vapour pressure deficit ─────────────────────────────────────────────────
   VPD = es(T) − ea,  es from the FAO-56 Tetens form, ea = es · RH/100.
   Inputs: air temperature in °C, relative humidity in %. Output: kPa.

   Limitations, stated because they are real and commonly glossed over:
     · This is SCREEN-LEVEL VPD (roughly 2 m), not the VPD at the leaf surface.
       Inside a canopy, humidity is higher and VPD lower than this value.
     · It uses air temperature, not leaf temperature. A sunlit leaf can be
       several degrees warmer than the air, which raises the true leaf-to-air
       VPD above this number.
     · Hourly averaging hides the midday peak that actually closes stomata.
   None of these require a wet-bulb instrument to address; they are structural
   differences between a screen-level meteorological value and a leaf boundary
   layer. */
function computeVPD(tempC, rhPct) {
  if (tempC == null || rhPct == null || !isFinite(tempC) || !isFinite(rhPct)) return null;
  if (rhPct < 0 || rhPct > 100) return null;
  const a = TC_PHYSICS.tetens_a.value, b = TC_PHYSICS.tetens_b.value, c = TC_PHYSICS.tetens_c.value;
  const es = a * Math.exp(b * tempC / (tempC + c));
  const ea = es * (rhPct / 100);
  return Math.round((es - ea) * 1000) / 1000;
}

function fToC(f) { return f == null ? null : (f - 32) * 5 / 9; }
function cToF(c) { return c == null ? null : c * 9 / 5 + 32; }

/* ── Individual stress terms ─────────────────────────────────────────────────
   Each returns { score 0–100, status, value, unit, reference } or null-scored
   with status UNKNOWN. Higher score = more stress. */

function heatStressTerm(tempC, profile) {
  if (tempC == null || profile?.heatStressF == null) {
    return { score: null, status: TC_STATUS.UNKNOWN, value: null, unit: '°C',
             reference: null, note: 'No current air temperature available.' };
  }
  const lo = fToC(profile.heatStressF), hi = fToC(profile.heatCriticalF);
  let s;
  if (tempC <= lo) s = 0;
  else if (tempC >= hi) s = 100;
  else s = Math.round((tempC - lo) / (hi - lo) * 100);
  return { score: s, status: TC_STATUS.DERIVED, value: Math.round(tempC * 10) / 10, unit: '°C',
           reference: `stress onset ${Math.round(lo * 10) / 10} °C, critical ${Math.round(hi * 10) / 10} °C`,
           note: 'Linear ramp between the species stress-onset and critical temperatures.' };
}

/* Climate / Reference Water Deficit Proxy.
   THIS IS NOT PLANT DROUGHT STRESS. It is (reference ET − precipitation) summed
   over the window: atmospheric demand for a standard 0.12 m grass reference
   surface, minus supply from rain. It omits crop coefficient (Kc), soil water
   storage, rooting depth, growth stage, and irrigation — all of which sit
   between this number and what a plant actually experiences. */
function waterDeficitProxyTerm(deficitMm, profile) {
  if (deficitMm == null) {
    return { score: null, status: TC_STATUS.UNKNOWN, value: null, unit: 'mm/30 d',
             reference: null, note: 'No 30-day archive available.' };
  }
  if (deficitMm <= 0) {
    return { score: 0, status: TC_STATUS.DERIVED, value: Math.round(deficitMm * 10) / 10, unit: 'mm/30 d',
             reference: 'precipitation met or exceeded reference ET',
             note: 'Supply met atmospheric demand over the window. Says nothing about soil storage or timing within the month.' };
  }
  const tolFactor = (100 - (profile?.droughtScore ?? 50)) / 100;
  const ref = TC_ENV.deficitReferenceMm.value;
  const s = Math.min(100, Math.round(deficitMm / ref * tolFactor * TC_ENV.deficitSensitivity.value));
  return { score: s, status: TC_STATUS.DERIVED, value: Math.round(deficitMm * 10) / 10, unit: 'mm/30 d',
           reference: `${ref} mm reference deficit, scaled by species drought tolerance ${profile?.droughtScore ?? 50}/100`,
           note: 'Climate water deficit proxy, not measured plant water status.' };
}

function vpdTerm(vpdKPa, profile) {
  if (vpdKPa == null) {
    return { score: null, status: TC_STATUS.UNKNOWN, value: null, unit: 'kPa',
             reference: null, note: 'Neither a provider VPD field nor temperature+humidity were available.' };
  }
  const lo = TC_ENV.vpdFloorKPa.value;
  const hi = profile?.vpdStressKPa ?? 2.0;
  let s;
  if (vpdKPa <= lo) s = 0;
  else if (vpdKPa < hi) s = Math.round((vpdKPa - lo) / (hi - lo) * TC_ENV.vpdSubThresholdCeiling.value);
  else s = Math.min(100, Math.round(TC_ENV.vpdSubThresholdCeiling.value + (vpdKPa - hi) * TC_ENV.vpdPerKPaAbove.value));
  return { score: s, status: TC_STATUS.DERIVED, value: vpdKPa, unit: 'kPa',
           reference: `species stress threshold ${hi} kPa (floor ${lo} kPa)`,
           note: 'Screen-level VPD. Leaf-to-air VPD is typically higher in full sun.' };
}

function soilStressTerm(soilVWC, profile) {
  if (soilVWC == null) {
    return { score: null, status: TC_STATUS.UNKNOWN, value: null, unit: 'm³/m³',
             reference: null, note: 'No surface soil moisture available for this point.' };
  }
  const min = profile?.soilStressMin ?? 0.20;
  const opt = min * TC_ENV.soilOptimalMultiplier.value;
  let s;
  if (soilVWC >= opt) s = 0;
  else if (soilVWC <= min) s = 100;
  else s = Math.round((opt - soilVWC) / (opt - min) * TC_ENV.soilSubOptimalCeiling.value);
  return { score: s, status: TC_STATUS.DERIVED, value: soilVWC, unit: 'm³/m³',
           reference: `species stress minimum ${min} m³/m³, non-limiting above ${Math.round(opt * 1000) / 1000}`,
           note: 'This is the 0–1 cm surface layer only. It is not the water available to the root zone.' };
}

/* ── Composite: Environmental Tolerance Match ─────────────────────────────────
   0–100, higher = conditions sit further inside the species\' documented
   tolerance envelope. NOT a survival probability. Not calibrated.

   Missing terms are DROPPED and the weights renormalised over the terms that
   are present, rather than being scored as zero stress. Treating an absent
   measurement as "no stress" would systematically inflate the score exactly
   when we know least — the opposite of what an evidence-aware tool should do.
   The renormalisation is reported so the user can see it happened. */
function computeToleranceMatch(terms) {
  const w = TC_WEIGHTS.tolerance;
  const map = { heat: terms.heat, water: terms.water, vpd: terms.vpd, soil: terms.soil };
  const contributors = [];
  let usedWeight = 0;
  const dropped = [];

  for (const [key, term] of Object.entries(map)) {
    if (!term || term.score == null) { dropped.push(key); continue; }
    usedWeight += w[key];
  }
  if (usedWeight === 0) {
    return { score: null, status: TC_STATUS.UNKNOWN, contributors: [], dropped,
             renormalised: false, model: TC_MODELS.tolerance,
             note: 'No stress term could be computed. Score deliberately left UNKNOWN rather than defaulted.' };
  }

  let penalty = 0;
  for (const [key, term] of Object.entries(map)) {
    if (!term || term.score == null) continue;
    const effWeight = w[key] / usedWeight;              // renormalised
    const points = term.score * effWeight;
    penalty += points;
    contributors.push({
      key,
      label: { heat: 'Heat', water: 'Water-demand proxy', vpd: 'VPD', soil: 'Surface soil moisture' }[key],
      stress: term.score,
      value: term.value, unit: term.unit, reference: term.reference,
      nominalWeight: w[key], effectiveWeight: Math.round(effWeight * 1000) / 1000,
      contribution: -Math.round(points),                // negative: points removed
      status: term.status, note: term.note,
    });
  }
  contributors.sort((a, b) => a.contribution - b.contribution); // most negative first

  return {
    score: Math.max(0, Math.round(100 - penalty)),
    status: TC_STATUS.DERIVED,
    contributors, dropped,
    renormalised: dropped.length > 0,
    usedWeight: Math.round(usedWeight * 1000) / 1000,
    model: TC_MODELS.tolerance,
    note: dropped.length
      ? `${dropped.length} term(s) unavailable (${dropped.join(', ')}). Weights were renormalised over the ${contributors.length} available term(s) rather than assuming zero stress.`
      : 'All four terms available.',
  };
}

/* ── Composite: Productivity Stress Proxy ────────────────────────────────────
   0–100, higher = fewer growth-limiting stressors right now. A PROXY for
   growth conditions, not a biomass prediction. It cannot see nitrogen, pests,
   stand age, harvest timing, or last season's carryover.

   DO NOT SUBTRACT THIS FROM THE TOLERANCE MATCH. The two indices deliberately
   use different term sets — tolerance includes surface soil moisture and this
   does not — so their difference has no interpretation. Either can be the
   larger number depending only on how dry the top centimetre of soil is.
   Over the terms they share, the weights here are more sensitive to heat and
   water, which is the actual relationship between them. */
function computeProductivityProxy(terms) {
  const w = TC_WEIGHTS.productivity;
  const map = { heat: terms.heat, water: terms.water, vpd: terms.vpd };
  const contributors = [];
  let usedWeight = 0;
  const dropped = [];
  for (const [key, term] of Object.entries(map)) {
    if (!term || term.score == null) { dropped.push(key); continue; }
    usedWeight += w[key];
  }
  if (usedWeight === 0) {
    return { score: null, status: TC_STATUS.UNKNOWN, contributors: [], dropped,
             renormalised: false, model: TC_MODELS.productivity,
             note: 'No stress term available.' };
  }
  let penalty = 0;
  for (const [key, term] of Object.entries(map)) {
    if (!term || term.score == null) continue;
    const effWeight = w[key] / usedWeight;
    const points = term.score * effWeight;
    penalty += points;
    contributors.push({
      key, label: { heat: 'Heat', water: 'Water-demand proxy', vpd: 'VPD' }[key],
      stress: term.score, value: term.value, unit: term.unit, reference: term.reference,
      nominalWeight: w[key], effectiveWeight: Math.round(effWeight * 1000) / 1000,
      contribution: -Math.round(points), status: term.status, note: term.note,
    });
  }
  contributors.sort((a, b) => a.contribution - b.contribution);
  return {
    score: Math.max(0, Math.round(100 - penalty)),
    status: TC_STATUS.DERIVED, contributors, dropped,
    renormalised: dropped.length > 0,
    usedWeight: Math.round(usedWeight * 1000) / 1000,
    model: TC_MODELS.productivity,
    note: dropped.length
      ? `Renormalised over ${contributors.length} available term(s); ${dropped.join(', ')} unavailable.`
      : 'All three terms available.',
  };
}

/* ── Input completeness ───────────────────────────────────────────────────────
   Renamed from "Data Quality": it counts which providers answered. It says
   nothing about whether the values they returned are accurate. */
function computeInputCompleteness(env) {
  const c = TC_INPUT_COMPLETENESS;
  const present = [], absent = [];
  let pts = 0;
  const checks = [
    ['current',   env?.current != null,            c.current,   'Current weather'],
    ['archive30', env?.archive30?.deficit != null, c.archive30, '30-day archive'],
    ['vpd',       env?.hourlyVPD != null,          c.vpd,       'Provider VPD field'],
    ['soil',      env?.hourlySoil != null,         c.soil,      'Surface soil moisture'],
    ['aqi',       env?.aqi?.usAqi != null,         c.aqi,       'Air quality'],
    ['alerts',    env?.alerts != null,             c.alerts,    'NWS alerts'],
  ];
  for (const [key, ok, weight, label] of checks) {
    if (ok) { pts += weight; present.push({ key, label, weight }); }
    else absent.push({ key, label, weight });
  }
  return { score: pts, present, absent, status: TC_STATUS.DERIVED,
           note: 'Counts which data providers responded. Availability, not accuracy.' };
}

/* ── Composite: Bioenergy Suitability Index ──────────────────────────────────
   0–100. A RELATIVE RANKING AID for comparing plant/location combinations
   under one consistent set of assumptions. It is not a probability, not a
   yield forecast, and not a commercial viability assessment.

   Its Evidence Confidence is computed separately and is structurally capped at
   LOW, because it depends on inferred conversion chemistry. A high index with
   LOW confidence means "this ranks well under our assumptions, and our
   assumptions are weakly supported" — both halves matter. */
function computeSuitabilityIndex(parts) {
  const w = TC_WEIGHTS.suitability;
  const rows = [
    ['tolerance',    'Environmental Tolerance Match', parts.tolerance,    TC_STATUS.DERIVED],
    ['productivity', 'Productivity Stress Proxy',     parts.productivity, TC_STATUS.DERIVED],
    ['water',        'Water Supply vs. Requirement',  parts.water,        TC_STATUS.DERIVED],
    ['chemSafety',   'Stress-Chemistry Safety',       parts.chemSafety,   TC_STATUS.EXPERIMENTAL],
    ['conversion',   'Conversion Compatibility',      parts.conversion,   TC_STATUS.EXPERIMENTAL],
    ['envBenefit',   'Environmental Co-benefit',      parts.envBenefit,   TC_STATUS.LITERATURE],
    ['inputs',       'Input Completeness',            parts.inputs,       TC_STATUS.DERIVED],
  ];
  const contributors = [];
  const missing = [];
  let weighted = 0, usedWeight = 0;

  for (const [key, label, value, status] of rows) {
    if (value == null) { missing.push({ key, label, weight: w[key] }); continue; }
    usedWeight += w[key];
  }
  if (usedWeight === 0) {
    return { score: null, status: TC_STATUS.UNKNOWN, contributors: [], missing,
             renormalised: false, model: TC_MODELS.suitability,
             note: 'No sub-score available.' };
  }
  for (const [key, label, value, status] of rows) {
    if (value == null) continue;
    const eff = w[key] / usedWeight;
    const contribution = value * eff;
    weighted += contribution;
    contributors.push({ key, label, value, nominalWeight: w[key],
                        effectiveWeight: Math.round(eff * 1000) / 1000,
                        contribution: Math.round(contribution), status });
  }
  contributors.sort((a, b) => b.contribution - a.contribution);
  return {
    score: Math.round(weighted),
    status: TC_STATUS.EXPERIMENTAL,
    contributors, missing,
    renormalised: missing.length > 0,
    usedWeight: Math.round(usedWeight * 1000) / 1000,
    model: TC_MODELS.suitability,
    note: missing.length
      ? `${missing.length} sub-score unavailable. Weights renormalised over the rest; the index is therefore based on ${Math.round(usedWeight * 100)}% of the intended model.`
      : 'All seven sub-scores available.',
  };
}

/* ── Provider-response helpers ────────────────────────────────────────────────
   Pure functions extracted from the fetch layer so they can be tested. Both
   fixed real bugs that no test could have caught while they lived inside an
   async fetch handler. */

/* Pick the index of the CURRENT hour in a provider's hourly time series.
   Open-Meteo's arrays begin at 00:00 local on the first forecast day, so index
   0 is midnight — using it silently paired an overnight VPD with a current
   temperature. Returns -1 when no usable entry exists. */
function pickHourlyIndex(times, now) {
  if (!Array.isArray(times) || times.length === 0) return -1;
  const nowMs = (now instanceof Date ? now : new Date(now || Date.now())).getTime();
  if (!isFinite(nowMs)) return -1;
  const stamp = new Date(nowMs).toISOString().slice(0, 13);
  const exact = times.findIndex(t => String(t).slice(0, 13) === stamp);
  if (exact >= 0) return exact;
  let best = -1, bestDiff = Infinity;
  times.forEach((t, i) => {
    const d = Math.abs(new Date(t).getTime() - nowMs);
    if (isFinite(d) && d < bestDiff) { bestDiff = d; best = i; }
  });
  return best;
}

/* Sum a daily archive over COMPLETE days only.
   A reanalysis archive lags real time, so trailing entries are null. Summing
   them with `x || 0` scored a missing day as zero demand AND zero rain, which
   is the "absent input treated as zero" failure this whole app is built to
   avoid. Pairing the two series also keeps the difference meaningful: summing
   ET over one set of days and rain over another describes no real period. */
function sumCompleteDays(et0Arr, precipArr) {
  const a = Array.isArray(et0Arr) ? et0Arr : [];
  const b = Array.isArray(precipArr) ? precipArr : [];
  const n = Math.max(a.length, b.length);
  let et0Sum = 0, precipSum = 0, days = 0, daysMissing = 0;
  for (let i = 0; i < n; i++) {
    const e = a[i], p = b[i];
    if (e == null || p == null || !isFinite(e) || !isFinite(p)) { daysMissing++; continue; }
    et0Sum += e; precipSum += p; days++;
  }
  if (days === 0) return null;
  return {
    et0Sum:    Math.round(et0Sum    * 10) / 10,
    precipSum: Math.round(precipSum * 10) / 10,
    deficit:   Math.round((et0Sum - precipSum) * 10) / 10,
    days, daysMissing, daysRequested: n,
  };
}

/* ── Scenario transform ──────────────────────────────────────────────────────
   Applies a what-if to a measured environment. The result is explicitly
   marked so a scenario can never be mistaken for an observation. */
function applyScenario(env, scenario) {
  if (!env) return null;
  const out = JSON.parse(JSON.stringify(env));
  out.fetchTime = env.fetchTime;
  out.isScenario = true;
  out.scenarioDesc = [];

  if (scenario.tempDeltaC != null && scenario.tempDeltaC !== 0 && out.current?.temp != null) {
    const isF = env.tSuffix === '°F';
    out.current.temp += isF ? scenario.tempDeltaC * 9 / 5 : scenario.tempDeltaC;
    out.current.temp = Math.round(out.current.temp * 10) / 10;
    out.scenarioDesc.push(`temperature ${scenario.tempDeltaC > 0 ? '+' : ''}${scenario.tempDeltaC} °C`);
    // Warming raises saturation vapour pressure, so VPD rises even at constant RH.
    // Recompute rather than leave a stale VPD that would contradict the new temperature.
    if (out.current.humidity != null) {
      const tC = isF ? fToC(out.current.temp) : out.current.temp;
      out.hourlyVPD = computeVPD(tC, out.current.humidity);
      out.scenarioDesc.push('VPD recomputed from the new temperature at constant relative humidity');
    }
  }
  if (scenario.precipPct != null && scenario.precipPct !== 0 && out.archive30?.precipSum != null) {
    const f = 1 + scenario.precipPct / 100;
    out.archive30.precipSum = Math.round(out.archive30.precipSum * f * 10) / 10;
    if (out.archive30.et0Sum != null) {
      out.archive30.deficit = Math.round((out.archive30.et0Sum - out.archive30.precipSum) * 10) / 10;
    }
    out.scenarioDesc.push(`precipitation ${scenario.precipPct > 0 ? '+' : ''}${scenario.precipPct}%`);
  }
  if (scenario.soilEC != null) {
    out.userSoilEC = scenario.soilEC;
    out.scenarioDesc.push(`soil EC ${scenario.soilEC} dS/m (user input)`);
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { computeVPD, fToC, cToF, pickHourlyIndex, sumCompleteDays,
                     heatStressTerm, waterDeficitProxyTerm,
                     vpdTerm, soilStressTerm, computeToleranceMatch,
                     computeProductivityProxy, computeInputCompleteness,
                     computeSuitabilityIndex, applyScenario };
}
