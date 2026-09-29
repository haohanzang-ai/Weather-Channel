'use strict';
const { suite, ok, eq, near } = require('./harness.js');
const M = require('../js/tolerance-model.js');
const F = require('./fixtures.js');
const { TC_STATUS, TC_WEIGHTS, TC_INPUT_COMPLETENESS } = require('../js/science-constants.js');

function termsFor(env, profile) {
  const tC = env.tSuffix === '°F' ? M.fToC(env.current?.temp) : env.current?.temp;
  const vpd = env.hourlyVPD != null ? env.hourlyVPD
            : M.computeVPD(tC, env.current?.humidity ?? null);
  return {
    heat:  M.heatStressTerm(tC ?? null, profile),
    water: M.waterDeficitProxyTerm(env.archive30?.deficit ?? null, profile),
    vpd:   M.vpdTerm(vpd, profile),
    soil:  M.soilStressTerm(env.hourlySoil ?? null, profile),
  };
}

/* ── VPD ─────────────────────────────────────────────────────────────────── */
suite('VPD (FAO-56 Tetens)');
near(M.computeVPD(20, 50), 1.168, 0.005, 'VPD at 20 °C / 50% RH');
near(M.computeVPD(35, 40), 3.374, 0.005, 'VPD at 35 °C / 40% RH');
eq(M.computeVPD(25, 100), 0, 'VPD is exactly 0 at saturation');
ok(M.computeVPD(40, 20) > M.computeVPD(30, 20), 'VPD rises with temperature at fixed RH');
ok(M.computeVPD(30, 20) > M.computeVPD(30, 60), 'VPD falls as RH rises at fixed temperature');
eq(M.computeVPD(null, 50), null, 'missing temperature returns null, not 0');
eq(M.computeVPD(20, null), null, 'missing humidity returns null, not 0');
eq(M.computeVPD(20, 150), null, 'RH above 100% is rejected rather than clamped');
eq(M.computeVPD(20, -5), null, 'negative RH is rejected');
eq(M.computeVPD(NaN, 50), null, 'NaN temperature is rejected');

suite('Unit conversion');
near(M.fToC(32), 0, 1e-9, '32 °F = 0 °C');
near(M.fToC(212), 100, 1e-9, '212 °F = 100 °C');
near(M.cToF(M.fToC(98.6)), 98.6, 1e-9, 'F→C→F round-trips');
near(M.fToC(95), 35, 1e-9, '95 °F = 35 °C (switchgrass stress onset)');

/* ── Individual terms & boundaries ───────────────────────────────────────── */
suite('Stress term boundaries');
const sg = F.SWITCHGRASS;
eq(M.heatStressTerm(M.fToC(95), sg).score, 0, 'heat stress is 0 exactly at the onset threshold');
eq(M.heatStressTerm(M.fToC(113), sg).score, 100, 'heat stress is 100 exactly at the critical threshold');
eq(M.heatStressTerm(M.fToC(130), sg).score, 100, 'heat stress clamps at 100 above critical');
eq(M.heatStressTerm(M.fToC(60), sg).score, 0, 'heat stress clamps at 0 below onset');
near(M.heatStressTerm(M.fToC(104), sg).score, 50, 1, 'heat stress is ~50 at the midpoint');
eq(M.heatStressTerm(null, sg).status, TC_STATUS.UNKNOWN, 'missing temperature yields UNKNOWN, not a score');
eq(M.heatStressTerm(null, sg).score, null, 'UNKNOWN heat term carries a null score, never 0');

eq(M.waterDeficitProxyTerm(0, sg).score, 0, 'zero deficit is zero stress');
eq(M.waterDeficitProxyTerm(-40, sg).score, 0, 'water surplus is zero stress, not negative');
eq(M.waterDeficitProxyTerm(2000, sg).score, 100, 'water deficit stress clamps at exactly 100, not above');
near(M.waterDeficitProxyTerm(60, sg).score, 60 / 60 * 0.2 * 150, 1, 'water deficit follows deficit/reference x toleranceFactor x sensitivity');
eq(M.waterDeficitProxyTerm(null, sg).score, null, 'missing archive yields null, not 0');
ok(M.waterDeficitProxyTerm(80, F.SUGARCANE).score > M.waterDeficitProxyTerm(80, sg).score,
   'a drought-sensitive species scores higher water stress than a tolerant one on identical deficit');

eq(M.vpdTerm(0.5, sg).score, 0, 'VPD stress is 0 at the floor');
eq(M.vpdTerm(2.5, sg).score, 40, 'VPD stress is exactly 40 at the species threshold');
eq(M.vpdTerm(1.5, sg).score, Math.round((1.5-0.5)/(2.5-0.5)*40), 'VPD ramps linearly from the floor to the threshold');
eq(M.vpdTerm(3.5, sg).score, 40 + 25, 'above the threshold VPD adds the documented slope per kPa');
eq(M.vpdTerm(20, sg).score, 100, 'VPD stress clamps at exactly 100');
eq(M.vpdTerm(null, sg).score, null, 'missing VPD yields null');

