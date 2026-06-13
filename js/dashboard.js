'use strict';

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard(){
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

  document.getElementById('alertsPanel').innerHTML=`
    <div class="alert-banner" role="alert"><span aria-hidden="true">⚠</span> <strong>Heat Advisory</strong> — West Texas through Friday. Temps 100–108°F.</div>
    <div class="info-banner" role="note"><span aria-hidden="true">⚡</span> <strong>Thunderstorm Watch</strong> — Houston metro, expires 10 PM CDT.</div>
    <div class="info-banner" role="note"><span aria-hidden="true">💨</span> <strong>Wind Advisory</strong> — Lubbock &amp; Panhandle. Gusts to 45 mph.</div>
  `;

  document.getElementById('insightPanel').innerHTML=`
    <div class="insight-card"><div class="insight-tag">Daily Intelligence Digest</div><div class="insight-text">West Texas continues extreme heat with El Paso reaching 101°F — well above seasonal averages. Central Texas faces elevated drought stress risk with soil moisture deficits widening.</div></div>
    <div class="insight-card"><div class="insight-tag">Agriculture Alert</div><div class="insight-text">Irrigation demand is high across South and Central Texas. Heat stress risk for corn and sorghum crops is elevated in the Rio Grande Valley. Producers should monitor overnight lows closely.</div></div>
    <div class="insight-card"><div class="insight-tag">Energy Outlook</div><div class="insight-text">ERCOT grid demand expected to peak at 78.4 GW this afternoon. Conservation encouraged 4–9 PM. Renewable generation covering approximately 42% of current load.</div></div>
  `;
}

// ── City selection ────────────────────────────────────────────────────────────
function selectCity(city){
  selectedCity = city;
  showPage('map');
}
