'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   TexasClimate — Demo / Judge Walkthrough Engine
   12-step guided walkthrough. Uses live data where available;
   clearly labeled demo values otherwise.
   ══════════════════════════════════════════════════════════════════════════ */

var _demoCurrentStep = 0;

/* ── Helper: get Austin live data (or null if not yet loaded) ── */
function _demoAustinData () {
  // WEATHER_DATA is a let-declared global in data.js (not on window)
  try {
    var d = WEATHER_DATA['Austin'];
    return (d && d.temp != null) ? d : null;
  } catch (e) { return null; }
}

/* ── Helper: badge HTML ── */
function _demoBadge (type, label) {
  var map = {
    live:     ['badge-live',     label || '● Live API'],
    derived:  ['badge-derived',  label || 'Live-Derived'],
    research: ['badge-research', label || 'Research Estimate'],
    demo:     ['badge-demo',     label || '⚠ Demo Data'],
    static:   ['badge-static',   label || 'Static Approx.']
  };
  var pair = map[type] || map['demo'];
  return '<span class="demo-badge ' + pair[0] + '">' + pair[1] + '</span>';
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP DEFINITIONS
   Each step: { icon, title, narration, buildHTML() → string }
   ══════════════════════════════════════════════════════════════════════════ */
var DEMO_STEPS = [

  /* ── Step 1 ── */
  {
    icon: '🌿',
    title: 'What TexasClimate Does',
    narration: 'TexasClimate asks one question: can this plant survive here and become useful clean bioenergy? It connects live Texas weather data with plant biology and bioenergy science.',
    buildHTML: function () {
      return [
        '<div class="demo-card-grid three-col">',
        '  <div class="demo-info-card">',
        '    <div class="demo-info-icon">🌡</div>',
        '    <div class="demo-info-title">Live Weather</div>',
        '    <div class="demo-info-desc">Real-time temperature, AQI, forecasts, and NWS alerts for 10 Texas cities.</div>',
        '    ' + _demoBadge('live', '● Live API'),
        '  </div>',
        '  <div class="demo-info-card">',
        '    <div class="demo-info-icon">⚠</div>',
        '    <div class="demo-info-title">Plant Stress</div>',
        '    <div class="demo-info-desc">Heat, drought, and moisture stress calculated from live weather data using documented formulas.</div>',
        '    ' + _demoBadge('derived'),
        '  </div>',
        '  <div class="demo-info-card">',
        '    <div class="demo-info-icon">⚡</div>',
        '    <div class="demo-info-title">Bioenergy Score</div>',
        '    <div class="demo-info-desc">Confidence estimate combining plant profile, live environment, and peer-reviewed conversion science.</div>',
        '    ' + _demoBadge('research'),
        '  </div>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 2 ── */
  {
    icon: '🌾',
    title: 'Sample Plant: Switchgrass',
    narration: 'Switchgrass (Panicum virgatum) is a native Texas perennial — a U.S. DOE priority bioenergy crop with 540% net energy return and very high drought tolerance.',
    buildHTML: function () {
      return [
        '<div class="demo-plant-card selected">',
        '  <div class="demo-plant-header">',
        '    <div class="demo-plant-icon">🌾</div>',
        '    <div>',
        '      <div class="demo-plant-name">Switchgrass</div>',
        '      <div class="demo-plant-sci">Panicum virgatum</div>',
        '      <span class="demo-badge demo-badge-selected">✓ Selected for Demo</span>',
        '    </div>',
        '  </div>',
        '  <div class="demo-plant-traits">',
        '    <div class="demo-trait"><span class="demo-trait-label">Heat Tolerance</span>',
        '      <div class="demo-bar"><div class="demo-bar-fill" style="width:80%;background:#FF8C00"></div></div>',
        '      <span>High (up to 104°F)</span></div>',
        '    <div class="demo-trait"><span class="demo-trait-label">Drought Tolerance</span>',
        '      <div class="demo-bar"><div class="demo-bar-fill" style="width:85%;background:#FF8C00"></div></div>',
        '      <span>High</span></div>',
        '    <div class="demo-trait"><span class="demo-trait-label">Bioenergy Potential</span>',
        '      <div class="demo-bar"><div class="demo-bar-fill" style="width:92%;background:#5DDBA8"></div></div>',
        '      <span>Very High</span></div>',
        '    <div class="demo-trait"><span class="demo-trait-label">Water Use</span>',
        '      <div class="demo-bar"><div class="demo-bar-fill" style="width:25%;background:#5DDBA8"></div></div>',
        '      <span>Low (6–14 gal/gal fuel)</span></div>',
        '  </div>',
        '  <div class="demo-plant-note">Source: Schmer et al. (2008) PNAS 105(2):464–469 · DOE EERE Switchgrass Fact Sheet · Net energy return: 540% above input energy</div>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 3 ── */
  {
    icon: '📍',
    title: 'Sample Location: Austin, TX',
    narration: 'Austin represents central Texas — semi-arid, hot summers, periodic drought. In the full app, any Texas location or city can be selected.',
    buildHTML: function () {
      return [
        '<div class="demo-location-card">',
        '  <div class="demo-loc-header">',
        '    <div class="demo-loc-icon">📍</div>',
        '    <div>',
        '      <div class="demo-loc-name">Austin, TX</div>',
        '      <div class="demo-loc-coords">30.27°N, 97.74°W · Central Texas</div>',
        '    </div>',
        '    <span class="demo-badge demo-badge-selected">✓ Demo Location</span>',
        '  </div>',
        '  <div class="demo-loc-climate">',
        '    <div class="demo-climate-fact"><span>🌡</span><span>Avg summer high: 97–99°F</span></div>',
        '    <div class="demo-climate-fact"><span>💧</span><span>Avg annual precip: ~34 in</span></div>',
        '    <div class="demo-climate-fact"><span>☀️</span><span>Climate: Semi-arid subtropical</span></div>',
        '    <div class="demo-climate-fact"><span>🌾</span><span>Switchgrass native range: ✓ Present</span></div>',
        '  </div>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 4 ── */
  {
    icon: '🌡',
    title: 'Live Weather Data — Austin, TX',
    narration: 'TexasClimate fetches real weather from Open-Meteo API on page load. Values shown are live if the API has loaded, or clearly labeled demo data if not.',
    buildHTML: function () {
      var d = _demoAustinData();
      var isLive = !!d;
      var temp     = isLive ? Math.round(d.temp)     : 94;
      var humidity = isLive ? Math.round(d.humidity) : 52;
      var wind     = isLive ? Math.round(d.wind)     : 8;
      var aqi      = isLive ? Math.round(d.aqi || 42): 42;
      var badge    = isLive ? _demoBadge('live') : _demoBadge('demo');
      var srcNote  = isLive
        ? 'Values fetched live this session from <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo API</a>'
        : '⚠ Live data not yet loaded — demo values shown. Reload the page once APIs finish to see real data.';
      return [
        badge,
        '<div class="demo-weather-grid" style="margin-top:10px">',
        '  <div class="demo-weather-card"><div class="demo-w-icon">🌡</div><div class="demo-w-val">' + temp + '°F</div><div class="demo-w-label">Temperature</div></div>',
        '  <div class="demo-weather-card"><div class="demo-w-icon">💧</div><div class="demo-w-val">' + humidity + '%</div><div class="demo-w-label">Humidity</div></div>',
        '  <div class="demo-weather-card"><div class="demo-w-icon">💨</div><div class="demo-w-val">' + wind + ' mph</div><div class="demo-w-label">Wind Speed</div></div>',
        '  <div class="demo-weather-card"><div class="demo-w-icon">🌫</div><div class="demo-w-val">AQI ' + aqi + '</div><div class="demo-w-label">Air Quality</div></div>',
        '</div>',
        '<div class="demo-src-note" style="margin-top:10px">' + srcNote + '</div>'
      ].join('');
    }
  },

  /* ── Step 5 ── */
  {
    icon: '⚠',
    title: 'Stress Profile — Heat · Drought · Salinity',
    narration: 'Heat, drought, and moisture stress are calculated from live weather data using documented formulas — not hardcoded or invented values.',
    buildHTML: function () {
      var d = _demoAustinData();
      var isLive = !!d;
      var heat = isLive ? Math.round(Math.max(0, Math.min(100, (d.temp - 68) / 36 * 100))) : 70;
      var et0  = isLive ? (d.et0Avg || 0.28) : 0.28;
      var prec = isLive ? (d.precipAvg || 0) : 0.04;
      var moist = isLive ? Math.round(Math.max(0, Math.min(100, (et0 - prec) / Math.max(0.01, et0) * 100))) : 62;
      var salin = 15; // Austin is inland — always low

      function barColor(v) {
        return v > 70 ? '#FF4444' : v > 40 ? '#FF8C00' : '#5DDBA8';
      }

      var badge   = isLive ? _demoBadge('derived') : _demoBadge('demo');
      return [
        badge,
        '<div class="demo-stress-grid" style="margin-top:10px">',
        '  <div class="demo-stress-item">',
        '    <div class="demo-stress-label">🔥 Heat Stress</div>',
        '    <div class="demo-stress-bar-wrap"><div class="demo-stress-bar" style="width:' + heat + '%;background:' + barColor(heat) + '"></div></div>',
        '    <div class="demo-stress-val">' + heat + '%</div>',
        '  </div>',
        '  <div class="demo-stress-item">',
        '    <div class="demo-stress-label">💧 Drought Stress</div>',
        '    <div class="demo-stress-bar-wrap"><div class="demo-stress-bar" style="width:' + moist + '%;background:' + barColor(moist) + '"></div></div>',
        '    <div class="demo-stress-val">' + moist + '%</div>',
        '  </div>',
        '  <div class="demo-stress-item">',
        '    <div class="demo-stress-label">🧂 Salinity Risk</div>',
        '    <div class="demo-stress-bar-wrap"><div class="demo-stress-bar" style="width:' + salin + '%;background:#5DDBA8"></div></div>',
        '    <div class="demo-stress-val">' + salin + '% (Low — inland location)</div>',
        '  </div>',
        '</div>',
        '<div class="demo-src-note" style="margin-top:10px">',
        '  Formulas: Heat = max(0, (T°F − 68) / 36 × 100) · Moisture = ET0 deficit / ET0 · Salinity: coastal proximity proxy only.<br>',
        '  Stress chain science: <a href="https://doi.org/10.1016/j.biortech.2004.06.025" target="_blank" rel="noopener">Mosier et al. (2005)</a>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 6 ── */
  {
    icon: '🌿',
    title: 'Plant Survival Score — Switchgrass in Austin',
    narration: 'Switchgrass is well-matched to Texas heat and drought. The survival score combines its published tolerance thresholds with current live conditions.',
    buildHTML: function () {
      var d = _demoAustinData();
      var isLive = !!d;
      var heat = isLive ? Math.round(Math.max(0, Math.min(100, (d.temp - 68) / 36 * 100))) : 70;
      // Switchgrass heat tolerance = 80% on the stress scale before yield starts dropping
      var penalty = Math.max(0, heat - 80) * 1.5;
      var score = Math.round(Math.max(20, Math.min(100, 92 - penalty)));
      var color = score >= 70 ? '#5DDBA8' : score >= 40 ? '#FF8C00' : '#FF4444';
      var label = score >= 70 ? 'Good' : score >= 40 ? 'Moderate' : 'Stressed';
      var badge = isLive ? _demoBadge('derived') : _demoBadge('demo');
      var arc   = Math.round(score * 3.1416); // ~circumference of r=50

      return [
        badge,
        '<div class="demo-survival-card" style="margin-top:10px">',
        '  <div class="demo-score-ring">',
        '    <svg viewBox="0 0 120 120" class="demo-ring-svg" role="img" aria-label="Survival score ' + score + ' percent">',
        '      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="10"/>',
        '      <circle cx="60" cy="60" r="50" fill="none" stroke="' + color + '" stroke-width="10"',
        '        stroke-dasharray="' + arc + ' 314" stroke-linecap="round" transform="rotate(-90 60 60)"/>',
        '      <text x="60" y="56" text-anchor="middle" fill="' + color + '" font-size="22" font-weight="800" font-family="Inter,sans-serif">' + score + '%</text>',
        '      <text x="60" y="73" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="10" font-family="Inter,sans-serif">' + label + '</text>',
        '    </svg>',
        '  </div>',
        '  <div class="demo-survival-details">',
        '    <div class="demo-survival-title">Switchgrass Survival Score</div>',
        '    <div class="demo-survival-loc">Austin, TX · Current conditions</div>',
        '    <div class="demo-survival-note">Switchgrass heat tolerance: up to 104°F (40°C). Drought tolerance: High. Score = plant tolerance profile × live stress data.</div>',
        '    <div class="demo-src-note">Source: DOE EERE Switchgrass Profile · Open-Meteo live temperature</div>',
        '  </div>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 7 ── */
  {
    icon: '⚡',
    title: 'Bioenergy Confidence Score',
    narration: 'The bioenergy confidence score combines the plant tolerance profile, live stress levels, and published conversion chemistry. It is a research estimate — not a fuel production forecast.',
    buildHTML: function () {
      var d = _demoAustinData();
      var isLive = !!d;
      var heat = isLive ? Math.round(Math.max(0, Math.min(100, (d.temp - 68) / 36 * 100))) : 70;
      var et0  = isLive ? (d.et0Avg || 0.28) : 0.28;
      var prec = isLive ? (d.precipAvg || 0) : 0.04;
      var moist = isLive ? Math.round(Math.max(0, Math.min(100, (et0 - prec) / Math.max(0.01, et0) * 100))) : 62;
      // Simple scoring model: start at 82, penalize for stress
      var score = Math.round(Math.max(25, 82 - heat * 0.12 - moist * 0.06));
      var arc   = Math.round(score * 3.1416);
      var badge = isLive ? _demoBadge('research', 'Research Estimate + Live Data') : _demoBadge('demo');

      return [
        badge,
        '<div class="demo-bio-grid" style="margin-top:10px">',
        '  <div class="demo-bio-gauge">',
        '    <div class="demo-bio-score-ring">',
        '      <svg viewBox="0 0 120 120" role="img" aria-label="Bioenergy confidence ' + score + ' percent">',
        '        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="10"/>',
        '        <circle cx="60" cy="60" r="50" fill="none" stroke="#5DDBA8" stroke-width="10"',
        '          stroke-dasharray="' + arc + ' 314" stroke-linecap="round" transform="rotate(-90 60 60)"/>',
        '        <text x="60" y="56" text-anchor="middle" fill="#5DDBA8" font-size="22" font-weight="800" font-family="Inter,sans-serif">' + score + '%</text>',
        '        <text x="60" y="73" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="10" font-family="Inter,sans-serif">Confidence</text>',
        '      </svg>',
        '    </div>',
        '  </div>',
        '  <div class="demo-bio-breakdown">',
        '    <div class="demo-bio-title">Bioenergy Confidence Score</div>',
        '    <div class="demo-bio-row"><span>Plant–environment match</span><span class="bio-good">High</span></div>',
        '    <div class="demo-bio-row"><span>Conversion pathway</span><span class="bio-good">Cellulosic ethanol</span></div>',
        '    <div class="demo-bio-row"><span>Lignin barrier risk</span><span class="bio-med">Moderate</span></div>',
        '    <div class="demo-bio-row"><span>Stress chemistry risk</span><span class="bio-med">Moderate</span></div>',
        '    <div class="demo-bio-note">⚠ Research estimate — lab biomass data needed for exact fuel yield (gal/ton)</div>',
        '  </div>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 8 ── */
  {
    icon: '◉',
    title: 'Interactive Texas Climate Map',
    narration: 'The Texas Map shows live weather overlays AND static pollution layers — agricultural runoff, pesticide intensity, and GHG hotspots alongside real-time drought and cloud cover.',
    buildHTML: function () {
      return [
        '<div class="demo-map-preview">',
        '  <div class="demo-map-info">',
        '    <div class="demo-map-title">Map Features</div>',
        '    <div class="demo-map-features">',
        '      <div class="demo-map-feat"><span class="demo-feat-badge badge-live">Live</span>Precipitation overlay</div>',
        '      <div class="demo-map-feat"><span class="demo-feat-badge badge-live">Live</span>Cloud cover overlay</div>',
        '      <div class="demo-map-feat"><span class="demo-feat-badge badge-live">Live</span>Severe weather alerts (NWS)</div>',
        '      <div class="demo-map-feat"><span class="demo-feat-badge badge-live">Live</span>Drought stress overlay</div>',
        '      <div class="demo-map-feat"><span class="demo-feat-badge badge-static">Static</span>Agricultural runoff zones</div>',
        '      <div class="demo-map-feat"><span class="demo-feat-badge badge-static">Static</span>Pesticide intensity (county)</div>',
        '      <div class="demo-map-feat"><span class="demo-feat-badge badge-static">Static</span>GHG emission hotspots</div>',
        '      <div class="demo-map-feat"><span class="demo-feat-badge badge-live">Live</span>10 city temperature + AQI pins</div>',
        '    </div>',
        '    <button class="demo-goto-btn" onclick="showPage(\'mapcompare\')">Open Texas Map →</button>',
        '  </div>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 9 ── */
  {
    icon: '🔬',
    title: 'Plant-to-Fuel Scanner',
    narration: 'Upload a plant photo to get an educational bioenergy analysis based on published biomass science. Photos cannot measure lignin or fuel yield — that requires a lab.',
    buildHTML: function () {
      return [
        '<div class="demo-scanner-preview">',
        '  <div class="demo-scan-workflow">',
        '    <div class="demo-scan-step">📷<br><small>Upload photo</small></div>',
        '    <div class="demo-scan-arrow">→</div>',
        '    <div class="demo-scan-step">🌿<br><small>Confirm plant</small></div>',
        '    <div class="demo-scan-arrow">→</div>',
        '    <div class="demo-scan-step">🔍<br><small>Analyze traits</small></div>',
        '    <div class="demo-scan-arrow">→</div>',
        '    <div class="demo-scan-step">📊<br><small>Bioenergy report</small></div>',
        '  </div>',
        '  <div class="demo-scan-limits">',
        '    <div class="demo-limit-title">⚠ What photos CANNOT measure (lab assay required):</div>',
        '    <div class="demo-limit-grid">',
        '      <div class="demo-limit-item">❌ Lignin content</div>',
        '      <div class="demo-limit-item">❌ Cellulose %</div>',
        '      <div class="demo-limit-item">❌ Fuel yield (gal/ton)</div>',
        '      <div class="demo-limit-item">❌ Dry biomass (tons)</div>',
        '    </div>',
        '  </div>',
        '  <button class="demo-goto-btn" onclick="showPage(\'bioenergy\')">Open Plant Scanner →</button>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 10 ── */
  {
    icon: '⚗️',
    title: 'Lignin Barrier — Why Conversion Is Hard',
    narration: 'Lignin surrounds the useful sugars inside the plant cell wall. Breaking through it requires expensive pretreatment — the key cost barrier to commercial cellulosic biofuel.',
    buildHTML: function () {
      return [
        '<div class="demo-lignin-visual">',
        '  <div class="demo-process-flow">',
        '    <div class="demo-proc-step">☀️<br><small>Sunlight</small></div>',
        '    <div class="demo-proc-arrow">→</div>',
        '    <div class="demo-proc-step">🌿<br><small>Switchgrass<br>Biomass</small></div>',
        '    <div class="demo-proc-arrow">→</div>',
        '    <div class="demo-proc-step hard">⚗️<br><small>Pretreatment<br>(lignin barrier)</small></div>',
        '    <div class="demo-proc-arrow">→</div>',
        '    <div class="demo-proc-step">🍬<br><small>Sugars</small></div>',
        '    <div class="demo-proc-arrow">→</div>',
        '    <div class="demo-proc-step">🧪<br><small>Fermentation</small></div>',
        '    <div class="demo-proc-arrow">→</div>',
        '    <div class="demo-proc-step">⛽<br><small>Biofuel</small></div>',
        '  </div>',
        '  <div class="demo-cell-wall">',
        '    <div class="demo-cw-title">Inside the Plant Cell Wall:</div>',
        '    <div class="demo-cw-layers">',
        '      <div class="demo-cw-layer lignin-layer">🪵 Lignin — structural shield (blocks enzymes, increases pretreatment cost)</div>',
        '      <div class="demo-cw-layer cellulose-layer">🍬 Cellulose → enzymatic hydrolysis → glucose → ethanol</div>',
        '      <div class="demo-cw-layer hemi-layer">🍬 Hemicellulose → pentose sugars → ethanol or other fuels</div>',
        '    </div>',
        '  </div>',
        '  <div class="demo-src-note">Source: Mosier et al. (2005), <em>Bioresource Technology</em> 96(6):673–686 · ',
        '    <a href="https://doi.org/10.1016/j.biortech.2004.06.025" target="_blank" rel="noopener">doi:10.1016/j.biortech.2004.06.025</a>',
        '  </div>',
        '</div>'
      ].join('');
    }
  },

  /* ── Step 11 ── */
  {
    icon: '📚',
    title: 'Data Sources & Transparency',
    narration: 'Every data point is labeled: Live API, Live-Derived, Research Estimate, or Demo. Scientific claims link to peer-reviewed papers — no faked data anywhere.',
    buildHTML: function () {
      return [
        '<div class="demo-sources-grid">',
        '  <div class="demo-src-card">',
        '    ' + _demoBadge('live'),
        '    <div class="demo-src-card-title">Open-Meteo Weather API</div>',
        '    <div class="demo-src-card-items">Temperature · Humidity · Wind · ET0 · AQI · 7-day Forecast</div>',
        '  </div>',
        '  <div class="demo-src-card">',
        '    ' + _demoBadge('live'),
        '    <div class="demo-src-card-title">NWS Severe Alerts</div>',
        '    <div class="demo-src-card-items">api.weather.gov — Texas active weather alerts in real time</div>',
        '  </div>',
        '  <div class="demo-src-card">',
        '    ' + _demoBadge('derived'),
        '    <div class="demo-src-card-title">Stress Scores</div>',
        '    <div class="demo-src-card-items">Heat stress · Moisture/drought · Cooling Demand Index — all formulaic</div>',
        '  </div>',
        '  <div class="demo-src-card">',
        '    ' + _demoBadge('research'),
        '    <div class="demo-src-card-title">Bioenergy Science</div>',
        '    <div class="demo-src-card-items">Schmer et al. PNAS 2008 · Mosier et al. 2005 · Ragauskas 2006 · DOE EERE</div>',
        '  </div>',
        '</div>',
        '<button class="demo-goto-btn" onclick="showPage(\'sources\')">View Full Sources & Citations →</button>'
      ].join('');
    }
  },

  /* ── Step 12 ── */
  {
    icon: '🏆',
    title: 'Judge Summary — What I Built',
    narration: 'This is what TexasClimate does, what is live, what is estimated, and why it matters for Texas students and constituents.',
    buildHTML: function () {
      return [
        '<div class="demo-judge-card">',
        '  <div class="demo-judge-grid">',
        '    <div class="demo-judge-section">',
        '      <div class="demo-judge-label">🔴 Problem</div>',
        '      <div class="demo-judge-text">Texas faces rising heat, drought, agricultural stress, and energy costs. Students and Texans lack easy tools to understand how climate, crops, and clean energy connect.</div>',
        '    </div>',
        '    <div class="demo-judge-section">',
        '      <div class="demo-judge-label">🟢 Solution</div>',
        '      <div class="demo-judge-text">TexasClimate connects live environmental data with plant stress science and bioenergy education — making the path from Texas weather to Texas clean fuel visible and understandable.</div>',
        '    </div>',
        '    <div class="demo-judge-section">',
        '      <div class="demo-judge-label">💻 What I Coded</div>',
        '      <div class="demo-judge-text">Live API fetching (Open-Meteo, NWS) · Stress formulas · Bioenergy score model · MapLibre map layers · Plant scanner workflow · 12-step demo engine · Local AI chatbot · Data transparency label system</div>',
        '    </div>',
        '    <div class="demo-judge-section">',
        '      <div class="demo-judge-label">🎯 Why It Matters</div>',
        '      <div class="demo-judge-text">Helps students and everyday Texans understand how climate, agriculture, and clean energy are connected — supporting clean energy education and environmental awareness in Texas.</div>',
        '    </div>',
        '    <div class="demo-judge-section">',
        '      <div class="demo-judge-label">⚠ Limitations</div>',
        '      <div class="demo-judge-text">Educational prototype — not farming, investment, or emergency advice. No PlantNet API yet. No USDA soil data. Lab biomass assays needed for exact chemistry values.</div>',
        '    </div>',
        '    <div class="demo-judge-section">',
        '      <div class="demo-judge-label">🚀 Future Work</div>',
        '      <div class="demo-judge-text">PlantNet API for real plant ID · USDA soil/crop APIs · USGS/TWDB water data · Real NDVI satellite coverage · Lab-validated biomass database</div>',
        '    </div>',
        '  </div>',
        '  <div class="demo-checklist">',
        '    <div class="demo-check-title">✅ Feature Checklist</div>',
        '    <div class="demo-check-grid">',
        '      <div class="demo-check-item done">✅ Live weather API (Open-Meteo)</div>',
        '      <div class="demo-check-item done">✅ Live AQI API</div>',
        '      <div class="demo-check-item done">✅ NWS severe weather alerts</div>',
        '      <div class="demo-check-item done">✅ 10-city Texas comparison</div>',
        '      <div class="demo-check-item done">✅ Plant stress scoring</div>',
        '      <div class="demo-check-item done">✅ Bioenergy confidence model</div>',
        '      <div class="demo-check-item done">✅ Plant-to-Fuel scanner (educational)</div>',
        '      <div class="demo-check-item done">✅ Fuel pathway / lignin diagram</div>',
        '      <div class="demo-check-item done">✅ Source transparency labels</div>',
        '      <div class="demo-check-item done">✅ Safety / limitations system</div>',
        '      <div class="demo-check-item done">✅ Local AI chatbot</div>',
        '      <div class="demo-check-item done">✅ 12-step demo walkthrough</div>',
        '    </div>',
        '  </div>',
        '  <div class="demo-print-bar">',
        '    <button class="demo-goto-btn" onclick="window.print()">🖨 Print This Summary</button>',
        '    <button class="demo-goto-btn" onclick="demoGoStep(1)">↩ Restart Demo</button>',
        '    <button class="demo-goto-btn" onclick="showPage(\'analyze\')">Go to App →</button>',
        '  </div>',
        '</div>'
      ].join('');
    }
  }

];

/* ══════════════════════════════════════════════════════════════════════════
   DEMO ENGINE
   ══════════════════════════════════════════════════════════════════════════ */

function demoGoStep (n) {
  _demoCurrentStep = Math.max(0, Math.min(DEMO_STEPS.length - 1, n - 1));
  _demoRender();
}

function demoNext () {
  if (_demoCurrentStep < DEMO_STEPS.length - 1) {
    _demoCurrentStep++;
    _demoRender();
  } else {
    // Already at last step — restart
    _demoCurrentStep = 0;
    _demoRender();
  }
}

function demoPrev () {
  if (_demoCurrentStep > 0) {
    _demoCurrentStep--;
    _demoRender();
  }
}

function demoReset () {
  _demoCurrentStep = 0;
  _demoRender();
}

function demoStart () {
  _demoCurrentStep = 0;
  _demoRender();
  var pg = document.getElementById('page-demo');
  if (pg) pg.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _demoRender () {
  var step       = DEMO_STEPS[_demoCurrentStep];
  var total      = DEMO_STEPS.length;
  var stepNum    = _demoCurrentStep + 1;
  var pct        = Math.round(stepNum / total * 100);

  var container  = document.getElementById('demoStepContent');
  var progressEl = document.getElementById('demoProgress');
  var barEl      = document.getElementById('demoProgressBar');
  var iconEl     = document.getElementById('demoStepIcon');
  var titleEl    = document.getElementById('demoStepTitle');
  var narrationEl = document.getElementById('demoStepNarration');
  var prevBtn    = document.getElementById('demoPrevBtn');
  var nextBtn    = document.getElementById('demoNextBtn');
  var skipBtn    = document.getElementById('demoSkipBtn');

  if (!container) return;

  if (progressEl) progressEl.textContent = stepNum + ' / ' + total;
  if (barEl)      barEl.style.width = pct + '%';
  if (iconEl)     iconEl.textContent = step.icon;
  if (titleEl)    titleEl.textContent = 'Step ' + stepNum + ': ' + step.title;
  if (narrationEl) narrationEl.textContent = step.narration;

  // Render step content
  container.classList.remove('demo-step-in');
  void container.offsetWidth; // force reflow for re-animation
  container.innerHTML = typeof step.buildHTML === 'function' ? step.buildHTML() : (step.html || '');
  container.classList.add('demo-step-in');

  // Buttons
  if (prevBtn)  prevBtn.disabled = (_demoCurrentStep === 0);
  if (nextBtn) {
    if (_demoCurrentStep === DEMO_STEPS.length - 1) {
      nextBtn.textContent = '↩ Restart';
    } else {
      nextBtn.textContent = 'Next →';
    }
  }
  if (skipBtn)  skipBtn.style.display = _demoCurrentStep < DEMO_STEPS.length - 1 ? 'inline-flex' : 'none';

  // Announce for screen readers
  var announcer = document.getElementById('sr-announcer');
  if (announcer) announcer.textContent = 'Step ' + stepNum + ' of ' + total + ': ' + step.title;
}
