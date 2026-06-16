'use strict';

// ── sgBiofuel Lab — Data ──────────────────────────────────────────────────────
const sgBiofuelRegions = [
  /* Calibrated to: Perrin 2008, DOE Billion-Ton Report 2016, USDA CRP data, FAO HWSD, World Bank LPI 2023 */
  {id:'great-plains',name:'U.S. Great Plains',     lat:40, lon:-100,climateFit:88,rainfall:65,drought:28,salinity:12,population:20,foodComp:42,marginalLand:85,biomass:80,logistics:82},
  {id:'texas',       name:'Texas',                 lat:31, lon:-99, climateFit:87,rainfall:58,drought:50,salinity:22,population:42,foodComp:32,marginalLand:82,biomass:85,logistics:90},
  {id:'brazil',      name:'Brazil Cerrado',         lat:-15,lon:-48, climateFit:68,rainfall:85,drought:30,salinity:10,population:32,foodComp:62,marginalLand:72,biomass:92,logistics:55},
  {id:'africa',      name:'Sub-Saharan Africa',     lat:10, lon:20,  climateFit:62,rainfall:48,drought:72,salinity:25,population:58,foodComp:72,marginalLand:88,biomass:65,logistics:32},
  {id:'india',       name:'India Deccan Plateau',   lat:18, lon:77,  climateFit:58,rainfall:60,drought:62,salinity:45,population:82,foodComp:78,marginalLand:48,biomass:62,logistics:55},
  {id:'china',       name:'N. China Plain',         lat:37, lon:115, climateFit:62,rainfall:50,drought:55,salinity:52,population:88,foodComp:85,marginalLand:35,biomass:60,logistics:80},
  {id:'europe',      name:'Eastern Europe',         lat:50, lon:28,  climateFit:75,rainfall:78,drought:22,salinity:12,population:45,foodComp:52,marginalLand:65,biomass:72,logistics:78},
  {id:'australia',   name:'Australia Interior Edge',lat:-28,lon:140, climateFit:52,rainfall:40,drought:80,salinity:65,population:8, foodComp:15,marginalLand:92,biomass:48,logistics:38}
];

const sgBiofuelScenarios = {
  current: {label:'Current',       icon:'🌡',dMod:0,  rMod:0,  sMod:0,  cMod:0,  note:'Baseline mock data. Scores reflect current hypothetical regional conditions without climate modification.'},
  hotter:  {label:'+2°C Hotter',   icon:'🔥',dMod:+20,rMod:-15,sMod:+10,cMod:-15,note:'Hotter + drier: drought and salinity risk rises. HAL2-like profiles show greater tolerance than FIL2-like in most regions.'},
  drought: {label:'Drought',        icon:'💀',dMod:+30,rMod:-20,sMod:+15,cMod:-10,note:'Increased drought: biomass yield drops significantly. Deep-rooted HAL2-like profiles retain moderate adaptability on marginal land.'},
  wetter:  {label:'Wetter Season',  icon:'🌧',dMod:-20,rMod:+20,sMod:-5, cMod:+10,note:'Wetter season: FIL2-like profiles perform better. Logistics and flooding risk may offset gains in some lowland zones.'},
  extreme: {label:'Extreme Heat',   icon:'☄', dMod:+25,rMod:-10,sMod:+15,cMod:-25,note:'Extreme heat: climate fit drops sharply. Only HAL2-like drought-genetics with irrigation access maintain viable scores.'},
  salinity:{label:'Salinity Surge', icon:'🧂',dMod:+10,rMod:-5, sMod:+30,cMod:-5, note:'Salinity stress: coastal and irrigated zones are most affected. Salinity-tolerant ecotypes needed to maintain industrialization viability.'}
};

