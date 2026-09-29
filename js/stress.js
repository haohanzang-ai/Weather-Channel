'use strict';

// ── Plant environmental threshold profiles ────────────────────────────────────
// LITERATURE-DERIVED ESTIMATES, NOT LAB MEASUREMENTS AND NOT CULTIVAR-SPECIFIC.
//
// Each row summarises published tolerance information for a SPECIES. Two limits
// on how far these can be pushed, both of which the Evidence Confidence engine
// accounts for:
//
//   1. Within-species variation is large. Upland and lowland switchgrass
//      ecotypes differ markedly in heat and water response, and cultivar is
//      almost never known here. The species row is a midpoint, not a spec.
//   2. These are thresholds for STRESS ONSET, not for death or for yield loss
//      of a stated magnitude. They order conditions; they do not predict outcomes.
//
// Sources consulted for the ordering: Sanderson et al. (2006) Bioresource
// Technology 99(2):479–485; Barney et al. (2009) Plant Science 177(6):724–732;
// Clifton-Brown & Lewandowski (2000) on Miscanthus water relations; Nobel (1988)
// on CAM succulent physiology; USDA ARS and DOE bioenergy feedstock summaries.
//
// heatStressF / heatCriticalF  °F at which heat stress begins / becomes severe
// droughtScore (0-100)         drought tolerance — higher = more tolerant
// waterReq30mm                 minimum mm of water per 30 days for viable growth
// vpdStressKPa                 VPD (kPa) above which stomatal limitation begins
// soilStressMin                m³/m³ soil moisture below which stress is severe
// envBenefit (0-100)           literature-derived environmental co-benefit rating

/* Shown wherever a species threshold is displayed. The previous wording was
   "(cited literature)", which claimed a per-value citation that does not exist:
   no individual row below is attributable to a specific paper. */
const TC_PROFILE_SOURCE_NOTE =
  'Species-level literature-derived estimate — not cultivar-specific and not individually cited. ' +
  'Within-species variation can exceed the differences this analysis measures.';

