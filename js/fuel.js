'use strict';

// ── Fuel Efficiency — Data ────────────────────────────────────────────────────
const fuelTypes = [
  {icon:'⛽',color:'#2ECC8B',name:'Cellulosic Ethanol',tag:'Primary switchgrass pathway — E10 to E85',
   yield:'60–90 gal / dry ton',eroi:'5.4 : 1',co2:'94% less GHG vs gasoline',use:'Flex-fuel vehicles, E85 pumps',
   ingredients:['Switchgrass dry biomass','Dilute sulfuric acid or steam (pretreatment)','Cellulase & hemicellulase enzymes','Yeast — Saccharomyces cerevisiae or C5-fermenting strains','Process water (recirculated)','Ammonia / lime for pH neutralization'],
   process:['Harvest & bale switchgrass at peak fall biomass','Mechanical size reduction: chipping & hammer milling','Pretreatment: dilute acid or steam explosion breaks lignin barrier','Enzymatic hydrolysis: cellulases convert cellulose → fermentable sugars','Fermentation: yeast converts C6 + C5 sugars → ethanol + CO₂','Distillation & molecular sieve dehydration → 99.5% ethanol','Lignin residue combusted for process heat & electricity']},
  {icon:'💨',color:'#4A90E2',name:'Biogas / Biomethane (RNG)',tag:'Renewable natural gas via anaerobic digestion',
   yield:'350–450 m³ CH₄ / dry ton',eroi:'4.1 : 1',co2:'80% less GHG vs fossil natural gas',use:'CNG vehicles, grid injection, power generation',
   ingredients:['Switchgrass biomass (fresh or ensiled)','Process water','Anaerobic bacterial consortia: hydrolytic, acetogenic, methanogenic','Trace minerals: Fe, Co, Ni, Se','Digestate (recirculated as fertilizer)'],
   process:['Chop switchgrass; ensiling improves digestibility by 15–20%','Load into heated anaerobic digester (mesophilic 35°C or thermophilic 55°C)','Hydrolysis & acidogenesis: bacteria break polymers to organic acids','Acetogenesis: acids converted to acetate + H₂','Methanogenesis: archaea produce CH₄ + CO₂ (biogas ~60% CH₄)','Biogas scrubbing: remove CO₂ & H₂S → biomethane 97%+ purity','Compress for vehicles or inject directly into gas pipeline']},
  {icon:'✈',color:'#F5A623',name:'Biojet Fuel (SAF)',tag:'Sustainable aviation fuel — Fischer-Tropsch pathway',
   yield:'30–50 gal / dry ton',eroi:'3.2 : 1',co2:'80% less lifecycle GHG vs fossil jet',use:'Commercial & military aviation (up to 50% blend)',
   ingredients:['Switchgrass biomass','Oxygen (from air separation unit)','Steam','Iron or cobalt Fischer-Tropsch catalyst','Hydrogen (from water-gas shift reactor)'],
   process:['High-temperature gasification at 800–1000°C: biomass + O₂ + steam → syngas (CO + H₂)','Syngas cleanup: tar cracking, scrubbing, desulfurization','Water-gas shift reactor: adjust H₂:CO ratio to 2:1','Fischer-Tropsch synthesis: CO + H₂ → long-chain paraffinic hydrocarbons','Hydrocracking & isomerization → C8–C16 jet fuel range','Quality testing to ASTM D7566 Annex 1 specification','Blend with fossil jet at up to 50% (current ICAO certification)']},
  {icon:'⚡',color:'#9B59B6',name:'Green Hydrogen (Bio-H₂)',tag:'Carbon-negative hydrogen via gasification + CCS',
   yield:'50–80 kg H₂ / dry ton',eroi:'2.8 : 1',co2:'Carbon-negative when CCS applied',use:'Fuel cell vehicles, industrial feedstock, grid storage',
   ingredients:['Switchgrass biomass','High-temperature steam (700–900°C)','Nickel-based reforming catalyst','CO₂ capture sorbent (for carbon-negative route)','Pressure swing adsorption (PSA) system'],
   process:['Biomass gasification at 750°C: produce raw syngas (CO, H₂, CH₄, CO₂)','Steam methane reforming: CH₄ + H₂O → CO + H₂','Water-gas shift reaction: CO + H₂O → CO₂ + H₂ (maximizes H₂)','CO₂ capture via amine scrubbing or solid sorbent (optional CCS)','Pressure swing adsorption: purify H₂ to 99.999% purity','Compression to 700 bar for vehicle storage tanks','Dispensed at hydrogen fueling stations or pipeline transport']},
  {icon:'🔥',color:'#D64545',name:'Bio-oil & Biochar (Pyrolysis)',tag:'Thermochemical multi-product conversion',
   yield:'65% bio-oil · 15% biochar · 20% syngas',eroi:'3.5 : 1',co2:'Net carbon-negative (biochar sequesters 300+ yr)',use:'Bio-oil: power & heat; Biochar: soil amendment + carbon credit',
   ingredients:['Dried switchgrass (<10% moisture)','Fluidized bed sand (heat transfer medium)','Inert atmosphere — nitrogen purge','Catalyst (zeolite for bio-oil upgrading)'],
   process:['Dry switchgrass to <10% moisture content','Feed into fluidized bed reactor at 450–550°C (2-sec residence time)','Rapid quench: bio-oil vapors condense to dark liquid','Biochar collected from cyclone separator','Non-condensable syngas recycled to heat the reactor (energy self-sufficient)','Bio-oil upgraded via hydrodeoxygenation to stable fuel','Biochar applied to fields or buried for permanent carbon storage']}
];

