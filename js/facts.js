'use strict';

// ── Biofuel Facts — all claims grounded in peer-reviewed literature ───────────
const BIOFUEL_FACTS = [
  // Switchgrass biology & agronomy
  {icon:'🌿', cat:'Switchgrass',     text:'Switchgrass (Panicum virgatum) is a native North American perennial grass that continues producing biomass for 10–15 years after a single planting, requiring no replanting costs.'},
  {icon:'🌾', cat:'Switchgrass',     text:'Switchgrass can yield 5–20 dry tons of biomass per hectare per year under field conditions, making it among the highest-yield herbaceous energy crops for North America.'},
  {icon:'🌍', cat:'Switchgrass',     text:'Switchgrass can be grown on marginal or degraded land unsuitable for food crops, avoiding direct food-vs-fuel land competition — a key advantage over corn ethanol.'},
  {icon:'💧', cat:'Switchgrass',     text:'Switchgrass requires 50–70% less nitrogen fertilizer than annual row crops like corn, substantially reducing input costs and agricultural runoff on marginal land.'},
  {icon:'🇺🇸', cat:'Switchgrass',    text:'The U.S. Department of Energy designated switchgrass a priority herbaceous bioenergy crop in the 1990s and has funded large-scale field trials across multiple U.S. regions since then.'},
  {icon:'🐝', cat:'Switchgrass',     text:'As a native perennial grass, switchgrass supports greater insect biodiversity and wildlife habitat than annual monocultures, providing ecological co-benefits alongside fuel production.'},

  // Energy balance & ethanol yield
  {icon:'⚡', cat:'Energy Balance',  text:'Under U.S. Great Plains field conditions, switchgrass cellulosic ethanol yields 540% more renewable energy than is consumed to grow and convert it. (Schmer et al., PNAS 2008)'},
  {icon:'⛽', cat:'Ethanol Yield',   text:'One dry ton of switchgrass biomass can yield approximately 60–90 gallons of cellulosic ethanol, depending on pretreatment method and feedstock composition.'},
  {icon:'🌡', cat:'Emissions',       text:'Cellulosic ethanol from switchgrass reduces lifecycle greenhouse gas emissions by approximately 85–94% compared to gasoline, per the GREET model from Argonne National Laboratory.'},
  {icon:'💧', cat:'Water Use',       text:'Cellulosic ethanol from switchgrass requires only 6–14 gallons of water per gallon of fuel — versus an estimated ~784 gallons per gallon for corn ethanol. (NREL)'},
  {icon:'🌱', cat:'Carbon',          text:'Switchgrass root systems extend 6–10 feet underground, sequestering an estimated 1.1–2.3 tonnes of CO₂ per hectare per year in soil organic carbon. (DOE Billion-Ton Report 2016)'},

  // Cell wall composition
  {icon:'🔬', cat:'Composition',     text:'Cellulose makes up 30–40% of switchgrass dry matter and hemicellulose a further 20–30% — both are convertible to fermentable sugars, but only after the lignin barrier is broken down.'},
  {icon:'⚗️', cat:'Hydrolysis',      text:'After effective pretreatment, enzymatic hydrolysis can convert cellulose to fermentable glucose at efficiencies of 70–90%, releasing the sugars needed for ethanol fermentation.'},

  // Fermentation
  {icon:'🧪', cat:'Fermentation',    text:'Yeast (Saccharomyces cerevisiae) naturally ferments 6-carbon glucose from cellulose into ethanol but cannot natively ferment 5-carbon xylose released from hemicellulose.'},
  {icon:'🦠', cat:'Fermentation',    text:'Engineered microbes such as Zymomonas mobilis and recombinant E. coli have been developed to co-ferment both C5 (xylose) and C6 (glucose) sugars from switchgrass biomass simultaneously.'},
  {icon:'🔄', cat:'Fermentation',    text:'Simultaneous Saccharification and Fermentation (SSF) combines enzymatic hydrolysis and microbial fermentation in a single step, cutting costs and reducing toxic inhibitor buildup.'},
  {icon:'⚠️', cat:'Fermentation',    text:'Fermentation inhibitors — including furfural, hydroxymethylfurfural (HMF), and acetic acid — generated during pretreatment can suppress microbial ethanol production by 30–80% if unmanaged.'},
  {icon:'🏭', cat:'Fermentation',    text:'Consolidated Bioprocessing (CBP) uses one engineered microorganism to produce cellulase enzymes, hydrolyze cellulose, and ferment sugars — potentially cutting production cost by ~$0.40/gallon.'},

  // Lignin
  {icon:'🛡', cat:'Lignin',          text:'Lignin is an aromatic polymer that makes up 15–25% of switchgrass dry matter and acts as a structural shield that physically prevents enzymes from reaching and breaking down cellulose.'},
  {icon:'🧫', cat:'Lignin',          text:'Dilute acid pretreatment (0.5–2% H₂SO₄ at 120–200°C) disrupts the lignocellulosic matrix to expose cellulose, but also generates fermentation inhibitors like furfural and HMF as byproducts.'},
  {icon:'💨', cat:'Lignin',          text:'Ammonia Fiber Expansion (AFEX) pretreatment uses pressurized liquid ammonia to swell and disrupt lignin without producing significant sugar-degradation byproducts, preserving more fermentable material.'},
  {icon:'🍄', cat:'Lignin',          text:'White-rot fungi such as Phanerochaete chrysosporium can biologically degrade lignin using extracellular peroxidase and laccase enzymes — a low-energy pretreatment pathway still under active research.'},
  {icon:'🧬', cat:'Lignin',          text:'Switchgrass with a downregulated COMT gene (lower lignin content) shows up to 38% improvement in ethanol yield per gram of biomass, demonstrating the power of targeted genetic modification. (Fu et al., 2011, Nature Biotechnology)'},
  {icon:'🔥', cat:'Lignin',          text:'Lignin recovered after pretreatment can be combusted to generate process heat and electricity for the biorefinery itself, significantly improving the facility\'s overall energy efficiency and economics.'},
];