const PLANT_ENV_PROFILES = {
  switchgrass:      { heatStressF:95,  heatCriticalF:113, droughtScore:80, waterReq30mm:40,  vpdStressKPa:2.5, soilStressMin:0.15, photosynthesis:'C4',  envBenefit:85, chem:'grass-cellulosic',     inhibitorRisk:'low'    },
  miscanthus:       { heatStressF:90,  heatCriticalF:104, droughtScore:55, waterReq30mm:60,  vpdStressKPa:1.8, soilStressMin:0.22, photosynthesis:'C4',  envBenefit:70, chem:'grass-cellulosic',     inhibitorRisk:'low'    },
  sorghum:          { heatStressF:100, heatCriticalF:115, droughtScore:85, waterReq30mm:35,  vpdStressKPa:3.0, soilStressMin:0.12, photosynthesis:'C4',  envBenefit:75, chem:'grass-cellulosic',     inhibitorRisk:'low'    },
  sugarcane:        { heatStressF:86,  heatCriticalF:100, droughtScore:25, waterReq30mm:130, vpdStressKPa:1.2, soilStressMin:0.30, photosynthesis:'C4',  envBenefit:50, chem:'grass-sucrose',        inhibitorRisk:'low'    },
  energy_cane:      { heatStressF:88,  heatCriticalF:102, droughtScore:40, waterReq30mm:100, vpdStressKPa:1.5, soilStressMin:0.28, photosynthesis:'C4',  envBenefit:65, chem:'grass-sucrose',        inhibitorRisk:'low'    },
  agave:            { heatStressF:113, heatCriticalF:125, droughtScore:95, waterReq30mm:5,   vpdStressKPa:5.5, soilStressMin:0.05, photosynthesis:'CAM', envBenefit:92, chem:'succulent-inulin',     inhibitorRisk:'medium' },
  prickly_pear:     { heatStressF:115, heatCriticalF:130, droughtScore:95, waterReq30mm:5,   vpdStressKPa:5.0, soilStressMin:0.04, photosynthesis:'CAM', envBenefit:88, chem:'cactus-mucilage',      inhibitorRisk:'high'   },
  mesquite:         { heatStressF:104, heatCriticalF:120, droughtScore:90, waterReq30mm:20,  vpdStressKPa:4.0, soilStressMin:0.08, photosynthesis:'C3',  envBenefit:80, chem:'woody-tannin',         inhibitorRisk:'high'   },
  eastern_redcedar: { heatStressF:100, heatCriticalF:113, droughtScore:80, waterReq30mm:25,  vpdStressKPa:3.5, soilStressMin:0.10, photosynthesis:'C3',  envBenefit:85, chem:'woody-aromatic',       inhibitorRisk:'high'   },
  bamboo:           { heatStressF:90,  heatCriticalF:106, droughtScore:55, waterReq30mm:60,  vpdStressKPa:2.0, soilStressMin:0.20, photosynthesis:'C3',  envBenefit:45, chem:'grass-cellulosic',     inhibitorRisk:'medium' },
  hemp:             { heatStressF:86,  heatCriticalF:100, droughtScore:55, waterReq30mm:55,  vpdStressKPa:2.0, soilStressMin:0.20, photosynthesis:'C3',  envBenefit:70, chem:'fiber-cellulosic',     inhibitorRisk:'low'    },
  poplar:           { heatStressF:90,  heatCriticalF:104, droughtScore:40, waterReq30mm:75,  vpdStressKPa:1.6, soilStressMin:0.25, photosynthesis:'C3',  envBenefit:55, chem:'woody-lignin',         inhibitorRisk:'medium' },
  willow:           { heatStressF:86,  heatCriticalF:98,  droughtScore:25, waterReq30mm:100, vpdStressKPa:1.3, soilStressMin:0.30, photosynthesis:'C3',  envBenefit:55, chem:'woody-lignin',         inhibitorRisk:'medium' },
  eucalyptus:       { heatStressF:95,  heatCriticalF:110, droughtScore:55, waterReq30mm:65,  vpdStressKPa:2.2, soilStressMin:0.18, photosynthesis:'C3',  envBenefit:30, chem:'woody-aromatic',       inhibitorRisk:'high'   },
  pine:             { heatStressF:95,  heatCriticalF:109, droughtScore:55, waterReq30mm:55,  vpdStressKPa:2.0, soilStressMin:0.18, photosynthesis:'C3',  envBenefit:60, chem:'woody-resin',          inhibitorRisk:'high'   },
  oak:              { heatStressF:95,  heatCriticalF:109, droughtScore:60, waterReq30mm:50,  vpdStressKPa:2.2, soilStressMin:0.16, photosynthesis:'C3',  envBenefit:20, chem:'woody-tannin',         inhibitorRisk:'high'   },
  wood_biomass:     { heatStressF:95,  heatCriticalF:109, droughtScore:55, waterReq30mm:50,  vpdStressKPa:2.0, soilStressMin:0.18, photosynthesis:'C3',  envBenefit:50, chem:'woody-lignin',         inhibitorRisk:'medium' },
  corn_stover:      { heatStressF:95,  heatCriticalF:110, droughtScore:50, waterReq30mm:70,  vpdStressKPa:2.0, soilStressMin:0.20, photosynthesis:'C4',  envBenefit:55, chem:'grass-cellulosic',     inhibitorRisk:'low'    },
  corn_plant:       { heatStressF:95,  heatCriticalF:110, droughtScore:50, waterReq30mm:70,  vpdStressKPa:2.0, soilStressMin:0.20, photosynthesis:'C4',  envBenefit:55, chem:'grass-cellulosic',     inhibitorRisk:'low'    },
  cotton_stover:    { heatStressF:100, heatCriticalF:115, droughtScore:65, waterReq30mm:45,  vpdStressKPa:2.5, soilStressMin:0.15, photosynthesis:'C3',  envBenefit:60, chem:'fiber-cellulosic',     inhibitorRisk:'medium' },
  water_hyacinth:   { heatStressF:95,  heatCriticalF:108, droughtScore:5,  waterReq30mm:999, vpdStressKPa:1.8, soilStressMin:0.40, photosynthesis:'C3',  envBenefit:75, chem:'aquatic-cellulosic',   inhibitorRisk:'low'    },
  algae:            { heatStressF:95,  heatCriticalF:108, droughtScore:5,  waterReq30mm:999, vpdStressKPa:1.5, soilStressMin:0.40, photosynthesis:'C3',  envBenefit:80, chem:'aquatic-lipid',        inhibitorRisk:'low'    },
  _default:         { heatStressF:95,  heatCriticalF:113, droughtScore:50, waterReq30mm:60,  vpdStressKPa:2.0, soilStressMin:0.20, photosynthesis:'C3',  envBenefit:50, chem:'unknown',              inhibitorRisk:'unknown'},
};