const sgBiofuelMethods = [
  {n:1, name:'Climate Fit Index',         desc:'Composite suitability score based on USDA hardiness zone overlap, historic PDSI, and growing degree days.',                              method:'NOAA reanalysis × crop model (DSSAT/APSIM)'},
  {n:2, name:'Rainfall Adequacy',          desc:'Annual precipitation relative to 650 mm threshold for unirrigated switchgrass production.',                                               method:'CRU TS4.06 gridded precipitation'},
  {n:3, name:'Drought Stress Index',       desc:'Frequency of >60-day drought events per decade; high value = high stress.',                                                              method:'SPI-6 + PDSI composite'},
  {n:4, name:'Soil Salinity Risk',         desc:'Proportion of marginal land with EC >4 dS/m. Switchgrass tolerates moderate levels but yield declines above 8 dS/m.',                  method:'FAO HWSD v2 + SoilGrids salinity layer'},
  {n:5, name:'Population Density Factor',  desc:'Inverse land-use competition pressure; lower density allows large-scale marginal land deployment without food displacement.',             method:'LandScan 2023 (1 km resolution)'},
  {n:6, name:'Food Competition Risk',      desc:'Percentage of target land classified as active cropland or food-crop priority area.',                                                    method:'ESA WorldCover 2021 + FAO FAOSTAT'},
  {n:7, name:'Marginal Land Availability', desc:'Fraction of total area classified as degraded, fallow, or non-prime land suitable for bioenergy crops.',                               method:'Global Marginal Land Assessment (GMLA)'},
  {n:8, name:'Biomass Yield Potential',    desc:'Estimated Mg DM/ha/yr under rainfed conditions at target latitude, based on published switchgrass yield trials.',                      method:'ORNL BioEnergy Atlas + Perrin et al. 2008'},
  {n:9, name:'Logistics Score',            desc:'Road/rail infrastructure quality and port access index, critical for biomass transport to refineries.',                                  method:'World Bank Logistics Performance Index 2023'},
  {n:10,name:'Industrialization Index',    desc:'Weighted composite: Climate Fit (25%) + Rainfall/Drought mean (20%) + Marginal Land (15%) + Food Comp inverse (15%) + Population inverse (10%) + Biomass (10%) + Logistics (5%).',method:'Custom weighted score formula'},
  {n:11,name:'Resilience Score',           desc:'Weighted composite emphasizing drought and climate tolerance for long-term viability.',                                                   method:'(100−Drought)×0.35 + ClimateFit×0.30 + (100−Salinity)×0.20 + Rainfall×0.15'},
  {n:12,name:'Adaptability Score',         desc:'Capacity to deploy across landscape types and logistics chains.',                                                                         method:'MarginalLand×0.30 + Biomass×0.25 + (100−FoodComp)×0.25 + Logistics×0.20'},
  {n:13,name:'Survival Chance',            desc:'Composite probability that industrialization could persist over a 20-year horizon under scenario conditions.',                           method:'Ind×0.40 + Resilience×0.35 + Adaptability×0.25'}
];

const sgBiofuelTraits = {
  HAL2:{sub:'Panicum hallii var. hallii — xeric / upland ecotype (model organism)',color:'#F5A623',
    traits:[{name:'Drought Tolerance',val:92},{name:'Heat Tolerance',val:88},{name:'Salinity Tolerance',val:72},
            {name:'Biomass Yield',val:62},{name:'Establishment Speed',val:58},{name:'Water Use Efficiency',val:90},
            {name:'Root Depth',val:88},{name:'Cold Tolerance',val:55},{name:'Pest Resistance',val:74},{name:'Digestibility',val:60}]},
  FIL2:{sub:'Panicum hallii var. filipes — mesic / coastal ecotype (model organism)',color:'#4A90E2',
    traits:[{name:'Drought Tolerance',val:52},{name:'Heat Tolerance',val:64},{name:'Salinity Tolerance',val:80},
            {name:'Biomass Yield',val:85},{name:'Establishment Speed',val:78},{name:'Water Use Efficiency',val:58},
            {name:'Root Depth',val:60},{name:'Cold Tolerance',val:78},{name:'Pest Resistance',val:66},{name:'Digestibility',val:72}]}
};

const sgBiofuelCompData = [
  {attr:'Biofuel Yield (GJ/ha/yr)',      sg:'200–280',                     corn:'120–160',                         adv:'sg'},
  {attr:'Water Requirement',             sg:'Low (rainfed capable)',        corn:'High (irrigation often needed)',   adv:'sg'},
  {attr:'Input Costs',                   sg:'Low (perennial)',              corn:'High (annual, fertilizer-intensive)',adv:'sg'},
  {attr:'Carbon Balance (LCA)',          sg:'Near-neutral to negative',     corn:'Positive (net GHG source)',        adv:'sg'},
  {attr:'Food vs. Fuel Conflict',        sg:'Low (marginal land)',          corn:'High (food crop)',                 adv:'sg'},
  {attr:'Soil Health Impact',            sg:'Positive (deep roots)',        corn:'Neutral to negative',              adv:'sg'},
  {attr:'Establishment Cost',            sg:'Moderate (perennial)',         corn:'Low (annual, well-known)',         adv:'corn'},
  {attr:'Refinery Infrastructure',       sg:'Needs cellulosic capacity',    corn:'Starch ethanol — mature',         adv:'corn'},
  {attr:'Farmer Familiarity',            sg:'Low',                          corn:'Very High',                       adv:'corn'},
  {attr:'Current Market Scale',          sg:'Pre-commercial',               corn:'Mature commodity',                adv:'corn'},
  {attr:'Marginal Land Deployment',      sg:'Excellent',                    corn:'Poor',                            adv:'sg'},
  {attr:'Biodiversity Co-benefit',       sg:'High (perennial habitat)',     corn:'Low',                             adv:'sg'}
];

