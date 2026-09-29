'use strict';
/* Tests for the layers that had NO coverage: the stress adapter, the chemistry
   and pathway heuristics, and the provider-response helpers. A hostile review
   found real bugs in every one of these — hourly values read at midnight,
   missing archive days summed as zero, dead field names disabling gene-atlas
   logic, and stress.js reimplementing the model with its own constants. Each of
   those is pinned here so it cannot come back. */
const { suite, ok, eq, near } = require('./harness.js');
const fs = require('fs'), vm = require('vm'), path = require('path');
const M = require('../js/tolerance-model.js');
const { TC_STATUS, TC_WEIGHTS, TC_ENV } = require('../js/science-constants.js');

/* Load the browser-global modules into one context, the way the page does. */
const ROOT = path.join(__dirname, '..');
const ctx = { console, document: null, escapeHtml: s => String(s), appState: {} };
vm.createContext(ctx);
for (const f of ['science-constants', 'tolerance-model', 'claims-registry']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8')
    .replace(/if \(typeof module[\s\S]*?^}/m, ''), ctx, { filename: f });
}
for (const f of ['stress', 'bioenergy-engine']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
}
/* `const`/`function` declarations inside vm.runInContext land on the context's
   lexical scope, not on the context object, so pull them out by evaluating
   their names rather than destructuring ctx. */
const grab = name => vm.runInContext(name, ctx);
const stressCompute      = grab('stressCompute');
const chemRiskCompute    = grab('chemRiskCompute');
const pathwayAnalysis    = grab('pathwayAnalysis');
const agScoreCompute     = grab('agScoreCompute');
const bioScoreCompute    = grab('bioScoreCompute');
const PLANT_ENV_PROFILES = grab('PLANT_ENV_PROFILES');

const ENV = (o = {}) => Object.assign({
  lat: 30.2672, lon: -97.7431, tSuffix: '°C',
  current: { temp: 38, humidity: 32, uv: 9 },
  archive30: { et0Sum: 180, precipSum: 22, deficit: 158, days: 30 },
  hourlyVPD: 4.51, hourlySoil: 0.09,
  aqi: { usAqi: 62 }, alerts: [], errors: [], fetchTime: new Date(),
}, o);
const SG = { key: 'switchgrass', name: 'Switchgrass' };

/* ── The bug that motivated the refactor ────────────────────────────────────*/
suite('Stress Profile and WHY breakdown cannot disagree');
{
  const st = stressCompute(ENV(), SG);
  const ag = agScoreCompute(st, SG, ENV());
  const why = Object.fromEntries(ag.tolerance.contributors.map(c => [c.key, c.stress]));
  eq(st.heatStress,     why.heat,  'heat: stress card equals WHY breakdown');
  eq(st.droughtMemory,  why.water, 'water: stress card equals WHY breakdown');
  eq(st.vpdPressure,    why.vpd,   'VPD: stress card equals WHY breakdown');
  eq(st.soilStress,     why.soil,  'soil: stress card equals WHY breakdown');
}
{
  // The panels agree because both call the model layer. Prove that by checking
  // stressCompute against the pure term functions directly.
  const p = PLANT_ENV_PROFILES.switchgrass;
  const st = stressCompute(ENV(), SG);
  eq(st.heatStress,    M.heatStressTerm(38, p).score,               'stressCompute delegates heat to the model layer');
  eq(st.droughtMemory, M.waterDeficitProxyTerm(158, p).score,       'stressCompute delegates water to the model layer');
  eq(st.vpdPressure,   M.vpdTerm(4.51, p).score,                    'stressCompute delegates VPD to the model layer');
  eq(st.soilStress,    M.soilStressTerm(0.09, p).score,             'stressCompute delegates soil to the model layer');
}

suite('Unit handling — display units never change a scientific result');
{
  const c = stressCompute(ENV(), SG);
  const f = stressCompute(ENV({ tSuffix: '°F', current: { temp: 100.4, humidity: 32, uv: 9 } }), SG);
  eq(c.heatStress, f.heatStress, '38 °C and 100.4 °F produce an identical heat stress score');
}