const fuelImpactData = [
  {icon:'🛢',val:'4.8M bbl',label:'Oil Barrels Displaced',sub:'per million acres of switchgrass via cellulosic ethanol pathway annually'},
  {icon:'🚗',val:'1.3M cars',label:'Vehicles Removed Equivalent',sub:'annual CO₂ reduction from 1 million acres vs conventional gasoline'},
  {icon:'🏭',val:'200M gal',label:'Gasoline Equivalent Saved',sub:'energy-equivalent displacement per million acres per year'},
  {icon:'🌍',val:'2.1M tons',label:'CO₂ Sequestered',sub:'soil organic carbon + above-ground biomass per million acres annually'},
  {icon:'💰',val:'$480M',label:'Import Cost Savings',sub:'crude oil import savings at $3.20/gal equivalent, per million acres'},
  {icon:'⚡',val:'0.7%',label:'U.S. Energy Independence',sub:'share of liquid fuel supply met by 10 million acres at full deployment'}
];

const fuelCornData = {
  sg:{name:'Switchgrass Cellulosic Ethanol',color:'#2ECC8B',
    metrics:[
      {label:'Fuel yield (gal/acre/yr)', val:450, max:500, display:'350–550'},
      {label:'Water use (gal/gal fuel)',  val:12,  max:800, display:'6–14'},
      {label:'EROI',                     val:54,  max:60,  display:'5.4 : 1'},
      {label:'GHG savings vs gasoline',  val:94,  max:100, display:'94%'},
      {label:'Input cost ($/acre/yr)',    val:48,  max:200, display:'~$45–55'},
      {label:'Land type usable',         val:100, max:100, display:'Marginal + prime'},
      {label:'Soil health impact',       val:90,  max:100, display:'Highly positive'},
      {label:'Biodiversity benefit',     val:85,  max:100, display:'High (perennial)'}
    ]},
  corn:{name:'Corn Starch Ethanol (E10/E85)',color:'#F5A623',
    metrics:[
      {label:'Fuel yield (gal/acre/yr)', val:420, max:500, display:'380–460'},
      {label:'Water use (gal/gal fuel)',  val:784, max:800, display:'784'},
      {label:'EROI',                     val:13,  max:60,  display:'1.3 : 1'},
      {label:'GHG savings vs gasoline',  val:19,  max:100, display:'19%'},
      {label:'Input cost ($/acre/yr)',    val:185, max:200, display:'~$175–210'},
      {label:'Land type usable',         val:45,  max:100, display:'Prime cropland only'},
      {label:'Soil health impact',       val:30,  max:100, display:'Neutral to negative'},
      {label:'Biodiversity benefit',     val:15,  max:100, display:'Low (annual monoculture)'}
    ]}
};

// ── Fuel Efficiency — State ───────────────────────────────────────────────────
let fuelEffInited = false;
let fuelCalcAcres = 1;

// ── Fuel Efficiency — Functions ───────────────────────────────────────────────
function fuelEffRenderTypes(){
  const el=document.getElementById('fuelTypesGrid'); if(!el)return;
  const noteHtml=`<div style="grid-column:1/-1;display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">${dataBadge('peer-rev')}<span style="font-size:10px;color:var(--text3)">Yield, EROI, and GHG values from <strong>peer-reviewed life-cycle literature</strong> (PNAS, NREL, DOE) — not live measurements.</span></div>`;
  el.innerHTML=noteHtml+fuelTypes.map(f=>`
    <div class="fuelTypeCard" style="border-color:${f.color}22">
      <div class="fuelTypeHeader">
        <div class="fuelTypeIcon" aria-hidden="true">${f.icon}</div>
        <div><div class="fuelTypeName" style="color:${f.color}">${escapeHtml(f.name)}</div><div class="fuelTypeTag">${escapeHtml(f.tag)}</div></div>
      </div>
      <div class="fuelStat"><span class="fuelStatKey">Yield</span><span class="fuelStatVal" style="color:${f.color}">${escapeHtml(f.yield)}</span></div>
      <div class="fuelStat"><span class="fuelStatKey">EROI</span><span class="fuelStatVal">${escapeHtml(f.eroi)}</span></div>
      <div class="fuelStat"><span class="fuelStatKey">GHG reduction</span><span class="fuelStatVal">${escapeHtml(f.co2)}</span></div>
      <div class="fuelStat"><span class="fuelStatKey">Use case</span><span class="fuelStatVal" style="font-size:9px;text-align:right;max-width:120px">${escapeHtml(f.use)}</span></div>
      <div class="fuelIngBox">
        <div class="fuelIngTitle">Ingredients</div>
        ${f.ingredients.map(i=>`<div class="fuelIngItem">${escapeHtml(i)}</div>`).join('')}
      </div>
      <div class="fuelProcessBox">
        <div class="fuelProcessTitle">Production Process</div>
        ${f.process.map((s,i)=>`<div class="fuelProcessStep"><span class="fuelProcessNum">${i+1}</span><span>${escapeHtml(s)}</span></div>`).join('')}
      </div>
    </div>`).join('');
}