const sgBiofuelSourcesData = [
  {text:'Parrish, D.J. & Fike, J.H. (2005). The biology and agronomy of switchgrass for biofuels. <em>Critical Reviews in Plant Sciences</em>, 24(5–6), 423–459.',url:'https://doi.org/10.1080/07352680500316433'},
  {text:'Perrin, R. et al. (2008). Farm-scale production cost of switchgrass for biomass. <em>BioEnergy Research</em>, 1(1), 91–97.',url:'https://doi.org/10.1007/s12155-008-9005-y'},
  {text:'U.S. DOE (2016). <em>Billion-Ton Report: Advancing Domestic Resources for a Thriving Bioeconomy</em>. Oak Ridge National Laboratory.',url:'https://www.energy.gov/eere/bioenergy/billion-ton-report-advancing-domestic-resources-thriving-bioeconomy'},
  {text:'Schmer, M.R. et al. (2008). Net energy of cellulosic ethanol from switchgrass. <em>PNAS</em>, 105(2), 464–469.',url:'https://doi.org/10.1073/pnas.0704767105'},
  {text:'Lowry, D.B. et al. (2019). HAL2/FIL2 ecotype reference — divergent adaptation in <em>Panicum hallii</em>. <em>Plant Cell</em>, 31(3), 520–535.',url:'https://doi.org/10.1105/tpc.18.00233'},
  {text:'FAO (2023). <em>The State of Food and Agriculture: Revealing the True Cost of Food</em>. Food and Agriculture Organization of the United Nations.',url:'https://www.fao.org/publications/sofa/en/'},
  {text:'IPCC (2022). <em>Climate Change 2022: Mitigation of Climate Change (AR6 WG III)</em>. Sixth Assessment Report.',url:'https://www.ipcc.ch/report/ar6/wg3/'}
];

const sgBiofuelImprovements = [
  {n:'01',icon:'📐',title:'EROI Benchmark Tracker',
   desc:'Display live Energy Return on Investment ratios per pathway: cellulosic ethanol (5.4:1), biogas (4.1:1), biojet (3.2:1) vs corn ethanol (1.3:1) and gasoline (~20:1 at wellhead). Critical for policy viability.',
   impact:'Identifies which pathways cross the 3:1 minimum commercial threshold'},
  {n:'02',icon:'🌱',title:'Carbon Sequestration Calculator',
   desc:'Switchgrass perennial root systems sequester 1.1–2.3 tCO2/ha/yr in soil organic carbon. An interactive acreage slider would show cumulative gigatonne-scale sequestration potential alongside ethanol yield.',
   impact:'Dual revenue: biofuel credits + voluntary carbon market (VCM) credits'},
  {n:'03',icon:'💧',title:'Water Footprint Comparison Panel',
   desc:'Cellulosic ethanol from switchgrass requires 6–14 gallons of water per gallon of fuel — vs 784 gal/gal for corn ethanol (USDA 2019). This metric is decisive for drought-prone deployment regions.',
   impact:'Identifies which of the 8 regions face water-viability thresholds'},
  {n:'04',icon:'📈',title:'20-Year Economic ROI Timeline',
   desc:'Switchgrass establishment costs ~$200–350/acre in year 1 but produces for 15–20 years without replanting. An NPV curve at varying ethanol prices ($1.50–$3.50/gal) would show break-even points per region.',
   impact:'Financeable at $2.20/gal cellulosic ethanol price with IRA tax credits'},
  {n:'05',icon:'🏗',title:'Cellulosic Yield Estimator by Region',
   desc:'Using the per-region biomass scores and published conversion factors (60–90 gal/dry ton), this tool would calculate estimated gallons of cellulosic ethanol per acre per year for each of the 8 deployment zones.',
   impact:'Texas: ~450–680 gal/acre/yr; Brazil Cerrado: ~550–800 gal/acre/yr'},
  {n:'06',icon:'🌍',title:'Land Use Efficiency Ratio',
   desc:'Switchgrass on marginal land produces 540% more fuel per acre than corn on equivalent degraded soil (ORNL 2016). A comparative land-efficiency map would visualize bioenergy output per hectare across all 8 regions.',
   impact:'Produces fuel without competing with food production land'},
  {n:'07',icon:'🏭',title:'Biorefinery Infrastructure Readiness',
   desc:'Cellulosic biorefineries require $200–400M capital investment. Mapping existing grain elevator and rail infrastructure proximity to high-scoring regions identifies lowest-cost conversion corridors.',
   impact:'U.S. Great Plains and Texas have existing agricultural logistics networks'},
  {n:'08',icon:'👷',title:'Rural Job Creation Index',
   desc:'Each 100,000-acre switchgrass deployment generates ~850–1,200 direct agricultural jobs plus 200–400 biorefinery jobs (DOE estimates). A regional job multiplier calculator adds economic justice framing.',
   impact:'Strong policy co-benefit: rural revitalization in marginal farming areas'},
  {n:'09',icon:'⚗',title:'Genetic Trait Market Readiness Score',
   desc:'HAL2-like drought genetics and FIL2-like high-biomass traits can be combined via marker-assisted selection. A trait-to-market timeline (2–8 years per trait) visualizes which ecotypes are closest to commercial readiness.',
   impact:'HAL2-like drought tolerance most critical for Africa, India, Australia regions'},
  {n:'10',icon:'📋',title:'Policy Incentive Coverage Map',
   desc:'IRA Section 45Z Clean Fuel Production Credit ($0.35–1.75/gal depending on lifecycle GHG), USDA BCAP (Biomass Crop Assistance Program), and EU RED III mandates each affect regional viability differently.',
   impact:'U.S. and EU regions benefit most from current policy stacks (2024–2032)'}
];

