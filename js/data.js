'use strict';

// ── City list (x/y = SVG map coords, lat/lon = Open-Meteo API coords) ────────
const CITIES = [
  {name:'Austin',         x:240, y:285, lat:30.2672,  lon:-97.7431},
  {name:'Houston',        x:320, y:310, lat:29.7604,  lon:-95.3698},
  {name:'Dallas',         x:280, y:175, lat:32.7767,  lon:-96.7970},
  {name:'San Antonio',    x:220, y:320, lat:29.4241,  lon:-98.4936},
  {name:'Fort Worth',     x:255, y:175, lat:32.7555,  lon:-97.3308},
  {name:'El Paso',        x:88,  y:240, lat:31.7619,  lon:-106.4850},
  {name:'Arlington',      x:265, y:185, lat:32.7357,  lon:-97.1081},
  {name:'Corpus Christi', x:265, y:370, lat:27.8006,  lon:-97.3964},
  {name:'Plano',          x:290, y:165, lat:33.0198,  lon:-96.6989},
  {name:'Lubbock',        x:140, y:175, lat:33.5779,  lon:-101.8552}
];

// Live data — populated by fetchAllWeatherData() on load and every 10 minutes
let WEATHER_DATA = {};
let FORECAST_DATA = {};
let dataLoaded = false;

const AG_DATA = [
  {label:'Heat Stress Risk',        value:'Moderate–High', pct:65, color:'#F5A623'},
  {label:'Drought Concern Level',   value:'Concerning',    pct:72, color:'#D64545'},
  {label:'Irrigation Need',         value:'High',          pct:80, color:'#4A90E2'},
  {label:'Crop Growth Suitability', value:'Moderate',      pct:55, color:'#2ECC8B'},
  {label:'Agricultural Risk Index', value:'Elevated',      pct:68, color:'#F5A623'},
  {label:'Weather Hazard',          value:'Moderate',      pct:60, color:'#F5A623'}
];

const PAGE_TITLES = {
  dashboard:   'Dashboard Overview',
  map:         'Interactive Texas Map',
  forecasts:   'City Forecasts',
  agriculture: 'Agriculture Intelligence',
  sgbiofuel:   'Switchgrass Biofuel Lab',
  fueleff:     'Fuel Efficiency Center',
  settings:    'Settings',
  trends:      'Climate Trends',
  airquality:  'Air Quality Center',
  water:       'Water Resources',
  energy:      'Energy Intelligence',
  severe:      'Severe Weather',
  compare:     'City Comparison Lab',
  reports:     'AI Intelligence Reports',
  sources:     'Data Sources & Citations'
};

// ── WMO weather code → condition / icon ──────────────────────────────────────
function getConditionFromCode(code){
  if(code === 0)                 return {condition:'Clear',         icon:'☀️'};
  if(code === 1)                 return {condition:'Mostly Clear',  icon:'🌤'};
  if(code === 2)                 return {condition:'Partly Cloudy', icon:'⛅'};
  if(code === 3)                 return {condition:'Overcast',      icon:'☁️'};
  if(code >= 45 && code <= 48)   return {condition:'Foggy',         icon:'🌫'};
  if(code >= 51 && code <= 55)   return {condition:'Drizzle',       icon:'🌦'};
  if(code >= 61 && code <= 65)   return {condition:'Rain',          icon:'🌧'};
  if(code >= 71 && code <= 77)   return {condition:'Snow',          icon:'❄️'};
  if(code >= 80 && code <= 82)   return {condition:'Showers',       icon:'🌧'};
  if(code === 95)                return {condition:'Thunderstorms', icon:'⛈'};
  if(code === 96 || code === 99) return {condition:'Severe Storm',  icon:'⛈'};
  return {condition:'Variable', icon:'🌡'};
}

// ── Loading Screen helpers ────────────────────────────────────────────────────
let _lsDone = 0;
const _lsTotal = CITIES.length;
const _lsStartTime = Date.now();
const _lsMinMs = 6000; // show loading screen for at least 6 seconds so users can read a fact

function lsInit(){
  _lsDone = 0;
  const chips = document.getElementById('lsCities');
  const fill  = document.getElementById('lsFill');
  const bar   = document.getElementById('lsBar');
  const stat  = document.getElementById('lsStatus');
  if(chips) chips.innerHTML = CITIES.map(c=>`<span class="ls-chip" id="lsc-${c.name.replace(/\s+/g,'_')}">${c.name}</span>`).join('');
  if(fill)  fill.style.width = '0%';
  if(bar)   bar.setAttribute('aria-valuenow','0');
  if(stat)  stat.textContent = `Fetching ${_lsTotal} cities…`;
}

function lsCityDone(name){
  _lsDone++;
  const chip = document.getElementById('lsc-'+name.replace(/\s+/g,'_'));
  if(chip) chip.classList.add('done');
  const pct = Math.round(_lsDone / _lsTotal * 90); // reserve last 10% for render
  const fill = document.getElementById('lsFill');
  const bar  = document.getElementById('lsBar');
  const stat = document.getElementById('lsStatus');
  if(fill) fill.style.width = pct+'%';
  if(bar)  bar.setAttribute('aria-valuenow', String(_lsDone));
  if(stat) stat.textContent = `Loaded ${_lsDone} of ${_lsTotal} cities…`;
}

