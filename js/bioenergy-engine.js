'use strict';

// ── Pathway compatibility profiles ────────────────────────────────────────────
// base (0-100): compatibility before stress modifiers
// stressSensitivity: how much fermentation/phenolic risk degrades the pathway
// chemTypes: which plant chem profiles are NOT well-suited to this pathway
const BIOENERGY_PATHWAYS = {
  cellulosic_ethanol: {
    name: 'Cellulosic Ethanol',
    icon: '🧪',
    desc: 'Enzymatic hydrolysis of cellulose/hemicellulose → fermentation → ethanol.',
    maturity: 'Commercial early-stage',
    stressSensitivity: 0.65,
    badChemTypes: ['cactus-mucilage','succulent-inulin','woody-resin','woody-aromatic'],
    baseByPhoto: { 'grass-cellulosic':88, 'fiber-cellulosic':78, 'grass-sucrose':65, 'woody-lignin':45, 'woody-tannin':38, 'woody-aromatic':30, 'woody-resin':28, 'succulent-inulin':42, 'cactus-mucilage':25, 'aquatic-cellulosic':60, 'aquatic-lipid':20, 'unknown':50 },
    source: 'NREL NREL/TP-510-32438; DOE Bioenergy Basics',
  },
  biogas: {
    name: 'Biogas (Anaerobic Digestion)',
    icon: '♻️',
    desc: 'Microbial breakdown of wet organic matter in absence of oxygen → methane-rich biogas.',
    maturity: 'Commercial mature',
    stressSensitivity: 0.25,
    badChemTypes: [],
    baseByPhoto: { 'grass-cellulosic':72, 'fiber-cellulosic':65, 'grass-sucrose':80, 'woody-lignin':48, 'woody-tannin':45, 'woody-aromatic':40, 'woody-resin':38, 'succulent-inulin':75, 'cactus-mucilage':70, 'aquatic-cellulosic':88, 'aquatic-lipid':82, 'unknown':58 },
    source: 'DOE Bioenergy Basics; NREL Bioenergy Research',
  },
  pyrolysis: {
    name: 'Pyrolysis → Biochar / Bio-oil',
    icon: '🔥',
    desc: 'Thermochemical conversion at 400–700°C without oxygen → biochar (solid) + bio-oil + syngas.',
    maturity: 'Commercial mature',
    stressSensitivity: 0.12,
    badChemTypes: [],
    baseByPhoto: { 'grass-cellulosic':72, 'fiber-cellulosic':70, 'grass-sucrose':65, 'woody-lignin':88, 'woody-tannin':85, 'woody-aromatic':82, 'woody-resin':78, 'succulent-inulin':68, 'cactus-mucilage':58, 'aquatic-cellulosic':55, 'aquatic-lipid':60, 'unknown':65 },
    source: 'DOE Bioenergy Basics; Bridgwater 2012',
  },
  combustion: {
    name: 'Direct Combustion / Pellets',
    icon: '🔆',
    desc: 'Dried biomass burned directly or pelletized for heat/power generation.',
    maturity: 'Commercial mature',
    stressSensitivity: 0.08,
    badChemTypes: ['aquatic-cellulosic','aquatic-lipid','cactus-mucilage'],
    baseByPhoto: { 'grass-cellulosic':75, 'fiber-cellulosic':72, 'grass-sucrose':60, 'woody-lignin':88, 'woody-tannin':85, 'woody-aromatic':80, 'woody-resin':78, 'succulent-inulin':55, 'cactus-mucilage':30, 'aquatic-cellulosic':35, 'aquatic-lipid':45, 'unknown':65 },
    source: 'DOE Bioenergy Basics; USDA ERS',
  },
};