function fuelEffRenderImpact(){
  const el=document.getElementById('fuelImpactGrid'); if(!el)return;
  el.innerHTML=fuelImpactData.map(d=>`
    <div class="fuelImpactCard">
      <div class="fuelImpactIcon" aria-hidden="true">${d.icon}</div>
      <div class="fuelImpactVal">${escapeHtml(d.val)}</div>
      <div class="fuelImpactLabel">${escapeHtml(d.label)}</div>
      <div class="fuelImpactSub">${escapeHtml(d.sub)}</div>
    </div>`).join('');
}

function fuelEffUpdateCalc(){
  const acres  = parseFloat(document.getElementById('fuelCalcRange')?.value||1);
  const reg    = window._fuelCurrentRegion || {yieldMult:1,waterMult:1,costMult:1,jobMult:1};
  const acresActual = acres * 1000;
  // Base rates per acre: Perrin 2008, DOE 2016, ORNL BioEnergy Atlas
  // 450 gal/acre ethanol, 4.8 bbl/acre oil displaced, 2.1 t/acre CO₂, 11 jobs/1000 acres
  const ethanol = Math.round(acresActual * 450 * reg.yieldMult / 1e9 * 100) / 100; // B gal
  const oilBbl  = Math.round(acresActual * 4.8  * reg.yieldMult / 1e9 * 100) / 100; // B bbl
  const co2tons = Math.round(acresActual * 2.1  * reg.yieldMult / 1e6 * 10)  / 10;  // M t
  const jobs    = Math.round(acresActual * 11   * reg.jobMult   / 1e6 * 100) / 100; // M jobs
  const acreLabel = acres>=1000?(acres/1000).toFixed(1)+'M':acres+'K';
  document.getElementById('fuelCalcAcresVal').textContent = acreLabel;
  document.getElementById('fuelCalcEthanol').textContent  = ethanol+'B gal';
  document.getElementById('fuelCalcOil').textContent      = oilBbl+'B bbl';
  document.getElementById('fuelCalcCO2').textContent      = co2tons+'M t';
  document.getElementById('fuelCalcJobs').textContent     = jobs+'M';
}

