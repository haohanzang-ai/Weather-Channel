'use strict';

// ── Energy ────────────────────────────────────────────────────────────────────
function renderEnergy(){
  document.getElementById('energyContent').innerHTML=`
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card card-orange"><div class="stat-label">Peak Demand Today</div><div class="stat-value">78.4<span class="stat-unit">GW</span></div><div class="stat-sub">Expected 4–7 PM CDT</div></div>
      <div class="card card-blue"><div class="stat-label">Current Load</div><div class="stat-value">71.2<span class="stat-unit">GW</span></div><div class="stat-sub">Grid operating normally</div></div>
      <div class="card card-success"><div class="stat-label">Renewable Mix</div><div class="stat-value" style="color:#5DDBA8">42<span class="stat-unit">%</span></div><div class="stat-sub">Wind + Solar</div></div>
      <div class="card"><div class="stat-label">Reserve Margin</div><div class="stat-value">8.3<span class="stat-unit">%</span></div><div class="stat-sub">Adequate</div></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">Cooling Demand Index by City</h3>
      ${Object.entries(WEATHER_DATA).map(([city,d])=>{
        const cdi=Math.max(0,Math.round((d.temp-65)*0.8));
        const col=cdi>25?'#D64545':cdi>15?'#F5A623':'#4A90E2';
        return`<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="width:110px;font-size:11px;color:var(--text1)">${escapeHtml(city)}</div>
          <div style="flex:1"><div class="progress-bar" role="meter" aria-valuenow="${cdi}" aria-valuemin="0" aria-valuemax="50" aria-label="${escapeHtml(city)} cooling demand index: ${cdi}"><div class="progress-fill" style="width:${Math.min(100,cdi*3)}%;background:${col}"></div></div></div>
          <span style="font-size:11px;color:${col};font-weight:700;width:60px;text-align:right;font-family:var(--mono)">CDI: ${cdi}</span>
        </div>`}).join('')}
    </div>
    <div class="grid-2">
      <div class="card card-danger"><div class="insight-tag">⚡ Peak Demand Alert</div><div class="insight-text">ERCOT anticipates near-record demand 4–9 PM today. Reduce thermostat settings, defer laundry until after 9 PM. Commercial facilities: raise AC setpoints to 76–78°F.</div></div>
      <div class="card">
        <h3 class="section-title">Energy Source Mix</h3>
        <div class="chart-wrap" style="height:155px"><canvas id="energyMix" role="img" aria-label="ERCOT energy source breakdown: Natural Gas 40%, Wind 28%, Solar 14%, Nuclear 10%, Coal 8%"></canvas></div>
      </div>
    </div>
  `;
  destroyChart('energyMix');
  whenReady('energyMix', ctx =>{
    charts.set('energyMix', new Chart(ctx,{
      type:'doughnut',
      data:{labels:['Natural Gas','Wind','Solar','Nuclear','Coal'],datasets:[{data:[40,28,14,10,8],backgroundColor:['#F5A623','#4A90E2','#F5D623','#2ECC8B','#888'],borderWidth:0,hoverOffset:6}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'right',labels:{color:'rgba(255,255,255,0.65)',font:{size:10},boxWidth:10,padding:8}}}}
    }));
  });
}
