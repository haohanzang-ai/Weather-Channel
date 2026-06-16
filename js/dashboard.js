'use strict';

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard(){
  renderDataStatus();
  const vals = Object.values(WEATHER_DATA);
  const avgTemp = Math.round(vals.reduce((a,c)=>a+c.temp,0)/vals.length);
  const hottest = Object.entries(WEATHER_DATA).sort((a,b)=>b[1].temp-a[1].temp)[0];
  const coolest = Object.entries(WEATHER_DATA).sort((a,b)=>a[1].temp-b[1].temp)[0];
  const highHumid = Object.entries(WEATHER_DATA).sort((a,b)=>b[1].humidity-a[1].humidity)[0];

  document.getElementById('stateStats').innerHTML=`
    <div class="card card-blue" role="listitem"><div class="stat-label">Avg State Temp</div><div class="stat-value">${avgTemp}<span class="stat-unit">°F</span></div><div class="stat-sub">Statewide average</div></div>
    <div class="card card-orange" role="listitem"><div class="stat-label">Hottest City</div><div class="stat-value" style="font-size:18px;color:#E87A7A">${escapeHtml(hottest[0])}</div><div class="stat-sub">${hottest[1].temp}°F · ${escapeHtml(hottest[1].condition)}</div></div>
    <div class="card" role="listitem"><div class="stat-label">Coolest City</div><div class="stat-value" style="font-size:18px;color:#7DB9F2">${escapeHtml(coolest[0])}</div><div class="stat-sub">${coolest[1].temp}°F · ${escapeHtml(coolest[1].condition)}</div></div>
    <div class="card" role="listitem"><div class="stat-label">Highest Humidity</div><div class="stat-value">${highHumid[1].humidity}<span class="stat-unit">%</span></div><div class="stat-sub">${escapeHtml(highHumid[0])}</div></div>
  `;

  const wg = document.getElementById('weatherGrid');
  wg.innerHTML = '';
  Object.entries(WEATHER_DATA).forEach(([city, d])=>{
    const btn = document.createElement('button');
    btn.className = 'weather-card' + (selectedCity===city?' selected':'');
    btn.setAttribute('role','listitem');
    btn.setAttribute('aria-label', `${city}: ${d.temp}°F, feels like ${d.feels}°F, ${d.condition}, humidity ${d.humidity}%`);
    btn.setAttribute('aria-pressed', String(selectedCity===city));
    btn.addEventListener('click', ()=> selectCity(city));
    btn.innerHTML = `
      <div class="city-name">${escapeHtml(city)}</div>
      <div class="weather-icon" aria-hidden="true">${d.icon}</div>
      <div class="temp-big" aria-hidden="true">${d.temp}°</div>
      <div class="temp-feels">Feels ${d.feels}°F</div>
      <div class="weather-detail" aria-hidden="true">
        <span>💧 ${d.humidity}%</span>
        <span>💨 ${d.wind} mph</span>
      </div>
      <div style="margin-top:10px">
        <span class="badge" style="background:${getTempColor(d.temp)}22;color:${getTempColor(d.temp)}">${escapeHtml(d.condition)}</span>
      </div>
    `;
    wg.appendChild(btn);
  });

  // ── Sample alerts — NOT live NWS data. Visit Severe Weather tab for real alerts.
  document.getElementById('alertsPanel').innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span class="data-badge badge-demo-fb">Demo / Fallback</span>
      <span style="font-size:10px;color:var(--text3)">Sample alerts — not from NWS. <button class="btn-sm" style="font-size:9px;padding:3px 8px" onclick="showPage('severe')">Live alerts →</button></span>
    </div>
    <div class="alert-banner" role="note" style="opacity:0.7"><span aria-hidden="true">⚠</span> <strong>Heat Advisory</strong> (sample) — West Texas. Temps 100–108°F.</div>
    <div class="info-banner" role="note" style="opacity:0.7"><span aria-hidden="true">⚡</span> <strong>Thunderstorm Watch</strong> (sample) — Houston metro.</div>
    <div class="info-banner" role="note" style="opacity:0.7"><span aria-hidden="true">💨</span> <strong>Wind Advisory</strong> (sample) — Lubbock &amp; Panhandle.</div>
    <div style="font-size:10px;color:var(--text3);margin-top:8px">Visit the <button class="btn-sm" style="font-size:9px;padding:3px 8px" onclick="showPage('severe')">Severe Weather tab</button> for live NWS alerts.</div>
  `;

  // ── AI Summary — derived from live weather data; not a live AI service
  document.getElementById('insightPanel').innerHTML=`
    <div class="insight-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div class="insight-tag">Daily Weather Summary</div>
        <span class="data-badge badge-live-drv">Live-Derived</span>
      </div>
      <div class="insight-text">This summary is generated from live Open-Meteo weather values — not a live AI service. View the <button class="btn-sm" style="font-size:9px;padding:3px 8px" onclick="showPage('reports')">AI Reports tab</button> for a full data-derived briefing.</div>
    </div>
    <div class="insight-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div class="insight-tag">Energy Outlook</div>
        <span class="data-badge badge-demo-fb">Demo / Fallback</span>
      </div>
      <div class="insight-text">ERCOT real-time grid demand requires direct ERCOT API access. Live grid figures are linked in the <button class="btn-sm" style="font-size:9px;padding:3px 8px" onclick="showPage('energy')">Energy tab</button>. No hardcoded GW values are shown here.</div>
    </div>
  `;
}

// ── Data Status Panel ─────────────────────────────────────────────────────────
function renderDataStatus(){
  const panel = document.getElementById('dataStatusPanel');
  if (!panel) return;

  const dot  = s => `<span class="${s==='ok'?'ds-ok':s==='fail'?'ds-fail':'ds-pend'}"></span>`;
  const word = s => s==='ok'?'Connected':s==='fail'?'Failed':'Pending';

  const lastStr = API_STATUS.lastUpdate
    ? new Date(API_STATUS.lastUpdate).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
    : '—';

  const demoWarn = API_STATUS.hasDemoData
    ? '<span class="ds-demo-warn">⚠ Some demo data active</span>'
    : '';

  panel.innerHTML = `
    <span class="ds-label">API Status:</span>
    <span class="ds-item">${dot(API_STATUS.weather)}Weather: ${word(API_STATUS.weather)}</span>
    <span class="ds-sep">·</span>
    <span class="ds-item">${dot(API_STATUS.aqi)}AQI: ${word(API_STATUS.aqi)}</span>
    <span class="ds-sep">·</span>
    <span class="ds-item">${dot(API_STATUS.nws)}NWS Alerts: ${API_STATUS.nws==='pending'?'<span style="color:var(--text3)">visit Severe tab</span>':word(API_STATUS.nws)}</span>
    <span class="ds-sep">·</span>
    <span class="ds-item">Last updated: <strong>${lastStr}</strong></span>
    ${demoWarn}
  `;
}

// ── City selection ────────────────────────────────────────────────────────────
function selectCity(city){
  selectedCity = city;
  showPage('map');
}