function fuelEffRenderCalc(){
  const el=document.getElementById('fuelCalcPanel'); if(!el)return;

  // Regional deployment zones with specific impact multipliers
  // Based on: Perrin et al. 2008, DOE Billion-Ton Report 2016, ORNL BioEnergy Atlas
  const regions = [
    {id:'texas',     label:'Texas',          yieldMult:1.05, waterMult:0.9,  costMult:0.95, jobMult:1.1,  note:'High suitability — marginal land + existing ag infrastructure'},
    {id:'gplains',   label:'U.S. Great Plains',yieldMult:1.0,waterMult:0.85,costMult:0.9,  jobMult:1.0,  note:'Top overall score — best logistics + marginal land availability'},
    {id:'southeast', label:'Southeast U.S.',  yieldMult:1.15,waterMult:1.1,  costMult:1.05, jobMult:1.05, note:'High rainfall + warm climate → highest biomass yield potential'},
    {id:'midwest',   label:'Midwest U.S.',    yieldMult:0.9, waterMult:1.0,  costMult:1.15, jobMult:0.9,  note:'Good logistics; food-crop competition limits marginal land'},
    {id:'brazil',    label:'Brazil Cerrado',  yieldMult:1.2, waterMult:1.2,  costMult:0.75, jobMult:0.85, note:'Highest yield potential; logistics and policy risk reduce viability'},
    {id:'europe',    label:'Eastern Europe',  yieldMult:0.95,waterMult:0.95, costMult:1.2,  jobMult:0.95, note:'Good climate fit; RED III mandates improve policy viability'}
  ];

  el.innerHTML=`
    <p style="font-size:11px;color:var(--text2);margin-bottom:16px">Select a deployment region and scale to see projected impact. Values based on cellulosic ethanol pathway assumptions from published research (Perrin 2008, DOE 2016, ORNL BioEnergy Atlas).</p>

    <div style="margin-bottom:14px">
      <div class="fuelCalcLabel" style="margin-bottom:8px">Deployment Region</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px" id="fuelRegionBtns">
        ${regions.map((r,i)=>`<button class="sgBiofuelScenBtn${i===0?' sgActive':''}" onclick="fuelSelectRegion('${r.id}')" id="fuelReg_${r.id}" aria-pressed="${i===0}">${escapeHtml(r.label)}</button>`).join('')}
      </div>
      <div id="fuelRegionNote" style="font-size:10px;color:var(--text3);margin-top:8px">${escapeHtml(regions[0].note)}</div>
    </div>

    <div class="fuelCalcRow">
      <div class="fuelCalcLabel">Deployment Scale (thousand acres)</div>
      <input class="fuelCalcSlider" type="range" id="fuelCalcRange" min="100" max="50000" step="100" value="1000" oninput="fuelEffUpdateCalc()">
      <div class="fuelCalcVal" id="fuelCalcAcresVal">1K</div>
    </div>

    <div class="fuelCalcResults" style="margin-bottom:12px">
      <div class="fuelCalcResult"><div class="fuelCalcResultVal" id="fuelCalcEthanol">—</div><div class="fuelCalcResultLabel">Cellulosic Ethanol</div><div style="font-size:9px;color:var(--text3)">billion gallons/yr</div></div>
      <div class="fuelCalcResult"><div class="fuelCalcResultVal" id="fuelCalcOil">—</div><div class="fuelCalcResultLabel">Oil Displaced</div><div style="font-size:9px;color:var(--text3)">billion barrels/yr</div></div>
      <div class="fuelCalcResult"><div class="fuelCalcResultVal" id="fuelCalcCO2">—</div><div class="fuelCalcResultLabel">CO₂ Sequestered</div><div style="font-size:9px;color:var(--text3)">million tons/yr</div></div>
      <div class="fuelCalcResult"><div class="fuelCalcResultVal" id="fuelCalcJobs">—</div><div class="fuelCalcResultLabel">Rural Jobs</div><div style="font-size:9px;color:var(--text3)">million direct + indirect</div></div>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:10px;color:var(--text2);line-height:1.6">
      <strong style="color:var(--text0)">What changes by region:</strong>
      Yield multiplier adjusts ethanol output (rainfall, growing season, ecotype fit).
      Cost multiplier reflects land, labor, and logistics variation.
      Job multiplier reflects local ag infrastructure density.
      All base figures from Perrin et al. 2008, DOE Billion-Ton Report 2016, and ORNL BioEnergy Atlas.
    </div>`;

  // Store regions in closure for the onclick handler
  window._fuelRegions = regions;
  window._fuelCurrentRegion = regions[0];
  fuelEffUpdateCalc();
}

function fuelSelectRegion(id){
  const reg = window._fuelRegions?.find(r=>r.id===id);
  if(!reg) return;
  window._fuelCurrentRegion = reg;
  document.querySelectorAll('#fuelRegionBtns button').forEach(b=>{
    b.classList.toggle('sgActive', b.id===`fuelReg_${id}`);
    b.setAttribute('aria-pressed', b.id===`fuelReg_${id}`);
  });
  const noteEl = document.getElementById('fuelRegionNote');
  if(noteEl) noteEl.textContent = reg.note;
  fuelEffUpdateCalc();
}

function fuelEffRenderCornComp(){
  const el=document.getElementById('fuelCornWrap'); if(!el)return;
  el.innerHTML=Object.values(fuelCornData).map(f=>`
    <div class="fuelCornCard" style="border-color:${f.color}33">
      <div class="fuelCornHeader" style="color:${f.color}">${escapeHtml(f.name)}</div>
      <div class="fuelCornSub">Per-metric comparison (bar = proportion of max reference value)</div>
      ${f.metrics.map(m=>`
        <div class="fuelCornRow">
          <div class="fuelCornMetric">${escapeHtml(m.label)}</div>
          <div class="fuelCornBar"><div class="fuelCornFill" style="width:${Math.min(100,Math.round(m.val/m.max*100))}%;background:${f.color}"></div></div>
          <div class="fuelCornNum" style="color:${f.color}">${escapeHtml(m.display)}</div>
        </div>`).join('')}
    </div>`).join('');
}

function fuelEffInit(){
  if(fuelEffInited) return;
  fuelEffInited=true;
  fuelEffRenderTypes();
  fuelEffRenderImpact();
  fuelEffRenderCalc();
  fuelEffRenderCornComp();
}
