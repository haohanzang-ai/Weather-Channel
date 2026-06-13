'use strict';

// ── Agriculture ───────────────────────────────────────────────────────────────
function renderAg(){
  document.getElementById('agContent').innerHTML=`
    <div class="grid-2" style="margin-bottom:16px">
      <div class="card">
        <h3 class="section-title">Regional Crop Conditions</h3>
        ${AG_DATA.map(a=>`
          <div class="ag-status">
            <div class="ag-label">${escapeHtml(a.label)}</div>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:80px"><div class="progress-bar" role="meter" aria-valuenow="${a.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(a.label)}: ${a.pct}%"><div class="progress-fill" style="width:${a.pct}%;background:${a.color}"></div></div></div>
              <span class="badge" style="background:${a.color}22;color:${a.color}">${escapeHtml(a.value)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div>
        <div class="card card-danger" style="margin-bottom:12px">
          <div class="stat-label">Drought Coverage</div>
          <div class="stat-value" style="color:#E87A7A">63<span class="stat-unit">%</span></div>
          <div class="stat-sub">of Texas in drought conditions</div>
          <div style="margin-top:10px"><div class="progress-bar" role="meter" aria-valuenow="63" aria-valuemin="0" aria-valuemax="100" aria-label="63% drought coverage"><div class="progress-fill" style="width:63%;background:#D64545"></div></div></div>
        </div>
        <div class="card card-orange" style="margin-bottom:12px">
          <div class="stat-label">Irrigation Demand Index</div>
          <div class="stat-value" style="color:#F8C06A">8.2<span class="stat-unit">/10</span></div>
          <div class="stat-sub">High demand — South &amp; Central TX</div>
        </div>
        <div class="card card-success">
          <div class="stat-label">Best Growing Region</div>
          <div class="stat-value" style="font-size:18px;color:#5DDBA8">East Texas</div>
          <div class="stat-sub">Adequate moisture, mild temps</div>
        </div>
      </div>
    </div>
    <div class="card">
      <h3 class="section-title">Crop-by-Crop Outlook</h3>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px">
        ${[
          {crop:'🌾 Cotton',status:'Moderate',color:'#F5A623'},
          {crop:'🌽 Corn',status:'Concerning',color:'#D64545'},
          {crop:'🌿 Sorghum',status:'Good',color:'#2ECC8B'},
          {crop:'🥜 Peanuts',status:'Moderate',color:'#F5A623'},
          {crop:'🌻 Sunflower',status:'Good',color:'#2ECC8B'},
          {crop:'🍅 Vegetables',status:'Excellent',color:'#2ECC8B'},
          {crop:'🐄 Pasture',status:'Severe',color:'#D64545'},
          {crop:'🌵 Rangelands',status:'Concerning',color:'#D64545'}
        ].map(c=>{const [emoji,...name]=c.crop.split(' ');return`<div class="card" style="text-align:center;padding:12px">
          <div style="font-size:22px;margin-bottom:6px" aria-hidden="true">${emoji}</div>
          <div style="font-size:11px;color:var(--text1);margin-bottom:6px">${name.join(' ')}</div>
          <span class="badge" style="background:${c.color}22;color:${c.color}">${c.status}</span>
        </div>`}).join('')}
      </div>
    </div>
  `;
}
