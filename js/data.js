'use strict';

// ── Data ─────────────────────────────────────────────────────────────────────
const CITIES = [
  {name:'Austin',x:240,y:285},{name:'Houston',x:320,y:310},
  {name:'Dallas',x:280,y:175},{name:'San Antonio',x:220,y:320},
  {name:'Fort Worth',x:255,y:175},{name:'El Paso',x:88,y:240},
  {name:'Arlington',x:265,y:185},{name:'Corpus Christi',x:265,y:370},
  {name:'Plano',x:290,y:165},{name:'Lubbock',x:140,y:175}
];

const WEATHER_DATA = {
  'Austin':{temp:96,feels:103,humidity:62,wind:8,condition:'Partly Cloudy',icon:'⛅',pressure:1012,visibility:10,uv:8,aqi:52},
  'Houston':{temp:91,feels:99,humidity:78,wind:12,condition:'Thunderstorms',icon:'⛈',pressure:1009,visibility:7,uv:5,aqi:68},
  'Dallas':{temp:94,feels:100,humidity:55,wind:15,condition:'Sunny',icon:'☀️',pressure:1015,visibility:10,uv:9,aqi:45},
  'San Antonio':{temp:98,feels:106,humidity:58,wind:10,condition:'Mostly Sunny',icon:'🌤',pressure:1011,visibility:10,uv:9,aqi:40},
  'Fort Worth':{temp:93,feels:98,humidity:52,wind:18,condition:'Sunny',icon:'☀️',pressure:1016,visibility:10,uv:8,aqi:42},
  'El Paso':{temp:101,feels:101,humidity:22,wind:20,condition:'Clear',icon:'☀️',pressure:1008,visibility:10,uv:11,aqi:38},
  'Arlington':{temp:94,feels:100,humidity:54,wind:16,condition:'Sunny',icon:'☀️',pressure:1015,visibility:10,uv:9,aqi:44},
  'Corpus Christi':{temp:88,feels:95,humidity:82,wind:22,condition:'Partly Cloudy',icon:'⛅',pressure:1013,visibility:9,uv:7,aqi:35},
  'Plano':{temp:95,feels:101,humidity:53,wind:14,condition:'Sunny',icon:'☀️',pressure:1015,visibility:10,uv:9,aqi:46},
  'Lubbock':{temp:92,feels:90,humidity:28,wind:25,condition:'Windy',icon:'💨',pressure:1010,visibility:8,uv:9,aqi:48}
};

const FORECAST_DATA = {
  Mon:{icon:'☀️',hi:96,lo:74,rain:5},Tue:{icon:'⛅',hi:94,lo:73,rain:15},
  Wed:{icon:'🌧',hi:88,lo:70,rain:65},Thu:{icon:'⛈',hi:82,lo:68,rain:80},
  Fri:{icon:'⛅',hi:89,lo:71,rain:30},Sat:{icon:'☀️',hi:95,lo:74,rain:8},
  Sun:{icon:'☀️',hi:97,lo:76,rain:5}
};

const AG_DATA = [
  {label:'Heat Stress Risk',value:'Moderate–High',pct:65,color:'#F5A623'},
  {label:'Drought Concern Level',value:'Concerning',pct:72,color:'#D64545'},
  {label:'Irrigation Need',value:'High',pct:80,color:'#4A90E2'},
  {label:'Crop Growth Suitability',value:'Moderate',pct:55,color:'#2ECC8B'},
  {label:'Agricultural Risk Index',value:'Elevated',pct:68,color:'#F5A623'},
  {label:'Weather Hazard',value:'Moderate',pct:60,color:'#F5A623'}
];

const PAGE_TITLES = {
  dashboard:'Dashboard Overview',map:'Interactive Texas Map',forecasts:'City Forecasts',
  agriculture:'Agriculture Intelligence',sgbiofuel:'Switchgrass Biofuel Lab',fueleff:'Fuel Efficiency Center',
  trends:'Climate Trends',airquality:'Air Quality Center',
  water:'Water Resources',energy:'Energy Intelligence',severe:'Severe Weather',
  compare:'City Comparison Lab',reports:'AI Intelligence Reports'
};
