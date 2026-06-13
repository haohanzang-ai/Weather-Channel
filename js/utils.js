'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let selectedCity = null;
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
