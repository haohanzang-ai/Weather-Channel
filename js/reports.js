'use strict';

// ── Reports ───────────────────────────────────────────────────────────────────
function renderReports(){
  document.getElementById('reportsContent').innerHTML=`
    <div class="insight-card" style="margin-bottom:12px">
      <div class="insight-tag">📊 Daily Weather Report — ${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      <p class="insight-text" style="margin-bottom:8px">Texas is experiencing a broad heat dome pattern today, with above-normal temperatures across 90% of the state. El Paso leads with 101°F while East Texas sees more moderate conditions. A cold front is expected to bring relief to North Texas by Thursday.</p>
      <p class="insight-text">Houston Metro is the primary storm focus, with active severe thunderstorm watches and flood warnings in effect. Blowing dust advisories are active in the Panhandle and South Plains.</p>
    </div>
    <div class="insight-card" style="margin-bottom:12px">
      <div class="insight-tag">🌾 Agriculture Intelligence Report</div>
      <p class="insight-text">Drought conditions continue to worsen across South and Central Texas, now D2–D3 (Severe to Extreme) in Uvalde, Webb, and Zapata counties. Soil moisture at 4-inch depth is at 18% field capacity — critically low for summer crops. East Texas row crops remain in good condition with adequate rainfall over the past 14 days.</p>
    </div>
    <div class="insight-card" style="margin-bottom:12px">
      <div class="insight-tag">⚡ Weekly Climate Summary</div>
      <p class="insight-text">The past 7 days recorded a statewide average of 94.2°F — 6.8°F above the 1991–2020 climatological normal. Dallas set a daily high record of 108°F on Monday. Statewide precipitation was 65% below normal. NOAA's 8–14 day outlook shows above-normal temperatures continuing through late June. ENSO-neutral conditions expected through fall 2026.</p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
      <button class="btn-sm" onclick="alert('CSV export initiated — data package ready')" aria-label="Export data as CSV">📥 Export CSV</button>
      <button class="btn-sm" onclick="alert('PDF report generated')" aria-label="Download PDF report">📄 Download PDF</button>
      <button class="btn-sm" onclick="alert('Dashboard link copied to clipboard')" aria-label="Copy shareable link">🔗 Share Link</button>
    </div>
  `;
}
