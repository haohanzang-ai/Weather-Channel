'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let selectedCity = null;

// ── API Status tracking ───────────────────────────────────────────────────────
const API_STATUS = {
  weather: 'pending', // 'ok' | 'fail' | 'pending'
  aqi:     'pending',
  nws:     'pending', // updated by severe.js when user visits that tab
  lastUpdate: null,
  hasDemoData: false
};

// ── Data badge helper ─────────────────────────────────────────────────────────
/* Legacy provenance badge, kept for the older panels that still call it.
   New code should use tcStatusBadge() from science-constants.js, which is tied
   to the six-value TC_STATUS vocabulary.

   Two corrections were made here during the science audit:
     · 'ai-est' rendered as "AI Estimate". Nothing labelled with this badge is
       produced by a model: the composites are weighted arithmetic and the
       assistant is rule-based intent matching. (The app DOES run one real
       neural network — MobileNet v2, locally, to suggest a species from a
       photo — but no value carrying this badge comes from it.) It now renders
       as EXPERIMENTAL, which is what these values always were.
     · 'live-derived' was used at one call site but was never a key in this map,
       so it silently fell through to "Unknown". Both spellings now resolve. */
function dataBadge(type) {
  const map = {
    'live-api':     ['Live API',     'badge-live-api',
                     'Fetched live this session. Gridded model output interpolated to the coordinates, not a sensor at the site.'],
    'live-drv':     ['Live-Derived', 'badge-live-drv',
                     'Calculated from live inputs using a documented equation.'],
    'live-derived': ['Live-Derived', 'badge-live-drv',
                     'Calculated from live inputs using a documented equation.'],
    'official':     ['Official Link','badge-official', 'Links to an official government or agency source.'],
    'peer-rev':     ['Peer-Reviewed','badge-peer-rev', 'Published in the peer-reviewed literature and cited.'],
    'ai-est':       ['Experimental', 'badge-ai-est',
                     'A TexasClimate heuristic: a weighted sum of author-chosen values. Not calibrated and not validated. No model produced it.'],
    'experimental': ['Experimental', 'badge-ai-est',
                     'A TexasClimate heuristic. Not calibrated and not validated.'],
    'demo':         ['Demo / Fallback','badge-demo-fb', 'Illustrative content, not live data.'],
    'edu':          ['Educational',  'badge-edu-only', 'Explanatory content, not a measurement.'],
    'na':           ['Unavailable',  'badge-na',       'Not available. Left blank rather than filled with a default.'],
  };
  const entry = map[type];
  if (!entry) {
    // Fail loudly in the console rather than quietly rendering "Unknown" — a
    // mislabelled provenance badge is worse than a missing one.
    console.warn('[TexasClimate] dataBadge: unknown type "' + type + '"');
    return `<span class="data-badge badge-na" title="Provenance label missing for this value.">Unlabelled</span>`;
  }
  const [label, cls, desc] = entry;
  return `<span class="data-badge ${cls}" title="${String(desc).replace(/"/g,'&quot;')}">${label}</span>`;
}
/* ── Display units ────────────────────────────────────────────────────────────
   These read the unit WEATHER_DATA was actually FETCHED in, not the unit
   currently selected in settings. The data is fetched once at load and a
   settings change does not retroactively convert it, so labelling by the live
   setting produced Celsius values labelled "°F" (and an aria-label reading
   "degrees Fahrenheit") until the next refresh. Every consumer of WEATHER_DATA
   should label through these rather than hard-coding a unit. */
function wxIsMetric(){
  const u = (typeof WEATHER_UNITS_FETCHED !== 'undefined' && WEATHER_UNITS_FETCHED)
    ? WEATHER_UNITS_FETCHED
    : (typeof getSetting === 'function' ? getSetting('units') : 'imperial');
  return u === 'metric';
}
function tUnit(){ return wxIsMetric() ? '°C' : '°F'; }
function wUnit(){ return wxIsMetric() ? 'km/h' : 'mph'; }
function tUnitWord(){ return wxIsMetric() ? 'degrees Celsius' : 'degrees Fahrenheit'; }

