'use strict';

// ── App state: single source of truth for the analysis pipeline ───────────────
const appState = {
  locationMethod: null,  // 'gps' | 'city' | 'coords'
  locationLabel:  null,  // display label
  lat:            null,
  lon:            null,
  envData:        null,  // result of locFetchEnvironment()
  envFetchTime:   null,
};

// ── Initialize location UI into #locInputSection ──────────────────────────────
function locInit() {
  const section = document.getElementById('locInputSection');
  if (!section) return;

  const cityOptions = (typeof ALL_CITIES !== 'undefined' ? ALL_CITIES : [])
    .map(c => `<option value="${c.lat},${c.lon}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
    .join('');

  section.innerHTML = `
    <div class="loc-card" id="locChoiceCard">
      <div class="loc-card-header">
        <span class="loc-card-icon" aria-hidden="true">📍</span>
        <div>
          <div class="loc-card-title">Step 2 — Measure Your Local Environment</div>
          <div class="loc-card-sub">Choose how to set your location. Live data is fetched from Open-Meteo and NWS for that exact point. Your coordinates are not stored unless you choose to export a report.</div>
        </div>
      </div>
      <div class="loc-methods" role="group" aria-label="Location input methods">
        <button class="loc-method-btn" onclick="locRequestGPS()">
          <span class="loc-method-icon" aria-hidden="true">🛰</span>
          <div>
            <div class="loc-method-label">Use My GPS</div>
            <div class="loc-method-sub">Browser geolocation — most accurate</div>
          </div>
        </button>
        <button class="loc-method-btn" onclick="locShowCityPicker()">
          <span class="loc-method-icon" aria-hidden="true">🏙</span>
          <div>
            <div class="loc-method-label">Select a Texas City</div>
            <div class="loc-method-sub">Choose from monitored cities</div>
          </div>
        </button>
        <button class="loc-method-btn" onclick="locShowCoordInput()">
          <span class="loc-method-icon" aria-hidden="true">📐</span>
          <div>
            <div class="loc-method-label">Enter Coordinates</div>
            <div class="loc-method-sub">Latitude &amp; longitude (decimal)</div>
          </div>
        </button>
      </div>
      <div id="locSubInput"></div>
      <div id="locStatus" class="loc-status" role="status" aria-live="polite"></div>
    </div>

    <div id="locProfileCard" class="loc-profile-card" style="display:none" aria-live="polite"></div>
  `;
}

// ── GPS method ────────────────────────────────────────────────────────────────
function locRequestGPS() {
  if (!navigator.geolocation) {
    _locSetStatus('err', 'Geolocation is not supported by this browser. Please use another method.');
    return;
  }
  _locSetStatus('loading', 'Requesting GPS location from browser…');
  navigator.geolocation.getCurrentPosition(
    pos => {
      appState.locationMethod = 'gps';
      appState.lat  = pos.coords.latitude;
      appState.lon  = pos.coords.longitude;
      appState.locationLabel = `GPS (${pos.coords.latitude.toFixed(4)}°N, ${Math.abs(pos.coords.longitude).toFixed(4)}°W)`;
      _locSetStatus('ok', `Location acquired: ${appState.locationLabel}`);
      locFetchEnvironment(appState.lat, appState.lon);
    },
    err => {
      const msgs = {
        1: 'Location permission denied. Allow location access in your browser or use another method.',
        2: 'Location unavailable — GPS signal could not be obtained.',
        3: 'Location request timed out. Please try again or use another method.',
      };
      _locSetStatus('err', msgs[err.code] || 'Unknown geolocation error.');
    },
    { timeout: 12000, maximumAge: 300000 }
  );
}

// ── City picker method ────────────────────────────────────────────────────────
function locShowCityPicker() {
  const sub = document.getElementById('locSubInput');
  if (!sub) return;
  const cityOptions = (typeof ALL_CITIES !== 'undefined' ? ALL_CITIES : [])
    .map(c => `<option value="${c.lat},${c.lon}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
    .join('');
  sub.innerHTML = `
    <div class="loc-sub-wrap">
      <label for="locCitySelect" class="loc-sub-label">Select Texas City</label>
      <select id="locCitySelect" class="loc-select" onchange="locCitySelected(this)">
        <option value="">— choose a city —</option>
        ${cityOptions}
      </select>
    </div>
  `;
}

function locCitySelected(sel) {
  const parts = sel.value.split(',');
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  const name = sel.options[sel.selectedIndex].dataset.name;
  if (!lat || !lon) return;
  appState.locationMethod = 'city';
  appState.lat  = lat;
  appState.lon  = lon;
  appState.locationLabel = name;
  _locSetStatus('ok', `City selected: ${name}`);
  locFetchEnvironment(lat, lon);
}

// ── Coordinate input method ───────────────────────────────────────────────────
function locShowCoordInput() {
  const sub = document.getElementById('locSubInput');
  if (!sub) return;
  sub.innerHTML = `
    <div class="loc-sub-wrap">
      <div class="loc-coord-row">
        <div class="loc-coord-field">
          <label for="locLatInput" class="loc-sub-label">Latitude (°N)</label>
          <input id="locLatInput" type="number" class="loc-coord-input"
                 placeholder="e.g. 30.2672" min="25" max="36.5" step="0.0001">
        </div>
        <div class="loc-coord-field">
          <label for="locLonInput" class="loc-sub-label">Longitude (negative °W)</label>
          <input id="locLonInput" type="number" class="loc-coord-input"
                 placeholder="e.g. -97.7431" min="-107" max="-93" step="0.0001">
        </div>
      </div>
      <button class="btn-sm" onclick="locSubmitCoords()" style="margin-top:8px">Fetch Environment →</button>
    </div>
  `;
}

function locSubmitCoords() {
  const lat = parseFloat(document.getElementById('locLatInput')?.value);
  const lon = parseFloat(document.getElementById('locLonInput')?.value);
  if (isNaN(lat) || isNaN(lon) || lat < 25 || lat > 36.5 || lon < -107 || lon > -93) {
    _locSetStatus('err', 'Enter valid Texas coordinates: latitude 25–36.5°N, longitude −107 to −93°W.');
    return;
  }
  appState.locationMethod = 'coords';
  appState.lat = lat;
  appState.lon = lon;
  appState.locationLabel = `${lat.toFixed(4)}°N, ${Math.abs(lon).toFixed(4)}°W`;
  _locSetStatus('ok', `Coordinates set: ${appState.locationLabel}`);
  locFetchEnvironment(lat, lon);
}

// ── Status helper ─────────────────────────────────────────────────────────────
function _locSetStatus(type, msg) {
  const el = document.getElementById('locStatus');
  if (!el) return;
  const icons = { loading: '⏳', ok: '✅', err: '❌', warn: '⚠' };
  const classes = { loading: 'loc-status-loading', ok: 'loc-status-ok', err: 'loc-status-err', warn: 'loc-status-warn' };
  el.innerHTML = `<span class="${classes[type] || ''}">${icons[type] || ''} ${escapeHtml(msg)}</span>`;
}

// ── Fetch full environment for a lat/lon ──────────────────────────────────────
async function locFetchEnvironment(lat, lon) {
  _locSetStatus('loading', 'Fetching live environment data from Open-Meteo + NWS…');

  const profileCard = document.getElementById('locProfileCard');
  if (profileCard) {
    profileCard.style.display = 'block';
    profileCard.innerHTML = '<div class="card loading-shimmer" style="height:220px;margin:0"></div>';
  }

  const metric  = typeof getSetting === 'function' && getSetting('units') === 'metric';
  const tUnit   = metric ? 'celsius'    : 'fahrenheit';
  const wUnit   = metric ? 'kmh'        : 'mph';
  const tSuffix = metric ? '°C'         : '°F';
  const wSuffix = metric ? 'km/h'       : 'mph';

  // 30-day window for archive API
  const today    = new Date();
  const archEnd  = today.toISOString().slice(0, 10);
  const archStart = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  const weatherUrl = [
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`,
    `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility,uv_index,precipitation`,
    `hourly=vapour_pressure_deficit,soil_moisture_0_to_1cm`,
    `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,et0_fao_evapotranspiration,precipitation_sum`,
    `temperature_unit=${tUnit}&wind_speed_unit=${wUnit}&timezone=auto&forecast_days=7`,
  ].join('&');

  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5`;

  const archUrl = [
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}`,
    `start_date=${archStart}&end_date=${archEnd}`,
    `daily=et0_fao_evapotranspiration,precipitation_sum`,
    `temperature_unit=${tUnit}&wind_speed_unit=${wUnit}&timezone=auto`,
  ].join('&');

  const result = {
    lat, lon, tSuffix, wSuffix,
    current:     null,
    aqi:         null,
    forecast:    null,
    hourlyVPD:   null,
    hourlySoil:  null,
    archive30:   null,
    alerts:      null,
    alertsCount: 0,
    errors:      [],
    fetchTime:   new Date(),
  };

  // Fetch weather, AQI, 30-day archive in parallel
  const [wxRes, aqRes, archRes] = await Promise.allSettled([
    fetch(weatherUrl).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
    fetch(aqiUrl).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
    fetch(archUrl).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
  ]);

  // — Weather ——
  if (wxRes.status === 'fulfilled') {
    const wx      = wxRes.value;
    const cur     = wx.current  || {};
    const hourly  = wx.hourly   || {};
    const daily   = wx.daily    || {};
    const cond    = typeof getConditionFromCode === 'function'
      ? getConditionFromCode(cur.weather_code)
      : { condition: 'Unknown', icon: '🌡' };

    result.current = {
      temp:       cur.temperature_2m          != null ? Math.round(cur.temperature_2m)          : null,
      feels:      cur.apparent_temperature    != null ? Math.round(cur.apparent_temperature)    : null,
      humidity:   cur.relative_humidity_2m    != null ? cur.relative_humidity_2m                : null,
      wind:       cur.wind_speed_10m          != null ? Math.round(cur.wind_speed_10m)          : null,
      pressure:   cur.surface_pressure        != null ? Math.round(cur.surface_pressure)        : null,
      visibility: cur.visibility              != null ? Math.min(10, Math.round(cur.visibility / 1609)) : null,
      uv:         cur.uv_index               != null ? Math.round(cur.uv_index)                : null,
      precip:     cur.precipitation           != null ? Math.round(cur.precipitation * 100) / 100 : null,
      condition:  cond.condition,
      icon:       cond.icon,
    };

    // VPD: first available hourly value for the current hour
    const vpdArr  = hourly.vapour_pressure_deficit  || [];
    const soilArr = hourly.soil_moisture_0_to_1cm   || [];
    result.hourlyVPD  = vpdArr[0]  != null ? Math.round(vpdArr[0]  * 100) / 100 : null;
    result.hourlySoil = soilArr[0] != null ? Math.round(soilArr[0] * 10000) / 10000 : null;

    result.forecast = (daily.time || []).map((d, i) => ({
      date:     d,
      hiTemp:   daily.temperature_2m_max?.[i]                != null ? Math.round(daily.temperature_2m_max[i])                : null,
      loTemp:   daily.temperature_2m_min?.[i]                != null ? Math.round(daily.temperature_2m_min[i])                : null,
      rainProb: daily.precipitation_probability_max?.[i]     ?? null,
      et0:      daily.et0_fao_evapotranspiration?.[i]        != null ? Math.round(daily.et0_fao_evapotranspiration[i] * 10) / 10 : null,
      precip:   daily.precipitation_sum?.[i]                 != null ? Math.round(daily.precipitation_sum[i] * 10) / 10         : null,
    }));
  } else {
    result.errors.push('Open-Meteo weather API unavailable — atmospheric data not loaded.');
  }

  // — AQI ——
  if (aqRes.status === 'fulfilled') {
    const aqCur = aqRes.value.current || {};
    result.aqi = {
      usAqi: aqCur.us_aqi != null ? aqCur.us_aqi               : null,
      pm10:  aqCur.pm10   != null ? Math.round(aqCur.pm10 * 10) / 10 : null,
      pm2_5: aqCur.pm2_5  != null ? Math.round(aqCur.pm2_5 * 10) / 10 : null,
    };
  } else {
    result.errors.push('Open-Meteo AQI API unavailable — air quality data not loaded.');
  }

  // — 30-day archive ——
  if (archRes.status === 'fulfilled') {
    const arch      = archRes.value;
    const et0Arr    = arch.daily?.et0_fao_evapotranspiration || [];
    const precipArr = arch.daily?.precipitation_sum || [];
    const et0Sum    = et0Arr.reduce((a, b)  => a + (b  || 0), 0);
    const precipSum = precipArr.reduce((a, b) => a + (b || 0), 0);
    result.archive30 = {
      et0Sum:    et0Arr.length    ? Math.round(et0Sum    * 10) / 10 : null,
      precipSum: precipArr.length ? Math.round(precipSum * 10) / 10 : null,
      deficit:   (et0Arr.length && precipArr.length)
        ? Math.round((et0Sum - precipSum) * 10) / 10 : null,
      days: et0Arr.length,
    };
  } else {
    result.errors.push('Open-Meteo archive API unavailable — 30-day drought memory not available.');
  }

  // — NWS alerts (two-step: /points → forecast zone → active alerts) ——
  try {
    const ptRes = await fetch(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
      { headers: { 'User-Agent': 'TexasClimate/3.0 (educational; haohanzang@gmail.com)' } }
    );
    if (!ptRes.ok) throw new Error('NWS /points HTTP ' + ptRes.status);
    const ptData     = await ptRes.json();
    const forecastZone = ptData.properties?.forecastZone;
    if (forecastZone) {
      const zoneId    = forecastZone.split('/').pop();
      const alertsRes = await fetch(
        `https://api.weather.gov/alerts/active?zone=${zoneId}`,
        { headers: { 'User-Agent': 'TexasClimate/3.0 (educational; haohanzang@gmail.com)' } }
      );
      if (!alertsRes.ok) throw new Error('NWS alerts HTTP ' + alertsRes.status);
      const alertsData   = await alertsRes.json();
      result.alerts      = (alertsData.features || []).slice(0, 5);
      result.alertsCount = alertsData.features?.length || 0;
    } else {
      result.alerts      = [];
      result.alertsCount = 0;
    }
  } catch {
    result.errors.push('NWS alerts unavailable for this location.');
  }

  appState.envData      = result;
  appState.envFetchTime = result.fetchTime;

  locRenderProfile(result);
  _locSetStatus('ok',
    `Profile loaded at ${result.fetchTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` +
    (result.errors.length ? ` · ${result.errors.length} source(s) unavailable` : '')
  );
}

