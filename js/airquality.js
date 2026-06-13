'use strict';

// ── Air Quality — Live data, all labels computed dynamically ──────────────────
function renderAQ(){
  if(!dataLoaded || !Object.keys(WEATHER_DATA).length){
    document.getElementById('aqContent').innerHTML = '<div class="card loading-shimmer" style="height:200px"></div>';
    return;
  }

  const entries  = Object.entries(WEATHER_DATA).sort((a,b)=>b[1].aqi-a[1].aqi);
  const vals     = entries.map(([,d])=>d.aqi);
  const minAQI   = Math.min(...vals);
  const maxAQI   = Math.max(...vals);
  const avgAQI   = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  const bestCity  = entries[entries.length-1][0];
  const worstCity = entries[0][0];
  const goodCount = vals.filter(v=>v<=50).length;
  const bestQ     = getAQILabel(minAQI);
  const worstQ    = getAQILabel(maxAQI);

  // Health guidance — fully dynamic
  let guidance;
  if(maxAQI > 150)
    guidance = `<strong style="color:#E87A7A">Unhealthy air in ${escapeHtml(worstCity)} (AQI ${maxAQI}).</strong> Everyone should avoid prolonged outdoor activity. Sensitive groups must stay indoors.`;
  else if(maxAQI > 100)
    guidance = `Air quality in <strong>${escapeHtml(worstCity)}</strong> is unhealthy for sensitive groups (AQI ${maxAQI}). People with asthma, heart conditions, or the elderly should limit prolonged outdoor exertion.`;
  else if(avgAQI > 50)
    guidance = `Air quality is acceptable across Texas (avg AQI ${avgAQI}). Unusually sensitive individuals may experience mild effects. Most outdoor activities are fine.`;
  else
    guidance = `Air quality is <strong style="color:#5DDBA8">Good</strong> across all monitored Texas cities (avg AQI ${avgAQI}). No restrictions recommended — safe for all outdoor activities.`;

  document.getElementById('aqContent').innerHTML = `
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card"><div class="stat-label">Best AQI</div><div class="stat-value" style="color:${bestQ.color}">${minAQI}</div><div class="stat-sub">${escapeHtml(bestCity)}</div></div>
      <div class="card"><div class="stat-label">Worst AQI</div><div class="stat-value" style="color:${worstQ.color}">${maxAQI}</div><div class="stat-sub">${escapeHtml(worstCity)}</div></div>
      <div class="card"><div class="stat-label">Statewide Avg</div><div class="stat-value">${avgAQI}</div><div class="stat-sub">${escapeHtml(getAQILabel(avgAQI).label)}</div></div>
      <div class="card card-success"><div class="stat-label">Good AQI Cities</div><div class="stat-value" style="color:#5DDBA8">${goodCount}</div><div class="stat-sub">AQI ≤ 50 of ${vals.length}</div></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">US AQI by City — Live (Open-Meteo Air Quality API)</h3>
      ${entries.map(([city,d])=>{
        const q=getAQILabel(d.aqi);
        return `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)">
          <div style="width:110px;font-size:11px;color:var(--text1)">${escapeHtml(city)}</div>
          <div style="flex:1">
            <div class="progress-bar" role="meter" aria-valuenow="${d.aqi}" aria-valuemin="0" aria-valuemax="200" aria-label="${escapeHtml(city)} AQI: ${d.aqi}">
              <div class="progress-fill" style="width:${Math.min(100,d.aqi/2)}%;background:${q.color}"></div>
            </div>
          </div>
          <div style="width:46px;font-size:13px;font-weight:700;color:${q.color};font-family:var(--mono);text-align:right">${d.aqi}</div>
          <span class="badge" style="background:${q.color}22;color:${q.color};width:110px;justify-content:center">${escapeHtml(q.label)}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="card card-blue">
      <div class="insight-tag">Health Guidance — Live</div>
      <div class="insight-text">${guidance} Data: Open-Meteo Air Quality API. Last updated ${new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}.</div>
    </div>`;
}