/* Convert a WEATHER_DATA temperature to °F for THRESHOLD COMPARISONS.
   Every threshold in this app is written in Fahrenheit (a 65 °F cooling-degree
   base, 95/100/105 °F heat bands, crop limits). WEATHER_DATA, however, is
   fetched in whatever unit the user selected — so in metric mode those
   comparisons were being made against Celsius values. Nothing errored: the
   cooling-degree index simply sat at 0 forever because no Celsius reading
   exceeds 65, and a 38 °C afternoon reported "moderate conditions".

   Labels alone could not fix this; the numbers had to be normalised. Compare
   through this helper, and display through tUnit(). */
function wxTempF(t){
  if (t == null || !isFinite(t)) return null;
  return wxIsMetric() ? (t * 9 / 5 + 32) : t;
}

const charts = new Map();
let mapRendered = false;
let searchTimer = null;

// ── Utils ─────────────────────────────────────────────────────────────────────
function escapeHtml(s){
  if(s == null) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(s)));
  return d.innerHTML;
}

// ── Shared custom select builder ──────────────────────────────────────────────
// Replaces any native <select> with a fully-styled dark panel.
// opts: { wrapperId, placeholder, groups:[{label,color,items:[{value,text,subtext}]}], onChange(value,text) }
function buildCustomSelect(opts) {
  const wrap = document.getElementById(opts.wrapperId);
  if (!wrap) return;
  wrap.classList.add('pcs-wrap');

  const rows = opts.groups.map(g => {
    const hdr = g.label
      ? `<div class="pcs-group-header"${g.color?` style="border-left:3px solid ${g.color}"`:''}>${escapeHtml(g.label)}</div>`
      : '';
    return hdr + (g.items||[]).map(item => {
      const dot  = g.color ? `<span class="pcs-dot" style="background:${g.color}"></span>` : '';
      const sci  = item.subtext ? `<span class="pcs-sci">${escapeHtml(item.subtext)}</span>` : '';
      return `<div class="pcs-option" role="option"
                   data-csval="${escapeHtml(String(item.value))}"
                   data-cstext="${escapeHtml(String(item.text))}"
                   data-cswrap="${escapeHtml(opts.wrapperId)}">
                ${dot}<span class="pcs-name">${escapeHtml(item.text)}</span>${sci}
              </div>`;
    }).join('');
  }).join('');

  wrap.innerHTML = `
    <div class="pcs-trigger" id="${opts.wrapperId}_trigger" tabindex="0"
         role="combobox" aria-haspopup="listbox" aria-expanded="false">
      <span class="pcs-value" id="${opts.wrapperId}_val">${escapeHtml(opts.placeholder||'—')}</span>
      <span class="pcs-chevron">&#9662;</span>
    </div>
    <div class="pcs-panel" id="${opts.wrapperId}_panel" role="listbox" style="display:none">${rows}</div>`;

  wrap._csOnChange = opts.onChange;

  document.getElementById(opts.wrapperId + '_trigger').addEventListener('click', () => _csTog(opts.wrapperId));
  document.getElementById(opts.wrapperId + '_trigger').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _csTog(opts.wrapperId); }
  });
  document.getElementById(opts.wrapperId + '_panel').addEventListener('click', e => {
    const opt = e.target.closest('.pcs-option');
    if (opt && opt.dataset.cswrap === opts.wrapperId)
      _csSelect(opts.wrapperId, opt.dataset.csval, opt.dataset.cstext);
  });
  // Close when clicking outside
  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) _csClose(opts.wrapperId);
  }, { capture: true });
}

function _csTog(id) {
  const panel   = document.getElementById(id + '_panel');
  const trigger = document.getElementById(id + '_trigger');
  if (!panel) return;
  const open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  trigger?.classList.toggle('open', !open);
  trigger?.setAttribute('aria-expanded', String(!open));
  if (!open) { const s = panel.querySelector('.pcs-option.selected'); if (s) s.scrollIntoView({ block:'nearest' }); }
}