// ── Agriculture scores ────────────────────────────────────────────────────────
function agScoreCompute(stress, plant, envData) {
  if (!plant || !envData) return null;
  const profile = (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES[plant.key])
    || (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES._default) || {};
  const missing = [];

  // Survival: heat (40%) + water (35%) + vpd (15%) + soil (10%)
  let survival = 100, survivalParts = [];
  const hs = stress?.heatStress;
  const ws = stress?.waterStress;
  const vp = stress?.vpdPressure;
  const ss = stress?.soilStress;

  if (hs != null) { survival -= hs * 0.40; survivalParts.push(`heat ${hs}`); }
  else missing.push('current temperature');
  if (ws != null) { survival -= ws * 0.35; survivalParts.push(`water ${ws}`); }
  else missing.push('water stress');
  if (vp != null) { survival -= vp * 0.15; survivalParts.push(`VPD ${vp}`); }
  if (ss != null) { survival -= ss * 0.10; survivalParts.push(`soil ${ss}`); }
  survival = Math.max(0, Math.round(survival));

  // Productivity: more sensitive than survival (heat 45%, water 40%, vpd 15%)
  let productivity = 100;
  if (hs != null) productivity -= hs * 0.45;
  if (ws != null) productivity -= ws * 0.40;
  if (vp != null) productivity -= vp * 0.15;
  productivity = Math.max(0, Math.round(productivity));

  // Water Sustainability: available precip vs plant requirement
  let waterSustain = null, waterSustainSrc = null;
  if (envData.archive30?.precipSum != null && profile.waterReq30mm != null) {
    const precip = envData.archive30.precipSum;
    const req    = profile.waterReq30mm;
    if (req >= 999) { // aquatic — needs permanent water
      waterSustain = 5;
      waterSustainSrc = 'Aquatic plant requires permanent water body';
    } else {
      const ratio = precip / req;
      if (ratio >= 1.5)      waterSustain = 95;
      else if (ratio >= 1.0) waterSustain = Math.round(70 + (ratio - 1.0) * 50);
      else if (ratio >= 0.5) waterSustain = Math.round(35 + (ratio - 0.5) * 70);
      else                   waterSustain = Math.round(ratio * 70);
      waterSustain = Math.min(100, Math.max(0, waterSustain));
      waterSustainSrc = `30-day precip ${precip} mm vs. plant min ${req} mm/month (ratio ${ratio.toFixed(2)}) — Open-Meteo archive`;
    }
  } else {
    missing.push('30-day precipitation total');
  }

  // Heat/Drought Tolerance Match for Texas climate: higher = better adapted
  const heatMatch    = Math.round(Math.max(0, (profile.heatStressF - 85) / (130 - 85) * 100));
  const droughtMatch = profile.droughtScore ?? 50;
  const toleranceMatch = Math.round(heatMatch * 0.5 + droughtMatch * 0.5);

  // Growth Suitability: composite
  const growthSuit = Math.round(survival * 0.45 + productivity * 0.55);

  // Data Quality
  let dq = 0;
  if (envData.current)                    dq += 30;
  if (envData.archive30?.precipSum != null) dq += 25;
  if (envData.hourlyVPD != null)           dq += 15;
  if (envData.hourlySoil != null)          dq += 15;
  if (envData.aqi?.usAqi != null)          dq += 10;
  if (envData.alerts !== null)             dq +=  5;

  return {
    survival,
    survivalSrc: `Heat(×0.40) + Water(×0.35) + VPD(×0.15) + Soil(×0.10) — formula, live data`,
    survivalConf: hs!=null && ws!=null ? 'Moderate' : 'Low (incomplete data)',
    productivity,
    productivitySrc: `Heat(×0.45) + Water(×0.40) + VPD(×0.15) — productivity falls faster than survival`,
    productivityConf: hs!=null && ws!=null ? 'Moderate' : 'Low (incomplete data)',
    waterSustain,
    waterSustainSrc: waterSustainSrc || 'Unavailable — archive API needed',
    waterSustainConf: waterSustain != null ? 'Moderate' : 'Needs data',
    heatMatch,
    droughtMatch,
    toleranceMatch,
    toleranceSrc: `Heat threshold ${profile.heatStressF}°F / drought score ${profile.droughtScore} (cited literature)`,
    growthSuit,
    growthSuitSrc: `Survival(×0.45) + Productivity(×0.55)`,
    dataQuality: dq,
    dataQualitySrc: `${dq}% of data sources available (weather=30%, archive=25%, VPD=15%, soil=15%, AQI=10%, alerts=5%)`,
    missing,
    envBenefit: profile.envBenefit,
    envBenefitSrc: `Plant profile from cited literature — native/invasive/water-use consideration`,
  };
}

