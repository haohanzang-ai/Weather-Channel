'use strict';

// Single chart instance for the Graph Builder tab
let _gbChart = null;

// ── Init — renders the full UI inside the container; safe to call on every tab activation ──
function graphBuilderInit(containerId) {
  const container = document.getElementById(containerId);
  if (!container || container.dataset.gbInited) return;
  container.dataset.gbInited = 'true';

  const cityOpts = CITIES.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  container.innerHTML = `
    <div class="gb-layout">

      <!-- ── Control panel ─────────────────────────────────────────── -->
      <aside class="gb-panel" role="complementary" aria-label="Chart configuration controls">
        <div class="gb-panel-header">⚙ Configure Chart</div>

        <div class="gb-section">
          <div class="gb-label" id="gb-lbl-type">Chart Type</div>
          <div class="gb-radios" role="radiogroup" aria-labelledby="gb-lbl-type">
            <label class="gb-radio"><input type="radio" name="gbChartType" value="line" checked>
              <span class="gb-radio-mark"></span><span class="gb-radio-text">📈 Line</span></label>
            <label class="gb-radio"><input type="radio" name="gbChartType" value="bar">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">📊 Bar</span></label>
            <label class="gb-radio"><input type="radio" name="gbChartType" value="scatter">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">⬤ Scatter</span></label>
            <label class="gb-radio"><input type="radio" name="gbChartType" value="area">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">📉 Area</span></label>
          </div>
        </div>

        <div class="gb-section">
          <div class="gb-label" id="gb-lbl-xaxis">X Axis</div>
          <div class="gb-radios" role="radiogroup" aria-labelledby="gb-lbl-xaxis">
            <label class="gb-radio"><input type="radio" name="gbXAxis" value="city" checked>
              <span class="gb-radio-mark"></span><span class="gb-radio-text">City — compare all 10</span></label>
            <label class="gb-radio"><input type="radio" name="gbXAxis" value="time">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">Time — 7-day forecast</span></label>
          </div>
        </div>

        <div class="gb-section">
          <div class="gb-label" id="gb-lbl-yaxis">Y Axis</div>
          <div class="gb-radios" role="radiogroup" aria-labelledby="gb-lbl-yaxis">
            <label class="gb-radio"><input type="radio" name="gbYAxis" value="temp" checked>
              <span class="gb-radio-mark"></span><span class="gb-radio-text">Temperature (°C)</span></label>
            <label class="gb-radio"><input type="radio" name="gbYAxis" value="humidity">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">Humidity (%)</span></label>
            <label class="gb-radio"><input type="radio" name="gbYAxis" value="wind">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">Wind Speed (km/h)</span></label>
            <label class="gb-radio"><input type="radio" name="gbYAxis" value="precip">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">Precipitation (mm)</span></label>
            <label class="gb-radio"><input type="radio" name="gbYAxis" value="aqi">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">AQI</span></label>
            <label class="gb-radio"><input type="radio" name="gbYAxis" value="et0">
              <span class="gb-radio-mark"></span><span class="gb-radio-text">ET₀ Evapotranspiration</span></label>
          </div>
        </div>

        <div class="gb-section" id="gb-city-row" style="display:none">
          <label class="gb-label" for="gb-city-sel">City</label>
          <select class="gb-select" id="gb-city-sel" aria-label="City for time-series view">
            ${cityOpts}
          </select>
        </div>

        <button class="gb-btn-primary" type="button"
                onclick="_gbGenerate()" aria-label="Generate chart from selected options">
          Generate Graph
        </button>
        <button class="gb-btn-secondary" type="button"
                onclick="_gbExport()" aria-label="Export current chart as PNG image">
          Export PNG
        </button>
      </aside>

      <!-- ── Chart area ─────────────────────────────────────────────── -->
      <div class="gb-chart-area">
        <div class="gb-empty" id="gb-empty-state">
          <div class="gb-empty-icon">📊</div>
          <div class="gb-empty-text">Configure the controls and click
            <strong>Generate Graph</strong></div>
        </div>
        <div class="gb-canvas-wrap" id="gb-canvas-wrap" style="display:none">
          <canvas id="gb-canvas" role="img" aria-label="Generated data chart"></canvas>
        </div>
      </div>

    </div>
  `;

  // Show / hide city picker based on X axis choice
  container.querySelectorAll('input[name="gbXAxis"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const row = document.getElementById('gb-city-row');
      if (row) row.style.display = radio.value === 'time' ? 'block' : 'none';
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _gbYLabel(metric) {
  const MAP = {
    temp:     'Temperature (°C)',
    humidity: 'Humidity (%)',
    wind:     'Wind Speed (km/h)',
    precip:   'Precipitation (mm)',
    aqi:      'Air Quality Index (AQI)',
    et0:      'ET₀ Evapotranspiration (mm/day)'
  };
  return MAP[metric] || metric;
}

function _gbCurrentVal(d, metric) {
  if (!d) return null;
  switch (metric) {
    case 'temp':     return d.temp      ?? null;
    case 'humidity': return d.humidity  ?? null;
    case 'wind':     return d.wind      ?? null;
    case 'precip':   return d.precipAvg ?? null;
    case 'aqi':      return d.aqi       ?? null;
    case 'et0':      return d.et0Avg    ?? null;
    default:         return null;
  }
}

function _gbForecastVal(entry, metric) {
  switch (metric) {
    case 'precip': return entry.precip ?? null;
    case 'et0':    return entry.et0    ?? null;
    // temp handled separately (hi/lo pair); humidity/wind/aqi not in daily forecast
    default:       return null;
  }
}

const _GBC1    = '#4A90E2';
const _GBC2    = '#5DDBA8';
const _GBF1    = 'rgba(74,144,226,0.15)';
const _GBF2    = 'rgba(93,219,168,0.10)';
const _GB_TEXT = 'rgba(255,255,255,0.64)'; // --text2
const _GB_GRID = 'rgba(255,255,255,0.06)';

function _gbAltColors(n) {
  return Array.from({ length: n }, (_, i) => i % 2 === 0 ? _GBC1 : _GBC2);
}

// ── Build Chart.js config object; returns null when metric lacks forecast data ──
function _gbBuildConfig(chartType, xAxis, metric, city) {
  const monoFont  = { family: "'JetBrains Mono', monospace", size: 11 };
  const labelFont = { family: "'Inter', sans-serif",         size: 11 };

  const isBar     = chartType === 'bar';
  const isScatter = chartType === 'scatter';
  const isArea    = chartType === 'area';
  const cjsType   = isArea ? 'line' : chartType;

  let labels   = [];
  let datasets = [];

  /* ── City axis: compare current readings across all 10 cities ── */
  if (xAxis === 'city') {
    labels = CITIES.map(c => c.name);
    const vals = CITIES.map(c => _gbCurrentVal(WEATHER_DATA[c.name], metric));

    if (isScatter) {
      datasets = [{
        label: _gbYLabel(metric),
        data: vals.map((v, i) => ({ x: i, y: v })),
        backgroundColor: _gbAltColors(labels.length),
        pointRadius: 7, pointHoverRadius: 10
      }];
    } else if (isBar) {
      datasets = [{
        label: _gbYLabel(metric),
        data: vals,
        backgroundColor: _gbAltColors(labels.length),
        borderColor: 'transparent', borderWidth: 0, borderRadius: 4
      }];
    } else {
      // line / area
      datasets = [{
        label: _gbYLabel(metric),
        data: vals,
        borderColor: _GBC1, backgroundColor: _GBF1, borderWidth: 2,
        fill: isArea, tension: 0.35,
        pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: _GBC1
      }];
    }

  /* ── Time axis: 7-day forecast for one city ── */
  } else {
    const fc = FORECAST_DATA[city] || [];
    if (!fc.length) return null;
    labels = fc.map(d => d.day);

    if (metric === 'temp') {
      // Two series: high + low
      if (isScatter) {
        datasets = [
          { label: 'High (°C)', data: fc.map((d, i) => ({ x: i, y: d.hi })),
            backgroundColor: _GBC1, pointRadius: 7, pointHoverRadius: 10 },
          { label: 'Low (°C)',  data: fc.map((d, i) => ({ x: i, y: d.lo })),
            backgroundColor: _GBC2, pointRadius: 7, pointHoverRadius: 10 }
        ];
      } else if (isBar) {
        datasets = [
          { label: 'High (°C)', data: fc.map(d => d.hi),
            backgroundColor: _GBC1, borderColor: 'transparent', borderWidth: 0, borderRadius: 4 },
          { label: 'Low (°C)',  data: fc.map(d => d.lo),
            backgroundColor: _GBC2, borderColor: 'transparent', borderWidth: 0, borderRadius: 4 }
        ];
      } else {
        datasets = [
          { label: 'High (°C)', data: fc.map(d => d.hi),
            borderColor: _GBC1, backgroundColor: _GBF1, borderWidth: 2,
            fill: isArea, tension: 0.35,
            pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: _GBC1 },
          { label: 'Low (°C)',  data: fc.map(d => d.lo),
            borderColor: _GBC2, backgroundColor: _GBF2, borderWidth: 2,
            fill: isArea ? '-1' : false, tension: 0.35,
            pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: _GBC2 }
        ];
      }
    } else {
      const vals = fc.map(d => _gbForecastVal(d, metric));
      if (!vals.some(v => v !== null)) return null; // not in daily forecast

      if (isScatter) {
        datasets = [{
          label: _gbYLabel(metric),
          data: fc.map((d, i) => ({ x: i, y: _gbForecastVal(d, metric) })),
          backgroundColor: _GBC1, pointRadius: 7, pointHoverRadius: 10
        }];
      } else if (isBar) {
        datasets = [{
          label: _gbYLabel(metric),
          data: vals,
          backgroundColor: _gbAltColors(vals.length),
          borderColor: 'transparent', borderWidth: 0, borderRadius: 4
        }];
      } else {
        datasets = [{
          label: _gbYLabel(metric),
          data: vals,
          borderColor: _GBC1, backgroundColor: _GBF1, borderWidth: 2,
          fill: isArea, tension: 0.35,
          pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: _GBC1
        }];
      }
    }
  }

  // X-axis tick callback for scatter (which uses numeric x values)
  const scatterXTick = (val) => {
    const idx = Math.round(val);
    if (xAxis === 'city') return CITIES[idx]?.name.split(' ')[0] || '';
    const sel = document.getElementById('gb-city-sel')?.value || CITIES[0].name;
    return (FORECAST_DATA[sel] || [])[idx]?.day || '';
  };

  const xScale = isScatter ? {
    type: 'linear',
    ticks: { color: _GB_TEXT, font: monoFont, stepSize: 1, callback: scatterXTick },
    grid:  { color: _GB_GRID },
    border:{ color: 'transparent' }
  } : {
    ticks: { color: _GB_TEXT, font: monoFont, maxRotation: 40, autoSkip: true },
    grid:  { color: _GB_GRID },
    border:{ color: 'transparent' }
  };

  return {
    type: isScatter ? 'scatter' : cjsType,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 450, easing: 'easeOutQuart' },
      layout: { padding: { top: 10, right: 18, bottom: 6, left: 6 } },
      plugins: {
        legend: {
          display: datasets.length > 1,
          labels: {
            color: _GB_TEXT,
            font: { family: "'Inter', sans-serif", size: 12 },
            boxWidth: 12, padding: 16
          }
        },
        tooltip: {
          backgroundColor: 'rgba(11,22,35,0.93)',
          borderColor:     'rgba(74,144,226,0.40)',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor:  _GB_TEXT,
          titleFont: { family: "'Inter', sans-serif", weight: '600', size: 12 },
          bodyFont:  { family: "'Inter', sans-serif", size: 12 },
          padding: 10, cornerRadius: 8, displayColors: true
        }
      },
      scales: {
        x: xScale,
        y: {
          ticks: { color: _GB_TEXT, font: monoFont },
          grid:  { color: _GB_GRID },
          border:{ color: 'transparent' },
          title: {
            display: true,
            text: _gbYLabel(metric),
            color: _GB_TEXT,
            font: labelFont,
            padding: { bottom: 4 }
          }
        }
      }
    }
  };
}