function _csClose(id) {
  const panel   = document.getElementById(id + '_panel');
  const trigger = document.getElementById(id + '_trigger');
  if (panel)  panel.style.display = 'none';
  trigger?.classList.remove('open');
  trigger?.setAttribute('aria-expanded', 'false');
}

function _csSelect(id, value, text) {
  const wrap    = document.getElementById(id);
  const panel   = document.getElementById(id + '_panel');
  const trigger = document.getElementById(id + '_trigger');
  const valEl   = document.getElementById(id + '_val');
  if (valEl)  valEl.textContent = text;
  panel?.querySelectorAll('.pcs-option').forEach(el => el.classList.toggle('selected', el.dataset.csval === value));
  if (panel)  panel.style.display = 'none';
  trigger?.classList.remove('open');
  trigger?.setAttribute('aria-expanded', 'false');
  if (wrap?._csOnChange) wrap._csOnChange(value, text);
}

function getTempColor(t){
  // Breakpoints are °F; normalise so colours are correct in metric too.
  const f = wxTempF(t);
  if(f == null) return 'var(--text3)';
  if(f < 50) return '#4A90E2';
  if(f < 75) return '#2ECC8B';
  if(f < 90) return '#F5A623';
  return '#D64545';
}

function getAQILabel(aqi){
  if(aqi <= 50)  return {label:'Good',        color:'#5DDBA8'};
  if(aqi <= 100) return {label:'Moderate',     color:'#F8C06A'};
  if(aqi <= 150) return {label:'Sensitive Grp',color:'#F8C06A'};
  return              {label:'Unhealthy',    color:'#E87A7A'};
}

function announce(msg){
  const el = document.getElementById('sr-announcer');
  if(el){ el.textContent = ''; requestAnimationFrame(()=>{ el.textContent = msg; }); }
}

function chartOpts(yCallback){
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'rgba(255,255,255,0.55)',font:{size:10}}}},
    scales:{
      x:{ticks:{color:'rgba(255,255,255,0.45)',font:{size:9},maxRotation:45},grid:{color:'rgba(255,255,255,0.04)'}},
      y:{ticks:{color:'rgba(255,255,255,0.45)',callback:yCallback},grid:{color:'rgba(255,255,255,0.04)'}}
    }
  };
}

function destroyChart(key){ charts.get(key)?.destroy(); charts.delete(key); }

/* Mount a chart once its canvas has real width.
   Chart.js is a CDN dependency; if it did not load, every caller of this helper
   would otherwise throw "Chart is not defined" and take its whole tab down. One
   guard here covers every chart in the app: the canvas is replaced with a plain
   statement of what is missing, and the rest of the page keeps working. */
function whenReady(canvasId, buildFn){
  const attempt = ()=>{
    const el = document.getElementById(canvasId);
    if (el && typeof Chart === 'undefined') { chartUnavailable(el); return; }
    if(el && el.offsetWidth > 0){ buildFn(el); }
    else { requestAnimationFrame(attempt); }
  };
  requestAnimationFrame(attempt);
}

/* Replace a chart canvas with an honest explanation. Never a blank box: a blank
   box reads as "no data", which is a different and misleading claim. */
function chartUnavailable(canvasEl){
  if (!canvasEl || !canvasEl.parentElement) return;
  if (canvasEl.parentElement.querySelector('.chart-unavailable')) return;
  const box = document.createElement('div');
  box.className = 'chart-unavailable';
  box.setAttribute('role', 'status');
  box.innerHTML = '<strong>Chart library unavailable</strong>' +
    '<span>Chart.js is loaded from a CDN and that request did not complete, ' +
    'usually because the network is blocking it. The underlying numbers are ' +
    'unaffected and are shown elsewhere on this page.</span>';
  canvasEl.style.display = 'none';
  canvasEl.parentElement.appendChild(box);
}
