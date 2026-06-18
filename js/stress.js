'use strict';

// ── Plant environmental threshold profiles ────────────────────────────────────
// Values are research-based estimates from published literature, NOT lab measurements.
// Sources: Narayanan 2017 (switchgrass heat), Prasad 2008 (sorghum), Nobel 1988 (agave),
//          Clifton-Brown 2000 (miscanthus), USDA ARS, DOE Bioenergy, general plant physiology.
// heatStressF / heatCriticalF: °F at which heat stress begins / becomes severe
// droughtScore (0-100): drought tolerance — higher = more tolerant
// waterReq30mm: minimum mm of water per 30-day period for viable growth
// vpdStressKPa: VPD (kPa) above which stomatal closure and stress begin
// soilStressMin: m³/m³ soil moisture below which stress is severe
// envBenefit (0-100): environmental co-benefit score from literature

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

  // — Heat Stress Score ——
  if (cur?.temp != null) {
    const t = cur.temp; // already in user's unit
    const lo = isFahrenheit ? profile.heatStressF : (profile.heatStressF - 32) * 5/9;
    const hi = isFahrenheit ? profile.heatCriticalF : (profile.heatCriticalF - 32) * 5/9;
    if (t <= lo)     scores.heatStress = 0;
    else if (t >= hi) scores.heatStress = 100;
    else              scores.heatStress = Math.round((t - lo) / (hi - lo) * 100);
    scores.heatSource = 'Open-Meteo current temperature (Live API)';
    scores.heatThresholdLabel = `${profile.heatStressF}°F stress onset / ${profile.heatCriticalF}°F critical (cited literature)`;
  } else {
    scores.heatStress = null;
    scores.missing.push('current temperature (Open-Meteo current weather unavailable)');
  }

  // — Drought Memory Score (30-day) ——
  if (envData.archive30?.deficit != null) {
    const deficit = envData.archive30.deficit; // negative = surplus
    if (deficit <= 0) {
      scores.droughtMemory = 0; // surplus = no drought stress
    } else {
      // Drought-tolerant plants show less stress per mm of deficit
      const stressFactor = (100 - profile.droughtScore) / 100;
      scores.droughtMemory = Math.min(100, Math.round(deficit / 60 * stressFactor * 150));
    }
    scores.droughtSource = `Open-Meteo archive API — ${envData.archive30.days}-day ET₀ − precip deficit: ${envData.archive30.deficit} mm (Live API)`;
    scores.droughtThresholdLabel = `Plant drought tolerance score: ${profile.droughtScore}/100 (cited literature)`;
  } else {
    scores.droughtMemory = null;
    scores.missing.push('30-day archive data (Open-Meteo archive API unavailable)');
  }

  // — VPD Pressure Score ——
  const vpdKPa = envData.hourlyVPD ?? (() => {
    // Fall back to Tetens approximation if real VPD unavailable
    if (cur?.temp == null || cur?.humidity == null) return null;
    const tC = isFahrenheit ? (cur.temp - 32) * 5/9 : cur.temp;
    const es = 0.6108 * Math.exp(17.27 * tC / (tC + 237.3));
    return Math.round((es * (1 - cur.humidity / 100)) * 100) / 100;
  })();

  if (vpdKPa != null) {
    const lo = 0.5; // minimal stress threshold for all plants
    const hi = profile.vpdStressKPa;
    if (vpdKPa <= lo)   scores.vpdPressure = 0;
    else if (vpdKPa < hi) scores.vpdPressure = Math.round((vpdKPa - lo) / (hi - lo) * 40);
    else                  scores.vpdPressure = Math.min(100, Math.round(40 + (vpdKPa - hi) * 25));
    scores.vpdSource = envData.hourlyVPD != null
      ? `Open-Meteo hourly vapour_pressure_deficit: ${vpdKPa} kPa (Live API)`
      : `Estimated from temperature+humidity via Tetens equation: ${vpdKPa} kPa (Live-Derived)`;
    scores.vpdThresholdLabel = `Plant VPD stress threshold: ${profile.vpdStressKPa} kPa (cited literature)`;
  } else {
    scores.vpdPressure = null;
    scores.missing.push('VPD data (no hourly field and temperature/humidity unavailable)');
  }

  // — Soil Moisture Stress Score ——
  if (envData.hourlySoil != null) {
    const soil = envData.hourlySoil;
    const minSoil = profile.soilStressMin;
    const optSoil = minSoil * 2.5;
    if (soil >= optSoil)    scores.soilStress = 0;
    else if (soil <= minSoil) scores.soilStress = 100;
    else                    scores.soilStress = Math.round((optSoil - soil) / (optSoil - minSoil) * 70);
    scores.soilSource = `Open-Meteo hourly soil_moisture_0_to_1cm: ${envData.hourlySoil} m³/m³ (Live API)`;
    scores.soilThresholdLabel = `Plant stress min: ${profile.soilStressMin} m³/m³ (cited literature)`;
  } else {
    scores.soilStress = null;
    scores.missing.push('soil moisture (Open-Meteo hourly soil_moisture_0_to_1cm not available)');
  }

  // — Water Stress (composite) ——
  const droughtValid = scores.droughtMemory != null;
  const soilValid    = scores.soilStress    != null;
  if (droughtValid && soilValid)      scores.waterStress = Math.round(scores.droughtMemory * 0.6 + scores.soilStress * 0.4);
  else if (droughtValid)              scores.waterStress = scores.droughtMemory;
  else if (soilValid)                 scores.waterStress = scores.soilStress;
  else                                scores.waterStress = null;

  scores.waterStressSource = [
    droughtValid ? `30-day deficit (60%)` : null,
    soilValid    ? `soil moisture (${droughtValid ? '40' : '100'}%)` : null,
  ].filter(Boolean).join(' + ') || 'Needs data';

  return scores;
}

