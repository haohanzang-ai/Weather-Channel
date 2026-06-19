'use strict';

// ── MapLibre GL map implementation ────────────────────────────────────────────
// Replaces the legacy SVG map. External API (renderMap, mapToggleLayer,
// showCityDetail, _mapFetchAndShow, showTooltip, hideTooltip) is preserved.

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

let _mlMap = null;
let _mlMapLoaded = false;
let _mlMarkers = {};

// Weather overlay visibility — mirrors the old _mapLayers state
const _mapLayers = { rain: true, clouds: true, severe: true, drought: true };

// ── Static pollution data (county-level approximations) ─────────────────────
const POLLUTION_DATA = {
  runoff: [
    { county: 'Hidalgo',    lon:  -98.18, lat: 26.30, intensity: 0.9 },
    { county: 'Cameron',    lon:  -97.52, lat: 26.14, intensity: 0.9 },
    { county: 'Starr',      lon:  -98.75, lat: 26.56, intensity: 0.9 },
    { county: 'Bell',       lon:  -97.48, lat: 31.03, intensity: 0.6 },
    { county: 'McLennan',   lon:  -97.20, lat: 31.55, intensity: 0.6 },
    { county: 'Deaf Smith', lon: -102.60, lat: 34.96, intensity: 0.8 },
    { county: 'Castro',     lon: -102.26, lat: 34.53, intensity: 0.8 },
  ],
  pesticide: [
    { county: 'Lubbock',  lon: -101.82, lat: 33.61, intensity: 0.85 },
    { county: 'Hale',     lon: -101.83, lat: 34.07, intensity: 0.85 },
    { county: 'Floyd',    lon: -101.30, lat: 33.98, intensity: 0.85 },
    { county: 'Hidalgo',  lon:  -98.18, lat: 26.30, intensity: 0.80 },
    { county: 'Smith',    lon:  -95.27, lat: 32.37, intensity: 0.65 },
    { county: 'Rusk',     lon:  -94.77, lat: 31.90, intensity: 0.65 },
  ],
  ghg: [
    { county: 'Harris',   lon:  -95.37, lat: 29.85, intensity: 0.90 },
    { county: 'Midland',  lon: -102.08, lat: 31.87, intensity: 0.85 },
    { county: 'Ector',    lon: -102.55, lat: 31.87, intensity: 0.85 },
    { county: 'Dallas',   lon:  -96.78, lat: 32.77, intensity: 0.75 },
    { county: 'Tarrant',  lon:  -97.29, lat: 32.73, intensity: 0.75 },
    { county: 'Nueces',   lon:  -97.40, lat: 27.73, intensity: 0.70 },
  ],
};

// Pollution layer toggle state — separate from weather _mapLayers
const _pollutionLayers = { runoff: false, pesticide: false, ghg: false };

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
    _mlAddPollutionLayers();
    _mlAddTexasBorder(); // async — inserts Texas outline below weather circles
    _mlRenderMarkers();
    _mlAddInMapLegend();
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

// ── Pollution overlay layers ─────────────────────────────────────────────────
const _POLL_CONFIGS = [
  {
    key: 'runoff',    color: '#1A6B3A', label: 'Agricultural Runoff',
    bio: 'Biofuel crops here could reduce agricultural runoff pollution by replacing conventional row-crop agriculture',
  },
  {
    key: 'pesticide', color: '#8B4513', label: 'Pesticide Intensity',
    bio: 'Biofuel crops here could reduce pesticide intensity pollution by replacing conventional row-crop agriculture',
  },
  {
    key: 'ghg',       color: '#FF4500', label: 'GHG Emissions',
    bio: 'Biofuel crops here could reduce GHG emissions pollution by replacing fossil-fuel-dependent conventional agriculture',
  },
];

function _mlAddPollutionLayers() {
  if (!_mlMap) return;

  _POLL_CONFIGS.forEach(({ key, color, label, bio }) => {
    const features = POLLUTION_DATA[key].map(pt => ({
      type: 'Feature',
      properties: { intensity: pt.intensity, county: pt.county },
      geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
    }));

    _mlMap.addSource(`${key}-poll-src`, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    _mlMap.addLayer({
      id:     `${key}-poll-layer`,
      type:   'circle',
      source: `${key}-poll-src`,
      layout: { visibility: 'none' },
      paint: {
        'circle-radius':  _radiusExpr(),
        'circle-color':   color,
        'circle-opacity': ['get', 'intensity'],
        'circle-blur':    0.85,
      },
    });

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '280px' });

    _mlMap.on('mouseenter', `${key}-poll-layer`, e => {
      _mlMap.getCanvas().style.cursor = 'pointer';
      const p   = e.features[0].properties;
      const lvl = p.intensity >= 0.8 ? 'Critical' : p.intensity >= 0.6 ? 'High' : p.intensity >= 0.4 ? 'Moderate' : 'Low';
      const lvlColor = { Critical: '#FF4500', High: '#FFA500', Moderate: '#FFD700', Low: '#5DDBA8' }[lvl];
      popup.setLngLat(e.lngLat).setHTML(
        `<div style="font-family:Inter,sans-serif;font-size:11px;line-height:1.55;padding:2px">` +
        `<div style="font-size:12px;font-weight:700;margin-bottom:4px">${escapeHtml(p.county)} County</div>` +
        `<div style="margin-bottom:6px">${escapeHtml(label)} · <span style="color:${lvlColor};font-weight:700">${lvl}</span></div>` +
        `<div style="font-size:10px;color:rgba(255,255,255,0.65);line-height:1.5">${escapeHtml(bio)}</div>` +
        `</div>`
      ).addTo(_mlMap);
    });

    _mlMap.on('mouseleave', `${key}-poll-layer`, () => {
      _mlMap.getCanvas().style.cursor = '';
      popup.remove();
    });
  });
}

