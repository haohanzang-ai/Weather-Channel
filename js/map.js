'use strict';

// ── MapLibre GL map implementation ────────────────────────────────────────────
// Replaces the legacy SVG map. External API (renderMap, mapToggleLayer,
// showCityDetail, _mapFetchAndShow, showTooltip, hideTooltip) is preserved.

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

let _mlMap = null;
let _mlMapLoaded = false;
let _mlMarkers = {};

// Weather overlay visibility — mirrors the old _mapLayers state
const _mapLayers = { rain: true, clouds: true, severe: true, drought: true };

// ── Layer toggle (called from HTML onclick) ────────────────────────────────────
function mapToggleLayer(layer) {
  _mapLayers[layer] = !_mapLayers[layer];
  const btn = document.querySelector(`.map-layer-btn[data-layer="${layer}"]`);
  if (btn) btn.classList.toggle('active', _mapLayers[layer]);
  _mlSyncLayerVisibility();
}

// ── Map initialisation ────────────────────────────────────────────────────────
function _mlInit() {
  const container = document.getElementById('texasSVG');
  if (!container || _mlMap) return;

  _mlMap = new maplibregl.Map({
    container: 'texasSVG',
    style: MAP_STYLE,
    center: [-99.5, 31.0],
    zoom: 5.2,
    minZoom: 4,
    maxZoom: 14,
    renderWorldCopies: false,
    attributionControl: { compact: true },
  });

  // Controls matching MapControls component (showZoom + showCompass + showLocate + showFullscreen)
  _mlMap.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
  _mlMap.addControl(new maplibregl.FullscreenControl(), 'bottom-right');
  _mlMap.addControl(
    new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
    'bottom-right',
  );

  function _mlOnReady() {
    if (_mlMapLoaded) return;
    _mlMapLoaded = true;
    _mlAddOverlaySources();
    _mlRenderMarkers();
    mapRendered = true;
    if (typeof selectedCity !== 'undefined' && selectedCity && WEATHER_DATA[selectedCity]) {
      showCityDetail(selectedCity);
    }
  }

  _mlMap.on('load', _mlOnReady);
  // Fallback: if style loads but full 'load' is slow (e.g. first tile batch), init after style
  _mlMap.on('styledata', () => { if (_mlMap.isStyleLoaded()) _mlOnReady(); });
  // Hard fallback after 4s in case WebGL/tile loading stalls
  setTimeout(() => { if (_mlMap && !_mlMapLoaded) _mlOnReady(); }, 4000);
}

// ── Weather overlay sources / layers ─────────────────────────────────────────
function _mlBuildGeoJSON() {
  const features = ALL_CITIES
    .filter(c => WEATHER_DATA[c.name])
    .map(city => {
      const d   = WEATHER_DATA[city.name];
      const fc0 = (FORECAST_DATA[city.name] || [])[0];
      return {
        type: 'Feature',
        properties: {
          rain:    _opRain(d, fc0),
          cloud:   _opCloud(d),
          severe:  _opSevere(d),
          drought: _opDrought(d),
        },
        geometry: { type: 'Point', coordinates: [city.lon, city.lat] },
      };
    });
  return { type: 'FeatureCollection', features };
}

function _opRain(d, fc0) {
  const rain = fc0 ? fc0.rain : 0;
  const wet  = ['Rain', 'Drizzle', 'Showers', 'Thunderstorms', 'Severe Storm'].includes(d.condition);
  if (rain < 20 && !wet) return 0;
  return wet ? 0.62 : (rain / 100) * 0.5;
}
function _opCloud(d) {
  if (!['Overcast', 'Partly Cloudy', 'Foggy'].includes(d.condition)) return 0;
  return d.condition === 'Overcast' ? 0.32 : d.condition === 'Foggy' ? 0.38 : 0.16;
}
function _opSevere(d)  { return ['Thunderstorms', 'Severe Storm'].includes(d.condition) ? 0.7 : 0; }
function _opDrought(d) {
  if (d.et0Avg == null || d.precipAvg == null) return 0;
  const deficit = d.et0Avg - d.precipAvg;
  return deficit < 1.5 ? 0 : Math.min(0.52, deficit / 8);
}

