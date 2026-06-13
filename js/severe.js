'use strict';

// ── Severe weather ────────────────────────────────────────────────────────────
function renderSevere(){
  document.getElementById('severeContent').innerHTML=`
    <div style="margin-bottom:16px" role="region" aria-label="Active weather alerts">
      <div class="alert-banner" role="alert"><span aria-hidden="true">🌪</span> <strong>Tornado Watch</strong> — N. Texas &amp; Red River Valley through 10 PM CDT. 15% tornado probability.</div>
      <div class="alert-banner" role="alert"><span aria-hidden="true">🌊</span> <strong>Flash Flood Warning</strong> — Houston Metro. River gauges rising. Move to higher ground.</div>
      <div class="info-banner" role="note"><span aria-hidden="true">☀️</span> <strong>Excessive Heat Warning</strong> — West Texas &amp; Trans-Pecos. Highs 105–110°F.</div>
      <div class="info-banner" role="note"><span aria-hidden="true">💨</span> <strong>Wind Advisory</strong> — Panhandle &amp; South Plains. Gusts to 50 mph.</div>
    </div>
    <div class="grid-2" style="margin-bottom:14px">
      <div class="card">
        <h3 class="section-title">Active Watches &amp; Warnings</h3>
        ${[
          {type:'Tornado Watch',area:'N. Texas',expires:'10 PM CDT',cls:'badge-red'},
          {type:'Flash Flood Warning',area:'Houston Metro',expires:'3 AM CDT',cls:'badge-red'},
          {type:'Heat Warning',area:'West Texas',expires:'8 PM Sat',cls:'badge-orange'},
          {type:'Wind Advisory',area:'Panhandle',expires:'6 PM CDT',cls:'badge-orange'},
          {type:'Rip Current Statement',area:'Gulf Coast',expires:'Tonight',cls:'badge-blue'}
        ].map(w=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
          <span class="badge ${w.cls}" style="width:136px;justify-content:center">${escapeHtml(w.type)}</span>
          <div style="flex:1"><div style="font-size:11px;color:var(--text0)">${escapeHtml(w.area)}</div><div style="font-size:10px;color:var(--text2)">Expires: ${escapeHtml(w.expires)}</div></div>
        </div>`).join('')}
      </div>
      <div class="card">
        <h3 class="section-title">Storm Probability (Next 24h)</h3>
        <div style="padding:14px 0">
          ${['Panhandle','N. Texas','Central TX','Houston','S. Texas','W. Texas'].map((r,i)=>{const probs=[35,65,25,85,15,10];const col=probs[i]>60?'#D64545':probs[i]>30?'#F5A623':'#2ECC8B';return`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <div style="width:90px;font-size:10px;text-align:right;color:var(--text1)">${escapeHtml(r)}</div>
              <div style="flex:1"><div class="progress-bar" role="meter" aria-valuenow="${probs[i]}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(r)}: ${probs[i]}% storm probability"><div class="progress-fill" style="width:${probs[i]}%;background:${col}"></div></div></div>
              <div style="width:38px;font-size:11px;font-weight:700;color:${col};font-family:var(--mono)">${probs[i]}%</div>
            </div>`}).join('')}
        </div>
      </div>
    </div>
    <div class="card card-danger"><div class="insight-tag">Severe Weather Intelligence Briefing</div><div class="insight-text">A significant severe weather outbreak is expected across North Texas this evening. A strong dryline interaction with a surface low will produce supercell thunderstorms capable of large hail, damaging winds, and isolated tornadoes. Houston should monitor for additional flooding. NOAA SPC Day 1 Convective Outlook rates North Texas at Moderate (SLGT–ENH) risk.</div></div>
  `;
}
