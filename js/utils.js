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
function dataBadge(type) {
  const map = {
    'live-api': ['Live API',        'badge-live-api'],
    'live-drv': ['Live-Derived',    'badge-live-drv'],
    'official': ['Official Link',   'badge-official'],
    'peer-rev': ['Peer-Reviewed',   'badge-peer-rev'],
    'ai-est':   ['AI Estimate',     'badge-ai-est'],
    'demo':     ['Demo / Fallback', 'badge-demo-fb'],
    'edu':      ['Educational',     'badge-edu-only'],
    'na':       ['Unavailable',     'badge-na'],
  };
  const [label, cls] = map[type] || ['Unknown', 'badge-na'];
  return `<span class="data-badge ${cls}" title="Data type: ${label}">${label}</span>`;
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
  if(t < 50) return '#4A90E2';
  if(t < 75) return '#2ECC8B';
  if(t < 90) return '#F5A623';
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

function whenReady(canvasId, buildFn){
  const attempt = ()=>{
    const el = document.getElementById(canvasId);
    if(el && el.offsetWidth > 0){ buildFn(el); }
    else { requestAnimationFrame(attempt); }
  };
  requestAnimationFrame(attempt);
}
