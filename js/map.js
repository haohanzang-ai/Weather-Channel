'use strict';

// Geographic projection constants — Texas bounds
const _MAP_LON_W = -106.65, _MAP_LON_E = -93.51;
const _MAP_LAT_N = 36.50,   _MAP_LAT_S = 25.84;
const _MAP_W = 580,          _MAP_H = 490;

// Simplified Texas border polygon (clockwise from NW panhandle)
// Points computed from real lat/lon via _mapProject()
const _TEXAS_PATH = [
  'M 159 0',    // NW panhandle (-103.04, 36.50)
  'L 294 0',    // NE panhandle top (-100.00, 36.50)
  'L 294 101',  // NE panhandle bottom (-100.00, 34.31)
  // Oklahoma border / Red River (east)
  'L 325 109', 'L 360 109', 'L 400 115', 'L 435 120',
  'L 493 124', 'L 524 127', 'L 554 135',
  // NE corner & Sabine River (south)
  'L 556 156', 'L 558 253', 'L 567 311',
  // Gulf Coast (west/southwest)
  'L 566 314', 'L 554 322', 'L 524 329', 'L 502 340',
  'L 471 356', 'L 435 372', 'L 424 399', 'L 409 412',
  'L 400 473',
  // Brownsville tip
  'L 420 490',
  // Rio Grande (northwest to El Paso)
  'L 418 483', 'L 382 460', 'L 347 441',
  'L 315 414',  // Laredo
  'L 272 358',  // Eagle Pass
  'L 254 328',  // Del Rio
  'L 250 314',
  'L 228 293', 'L 188 276',
  // Big Bend
  'L 170 308', 'L 161 333',
  'L 139 322', 'L 117 319',
  'L 95 285',  'L 79 252',
  'L 51 230',  'L 16 218',
  'L 0 217',    // El Paso
  // NM border north
  'L 159 207',  // NM-TX corner (-103.04, 32.00)
  'Z'
].join(' ');

// Active weather overlay layers
const _mapLayers = { rain: true, clouds: true, severe: true, drought: true };