function _mlSyncPollutionLayerVisibility() {
  if (!_mlMap || !_mlMapLoaded) return;
  ['runoff', 'pesticide', 'ghg'].forEach(key => {
    const id = `${key}-poll-layer`;
    if (_mlMap.getLayer(id)) {
      _mlMap.setLayoutProperty(id, 'visibility', _pollutionLayers[key] ? 'visible' : 'none');
    }
  });
}

function mapTogglePollutionLayer(layer) {
  _pollutionLayers[layer] = !_pollutionLayers[layer];
  const btn = document.querySelector(`.map-layer-btn[data-layer="${layer}"]`);
  if (btn) btn.classList.toggle('active', _pollutionLayers[layer]);
  _mlSyncPollutionLayerVisibility();
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
      `font-size:${isPrimary ? '8px' : '6px'}`,
      `font-weight:${isPrimary ? '700' : '600'}`,
      'color:rgba(20,30,50,0.92)',
      'text-shadow:0 1px 2px rgba(255,255,255,0.9),0 0 4px rgba(255,255,255,0.7)',
      'z-index:1',
    ].join(';');

    // Dot
    const dot = document.createElement('div');
    dot.style.cssText = [
      `width:${sz}px`,
      `height:${sz}px`,
      'border-radius:50%',
      `background:${col}`,
      `border:${d ? '2.5px' : '1.5px'} solid rgba(20,30,50,${d ? '0.7' : '0.3'})`,
      'box-shadow:0 2px 6px rgba(0,0,0,0.35)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:6.5px',
      'font-weight:800',
      'color:#fff',
      'text-shadow:0 1px 2px rgba(0,0,0,0.6)',
      'font-family:Inter,sans-serif',
      `opacity:${isPrimary ? '1' : '0.88'}`,
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

// ── Texas state outline (us-atlas TopoJSON via jsDelivr — already in CSP) ────
async function _mlAddTexasBorder() {
  if (!_mlMap) return;
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
    const us  = await res.json();
    if (typeof topojson === 'undefined') return;
    const texasFeature = topojson.feature(us, us.objects.states).features
      .find(f => String(f.id) === '48');
    if (!texasFeature || _mlMap.getSource('texas-border-src')) return;

    _mlMap.addSource('texas-border-src', { type: 'geojson', data: texasFeature });

    // Insert below existing weather-circle layers so they render on top
    const firstWeatherLayer = ['rain-layer', 'cloud-layer', 'severe-layer', 'drought-layer']
      .find(id => _mlMap.getLayer(id));

    _mlMap.addLayer({
      id: 'texas-fill', type: 'fill', source: 'texas-border-src',
      paint: { 'fill-color': '#4A90E2', 'fill-opacity': 0.06 },
    }, firstWeatherLayer);

    _mlMap.addLayer({
      id: 'texas-border', type: 'line', source: 'texas-border-src',
      paint: { 'line-color': '#2B6CB0', 'line-width': 2.5, 'line-opacity': 0.9 },
    }, firstWeatherLayer);
  } catch {
    // decorative — silently skip on network error
  }
}

// ── In-map floating legend (stays visible in fullscreen) ─────────────────────
function _mlAddInMapLegend() {
  const container = document.getElementById('texasSVG');
  if (!container || document.getElementById('ml-legend')) return;

  const legend = document.createElement('div');
  legend.id = 'ml-legend';
  legend.setAttribute('aria-label', 'Map legend');
  legend.innerHTML = `
    <div class="ml-legend-title">🌡 Temperature</div>
    <div class="ml-legend-row"><span class="ml-swatch" style="background:#4A90E2"></span>&lt;50°F Cool</div>
    <div class="ml-legend-row"><span class="ml-swatch" style="background:#5DDBA8"></span>50–75°F Mild</div>
    <div class="ml-legend-row"><span class="ml-swatch" style="background:#F8C06A"></span>75–90°F Warm</div>
    <div class="ml-legend-row"><span class="ml-swatch" style="background:#E87A7A"></span>&gt;90°F Hot</div>
    <div class="ml-legend-divider"></div>
    <div class="ml-legend-title">🌦 Weather Overlays</div>
    <div class="ml-legend-row"><span class="ml-swatch" style="background:rgba(21,101,212,0.65)"></span>Precipitation</div>
    <div class="ml-legend-row"><span class="ml-swatch" style="background:rgba(136,152,170,0.55)"></span>Cloud Cover</div>
    <div class="ml-legend-row"><span class="ml-swatch" style="background:rgba(139,26,26,0.7)"></span>Severe</div>
    <div class="ml-legend-row"><span class="ml-swatch" style="background:rgba(196,122,32,0.6)"></span>Drought</div>
    <div class="ml-legend-divider"></div>
    <div class="ml-legend-footer">● 100 cities — click any dot for forecast</div>
  `;
  container.appendChild(legend);
}

// ── Tooltip stubs (kept for backward compat with nav.js search) ───────────────
function showTooltip() {}
function hideTooltip() {}
