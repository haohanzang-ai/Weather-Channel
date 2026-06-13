'use strict';

// ── Air Quality ───────────────────────────────────────────────────────────────
function renderAQ(){
  const aqiEntries = Object.entries(WEATHER_DATA).sort((a,b)=>b[1].aqi-a[1].aqi);
  const aqiVals = Object.values(WEATHER_DATA).map(d=>d.aqi);
  document.getElementById('aqContent').innerHTML=`
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card"><div class="stat-label">Best AQI</div><div class="stat-value" style="color:#5DDBA8">${Math.min(...aqiVals)}</div><div class="stat-sub">Corpus Christi</div></div>
      <div class="card"><div class="stat-label">Worst AQI</div><div class="stat-value" style="color:#F8C06A">${Math.max(...aqiVals)}</div><div class="stat-sub">Houston</div></div>
      <div class="card"><div class="stat-label">State Avg AQI</div><div class="stat-value">${Math.round(aqiVals.reduce((a,b)=>a+b,0)/aqiVals.length)}</div><div class="stat-sub">Moderate</div></div>
      <div class="card card-success"><div class="stat-label">Cities Good AQI</div><div class="stat-value" style="color:#5DDBA8">7</div><div class="stat-sub">AQI ≤ 50</div></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">AQI by City</h3>
      ${aqiEntries.map(([city,d])=>{const q=getAQILabel(d.aqi);return`
        <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)">
          <div style="width:100px;font-size:11px;color:var(--text1)">${escapeHtml(city)}</div>
          <div style="flex:1"><div class="progress-bar" role="meter" aria-valuenow="${d.aqi}" aria-valuemin="0" aria-valuemax="200" aria-label="${escapeHtml(city)} AQI: ${d.aqi}"><div class="progress-fill" style="width:${d.aqi/2}%;background:${q.color}"></div></div></div>
          <div style="width:46px;font-size:12px;font-weight:700;color:${q.color};font-family:var(--mono);text-align:right">${d.aqi}</div>
          <span class="badge" style="background:${q.color}22;color:${q.color};width:100px;justify-content:center">${q.label}</span>
        </div>
      `}).join('')}
    </div>
    <div class="card card-blue"><div class="insight-tag">Health Guidance</div><div class="insight-text">Air quality across most Texas cities is in the <strong style="color:#5DDBA8">Good to Moderate</strong> range. Houston reports the highest AQI at 68 — sensitive groups (asthma, heart conditions) should limit prolonged outdoor exertion.</div></div>
  `;
}
