'use strict';

// ── Water Resources — Live precipitation from Open-Meteo + official source links
function renderWater(){
  if(!dataLoaded || !Object.keys(FORECAST_DATA).length){
    document.getElementById('waterContent').innerHTML='<div class="card loading-shimmer" style="height:200px"></div>';
    return;
  }

  // Compute 7-day precipitation data per city from live forecast
  const cityRain = Object.entries(FORECAST_DATA).map(([city, days])=>{
    const avgRain   = days.length ? Math.round(days.reduce((s,f)=>s+f.rain,0)/days.length)  : 0;
    const maxRain   = days.length ? Math.max(...days.map(f=>f.rain))                          : 0;
    const precipSum = days.length ? Math.round(days.reduce((s,f)=>s+(f.precip||0),0)*10)/10  : 0;
    return {city, avgRain, maxRain, precipSum};
  }).sort((a,b)=>b.avgRain-a.avgRain);

  const allDays  = Object.values(FORECAST_DATA).flat();
  const stateAvgRain = allDays.length ? Math.round(allDays.reduce((s,f)=>s+f.rain,0)/allDays.length) : 0;
  const wetCity  = cityRain[0];
  const dryCity  = cityRain[cityRain.length-1];

  // Precipitation totals (mm) per city from ET0 data
  const precipTotals = Object.entries(WEATHER_DATA)
    .filter(([,d])=>d.precipAvg!==null)
    .sort((a,b)=>b[1].precipAvg-a[1].precipAvg);

  document.getElementById('waterContent').innerHTML=`
    <div class="alert-banner" role="note" style="margin-bottom:16px">
      <span aria-hidden="true">💧</span>
      <strong>Live reservoir storage levels</strong> — Visit the
      <a href="https://www.waterdatafortexas.org/reservoirs/statewide" target="_blank" rel="noopener noreferrer" style="color:#4A90E2">Texas Water Development Board →</a>
      for current capacity percentages for all major Texas lakes.
    </div>
    <div class="grid-2" style="margin-bottom:14px">
      <div class="card">
        <h3 class="section-title">7-Day Precipitation Outlook by City</h3>
        <div style="font-size:10px;color:var(--text3);margin-bottom:10px">Live from Open-Meteo — avg daily precipitation probability over next 7 days</div>
        ${cityRain.map(({city,avgRain,precipSum})=>{
          const col=avgRain>=60?'#4A90E2':avgRain>=30?'#5DDBA8':'#F5A623';
          const precStr = precipSum>0 ? ` · ${precipSum} mm forecast` : '';
          return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="width:110px;font-size:11px;color:var(--text1)">${escapeHtml(city)}</div>
            <div style="flex:1">
              <div class="progress-bar" role="meter" aria-valuenow="${avgRain}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(city)} rain probability: ${avgRain}%">
                <div class="progress-fill" style="width:${avgRain}%;background:${col}"></div>
              </div>
            </div>
            <div style="font-size:11px;font-weight:700;color:${col};font-family:var(--mono);width:32px;text-align:right">${avgRain}%</div>
            <div style="font-size:9px;color:var(--text3);width:80px">${escapeHtml(precStr)}</div>
          </div>`;
        }).join('')}
      </div>
      <div>
        <div class="card" style="margin-bottom:12px">
          <div class="stat-label">Statewide Rain Probability</div>
          <div class="stat-value">${stateAvgRain}<span class="stat-unit">%</span></div>
          <div class="stat-sub">7-day average across all monitored cities</div>
        </div>
        <div class="card card-blue" style="margin-bottom:12px">
          <div class="stat-label">Best Rain Outlook</div>
          <div class="stat-value" style="font-size:18px;color:#4A90E2">${escapeHtml(wetCity?.city||'—')}</div>
          <div class="stat-sub">${wetCity?.avgRain||0}% avg · ${wetCity?.precipSum||0} mm forecast</div>
        </div>
        <div class="card card-orange">
          <div class="stat-label">Driest Outlook</div>
          <div class="stat-value" style="font-size:18px;color:#F8C06A">${escapeHtml(dryCity?.city||'—')}</div>
          <div class="stat-sub">${dryCity?.avgRain||0}% avg rain chance</div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">Official Texas Water Resources</h3>
      <div class="grid-3" style="margin-top:10px">
        ${[
          {name:'TX Reservoir Levels',  url:'https://www.waterdatafortexas.org/reservoirs/statewide',           desc:'Live storage % for all major Texas lakes and reservoirs (TWDB)'},
          {name:'USGS Texas Streamflow',url:'https://waterdata.usgs.gov/tx/nwis/current/?type=flow',             desc:'Real-time streamflow and water level gauges statewide'},
          {name:'NWS River Forecasts',  url:'https://www.weather.gov/crh/',                                      desc:'National Weather Service flood and river stage forecasts'},
          {name:'TX Drought Monitor',   url:'https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?TX',desc:'Weekly drought status and D0–D4 intensity map for Texas'},
          {name:'TWDB Groundwater',     url:'https://www.twdb.texas.gov/groundwater/index.asp',                  desc:'Texas aquifer levels and groundwater monitoring data'},
          {name:'TX Water Dashboard',   url:'https://www.twdb.texas.gov/home/',                                  desc:'Texas Water Development Board — state water planning portal'}
        ].map(r=>`
          <div class="card">
            <div style="font-size:11px;font-weight:700;color:var(--text0);margin-bottom:4px">${escapeHtml(r.name)}</div>
            <div style="font-size:10px;color:var(--text2);margin-bottom:10px">${escapeHtml(r.desc)}</div>
            <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="btn-sm" style="font-size:9px">Open →</a>
          </div>`).join('')}
      </div>
    </div>
    <div class="card card-blue">
      <div class="insight-tag">📊 Methodology</div>
      <div class="insight-text">Precipitation probability and forecast totals (mm) are live from the <strong>Open-Meteo 7-day forecast API</strong>. Reservoir storage capacity requires direct access to the TWDB database — the links above open the official live sources. Data refreshes every 10 minutes.</div>
    </div>`;
}
