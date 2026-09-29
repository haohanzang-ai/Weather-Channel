'use strict';
const { suite, ok, eq } = require('./harness.js');
const { evidenceConfidenceCompute: C, evidenceConfidenceSentence: S,
        TC_LAYER_CEILING, TC_CONFIDENCE } = require('../js/evidence-confidence.js');
const F = require('./fixtures.js');

const SG = { key:'switchgrass', name:'Switchgrass' };
const RANK = { LOW:1, MEDIUM:2, HIGH:3 };
const IDEAL = { ...F.AUSTIN_JULY.env, fetchTime: new Date() };

suite('Confidence — structural guarantees');
const best = C(IDEAL, SG, { missing: [] },
               { hasSpeciesProfile:true, hasCultivar:true, soilECProvided:true });
ok(best.layers.bioenergy.level === TC_CONFIDENCE.LOW,
   'the bioenergy layer is LOW even under the most favourable possible inputs');
ok(best.layers.stress.level !== TC_CONFIDENCE.HIGH,
   'the stress layer can never reach HIGH — no plant tissue is measured');
ok(best.layers.tolerance.level !== TC_CONFIDENCE.HIGH,
   'the tolerance layer can never reach HIGH — the model is uncalibrated');
ok(best.layers.biology.level !== TC_CONFIDENCE.HIGH,
   'the biology layer can never reach HIGH — nothing about gene activity is observed');
ok(best.layers.environment.level === TC_CONFIDENCE.HIGH,
   'the environment layer CAN reach HIGH — it is the only layer we actually measure');

suite('Confidence — monotonic degradation down the pipeline');
const order = ['environment','stress','tolerance','biology','bioenergy'];
for (const scenario of [
  ['ideal',      C(IDEAL, SG, {missing:[]}, {hasSpeciesProfile:true})],
  ['degraded',   C({...F.DEGRADED.env, fetchTime:new Date()}, SG, {missing:['archive','soil']}, {hasSpeciesProfile:true})],
  ['no plant',   C(IDEAL, null, null, {})],
  ['no env',     C(null, SG, null, {})],
  ['stale',      C({...IDEAL, fetchTime:new Date(Date.now()-12*3600e3)}, SG, {missing:[]}, {hasSpeciesProfile:true})],
  ['out of TX',  C({...IDEAL, lat:41.0, lon:-96.0}, SG, {missing:[]}, {hasSpeciesProfile:true})],
  ['scenario',   C(IDEAL, SG, {missing:[]}, {hasSpeciesProfile:true, isScenario:true})],
]) {
  const [name, ec] = scenario;
  let monotone = true;
  for (let i = 1; i < order.length; i++) {
    if (RANK[ec.layers[order[i]].level] > RANK[ec.layers[order[i-1]].level]) monotone = false;
  }
  ok(monotone, `confidence never increases downstream (${name}: ${order.map(o=>ec.layers[o].level[0]).join('→')})`);
}

suite('Confidence — responds to evidence');
const ideal    = C(IDEAL, SG, {missing:[]}, {hasSpeciesProfile:true});
const degraded = C({...F.DEGRADED.env, fetchTime:new Date()}, SG, {missing:['a','b']}, {hasSpeciesProfile:true});
const stale    = C({...IDEAL, fetchTime:new Date(Date.now()-12*3600e3)}, SG, {missing:[]}, {hasSpeciesProfile:true});
ok(RANK[degraded.layers.environment.level] < RANK[ideal.layers.environment.level],
   'failed providers lower environment confidence');
ok(RANK[stale.layers.environment.level] < RANK[ideal.layers.environment.level],
   'stale data lowers environment confidence');
const noProfile = C(IDEAL, {key:'zzz',name:'Unknown sp.'}, {missing:[]}, {hasSpeciesProfile:false});
ok(RANK[noProfile.layers.stress.level] <= RANK[ideal.layers.stress.level],
   'a species with no published profile does not gain confidence');
const outside = C({...IDEAL, lat:41.0, lon:-96.0}, SG, {missing:[]}, {hasSpeciesProfile:true});
ok(RANK[outside.layers.environment.level] <= RANK[ideal.layers.environment.level],
   'locations outside Texas do not gain confidence');
const scen = C(IDEAL, SG, {missing:[]}, {hasSpeciesProfile:true, isScenario:true});
ok(RANK[scen.layers.environment.level] < RANK[ideal.layers.environment.level],
   'a hand-modified scenario lowers confidence below the observed case');
ok(scen.layers.environment.why[0].startsWith('EXPERIMENTAL SCENARIO'),
   'a scenario says so first, before any other reason');

suite('Confidence — overall is the weakest layer, never an average');
ok(RANK[ideal.overall] === Math.min(...order.map(o => RANK[ideal.layers[o].level])),
   'overall equals the minimum across layers');
ok(order.includes(ideal.limiting), 'the limiting layer is named');

suite('Confidence — explanations and next steps');
for (const [name, ec] of [['ideal',ideal],['degraded',degraded],['no plant',C(IDEAL,null,null,{})]]) {
  for (const l of order) ok(ec.layers[l].why.length > 0, `${name}: the ${l} layer explains itself`);
}
ok(ideal.unknowns.length > 0, 'unknowns are enumerated even under ideal data');
ok(ideal.unknowns.every(u => u.what && u.why), 'every unknown names what is missing and why it matters');
ok(ideal.improvements.length > 0, 'concrete improvements are always offered');
ok(ideal.improvements.every(i => i.input && i.gain && i.how),
   'every improvement names the input, the gain, and how to get it');
eq(new Set(ideal.improvements.map(i=>i.input)).size, ideal.improvements.length,
   'improvements are deduplicated');
ok(degraded.improvements.length >= ideal.improvements.length,
   'worse data yields at least as many suggested improvements');
ok(S(ideal).includes(ideal.overall), 'the summary sentence states the overall level');
eq(S(null), '', 'the summary of nothing is empty, not a crash');

suite('Confidence — salinity is never inferred from geography');
const coastal = C({...IDEAL, lat:27.80, lon:-97.40}, SG, {missing:[]}, {hasSpeciesProfile:true});
ok(coastal.unknowns.some(u => /salinity/i.test(u.what)),
   'a coastal location still reports salinity as UNKNOWN rather than inferring it');
const withEC = C(IDEAL, SG, {missing:[]}, {hasSpeciesProfile:true, soilECProvided:true});
ok(!withEC.unknowns.some(u => /salinity/i.test(u.what)),
   'salinity leaves the unknown list only when a measured EC value is supplied');