// ── Render the Local Environment Profile ─────────────────────────────────────
function locRenderProfile(d) {
  const card = document.getElementById('locProfileCard');
  if (!card) return;

  const ts = d.tSuffix;
  const ws = d.wSuffix;
  const na = '<span class="loc-val-na">Unavailable</span>';
  const cur = d.current;

  // VPD: real field first, then Tetens approximation from temp + humidity
  let vpdDisplay = na;
  if (d.hourlyVPD != null) {
    vpdDisplay = `${d.hourlyVPD} kPa ${dataBadge('live-api')}`;
  } else if (cur?.temp != null && cur?.humidity != null) {
    const tempC = ts === '°F' ? (cur.temp - 32) * 5 / 9 : cur.temp;
    const es    = 0.6108 * Math.exp(17.27 * tempC / (tempC + 237.3));
    const ea    = es * cur.humidity / 100;
    const vpd   = Math.round((es - ea) * 100) / 100;
    vpdDisplay  = `${vpd} kPa <span class="loc-derived">(approx. from temp+RH)</span> ${dataBadge('live-derived')}`;
  }

  // Soil moisture
  let soilDisplay = na;
  if (d.hourlySoil != null) {
    const soilPct   = Math.round(d.hourlySoil * 100);
    const soilLabel = soilPct < 15 ? 'Very dry' : soilPct < 30 ? 'Dry' : soilPct < 50 ? 'Moderate' : 'Moist';
    soilDisplay = `${d.hourlySoil} m³/m³ (${soilPct}% — ${soilLabel}) ${dataBadge('live-api')}`;
  }

  // 30-day drought deficit
  let droughtDisplay = na;
  let droughtTag = '';
  if (d.archive30?.deficit != null) {
    const def   = d.archive30.deficit;
    const label = def > 60 ? 'Severe deficit' : def > 30 ? 'Moderate deficit' : def > 0 ? 'Mild deficit' : 'Surplus / adequate';
    const color = def > 60 ? '#D64545' : def > 30 ? '#F5A623' : '#2ECC8B';
    droughtDisplay = `${def} mm over ${d.archive30.days} days ${dataBadge('live-api')}`;
    droughtTag = `<span class="loc-tag" style="background:${color}22;color:${color};border-color:${color}55">${label}</span>`;
  }

  // AQI
  const aqiVal = d.aqi?.usAqi ?? null;
  let aqiDisplay = na;
  if (aqiVal != null) {
    const aqiLabel = typeof getAQILabel === 'function' ? getAQILabel(aqiVal) : '';
    aqiDisplay = `${aqiVal}${aqiLabel ? ' — ' + aqiLabel : ''} ${dataBadge('live-api')}`;
  }

  // NWS alerts
  let alertsHtml = '';
  if (d.alerts === null) {
    alertsHtml = `<div class="loc-alert-row"><span class="loc-val-na">NWS alerts unavailable for this location</span></div>`;
  } else if (d.alertsCount === 0) {
    alertsHtml = `<div class="loc-alert-ok">No active NWS alerts for this location ${dataBadge('live-api')}</div>`;
  } else {
    alertsHtml = d.alerts.map(a => {
      const sev = a.properties?.severity || '';
      const cls = (sev === 'Extreme' || sev === 'Severe') ? 'alert-banner' : 'info-banner';
      const ev  = escapeHtml(a.properties?.event || 'Alert');
      const area = escapeHtml(a.properties?.areaDesc || '');
      return `<div class="${cls} loc-alert-row">${dataBadge('live-api')} <strong>${ev}</strong>${area ? ' — ' + area : ''}</div>`;
    }).join('');
    if (d.alertsCount > d.alerts.length) {
      alertsHtml += `<div class="loc-val-sub">+${d.alertsCount - d.alerts.length} more — <a href="#" onclick="showPage('mapcompare');return false;" style="color:#4A90E2">Map &amp; Compare → Severe tab</a></div>`;
    }
  }

  // API errors
  const errHtml = d.errors.length
    ? `<div class="loc-errors-bar">${d.errors.map(e => `<span class="loc-err-item">⚠ ${escapeHtml(e)}</span>`).join('')}</div>`
    : '';

  const timeStr = d.fetchTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });

  card.innerHTML = `
    <div class="loc-profile-header">
      <span class="loc-profile-title">📍 Local Environment Profile</span>
      <span class="loc-profile-loc">${escapeHtml(appState.locationLabel || '')}</span>
      <span class="loc-profile-time">${timeStr}</span>
      <button class="btn-sm" onclick="locRefresh()" style="margin-left:auto;font-size:10px">↻ Re-fetch</button>
    </div>

    ${errHtml}

    <div class="loc-profile-grid">

      <div class="loc-section">
        <div class="loc-section-title">Atmospheric — Live Conditions ${dataBadge('live-api')}</div>
        <div class="loc-vals">
          <div class="loc-val-item"><span class="loc-val-lbl">Temperature</span><span class="loc-val-num">${cur?.temp != null ? cur.temp + ts : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">Feels Like</span><span class="loc-val-num">${cur?.feels != null ? cur.feels + ts : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">Relative Humidity</span><span class="loc-val-num">${cur?.humidity != null ? cur.humidity + '%' : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">Wind Speed</span><span class="loc-val-num">${cur?.wind != null ? cur.wind + ' ' + ws : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">Surface Pressure</span><span class="loc-val-num">${cur?.pressure != null ? cur.pressure + ' hPa' : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">UV Index</span><span class="loc-val-num">${cur?.uv != null ? cur.uv : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">Visibility</span><span class="loc-val-num">${cur?.visibility != null ? cur.visibility + ' mi' : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">Precipitation (current)</span><span class="loc-val-num">${cur?.precip != null ? cur.precip + ' mm' : na}</span></div>
        </div>
      </div>

      <div class="loc-section">
        <div class="loc-section-title">Plant Stress Indicators</div>
        <div class="loc-vals">
          <div class="loc-val-item"><span class="loc-val-lbl">Vapor Pressure Deficit</span><span class="loc-val-num">${vpdDisplay}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">Soil Moisture (0–1 cm)</span><span class="loc-val-num">${soilDisplay}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">30-Day ET₀ − Precip Deficit</span><span class="loc-val-num">${droughtDisplay} ${droughtTag}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">30-Day Precipitation Total</span><span class="loc-val-num">${d.archive30?.precipSum != null ? d.archive30.precipSum + ' mm ' + dataBadge('live-api') : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">30-Day ET₀ Total</span><span class="loc-val-num">${d.archive30?.et0Sum != null ? d.archive30.et0Sum + ' mm ' + dataBadge('live-api') : na}</span></div>
        </div>
      </div>

      <div class="loc-section">
        <div class="loc-section-title">Air Quality</div>
        <div class="loc-vals">
          <div class="loc-val-item"><span class="loc-val-lbl">US AQI</span><span class="loc-val-num">${aqiDisplay}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">PM2.5</span><span class="loc-val-num">${d.aqi?.pm2_5 != null ? d.aqi.pm2_5 + ' μg/m³ ' + dataBadge('live-api') : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">PM10</span><span class="loc-val-num">${d.aqi?.pm10 != null ? d.aqi.pm10 + ' μg/m³ ' + dataBadge('live-api') : na}</span></div>
          <div class="loc-val-item"><span class="loc-val-lbl">ERCOT Grid Intensity</span><span class="loc-val-num"><span class="loc-val-na">Not integrated yet</span></span></div>
        </div>
      </div>

      <div class="loc-section loc-section-alerts">
        <div class="loc-section-title">NWS Alerts — This Location</div>
        ${alertsHtml}
      </div>

    </div>

    <div class="loc-data-note">
      <strong>Data integrity:</strong> Every value above is sourced from a live API call.
      "Unavailable" means the API failed — no fallback values are shown.
      VPD labeled "(approx.)" was derived from temperature and humidity when the hourly field was unavailable.
      · <a href="#" onclick="showPage('sources');return false;" style="color:#4A90E2">See all Data Sources →</a>
    </div>
  `;
}

// ── Re-fetch with the current location ───────────────────────────────────────
function locRefresh() {
  if (appState.lat == null || appState.lon == null) {
    _locSetStatus('err', 'No location set. Choose a method above first.');
    return;
  }
  locFetchEnvironment(appState.lat, appState.lon);
}