// ── Pathway analysis ──────────────────────────────────────────────────────────
function pathwayAnalysis(plant, stress, chemRisk) {
  if (!plant) return [];
  const profile = (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES[plant.key])
    || (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES._default) || { chem:'unknown' };
  const chemType = profile.chem || 'unknown';

  return Object.entries(BIOENERGY_PATHWAYS).map(([key, pw]) => {
    let base = pw.baseByPhoto[chemType] ?? pw.baseByPhoto.unknown ?? 50;

    // stress penalty: weighted by pathway sensitivity to stress chemistry
    let stressPenalty = 0;
    if (chemRisk) {
      const avgChemScore = (chemRisk.osmolyte.score + chemRisk.fermentation.score) / 2;
      stressPenalty = Math.round(avgChemScore * pw.stressSensitivity);
    }
    if (pw.badChemTypes.includes(chemType)) stressPenalty += 20;

    const final = Math.max(0, Math.min(100, base - stressPenalty));
    const tier  = final >= 70 ? 'Strong' : final >= 45 ? 'Moderate' : 'Weak';
    const tierColor = final >= 70 ? '#5DDBA8' : final >= 45 ? '#F5A623' : '#E87A7A';

    return { key, name: pw.name, icon: pw.icon, desc: pw.desc, maturity: pw.maturity,
             score: final, tier, tierColor, stressPenalty, source: pw.source, chemType };
  }).sort((a, b) => b.score - a.score);
}

// ── Bioenergy Confidence Score (weighted composite) ───────────────────────────
// Weights: Survival 20% + Productivity 20% + Water 15% + Chem Safety 15% +
//          Conversion 15% + Env Benefit 10% + Data Quality 5% = 100%
function bioScoreCompute(ag, chemRisk, pathways) {
  if (!ag) return null;
  const missing = [];
  let total = 0, possible = 0;

  const sub = {};

  // Survival (20%)
  sub.survival = { weight:20, value: ag.survival, conf: ag.survivalConf };
  if (ag.survival != null) total += ag.survival * 0.20;
  else missing.push('survival');
  possible += 20;

  // Productivity (20%)
  sub.productivity = { weight:20, value: ag.productivity, conf: ag.productivityConf };
  if (ag.productivity != null) total += ag.productivity * 0.20;
  else missing.push('productivity');
  possible += 20;

  // Water Sustainability (15%)
  sub.water = { weight:15, value: ag.waterSustain, conf: ag.waterSustainConf };
  if (ag.waterSustain != null) { total += ag.waterSustain * 0.15; possible += 15; }
  else missing.push('water sustainability (needs 30-day archive)');

  // Stress-Metabolite Safety (15%) — inverted chemistry risk
  if (chemRisk) {
    const avgChemRisk = (chemRisk.osmolyte.score + chemRisk.saponin.score + chemRisk.phenolic.score + chemRisk.fermentation.score) / 4;
    const safety = Math.round(100 - avgChemRisk);
    sub.chemSafety = { weight:15, value: safety, conf: 'Low–Moderate (estimated)' };
    total += safety * 0.15;
    possible += 15;
  } else {
    sub.chemSafety = { weight:15, value: null, conf: 'Needs data' };
    missing.push('stress-metabolite safety');
  }

  // Conversion Compatibility (15%) — best pathway score
  if (pathways && pathways.length) {
    const best = pathways[0].score;
    sub.conversion = { weight:15, value: best, conf: 'Moderate (pathway compatibility)', pathway: pathways[0].name };
    total += best * 0.15;
    possible += 15;
  } else {
    sub.conversion = { weight:15, value: null, conf: 'Needs plant selection' };
    missing.push('conversion compatibility (no plant selected)');
  }

  // Environmental Benefit (10%)
  sub.envBenefit = { weight:10, value: ag.envBenefit ?? null, conf: 'Moderate (plant profile citation)' };
  if (ag.envBenefit != null) { total += ag.envBenefit * 0.10; possible += 10; }
  else missing.push('environmental benefit');

  // Data Quality (5%)
  sub.dataQuality = { weight:5, value: ag.dataQuality, conf: ag.dataQualitySrc };
  total += ag.dataQuality * 0.05;
  possible += 5;

  const finalScore = possible > 0 ? Math.round(total / possible * 100) : null;
  const confidence = missing.length === 0 ? 'Moderate' : missing.length <= 2 ? 'Low–Moderate' : 'Low (incomplete data)';

  return { total: finalScore, possible, sub, missing, confidence,
           note: 'AI-assisted interpretation based on displayed data and cited methods. Not a lab measurement or commercial viability assessment.' };
}

// ── DOM Renderers ─────────────────────────────────────────────────────────────