suite('Missing inputs stay UNKNOWN through the adapter');
for (const [label, patch, field] of [
  ['no temperature', { current: { humidity: 32, uv: 9 } },       'heatStress'],
  ['no archive',     { archive30: null },                        'droughtMemory'],
  ['no soil',        { hourlySoil: null },                       'soilStress'],
]) {
  const st = stressCompute(ENV(patch), SG);
  eq(st[field], null, `${label}: ${field} is null, never 0`);
  ok(st.missing.length > 0, `${label}: the gap is reported in missing[]`);
}
{
  const st = stressCompute(ENV({ hourlyVPD: null, current: { temp: 38, humidity: null } }), SG);
  eq(st.vpdPressure, null, 'no provider VPD and no humidity yields null, not a fabricated value');
}
{
  // Provider VPD absent but temp+RH present → derived, and labelled as derived.
  const st = stressCompute(ENV({ hourlyVPD: null }), SG);
  ok(st.vpdPressure != null, 'VPD is derived from temperature and humidity when the provider field is absent');
  eq(st.vpdStatus, TC_STATUS.DERIVED, 'and is labelled DERIVED, not LIVE');
}
{
  const st = stressCompute(ENV(), SG);
  eq(st.vpdStatus, TC_STATUS.LIVE, 'a provider-supplied VPD is labelled LIVE');
  const sc = stressCompute(ENV({ isScenario: true }), SG);
  eq(sc.vpdStatus, TC_STATUS.DERIVED,
     'a scenario-modified VPD is DERIVED, never stamped as a live provider measurement');
}

suite('Water composite uses the central weights');
{
  const st = stressCompute(ENV(), SG);
  const w = TC_WEIGHTS.waterComposite;
  eq(st.waterStress, Math.round(st.droughtMemory * w.deficit + st.soilStress * w.soil),
     'composite equals the documented weighting of deficit and soil');
  const noSoil = stressCompute(ENV({ hourlySoil: null }), SG);
  eq(noSoil.waterStress, noSoil.droughtMemory, 'with soil UNKNOWN the composite falls back to the deficit alone');
  const neither = stressCompute(ENV({ hourlySoil: null, archive30: null }), SG);
  eq(neither.waterStress, null, 'with both UNKNOWN the composite is null, not 0');
}

/* ── Chemistry heuristic ────────────────────────────────────────────────────*/
suite('Chemistry risk — explicit inputs, no hidden globals');
{
  const st = stressCompute(ENV(), SG);
  const withUV = chemRiskCompute(st, SG, 9);
  const noUV   = chemRiskCompute(st, SG, null);
  ok(withUV != null && noUV != null, 'chem risk computes with and without a UV reading');
  eq(noUV.uvAvailable, false, 'missing UV is reported rather than silently treated as zero stress');
  ok(withUV.phenolic.score >= noUV.phenolic.score, 'a high UV reading does not lower phenolic risk');
  ok(noUV.phenolic.caveats != null, 'the missing UV input is surfaced as a caveat');
  // The function must not read appState — prove it by computing with an empty one.
  vm.runInContext('appState = {}', ctx);
  ok(chemRiskCompute(st, SG, 9) != null, 'chem risk does not depend on global app state');
}
{
  const st = stressCompute(ENV(), SG);
  const cr = chemRiskCompute(st, SG, 9);
  for (const k of ['osmolyte','saponin','phenolic','recalcitrance','fermentation']) {
    ok(['Low','Medium','High'].includes(cr[k].risk), `${k} returns a qualitative category, never a fabricated concentration`);
    ok(cr[k].explanation.length > 40, `${k} explains itself`);
  }
  ok(!/inhibit/i.test(cr.osmolyte.explanation.split('.')[0]),
     'the osmolyte explanation does not open by calling those compounds inhibitors');
  ok(/not established|NOT established|withdrawn/i.test(cr.osmolyte.explanation),
     'the osmolyte explanation states that the fermentation link is not established');
}
{
  // A CAM species uses a different water strategy and should not be scored as
  // if it accumulated osmolytes like a C4 grass under the same conditions.
  const st = stressCompute(ENV(), { key:'agave', name:'Agave' });
  const c4 = chemRiskCompute(stressCompute(ENV(), SG), SG, 9);
  const cam = chemRiskCompute(st, { key:'agave', name:'Agave' }, 9);
  ok(cam.osmolyte.score <= c4.osmolyte.score, 'a CAM species scores no higher osmolyte pressure than a C4 grass');
}