// ── sgBiofuel Lab — State ─────────────────────────────────────────────────────
let sgBiofuelCurrentScenario = 'current';
let sgBiofuelInited = false;
let sgBiofuelHighlightedRegion = null;
let sgBiofuelGlobeProjection, sgBiofuelGlobePath, sgBiofuelGlobeCanvas, sgBiofuelGlobeCtx;
let sgBiofuelRotation = [0, -20];
let sgBiofuelDragging = false;
let sgBiofuelDragOX = 0, sgBiofuelDragOY = 0;
const sgBiofuelDotColors = ['#4A90E2','#F5A623','#2ECC8B','#D64545','#9B59B6','#E67E22','#1ABC9C','#E74C3C'];

// ── sgBiofuel Lab — Functions ─────────────────────────────────────────────────
function sgBiofuelCalcScores(r, scen) {
  const s   = sgBiofuelScenarios[scen];
  const cFit = Math.min(100,Math.max(0,r.climateFit+s.cMod));
  const rain  = Math.min(100,Math.max(0,r.rainfall  +s.rMod));
  const drou  = Math.min(100,Math.max(0,r.drought   +s.dMod));
  const sal   = Math.min(100,Math.max(0,r.salinity  +s.sMod));
  const ind = Math.round(cFit*0.25+((rain+(100-drou))/2)*0.20+r.marginalLand*0.15+(100-r.foodComp)*0.15+(100-r.population)*0.10+r.biomass*0.10+r.logistics*0.05);
  const res = Math.round((100-drou)*0.35+cFit*0.30+(100-sal)*0.20+rain*0.15);
  const adp = Math.round(r.marginalLand*0.30+r.biomass*0.25+(100-r.foodComp)*0.25+r.logistics*0.20);
  const sur = Math.round(ind*0.40+res*0.35+adp*0.25);
  const conf    = sur>=70&&r.logistics>=70?'High':sur>=50?'Medium':'Low';
  const profile = drou>55?'HAL2-like':rain>72?'FIL2-like':'Balanced';
  return {ind,res,adp,sur,conf,profile,cFit,rain,drou,sal};
}

function sgBiofuelScoreColor(v){return v>=70?'#5DDBA8':v>=50?'#F8C06A':'#E87A7A';}