function renderAgScore() {
  const el = document.getElementById('agScoreSection');
  if (!el) return;

  const plant = appState.plant;
  const envData = appState.envData;
  const stress = appState.stressScores;

  if (!plant || !envData || !stress) {
    el.innerHTML = '<div class="score-needs-data">Complete Steps 1 and 2 first.</div>';
    return;
  }

  const ag = agScoreCompute(stress, plant, envData);
  if (!ag) { el.innerHTML = '<div class="score-needs-data">Unable to compute agriculture scores.</div>'; return; }
  appState.agricultureScore = ag;

  const pathways = pathwayAnalysis(plant, stress, appState.chemRisk);
  appState.pathways = pathways;

  const _gauge = (val, hi, mid) => {
    if (val == null) return '<span class="score-na">Needs data</span>';
    const color = val >= (100-hi) ? '#5DDBA8' : val >= (100-mid) ? '#F5A623' : '#D64545';
    return `<div class="ag-gauge"><div class="ag-gauge-fill" style="width:${val}%;background:${color}"></div></div>
            <span class="ag-gauge-val" style="color:${color}">${val}/100</span>`;
  };

  el.innerHTML = `
    <div class="ag-scores-grid">

      <div class="ag-score-card">
        <div class="ag-score-title">Survival Score</div>
        ${_gauge(ag.survival, 40, 70)}
        <div class="ag-score-sub">Plant can likely survive current conditions</div>
        <div class="score-src">${escapeHtml(ag.survivalSrc)}</div>
        <div class="score-conf">Confidence: ${escapeHtml(ag.survivalConf)}</div>
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Productivity Score</div>
        ${_gauge(ag.productivity, 40, 70)}
        <div class="ag-score-sub">Biomass yield potential (vs. unstressed ideal)</div>
        <div class="score-src">${escapeHtml(ag.productivitySrc)}</div>
        <div class="score-conf">Confidence: ${escapeHtml(ag.productivityConf)}</div>
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Water Sustainability</div>
        ${_gauge(ag.waterSustain, 40, 70)}
        <div class="ag-score-sub">30-day precip vs. plant water requirement</div>
        <div class="score-src">${escapeHtml(ag.waterSustainSrc)}</div>
        <div class="score-conf">Confidence: ${escapeHtml(ag.waterSustainConf)}</div>
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Texas Climate Tolerance Match</div>
        ${_gauge(ag.toleranceMatch, 40, 70)}
        <div class="ag-score-sub">Heat threshold ${ag.heatMatch}/100 + drought tolerance ${ag.droughtMatch}/100</div>
        <div class="score-src">${escapeHtml(ag.toleranceSrc)}</div>
        <div class="score-conf">Confidence: Moderate (literature-based plant profile)</div>
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Growth Suitability</div>
        ${_gauge(ag.growthSuit, 40, 70)}
        <div class="ag-score-sub">Combined survival + productivity estimate</div>
        <div class="score-src">${escapeHtml(ag.growthSuitSrc)}</div>
        <div class="score-conf">Confidence: ${escapeHtml(ag.survivalConf)}</div>
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Data Quality</div>
        ${_gauge(ag.dataQuality, 40, 70)}
        <div class="ag-score-sub">Fraction of data sources available</div>
        <div class="score-src">${escapeHtml(ag.dataQualitySrc)}</div>
        <div class="score-conf">Confidence: Objective (count of available sources)</div>
      </div>

    </div>

    ${ag.missing.length ? `<div class="stress-missing-bar"><strong>Missing data:</strong> ${ag.missing.map(m=>`<span class="score-missing-item">⚠ ${escapeHtml(m)}</span>`).join('')}</div>` : ''}

    <h3 class="sub-section-title">Bioenergy Pathway Compatibility</h3>
    <div class="pathway-grid">
      ${pathways.map(p => `
        <div class="pathway-card">
          <div class="pathway-card-head">
            <span class="pathway-icon">${p.icon}</span>
            <div>
              <div class="pathway-name">${escapeHtml(p.name)}</div>
              <span class="pathway-tier" style="color:${p.tierColor}">${escapeHtml(p.tier)}</span>
              <span class="pathway-maturity">${escapeHtml(p.maturity)}</span>
            </div>
            <div class="pathway-score" style="color:${p.tierColor}">${p.score}</div>
          </div>
          <div class="pathway-bar-wrap"><div class="pathway-bar-fill" style="width:${p.score}%;background:${p.tierColor}"></div></div>
          <div class="pathway-desc">${escapeHtml(p.desc)}</div>
          <div class="score-src">${escapeHtml(p.source)}</div>
          ${p.stressPenalty > 0 ? `<div class="pathway-penalty">Chemistry risk penalty: −${p.stressPenalty} pts</div>` : ''}
        </div>`).join('')}
    </div>
  `;

  renderBioScore();
}