// ── Stress computation ────────────────────────────────────────────────────────
// All scores 0-100. null = data not available (never fake).
function stressCompute(envData, plant) {
  if (!envData || !plant) return null;
  const profile = PLANT_ENV_PROFILES[plant.key] || PLANT_ENV_PROFILES._default;
  const cur = envData.current;
  const isFahrenheit = envData.tSuffix === '°F';
  const scores = { profile, missing: [] };

  // This function used to reimplement every stress term with its thresholds
  // hard-coded (VPD floor 0.5, ceiling 40, slope 25, deficit reference 60, soil
  // multiplier 2.5, ceiling 70, composite 0.6/0.4). That meant editing
  // science-constants.js moved the WHY panel and the Suitability Index but NOT
  // these cards — the two panels could display contradictory numbers for the
  // same quantity with no error anywhere. It also broke the project's own rule
  // that no scientific number lives in a UI file.
  //
  // It now calls the same pure term functions the tested model layer uses, so
  // the Stress Profile and the WHY breakdown are guaranteed to agree by
  // construction rather than by discipline.

  // Normalise temperature to °C once. The model layer works only in °C so that
  // a display-unit change can never alter a scientific result.
  const tempC  = cur?.temp != null ? (isFahrenheit ? fToC(cur.temp) : cur.temp) : null;
  const vpdKPa = envData.hourlyVPD ?? computeVPD(tempC, cur?.humidity ?? null);

  const heat  = heatStressTerm(tempC, profile);
  const water = waterDeficitProxyTerm(envData.archive30?.deficit ?? null, profile);
  const vpd   = vpdTerm(vpdKPa, profile);
  const soil  = soilStressTerm(envData.hourlySoil ?? null, profile);
  scores.terms = { heat, water, vpd, soil };

  // — Heat ——
  scores.heatStress = heat.score;
  if (heat.score != null) {
    scores.heatSource = `Open-Meteo current temperature: ${heat.value} ${heat.unit}`;
    scores.heatStatus = TC_STATUS.DERIVED;
    scores.heatThresholdLabel = `Stress onset ${profile.heatStressF} °F, critical ${profile.heatCriticalF} °F. ${TC_PROFILE_SOURCE_NOTE}`;
  } else {
    scores.heatStatus = TC_STATUS.UNKNOWN;
    scores.missing.push('current temperature (Open-Meteo current weather unavailable)');
  }

  // — Climate Water Deficit Proxy (30-day) ——
  // NOT plant drought stress: reference ET minus precipitation is atmospheric
  // demand for a standard 0.12 m grass surface against supply from rain. Crop
  // coefficient, soil storage, rooting depth, growth stage and irrigation all
  // sit between this number and what a plant actually experiences.
  scores.droughtMemory = water.score;
  if (water.score != null) {
    scores.droughtSource = `Open-Meteo archive: ${envData.archive30.days}-day reference ET minus precipitation = ${water.value} mm`;
    scores.droughtStatus = TC_STATUS.DERIVED;
    scores.droughtThresholdLabel = `Scaled by species drought tolerance ${profile.droughtScore}/100. A CLIMATE water deficit proxy — it excludes crop coefficient, soil storage, rooting depth and irrigation. ${TC_PROFILE_SOURCE_NOTE}`;
  } else {
    scores.droughtStatus = TC_STATUS.UNKNOWN;
    scores.missing.push('30-day archive data (Open-Meteo archive API unavailable)');
  }

  // — VPD ——
  scores.vpdPressure = vpd.score;
  if (vpd.score != null) {
    const providerVPD = envData.hourlyVPD != null;
    scores.vpdSource = providerVPD
      ? `Open-Meteo hourly vapour_pressure_deficit field: ${vpd.value} kPa`
      : `Derived from temperature and humidity via the FAO-56 Tetens equation: ${vpd.value} kPa`;
    // A scenario-modified VPD is recomputed by us, so it is DERIVED even though
    // it arrived in the provider's field. Without this check a hand-edited
    // value would be stamped as a live provider measurement.
    scores.vpdStatus = (providerVPD && !envData.isScenario) ? TC_STATUS.LIVE : TC_STATUS.DERIVED;
    scores.vpdCaveat = 'Screen-level (~2 m) VPD. Leaf-to-air VPD in full sun is higher, and hourly sampling misses the midday peak that actually closes stomata.';
    scores.vpdThresholdLabel = `Species VPD stress threshold ${profile.vpdStressKPa} kPa. ${TC_PROFILE_SOURCE_NOTE}`;
  } else {
    scores.vpdStatus = TC_STATUS.UNKNOWN;
    scores.missing.push('VPD (no provider field, and temperature or humidity unavailable)');
  }

  // — Soil moisture ——
  scores.soilStress = soil.score;
  if (soil.score != null) {
    scores.soilSource = `Open-Meteo hourly soil_moisture_0_to_1cm: ${soil.value} m³/m³`;
    scores.soilStatus = envData.isScenario ? TC_STATUS.DERIVED : TC_STATUS.LIVE;
    scores.soilThresholdLabel = `Species stress minimum ${profile.soilStressMin} m³/m³. This is the 0–1 cm surface layer, NOT the water available to the root zone. ${TC_PROFILE_SOURCE_NOTE}`;
  } else {
    scores.soilStatus = TC_STATUS.UNKNOWN;
    scores.missing.push('soil moisture (Open-Meteo hourly soil_moisture_0_to_1cm not available)');
  }

  // — Water stress composite ——
  const wc = TC_WEIGHTS.waterComposite;
  const droughtValid = scores.droughtMemory != null;
  const soilValid    = scores.soilStress    != null;
  if (droughtValid && soilValid)
    scores.waterStress = Math.round(scores.droughtMemory * wc.deficit + scores.soilStress * wc.soil);
  else if (droughtValid) scores.waterStress = scores.droughtMemory;
  else if (soilValid)    scores.waterStress = scores.soilStress;
  else                   scores.waterStress = null;

  scores.waterStressSource = [
    droughtValid ? `30-day deficit proxy (${Math.round(wc.deficit*100)}%)` : null,
    soilValid    ? `surface soil moisture (${droughtValid ? Math.round(wc.soil*100) : 100}%)` : null,
  ].filter(Boolean).join(' + ') || 'Needs data';

  return scores;
}

