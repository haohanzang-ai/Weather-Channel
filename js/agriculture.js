'use strict';

// ── Agriculture — Derived from live Open-Meteo ET0, precip, temp, humidity ───
function computeAgMetrics(){
  const cities = Object.values(WEATHER_DATA);
  if(!cities.length) return null;

  const avgTemp  = cities.reduce((s,d)=>s+d.temp,0)  / cities.length;
  const avgHumid = cities.reduce((s,d)=>s+d.humidity,0) / cities.length;
  const avgWind  = cities.reduce((s,d)=>s+d.wind,0)  / cities.length;

  // 7-day average precipitation probability across all cities
  const allDays  = Object.values(FORECAST_DATA).flat();
  const avgRainProb = allDays.length ? allDays.reduce((s,f)=>s+f.rain,0)/allDays.length : 30;

  // ET0 (evapotranspiration) vs precipitation — the standard drought indicator
  // ET0 > precip means plants lose more water than they receive → moisture stress
  const et0Cities    = cities.filter(d=>d.et0Avg    !== null);
  const precipCities = cities.filter(d=>d.precipAvg !== null);
  const avgET0    = et0Cities.length    ? et0Cities.reduce((s,d)=>s+d.et0Avg,0)    / et0Cities.length    : null;
  const avgPrecip = precipCities.length ? precipCities.reduce((s,d)=>s+d.precipAvg,0) / precipCities.length : null;

  // Heat stress index (0–100): crops stressed above 86°F, critical above 104°F
  const heatPct = Math.min(100, Math.max(0, Math.round((avgTemp - 68) / 36 * 100)));

  // Moisture stress (0–100): uses ET0 deficit if available, else rain probability proxy
  let moisturePct;
  if(avgET0 !== null && avgPrecip !== null && avgET0 > 0){
    const deficit = Math.max(0, avgET0 - avgPrecip);
    moisturePct = Math.min(100, Math.round(deficit / avgET0 * 100));
  } else {
    // Fallback: low rain probability = high moisture stress
    moisturePct = Math.min(100, Math.max(0, Math.round(100 - avgRainProb)));
  }

  // Irrigation need: high temp + low humidity + moisture stress
  const irrigPct = Math.min(100, Math.max(0, Math.round(heatPct*0.45 + (100-avgHumid)*0.3 + moisturePct*0.25)));

  // Crop growth suitability: penalises for heat and moisture stress
  const cropPct = Math.min(100, Math.max(0, Math.round(100 - heatPct*0.45 - moisturePct*0.35 + avgHumid*0.15 - 10)));

  // Overall risk = weighted average of heat and moisture stress
  const riskPct    = Math.round(heatPct*0.55 + moisturePct*0.45);
  const hazardPct  = Math.min(100, Math.round(heatPct*0.65 + Math.min(100,avgWind/50*100)*0.35));

  return {avgTemp, avgHumid, avgRainProb, heatPct, moisturePct, irrigPct, cropPct, riskPct, hazardPct, avgET0, avgPrecip};
}

