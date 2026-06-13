'use strict';

// ── Forecasts page ────────────────────────────────────────────────────────────
function populateForecastSelect(){
  const sel = document.getElementById('forecastCity');
  sel.innerHTML = Object.keys(WEATHER_DATA)
    .map(city => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`).join('');
}

function renderForecastPage(){
  const city = document.getElementById('forecastCity').value;
  const d = WEATHER_DATA[city];
  if(!d) return;
  document.getElementById('forecastContent').innerHTML=`
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card card-blue"><div class="stat-label">Current Temp</div><div class="stat-value">${d.temp}<span class="stat-unit">°F</span></div><div class="stat-sub">${escapeHtml(d.condition)}</div></div>
      <div class="card"><div class="stat-label">Humidity</div><div class="stat-value">${d.humidity}<span class="stat-unit">%</span></div></div>
      <div class="card"><div class="stat-label">Wind</div><div class="stat-value">${d.wind}<span class="stat-unit">mph</span></div></div>
      <div class="card"><div class="stat-label">Feels Like</div><div class="stat-value">${d.feels}<span class="stat-unit">°F</span></div></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">7-Day Forecast</h3>
      ${Object.entries(FORECAST_DATA).map(([day,f])=>`
        <div class="forecast-row">
          <div class="forecast-day">${escapeHtml(day)}</div>
          <div class="forecast-icon" aria-hidden="true">${f.icon}</div>
          <div style="flex:1;padding:0 14px">
            <div class="progress-bar" role="meter" aria-valuenow="${f.rain}" aria-valuemin="0" aria-valuemax="100" aria-label="${f.rain}% precipitation chance">
              <div class="progress-fill" style="width:${f.rain}%;background:rgba(74,144,226,0.75)"></div>
            </div>
            <div style="font-size:9px;color:var(--text3);margin-top:3px">${f.rain}% precipitation</div>
          </div>
          <div class="forecast-temps"><span class="forecast-hi">${f.hi}°</span><span class="forecast-lo">${f.lo}°</span></div>
        </div>
      `).join('')}
    </div>
    <div class="card">
      <h3 class="section-title">Temperature Chart (7-Day)</h3>
      <div class="chart-wrap"><canvas id="forecastChart" role="img" aria-label="7-day high and low temperature forecast for ${escapeHtml(city)}"></canvas></div>
    </div>
  `;
  destroyChart('forecast');
  whenReady('forecastChart', ctx =>{
    charts.set('forecast', new Chart(ctx,{
      type:'line',
      data:{labels:Object.keys(FORECAST_DATA),datasets:[
        {label:'High °F',data:Object.values(FORECAST_DATA).map(f=>f.hi),borderColor:'#F5A623',backgroundColor:'rgba(245,166,35,0.08)',tension:0.4,fill:false,pointBackgroundColor:'#F5A623',pointRadius:4},
        {label:'Low °F', data:Object.values(FORECAST_DATA).map(f=>f.lo),borderColor:'#4A90E2',backgroundColor:'rgba(74,144,226,0.08)',tension:0.4,fill:false,pointBackgroundColor:'#4A90E2',pointRadius:4}
      ]},
      options:chartOpts(v=>v+'°F')
    }));
  });
}