// ── Chemistry Risk ────────────────────────────────────────────────────────────
// Returns LOW / MEDIUM / HIGH risk categories. Never claims exact compound levels.
// These are risk estimates based on environmental history + plant type, NOT measurements.
function chemRiskCompute(stress, plant, uvIndex) {
  if (!stress || !plant) return null;
  const W = TC_WEIGHTS.chemRisk;
  const profile = PLANT_ENV_PROFILES[plant.key] || PLANT_ENV_PROFILES._default;

  // UV is now an explicit PARAMETER. It used to be read straight off
  // appState.envData inside this function, which made the result depend on
  // state the caller never passed — so a scenario's stress could be mixed with
  // the baseline's UV, and the function could not be tested outside a browser.
  const uv = uvIndex ?? null;

  const dr = stress.droughtMemory ?? 0;
  const hs = stress.heatStress    ?? 0;
  const vp = stress.vpdPressure   ?? 0;
  const hasArchive = stress.droughtMemory != null;
  const hasTemp    = stress.heatStress    != null;

  // — Osmolyte accumulation ——
  // Well supported: plants under drought and osmotic stress accumulate
  // compatible solutes such as proline and glycine betaine. What this does NOT
  // support is the claim this app used to make — that those compounds inhibit
  // industrial fermentation. See TC_RETIRED_CLAIMS.
  const camFactor = profile.photosynthesis === 'CAM' ? W.camFactor : 1.0;
  const osmoBase  = (dr * W.osmolyteDrought + vp * W.osmolyteVpd) / 100 * camFactor;
  const osmoRisk  = osmoBase > 0.55 ? 'High' : osmoBase > 0.25 ? 'Medium' : 'Low';
  const osmoConf  = (hasArchive && stress.vpdPressure != null) ? 'Moderate' : 'Low (missing data)';
  const osmoCaveats = !hasArchive ? 'Water deficit history unavailable — this rests on VPD alone.' : null;

  // — Inherent inhibitor load ——
  const inherentInhibitor = profile.inhibitorRisk || 'unknown';
  let sapBase = W.inhibitorBase[inherentInhibitor] ?? W.inhibitorBase.unknown;
  sapBase = Math.min(1.0, sapBase + hs / 100 * W.inhibitorHeatGain + dr / 100 * W.inhibitorDroughtGain);
  const sapRisk = sapBase > 0.60 ? 'High' : sapBase > 0.35 ? 'Medium' : 'Low';
  const sapConf = hasTemp ? 'Low–Moderate' : 'Low (insufficient data)';

  // — Phenolics ——
  const uvFactor = uv != null
    ? Math.min(100, Math.max(0, (uv - W.uvThreshold) * W.uvPerUnit))
    : 0;
  const phenBase = (hs * W.phenolicHeat + dr * W.phenolicDrought + uvFactor * W.phenolicUv) / 100;
  const phenRisk = phenBase > 0.55 ? 'High' : phenBase > 0.28 ? 'Medium' : 'Low';
  const phenConf = (hasTemp && hasArchive && uv != null) ? 'Moderate' : 'Low (missing input data)';

  // — Cell-wall recalcitrance ——
  const woodyTypes = ['woody-lignin','woody-tannin','woody-aromatic','woody-resin'];
  const isWoody = woodyTypes.includes(profile.chem);
  const recalBase = (isWoody ? W.recalcitranceWoodyBase : W.recalcitranceHerbBase)
                  + Math.round(dr * W.recalcitranceDroughtGain + hs * W.recalcitranceHeatGain);
  const recalScore = Math.min(100, recalBase);
  const recalRisk  = recalScore > 60 ? 'High' : recalScore > 38 ? 'Medium' : 'Low';
  const recalConf  = 'Moderate (plant type known; stress modifier is a heuristic)';

  // — Combined conversion difficulty ——
  const fermBase = (osmoBase * W.fermOsmolyte + phenBase * W.fermPhenolic + recalScore / 100 * W.fermRecalcitrance);
  const fermRisk = fermBase > 0.55 ? 'High' : fermBase > 0.28 ? 'Medium' : 'Low';
  const fermConf = (hasArchive && hasTemp) ? 'Moderate' : 'Low (limited input data)';

  return {
    osmolyte: { risk: osmoRisk, confidence: osmoConf, caveats: osmoCaveats, score: Math.round(osmoBase * 100),
      explanation: 'Drought and high VPD drive accumulation of compatible solutes such as proline and glycine betaine, which stabilise proteins and membranes. This is well established. Whether it affects industrial fermentation is NOT established — an earlier version of this app called these compounds fermentation inhibitors, which was an overgeneralisation and has been withdrawn.' },
    saponin: { risk: sapRisk, confidence: sapConf, caveats: null, score: Math.round(sapBase * 100),
      explanation: `This plant type carries a ${inherentInhibitor} inherent secondary-metabolite load, and heat and drought may raise it further. The inherent rating is a species-level literature estimate; the stress modifier is a heuristic.` },
    phenolic: { risk: phenRisk, confidence: phenConf, caveats: uv == null ? 'UV index unavailable — this rests on heat and water deficit alone.' : null, score: Math.round(phenBase * 100),
      explanation: 'UV, heat and drought are all documented triggers of phenolic synthesis as a plant defence, and phenolics released during pretreatment are among the well-documented inhibitors of enzymatic hydrolysis and fermentation. The direction is supported; the magnitude here is not measured.' },
    recalcitrance: { risk: recalRisk, confidence: recalConf, caveats: null, score: recalScore,
      explanation: isWoody
        ? 'Woody biomass carries inherently higher lignin, requiring more intensive pretreatment to reach the cellulose.'
        : 'Grass lignin is lower than woody biomass, and drought stress is associated with increased lignification, which raises pretreatment cost.' },
    fermentation: { risk: fermRisk, confidence: fermConf, caveats: null, score: Math.round(fermBase * 100),
      explanation: 'A combined difficulty estimate from the axes above. It is a HYPOTHESIS about conversion, not a measurement: no biomass from this plant has been assayed and no conversion has been performed.' },
    caveat: 'Environmental history suggests a risk direction. Laboratory analysis is required to measure any actual compound concentration — weather cannot measure chemistry.',
    missing: stress.missing || [],
    uvAvailable: uv != null,
  };
}

