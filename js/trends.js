'use strict';

// ── Trends — Real 7-day forecast data from Open-Meteo ─────────────────────────
function renderTrends(){
  if(!dataLoaded || !Object.keys(FORECAST_DATA).length){
    document.getElementById('trendsContent').innerHTML='<div class="card loading-shimmer" style="height:200px"></div>';
    return;
  }

  // Build statewide averages from per-city 7-day forecast data
  const cityKeys = Object.keys(FORECAST_DATA);
  const dayCount = FORECAST_DATA[cityKeys[0]]?.length || 7;

  // Average high, low, rain probability, ET0 across all cities per day
  const days    = [], avgHi = [], avgLo = [], avgRain = [], avgET0 = [];
  for(let i=0; i<dayCount; i++){
    const dayData = cityKeys.map(c=>FORECAST_DATA[c][i]).filter(Boolean);
    days.push(dayData[0]?.day || `Day ${i+1}`);
    avgHi.push(  Math.round(dayData.reduce((s,f)=>s+f.hi,0)  / dayData.length));
    avgLo.push(  Math.round(dayData.reduce((s,f)=>s+f.lo,0)  / dayData.length));
    avgRain.push(Math.round(dayData.reduce((s,f)=>s+f.rain,0)/ dayData.length));
    const et0vals = dayData.map(f=>f.et0||0).filter(v=>v>0);
    avgET0.push(et0vals.length ? Math.round(et0vals.reduce((a,b)=>a+b,0)/et0vals.length*10)/10 : null);
  }

  // City spread — show each city's 7-day high trend
  const cityHighs = cityKeys.map(city=>({
    city,
    highs: (FORECAST_DATA[city]||[]).map(f=>f.hi),
    color: `hsl(${(cityKeys.indexOf(city)/cityKeys.length)*280+20},70%,60%)`
  }));

  // Today's metrics from live WEATHER_DATA
  const wTemps    = Object.values(WEATHER_DATA).map(d=>d.temp);
  const wHumids   = Object.values(WEATHER_DATA).map(d=>d.humidity);
  const todayAvgT = Math.round(wTemps.reduce((a,b)=>a+b,0)/wTemps.length);
  const todayAvgH = Math.round(wHumids.reduce((a,b)=>a+b,0)/wHumids.length);

  document.getElementById('trendsContent').innerHTML=`
    <div class="grid-4" style="margin-bottom:14px">
      <div class="card"><div class="stat-label">Today Avg Temp</div><div class="stat-value">${todayAvgT}<span class="stat-unit">°F</span></div><div class="stat-sub">Statewide — live</div></div>
      <div class="card"><div class="stat-label">7-Day Avg High</div><div class="stat-value">${avgHi.length?Math.round(avgHi.reduce((a,b)=>a+b,0)/avgHi.length):—}<span class="stat-unit">°F</span></div><div class="stat-sub">Statewide forecast</div></div>
      <div class="card"><div class="stat-label">Today Avg Humidity</div><div class="stat-value">${todayAvgH}<span class="stat-unit">%</span></div><div class="stat-sub">Statewide — live</div></div>
      <div class="card"><div class="stat-label">Avg Rain Chance</div><div class="stat-value">${avgRain.length?Math.round(avgRain.reduce((a,b)=>a+b,0)/avgRain.length):—}<span class="stat-unit">%</span></div><div class="stat-sub">7-day statewide avg</div></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">7-Day Statewide Avg Temperature — High &amp; Low</h3>
      <div style="font-size:10px;color:var(--text3);margin-bottom:8px">Averaged across all 10 monitored cities · Source: Open-Meteo 7-day forecast</div>
      <div class="chart-wrap" style="height:200px"><canvas id="tempTrend" role="img" aria-label="7-day average high and low temperatures statewide"></canvas></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3 class="section-title">7-Day Precipitation Probability</h3>
        <div style="font-size:10px;color:var(--text3);margin-bottom:8px">Statewide average across all cities · Open-Meteo</div>
        <div class="chart-wrap"><canvas id="rainTrend" role="img" aria-label="7-day precipitation probability trend"></canvas></div>
      </div>
      <div class="card">
        <h3 class="section-title">Per-City High Temperature — 7-Day</h3>
        <div style="font-size:10px;color:var(--text3);margin-bottom:8px">Each city's daily high over the next 7 days · Open-Meteo</div>
        <div class="chart-wrap"><canvas id="cityHighChart" role="img" aria-label="Per-city high temperature forecast"></canvas></div>
      </div>
    </div>`;

  destroyChart('tempTrend'); destroyChart('rainTrend'); destroyChart('cityHighChart');

  whenReady('tempTrend', ctx=>{
    charts.set('tempTrend', new Chart(ctx,{
      type:'line',
      data:{labels:days, datasets:[
        {label:'Avg High °F', data:avgHi, borderColor:'#F5A623', backgroundColor:'rgba(245,166,35,0.1)', tension:0.4, fill:true,  pointBackgroundColor:'#F5A623', pointRadius:4},
        {label:'Avg Low °F',  data:avgLo, borderColor:'#4A90E2', backgroundColor:'rgba(74,144,226,0.08)',tension:0.4, fill:false, pointBackgroundColor:'#4A90E2', pointRadius:4}
      ]},
      options:chartOpts(v=>v+'°F')
    }));
  });

  whenReady('rainTrend', ctx=>{
    charts.set('rainTrend', new Chart(ctx,{
      type:'bar',
      data:{labels:days, datasets:[{
        label:'Rain Probability %', data:avgRain,
        backgroundColor:avgRain.map(v=>v>=60?'rgba(74,144,226,0.8)':v>=30?'rgba(93,219,168,0.7)':'rgba(245,166,35,0.6)'),
        borderRadius:4, borderWidth:0
      }]},
      options:chartOpts(v=>v+'%')
    }));
  });

  whenReady('cityHighChart', ctx=>{
    charts.set('cityHighChart', new Chart(ctx,{
      type:'line',
      data:{labels:days, datasets:cityHighs.map(({city,highs,color})=>({
        label:city, data:highs,
        borderColor:color, tension:0.4, fill:false, pointRadius:2, borderWidth:1.5
      }))},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'rgba(255,255,255,0.5)',font:{size:8},boxWidth:8,padding:6}}},
        scales:{
          x:{ticks:{color:'rgba(255,255,255,0.5)',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
          y:{ticks:{color:'rgba(255,255,255,0.45)',callback:v=>v+'°F',font:{size:9}},grid:{color:'rgba(255,255,255,0.05)'}}
        }
      }
    }));
  });
}