// Radius expression: scales with zoom so overlays cover similar geographic area
function _radiusExpr() {
  return ['interpolate', ['exponential', 2], ['zoom'], 4, 35, 5, 70, 6, 140, 7, 280];
}

function _mlAddOverlaySources() {
  if (!_mlMap) return;
  const data = _mlBuildGeoJSON();

  const overlays = [
    { key: 'rain',    color: '#1565D4' },
    { key: 'cloud',   color: '#8898AA' },
    { key: 'severe',  color: '#8B1A1A' },
    { key: 'drought', color: '#C47A20' },
  ];

  overlays.forEach(({ key, color }) => {
    _mlMap.addSource(`${key}-src`, { type: 'geojson', data });
    _mlMap.addLayer({
      id:     `${key}-layer`,
      type:   'circle',
      source: `${key}-src`,
      paint: {
        'circle-radius':  _radiusExpr(),
        'circle-color':   color,
        'circle-opacity': ['get', key],
        'circle-blur':    0.85,
      },
    });
  });

  _mlSyncLayerVisibility();
}

function _mlSyncLayerVisibility() {
  if (!_mlMap || !_mlMapLoaded) return;
  const map = {
    'rain-layer':    _mapLayers.rain,
    'cloud-layer':   _mapLayers.clouds,
    'severe-layer':  _mapLayers.severe,
    'drought-layer': _mapLayers.drought,
  };
  Object.entries(map).forEach(([id, visible]) => {
    if (_mlMap.getLayer(id)) {
      _mlMap.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    }
  });
}

function _mlUpdateOverlaySources() {
  if (!_mlMap || !_mlMapLoaded) return;
  const data = _mlBuildGeoJSON();
  ['rain', 'cloud', 'severe', 'drought'].forEach(key => {
    const src = _mlMap.getSource(`${key}-src`);
    if (src) src.setData(data);
  });
  _mlSyncLayerVisibility();
}

