'use strict';

// ── Map ───────────────────────────────────────────────────────────────────────
function renderMap(){
  const markers = document.getElementById('cityMarkers');
  markers.innerHTML = '';
  CITIES.forEach(c=>{
    const d = WEATHER_DATA[c.name];
    if(!d) return;
    const col = getTempColor(d.temp);
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','city-dot');
    g.setAttribute('tabindex','0');
    g.setAttribute('role','button');
    g.setAttribute('aria-label',`${c.name}: ${d.temp}°F, ${d.condition}`);
    g.innerHTML = `
      <circle cx="${c.x}" cy="${c.y}" r="8" fill="${col}" opacity="0.9" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
      <text x="${c.x}" y="${c.y-13}" fill="rgba(255,255,255,0.92)" font-size="8" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" aria-hidden="true">${escapeHtml(c.name)}</text>
      <text x="${c.x}" y="${c.y+4}" fill="#fff" font-size="7" text-anchor="middle" font-weight="700" font-family="Inter,sans-serif" aria-hidden="true">${d.temp}°</text>
    `;
    g.addEventListener('mouseenter', e => showTooltip(e, c, d));
    g.addEventListener('mouseleave', hideTooltip);
    g.addEventListener('click', ()=> showCityDetail(c.name));
    g.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); showCityDetail(c.name); }});
    markers.appendChild(g);
  });
  mapRendered = true;
  if(selectedCity) showCityDetail(selectedCity);
}

function showTooltip(e, c, d){
  const tt = document.getElementById('mapTooltip');
  const rect = document.getElementById('texasSVG').getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  tt.style.display = 'block';
  tt.removeAttribute('aria-hidden');
  tt.style.left = (x + 14) + 'px';
  tt.style.top  = (y - 24) + 'px';
  tt.innerHTML = `<strong style="font-size:12px">${escapeHtml(c.name)}</strong><br><span style="font-size:13px" aria-hidden="true">${d.icon}</span> ${d.temp}°F · ${escapeHtml(d.condition)}<br><span style="color:var(--text2)">💧 ${d.humidity}% &nbsp;💨 ${d.wind} mph</span>`;
}
function hideTooltip(){
  const tt = document.getElementById('mapTooltip');
  tt.style.display = 'none';
  tt.setAttribute('aria-hidden','true');
}

function showCityDetail(cityName){
  const d = WEATHER_DATA[cityName];
  if(!d) return;
  document.getElementById('cityDetail').style.display = 'block';
  document.getElementById('cityDetailContent').innerHTML=`
    <div class="grid-4" style="margin-bottom:14px">
      <div class="card card-orange"><div class="stat-label">Temperature</div><div class="stat-value">${d.temp}<span class="stat-unit">°F</span></div></div>
      <div class="card"><div class="stat-label">Feels Like</div><div class="stat-value">${d.feels}<span class="stat-unit">°F</span></div></div>
      <div class="card"><div class="stat-label">Humidity</div><div class="stat-value">${d.humidity}<span class="stat-unit">%</span></div></div>
      <div class="card"><div class="stat-label">Wind Speed</div><div class="stat-value">${d.wind}<span class="stat-unit">mph</span></div></div>
    </div>
    <div class="grid-4">
      <div class="card"><div class="stat-label">Pressure</div><div class="stat-value" style="font-size:18px">${d.pressure}<span class="stat-unit">hPa</span></div></div>
      <div class="card"><div class="stat-label">Visibility</div><div class="stat-value" style="font-size:18px">${d.visibility}<span class="stat-unit">mi</span></div></div>
      <div class="card"><div class="stat-label">UV Index</div><div class="stat-value" style="font-size:18px;color:${d.uv>=8?'#E87A7A':'#F8C06A'}">${d.uv}</div></div>
      <div class="card"><div class="stat-label">AQI</div><div class="stat-value" style="font-size:18px;color:${getAQILabel(d.aqi).color}">${d.aqi}</div></div>
    </div>
    <div style="margin-top:14px">
      <h3 class="section-title">7-Day Forecast — ${escapeHtml(cityName)}</h3>
      ${Object.entries(FORECAST_DATA).map(([day,f])=>`
        <div class="forecast-row">
          <div class="forecast-day">${escapeHtml(day)}</div>
          <div class="forecast-icon" aria-hidden="true">${f.icon}</div>
          <div style="flex:1;padding:0 12px">
            <div class="progress-bar" role="meter" aria-valuenow="${f.rain}" aria-valuemin="0" aria-valuemax="100" aria-label="${f.rain}% precipitation chance">
              <div class="progress-fill" style="width:${f.rain}%;background:#4A90E2"></div>
            </div>
            <div style="font-size:9px;color:var(--text3);margin-top:3px">Rain: ${f.rain}%</div>
          </div>
          <div class="forecast-temps"><span class="forecast-hi">${f.hi}°</span><span class="forecast-lo">${f.lo}°</span></div>
        </div>
      `).join('')}
    </div>
  `;
}
