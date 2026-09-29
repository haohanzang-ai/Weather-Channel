'use strict';

// ── TexasClimate Bioenergy Suitability Report ─────────────────────────────────

/* Format coordinates without hard-coding a hemisphere, and without turning a
   missing longitude into "0.0000°W". Precision is deliberately 3 decimals
   (~110 m): the underlying weather is interpolated from a grid of several
   kilometres, so four decimals implied a precision the data does not have. */
function fmtCoord(lat, lon) {
  if (lat == null || lon == null || !isFinite(lat) || !isFinite(lon)) return 'UNKNOWN';
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(3)}°${ns}, ${Math.abs(lon).toFixed(3)}°${ew}`;
}

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
  const ec      = appState.evidenceConfidence;

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
    `Location: ${appState.locationLabel || 'Not specified'} (${fmtCoord(env.lat, env.lon)})`,
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
    ...(env.isScenario ? [
      '*** EXPERIMENTAL SCENARIO — NOT MEASURED CONDITIONS ***',
      'One or more inputs below were modified by hand: ' + (env.scenarioDesc || []).join(', ') + '.',
      'Every figure in this report describes that hypothetical, not the observed environment.',
      '',
    ] : []),
    '── 30-Day Climate Water Balance ──',
    `Precipitation Total: ${arch?.precipSum != null ? arch.precipSum+' mm' : 'Unavailable'}`,
    `ET₀ Total:           ${arch?.et0Sum    != null ? arch.et0Sum+' mm' : 'Unavailable'}`,
    `Water Deficit Proxy: ${arch?.deficit  != null ? arch.deficit+' mm' : 'UNKNOWN'}`,
    '  (reference ET minus precipitation — NOT measured plant drought stress;',
    '   excludes crop coefficient, soil storage, rooting depth and irrigation)',
    '',
    '── Stress Profile ──',
    `Heat Stress Score:    ${fmtScore(stress?.heatStress)}`,
    `Water Deficit Proxy:  ${fmtScore(stress?.droughtMemory)}`,
    `VPD Pressure:         ${fmtScore(stress?.vpdPressure)}`,
    `Soil Moisture Stress: ${fmtScore(stress?.soilStress)}`,
    `Water Stress (comp.): ${fmtScore(stress?.waterStress)}`,
    '',
    '── Environmental Scores ──',
    `Environmental Tolerance Match: ${fmtScore(ag.toleranceScore)}`,
    `Productivity Stress Proxy:     ${fmtScore(ag.productivityScore)}`,
    `Water Supply vs. Requirement:  ${fmtScore(ag.waterSupply)}`,
    `Species Heat & Drought Envelope: ${fmtScore(ag.envelopeMatch)} (a species property, not a site measurement)`,
    `Input Completeness:            ${fmtScore(ag.inputCompleteness)}`,
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
    '── Bioenergy Suitability Index ──',
    `INDEX: ${bio.total ?? 'Incomplete'}/100`,
    ...bio.index.contributors.map(c =>
      `  ${(c.label+' ('+Math.round(c.nominalWeight*100)+'%)').padEnd(38)}${String(c.value).padStart(3)}/100  → +${c.contribution}`),
    ...(bio.index.missing.length ? ['  UNKNOWN sub-scores: ' + bio.index.missing.map(m=>m.label).join(', ')] : []),
    bio.index.renormalised ? `  NOTE: ${bio.index.note}` : '',
    '',
    '── Evidence Confidence (separate from the index above) ──',
    ...(ec ? [
      `Environment: ${ec.layers.environment.level}`,
      `Stress:      ${ec.layers.stress.level}`,
      `Tolerance:   ${ec.layers.tolerance.level}`,
      `Biology:     ${ec.layers.biology.level}`,
      `Bioenergy:   ${ec.layers.bioenergy.level}`,
      `End-to-end:  ${ec.overall} (weakest link: ${ec.limitingLabel})`,
      '',
      'Why:',
      ...ec.layers[ec.limiting].why.map(w => '  · ' + w),
      '',
      'What we do not know:',
      ...ec.unknowns.map(u => `  · ${u.what} — ${u.why}`),
      '',
      'What would improve this analysis:',
      ...ec.improvements.map(i => `  · ${i.input}: ${i.gain}`),
    ] : ['Not computed.']),
    '',
    '── Models used ──',
    ...(typeof TC_MODELS !== 'undefined' ? Object.values(TC_MODELS).map(m => `  ${m.name} v${m.version} [${m.status}]`) : []),
    'All models are EXPERIMENTAL: none has been validated against field outcomes.',
    '',
    '── Data Sources ──',
    'Weather/VPD/Soil/Archive: Open-Meteo API (open-meteo.com)',
    'Air Quality: Open-Meteo AQI API (air-quality-api.open-meteo.com)',
    'NWS Alerts: National Weather Service (api.weather.gov)',
    'Plant profiles: Published peer-reviewed and government literature (DOE, USDA, NREL, PNAS)',
    '',
    '── Limitations & Missing Data ──',
    ...((bio.index?.missing?.length)
        ? bio.index.missing.map(m => `- ${m.label} — UNKNOWN (${Math.round(m.weight * 100)}% of the index)`)
        : ['- All sub-scores were available.']),
    ...((ag.missing?.length)
        ? ag.missing.map(m => `- ${m.label} — left UNKNOWN rather than assumed`)
        : []),
    '',
    '⚠ WHAT THIS REPORT IS NOT',
    'No laboratory measurement was made. Lignin, cellulose, S:G ratio, biomass, moisture, ash and',
    'fermentation performance are NOT measured, and weather cannot measure them. Every chemistry and',
    'conversion statement above is a literature-supported hypothesis, not an observation of this plant.',
    'The composite models are EXPERIMENTAL and uncalibrated: their weights were chosen, not fitted.',
    'Not for production, investment, siting or policy decisions.',
    '',
    'Generated by TexasClimate — Evidence-Aware Bioenergy Crop Resilience Explorer.',
  ];
  const reportText = textLines.join('\n');

  el.innerHTML = `
    ${env.isScenario ? `<div class="rpt-scenario-banner" role="status">
      ${typeof tcStatusBadge === 'function' ? tcStatusBadge('EXPERIMENTAL') : ''}
      <strong>Experimental scenario — not measured conditions.</strong>
      Modified: ${escapeHtml((env.scenarioDesc || []).join(', '))}.
      Every figure below describes that hypothetical, not the observed environment.
    </div>` : ''}
    <div class="rpt-header">
      <div class="rpt-header-left">
        <div class="rpt-title">TexasClimate Bioenergy Suitability Report</div>
        <div class="rpt-meta">${escapeHtml(plant.name)} · ${escapeHtml(appState.locationLabel||'Location not set')} · ${reportTime}</div>
        <div class="rpt-ai-label">Computed from live data and literature-derived species profiles by documented, uncalibrated arithmetic models. No language model or generative model was involved in producing any figure in this report.</div>
      </div>
      <button class="btn-sm rpt-copy-btn" onclick="copyReport()" style="font-size:11px">📋 Copy Report</button>
      <button class="btn-sm rpt-download-btn" onclick="downloadReport()" style="font-size:11px">⤓ Download Report</button>
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
        <div class="rpt-row"><span class="rpt-lbl">Location</span><span class="rpt-val">${escapeHtml(appState.locationLabel||'—')} (${fmtCoord(env.lat, env.lon)})</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Temperature</span><span class="rpt-val">${fmtVal(cur?.temp, ts)} ${dataBadge('live-api')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Humidity</span><span class="rpt-val">${fmtVal(cur?.humidity, '%')} ${dataBadge('live-api')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Wind</span><span class="rpt-val">${fmtVal(cur?.wind, ' '+env.wSuffix)} ${dataBadge('live-api')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">UV Index</span><span class="rpt-val">${fmtVal(cur?.uv, '')} ${cur?.uv != null ? dataBadge('live-api') : ''}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">VPD</span><span class="rpt-val">${env.hourlyVPD != null ? env.hourlyVPD+' kPa '+dataBadge('live-api') : 'Estimated from temp+RH '+dataBadge('live-derived')}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Soil Moisture (0–1cm)</span><span class="rpt-val">${env.hourlySoil != null ? env.hourlySoil+' m³/m³ '+dataBadge('live-api') : na}</span></div>
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">30-Day Climate Water Balance</div>
        <div class="rpt-row"><span class="rpt-lbl">Precipitation Total</span><span class="rpt-val">${arch?.precipSum != null ? arch.precipSum+' mm '+dataBadge('live-api') : na}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">ET₀ Total</span><span class="rpt-val">${arch?.et0Sum != null ? arch.et0Sum+' mm '+dataBadge('live-api') : na}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Water Deficit Proxy (ET₀ − precipitation)</span><span class="rpt-val">${arch?.deficit != null
          ? arch.deficit+' mm over '+arch.days+' complete day(s) '+tcStatusBadge('DERIVED', 'Reference ET minus precipitation for a standard grass surface. Not measured plant drought stress.')
          : '<span class="rpt-na">UNKNOWN</span>'}</span></div>
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">Stress Profile</div>
        <div class="rpt-row"><span class="rpt-lbl">Heat Stress Score</span><span class="rpt-val">${fmtScore(stress?.heatStress)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Climate Water Deficit Proxy</span><span class="rpt-val">${fmtScore(stress?.droughtMemory)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">VPD Pressure</span><span class="rpt-val">${fmtScore(stress?.vpdPressure)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Soil Moisture Stress</span><span class="rpt-val">${fmtScore(stress?.soilStress)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Water Stress (composite)</span><span class="rpt-val">${fmtScore(stress?.waterStress)}</span></div>
      </div>

      <div class="rpt-section">
        <div class="rpt-section-title">Environmental Scores</div>
        <div class="rpt-row"><span class="rpt-lbl">Environmental Tolerance Match</span><span class="rpt-val">${fmtScore(ag.toleranceScore)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Productivity Stress Proxy</span><span class="rpt-val">${fmtScore(ag.productivityScore)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Water Supply vs. Requirement</span><span class="rpt-val">${fmtScore(ag.waterSupply)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Species Heat &amp; Drought Envelope</span><span class="rpt-val">${fmtScore(ag.envelopeMatch)}</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Input Completeness</span><span class="rpt-val">${fmtScore(ag.inputCompleteness)}</span></div>
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
        <div class="rpt-section-title">Bioenergy Suitability Index</div>
        <div class="rpt-final-number" style="color:${tcBand(bio.total).color}">${bio.total ?? '—'} / 100</div>
        ${ec ? `<div class="rpt-final-conf rpt-conf-${ec.layers.bioenergy.level.toLowerCase()}">Evidence Confidence: <strong>${ec.layers.bioenergy.level}</strong> — a separate measure from the index above</div>` : ''}
        ${bio.index.contributors.map(c =>
          `<div class="rpt-row"><span class="rpt-lbl">${escapeHtml(c.label)} (${Math.round(c.nominalWeight*100)}%)</span><span class="rpt-val">${c.value}/100 → +${c.contribution}</span></div>`).join('')}
        ${bio.index.missing.map(m =>
          `<div class="rpt-row"><span class="rpt-lbl">${escapeHtml(m.label)} (${Math.round(m.weight*100)}%)</span><span class="rpt-val"><span class="rpt-na">UNKNOWN</span></span></div>`).join('')}
        <div class="rpt-note">${escapeHtml(bio.note)}</div>
        <div class="rpt-note">${escapeHtml(typeof tcModelStamp === 'function' ? tcModelStamp(TC_MODELS.suitability) : '')}</div>
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
        ${(bio.index?.missing?.length || ag.missing?.length)
          ? [...(bio.index?.missing || []).map(m => `<div class="rpt-row"><span class="rpt-lbl">${tcStatusBadge('UNKNOWN')}</span><span class="rpt-val">${escapeHtml(m.label)} — ${Math.round(m.weight*100)}% of the index could not be computed</span></div>`),
             ...(ag.missing || []).map(m => `<div class="rpt-row"><span class="rpt-lbl">${tcStatusBadge('UNKNOWN')}</span><span class="rpt-val">${escapeHtml(m.label)}</span></div>`)].join('')
          : '<div class="rpt-row"><span class="rpt-val" style="color:#5DDBA8">Every input this model uses was available.</span></div>'}
        ${ec ? `<div class="rpt-row" style="margin-top:12px"><span class="rpt-lbl">Structurally unknown</span><span class="rpt-val">${ec.unknowns.map(u=>escapeHtml(u.what)).join(' · ')}</span></div>` : ''}
        <div class="rpt-row"><span class="rpt-lbl">Never measured here</span><span class="rpt-val">Lignin, cellulose, hemicellulose, S:G ratio, phenolics, moisture, ash, biomass yield and fermentation performance. Weather data cannot measure any of these, and no amount of better weather data would change that. Every chemistry and conversion statement in this report is a literature-supported hypothesis about what <em>might</em> be occurring, not an observation of this plant.</span></div>
        <div class="rpt-row"><span class="rpt-lbl">Model status</span><span class="rpt-val">${tcStatusBadge('EXPERIMENTAL')} All composite models are uncalibrated: their weights were chosen by the author, not fitted to observed outcomes. No validation set exists.</span></div>
        <div class="rpt-disclamer">⚠ Educational and exploratory use only. Not for production, investment, siting, land-use or policy decisions.</div>
      </div>

    </div>
  `;

  // Store text for clipboard
  el.dataset.reportText = reportText;
}

/* Download the evidence report as a file.
   Clipboard alone is not "shareable": it fails silently in some browser
   contexts, carries nothing to another machine, and leaves no artefact a
   reviewer can attach to anything. A file does. */
function downloadReport() {
  const el = document.getElementById('reportSection');
  const text = el?.dataset.reportText;
  const btn = document.querySelector('.rpt-download-btn');
  if (!text) { if (btn) btn.textContent = 'Nothing to export yet'; return; }
  try {
    const plant = (appState.plant?.name || 'analysis').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const loc   = (appState.locationLabel || 'location').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `texasclimate-${plant}-${loc}-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick so the download has started.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (btn) { btn.textContent = '✅ Downloaded'; setTimeout(() => { btn.textContent = '⤓ Download Report'; }, 2500); }
  } catch (e) {
    console.warn('[Report] download failed:', e);
    if (btn) btn.textContent = 'Download unavailable — use Copy';
  }
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