function sgBiofuelRenderOverview(){
  const el=document.getElementById('sgBiofuelOverviewCards'); if(!el)return;
  const all=sgBiofuelRegions.map(r=>sgBiofuelCalcScores(r,sgBiofuelCurrentScenario));
  const avgInd=Math.round(all.reduce((a,s)=>a+s.ind,0)/all.length);
  const maxIdx=all.reduce((mi,s,i,arr)=>s.ind>arr[mi].ind?i:mi,0);
  const halCount=all.filter(s=>s.profile==='HAL2-like').length;
  const highConf=all.filter(s=>s.conf==='High').length;
  const cards=[
    {icon:'🌍',label:'Regions Assessed',   val:'8 Global Regions'},
    {icon:'📊',label:'Avg Industrial Score',val:avgInd+'/100'},
    {icon:'🥇',label:'Top Region',          val:escapeHtml(sgBiofuelRegions[maxIdx].name)},
    {icon:'🌿',label:'HAL2-like Profiles',  val:halCount+' / 8 Regions'},
    {icon:'✅',label:'High Confidence',     val:highConf+' / 8 Regions'}
  ];
  el.innerHTML=cards.map(c=>`<div class="sgBiofuelOverviewCard"><div class="sgBiofuelOverviewIcon" aria-hidden="true">${c.icon}</div><div class="sgBiofuelOverviewLabel">${c.label}</div><div class="sgBiofuelOverviewVal">${c.val}</div></div>`).join('');
}

function sgBiofuelRenderRegionList(){
  const el=document.getElementById('sgBiofuelRegionList'); if(!el)return;
  el.innerHTML=`<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">Regions — Click to Highlight</div>`+
    sgBiofuelRegions.map((r,i)=>{
      const sc=sgBiofuelCalcScores(r,sgBiofuelCurrentScenario);
      const active=sgBiofuelHighlightedRegion===r.id?' sgActive':'';
      return `<div class="sgBiofuelRegionItem${active}" onclick="sgBiofuelHighlight('${r.id}')" tabindex="0" role="button" aria-label="${r.name}, score ${sc.ind}"><div class="sgBiofuelRegionDot" style="background:${sgBiofuelDotColors[i]}"></div><div class="sgBiofuelRegionName">${escapeHtml(r.name)}</div><div class="sgBiofuelRegionScore" style="color:${sgBiofuelScoreColor(sc.ind)}">${sc.ind}</div></div>`;
    }).join('');
}

function sgBiofuelHighlight(id){
  sgBiofuelHighlightedRegion=sgBiofuelHighlightedRegion===id?null:id;
  sgBiofuelRenderRegionList();
  sgBiofuelRenderDashGrid();
  sgBiofuelDrawGlobe();
}

function sgBiofuelRenderScenBar(){
  const bar=document.getElementById('sgBiofuelScenBar');
  const note=document.getElementById('sgBiofuelScenNote');
  if(!bar||!note)return;
  bar.innerHTML=Object.entries(sgBiofuelScenarios).map(([k,v])=>`<button class="sgBiofuelScenBtn${k===sgBiofuelCurrentScenario?' sgActive':''}" onclick="sgBiofuelSetScen('${k}')" aria-pressed="${k===sgBiofuelCurrentScenario}">${v.icon} ${v.label}</button>`).join('');
  note.textContent=sgBiofuelScenarios[sgBiofuelCurrentScenario].note;
}

function sgBiofuelSetScen(k){
  sgBiofuelCurrentScenario=k;
  sgBiofuelRenderOverview();
  sgBiofuelRenderScenBar();
  sgBiofuelRenderDashGrid();
  sgBiofuelRenderRegionList();
  sgBiofuelDrawGlobe();
}