function _mapProject(lat, lon) {
  const x = (lon - _MAP_LON_W) / (_MAP_LON_E - _MAP_LON_W) * _MAP_W;
  const y = (_MAP_LAT_N - lat) / (_MAP_LAT_N - _MAP_LAT_S) * _MAP_H;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

function mapToggleLayer(layer) {
  _mapLayers[layer] = !_mapLayers[layer];
  const btn = document.querySelector(`.map-layer-btn[data-layer="${layer}"]`);
  if (btn) btn.classList.toggle('active', _mapLayers[layer]);
  _mapRenderOverlays();
}

// ── Main render ───────────────────────────────────────────────────────────────
function renderMap() {
  const outline = document.getElementById('texasOutline');
  if (outline) outline.setAttribute('d', _TEXAS_PATH);
  _mapRenderOverlays();
  _mapRenderCities();
  mapRendered = true;
  if (selectedCity) showCityDetail(selectedCity);
}

// ── Weather overlay logic ─────────────────────────────────────────────────────
function _mapRenderOverlays() {
  const defs    = document.getElementById('mapDefs');
  const overlayG = document.getElementById('weatherOverlays');
  if (!defs || !overlayG) return;
  defs.innerHTML    = '';
  overlayG.innerHTML = '';

  const NS = 'http://www.w3.org/2000/svg';
  const R  = 95; // overlay circle radius (SVG units)

  ALL_CITIES.filter(c => WEATHER_DATA[c.name]).forEach(city => {
    const d   = WEATHER_DATA[city.name];
    const fc0 = (FORECAST_DATA[city.name] || [])[0];
    const p   = _mapProject(city.lat, city.lon);

    const layers = [
      { key: 'rain',    ..._mapRainLayer(d, fc0)    },
      { key: 'clouds',  ..._mapCloudLayer(d)        },
      { key: 'severe',  ..._mapSevereLayer(d)       },
      { key: 'drought', ..._mapDroughtLayer(d)      },
    ];

    layers.forEach(({ key, color, opacity }) => {
      if (!_mapLayers[key] || !color || opacity <= 0) return;
      const gId  = `ov-${key}-${city.name.replace(/\W/g, '')}`;
      const grad = document.createElementNS(NS, 'radialGradient');
      grad.setAttribute('id', gId);
      grad.innerHTML = `
        <stop offset="0%"   stop-color="${color}" stop-opacity="${Math.min(opacity, 0.82)}"/>
        <stop offset="55%"  stop-color="${color}" stop-opacity="${(opacity * 0.38).toFixed(2)}"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      `;
      defs.appendChild(grad);
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx',    p.x);
      circle.setAttribute('cy',    p.y);
      circle.setAttribute('r',     R);
      circle.setAttribute('fill',  `url(#${gId})`);
      circle.setAttribute('class', `map-overlay map-overlay-${key}`);
      overlayG.appendChild(circle);
    });
  });
}

function _mapRainLayer(d, fc0) {
  const rain = fc0 ? fc0.rain : 0;
  const wet  = ['Rain','Drizzle','Showers','Thunderstorms','Severe Storm'].includes(d.condition);
  if (rain < 20 && !wet) return { color: null, opacity: 0 };
  const op = wet ? 0.62 : rain / 100 * 0.5;
  return { color: '#1565D4', opacity: op };
}

function _mapCloudLayer(d) {
  if (!['Overcast','Partly Cloudy','Foggy'].includes(d.condition)) return { color: null, opacity: 0 };
  const op = d.condition === 'Overcast' ? 0.32 : d.condition === 'Foggy' ? 0.38 : 0.16;
  return { color: '#8898AA', opacity: op };
}

function _mapSevereLayer(d) {
  if (!['Thunderstorms','Severe Storm'].includes(d.condition)) return { color: null, opacity: 0 };
  return { color: '#8B1A1A', opacity: 0.7 };
}

function _mapDroughtLayer(d) {
  if (d.et0Avg == null || d.precipAvg == null) return { color: null, opacity: 0 };
  const deficit = d.et0Avg - d.precipAvg;
  if (deficit < 1.5) return { color: null, opacity: 0 };
  return { color: '#C47A20', opacity: Math.min(0.52, deficit / 8) };
}

// ── City markers ──────────────────────────────────────────────────────────────
function _mapRenderCities() {
  const markers = document.getElementById('cityMarkers');
  if (!markers) return;
  markers.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';

  ALL_CITIES.forEach(city => {
    const d   = WEATHER_DATA[city.name];
    const p   = _mapProject(city.lat, city.lon);
    const isPrimary = !!city.primary;
    const g   = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'city-dot' + (isPrimary ? '' : ' city-dot-ext'));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');

    if (d) {
      const col = getTempColor(d.temp);
      g.setAttribute('aria-label', `${city.name}: ${d.temp}°F, ${d.condition}`);
      if (isPrimary) {
        g.innerHTML = `
          <circle cx="${p.x}" cy="${p.y}" r="7.5" fill="${col}" opacity="0.93" stroke="rgba(255,255,255,0.75)" stroke-width="1.5"/>
          <text x="${p.x}" y="${p.y-11}" fill="rgba(255,255,255,0.93)" font-size="7.5" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" aria-hidden="true">${escapeHtml(city.name)}</text>
          <text x="${p.x}" y="${p.y+3.5}" fill="#fff" font-size="6.5" text-anchor="middle" font-weight="800" font-family="Inter,sans-serif" aria-hidden="true">${d.temp}°</text>
        `;
      } else {
        g.innerHTML = `
          <circle cx="${p.x}" cy="${p.y}" r="5" fill="${col}" opacity="0.82" stroke="rgba(255,255,255,0.55)" stroke-width="1"/>
          <text x="${p.x}" y="${p.y-8}" fill="rgba(255,255,255,0.72)" font-size="5.8" text-anchor="middle" font-family="Inter,sans-serif" font-weight="500" aria-hidden="true" class="map-city-label">${escapeHtml(city.name)}</text>
        `;
      }
    } else {
      // No data yet — small grey placeholder dot
      g.setAttribute('aria-label', `${city.name}: click to load weather`);
      const r  = isPrimary ? 5 : 3.5;
      const fs = isPrimary ? 7 : 5.5;
      const ty = p.y - r - 2;
      g.innerHTML = `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="rgba(130,155,185,0.55)" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
        <text x="${p.x}" y="${ty}" fill="rgba(255,255,255,0.38)" font-size="${fs}" text-anchor="middle" font-family="Inter,sans-serif" class="map-city-label" aria-hidden="true">${escapeHtml(city.name)}</text>
      `;
    }

    g.addEventListener('mouseenter', e => _mapShowTooltip(e, city, d));
    g.addEventListener('mouseleave', hideTooltip);
    g.addEventListener('click', () => {
      selectedCity = city.name;
      if (d) showCityDetail(city.name);
      else   _mapFetchAndShow(city);
    });
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectedCity = city.name;
        if (d) showCityDetail(city.name);
        else   _mapFetchAndShow(city);
      }
    });
    markers.appendChild(g);
  });
}