// ── Chemistry Risk ────────────────────────────────────────────────────────────
// Returns LOW / MEDIUM / HIGH risk categories. Never claims exact compound levels.
// These are risk estimates based on environmental history + plant type, NOT measurements.
function chemRiskCompute(stress, plant) {
  if (!stress || !plant) return null;
  const profile = PLANT_ENV_PROFILES[plant.key] || PLANT_ENV_PROFILES._default;
  const dr = stress.droughtMemory ?? 0;
  const hs = stress.heatStress    ?? 0;
  const vp = stress.vpdPressure   ?? 0;
  const hasArchive = stress.droughtMemory != null;
  const hasTemp    = stress.heatStress    != null;

  // — Osmolyte Pressure Risk ——
  // Compatible solute accumulation (proline, glycine betaine) under drought/VPD.
  // CAM plants use different mechanism — lower risk for cellulosic conversion.
  const camFactor = profile.photosynthesis === 'CAM' ? 0.35 : 1.0;
  const osmoBase  = (dr * 0.6 + vp * 0.4) / 100 * camFactor;
  const osmoRisk  = osmoBase > 0.55 ? 'High' : osmoBase > 0.25 ? 'Medium' : 'Low';
  const osmoConf  = (hasArchive && stress.vpdPressure != null) ? 'Moderate' : 'Low (missing data)';
  const osmoCaveats = !hasArchive ? 'Drought history unavailable — estimate based only on VPD.' : null;

  // — Saponin / Inhibitor Risk ——
  // Specific to plant chemistry profile — inherent + stress-elevated.
  const inherentInhibitor = profile.inhibitorRisk;
  let sapBase = inherentInhibitor === 'high' ? 0.70 : inherentInhibitor === 'medium' ? 0.40 : 0.15;
  sapBase = Math.min(1.0, sapBase + hs / 100 * 0.15 + dr / 100 * 0.10);
  const sapRisk = sapBase > 0.60 ? 'High' : sapBase > 0.35 ? 'Medium' : 'Low';
  const sapConf = hasTemp ? 'Low–Moderate' : 'Low (insufficient data)';

  // — Phenolic / Extractive Risk ——
  // UV stress + heat + drought all increase phenolic deposition.
  const uvFactor = (typeof appState !== 'undefined' && appState.envData?.current?.uv != null)
    ? Math.min(100, Math.max(0, (appState.envData.current.uv - 5) * 10)) : 0;
  const phenBase = (hs * 0.40 + dr * 0.40 + uvFactor * 0.20) / 100;
  const phenRisk = phenBase > 0.55 ? 'High' : phenBase > 0.28 ? 'Medium' : 'Low';
  const phenConf = hasTemp && hasArchive ? 'Moderate' : 'Low (missing input data)';

  // — Cell-wall Recalcitrance Risk ——
  // Woody plants have inherently higher lignin. Drought/heat can increase lignification.
  const woodyTypes = ['woody-lignin','woody-tannin','woody-aromatic','woody-resin'];
  const isWoody = woodyTypes.includes(profile.chem);
  const recalBase = (isWoody ? 60 : 25) + Math.round(dr * 0.15 + hs * 0.08);
  const recalScore = Math.min(100, recalBase);
  const recalRisk  = recalScore > 60 ? 'High' : recalScore > 38 ? 'Medium' : 'Low';
  const recalConf  = 'Moderate (plant type known; stress modifier estimated)';

  // — Fermentation Lag Risk ——
  // Combined: osmolyte + phenolic secondary metabolites slow fermentation microbes.
  const fermBase = (osmoBase * 0.40 + phenBase * 0.35 + recalScore / 100 * 0.25);
  const fermRisk = fermBase > 0.55 ? 'High' : fermBase > 0.28 ? 'Medium' : 'Low';
  const fermConf = (hasArchive && hasTemp) ? 'Moderate' : 'Low (limited input data)';

  return {
    osmolyte:    { risk: osmoRisk,  confidence: osmoConf,  caveats: osmoCaveats,  score: Math.round(osmoBase  * 100), explanation: 'Plants under drought and high-VPD stress accumulate compatible solutes (proline, glycine betaine) that protect cell membranes but can inhibit microbial fermentation.' },
    saponin:     { risk: sapRisk,   confidence: sapConf,   caveats: null,          score: Math.round(sapBase   * 100), explanation: `This plant type has ${inherentInhibitor} inherent inhibitor risk. Heat and drought may elevate secondary metabolite production.` },
    phenolic:    { risk: phenRisk,  confidence: phenConf,  caveats: null,          score: Math.round(phenBase  * 100), explanation: 'UV stress, heat, and drought trigger phenolic compound synthesis as a plant defense. High phenolics slow enzymatic hydrolysis and microbial fermentation.' },
    recalcitrance:{ risk: recalRisk, confidence: recalConf, caveats: null,         score: recalScore,                  explanation: isWoody ? 'Woody biomass has inherently higher lignin (20–35%), requiring intensive pretreatment to access cellulose.' : 'Grass lignin (15–20%) increases under drought stress, elevating pretreatment costs for cellulosic ethanol.' },
    fermentation: { risk: fermRisk, confidence: fermConf,  caveats: null,          score: Math.round(fermBase  * 100), explanation: 'Combined risk from osmolytes, phenolics, and recalcitrance — these slow or inhibit the microbial fermentation step in cellulosic ethanol production.' },
    caveat: 'Environmental history suggests risk level. Lab data is needed to measure actual compound concentrations.',
    missing: stress.missing || [],
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
            <div class="stress-score-name">Drought Memory Score (30-day)</div>
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
      Stress scores are derived from live environmental measurements vs. plant-specific thresholds from cited literature.
      Scores are estimates — lab measurements are needed to confirm actual plant stress.
    </div>
  `;

  // render chemistry risk
  const chemRisk = chemRiskCompute(stress, appState.plant);
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