// ── City markers ──────────────────────────────────────────────────────────────
function _mlRenderMarkers() {
  if (!_mlMap) return;

  // Remove existing markers
  Object.values(_mlMarkers).forEach(m => m.remove());
  _mlMarkers = {};

  ALL_CITIES.forEach(city => {
    const d         = WEATHER_DATA[city.name];
    const isPrimary = !!city.primary;
    const sz        = isPrimary ? (d ? 20 : 14) : (d ? 10 : 7);
    const col       = d ? getTempColor(d.temp) : 'rgba(130,155,185,0.55)';

    // Container element (position:relative so the label can be absolute)
    const el = document.createElement('div');
    el.style.cssText = 'position:relative;cursor:pointer';
    el.setAttribute('aria-label', d
      ? `${city.name}: ${d.temp}°F, ${d.condition}`
      : `${city.name}: click to load weather`);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');

    // City name label (floats above the dot)
    const label = document.createElement('div');
    label.textContent = city.name;
    label.style.cssText = [
      'position:absolute',
      'left:50%',
      'transform:translateX(-50%)',
      `bottom:${sz + 3}px`,
      'white-space:nowrap',
      'pointer-events:none',
      'font-family:Inter,sans-serif',
      `font-size:${isPrimary ? '7.5px' : '5.8px'}`,
      `font-weight:${isPrimary ? '700' : '500'}`,
      `color:rgba(255,255,255,${isPrimary ? '0.93' : '0.72'})`,
      'text-shadow:0 1px 3px rgba(0,0,0,0.9)',
      'z-index:1',
    ].join(';');

    // Dot
    const dot = document.createElement('div');
    dot.style.cssText = [
      `width:${sz}px`,
      `height:${sz}px`,
      'border-radius:50%',
      `background:${col}`,
      `border:${d ? '2px' : '1px'} solid rgba(255,255,255,${d ? '0.75' : '0.28'})`,
      'box-shadow:0 2px 8px rgba(0,0,0,0.5)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:6.5px',
      'font-weight:800',
      'color:#fff',
      'font-family:Inter,sans-serif',
      `opacity:${isPrimary ? '0.93' : '0.82'}`,
      'transition:transform 0.15s,box-shadow 0.15s',
      'position:relative',
      'z-index:2',
    ].join(';');
    if (isPrimary && d) dot.textContent = `${d.temp}°`;

    el.appendChild(label);
    el.appendChild(dot);

    // Hover scale
    el.addEventListener('mouseenter', () => {
      dot.style.transform  = 'scale(1.4)';
      dot.style.boxShadow  = '0 4px 16px rgba(0,0,0,0.6)';
    });
    el.addEventListener('mouseleave', () => {
      dot.style.transform = '';
      dot.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    });

    // Hover popup (styled to match the site's dark theme)
    const popupHtml = d
      ? `<div style="font-family:Inter,sans-serif;font-size:11px">
           <strong style="font-size:12px">${escapeHtml(city.name)}</strong><br>
           <span style="font-size:14px">${d.icon}</span>&nbsp;${d.temp}°F · ${escapeHtml(d.condition)}<br>
           <span style="opacity:0.65">💧 ${d.humidity}% &nbsp;💨 ${d.wind} mph</span>
         </div>`
      : `<div style="font-family:Inter,sans-serif;font-size:11px">
           <strong>${escapeHtml(city.name)}</strong><br>
           <span style="opacity:0.6">Click to load weather</span>
         </div>`;

    const popup = new maplibregl.Popup({
      offset:      [0, -(sz + 4)],
      closeButton: false,
      closeOnClick:false,
      maxWidth:    '220px',
    }).setHTML(popupHtml);

    el.addEventListener('mouseenter', () => popup.setLngLat([city.lon, city.lat]).addTo(_mlMap));
    el.addEventListener('mouseleave', () => popup.remove());

    // Click → show city detail panel
    const handleClick = () => {
      selectedCity = city.name;
      if (d) showCityDetail(city.name);
      else   _mapFetchAndShow(city);
    };
    el.addEventListener('click', handleClick);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([city.lon, city.lat])
      .addTo(_mlMap);

    _mlMarkers[city.name] = marker;
  });
}

// ── Main entry point (called by TAB_RENDERERS.mapcompare) ─────────────────────
function renderMap() {
  if (!_mlMap) {
    _mlInit();
    // markers & overlays will be added in the 'load' handler
    return;
  }
  if (!_mlMapLoaded) return; // load handler will run soon
  _mlUpdateOverlaySources();
  _mlRenderMarkers();
  if (typeof selectedCity !== 'undefined' && selectedCity && WEATHER_DATA[selectedCity]) {
    showCityDetail(selectedCity);
  }
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
    </div>`;
  if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  try {
    await fetchCityOnDemand(city);
    showCityDetail(city.name);
    _mlRenderMarkers();
    _mlUpdateOverlaySources();
  } catch {
    if (content) content.innerHTML = `
      <div class="card" style="color:var(--text2);text-align:center;padding:24px">
        Unable to load weather for ${escapeHtml(city.name)}. Please try again.
      </div>`;
  }
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
      <div class="card"><div class="stat-label">UV Index</div><div class="stat-value" style="font-size:18px;color:${d.uv >= 8 ? '#E87A7A' : '#F8C06A'}">${d.uv}</div></div>
      <div class="card"><div class="stat-label">AQI</div><div class="stat-value" style="font-size:18px;color:${getAQILabel(d.aqi).color}">${d.aqi}</div></div>
    </div>
    <div style="margin-top:14px">
      <h3 class="section-title">7-Day Forecast — ${escapeHtml(cityName)}</h3>
      ${(FORECAST_DATA[cityName] || []).map(f => `
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
        </div>`).join('')}
    </div>
  `;
}

// ── Tooltip stubs (kept for backward compat with nav.js search) ───────────────
function showTooltip() {}
function hideTooltip() {}