// ── Render stress profile into #stressProfileSection ─────────────────────────
function renderStressProfile() {
  const el = document.getElementById('stressProfileSection');
  const el2 = document.getElementById('chemRiskSection');
  if (!el) return;

  if (!appState.plant) {
    el.innerHTML = '<div class="score-needs-data">Select a plant in Step 1 to compute the stress profile.</div>';
    if (el2) el2.innerHTML = '';
    return;
  }
  if (!appState.envData) {
    el.innerHTML = '<div class="score-needs-data">Measure your location in Step 2 to compute the stress profile.</div>';
    if (el2) el2.innerHTML = '';
    return;
  }

  const stress = stressCompute(appState.envData, appState.plant);
  if (!stress) { el.innerHTML = '<div class="score-needs-data">Unable to compute stress scores.</div>'; return; }
  appState.stressScores = stress;
  if (typeof atlasOnStressUpdate === 'function') atlasOnStressUpdate();

  const _bar = (score, color) => score != null
    ? `<div class="score-bar-wrap"><div class="score-bar-fill" style="width:${score}%;background:${color}"></div></div>`
    : '';
  const _scoreDisplay = (score, high, mid) => score == null
    ? '<span class="score-na">Needs data</span>'
    : `<span class="score-num" style="color:${score>=high?'#D64545':score>=mid?'#F5A623':'#5DDBA8'}">${score}</span>`;
  const _src = (txt) => `<span class="score-src">${escapeHtml(txt)}</span>`;

  el.innerHTML = `
    <div class="stress-scores-grid">
      <div class="stress-score-card">
        <div class="stress-score-header">
          <span class="stress-score-icon">🔥</span>
          <div>
            <div class="stress-score-name">Heat Stress Score</div>
            <div class="stress-score-sub">${_scoreDisplay(stress.heatStress, 70, 35)} / 100</div>
          </div>
        </div>
        ${_bar(stress.heatStress, stress.heatStress>=70?'#D64545':stress.heatStress>=35?'#F5A623':'#5DDBA8')}
        ${stress.heatSource ? _src(stress.heatSource) : '<span class="score-na">Needs data</span>'}
        <div class="stress-method-note">Method: ${escapeHtml(stress.heatThresholdLabel||'—')}</div>
      </div>

      <div class="stress-score-card">
        <div class="stress-score-header">
          <span class="stress-score-icon">💧</span>
          <div>
            <div class="stress-score-name">Climate Water Deficit Proxy (30-day)</div>
            <div class="stress-score-sub">${_scoreDisplay(stress.droughtMemory, 60, 30)} / 100</div>
          </div>
        </div>
        ${_bar(stress.droughtMemory, stress.droughtMemory>=60?'#D64545':stress.droughtMemory>=30?'#F5A623':'#5DDBA8')}
        ${stress.droughtSource ? _src(stress.droughtSource) : '<span class="score-na">Needs data</span>'}
        <div class="stress-method-note">Method: ${escapeHtml(stress.droughtThresholdLabel||'—')}</div>
      </div>

      <div class="stress-score-card">
        <div class="stress-score-header">
          <span class="stress-score-icon">💨</span>
          <div>
            <div class="stress-score-name">VPD Pressure Score</div>
            <div class="stress-score-sub">${_scoreDisplay(stress.vpdPressure, 60, 30)} / 100</div>
          </div>
        </div>
        ${_bar(stress.vpdPressure, stress.vpdPressure>=60?'#D64545':stress.vpdPressure>=30?'#F5A623':'#5DDBA8')}
        ${stress.vpdSource ? _src(stress.vpdSource) : '<span class="score-na">Needs data</span>'}
        <div class="stress-method-note">Method: ${escapeHtml(stress.vpdThresholdLabel||'—')}</div>
      </div>

      <div class="stress-score-card">
        <div class="stress-score-header">
          <span class="stress-score-icon">🌱</span>
          <div>
            <div class="stress-score-name">Soil Moisture Stress</div>
            <div class="stress-score-sub">${_scoreDisplay(stress.soilStress, 60, 30)} / 100</div>
          </div>
        </div>
        ${_bar(stress.soilStress, stress.soilStress>=60?'#D64545':stress.soilStress>=30?'#F5A623':'#5DDBA8')}
        ${stress.soilSource ? _src(stress.soilSource) : '<span class="score-na">Needs data</span>'}
        <div class="stress-method-note">Method: ${escapeHtml(stress.soilThresholdLabel||'—')}</div>
      </div>

      <div class="stress-score-card stress-score-composite">
        <div class="stress-score-header">
          <span class="stress-score-icon">⚠</span>
          <div>
            <div class="stress-score-name">Water Stress (Composite)</div>
            <div class="stress-score-sub">${_scoreDisplay(stress.waterStress, 60, 30)} / 100</div>
          </div>
        </div>
        ${_bar(stress.waterStress, stress.waterStress>=60?'#D64545':stress.waterStress>=30?'#F5A623':'#5DDBA8')}
        <span class="score-src">Composed from: ${escapeHtml(stress.waterStressSource)}</span>
      </div>
    </div>

    ${stress.missing.length ? `
    <div class="stress-missing-bar">
      <strong>Missing data:</strong>
      ${stress.missing.map(m => `<span class="score-missing-item">⚠ ${escapeHtml(m)}</span>`).join('')}
    </div>` : ''}

    <div class="stress-data-note">
      Stress scores compare live environmental values against species thresholds from published literature.
      Nothing about the plant itself is measured: no tissue, no water potential, no gas exchange. These scores
      describe the <em>environment</em> relative to what the literature says this species tolerates — they are
      not observations of a stressed plant.
    </div>
  `;

  // render chemistry risk
  const chemRisk = chemRiskCompute(stress, appState.plant, appState.envData?.current?.uv ?? null);
  appState.chemRisk = chemRisk;
  if (el2 && chemRisk) _renderChemRisk(el2, chemRisk);

  // trigger downstream
  if (typeof renderAgScore === 'function') renderAgScore();
}