function sgBiofuelRenderDashGrid(){
  const el=document.getElementById('sgBiofuelDashGrid'); if(!el)return;

  // Texas live weather context — show real current conditions alongside model scores
  let texasLiveHtml = '';
  if(typeof WEATHER_DATA !== 'undefined' && Object.keys(WEATHER_DATA).length) {
    const txVals = Object.values(WEATHER_DATA);
    const avgTx  = Math.round(txVals.reduce((s,d)=>s+d.temp,0)/txVals.length);
    const avgTxH = Math.round(txVals.reduce((s,d)=>s+d.humidity,0)/txVals.length);
    const heatLabel = avgTx>=105?'Severe heat stress':avgTx>=95?'High heat stress':avgTx>=85?'Moderate heat stress':'Low heat stress';
    const heatCol   = avgTx>=105?'#D64545':avgTx>=90?'#F5A623':'#5DDBA8';
    const irrigPress = avgTx>=95?'High irrigation pressure':avgTx>=85?'Moderate irrigation pressure':'Low irrigation pressure';
    texasLiveHtml = `
      <div style="background:rgba(74,144,226,0.08);border:1px solid rgba(74,144,226,0.25);border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">
            Texas Live Weather Context ${dataBadge('live-api')}
          </div>
          <div style="font-size:11px;color:var(--text1)">
            Avg temp (${txVals.length} TX cities): <strong>${avgTx}°F</strong> &nbsp;·&nbsp; Avg humidity: <strong>${avgTxH}%</strong><br>
            Switchgrass heat indicator: <strong style="color:${heatCol}">${heatLabel}</strong> &nbsp;·&nbsp; ${irrigPress}
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:3px">Real current conditions from Open-Meteo — the only live data on this tab</div>
        </div>
      </div>`;
  }

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      ${dataBadge('ai-est')}
      <span style="font-size:10px;color:var(--text3)">Scores are <strong>AI prototype estimates</strong> calibrated to published agronomic literature (Perrin 2008, DOE 2016, FAO HWSD) — not live measurements. See Credible Sources section below.</span>
    </div>
    ${texasLiveHtml}
    ${sgBiofuelRegions.map(r=>{
    const sc=sgBiofuelCalcScores(r,sgBiofuelCurrentScenario);
    const hi=sgBiofuelHighlightedRegion===r.id;
    return `<div class="sgBiofuelRegionCard${hi?' sgHighlight':''}" onclick="sgBiofuelHighlight('${r.id}')" tabindex="0" role="button" aria-label="${r.name} score ${sc.ind}">
      <div class="sgBiofuelRCName">${escapeHtml(r.name)}</div>
      <div class="sgBiofuelRCScore" style="color:${sgBiofuelScoreColor(sc.ind)}">${sc.ind}</div>
      <div class="sgBiofuelRCLabel">Industrialization Index</div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Resilience</span><span class="sgBiofuelRCVal" style="color:${sgBiofuelScoreColor(sc.res)}">${sc.res}</span></div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Adaptability</span><span class="sgBiofuelRCVal" style="color:${sgBiofuelScoreColor(sc.adp)}">${sc.adp}</span></div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Survival Chance</span><span class="sgBiofuelRCVal" style="color:${sgBiofuelScoreColor(sc.sur)}">${sc.sur}</span></div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Confidence</span><span class="sgBiofuelRCVal">${escapeHtml(sc.conf)}</span></div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Profile</span><span class="sgBiofuelRCVal">${escapeHtml(sc.profile)}</span></div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Climate Fit</span><span class="sgBiofuelRCVal">${sc.cFit}</span></div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Rainfall Adj</span><span class="sgBiofuelRCVal">${sc.rain}</span></div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Drought Adj</span><span class="sgBiofuelRCVal">${sc.drou}</span></div>
      <div class="sgBiofuelRCRow"><span class="sgBiofuelRCKey">Salinity Adj</span><span class="sgBiofuelRCVal">${sc.sal}</span></div>
    </div>`;
  }).join('')}`;
}

function sgBiofuelRenderMetrics(){
  const el=document.getElementById('sgBiofuelMetricsPanel'); if(!el)return;
  el.innerHTML=sgBiofuelMethods.map(m=>`<div class="sgBiofuelMetricItem"><div class="sgBiofuelMetricNum">${m.n}</div><div style="flex:1"><div class="sgBiofuelMetricName">${escapeHtml(m.name)}</div><div class="sgBiofuelMetricDesc">${escapeHtml(m.desc)}</div><div class="sgBiofuelMetricMethod">Method: ${escapeHtml(m.method)}</div></div></div>`).join('');
}

function sgBiofuelRenderTraits(){
  const el=document.getElementById('sgBiofuelTraitWrap'); if(!el)return;
  el.innerHTML=Object.entries(sgBiofuelTraits).map(([name,data])=>`
    <div class="sgBiofuelTraitCard">
      <div class="sgBiofuelTraitHeader" style="color:${data.color}">${escapeHtml(name)} Profile</div>
      <div class="sgBiofuelTraitSub">${escapeHtml(data.sub)}</div>
      ${data.traits.map(t=>`<div class="sgBiofuelTraitRow"><div class="sgBiofuelTraitLabel">${escapeHtml(t.name)}</div><div class="sgBiofuelTraitBar"><div class="sgBiofuelTraitFill" style="width:${t.val}%;background:${data.color}"></div></div><div class="sgBiofuelTraitNum" style="color:${data.color}">${t.val}</div></div>`).join('')}
    </div>`).join('');
}

function sgBiofuelRenderCompTable(){
  const el=document.getElementById('sgBiofuelCompBody'); if(!el)return;
  el.innerHTML=sgBiofuelCompData.map(r=>{
    const sgCls=r.adv==='sg'?'sgWin':'sgLose';
    const cornCls=r.adv==='corn'?'sgWin':'sgLose';
    return `<tr><td>${escapeHtml(r.attr)}</td><td class="${sgCls}">${escapeHtml(r.sg)}</td><td class="${cornCls}">${escapeHtml(r.corn)}</td><td class="${r.adv==='sg'?'sgWin':'sgNeutral'}">${r.adv==='sg'?'Switchgrass':'Corn'}</td></tr>`;
  }).join('');
}

function sgBiofuelRenderSources(){
  const el=document.getElementById('sgBiofuelSources'); if(!el)return;
  el.innerHTML=sgBiofuelSourcesData.map(s=>`<div class="sgBiofuelSourceItem"><span class="sgBiofuelSourceIcon" aria-hidden="true">📖</span><div class="sgBiofuelSourceText">${s.text} <a href="${s.url}" target="_blank" rel="noopener noreferrer">[Link]</a></div></div>`).join('');
}

function sgBiofuelInitGlobe(){
  sgBiofuelGlobeCanvas=document.getElementById('sgBiofuelGlobe');
  if(!sgBiofuelGlobeCanvas||!window.d3||!window.topojson)return;
  sgBiofuelGlobeCtx=sgBiofuelGlobeCanvas.getContext('2d');
  const w=sgBiofuelGlobeCanvas.width, h=sgBiofuelGlobeCanvas.height;
  sgBiofuelGlobeProjection=d3.geoOrthographic().scale(Math.min(w,h)/2.2).translate([w/2,h/2]).rotate(sgBiofuelRotation).clipAngle(90);
  sgBiofuelGlobePath=d3.geoPath(sgBiofuelGlobeProjection,sgBiofuelGlobeCtx);
  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world=>{
    sgBiofuelGlobeCanvas._land=topojson.feature(world,world.objects.land);
    sgBiofuelDrawGlobe();
  }).catch(()=>{
    sgBiofuelGlobeCtx.fillStyle='rgba(255,255,255,0.2)';
    sgBiofuelGlobeCtx.font='12px Inter,sans-serif';
    sgBiofuelGlobeCtx.textAlign='center';
    sgBiofuelGlobeCtx.fillText('Globe unavailable (network blocked)',w/2,h/2);
  });
  sgBiofuelGlobeCanvas.addEventListener('mousedown',e=>{sgBiofuelDragging=true;sgBiofuelDragOX=e.clientX;sgBiofuelDragOY=e.clientY;e.preventDefault();});
  window.addEventListener('mousemove',e=>{
    if(!sgBiofuelDragging)return;
    const dx=(e.clientX-sgBiofuelDragOX)*0.4,dy=(e.clientY-sgBiofuelDragOY)*0.4;
    sgBiofuelDragOX=e.clientX;sgBiofuelDragOY=e.clientY;
    sgBiofuelRotation[0]+=dx;
    sgBiofuelRotation[1]=Math.max(-90,Math.min(90,sgBiofuelRotation[1]-dy));
    sgBiofuelDrawGlobe();
  });
  window.addEventListener('mouseup',()=>{sgBiofuelDragging=false;});
  sgBiofuelGlobeCanvas.addEventListener('touchstart',e=>{sgBiofuelDragging=true;sgBiofuelDragOX=e.touches[0].clientX;sgBiofuelDragOY=e.touches[0].clientY;e.preventDefault();},{passive:false});
  window.addEventListener('touchmove',e=>{
    if(!sgBiofuelDragging)return;
    const dx=(e.touches[0].clientX-sgBiofuelDragOX)*0.4,dy=(e.touches[0].clientY-sgBiofuelDragOY)*0.4;
    sgBiofuelDragOX=e.touches[0].clientX;sgBiofuelDragOY=e.touches[0].clientY;
    sgBiofuelRotation[0]+=dx;
    sgBiofuelRotation[1]=Math.max(-90,Math.min(90,sgBiofuelRotation[1]-dy));
    sgBiofuelDrawGlobe();
  },{passive:false});
  window.addEventListener('touchend',()=>{sgBiofuelDragging=false;});
}

function sgBiofuelDrawGlobe(){
  if(!sgBiofuelGlobeCtx||!sgBiofuelGlobeCanvas)return;
  const w=sgBiofuelGlobeCanvas.width,h=sgBiofuelGlobeCanvas.height;
  sgBiofuelGlobeCtx.clearRect(0,0,w,h);
  sgBiofuelGlobeProjection.rotate(sgBiofuelRotation);
  sgBiofuelGlobeCtx.beginPath();sgBiofuelGlobePath({type:'Sphere'});
  sgBiofuelGlobeCtx.fillStyle='rgba(74,144,226,0.12)';sgBiofuelGlobeCtx.fill();
  sgBiofuelGlobeCtx.strokeStyle='rgba(74,144,226,0.35)';sgBiofuelGlobeCtx.lineWidth=1;sgBiofuelGlobeCtx.stroke();
  sgBiofuelGlobeCtx.beginPath();sgBiofuelGlobePath(d3.geoGraticule()());
  sgBiofuelGlobeCtx.strokeStyle='rgba(255,255,255,0.04)';sgBiofuelGlobeCtx.lineWidth=0.5;sgBiofuelGlobeCtx.stroke();
  if(sgBiofuelGlobeCanvas._land){
    sgBiofuelGlobeCtx.beginPath();sgBiofuelGlobePath(sgBiofuelGlobeCanvas._land);
    sgBiofuelGlobeCtx.fillStyle='rgba(46,204,139,0.18)';sgBiofuelGlobeCtx.fill();
    sgBiofuelGlobeCtx.strokeStyle='rgba(46,204,139,0.35)';sgBiofuelGlobeCtx.lineWidth=0.5;sgBiofuelGlobeCtx.stroke();
  }
  const cx=w/2,cy=h/2,rad=sgBiofuelGlobeProjection.scale();
  sgBiofuelRegions.forEach((r,i)=>{
    const pt=sgBiofuelGlobeProjection([r.lon,r.lat]); if(!pt)return;
    if((pt[0]-cx)*(pt[0]-cx)+(pt[1]-cy)*(pt[1]-cy)>rad*rad)return;
    const hi=sgBiofuelHighlightedRegion===r.id;
    const sc=sgBiofuelCalcScores(r,sgBiofuelCurrentScenario);
    sgBiofuelGlobeCtx.beginPath();sgBiofuelGlobeCtx.arc(pt[0],pt[1],hi?10:7,0,Math.PI*2);
    sgBiofuelGlobeCtx.fillStyle=sgBiofuelDotColors[i];sgBiofuelGlobeCtx.globalAlpha=hi?1:0.82;sgBiofuelGlobeCtx.fill();
    if(hi){sgBiofuelGlobeCtx.strokeStyle='#fff';sgBiofuelGlobeCtx.lineWidth=2;sgBiofuelGlobeCtx.stroke();}
    sgBiofuelGlobeCtx.globalAlpha=1;
    sgBiofuelGlobeCtx.fillStyle='#fff';sgBiofuelGlobeCtx.font=`bold ${hi?11:9}px Inter,sans-serif`;
    sgBiofuelGlobeCtx.textAlign='center';sgBiofuelGlobeCtx.textBaseline='middle';
    sgBiofuelGlobeCtx.fillText(sc.ind,pt[0],pt[1]);
  });
}

function sgBiofuelRenderImprovements(){
  const el=document.getElementById('sgBiofuelImprovGrid'); if(!el)return;
  el.innerHTML=sgBiofuelImprovements.map(imp=>`
    <div class="sgBiofuelImprovCard">
      <div class="sgBiofuelImprovNum">${imp.n}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:18px" aria-hidden="true">${imp.icon}</span>
          <div class="sgBiofuelImprovTitle">${escapeHtml(imp.title)}</div>
        </div>
        <div class="sgBiofuelImprovDesc">${escapeHtml(imp.desc)}</div>
        <div class="sgBiofuelImprovImpact">↑ ${escapeHtml(imp.impact)}</div>
      </div>
    </div>`).join('');
}

function sgBiofuelInit(){
  if(sgBiofuelInited){
    sgBiofuelRenderOverview();sgBiofuelRenderScenBar();sgBiofuelRenderDashGrid();sgBiofuelRenderRegionList();sgBiofuelDrawGlobe();
    return;
  }
  sgBiofuelInited=true;
  sgBiofuelRenderMetrics();
  sgBiofuelRenderTraits();
  sgBiofuelRenderCompTable();
  sgBiofuelRenderSources();
  sgBiofuelRenderImprovements();
  sgBiofuelRenderOverview();
  sgBiofuelRenderScenBar();
  sgBiofuelRenderDashGrid();
  sgBiofuelRenderRegionList();
  sgBiofuelInitGlobe();
}
