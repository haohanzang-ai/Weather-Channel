'use strict';

// ── Compare ───────────────────────────────────────────────────────────────────
function renderCompare(){
  const sel = ['Austin','Houston','Dallas'];
  document.getElementById('compareContent').innerHTML=`
    <p style="margin-bottom:14px;font-size:12px;color:var(--text2)">Side-by-side comparison of key weather metrics across three cities.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px" class="comparison-grid">
      ${sel.map(city=>{const d=WEATHER_DATA[city];return`
        <div class="card" style="text-align:center">
          <div style="font-size:14px;font-weight:700;color:var(--blue);margin-bottom:12px">${escapeHtml(city)}</div>
          <div class="weather-icon" style="font-size:32px" aria-hidden="true">${d.icon}</div>
          <div class="stat-value" style="font-size:36px;color:${getTempColor(d.temp)};margin:6px 0" aria-label="${d.temp} degrees Fahrenheit">${d.temp}°</div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:12px">${escapeHtml(d.condition)}</div>
          <div class="divider"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;text-align:left">
            <div><div class="stat-label">Humidity</div><div style="font-size:14px;color:var(--text0);font-family:var(--mono)">${d.humidity}%</div></div>
            <div><div class="stat-label">Wind</div><div style="font-size:14px;color:var(--text0);font-family:var(--mono)">${d.wind} mph</div></div>
            <div><div class="stat-label">Feels Like</div><div style="font-size:14px;color:var(--text0);font-family:var(--mono)">${d.feels}°F</div></div>
            <div><div class="stat-label">AQI</div><div style="font-size:14px;color:${getAQILabel(d.aqi).color};font-family:var(--mono)">${d.aqi}</div></div>
          </div>
        </div>
      `}).join('')}
    </div>
    <div class="card">
      <h3 class="section-title">Comparative Chart</h3>
      <div class="chart-wrap" style="height:220px"><canvas id="compareChart" role="img" aria-label="Bar chart comparing temperature, humidity, and wind speed for Austin, Houston, and Dallas"></canvas></div>
    </div>
  `;
  destroyChart('compare');
  whenReady('compareChart', ctx =>{
    charts.set('compare', new Chart(ctx,{
      type:'bar',
      data:{labels:sel,datasets:[
        {label:'Temp °F',data:sel.map(c=>WEATHER_DATA[c].temp),backgroundColor:'rgba(245,166,35,0.75)',borderRadius:4,yAxisID:'y'},
        {label:'Humidity %',data:sel.map(c=>WEATHER_DATA[c].humidity),backgroundColor:'rgba(74,144,226,0.65)',borderRadius:4,yAxisID:'y1'},
        {label:'Wind mph',data:sel.map(c=>WEATHER_DATA[c].wind),backgroundColor:'rgba(46,204,139,0.65)',borderRadius:4,yAxisID:'y1'}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'rgba(255,255,255,0.6)',font:{size:10}}}},
        scales:{
          x:{ticks:{color:'rgba(255,255,255,0.5)'},grid:{color:'rgba(255,255,255,0.04)'}},
          y:{position:'left',ticks:{color:'rgba(255,255,255,0.45)',callback:v=>v+'°F'},grid:{color:'rgba(255,255,255,0.04)'}},
          y1:{position:'right',ticks:{color:'rgba(255,255,255,0.45)'},grid:{display:false}}
        }
      }
    }));
  });
}
