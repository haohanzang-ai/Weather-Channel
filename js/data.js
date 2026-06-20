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

// All 100 Texas cities (lat/lon for map + search). primary:true = fetched on page load.
const ALL_CITIES = [
  {name:'Austin',              lat:30.2672,  lon:-97.7431,  primary:true},
  {name:'Houston',             lat:29.7604,  lon:-95.3698,  primary:true},
  {name:'Dallas',              lat:32.7767,  lon:-96.7970,  primary:true},
  {name:'San Antonio',         lat:29.4241,  lon:-98.4936,  primary:true},
  {name:'Fort Worth',          lat:32.7555,  lon:-97.3308,  primary:true},
  {name:'El Paso',             lat:31.7619,  lon:-106.4850, primary:true},
  {name:'Arlington',           lat:32.7357,  lon:-97.1081,  primary:true},
  {name:'Corpus Christi',      lat:27.8006,  lon:-97.3964,  primary:true},
  {name:'Plano',               lat:33.0198,  lon:-96.6989,  primary:true},
  {name:'Lubbock',             lat:33.5779,  lon:-101.8552, primary:true},
  {name:'Laredo',              lat:27.5064,  lon:-99.5075},
  {name:'Irving',              lat:32.8141,  lon:-96.9489},
  {name:'Garland',             lat:32.9126,  lon:-96.6389},
  {name:'Frisco',              lat:33.1507,  lon:-96.8236},
  {name:'McKinney',            lat:33.1973,  lon:-96.6397},
  {name:'Amarillo',            lat:35.2220,  lon:-101.8313},
  {name:'Grand Prairie',       lat:32.7460,  lon:-96.9978},
  {name:'Killeen',             lat:31.1171,  lon:-97.7278},
  {name:'Brownsville',         lat:25.9017,  lon:-97.4975},
  {name:'Midland',             lat:31.9974,  lon:-102.0779},
  {name:'Pasadena',            lat:29.6911,  lon:-95.2091},
  {name:'McAllen',             lat:26.2034,  lon:-98.2300},
  {name:'Mesquite',            lat:32.7668,  lon:-96.5992},
  {name:'Denton',              lat:33.2148,  lon:-97.1331},
  {name:'Carrollton',          lat:32.9537,  lon:-96.8903},
  {name:'Round Rock',          lat:30.5083,  lon:-97.6789},
  {name:'Waco',                lat:31.5493,  lon:-97.1467},
  {name:'Beaumont',            lat:30.0802,  lon:-94.1266},
  {name:'Abilene',             lat:32.4487,  lon:-99.7331},
  {name:'Odessa',              lat:31.8457,  lon:-102.3676},
  {name:'Pearland',            lat:29.5636,  lon:-95.2860},
  {name:'Richardson',          lat:32.9483,  lon:-96.7299},
  {name:'The Woodlands',       lat:30.1658,  lon:-95.4613},
  {name:'Tyler',               lat:32.3513,  lon:-95.3011},
  {name:'Lewisville',          lat:33.0462,  lon:-96.9942},
  {name:'League City',         lat:29.5075,  lon:-95.0949},
  {name:'San Angelo',          lat:31.4638,  lon:-100.4370},
  {name:'College Station',     lat:30.6280,  lon:-96.3344},
  {name:'Allen',               lat:33.1032,  lon:-96.6706},
  {name:'Edinburg',            lat:26.3017,  lon:-98.1633},
  {name:'Sugar Land',          lat:29.6197,  lon:-95.6349},
  {name:'Wichita Falls',       lat:33.9137,  lon:-98.4934},
  {name:'Bryan',               lat:30.6744,  lon:-96.3698},
  {name:'Longview',            lat:32.5007,  lon:-94.7405},
  {name:'Conroe',              lat:30.3119,  lon:-95.4560},
  {name:'Pharr',               lat:26.1948,  lon:-98.1836},
  {name:'Harlingen',           lat:26.1906,  lon:-97.6961},
  {name:'Temple',              lat:31.0982,  lon:-97.3428},
  {name:'New Braunfels',       lat:29.7030,  lon:-98.1245},
  {name:'Georgetown',          lat:30.6327,  lon:-97.6771},
  {name:'Baytown',             lat:29.7355,  lon:-94.9774},
  {name:'Mission',             lat:26.2159,  lon:-98.3252},
  {name:'Cedar Park',          lat:30.5052,  lon:-97.8203},
  {name:'Missouri City',       lat:29.6185,  lon:-95.5385},
  {name:'Mansfield',           lat:32.5632,  lon:-97.1417},
  {name:'Rosenberg',           lat:29.5572,  lon:-95.8083},
  {name:'Flower Mound',        lat:33.0145,  lon:-97.0969},
  {name:'North Richland Hills',lat:32.8343,  lon:-97.2289},
  {name:'Coppell',             lat:32.9546,  lon:-97.0147},
  {name:'Burleson',            lat:32.5418,  lon:-97.3208},
  {name:'Euless',              lat:32.8371,  lon:-97.0819},
  {name:'Bedford',             lat:32.8440,  lon:-97.1436},
  {name:'Waxahachie',          lat:32.3868,  lon:-96.8483},
  {name:'San Marcos',          lat:29.8827,  lon:-97.9414},
  {name:'Galveston',           lat:29.3013,  lon:-94.7977},
  {name:'Cedar Hill',          lat:32.5885,  lon:-96.9561},
  {name:'Haltom City',         lat:32.7993,  lon:-97.2608},
  {name:'Grapevine',           lat:32.9343,  lon:-97.0781},
  {name:'Rowlett',             lat:32.9029,  lon:-96.5638},
  {name:'Hurst',               lat:32.8232,  lon:-97.1700},
  {name:'Corsicana',           lat:32.0754,  lon:-96.4697},
  {name:'Nacogdoches',         lat:31.6035,  lon:-94.6552},
  {name:'Sherman',             lat:33.6357,  lon:-96.6089},
  {name:'Marshall',            lat:32.5446,  lon:-94.3674},
  {name:'Lufkin',              lat:31.3382,  lon:-94.7291},
  {name:'Texarkana',           lat:33.4251,  lon:-94.0477},
  {name:'Victoria',            lat:28.8053,  lon:-97.0036},
  {name:'Kerrville',           lat:30.0474,  lon:-99.1403},
  {name:'Port Arthur',         lat:29.8849,  lon:-93.9399},
  {name:'Big Spring',          lat:32.2504,  lon:-101.4788},
  {name:'Vernon',              lat:34.1556,  lon:-99.2945},
  {name:'Del Rio',             lat:29.3629,  lon:-100.8968},
  {name:'Pflugerville',        lat:30.4391,  lon:-97.6200},
  {name:'Leander',             lat:30.5786,  lon:-97.8531},
  {name:'Weslaco',             lat:26.1595,  lon:-97.9906},
  {name:'Eagle Pass',          lat:28.7091,  lon:-100.4996},
  {name:'Kingsville',          lat:27.5159,  lon:-97.8561},
  {name:'Seguin',              lat:29.5688,  lon:-97.9647},
  {name:'Stephenville',        lat:32.2207,  lon:-98.2026},
  {name:'Huntsville',          lat:30.7235,  lon:-95.5507},
  {name:'San Juan',            lat:26.1895,  lon:-98.1558},
  {name:'Uvalde',              lat:29.2097,  lon:-99.7863},
  {name:'Boerne',              lat:29.7947,  lon:-98.7320},
  {name:'Weatherford',         lat:32.7593,  lon:-97.7972},
  {name:'Mineral Wells',       lat:32.8087,  lon:-98.1136},
  {name:'Pearsall',            lat:28.8930,  lon:-99.0958},
  {name:'Athens',              lat:32.2043,  lon:-95.8508},
  {name:'Pampa',               lat:35.5365,  lon:-100.9596},
  {name:'Midlothian',          lat:32.4737,  lon:-96.9947},
  {name:'Cleburne',            lat:32.3535,  lon:-97.3866},
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
  // ── Main tabs ─────────────────────────────────────────────────────────────
  overview:   'TexasClimate — Plant · Climate · Bioenergy Intelligence',
  analyze:    'Dashboard — Plant · Location · Bioenergy',
  mapcompare: 'Map & Compare — Texas Locations',
  bioenergy:  'Bioenergy Engine',
  science:      'Science & Stress Methods',
  graphbuilder: 'Graph Builder — Interactive Data Visualization',
  sources:      'Sources & Data Status',
  settings:   'Settings',
  // ── legacy keys kept so any direct showPage() calls still title correctly ─
  dashboard:   'Analyze — Plant · Location · Bioenergy',
  map:         'Map & Compare — Texas Locations',
  forecasts:   'Map & Compare — Texas Locations',
  agriculture: 'Analyze — Plant · Location · Bioenergy',
  sgbiofuel:   'Bioenergy Engine',
  fueleff:     'Bioenergy Engine',
  scanner:     'Bioenergy Engine',
  trends:      'Map & Compare — Texas Locations',
  airquality:  'Map & Compare — Texas Locations',
  water:       'Map & Compare — Texas Locations',
  energy:      'Map & Compare — Texas Locations',
  severe:      'Map & Compare — Texas Locations',
  compare:     'Map & Compare — Texas Locations',
  reports:     'Sources & Data Status',
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

  // AQI is fetched separately so its failure doesn't block weather data
  const [weatherRes, aqRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(aqUrl).catch(() => null)
  ]);
  const weather = await weatherRes.json();
  const aq = aqRes ? await aqRes.json().catch(() => ({})) : {};

  // Track per-API status (first city sets it; already-set statuses are preserved)
  if (API_STATUS.weather !== 'ok') API_STATUS.weather = 'ok';
  if (aqRes && aqRes.ok) { if (API_STATUS.aqi !== 'ok') API_STATUS.aqi = 'ok'; }
  else                   { if (API_STATUS.aqi !== 'ok') API_STATUS.aqi = 'fail'; }

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
    code:       cur.weather_code,
    pressure:   Math.round(cur.surface_pressure),
    visibility: visMiles,
    uv:         Math.round(cur.uv_index || 0),
    aqi:        (aq.current && aq.current.us_aqi != null) ? aq.current.us_aqi : null
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
    API_STATUS.lastUpdate = Date.now();
    const lastSync = document.getElementById('lastSync');
    if(lastSync) lastSync.textContent = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    renderDashboard();
    lsDismiss();
    // Re-render whichever tab is currently open so it shows fresh data immediately
    const activePage = document.querySelector('.nav-item[aria-current="page"]');
    if(activePage){
      const pid = activePage.dataset.page;
      if(pid==='analyze')     renderAg();
      else if(pid==='mapcompare') { renderAQ(); renderEnergy(); renderWater(); renderTrends(); renderSevere(); renderCompare(); }
      else if(pid==='sources')   renderReports();
    }
  } catch(err){
    console.error('Weather fetch error:', err);
    API_STATUS.weather = 'fail';
    API_STATUS.hasDemoData = true;
    if (typeof renderDataStatus === 'function') renderDataStatus();
    const wg = document.getElementById('weatherGrid');
    if (wg) wg.innerHTML = `<div class="card card-danger" style="grid-column:1/-1;padding:16px">
      <div class="insight-tag">⚠ Open-Meteo API Unavailable</div>
      <div class="insight-text">Weather data could not be loaded. Check your connection and try again. <button class="btn-sm" onclick="refreshData(event)" style="margin-top:8px">↻ Retry</button></div>
    </div>`;
    lsDismiss();
    setTimeout(fetchAllWeatherData, 60000);
  }
}

