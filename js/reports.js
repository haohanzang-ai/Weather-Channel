'use strict';

// ── AI Intelligence Reports — Generated entirely from live data ────────────────
function renderReports(){
  if(!dataLoaded || !Object.keys(WEATHER_DATA).length){
    document.getElementById('reportsContent').innerHTML='<div class="card loading-shimmer" style="height:200px"></div>';
    return;
  }

  const sorted   = Object.entries(WEATHER_DATA).sort((a,b)=>b[1].temp-a[1].temp);
  const hottest  = sorted[0];
  const coolest  = sorted[sorted.length-1];
  const avgTemp  = Math.round(sorted.reduce((s,[,d])=>s+d.temp,0)/sorted.length);
  const avgHumid = Math.round(sorted.reduce((s,[,d])=>s+d.humidity,0)/sorted.length);
  const avgWind  = Math.round(sorted.reduce((s,[,d])=>s+d.wind,0)/sorted.length);
  const avgUV    = Math.round(sorted.reduce((s,[,d])=>s+d.uv,0)/sorted.length);

  // AQI ranking
  const byAQI     = [...sorted].sort((a,b)=>b[1].aqi-a[1].aqi);
  const worstAQI  = byAQI[0];
  const bestAQI   = byAQI[byAQI.length-1];
  const avgAQI    = Math.round(byAQI.reduce((s,[,d])=>s+d.aqi,0)/byAQI.length);

  // Dominant condition
  const condCounts = {};
  sorted.forEach(([,d])=>{ condCounts[d.condition]=(condCounts[d.condition]||0)+1; });
  const dominant = Object.entries(condCounts).sort((a,b)=>b[1]-a[1])[0][0];

  // Forecast summary for hottest city
  const hForecast = FORECAST_DATA[hottest[0]] || [];
  const hiRange   = hForecast.length ? `${Math.min(...hForecast.map(f=>f.hi))}–${Math.max(...hForecast.map(f=>f.hi))}°F` : '—';
  const maxRainPct= hForecast.length ? Math.max(...hForecast.map(f=>f.rain)) : 0;
  const rainWord  = maxRainPct>=60?'Significant rain possible':maxRainPct>=30?'Some rain chances':maxRainPct>=10?'Slight rain chances':'Mostly dry';

  // ET0 / moisture summary
  const et0vals   = sorted.filter(([,d])=>d.et0Avg!==null).map(([,d])=>d.et0Avg);
  const avgET0    = et0vals.length ? Math.round(et0vals.reduce((a,b)=>a+b,0)/et0vals.length*10)/10 : null;
  const precipvals= sorted.filter(([,d])=>d.precipAvg!==null).map(([,d])=>d.precipAvg);
  const avgPrecip = precipvals.length ? Math.round(precipvals.reduce((a,b)=>a+b,0)/precipvals.length*10)/10 : null;

  // Heat assessment
  const heatAssess = avgTemp>=105?'dangerous heat emergency — outdoor work should be suspended':
                     avgTemp>=100?'extreme heat conditions — dangerous for vulnerable groups and prolonged outdoor activity':
                     avgTemp>=95?'significant heat stress — elevated health risk':
                     avgTemp>=85?'warm conditions — elevated heat risk for extended outdoor exposure':'moderate conditions';

  // AG moisture line
  const moistLine = avgET0!==null && avgPrecip!==null
    ? `Average ET₀ (evapotranspiration) is <strong>${avgET0} mm/day</strong> vs <strong>${avgPrecip} mm/day</strong> precipitation — a ${avgET0>avgPrecip?`moisture deficit of ${Math.round((avgET0-avgPrecip)*10)/10} mm/day`:'moisture surplus'}.`
    : `7-day forecast rain probability: <strong>${Math.round(sorted.reduce((s,[n])=>{ const days=FORECAST_DATA[n]||[]; return s+(days.length?days.reduce((a,f)=>a+f.rain,0)/days.length:0); },0)/sorted.length)}%</strong> statewide average.`;

  const nowStr = new Date().toLocaleString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});

  document.getElementById('reportsContent').innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      ${dataBadge('live-drv')}
      <span style="font-size:10px;color:var(--text3)">These reports are <strong>template-filled summaries</strong> generated from live Open-Meteo and NWS data — not a live AI service. Values update automatically.</span>
    </div>
    <div class="insight-card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div class="insight-tag">📊 Live Data Briefing — ${escapeHtml(nowStr)}</div>
        ${dataBadge('live-drv')}
      </div>
      <p class="insight-text" style="margin-bottom:8px">Across <strong>${sorted.length} monitored Texas cities</strong>, the statewide average is <strong>${avgTemp}°F</strong> with ${heatAssess}. The hottest city right now is <strong>${escapeHtml(hottest[0])} at ${hottest[1].temp}°F</strong> (${escapeHtml(hottest[1].condition)}); the coolest is <strong>${escapeHtml(coolest[0])} at ${coolest[1].temp}°F</strong>. Dominant conditions: <strong>${escapeHtml(dominant)}</strong>.</p>
      <p class="insight-text">Statewide averages — Humidity: <strong>${avgHumid}%</strong> · Wind: <strong>${avgWind} mph</strong> · UV Index: <strong>${avgUV}</strong>. 7-day ${escapeHtml(hottest[0])} high range: <strong>${hiRange}</strong>. ${escapeHtml(rainWord)} this week.</p>
    </div>
    <div class="insight-card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div class="insight-tag">💨 Air Quality Summary</div>${dataBadge('live-api')}</div>
      <p class="insight-text"><strong>${escapeHtml(worstAQI[0])}</strong> has the highest AQI at <strong>${worstAQI[1].aqi}</strong> (${escapeHtml(getAQILabel(worstAQI[1].aqi).label)}). <strong>${escapeHtml(bestAQI[0])}</strong> has the best air quality at AQI <strong>${bestAQI[1].aqi}</strong> (${escapeHtml(getAQILabel(bestAQI[1].aqi).label)}). Statewide average: AQI <strong>${avgAQI}</strong> — ${avgAQI<=50?'Good across all cities. Safe for all outdoor activities.':avgAQI<=100?'Moderate. Most people unaffected; unusually sensitive individuals should take care.':'Unhealthy for sensitive groups in some areas.'}</p>
    </div>
    <div class="insight-card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div class="insight-tag">🌾 Agricultural Moisture Estimate</div>${dataBadge('live-drv')}</div>
      <p class="insight-text">${moistLine} ${avgET0!==null&&avgET0>avgPrecip?`This deficit indicates moderate-to-high irrigation demand across Texas. Crops with shallow roots are at greatest risk. Refer to the Agriculture tab for city-level breakdown.`:`Moisture conditions are relatively favorable. Monitor the Agriculture tab for crop-specific outlooks.`} For official drought designation: <a href="https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?TX" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">droughtmonitor.unl.edu →</a></p>
    </div>
    <div class="insight-card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div class="insight-tag">ℹ️ Data Sources &amp; Methodology</div>${dataBadge('live-drv')}</div>
      <p class="insight-text">Reports refresh automatically from live APIs. Sources: <strong>Open-Meteo Forecast API</strong> (current conditions, 7-day forecast, ET₀, precipitation) · <strong>Open-Meteo Air Quality API</strong> (US AQI per city) · <strong>NWS api.weather.gov</strong> (severe weather alerts, on Severe tab only). <em>Agriculture and energy figures are weather-derived estimates — not official USDA or ERCOT data.</em></p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
      <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" class="btn-sm">🌐 Open-Meteo</a>
      <a href="https://api.weather.gov" target="_blank" rel="noopener noreferrer" class="btn-sm">📡 NWS API</a>
      <a href="https://droughtmonitor.unl.edu" target="_blank" rel="noopener noreferrer" class="btn-sm">🌾 Drought Monitor</a>
      <a href="https://www.waterdatafortexas.org/reservoirs/statewide" target="_blank" rel="noopener noreferrer" class="btn-sm">💧 TX Reservoirs</a>
      <a href="https://www.ercot.com/gridinfo" target="_blank" rel="noopener noreferrer" class="btn-sm">⚡ ERCOT Grid</a>
    </div>`;
}
