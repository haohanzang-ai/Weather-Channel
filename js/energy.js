'use strict';

// ── Energy Intelligence — CDI from live temps, honest ERCOT links ─────────────
function renderEnergy(){
  if(!dataLoaded || !Object.keys(WEATHER_DATA).length){
    document.getElementById('energyContent').innerHTML='<div class="card loading-shimmer" style="height:200px"></div>';
    return;
  }

  const sorted  = Object.entries(WEATHER_DATA).sort((a,b)=>b[1].temp-a[1].temp);
  const temps   = sorted.map(([,d])=>d.temp);
  const avgTemp = Math.round(temps.reduce((a,b)=>a+b,0)/temps.length);
  const maxTemp = temps[0];
  const hottest = sorted[0][0];

  // Cooling Demand Index: standard formula for grid load estimation
  // CDI = max(0, temp − 65°F) × 0.8  — higher = more AC pressure on the grid
  const cdiEntries = sorted.map(([city,d])=>({
    city,
    cdi: Math.max(0, Math.round((d.temp-65)*0.8)),
    temp: d.temp
  }));
  const maxCDI  = Math.max(...cdiEntries.map(e=>e.cdi));
  const avgCDI  = Math.round(cdiEntries.reduce((s,e)=>s+e.cdi,0)/cdiEntries.length);
  const gridPressure = avgCDI>30?'High':avgCDI>18?'Moderate':'Low';
  const gridColor    = avgCDI>30?'#D64545':avgCDI>18?'#F5A623':'#5DDBA8';

  document.getElementById('energyContent').innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      ${dataBadge('live-drv')}
      <span style="font-size:10px;color:var(--text3)">Cooling Demand Index is computed from live temperatures — <strong>not live ERCOT grid data.</strong>
        For real-time grid figures: <a href="https://www.ercot.com/gridinfo" target="_blank" rel="noopener" style="color:#4A90E2">ercot.com/gridinfo →</a></span>
    </div>
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card card-orange">
        <div class="stat-label">Avg Texas Temp (Live API)</div>
        <div class="stat-value">${avgTemp}<span class="stat-unit">°F</span></div>
        <div class="stat-sub">Across all 10 monitored cities</div>
      </div>
      <div class="card">
        <div class="stat-label">Peak City Temp</div>
        <div class="stat-value">${maxTemp}<span class="stat-unit">°F</span></div>
        <div class="stat-sub">${escapeHtml(hottest)}</div>
      </div>
      <div class="card">
        <div class="stat-label">Avg Cooling Demand Index</div>
        <div class="stat-value" style="color:${gridColor}">${avgCDI}</div>
        <div class="stat-sub">CDI — temperature-derived estimate</div>
      </div>
      <div class="card">
        <div class="stat-label">Grid Pressure Estimate</div>
        <div class="stat-value" style="font-size:18px;color:${gridColor}">${escapeHtml(gridPressure)}</div>
        <div class="stat-sub">Live-derived estimate — not ERCOT data</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">Cooling Demand Index (CDI) by City ${dataBadge('live-drv')}</h3>
      <div style="font-size:10px;color:var(--text3);margin-bottom:10px">CDI = max(0, temp − 65°F) × 0.8 · Live-temperature-derived estimate — not live ERCOT load data</div>
      ${cdiEntries.map(({city,cdi,temp})=>{
        const col=cdi>25?'#D64545':cdi>15?'#F5A623':'#4A90E2';
        return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="width:110px;font-size:11px;color:var(--text1)">${escapeHtml(city)}</div>
          <div style="flex:1">
            <div class="progress-bar" role="meter" aria-valuenow="${cdi}" aria-valuemin="0" aria-valuemax="50" aria-label="${escapeHtml(city)} CDI: ${cdi}">
              <div class="progress-fill" style="width:${Math.min(100,cdi*2.5)}%;background:${col}"></div>
            </div>
          </div>
          <div style="font-size:10px;color:var(--text3);width:48px;text-align:right">${temp}°F</div>
          <span style="font-size:11px;color:${col};font-weight:700;width:60px;text-align:right;font-family:var(--mono)">CDI: ${cdi}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="grid-2">
      <div class="card card-blue">
        <div class="insight-tag">📊 About This Tab</div>
        <div class="insight-text">The Cooling Demand Index is computed directly from live Open-Meteo temperatures. It estimates relative AC demand — useful as a proxy for grid stress. Real-time ERCOT load data (GW, reserve margins, generation mix) requires direct API access via ERCOT registration. Visit the live sources below for official grid figures.</div>
      </div>
      <div class="card">
        <h3 class="section-title">Official ERCOT Data Sources</h3>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
          ${[
            {name:'ERCOT Real-Time Dashboard',url:'https://www.ercot.com/gridinfo/load/load_hist'},
            {name:'ERCOT Current Grid Conditions',url:'https://www.ercot.com/gridinfo'},
            {name:'ERCOT Hourly Load Data',url:'https://www.ercot.com/gridinfo/load'},
            {name:'EIA Texas Energy Profile',url:'https://www.eia.gov/state/analysis.php?sid=TX'}
          ].map(l=>`<a href="${l.url}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:rgba(255,255,255,0.04);border-radius:6px;border:1px solid var(--border);text-decoration:none">
            <span style="font-size:10px;color:var(--text0);flex:1">${escapeHtml(l.name)}</span>
            <span style="font-size:10px;color:#4A90E2">→</span>
          </a>`).join('')}
        </div>
      </div>
    </div>`;
}