function renderBioScore() {
  const el = document.getElementById('bioScoreSection');
  if (!el) return;

  const ag = appState.agricultureScore;
  const chemRisk = appState.chemRisk;
  const pathways = appState.pathways;

  if (!ag) { el.innerHTML = '<div class="score-needs-data">Agriculture scores not yet computed.</div>'; return; }

  const bioScore = bioScoreCompute(ag, chemRisk, pathways);
  if (!bioScore) return;
  appState.bioenergyScore = bioScore;

  const total = bioScore.total;
  const totalColor = total >= 70 ? '#5DDBA8' : total >= 45 ? '#F5A623' : '#D64545';
  const totalLabel = total >= 75 ? 'Strong Candidate' : total >= 55 ? 'Moderate Candidate' : total >= 35 ? 'Marginal Candidate' : total != null ? 'Low Suitability' : 'Incomplete Data';

  const subRows = [
    { key:'survival',    label:'Survival',                 icon:'🌿' },
    { key:'productivity',label:'Productivity',             icon:'📈' },
    { key:'water',       label:'Water Sustainability',     icon:'💧' },
    { key:'chemSafety',  label:'Stress-Metabolite Safety', icon:'🧪' },
    { key:'conversion',  label:'Conversion Compatibility', icon:'⚡' },
    { key:'envBenefit',  label:'Environmental Benefit',    icon:'🌍' },
    { key:'dataQuality', label:'Data Quality',             icon:'📊' },
  ];

  el.innerHTML = `
    <div class="bio-score-hero">
      <div class="bio-score-ring" style="border-color:${totalColor}">
        <div class="bio-score-number" style="color:${totalColor}">${total ?? '—'}</div>
        <div class="bio-score-denom">/100</div>
      </div>
      <div class="bio-score-hero-right">
        <div class="bio-score-label" style="color:${totalColor}">${totalLabel}</div>
        <div class="bio-score-plant">${escapeHtml(appState.plant?.name || '')} · ${escapeHtml(appState.locationLabel || 'Location not set')}</div>
        <div class="bio-score-conf">Confidence: <em>${escapeHtml(bioScore.confidence)}</em></div>
        <div class="bio-score-note">${escapeHtml(bioScore.note)}</div>
      </div>
    </div>

    <div class="bio-subscore-grid">
      ${subRows.map(r => {
        const s = bioScore.sub[r.key];
        const v = s?.value;
        const contrib = v != null ? Math.round(v * s.weight / 100) : null;
        const color = v >= 70 ? '#5DDBA8' : v >= 45 ? '#F5A623' : v != null ? '#D64545' : 'var(--text3)';
        return `
        <div class="bio-subscore-row">
          <span class="bio-subscore-icon">${r.icon}</span>
          <div class="bio-subscore-body">
            <div class="bio-subscore-name">${r.name} <span class="bio-subscore-wt">(${s?.weight}%)</span></div>
            <div class="bio-subscore-bar-wrap"><div class="bio-subscore-bar-fill" style="width:${v ?? 0}%;background:${color}"></div></div>
            <div class="bio-subscore-conf">${s?.value != null ? escapeHtml(s.conf||'') : '<span class="score-na">Needs data</span>'}</div>
          </div>
          <div class="bio-subscore-val" style="color:${color}">${v != null ? v : '—'}</div>
          <div class="bio-subscore-contrib" style="color:${color}">${contrib != null ? '+'+contrib : '—'}</div>
        </div>`;
      }).join('')}
    </div>

    ${bioScore.missing.length ? `<div class="stress-missing-bar"><strong>Missing sub-scores:</strong> ${bioScore.missing.map(m=>`<span class="score-missing-item">⚠ ${escapeHtml(m)}</span>`).join('')}</div>` : ''}

    <div class="bio-score-formula-note">
      Formula: Survival(20%) + Productivity(20%) + Water(15%) + Chem Safety(15%) + Conversion(15%) + Env Benefit(10%) + Data Quality(5%)
      · Available data: ${bioScore.possible}/100 pts possible
    </div>
  `;

  // trigger report
  if (typeof renderReport === 'function') renderReport();
}