// ── Generate ──────────────────────────────────────────────────────────────────
function _gbGenerate() {
  const empty  = document.getElementById('gb-empty-state');
  const wrap   = document.getElementById('gb-canvas-wrap');
  const canvas = document.getElementById('gb-canvas');
  if (!empty || !wrap || !canvas) return;

  if (!dataLoaded) {
    empty.style.display = 'flex';
    empty.setAttribute('aria-hidden', 'false');
    empty.innerHTML = '<div class="gb-empty-icon">⏳</div>' +
      '<div class="gb-empty-text">Weather data is still loading — please wait a moment and try again.</div>';
    return;
  }

  const chartType = document.querySelector('input[name="gbChartType"]:checked')?.value || 'line';
  const xAxis     = document.querySelector('input[name="gbXAxis"]:checked')?.value    || 'city';
  const metric    = document.querySelector('input[name="gbYAxis"]:checked')?.value    || 'temp';
  const city      = document.getElementById('gb-city-sel')?.value || CITIES[0].name;

  const config = _gbBuildConfig(chartType, xAxis, metric, city);

  if (!config) {
    empty.style.display = 'flex';
    empty.setAttribute('aria-hidden', 'false');
    empty.innerHTML = `<div class="gb-empty-icon">⚠</div>` +
      `<div class="gb-empty-text"><strong>${_gbYLabel(metric)}</strong> is only available as ` +
      `a current reading — it isn't in the 7-day forecast. Switch <strong>X Axis</strong> ` +
      `to <strong>City</strong> to compare it across all 10 cities.</div>`;
    wrap.style.display = 'none';
    return;
  }

  if (_gbChart) { _gbChart.destroy(); _gbChart = null; }

  empty.style.display = 'none';
  empty.setAttribute('aria-hidden', 'true');
  wrap.style.display  = 'block';

  _gbChart = new Chart(canvas, config);
}

// ── Export PNG ────────────────────────────────────────────────────────────────
function _gbExport() {
  if (!_gbChart) {
    const empty = document.getElementById('gb-empty-state');
    if (empty) {
      empty.style.display = 'flex';
      empty.setAttribute('aria-hidden', 'false');
      empty.innerHTML = '<div class="gb-empty-icon">⚠</div>' +
        '<div class="gb-empty-text">Generate a chart first, then export it.</div>';
    }
    return;
  }
  const url = _gbChart.toBase64Image('image/png', 1);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = 'texasclimate-graph.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