eq(M.soilStressTerm(0.15, sg).score, 100, 'soil stress is 100 at the species minimum');
eq(M.soilStressTerm(0.40, sg).score, 0, 'soil stress is 0 above the non-limiting threshold');
eq(M.soilStressTerm(null, sg).score, null, 'missing soil moisture yields null');

/* ── Composites ──────────────────────────────────────────────────────────── */
suite('Composite scores — monotonicity and bounds');
const mild = termsFor(F.AUSTIN_APRIL.env, sg);
const harsh = termsFor(F.AUSTIN_JULY.env, sg);
ok(M.computeToleranceMatch(mild).score > M.computeToleranceMatch(harsh).score,
   'mild conditions score a higher tolerance match than harsh conditions');
ok(M.computeProductivityProxy(mild).score > M.computeProductivityProxy(harsh).score,
   'mild conditions score a higher productivity proxy than harsh conditions');
// Bounds alone cannot fail for a weighted mean of bounded inputs, so pin the
// extremes instead: total stress must floor at 0 and no stress must reach 100.
const allMax = { heat:{score:100,value:1,unit:'x',reference:'r',status:'DERIVED'},
                 water:{score:100,value:1,unit:'x',reference:'r',status:'DERIVED'},
                 vpd:{score:100,value:1,unit:'x',reference:'r',status:'DERIVED'},
                 soil:{score:100,value:1,unit:'x',reference:'r',status:'DERIVED'} };
const allZero = JSON.parse(JSON.stringify(allMax));
Object.values(allZero).forEach(t => { t.score = 0; });
eq(M.computeToleranceMatch(allMax).score, 0, 'maximum stress on every term floors the match at exactly 0');
eq(M.computeToleranceMatch(allZero).score, 100, 'zero stress on every term gives exactly 100');
eq(M.computeProductivityProxy(allMax).score, 0, 'maximum stress floors the productivity proxy at 0');
/* The two indices are NOT directly comparable and must never be differenced:
   tolerance includes a surface-soil-moisture term that productivity deliberately
   omits, so on the same conditions either can be the higher number depending on
   how dry the top centimetre happens to be. What the weights DO encode is that,
   over the terms the two share, productivity is more sensitive to heat and water.
   That is the property worth asserting. */
const sameTerms = (h, w, v) => ({
  heat:  { score: h, value: 0, unit: '°C',      reference: 'x', status: 'DERIVED' },
  water: { score: w, value: 0, unit: 'mm/30 d', reference: 'x', status: 'DERIVED' },
  vpd:   { score: v, value: 0, unit: 'kPa',     reference: 'x', status: 'DERIVED' },
  soil:  { score: null },
});
{
  const t = sameTerms(80, 80, 20);   // heat and water dominate
  ok(M.computeProductivityProxy(t).score <= M.computeToleranceMatch(t).score,
     'on a shared term set, productivity is at least as pessimistic as tolerance when heat and water dominate');
}
{
  const even = sameTerms(50, 50, 50);
  eq(M.computeProductivityProxy(even).score, M.computeToleranceMatch(even).score,
     'with every shared stressor equal, renormalisation makes the two indices agree');
}
ok(M.computeToleranceMatch(harsh).contributors.length !== M.computeProductivityProxy(harsh).contributors.length,
   'the two indices use different term sets, so their scores must not be subtracted from each other');

suite('Missing data is never treated as zero stress');
const allMissing = { heat:{score:null}, water:{score:null}, vpd:{score:null}, soil:{score:null} };
eq(M.computeToleranceMatch(allMissing).score, null, 'no available terms yields a null score, not 100');
eq(M.computeToleranceMatch(allMissing).status, TC_STATUS.UNKNOWN, 'and status UNKNOWN');
const partial = M.computeToleranceMatch({ heat: harsh.heat, water:{score:null}, vpd: harsh.vpd, soil:{score:null} });
ok(partial.renormalised, 'dropping terms sets the renormalised flag');
eq(partial.dropped, ['water','soil'], 'dropped terms are named');
near(partial.usedWeight, TC_WEIGHTS.tolerance.heat + TC_WEIGHTS.tolerance.vpd, 1e-9,
     'used weight equals the sum of surviving nominal weights');
near(partial.contributors.reduce((a,c)=>a+c.effectiveWeight,0), 1, 1e-6,
     'effective weights renormalise to exactly 1');
const zeroed = M.computeToleranceMatch({ heat: harsh.heat, water:{score:0}, vpd: harsh.vpd, soil:{score:0} });
ok(zeroed.score > partial.score,
   'scoring absent terms as zero stress would inflate the result — renormalisation avoids that');

suite('Contributor accounting');
const full = M.computeToleranceMatch(harsh);
near(100 + full.contributors.reduce((a,c)=>a+c.contribution,0), full.score, 2,
     'contributions sum back to the score (within rounding)');