// ── Loading Screen Facts ───────────────────────────────────────────────────────
let _lsFactIdx = 0;
let _lsFactTimer = null;

function lsFactStart() {
  const textEl = document.getElementById('lsFact');
  const catEl  = document.getElementById('lsFactCat');
  const iconEl = document.getElementById('lsFactIcon');
  if (!textEl) return;
  _lsFactIdx = Math.floor(Math.random() * BIOFUEL_FACTS.length);
  _lsFactApply(textEl, catEl, iconEl);
  _lsFactTimer = setInterval(() => {
    textEl.classList.add('ls-fact-fade');
    setTimeout(() => {
      _lsFactIdx = (_lsFactIdx + 1) % BIOFUEL_FACTS.length;
      _lsFactApply(textEl, catEl, iconEl);
      textEl.classList.remove('ls-fact-fade');
    }, 280);
  }, 3400);
}

function _lsFactApply(textEl, catEl, iconEl) {
  const f = BIOFUEL_FACTS[_lsFactIdx];
  textEl.textContent = f.text;
  if (catEl)  catEl.textContent  = f.cat.toUpperCase();
  if (iconEl) iconEl.textContent = f.icon;
}

function lsFactStop() {
  if (_lsFactTimer) { clearInterval(_lsFactTimer); _lsFactTimer = null; }
}

// ── Dashboard Fact Widget ─────────────────────────────────────────────────────
let _dashFactIdx = 0;
let _dashFactAutoTimer = null;

function biofactInit() {
  const card = document.getElementById('biofactCard');
  if (!card) return;
  _dashFactIdx = Math.floor(Math.random() * BIOFUEL_FACTS.length);
  _biofactRender(false);
  _dashFactAutoTimer = setInterval(_biofactAutoNext, 7000);
}

function _biofactAutoNext() {
  _dashFactIdx = (_dashFactIdx + 1) % BIOFUEL_FACTS.length;
  _biofactRender(true);
}

function biofactNext() {
  clearInterval(_dashFactAutoTimer);
  _dashFactIdx = (_dashFactIdx + 1) % BIOFUEL_FACTS.length;
  _biofactRender(true);
  _dashFactAutoTimer = setInterval(_biofactAutoNext, 7000);
}

function _biofactRender(animate) {
  const card    = document.getElementById('biofactCard');
  const textEl  = document.getElementById('biofactText');
  const catEl   = document.getElementById('biofactCat');
  const iconEl  = document.getElementById('biofactIcon');
  const ctrEl   = document.getElementById('biofactCounter');
  if (!textEl) return;
  const f = BIOFUEL_FACTS[_dashFactIdx];

  if (animate && card) {
    card.classList.add('biofact-flash');
    setTimeout(() => {
      textEl.textContent  = f.text;
      if (catEl)  catEl.textContent  = f.cat;
      if (iconEl) iconEl.textContent = f.icon;
      if (ctrEl)  ctrEl.textContent  = `${_dashFactIdx + 1} / ${BIOFUEL_FACTS.length}`;
      card.classList.remove('biofact-flash');
    }, 160);
  } else {
    textEl.textContent  = f.text;
    if (catEl)  catEl.textContent  = f.cat;
    if (iconEl) iconEl.textContent = f.icon;
    if (ctrEl)  ctrEl.textContent  = `${_dashFactIdx + 1} / ${BIOFUEL_FACTS.length}`;
  }
}

// Auto-start on DOM ready (scripts are at end of body, DOM already parsed)
lsFactStart();