// ── On-demand city fetch ──────────────────────────────────────────────────────
async function _mapFetchAndShow(city) {
  const detail  = document.getElementById('cityDetail');
  const content = document.getElementById('cityDetailContent');
  if (detail)  detail.style.display = 'block';
  if (content) content.innerHTML = `
    <div style="text-align:center;padding:24px 0;color:var(--text2)">
      <div style="font-size:22px;margin-bottom:8px">🌐</div>
      <div style="font-size:12px">Loading weather for ${escapeHtml(city.name)}…</div>
    </div>
  `;
  if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  try {
    await fetchCityOnDemand(city);
    showCityDetail(city.name);
    _mapRenderCities();
    _mapRenderOverlays();
  } catch {
    if (content) content.innerHTML = `<div class="card" style="color:var(--text2);text-align:center;padding:24px">Unable to load weather for ${escapeHtml(city.name)}. Please try again.</div>`;
  }
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function _mapShowTooltip(e, city, d) {
  const tt   = document.getElementById('mapTooltip');
  const rect = document.getElementById('texasSVG').getBoundingClientRect();
  const x    = Math.min(e.clientX - rect.left + 14, rect.width - 180);
  const y    = Math.max(e.clientY - rect.top  - 24, 4);
  tt.style.cssText += `;display:block;left:${x}px;top:${y}px`;
  tt.removeAttribute('aria-hidden');
  if (d) {
    tt.innerHTML = `<strong style="font-size:12px">${escapeHtml(city.name)}</strong><br><span style="font-size:13px" aria-hidden="true">${d.icon}</span> ${d.temp}°F · ${escapeHtml(d.condition)}<br><span style="color:var(--text2)">💧 ${d.humidity}% &nbsp;💨 ${d.wind} mph</span>`;
  } else {
    tt.innerHTML = `<strong style="font-size:12px">${escapeHtml(city.name)}</strong><br><span style="color:var(--text2);font-size:11px">Click to load weather</span>`;
  }
}

function showTooltip(e, c, d) { _mapShowTooltip(e, c, d); }

function hideTooltip() {
  const tt = document.getElementById('mapTooltip');
  tt.style.display = 'none';
  tt.setAttribute('aria-hidden', 'true');
}

// ── City detail panel ─────────────────────────────────────────────────────────
function showCityDetail(cityName) {
  const d = WEATHER_DATA[cityName];
  if (!d) return;
  const detail = document.getElementById('cityDetail');
  if (detail) detail.style.display = 'block';
  document.getElementById('cityDetailContent').innerHTML = `
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
      ${(FORECAST_DATA[cityName]||[]).map(f=>`
        <div class="forecast-row">
          <div class="forecast-day">${escapeHtml(f.day)}</div>
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