function lsDismiss(){
  const fill  = document.getElementById('lsFill');
  const stat  = document.getElementById('lsStatus');
  const ls    = document.getElementById('loadingScreen');
  if(fill) fill.style.width = '100%';
  if(stat) stat.textContent = 'All data loaded ✓';
  const elapsed   = Date.now() - _lsStartTime;
  const remaining = Math.max(0, _lsMinMs - elapsed);
  setTimeout(()=>{
    if(typeof lsFactStop === 'function') lsFactStop();
    if(ls){ ls.classList.add('ls-out'); setTimeout(()=>{ ls.style.display='none'; },600); }
  }, remaining);
}

// ── Loading placeholders ──────────────────────────────────────────────────────
function showLoadingState(){
  const wg = document.getElementById('weatherGrid');
  if(wg){
    wg.innerHTML = CITIES.map(c => `
      <div class="weather-card loading-shimmer" style="min-height:120px">
        <div class="city-name">${c.name}</div>
        <div style="height:60px;margin-top:8px;border-radius:6px;background:rgba(255,255,255,0.06)"></div>
      </div>
    `).join('');
  }
}

// ── Fetch one city from Open-Meteo ────────────────────────────────────────────
async function fetchWeatherForCity(city){
  const {name, lat, lon} = city;
  const _metric    = typeof getSetting==='function' && getSetting('units')==='metric';
  const _tempUnit  = _metric ? 'celsius'    : 'fahrenheit';
  const _windUnit  = _metric ? 'kmh'        : 'mph';
  const weatherUrl = [
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`,
    `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility,uv_index`,
    `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,et0_fao_evapotranspiration,precipitation_sum`,
    `temperature_unit=${_tempUnit}`,
    `wind_speed_unit=${_windUnit}`,
    `timezone=America%2FChicago`,
    `forecast_days=7`
  ].join('&');
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;

  const [weatherRes, aqRes] = await Promise.all([fetch(weatherUrl), fetch(aqUrl)]);
  const weather = await weatherRes.json();
  const aq      = await aqRes.json();

  const cur  = weather.current;
  const cond = getConditionFromCode(cur.weather_code);
  if(cur.wind_speed_10m >= 25){ cond.condition = 'Windy'; cond.icon = '💨'; }
  const visMiles = Math.min(10, Math.round((cur.visibility || 0) / 1609));

  WEATHER_DATA[name] = {
    temp:       Math.round(cur.temperature_2m),
    feels:      Math.round(cur.apparent_temperature),
    humidity:   cur.relative_humidity_2m,
    wind:       Math.round(cur.wind_speed_10m),
    condition:  cond.condition,
    icon:       cond.icon,
    pressure:   Math.round(cur.surface_pressure),
    visibility: visMiles,
    uv:         Math.round(cur.uv_index || 0),
    aqi:        (aq.current && aq.current.us_aqi != null) ? aq.current.us_aqi : 0
  };

  const daily    = weather.daily;
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // ET0 and precipitation — real agronomic data for agriculture tab
  const et0Arr    = daily.et0_fao_evapotranspiration || [];
  const precipArr = daily.precipitation_sum || [];
  WEATHER_DATA[name].et0Avg    = et0Arr.length   ? Math.round(et0Arr.reduce((a,b)=>a+b,0)   / et0Arr.length   * 10) / 10 : null;
  WEATHER_DATA[name].precipAvg = precipArr.length ? Math.round(precipArr.reduce((a,b)=>a+b,0)/ precipArr.length * 10) / 10 : null;

  FORECAST_DATA[name] = (daily.time || []).map((dateStr, i) => {
    const date = new Date(dateStr + 'T12:00:00');
    const fc   = getConditionFromCode(daily.weather_code[i]);
    return {
      day:   dayNames[date.getDay()],
      date:  dateStr,
      icon:  fc.icon,
      hi:    Math.round(daily.temperature_2m_max[i]),
      lo:    Math.round(daily.temperature_2m_min[i]),
      rain:  daily.precipitation_probability_max[i] || 0,
      precip:Math.round((precipArr[i] || 0) * 10) / 10,
      et0:   Math.round((et0Arr[i]    || 0) * 10) / 10
    };
  });
  lsCityDone(name);
}

// ── Fetch all 10 cities in parallel ──────────────────────────────────────────
async function fetchAllWeatherData(){
  lsInit();
  showLoadingState();
  try {
    await Promise.all(CITIES.map(c => fetchWeatherForCity(c)));
    dataLoaded = true;
    const lastSync = document.getElementById('lastSync');
    if(lastSync) lastSync.textContent = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    renderDashboard();
    lsDismiss();
    // Re-render whichever tab is currently open so it shows fresh data immediately
    const activePage = document.querySelector('.nav-item[aria-current="page"]');
    if(activePage){
      const pid = activePage.dataset.page;
      if(pid==='agriculture') renderAg();
      else if(pid==='airquality') renderAQ();
      else if(pid==='energy')    renderEnergy();
      else if(pid==='water')     renderWater();
      else if(pid==='reports')   renderReports();
      else if(pid==='trends')    renderTrends();
      else if(pid==='severe')    renderSevere();
      else if(pid==='compare')   renderCompare();
    }
  } catch(err){
    console.error('Weather fetch error:', err);
    setTimeout(fetchAllWeatherData, 60000);
  }
}
