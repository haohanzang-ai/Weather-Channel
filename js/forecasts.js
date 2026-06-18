'use strict';

// ── Forecasts page ────────────────────────────────────────────────────────────
let _forecastSelectedCity = null;

function populateForecastSelect(){
  const primary  = ALL_CITIES.filter(c =>  c.primary);
  const extended = ALL_CITIES.filter(c => !c.primary).sort((a,b) => a.name.localeCompare(b.name));
  if (!_forecastSelectedCity && primary.length) _forecastSelectedCity = primary[0].name;

  buildCustomSelect({
    wrapperId: 'forecastCityWrap',
    placeholder: _forecastSelectedCity || '— choose a city —',
    groups: [
      { label: 'Top Cities',       color: '#5DDBA8', items: primary.map(c  => ({ value: c.name, text: c.name })) },
      { label: 'All Texas Cities', color: '#4A90E2', items: extended.map(c => ({ value: c.name, text: c.name })) },
    ],
    onChange(value) {
      _forecastSelectedCity = value;
      renderForecastPage();
    },
  });
}

function renderForecastPage(){
  const cityName = _forecastSelectedCity || (ALL_CITIES.find(c=>c.primary)||ALL_CITIES[0])?.name;
  const d = WEATHER_DATA[cityName];
  // Data not yet loaded — show shimmer and kick off on-demand fetch
  if(!d){
    document.getElementById('forecastContent').innerHTML =
      '<div class="card loading-shimmer" style="height:80px;margin-bottom:10px"></div>'.repeat(3);
    const cityObj = ALL_CITIES.find(c => c.name === cityName);
    if(cityObj){
      fetchCityOnDemand(cityObj).then(()=>{ if(_forecastSelectedCity===cityName) renderForecastPage(); }).catch(()=>{});
    }
    return;
  }
  const city = cityName;
  // Per-city forecast array from Open-Meteo
  const forecast = FORECAST_DATA[city] || [];
  document.getElementById('forecastContent').innerHTML=`
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card card-blue"><div class="stat-label">Current Temp</div><div class="stat-value">${d.temp}<span class="stat-unit">°F</span></div><div class="stat-sub">${escapeHtml(d.condition)}</div></div>
      <div class="card"><div class="stat-label">Humidity</div><div class="stat-value">${d.humidity}<span class="stat-unit">%</span></div></div>
      <div class="card"><div class="stat-label">Wind</div><div class="stat-value">${d.wind}<span class="stat-unit">mph</span></div></div>
      <div class="card"><div class="stat-label">Feels Like</div><div class="stat-value">${d.feels}<span class="stat-unit">°F</span></div></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">7-Day Forecast</h3>
      ${forecast.map(f=>`
        <div class="forecast-row">
          <div class="forecast-day">${escapeHtml(f.day)}</div>
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
      data:{labels:forecast.map(f=>f.day),datasets:[
        {label:'High °F',data:forecast.map(f=>f.hi),borderColor:'#F5A623',backgroundColor:'rgba(245,166,35,0.08)',tension:0.4,fill:false,pointBackgroundColor:'#F5A623',pointRadius:4},
        {label:'Low °F', data:forecast.map(f=>f.lo),borderColor:'#4A90E2',backgroundColor:'rgba(74,144,226,0.08)',tension:0.4,fill:false,pointBackgroundColor:'#4A90E2',pointRadius:4}
      ]},
      options:chartOpts(v=>v+'°F')
    }));
  });
}
