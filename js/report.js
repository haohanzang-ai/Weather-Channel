'use strict';

// ── TexasClimate Bioenergy Suitability Report ─────────────────────────────────

function renderReport() {
  const el = document.getElementById('reportSection');
  if (!el) return;

  const plant   = appState.plant;
  const env     = appState.envData;
  const stress  = appState.stressScores;
  const ag      = appState.agricultureScore;
  const bio     = appState.bioenergyScore;
  const chem    = appState.chemRisk;
  const pathways = appState.pathways;

  if (!plant || !env || !ag || !bio) {
    el.innerHTML = `<div class="score-needs-data">
      Complete Steps 1–5 to generate the report.<br>
      <small>Required: plant selection, location measurement, and scoring.</small>
    </div>`;
    return;
  }

  const ts = env.tSuffix;
  const cur = env.current;
  const arch = env.archive30;
  const na = '<span class="rpt-na">Unavailable</span>';
  const fmtVal = (v, unit) => v != null ? `${v}${unit}` : na;
  const fmtScore = (v) => v != null ? `${v}/100` : na;
  const fmtRisk = (r) => {
    if (!r) return na;
    const c = r.risk==='High'?'#D64545':r.risk==='Medium'?'#F5A623':'#5DDBA8';
    return `<span style="color:${c};font-weight:700">${r.risk}</span>`;
  };
  const bestPathway = (pathways && pathways.length) ? pathways[0] : null;
  const reportTime  = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  // Build plain-text version for copy
  const textLines = [
    'TexasClimate Bioenergy Suitability Report',
    `Generated: ${reportTime}`,
    '',
    `Plant / Crop: ${plant.name} (${plant.scientificName || ''})`,
    `Location: ${appState.locationLabel || 'Not specified'} (${env.lat?.toFixed(4)}°N, ${Math.abs(env.lon || 0).toFixed(4)}°W)`,
    '',
    '── Live Environment Summary ──',
    `Temperature: ${fmtVal(cur?.temp, ts)}`,
    `Feels Like:  ${fmtVal(cur?.feels, ts)}`,
    `Humidity:    ${fmtVal(cur?.humidity, '%')}`,
    `Wind:        ${fmtVal(cur?.wind, ' '+env.wSuffix)}`,
    `UV Index:    ${fmtVal(cur?.uv, '')}`,
    `VPD:         ${env.hourlyVPD != null ? env.hourlyVPD+' kPa (Live API)' : 'Estimated from temp+RH'}`,
    `Soil Moisture (0-1cm): ${fmtVal(env.hourlySoil, ' m³/m³')}`,
    '',
    '── 30-Day Drought History ──',
    `Precipitation Total: ${arch?.precipSum != null ? arch.precipSum+' mm' : 'Unavailable'}`,
    `ET₀ Total:           ${arch?.et0Sum    != null ? arch.et0Sum+' mm' : 'Unavailable'}`,
    `ET₀ − Precip Deficit: ${arch?.deficit  != null ? arch.deficit+' mm' : 'Unavailable'}`,
    '',
    '── Stress Profile ──',
    `Heat Stress Score:    ${fmtScore(stress?.heatStress)}`,
    `Drought Memory Score: ${fmtScore(stress?.droughtMemory)}`,
    `VPD Pressure:         ${fmtScore(stress?.vpdPressure)}`,
    `Soil Moisture Stress: ${fmtScore(stress?.soilStress)}`,
    `Water Stress (comp.): ${fmtScore(stress?.waterStress)}`,
    '',
    '── Agriculture Scores ──',
    `Survival Score:          ${fmtScore(ag.survival)} (${ag.survivalConf})`,
    `Productivity Score:      ${fmtScore(ag.productivity)} (${ag.productivityConf})`,
    `Water Sustainability:    ${fmtScore(ag.waterSustain)}`,
    `TX Climate Tolerance:    ${fmtScore(ag.toleranceMatch)}`,
    `Growth Suitability:      ${fmtScore(ag.growthSuit)}`,
    '',
    '── Stress-to-Fuel Chemistry Risk ──',
    chem ? `Osmolyte Pressure:       ${chem.osmolyte.risk} (${chem.osmolyte.confidence})` : 'Unavailable',
    chem ? `Saponin/Inhibitor:        ${chem.saponin.risk} (${chem.saponin.confidence})` : '',
    chem ? `Phenolic/Extractive:      ${chem.phenolic.risk} (${chem.phenolic.confidence})` : '',
    chem ? `Cell-wall Recalcitrance:  ${chem.recalcitrance.risk} (${chem.recalcitrance.confidence})` : '',
    chem ? `Fermentation Lag:         ${chem.fermentation.risk} (${chem.fermentation.confidence})` : '',
    '',
    '── Best Conversion Pathway ──',
    bestPathway ? `${bestPathway.name} — Score: ${bestPathway.score}/100 (${bestPathway.tier})` : 'Unavailable',
    '',
    '── TexasClimate Bioenergy Confidence Score ──',
    `FINAL SCORE: ${bio.total ?? 'Incomplete'}/100`,
    `Confidence: ${bio.confidence}`,
    `  Survival (20%):            ${bio.sub.survival?.value ?? 'N/A'}/100`,
    `  Productivity (20%):        ${bio.sub.productivity?.value ?? 'N/A'}/100`,
    `  Water Sustainability (15%):${bio.sub.water?.value ?? 'N/A'}/100`,
    `  Chem Safety (15%):         ${bio.sub.chemSafety?.value ?? 'N/A'}/100`,
    `  Conversion Compat. (15%):  ${bio.sub.conversion?.value ?? 'N/A'}/100`,
    `  Env Benefit (10%):         ${bio.sub.envBenefit?.value ?? 'N/A'}/100`,
    `  Data Quality (5%):         ${bio.sub.dataQuality?.value ?? 'N/A'}/100`,
    '',
    '── Data Sources ──',
    'Weather/VPD/Soil/Archive: Open-Meteo API (open-meteo.com)',
    'Air Quality: Open-Meteo AQI API (air-quality-api.open-meteo.com)',
    'NWS Alerts: National Weather Service (api.weather.gov)',
    'Plant profiles: Published peer-reviewed and government literature (DOE, USDA, NREL, PNAS)',
    '',
    '── Limitations & Missing Data ──',
    ...(bio.missing.length ? bio.missing.map(m => `- ${m}`) : ['None — all data sources available']),
    '',
    '⚠ This report is an educational estimate. No lab measurements (lignin, cellulose, moisture, biomass yield) were made.',
    'Do not use for production, investment, or policy decisions.',
    `AI-assisted interpretation based on displayed data and cited methods. Generated by TexasClimate Bioenergy Intelligence Platform.`,
  ];
  const reportText = textLines.join('\n');

  el.innerHTML = `
    <div class="rpt-header">
      <div class="rpt-header-left">
        <div class="rpt-title">TexasClimate Bioenergy Suitability Report</div>
        <div class="rpt-meta">${escapeHtml(plant.name)} · ${escapeHtml(appState.locationLabel||'Location not set')} · ${reportTime}</div>
        <div class="rpt-ai-label">AI-assisted interpretation based on displayed data and cited methods</div>
      </div>
      <button class="btn-sm rpt-copy-btn" onclick="copyReport()" style="font-size:11px">📋 Copy Report</button>
    </div>

    <div class="rpt-body">

      <div class="rpt-section">
        <div class="rpt-section-title">Plant / Crop</div>
        <div class="rpt-row"><span class="rpt-lbl">Species</span><span class="rpt-val">${escapeHtml(plant.name)}${plant.scientificName ? ` (${escapeHtml(plant.scientificName)})` : ''}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Category</span><span class="rpt-val">${escapeHtml(plant.category||'—')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Texas Fit (literature)</span><span class="rpt-val">${escapeHtml(plant.texasFit||'—')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Photo / Image</span><span class="rpt-val">Not analyzed — bioenergy analysis based on plant profile + measured environment, not image chemistry.</span></div>
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">Location & Live Environment</div>
        <div class="rpt-row"><span class="rpt-lbl">Location</span><span class="rpt-val">${escapeHtml(appState.locationLabel||'—')} (${env.lat?.toFixed(4)}°N, ${Math.abs(env.lon||0).toFixed(4)}°W)</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Temperature</span><span class="rpt-val">${fmtVal(cur?.temp, ts)} ${dataBadge('live-api')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Humidity</span><span class="rpt-val">${fmtVal(cur?.humidity, '%')} ${dataBadge('live-api')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Wind</span><span class="rpt-val">${fmtVal(cur?.wind, ' '+env.wSuffix)} ${dataBadge('live-api')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">UV Index</span><span class="rpt-val">${fmtVal(cur?.uv, '')} ${cur?.uv != null ? dataBadge('live-api') : ''}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">VPD</span><span class="rpt-val">${env.hourlyVPD != null ? env.hourlyVPD+' kPa '+dataBadge('live-api') : 'Estimated from temp+RH '+dataBadge('live-derived')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Soil Moisture (0–1cm)</span><span class="rpt-val">${env.hourlySoil != null ? env.hourlySoil+' m³/m³ '+dataBadge('live-api') : na}</span></div>
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">30-Day Drought History</div>
        <div class="rpt-row"><span class="rpt-lbl">Precipitation Total</span><span class="rpt-val">${arch?.precipSum != null ? arch.precipSum+' mm '+dataBadge('live-api') : na}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">ET₀ Total</span><span class="rpt-val">${arch?.et0Sum != null ? arch.et0Sum+' mm '+dataBadge('live-api') : na}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Drought Deficit (ET₀ − Precip)</span><span class="rpt-val">${arch?.deficit != null ? arch.deficit+' mm '+dataBadge('live-api') : na}</span></div>
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">Stress Profile</div>
        <div class="rpt-row"><span class="rpt-lbl">Heat Stress Score</span><span class="rpt-val">${fmtScore(stress?.heatStress)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Drought Memory Score</span><span class="rpt-val">${fmtScore(stress?.droughtMemory)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">VPD Pressure</span><span class="rpt-val">${fmtScore(stress?.vpdPressure)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Soil Moisture Stress</span><span class="rpt-val">${fmtScore(stress?.soilStress)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Water Stress (composite)</span><span class="rpt-val">${fmtScore(stress?.waterStress)}</span></div>
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">Agriculture Scores</div>
        <div class="rpt-row"><span class="rpt-lbl">Survival Score</span><span class="rpt-val">${fmtScore(ag.survival)} — <em>${escapeHtml(ag.survivalConf)}</em></span></div>
        <div class="rpt-row"><span class="rpt-lbl">Productivity Score</span><span class="rpt-val">${fmtScore(ag.productivity)} — <em>${escapeHtml(ag.productivityConf)}</em></span></div>
        <div class="rpt-row"><span class="rpt-lbl">Water Sustainability</span><span class="rpt-val">${fmtScore(ag.waterSustain)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">TX Climate Tolerance Match</span><span class="rpt-val">${fmtScore(ag.toleranceMatch)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Growth Suitability</span><span class="rpt-val">${fmtScore(ag.growthSuit)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Data Quality</span><span class="rpt-val">${fmtScore(ag.dataQuality)}</span></div>
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">Stress-to-Fuel Chemistry Risk</div>
        ${chem ? `
        <div class="rpt-row"><span class="rpt-lbl">Osmolyte Pressure</span><span class="rpt-val">${fmtRisk(chem.osmolyte)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Saponin / Inhibitor</span><span class="rpt-val">${fmtRisk(chem.saponin)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Phenolic / Extractive</span><span class="rpt-val">${fmtRisk(chem.phenolic)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Cell-wall Recalcitrance</span><span class="rpt-val">${fmtRisk(chem.recalcitrance)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Fermentation Lag</span><span class="rpt-val">${fmtRisk(chem.fermentation)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Caveat</span><span class="rpt-val" style="color:var(--text3);font-style:italic">${escapeHtml(chem.caveat)}</span></div>
        ` : '<div class="rpt-row"><span class="rpt-na">Chemistry risk not computed — complete stress profile first.</span></div>'}
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">Best Conversion Pathway</div>
        ${bestPathway ? `
        <div class="rpt-row"><span class="rpt-lbl">Pathway</span><span class="rpt-val">${bestPathway.icon} ${escapeHtml(bestPathway.name)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Score</span><span class="rpt-val" style="color:${bestPathway.tierColor}">${bestPathway.score}/100 — ${escapeHtml(bestPathway.tier)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Maturity</span><span class="rpt-val">${escapeHtml(bestPathway.maturity)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Description</span><span class="rpt-val">${escapeHtml(bestPathway.desc)}</span></div>
        ` : '<div class="rpt-row"><span class="rpt-na">Pathway analysis unavailable.</span></div>'}
      </div>

      <div class="rpt-section rpt-final-score">
        <div class="rpt-section-title">TexasClimate Bioenergy Confidence Score</div>
        <div class="rpt-final-number" style="color:${bio.total>=70?'#5DDBA8':bio.total>=45?'#F5A623':'#D64545'}">${bio.total ?? '—'} / 100</div>
        <div class="rpt-final-conf">Confidence: ${escapeHtml(bio.confidence)}</div>
        ${Object.entries(bio.sub).map(([k, s]) => {
          const labels = {survival:'Survival',productivity:'Productivity',water:'Water Sustainability',chemSafety:'Chem Safety',conversion:'Conversion Compat.',envBenefit:'Env Benefit',dataQuality:'Data Quality'};
          return `<div class="rpt-row"><span class="rpt-lbl">${labels[k]||k} (${s.weight}%)</span><span class="rpt-val">${s.value != null ? s.value+'/100' : '<span class="rpt-na">Needs data</span>'}</span></div>`;
        }).join('')}
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">Data Sources</div>
        <div class="rpt-row"><span class="rpt-lbl">Weather / VPD / Soil / Archive</span><span class="rpt-val">Open-Meteo API · open-meteo.com · Free open data</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Air Quality</span><span class="rpt-val">${env.aqi ? 'Open-Meteo AQI API' : na}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">NWS Alerts</span><span class="rpt-val">${env.alerts !== null ? 'National Weather Service api.weather.gov' : na}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Plant Profiles</span><span class="rpt-val">DOE Bioenergy Basics, USDA ERS, NREL, PNAS (Schmer 2008), Davis 2011, TAMU AgriLife Extension</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Stress Thresholds</span><span class="rpt-val">General plant physiology literature; Narayanan 2017 (switchgrass), Prasad 2008 (sorghum), Nobel 1988 (agave)</span></div>
      </div>

      <div class="rpt-section rpt-limitations">
        <div class="rpt-section-title">Limitations & Missing Data</div>
        ${bio.missing.length
          ? bio.missing.map(m => `<div class="rpt-row"><span class="rpt-lbl">⚠ Missing</span><span class="rpt-val">${escapeHtml(m)}</span></div>`).join('')
          : '<div class="rpt-row"><span class="rpt-val" style="color:#5DDBA8">All available data sources loaded for this measurement.</span></div>'}
        <div class="rpt-row" style="margin-top:12px"><span class="rpt-lbl">Lab data needed</span><span class="rpt-val">Lignin %, cellulose %, hemicellulose %, moisture content, biomass yield (t/ha), fuel yield (L/t) — none of these were measured. Upload lab data for a higher-confidence report.</span></div>
        <div class="rpt-disclamer">⚠ This is an educational estimate for research and learning purposes only. Do not use for production, investment, land-use, or policy decisions. All scores are derived from weather data and cited plant profiles — not from field or lab measurements of this plant.</div>
      </div>

    </div>
  `;

  // Store text for clipboard
  el.dataset.reportText = reportText;
}

function copyReport() {
  const el = document.getElementById('reportSection');
  const text = el?.dataset.reportText;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.rpt-copy-btn');
    if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => { btn.textContent = '📋 Copy Report'; }, 2500); }
  }).catch(() => {
    const btn = document.querySelector('.rpt-copy-btn');
    if (btn) btn.textContent = 'Copy unavailable';
  });
}