function _renderChemRisk(el, cr) {
  const _badge = (risk) => {
    const color = risk==='High'?'#D64545':risk==='Medium'?'#F5A623':'#5DDBA8';
    return `<span class="chem-risk-badge" style="background:${color}22;color:${color};border-color:${color}55">${risk}</span>`;
  };
  const rows = [
    { icon:'💧', name:'Osmolyte Pressure Risk',        key:'osmolyte'     },
    { icon:'🧪', name:'Saponin / Inhibitor Risk',      key:'saponin'      },
    { icon:'🍁', name:'Phenolic / Extractive Risk',    key:'phenolic'     },
    { icon:'🧱', name:'Cell-wall Recalcitrance Risk',  key:'recalcitrance'},
    { icon:'🦠', name:'Fermentation Lag Risk',         key:'fermentation' },
  ];

  el.innerHTML = `
    <div class="chem-risk-header">
      <div class="chem-risk-title">Stress-to-Fuel Chemistry Risk</div>
      <div class="chem-risk-sub">Risk categories estimated from measured environmental history + plant type. Not compound measurements.
      Lab data is needed to confirm actual concentrations.</div>
    </div>
    <div class="chem-risk-grid">
      ${rows.map(r => {
        const d = cr[r.key];
        return `
        <div class="chem-risk-card">
          <div class="chem-risk-card-head">
            <span>${r.icon}</span>
            <span class="chem-risk-name">${r.name}</span>
            ${_badge(d.risk)}
          </div>
          <div class="chem-risk-explanation">${escapeHtml(d.explanation)}</div>
          <div class="chem-risk-conf">Confidence: <em>${escapeHtml(d.confidence)}</em>${d.caveats ? ' · ⚠ '+escapeHtml(d.caveats) : ''}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="chem-risk-caveat">⚠ ${escapeHtml(cr.caveat)}</div>
  `;
}
