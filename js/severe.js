'use strict';

// ── Severe Weather — Live NWS API ─────────────────────────────────────────────
async function renderSevere(){
  const el = document.getElementById('severeContent');
  el.innerHTML = '<div class="card loading-shimmer" style="height:80px;margin-bottom:10px"></div>'.repeat(4);

  let alerts = [];
  try {
    const res = await fetch('https://api.weather.gov/alerts/active?area=TX', {
      headers:{'Accept':'application/geo+json','User-Agent':'TexasClimate/1.0'}
    });
    if(!res.ok) throw new Error(`NWS ${res.status}`);
    const data = await res.json();
    alerts = data.features || [];
  } catch(err){
    el.innerHTML = `
      <div class="card card-danger">
        <div class="insight-tag">⚠️ NWS Feed Unavailable</div>
        <div class="insight-text">Could not reach the National Weather Service API. Visit <a href="https://alerts.weather.gov" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">alerts.weather.gov</a> for current Texas alerts.</div>
      </div>`;
    return;
  }

  const sevClass = s => s==='Extreme'||s==='Severe'?'badge-red':s==='Moderate'?'badge-orange':'badge-blue';
  const fmtExp   = iso => iso ? new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
  const fmtArea  = desc => (desc||'').split(';').slice(0,3).map(s=>s.trim()).join(' · ');

  const extreme  = alerts.filter(a=>['Extreme','Severe'].includes(a.properties.severity));
  const moderate = alerts.filter(a=>a.properties.severity==='Moderate');

  // Regional alert mapping — check NWS area descriptions
  const regions = [
    {label:'Panhandle',   keys:['Panhandle','Amarillo','Randall','Potter','Moore','Carson']},
    {label:'N. Texas',    keys:['Dallas','Fort Worth','Denton','Collin','Tarrant','Wise','Parker']},
    {label:'Central TX',  keys:['Austin','Travis','Williamson','Bell','Waco','McLennan','Bexar','San Antonio']},
    {label:'Houston',     keys:['Houston','Harris','Fort Bend','Montgomery','Galveston','Brazoria']},
    {label:'S. Texas',    keys:['Corpus','Nueces','Webb','Laredo','McAllen','Hidalgo','Cameron']},
    {label:'W. Texas',    keys:['El Paso','Midland','Odessa','Ector','Lubbock','Reeves','Presidio']}
  ];
  const regionActivity = regions.map(({label, keys}) => {
    const hits = alerts.filter(a => keys.some(k=>(a.properties.areaDesc||'').includes(k)));
    const maxSev = hits.reduce((m,a)=>Math.max(m,{Extreme:90,Severe:70,Moderate:40,Minor:15}[a.properties.severity]||0),0);
    return {label, prob:maxSev, count:hits.length};
  });

  el.innerHTML = `
    <div role="region" aria-label="Active weather alerts" style="margin-bottom:16px">
      ${alerts.length===0
        ? '<div class="alert-banner" style="background:rgba(46,204,139,0.1);border-color:#2ECC8B;color:#5DDBA8" role="status"><span aria-hidden="true">✅</span> <strong>No Active Alerts</strong> — Conditions are currently calm across Texas.</div>'
        : [
            ...extreme.slice(0,4).map(a=>`<div class="alert-banner" role="alert"><span aria-hidden="true">⚠️</span> <strong>${escapeHtml(a.properties.event)}</strong> — ${escapeHtml(fmtArea(a.properties.areaDesc))}</div>`),
            ...moderate.slice(0,2).map(a=>`<div class="info-banner" role="note"><span aria-hidden="true">ℹ️</span> <strong>${escapeHtml(a.properties.event)}</strong> — ${escapeHtml(fmtArea(a.properties.areaDesc))}</div>`)
          ].join('')
      }
    </div>
    <div class="grid-2" style="margin-bottom:14px">
      <div class="card">
        <h3 class="section-title">NWS Active Alerts — Texas <span style="color:var(--text3);font-weight:400">(${alerts.length} total)</span></h3>
        ${alerts.length===0
          ? '<div style="color:var(--text2);font-size:12px;padding:24px 0;text-align:center">✅ No active watches, warnings, or advisories for Texas.</div>'
          : alerts.slice(0,10).map(a=>{
              const p=a.properties;
              return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
                <span class="badge ${sevClass(p.severity)}" style="flex-shrink:0;width:72px;justify-content:center;font-size:9px">${escapeHtml(p.severity)}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:700;color:var(--text0);margin-bottom:2px">${escapeHtml(p.event)}</div>
                  <div style="font-size:10px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(fmtArea(p.areaDesc))}</div>
                  <div style="font-size:10px;color:var(--text3);margin-top:2px">Expires: ${escapeHtml(fmtExp(p.expires))}</div>
                </div>
              </div>`;
            }).join('')
        }
        ${alerts.length>10?`<div style="font-size:10px;color:var(--text3);padding-top:8px">+${alerts.length-10} more — <a href="https://alerts.weather.gov/cap/tx.php?x=0" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">view all at weather.gov →</a></div>`:''}
      </div>
      <div class="card">
        <h3 class="section-title">Alert Intensity by Region</h3>
        <div style="padding:10px 0">
          ${regionActivity.map(({label,prob,count})=>{
            const col=prob>=70?'#D64545':prob>=40?'#F5A623':prob>0?'#4A90E2':'#2ECC8B';
            const lbl=prob===0?'Clear':prob<30?'Advisory':prob<60?'Watch':'Warning';
            return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:11px">
              <div style="width:90px;font-size:10px;text-align:right;color:var(--text1)">${escapeHtml(label)}</div>
              <div style="flex:1">
                <div class="progress-bar" role="meter" aria-valuenow="${prob}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(label)}: ${lbl}">
                  <div class="progress-fill" style="width:${prob||3}%;background:${col}"></div>
                </div>
              </div>
              <div style="width:64px;font-size:11px;font-weight:700;color:${col}">${escapeHtml(lbl)}${count>0?` (${count})`:''}</div>
            </div>`;
          }).join('')}
        </div>
        <div style="font-size:10px;color:var(--text3);margin-top:8px">Intensity derived from NWS severity classifications for each region.</div>
      </div>
    </div>
    <div class="card card-blue">
      <div class="insight-tag">📡 Source: National Weather Service — api.weather.gov</div>
      <div class="insight-text"><strong>${alerts.length}</strong> active alert${alerts.length!==1?'s':''} for Texas as of <strong>${new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</strong>. Data is official NOAA/NWS and updates in real time. <a href="https://www.weather.gov/ewx/" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">Full NWS forecast →</a> &nbsp;·&nbsp; <a href="https://www.weather.gov/lch/" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">Houston NWS office →</a></div>
    </div>`;
}