// Asserting sortedness immediately after the function sorts is tautological.
// Pin the actual ordering against an independently computed ranking instead.
{
  const expected = full.contributors.map(c => c.key).slice();
  const independent = full.contributors.slice()
    .sort((a, b) => (a.stress * a.effectiveWeight) - (b.stress * b.effectiveWeight))
    .reverse().map(c => c.key);
  eq(expected, independent, 'contributors are ordered by actual stress x effective weight, most damaging first');
}
for (const c of full.contributors) {
  ok(c.unit != null && c.reference != null && c.status != null,
     `contributor "${c.label}" exposes unit, reference and status`);
}

suite('Input completeness');
eq(M.computeInputCompleteness(F.AUSTIN_JULY.env).score, 100, 'full data scores 100');
eq(M.computeInputCompleteness(F.DEGRADED.env).score,
   100 - TC_INPUT_COMPLETENESS.archive30 - TC_INPUT_COMPLETENESS.soil,
   'two failed providers subtract exactly their weights');
eq(M.computeInputCompleteness(null).score, 0, 'no environment scores 0');
eq(M.computeInputCompleteness(F.DEGRADED.env).absent.map(a=>a.key), ['archive30','soil'],
   'absent providers are named');

suite('Suitability index');
const si = M.computeSuitabilityIndex({ tolerance:80, productivity:70, water:60,
  chemSafety:75, conversion:85, envBenefit:85, inputs:100 });
eq(si.score, Math.round(80*0.20 + 70*0.20 + 60*0.15 + 75*0.15 + 85*0.15 + 85*0.10 + 100*0.05),
   'the index equals the documented weighted sum of its sub-scores');
near(si.contributors.reduce((a,c)=>a+c.contribution,0), si.score, 2, 'contributions sum to the index');
eq(si.status, TC_STATUS.EXPERIMENTAL, 'the index is always labelled EXPERIMENTAL');
const siPartial = M.computeSuitabilityIndex({ tolerance:80, productivity:70, water:null,
  chemSafety:null, conversion:85, envBenefit:85, inputs:100 });
ok(siPartial.renormalised, 'missing sub-scores trigger renormalisation');
eq(siPartial.missing.map(m=>m.key), ['water','chemSafety'], 'missing sub-scores are named');
eq(M.computeSuitabilityIndex({ tolerance:null, productivity:null, water:null, chemSafety:null,
   conversion:null, envBenefit:null, inputs:null }).score, null, 'no sub-scores yields null');
const perfect = M.computeSuitabilityIndex({ tolerance:100, productivity:100, water:100,
  chemSafety:100, conversion:100, envBenefit:100, inputs:100 });
eq(perfect.score, 100, 'all-100 sub-scores produce exactly 100');

suite('Scenario transform');
const base = JSON.parse(JSON.stringify(F.AUSTIN_APRIL.env));
const warmer = M.applyScenario(base, { tempDeltaC: 3 });
eq(warmer.isScenario, true, 'scenario output is flagged as a scenario');
near(warmer.current.temp, 27, 0.01, '+3 °C is applied to the temperature');
ok(warmer.hourlyVPD > base.hourlyVPD, 'VPD is recomputed upward — warming raises it at constant RH');
eq(base.current.temp, 24, 'the original environment is not mutated');
const drier = M.applyScenario(base, { precipPct: -20 });
ok(drier.archive30.deficit > base.archive30.deficit, 'less precipitation raises the water deficit proxy');
near(drier.archive30.precipSum, base.archive30.precipSum * 0.8, 0.1, 'precipitation scales by the given percentage');
ok(M.applyScenario(base, { tempDeltaC: 3 }).scenarioDesc.length >= 2, 'the scenario describes what it changed');
eq(M.applyScenario(null, { tempDeltaC: 3 }), null, 'a scenario on no environment returns null');

suite('Regression fixtures (pinned outputs)');
for (const fx of [F.AUSTIN_JULY, F.AUSTIN_APRIL, F.DEGRADED, F.AUSTIN_JULY_SUGARCANE]) {
  const t = termsFor(fx.env, fx.profile);
  eq(M.computeToleranceMatch(t).score,    fx.expect.tolerance,        `${fx.label} — tolerance match`);
  eq(M.computeProductivityProxy(t).score, fx.expect.productivity,     `${fx.label} — productivity proxy`);
  eq(M.computeInputCompleteness(fx.env).score, fx.expect.inputCompleteness, `${fx.label} — input completeness`);
}
ok(M.computeToleranceMatch(termsFor(F.AUSTIN_JULY.env, F.SWITCHGRASS)).score >
   M.computeToleranceMatch(termsFor(F.AUSTIN_JULY.env, F.SUGARCANE)).score,
   'switchgrass outscores sugarcane on identical hot dry inputs, as physiology predicts');

module.exports = { termsFor };
