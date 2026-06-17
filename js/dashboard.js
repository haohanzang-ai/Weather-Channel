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

  // ── Live NWS alerts — fetch from api.weather.gov; no sample/fake content shown
  document.getElementById('alertsPanel').innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;padding:8px 0">
      <span class="ds-pend"></span>
      <span style="font-size:11px;color:var(--text3)">Loading NWS alerts…</span>
    </div>`;
  _fetchDashboardAlerts();

  // ── Live-derived summary — computed from real WEATHER_DATA, no hardcoded values
  const sorted = Object.entries(WEATHER_DATA).sort((a,b)=>b[1].temp-a[1].temp);
  const dvAvgTemp = Math.round(sorted.reduce((s,[,d])=>s+d.temp,0)/sorted.length);
  const dvAvgHumid = Math.round(sorted.reduce((s,[,d])=>s+d.humidity,0)/sorted.length);
  const dvHeatLevel = dvAvgTemp>=105?'dangerous heat':dvAvgTemp>=100?'extreme heat':dvAvgTemp>=95?'significant heat stress':dvAvgTemp>=85?'elevated heat':'moderate conditions';
  const dvHeatColor = dvAvgTemp>=100?'#D64545':dvAvgTemp>=90?'#F5A623':'#5DDBA8';
  const _aqiVals = Object.values(WEATHER_DATA).map(d=>d.aqi).filter(v=>v!=null);
  const dvAvgAQI = _aqiVals.length ? Math.round(_aqiVals.reduce((s,v)=>s+v,0)/_aqiVals.length) : null;
  const dvAQIInfo = dvAvgAQI!=null && typeof getAQILabel==='function' ? getAQILabel(dvAvgAQI) : {label:'Unavailable'};
  const dvAvgCDI = Math.round(Object.values(WEATHER_DATA).reduce((s,d)=>s+Math.max(0,d.temp-65)*0.8,0)/Object.values(WEATHER_DATA).length);
  const dvGridPres = dvAvgCDI>30?'High':dvAvgCDI>18?'Moderate':'Low';
  const dvGridColor = dvAvgCDI>30?'#D64545':dvAvgCDI>18?'#F5A623':'#5DDBA8';
  const dvNow = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});

  document.getElementById('insightPanel').innerHTML=`
    <div class="insight-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div class="insight-tag">📊 Texas Weather Summary — ${dvNow}</div>
        ${dataBadge('live-drv')}
      </div>
      <div class="insight-text">Statewide avg: <strong>${dvAvgTemp}°F</strong> · <span style="color:${dvHeatColor}">${dvHeatLevel}</span> · avg humidity <strong>${dvAvgHumid}%</strong>.
      Hottest: <strong>${escapeHtml(sorted[0][0])}</strong> at <strong>${sorted[0][1].temp}°F</strong> (${escapeHtml(sorted[0][1].condition)}).
      Coolest: <strong>${escapeHtml(sorted[sorted.length-1][0])}</strong> at <strong>${sorted[sorted.length-1][1].temp}°F</strong>.
      <button class="btn-sm" style="font-size:9px;padding:3px 8px;margin-left:4px" onclick="showPage('reports')">Full report →</button></div>
    </div>
    <div class="insight-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div class="insight-tag">⚡ Energy Demand Estimate</div>
        ${dataBadge('live-drv')}
      </div>
      <div class="insight-text">Cooling Demand Index: <strong>${dvAvgCDI}</strong> · Grid pressure: <strong style="color:${dvGridColor}">${dvGridPres}</strong>.
      Calculated from live temps — not ERCOT data.
      <button class="btn-sm" style="font-size:9px;padding:3px 8px;margin-left:4px" onclick="showPage('energy')">Energy tab →</button></div>
    </div>
    <div class="insight-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div class="insight-tag">💨 Air Quality</div>
        ${dataBadge('live-api')}
      </div>
      <div class="insight-text">${dvAvgAQI!=null
        ? `Statewide avg AQI: <strong>${dvAvgAQI}</strong> — <strong>${escapeHtml(dvAQIInfo.label)}</strong>. ${dvAvgAQI<=50?'Good — safe for all outdoor activities.':dvAvgAQI<=100?'Moderate — sensitive individuals should take care.':'Unhealthy for sensitive groups in some areas.'}`
        : 'AQI data unavailable — Open-Meteo AQI API did not return data.'}</div>
    </div>
  `;
}

// ── Live NWS mini-fetch for dashboard alerts panel ────────────────────────────
async function _fetchDashboardAlerts(){
  const panel = document.getElementById('alertsPanel');
  if (!panel) return;
  try {
    const res = await fetch('https://api.weather.gov/alerts/active?area=TX', {
      headers:{'Accept':'application/geo+json','User-Agent':'TexasClimate/1.0'}
    });
    if (!res.ok) throw new Error(`NWS ${res.status}`);
    const data = await res.json();
    const alerts = data.features || [];
    API_STATUS.nws = 'ok';
    if (typeof renderDataStatus === 'function') renderDataStatus();

    const top = alerts.filter(a=>['Extreme','Severe','Moderate'].includes(a.properties?.severity)).slice(0,3);
    const escEvt  = a => escapeHtml(a.properties.event||'Alert');
    const escArea = a => escapeHtml((a.properties.areaDesc||'').split(';')[0].trim());

    if (alerts.length === 0) {
      panel.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${dataBadge('live-api')}
          <span style="font-size:10px;color:var(--text3)">NWS — Live Texas alerts</span>
        </div>
        <div class="alert-banner" style="background:rgba(46,204,139,0.1);border-color:#2ECC8B;color:#5DDBA8" role="status">
          <span aria-hidden="true">✅</span> <strong>No Active Alerts</strong> — Texas conditions are currently calm.
          <button class="btn-sm" style="font-size:9px;padding:3px 8px;margin-left:8px" onclick="showPage('severe')">Full details →</button>
        </div>`;
    } else {
      panel.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          ${dataBadge('live-api')}
          <span style="font-size:10px;color:var(--text3)"><strong>${alerts.length}</strong> active TX alert${alerts.length!==1?'s':''} · NWS api.weather.gov</span>
          <button class="btn-sm" style="font-size:9px;padding:3px 8px" onclick="showPage('severe')">View all →</button>
        </div>
        ${top.map(a=>{
          const sev = a.properties.severity;
          const cls = sev==='Extreme'||sev==='Severe'?'alert-banner':'info-banner';
          const icon = sev==='Extreme'||sev==='Severe'?'⚠️':'ℹ️';
          return `<div class="${cls}" role="alert"><span aria-hidden="true">${icon}</span> <strong>${escEvt(a)}</strong> — ${escArea(a)}</div>`;
        }).join('')}
        ${alerts.length>top.length?`<div style="font-size:10px;color:var(--text3);margin-top:6px">+${alerts.length-top.length} more — <button class="btn-sm" style="font-size:9px;padding:3px 8px" onclick="showPage('severe')">See all in Severe tab →</button></div>`:''}`;
    }
  } catch(e) {
    API_STATUS.nws = 'fail';
    if (typeof renderDataStatus === 'function') renderDataStatus();
    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        ${dataBadge('na')}
        <span style="font-size:10px;color:var(--text3)">NWS API unavailable</span>
      </div>
      <div class="card card-danger" style="margin:0">
        <div class="insight-text">Could not reach the National Weather Service — no alert data shown. Do not assume conditions are calm.
        <a href="https://alerts.weather.gov" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">Check alerts.weather.gov →</a>
        &nbsp;·&nbsp; <button class="btn-sm" style="font-size:9px;padding:3px 8px" onclick="showPage('severe')">Severe tab →</button>
        </div>
      </div>`;
  }
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
    <span class="ds-item">${dot(API_STATUS.nws)}NWS Alerts: ${API_STATUS.nws==='pending'?'<span style="color:var(--text3)">loading…</span>':word(API_STATUS.nws)}</span>
    <span class="ds-sep">·</span>
    <span class="ds-item"><span style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.25);display:inline-block;flex-shrink:0"></span>ERCOT: Not integrated</span>
    <span class="ds-sep">·</span>
    <span class="ds-item"><span class="ds-ok"></span>Water: Official links</span>
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