function getCropOutlook(m){
  // Cotton: heat-tolerant, moderately drought-tolerant
  const cotton = m.heatPct>80&&m.moisturePct>80?'Concerning':m.heatPct>70?'Moderate':'Good';
  // Corn: stressed above 95°F and under moisture deficit
  const corn = m.avgTemp>95?'Concerning':m.moisturePct>70?'Moderate':'Good';
  // Sorghum: most drought-tolerant Texas crop
  const sorghum = m.moisturePct>85?'Moderate':'Good';
  // Peanuts: need consistent moisture, dislike extreme heat
  const peanuts = m.moisturePct>65?'Concerning':m.avgTemp>100?'Moderate':'Good';
  // Sunflower: drought-tolerant
  const sunflower = m.moisturePct>80?'Moderate':'Good';
  // Vegetables: need moisture and moderate temps
  const veggies = m.avgTemp>100?'Concerning':m.moisturePct>75?'Moderate':'Good';
  // Pasture: most sensitive to dry spells
  const pasture = m.moisturePct>75?'Severe':m.moisturePct>55?'Concerning':'Moderate';
  // Rangelands: drought-sensitive
  const range = m.moisturePct>65?'Concerning':m.moisturePct>45?'Moderate':'Good';

  const statusColor = s=>({Good:'#2ECC8B',Excellent:'#2ECC8B',Moderate:'#F5A623',Concerning:'#F5A623',Severe:'#D64545',Critical:'#D64545'}[s]||'#F5A623');
  return [
    {crop:'🌾 Cotton',   status:cotton},  {crop:'🌽 Corn',     status:corn},
    {crop:'🌿 Sorghum',  status:sorghum}, {crop:'🥜 Peanuts',  status:peanuts},
    {crop:'🌻 Sunflower',status:sunflower},{crop:'🍅 Vegetables',status:veggies},
    {crop:'🐄 Pasture',  status:pasture}, {crop:'🌵 Rangelands',status:range}
  ].map(c=>({...c, color:statusColor(c.status)}));
}