// ── Lazy-fetch a single city (not in the primary 10) ─────────────────────────
async function fetchCityOnDemand(city){
  if(WEATHER_DATA[city.name]) return; // already loaded
  const {name, lat, lon} = city;
  const _metric   = typeof getSetting==='function' && getSetting('units')==='metric';
  const _tempUnit = _metric ? 'celsius' : 'fahrenheit';
  const _windUnit = _metric ? 'kmh'     : 'mph';
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
  if(cur.wind_speed_10m >= 25){ cond.condition='Windy'; cond.icon='💨'; }
  const visMiles = Math.min(10, Math.round((cur.visibility||0)/1609));
  const et0Arr    = (weather.daily||{}).et0_fao_evapotranspiration || [];
  const precipArr = (weather.daily||{}).precipitation_sum || [];
  WEATHER_DATA[name] = {
    temp:      Math.round(cur.temperature_2m),
    feels:     Math.round(cur.apparent_temperature),
    humidity:  cur.relative_humidity_2m,
    wind:      Math.round(cur.wind_speed_10m),
    condition: cond.condition,
    icon:      cond.icon,
    code:      cur.weather_code,
    pressure:  Math.round(cur.surface_pressure),
    visibility:visMiles,
    uv:        Math.round(cur.uv_index||0),
    aqi:       (aq.current && aq.current.us_aqi!=null) ? aq.current.us_aqi : null,
    et0Avg:    et0Arr.length    ? Math.round(et0Arr.reduce((a,b)=>a+b,0)/et0Arr.length*10)/10 : null,
    precipAvg: precipArr.length ? Math.round(precipArr.reduce((a,b)=>a+b,0)/precipArr.length*10)/10 : null
  };
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  FORECAST_DATA[name] = ((weather.daily||{}).time||[]).map((dateStr,i)=>{
    const date = new Date(dateStr+'T12:00:00');
    const fc   = getConditionFromCode(weather.daily.weather_code[i]);
    return {
      day:   dayNames[date.getDay()],
      date:  dateStr,
      icon:  fc.icon,
      hi:    Math.round(weather.daily.temperature_2m_max[i]),
      lo:    Math.round(weather.daily.temperature_2m_min[i]),
      rain:  weather.daily.precipitation_probability_max[i]||0,
      precip:Math.round((precipArr[i]||0)*10)/10,
      et0:   Math.round((et0Arr[i]||0)*10)/10
    };
  });
}