/* ── Pathways ───────────────────────────────────────────────────────────────*/
suite('Pathway heuristic');
{
  const st = stressCompute(ENV(), SG);
  const cr = chemRiskCompute(st, SG, 9);
  const pw = pathwayAnalysis(SG, st, cr);
  eq(pw.length, 4, 'all four conversion routes are scored');
  ok(pw.every(p => p.score >= 0 && p.score <= 100), 'pathway scores stay in range');
  ok(pw.every(p => p.status === TC_STATUS.EXPERIMENTAL), 'every pathway is labelled EXPERIMENTAL');
  ok(pw.every(p => p.processClass && p.processClass.length > 10), 'every pathway states its process class');
  const ad = pw.find(p => p.key === 'anaerobic_digestion');
  ok(/biological/i.test(ad.processClass), 'anaerobic digestion is classified as biological');
  // The description mentions gasification only to say it is NOT that, which is
  // the documented correction. Assert the disclaimer rather than the absence.
  ok(!/\bis a (?:form of )?gasif/i.test(ad.processClass + ' ' + ad.desc),
     'biogas is never described AS a gasification product');
  ok(/not .{0,20}gasification/i.test(ad.desc),
     'and the description explicitly separates it from gasification');
  const py = pw.find(p => p.key === 'pyrolysis');
  ok(/thermochemical/i.test(py.processClass), 'pyrolysis is classified as thermochemical');
  ok(pw[0].score >= pw[pw.length-1].score, 'pathways are returned best-first');
  eq(pathwayAnalysis(null, st, cr).length, 0, 'no plant yields no pathways rather than a default');
}
{
  // A woody, lignin-rich feedstock should favour thermal routes over fermentation.
  const oak = { key:'oak', name:'Oak' };
  const st = stressCompute(ENV(), oak);
  const pw = pathwayAnalysis(oak, st, chemRiskCompute(st, oak, 9));
  const eth = pw.find(p => p.key === 'cellulosic_ethanol').score;
  const pyr = pw.find(p => p.key === 'pyrolysis').score;
  ok(pyr > eth, 'a lignin-rich woody feedstock scores higher for pyrolysis than for cellulosic ethanol');
}

/* ── The suitability roll-up ────────────────────────────────────────────────*/
suite('Suitability index through the real adapter');
{
  const env = ENV();
  const st  = stressCompute(env, SG);
  const cr  = chemRiskCompute(st, SG, 9);
  const ag  = agScoreCompute(st, SG, env);
  const pw  = pathwayAnalysis(SG, st, cr);
  const bi  = bioScoreCompute(ag, cr, pw);
  ok(bi.total >= 0 && bi.total <= 100, 'the index is in range');
  near(bi.index.contributors.reduce((a,c)=>a+c.contribution,0), bi.total, 2, 'contributions sum to the index');
  // Missing chemistry must not silently become a favourable sub-score.
  const noChem = bioScoreCompute(ag, null, pw);
  ok(noChem.index.missing.some(m => m.key === 'chemSafety'),
     'absent chemistry is reported as a missing sub-score, not scored as safe');
  ok(noChem.index.renormalised, 'and the remaining weights are renormalised');
}
{
  // Ordering dependency: pathway analysis with no chemistry must not inflate.
  const env = ENV(); const st = stressCompute(env, SG);
  const withChem = pathwayAnalysis(SG, st, chemRiskCompute(st, SG, 9));
  const noChem   = pathwayAnalysis(SG, st, null);
  ok(noChem[0].score >= withChem[0].score,
     'running pathways before chemistry removes the stress penalty — a known ordering hazard, pinned so it stays visible');
}

/* ── Provider-response helpers ──────────────────────────────────────────────*/
suite('Hourly index selection (was reading midnight)');
{
  const times = [];
  const base = new Date('2026-07-15T00:00:00Z');
  for (let i = 0; i < 24; i++) times.push(new Date(base.getTime() + i*3600e3).toISOString().slice(0,16));
  eq(M.pickHourlyIndex(times, new Date('2026-07-15T14:20:00Z')), 14,
     'the 14:00 entry is chosen at 14:20, not index 0');
  eq(M.pickHourlyIndex(times, new Date('2026-07-15T00:10:00Z')), 0, 'midnight is chosen only when it IS midnight');
  ok(M.pickHourlyIndex(times, new Date('2026-07-16T09:00:00Z')) === 23,
     'a time past the series end falls back to the nearest entry, not the first');
  eq(M.pickHourlyIndex([], new Date()), -1, 'an empty series returns -1 rather than 0');
  eq(M.pickHourlyIndex(null, new Date()), -1, 'a missing series returns -1');
}

