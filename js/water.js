'use strict';

// ── Water ─────────────────────────────────────────────────────────────────────
function renderWater(){
  const reservoirs=[
    {name:'Lake Travis',pct:38,status:'Low'},{name:'Lake Buchanan',pct:42,status:'Low'},
    {name:'Falcon Reservoir',pct:22,status:'Critical'},{name:'Sam Rayburn',pct:78,status:'Normal'},
    {name:'Toledo Bend',pct:82,status:'Normal'},{name:'Amistad',pct:31,status:'Low'},
    {name:'Lake Texoma',pct:65,status:'Normal'},{name:'Richland Chambers',pct:71,status:'Normal'}
  ];
  document.getElementById('waterContent').innerHTML=`
    <div class="alert-banner" role="alert" style="margin-bottom:16px"><span aria-hidden="true">💧</span> <strong>Drought Alert:</strong> 63% of Texas in drought — Stage 2 restrictions in effect for Hill Country &amp; South Texas.</div>
    <div class="grid-2" style="margin-bottom:14px">
      <div class="card">
        <h3 class="section-title">Reservoir Storage Levels</h3>
        ${reservoirs.map(r=>{const col=r.pct<30?'#D64545':r.pct<50?'#F5A623':'#2ECC8B';return`
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px">
              <span style="color:var(--text1)">${escapeHtml(r.name)}</span>
              <span style="color:${col};font-weight:700">${r.pct}% · ${escapeHtml(r.status)}</span>
            </div>
            <div class="progress-bar" role="meter" aria-valuenow="${r.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(r.name)}: ${r.pct}% capacity"><div class="progress-fill" style="width:${r.pct}%;background:${col}"></div></div>
          </div>
        `}).join('')}
      </div>
      <div>
        <div class="card card-orange" style="margin-bottom:12px"><div class="stat-label">Drought Severity</div><div class="stat-value" style="color:#F8C06A">D2–D3</div><div class="stat-sub">Severe to Extreme — S. Texas</div></div>
        <div class="card" style="margin-bottom:12px"><div class="stat-label">Statewide Avg Reservoir</div><div class="stat-value">54<span class="stat-unit">%</span></div><div class="stat-sub">Below 10yr average of 71%</div></div>
        <div class="card card-blue"><div class="stat-label">Groundwater Recharge</div><div class="stat-value" style="font-size:18px">Low</div><div class="stat-sub">Ogallala Aquifer declining</div></div>
      </div>
    </div>
    <div class="card">
      <h3 class="section-title">Conservation Recommendations</h3>
      <div class="grid-3" style="margin-top:10px">
        ${[
          {region:'Hill Country',stage:'Stage 2',cls:'badge-orange',tip:'Outdoor watering 2×/week max'},
          {region:'South Texas',stage:'Stage 3',cls:'badge-red',tip:'No landscape irrigation. Indoor use only.'},
          {region:'West Texas',stage:'Stage 2',cls:'badge-orange',tip:'Odd/even watering restrictions'},
          {region:'Panhandle',stage:'Stage 1',cls:'badge-blue',tip:'Voluntary 10% reduction requested'},
          {region:'East Texas',stage:'Normal',cls:'badge-green',tip:'No restrictions in effect'},
          {region:'Gulf Coast',stage:'Stage 1',cls:'badge-blue',tip:'Voluntary conservation encouraged'}
        ].map(r=>`<div class="card"><div style="font-size:11px;font-weight:700;color:var(--text0);margin-bottom:6px">${escapeHtml(r.region)}</div><span class="badge ${r.cls}" style="margin-bottom:8px">${escapeHtml(r.stage)}</span><div style="font-size:10px;color:var(--text2)">${escapeHtml(r.tip)}</div></div>`).join('')}
      </div>
    </div>
  `;
}