function renderAg(){
  if(!dataLoaded || !Object.keys(WEATHER_DATA).length){
    document.getElementById('agContent').innerHTML='<div class="card loading-shimmer" style="height:200px"></div>';
    return;
  }

  const m = computeAgMetrics();
  if(!m) return;

  const heatLabel    = m.heatPct>80?'Extreme':m.heatPct>60?'High':m.heatPct>35?'Moderate–High':'Low–Moderate';
  const moistLabel   = m.moisturePct>75?'Severe':m.moisturePct>50?'Concerning':m.moisturePct>25?'Moderate':'Low';
  const irrigLabel   = m.irrigPct>75?'Very High':m.irrigPct>50?'High':m.irrigPct>25?'Moderate':'Low';
  const cropLabel    = m.cropPct>70?'Favorable':m.cropPct>50?'Moderate':'Challenging';
  const riskLabel    = m.riskPct>70?'Elevated':m.riskPct>40?'Moderate':'Low';
  const hazardLabel  = m.hazardPct>60?'Severe':m.hazardPct>40?'Moderate':'Low';

  const agItems = [
    {label:'Heat Stress Risk',         value:heatLabel,  pct:m.heatPct,    color:'#F5A623'},
    {label:'Moisture Stress Level',    value:moistLabel,  pct:m.moisturePct,color:'#D64545'},
    {label:'Irrigation Need',          value:irrigLabel,  pct:m.irrigPct,   color:'#4A90E2'},
    {label:'Crop Growth Suitability',  value:cropLabel,   pct:m.cropPct,    color:'#2ECC8B'},
    {label:'Agricultural Risk Index',  value:riskLabel,   pct:m.riskPct,    color:'#F5A623'},
    {label:'Weather Hazard',           value:hazardLabel, pct:m.hazardPct,  color:'#F5A623'}
  ];

  const crops = getCropOutlook(m);

  // Best city for growing — lowest heat + highest forecast rain
  const cityScores = Object.entries(WEATHER_DATA).map(([name,d])=>{
    const days = FORECAST_DATA[name] || [];
    const rainProb = days.length ? days.reduce((s,f)=>s+f.rain,0)/days.length : 0;
    return {name, score:(100-d.temp)*0.5 + rainProb*0.3 + d.humidity*0.2};
  }).sort((a,b)=>b.score-a.score);
  const bestCity = cityScores[0]?.name || '—';

  // Dry forecast percentage
  const dryPct = Math.round(100 - m.avgRainProb);
  const irrigIdx = (m.irrigPct/10).toFixed(1);

  // ET0 info line
  const et0Line = m.avgET0 !== null
    ? `Avg ET₀: <strong>${m.avgET0} mm/day</strong> · Avg precip: <strong>${m.avgPrecip ?? '—'} mm/day</strong>`
    : `Avg 7-day rain probability: <strong>${Math.round(m.avgRainProb)}%</strong>`;

  document.getElementById('agContent').innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      ${dataBadge('live-drv')}
      <span style="font-size:10px;color:var(--text3)">Indices derived from live Open-Meteo weather data — <strong>not official USDA or AgriLife farming advice.</strong>
        For official drought status: <a href="https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?TX" target="_blank" rel="noopener" style="color:#4A90E2">droughtmonitor.unl.edu →</a></span>
    </div>
    <div class="grid-2" style="margin-bottom:16px">
      <div class="card">
        <h3 class="section-title">Agronomic Conditions ${dataBadge('live-drv')}</h3>
        <div style="font-size:10px;color:var(--text3);margin-bottom:10px">${et0Line} · Avg temp: <strong>${Math.round(m.avgTemp)}°F</strong></div>
        ${agItems.map(a=>`
          <div class="ag-status">
            <div class="ag-label">${escapeHtml(a.label)}</div>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:80px">
                <div class="progress-bar" role="meter" aria-valuenow="${a.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(a.label)}: ${a.pct}%">
                  <div class="progress-fill" style="width:${a.pct}%;background:${a.color}"></div>
                </div>
              </div>
              <span class="badge" style="background:${a.color}22;color:${a.color}">${escapeHtml(a.value)}</span>
            </div>
          </div>`).join('')}
      </div>
      <div>
        <div class="card card-danger" style="margin-bottom:12px">
          <div class="stat-label">7-Day Dry Forecast</div>
          <div class="stat-value" style="color:#E87A7A">${dryPct}<span class="stat-unit">%</span></div>
          <div class="stat-sub">Avg chance of no measurable rain across cities</div>
          <div style="margin-top:10px">
            <div class="progress-bar" role="meter" aria-valuenow="${dryPct}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-fill" style="width:${dryPct}%;background:#D64545"></div>
            </div>
          </div>
        </div>
        <div class="card card-orange" style="margin-bottom:12px">
          <div class="stat-label">Irrigation Demand Index</div>
          <div class="stat-value" style="color:#F8C06A">${irrigIdx}<span class="stat-unit">/10</span></div>
          <div class="stat-sub">Based on temperature, humidity &amp; ET₀ deficit</div>
        </div>
        <div class="card card-success">
          <div class="stat-label">Best Growing Conditions</div>
          <div class="stat-value" style="font-size:18px;color:#5DDBA8">${escapeHtml(bestCity)}</div>
          <div class="stat-sub">Lowest heat stress + highest rain probability</div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">Crop-by-Crop Outlook ${dataBadge('live-drv')}</h3>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px">
        ${crops.map(c=>{
          const [emoji,...name]=c.crop.split(' ');
          return `<div class="card" style="text-align:center;padding:12px">
            <div style="font-size:22px;margin-bottom:6px" aria-hidden="true">${emoji}</div>
            <div style="font-size:11px;color:var(--text1);margin-bottom:6px">${name.join(' ')}</div>
            <span class="badge" style="background:${c.color}22;color:${c.color}">${escapeHtml(c.status)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="card card-blue">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div class="insight-tag">📊 Methodology</div>${dataBadge('live-drv')}</div>
      <div class="insight-text">All indices are <strong>weather-derived estimates</strong> computed from live Open-Meteo data — not official USDA crop reports or certified agronomic assessments. current temperatures, relative humidity, and 7-day ET₀ (evapotranspiration) vs precipitation_sum. ET₀ is the FAO-56 Penman–Monteith reference rate — the agronomic standard for irrigation scheduling and drought assessment. For official Texas drought designation: <a href="https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?TX" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">droughtmonitor.unl.edu →</a> · For USDA crop reports: <a href="https://www.nass.usda.gov/Statistics_by_State/Texas/" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">nass.usda.gov →</a></div>
    </div>`;
}