suite('Archive summation (was counting missing days as zero)');
{
  const et0 = Array(30).fill(6), pr = Array(30).fill(1);
  for (let i = 26; i < 30; i++) { et0[i] = null; pr[i] = null; }   // reanalysis lag
  const r = M.sumCompleteDays(et0, pr);
  eq(r.days, 26, 'only complete days are counted');
  eq(r.daysMissing, 4, 'unpublished days are reported, not hidden');
  eq(r.daysRequested, 30, 'the requested window length is retained');
  near(r.et0Sum, 156, 0.01, 'ET is summed over complete days only');
  near(r.deficit, 130, 0.01, 'the deficit describes the same 26 days for both series');
  // The old behaviour would have summed 26 days of ET against 30 days of rain
  // slots, understating the deficit. Pin that it does not.
  const naive = et0.reduce((a,b)=>a+(b||0),0) - pr.reduce((a,b)=>a+(b||0),0);
  eq(r.deficit, Math.round(naive*10)/10,
     'with paired exclusion the deficit matches the complete-day difference');
}
{
  const r = M.sumCompleteDays([6,null,6], [1,1,null]);
  eq(r.days, 1, 'a day missing EITHER series is excluded from both');
  eq(M.sumCompleteDays([null,null], [null,null]), null, 'no complete days yields null, not a zero deficit');
  eq(M.sumCompleteDays([], []), null, 'an empty archive yields null');
  const zeroRain = M.sumCompleteDays([6,6], [0,0]);
  eq(zeroRain.days, 2, 'a genuine zero-rainfall day is counted, not mistaken for missing data');
  near(zeroRain.deficit, 12, 0.01, 'and contributes its full deficit');
}

/* ── Display-unit normalisation ──────────────────────────────────────────────
   Every threshold in the dashboard/energy/agriculture layer is written in °F,
   while WEATHER_DATA is fetched in whichever unit the user selected. Comparing
   Celsius values against Fahrenheit thresholds did not error — it silently
   pinned the cooling-degree index at 0 and reported a 38 °C afternoon as
   "moderate conditions". Labels alone could not fix that; the numbers had to be
   normalised, and wxTempF is what does it. */
suite('Fahrenheit-calibrated thresholds work in metric');
{
  // utils.js only touches the DOM at call time, not load time, so a minimal
  // document stub is enough — no source rewriting needed.
  const uctx = {
    console,
    window: { matchMedia: () => ({ matches: false }) },
    document: { createElement: () => ({ appendChild(){}, innerHTML: '' }),
                createTextNode: t => t, getElementById: () => null },
  };
  vm.createContext(uctx);
  vm.runInContext('var WEATHER_UNITS_FETCHED = null;', uctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'utils.js'), 'utf8'), uctx, { filename: 'utils' });

  const setUnit = u => vm.runInContext(`WEATHER_UNITS_FETCHED = ${JSON.stringify(u)}`, uctx);
  const wxTempF = vm.runInContext('wxTempF', uctx);
  const getTempColor = vm.runInContext('getTempColor', uctx);
  const tUnit = vm.runInContext('tUnit', uctx);

  setUnit('imperial');
  near(wxTempF(100.4), 100.4, 0.01, 'imperial values pass through unchanged');
  eq(tUnit(), '°F', 'imperial labels read °F');
  const imperialColor = getTempColor(100.4);
  const imperialCDI   = Math.max(0, Math.round((wxTempF(100.4) - 65) * 0.8));

  setUnit('metric');
  near(wxTempF(38), 100.4, 0.01, '38 °C normalises to 100.4 °F for threshold comparison');
  eq(tUnit(), '°C', 'metric labels read °C');
  const metricColor = getTempColor(38);
  const metricCDI   = Math.max(0, Math.round((wxTempF(38) - 65) * 0.8));

  eq(metricCDI, imperialCDI, 'the cooling-degree index is identical for the same physical temperature in either unit');
  ok(metricCDI > 0, 'and is not pinned at zero in metric — the bug this replaced');
  eq(metricColor, imperialColor, 'temperature colour banding is identical in either unit');

  // The naive comparison this replaced, pinned so the regression is visible.
  ok(!(38 > 65), 'a raw Celsius reading never exceeds the 65 °F cooling base — why the unnormalised comparison always yielded 0');
  eq(wxTempF(null), null, 'a missing temperature stays null rather than becoming 32 °F');
  eq(wxTempF(NaN), null, 'NaN is rejected');
}
