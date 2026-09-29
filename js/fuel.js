'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   Fuel Pathways — teaching content, with the numbers held to a lower standard
   than the rest of the app and labelled accordingly.

   The `ingredients` and `process` steps are real, well-documented chemistry and
   unit operations: those are the point of this tab and they are sound.

   The `yield`, `eroi` and `co2` figures are ORDER-OF-MAGNITUDE ILLUSTRATIVE
   RANGES. They are the kind of numbers that appear across techno-economic
   literature, but none is attributable to a specific study here, and they are
   not on a common system boundary — so they must not be compared against each
   other as if they were. This file previously attributed them collectively to
   "peer-reviewed life-cycle literature (PNAS, NREL, DOE)", which used three
   institution names in place of provenance for values none of them was checked
   against. Where a figure IS properly sourced it lives in js/claims-registry.js.
   ════════════════════════════════════════════════════════════════════════════ */
const FUEL_FIGURES_NOTICE =
  'Yield, EROI and GHG figures on this tab are illustrative order-of-magnitude ranges for teaching. ' +
  'They are not individually cited, are not on a common system boundary, and should not be compared ' +
  'against each other or quoted as results. The process chemistry beneath them is real.';

const fuelTypes = [
  {icon:'⛽',color:'#2ECC8B',name:'Cellulosic Ethanol',tag:'Primary switchgrass pathway — E10 to E85',
   yield:'~80 gal / dry ton (modelling assumption)',eroi:'~5 : 1 (illustrative)',co2:'Large reduction vs gasoline; the one properly sourced figure is 94% for Schmer et al.\'s Great Plains farms under their modelling assumptions — not a general property of the pathway',use:'Flex-fuel vehicles, E85 pumps',
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

/* Aggregate impact figures. Every one of these is a SCENARIO ARITHMETIC RESULT
   from the illustrative yield assumptions above, not a projection anyone has
   published. They were previously displayed as bare two-significant-figure
   totals with no citation and no stated assumption, which reads as a forecast.
   Each now carries the assumption it depends on. */
const FUEL_IMPACT_NOTICE =
  'Scenario arithmetic from the illustrative assumptions on this tab, shown to convey scale. ' +
  'Not a forecast, not published, and highly sensitive to the yield and conversion assumptions above.';

const fuelImpactData = [
  {icon:'🛢',val:'≈5M bbl',   label:'Oil Displaced (illustrative)',      sub:'per million acres per year, IF the ~80 gal/dry-ton conversion assumption and a mid-range biomass yield both hold'},
  {icon:'🚗',val:'≈1M cars',  label:'Vehicle-Equivalent CO₂ (illustrative)', sub:'expressing the same scenario as an equivalent number of cars — an illustration, not a measured offset'},
  {icon:'🏭',val:'≈200M gal', label:'Gasoline-Equivalent (illustrative)', sub:'energy-equivalent displacement per million acres per year under the same assumptions'},
  {icon:'🌍',val:'UNKNOWN',   label:'CO₂ Sequestered',                   sub:'no rate is quoted: soil carbon accumulation depends on soil, depth and time horizon, and the figure previously shown here could not be verified against its cited source'},
  {icon:'💰',val:'≈$500M',    label:'Import Cost (illustrative)',        sub:'the gasoline-equivalent volume above valued at a round $3/gal — arithmetic, not an economic projection'},
  {icon:'⚡',val:'<1%',       label:'Share of U.S. Liquid Fuel',         sub:'order of magnitude for 10 million acres at full deployment; the point is that it is small, not the exact figure'}
];

const fuelCornData = {
  sg:{name:'Switchgrass Cellulosic Ethanol',color:'#2ECC8B',
    metrics:[
      {label:'Fuel yield (gal/acre/yr)', val:450, max:500, display:'350–550'},
      {label:'Water use (gal/gal fuel)',  val:null, max:800, display:'UNKNOWN'}, // withdrawn: see TC_CLAIMS.ethanol_water_footprint
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
      {label:'Water use (gal/gal fuel)',  val:null, max:800, display:'UNKNOWN'}, // withdrawn: no defensible single value — see TC_CLAIMS.ethanol_water_footprint
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
  const noteHtml=`<div style="grid-column:1/-1;display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;flex-wrap:wrap">${dataBadge('edu')}<span style="font-size:10px;color:var(--text3);line-height:1.6">${escapeHtml(FUEL_FIGURES_NOTICE)}</span></div>`;
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
  el.innerHTML=`<div style="grid-column:1/-1;display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;flex-wrap:wrap">${dataBadge('edu')}<span style="font-size:10px;color:var(--text3);line-height:1.6">${escapeHtml(FUEL_IMPACT_NOTICE)}</span></div>`
    + fuelImpactData.map(d=>`
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
  // ILLUSTRATIVE per-acre rates: author-chosen round numbers showing how the
  // arithmetic scales. They are NOT from Perrin 2008, the DOE Billion-Ton Report
  // or the ORNL BioEnergy Atlas, which is what this comment used to claim.
  const ethanol = Math.round(acresActual * 450 * reg.yieldMult / 1e9 * 100) / 100; // B gal
  const oilBbl  = Math.round(acresActual * 4.8  * reg.yieldMult / 1e9 * 100) / 100; // B bbl
  const jobs    = Math.round(acresActual * 11   * reg.jobMult   / 1e6 * 100) / 100; // M jobs
  // CO2 sequestration is deliberately NOT computed. It used 2.1 t/acre/yr, from
  // the same soil-carbon rate withdrawn elsewhere in this file as unverifiable
  // against its cited source. Computing it here while withdrawing it two screens
  // away would be the same claim wearing a different label.
  const acreLabel = acres>=1000?(acres/1000).toFixed(1)+'M':acres+'K';
  document.getElementById('fuelCalcAcresVal').textContent = acreLabel;
  document.getElementById('fuelCalcEthanol').textContent  = ethanol+'B gal';
  document.getElementById('fuelCalcOil').textContent      = oilBbl+'B bbl';
  const co2El = document.getElementById('fuelCalcCO2');
  if (co2El) { co2El.textContent = 'UNKNOWN'; co2El.title =
    'No soil-carbon sequestration rate is quoted. The figure previously used here could not be verified against its cited source, and a rate is only meaningful with a stated soil, depth and time horizon.'; }
  document.getElementById('fuelCalcJobs').textContent     = jobs+'M';
}

function fuelEffRenderCalc(){
  const el=document.getElementById('fuelCalcPanel'); if(!el)return;

  // Regional multipliers: ILLUSTRATIVE and author-chosen. The direction of each
  // (higher yield in the wetter Southeast, better logistics in the Great Plains)
  // is defensible; the magnitudes are not sourced.
  const regions = [
    {id:'texas',     label:'Texas',          yieldMult:1.05, waterMult:0.9,  costMult:0.95, jobMult:1.1,  note:'High suitability — marginal land + existing ag infrastructure'},
    {id:'gplains',   label:'U.S. Great Plains',yieldMult:1.0,waterMult:0.85,costMult:0.9,  jobMult:1.0,  note:'Top overall score — best logistics + marginal land availability'},
    {id:'southeast', label:'Southeast U.S.',  yieldMult:1.15,waterMult:1.1,  costMult:1.05, jobMult:1.05, note:'High rainfall + warm climate → highest biomass yield potential'},
    {id:'midwest',   label:'Midwest U.S.',    yieldMult:0.9, waterMult:1.0,  costMult:1.15, jobMult:0.9,  note:'Good logistics; food-crop competition limits marginal land'},
    {id:'brazil',    label:'Brazil Cerrado',  yieldMult:1.2, waterMult:1.2,  costMult:0.75, jobMult:0.85, note:'Highest yield potential; logistics and policy risk reduce viability'},
    {id:'europe',    label:'Eastern Europe',  yieldMult:0.95,waterMult:0.95, costMult:1.2,  jobMult:0.95, note:'Good climate fit; RED III mandates improve policy viability'}
  ];

  el.innerHTML=`
    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:14px;flex-wrap:wrap">${dataBadge('edu')}
      <span style="font-size:10px;color:var(--text3);line-height:1.6;flex:1;min-width:200px">
        <strong>Scenario arithmetic, not a projection.</strong> Choose a region and a scale to see how the numbers
        multiply out. The per-acre rates and regional multipliers are author-chosen illustrative values &mdash; this
        panel previously attributed them to Perrin 2008, the DOE Billion-Ton Report and the ORNL BioEnergy Atlas,
        which do not contain them.</span></div>

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
      <div class="fuelCalcResult"><div class="fuelCalcResultVal" id="fuelCalcCO2">—</div><div class="fuelCalcResultLabel">CO₂ Sequestered</div><div style="font-size:9px;color:var(--text3)">no defensible rate available</div></div>
      <div class="fuelCalcResult"><div class="fuelCalcResultVal" id="fuelCalcJobs">—</div><div class="fuelCalcResultLabel">Rural Jobs</div><div style="font-size:9px;color:var(--text3)">million direct + indirect</div></div>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:10px;color:var(--text2);line-height:1.6">
      <strong style="color:var(--text0)">What changes by region:</strong>
      Yield multiplier adjusts ethanol output (rainfall, growing season, ecotype fit).
      Cost multiplier reflects land, labor, and logistics variation.
      Job multiplier reflects local ag infrastructure density.
      Every base figure and multiplier here is an author-chosen illustrative value. They are not sourced, and the
      output is arithmetic on assumptions rather than a projection of anything.
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
          <div class="fuelCornBar">${m.val==null
              ? '<div class="fuelCornFill fuelCornUnknown" style="width:100%"></div>'
              : `<div class="fuelCornFill" style="width:${Math.min(100,Math.round(m.val/m.max*100))}%;background:${f.color}"></div>`}</div>
          <div class="fuelCornNum" style="color:${m.val==null?'var(--text3)':f.color}">${m.val==null
              ? 'UNKNOWN <span class="fuelCornWhy" title="Water footprints for ethanol vary by roughly three orders of magnitude across U.S. states depending on irrigation share. No single defensible value exists, so none is shown.">why?</span>'
              : escapeHtml(m.display)}</div>
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