// ── City comparison for Map & Compare ────────────────────────────────────────
function renderPlantCityComparison() {
  const el = document.getElementById('plantCompareContent');
  if (!el) return;

  const plant = appState.plant;
  if (!plant) {
    el.innerHTML = '<div class="score-needs-data">Select a plant in Analyze → Step 1 to compare across Texas cities.</div>';
    return;
  }
  if (typeof WEATHER_DATA === 'undefined' || !Object.keys(WEATHER_DATA).length) {
    el.innerHTML = '<div class="score-needs-data">City weather data not yet loaded. Please wait for the dashboard to load.</div>';
    return;
  }

  const profile = (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES[plant.key])
    || (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES._default) || {};
  const isFahrenheit = typeof getSetting === 'function' && getSetting('units') !== 'metric';

  const rows = Object.entries(WEATHER_DATA).map(([cityName, d]) => {
    // Heat stress from current temp
    const t  = d.temp;
    const lo = isFahrenheit ? profile.heatStressF : (profile.heatStressF - 32) * 5/9;
    const hi = isFahrenheit ? profile.heatCriticalF : (profile.heatCriticalF - 32) * 5/9;
    const heat = t <= lo ? 0 : t >= hi ? 100 : Math.round((t - lo) / (hi - lo) * 100);

    // Approx VPD from temp+humidity
    const tC  = isFahrenheit ? (t - 32) * 5/9 : t;
    const es  = 0.6108 * Math.exp(17.27 * tC / (tC + 237.3));
    const vpd = Math.round((es * (1 - d.humidity / 100)) * 100) / 100;
    const vpdLo = 0.5, vpdHi = profile.vpdStressKPa;
    const vpdScore = vpd <= vpdLo ? 0 : vpd < vpdHi
      ? Math.round((vpd - vpdLo) / (vpdHi - vpdLo) * 40)
      : Math.min(100, Math.round(40 + (vpd - vpdHi) * 25));

    // Survival from current only (no archive for cities)
    const survival = Math.max(0, Math.round(100 - heat * 0.55 - vpdScore * 0.25));
    const productivity = Math.max(0, Math.round(100 - heat * 0.65 - vpdScore * 0.25));
    const aqiVal = d.aqi;
    const survColor = survival >= 70 ? '#5DDBA8' : survival >= 45 ? '#F5A623' : '#D64545';

    return { cityName, temp: t, heat, vpd, vpdScore, survival, productivity, aqiVal, survColor };
  }).sort((a, b) => b.survival - a.survival);

  el.innerHTML = `
    <div class="plant-compare-header">
      <div class="plant-compare-title">🌿 ${escapeHtml(plant.name)} — Current Conditions Comparison</div>
      <div class="plant-compare-caveat">Current temperature + VPD only. 30-day drought history not available for city comparison — drought stress score is "Needs data" for each city.</div>
    </div>
    <div class="plant-compare-table-wrap">
      <table class="plant-compare-table">
        <thead>
          <tr>
            <th>City</th>
            <th>Temp</th>
            <th>Heat Stress</th>
            <th>VPD (est.)</th>
            <th>Survival (current)</th>
            <th>Productivity (current)</th>
            <th>AQI</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
          <tr>
            <td><strong>${escapeHtml(r.cityName)}</strong></td>
            <td>${r.temp}${isFahrenheit ? '°F' : '°C'}</td>
            <td><span style="color:${r.heat>=70?'#D64545':r.heat>=35?'#F5A623':'#5DDBA8'}">${r.heat}/100</span></td>
            <td>${r.vpd} kPa</td>
            <td><span class="compare-pill" style="background:${r.survColor}22;color:${r.survColor};border:1px solid ${r.survColor}55">${r.survival}/100</span></td>
            <td><span style="color:${r.productivity>=70?'#5DDBA8':r.productivity>=45?'#F5A623':'#D64545'}">${r.productivity}/100</span></td>
            <td>${r.aqiVal != null ? r.aqiVal : '<span class="score-na">N/A</span>'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="plant-compare-note">
      Survival and productivity are current-conditions estimates only. Actual suitability requires full location measurement with 30-day drought history.
      Same scoring formula applied to all cities for consistency.
    </div>
  `;
}
