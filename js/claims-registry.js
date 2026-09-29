'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   TexasClimate — Central Scientific Claim Registry
   ──────────────────────────────────────────────────────────────────────────────
   Every load-bearing scientific claim the app makes lives HERE, once, with its
   scope and its source. UI files reference claims by id; they do not restate
   science in prose.

   Fields
     id          stable key referenced from UI code
     claim       the claim AS THE APP IS ALLOWED TO STATE IT (already scoped)
     scope       the conditions under which the source actually established it
     tier        evidence tier — see TC_EVIDENCE_TIER below
     status      TC_STATUS value
     source      full citation
     url         DIRECT link to the paper/record, never a database homepage
     notes       what a careful reader should know, including what is NOT shown

   Claims that were previously stated on this site but could not be supported
   are kept in TC_RETIRED_CLAIMS with the reason, so the correction is auditable
   rather than quietly erased.
   ════════════════════════════════════════════════════════════════════════════ */

/* Evidence ladder. Tier 1 is strongest. Used for both claims and gene evidence. */
const TC_EVIDENCE_TIER = {
  1: { key: 'direct-species',   label: 'Direct experiment in this species',        short: 'T1' },
  2: { key: 'related-genus',    label: 'Experiment in a related Panicum species',  short: 'T2' },
  3: { key: 'other-grass',      label: 'Experiment in another grass species',      short: 'T3' },
  4: { key: 'model-dicot',      label: 'Experiment in Arabidopsis or another model', short: 'T4' },
  5: { key: 'computational',    label: 'Computational projection / sequence homology only', short: 'T5' },
};

const TC_CLAIMS = {

  /* ── Energy balance ───────────────────────────────────────────────────── */
  switchgrass_net_energy: {
    id: 'switchgrass_net_energy',
    claim: 'In a five-year field study on 10 farms in Nebraska, South Dakota and North Dakota, switchgrass grown for cellulosic ethanol produced 540% more renewable energy than the nonrenewable energy consumed to grow and convert it.',
    scope: '10 commercial-scale farms, U.S. Northern Great Plains, 2000–2005. Established stands only. Ethanol conversion was modelled, not performed at those sites.',
    tier: 1,
    status: 'LITERATURE',
    source: 'Schmer MR, Vogel KP, Mitchell RB, Perrin RK (2008). Net energy of cellulosic ethanol from switchgrass. PNAS 105(2):464–469.',
    url: 'https://doi.org/10.1073/pnas.0704767105',
    notes: 'This is a ratio of renewable output to NONRENEWABLE input under those farms\' management, not a universal property of switchgrass. It does not transfer unchanged to Texas, to different soils, or to irrigated production. It is not an efficiency, a yield, or a claim about cost.',
  },

  switchgrass_ghg: {
    id: 'switchgrass_ghg',
    claim: 'In the same study, estimated greenhouse gas emissions from switchgrass-derived cellulosic ethanol were 94% lower than estimated emissions from gasoline.',
    scope: 'Same 10 farms and modelling assumptions as the net-energy figure. Emissions were estimated by life-cycle modelling, not measured at a biorefinery.',
    tier: 1,
    status: 'LITERATURE',
    source: 'Schmer MR, Vogel KP, Mitchell RB, Perrin RK (2008). PNAS 105(2):464–469.',
    url: 'https://doi.org/10.1073/pnas.0704767105',
    notes: 'Life-cycle GHG results are highly sensitive to assumed land-use change, which this estimate did not include as a dominant term.',
  },

  switchgrass_biomass_yield: {
    id: 'switchgrass_biomass_yield',
    claim: 'Established switchgrass fields in that study averaged annual biomass yields of 5.2–11.1 Mg per hectare.',
    scope: 'Northern Great Plains, rain-fed, established (post-establishment-year) stands, 2000–2005.',
    tier: 1,
    status: 'LITERATURE',
    source: 'Schmer MR et al. (2008). PNAS 105(2):464–469.',
    url: 'https://doi.org/10.1073/pnas.0704767105',
    notes: 'Texas yields differ. Establishment-year yields are substantially lower and are excluded from this range.',
  },

  /* ── Conversion assumptions ───────────────────────────────────────────── */
  ethanol_per_dry_ton: {
    id: 'ethanol_per_dry_ton',
    claim: 'Techno-economic analyses of switchgrass ethanol commonly assume roughly 80 gallons of ethanol per dry ton of feedstock.',
    scope: 'A CONVERSION ASSUMPTION used in economic modelling — not a measured property of a plant and not an achieved commercial figure.',
    tier: 3,
    status: 'LITERATURE',
    source: 'eXtension Farm Energy — Switchgrass (Panicum virgatum) for Biofuel Production (land-grant extension synthesis).',
    url: 'https://farm-energy.extension.org/switchgrass-panicum-virgatum-for-biofuel-production/',
    notes: 'Realised yield depends on pretreatment, enzyme loading, and feedstock composition. TexasClimate cannot estimate this number from weather or from a photograph.',
  },

  /* ── Water ─────────────────────────────────────────────────────────────── */
  ethanol_water_footprint: {
    id: 'ethanol_water_footprint',
    claim: 'The water embodied in corn ethanol varies by roughly three orders of magnitude between U.S. states, driven almost entirely by how much of the corn is irrigated.',
    scope: 'State-level U.S. analysis of consumptive water use for bioethanol. The spread is between regions, not between crops.',
    tier: 2,
    status: 'LITERATURE',
    source: 'Chiu Y-W, Walseth B, Suh S (2009). Water embodied in bioethanol in the United States. Environmental Science & Technology 43(8):2688–2692.',
    url: 'https://doi.org/10.1021/es8031067',
    notes: 'This is the reason TexasClimate states NO single water-footprint number for any fuel. A single figure ("X gallons of water per gallon of fuel") is meaningless without naming the region, the irrigation share, and the system boundary. Comparisons between two such figures are only valid if both use the same boundary.',
  },

  /* ── Cell wall / conversion barrier ───────────────────────────────────── */
  lignin_recalcitrance: {
    id: 'lignin_recalcitrance',
    claim: 'Lignin in the plant cell wall physically and chemically limits enzyme access to cellulose, which is why cellulosic feedstocks require a pretreatment step.',
    scope: 'General, well-established for lignocellulosic biomass across species.',
    tier: 3,
    status: 'LITERATURE',
    source: 'Mosier N et al. (2005). Features of promising technologies for pretreatment of lignocellulosic biomass. Bioresource Technology 96(6):673–686.',
    url: 'https://doi.org/10.1016/j.biortech.2004.06.025',
    notes: 'That lignin is a barrier is well established. That a given week of weather changed a given field\'s lignin content is NOT something this app measures — see the stress-chemistry model card.',
  },

  /* ── Stress physiology (the app\'s mechanistic backbone) ───────────────── */
  vpd_stomatal_response: {
    id: 'vpd_stomatal_response',
    claim: 'Rising atmospheric vapour pressure deficit drives stomatal closure, which reduces CO2 uptake and therefore carbon gain, independently of soil water status.',
    scope: 'Broad cross-species review of plant and ecosystem responses to VPD.',
    tier: 3,
    status: 'LITERATURE',
    source: 'Grossiord C et al. (2020). Plant responses to rising vapor pressure deficit. New Phytologist 226(6):1550–1566.',
    url: 'https://doi.org/10.1111/nph.16485',
    notes: 'This is the mechanism behind the VPD term in the tolerance model. The specific VPD thresholds TexasClimate uses per species are heuristic, not from this review.',
  },

  osmolyte_accumulation: {
    id: 'osmolyte_accumulation',
    claim: 'Plants under drought and osmotic stress accumulate compatible solutes such as proline and glycine betaine, which stabilise proteins and membranes.',
    scope: 'Established plant stress physiology, demonstrated across many species.',
    tier: 3,
    status: 'LITERATURE',
    source: 'Chen THH, Murata N (2011). Glycinebetaine protects plants against abiotic stress. Plant, Cell & Environment 34(1):1–20.',
    url: 'https://doi.org/10.1111/j.1365-3040.2010.02232.x',
    notes: 'IMPORTANT SCOPE LIMIT: accumulation of these solutes is well supported. Their effect on downstream industrial fermentation is NOT established as generally inhibitory, and TexasClimate does not claim it is. See TC_RETIRED_CLAIMS.osmolytes_inhibit_fermentation.',
  },

  et0_is_not_plant_water_stress: {
    id: 'et0_is_not_plant_water_stress',
    claim: 'Reference evapotranspiration (ET0) minus precipitation describes atmospheric drying demand versus supply for a standardised reference surface. It is not a measurement of the water stress experienced by a specific crop.',
    scope: 'Definitional. ET0 is defined for a hypothetical 0.12 m grass reference surface with fixed surface resistance and albedo.',
    tier: 1,
    status: 'LITERATURE',
    source: 'Allen RG, Pereira LS, Raes D, Smith M (1998). Crop evapotranspiration: guidelines for computing crop water requirements. FAO Irrigation and Drainage Paper 56.',
    url: 'https://www.fao.org/4/x0490e/x0490e00.htm',
    notes: 'Converting ET0 to actual crop water demand requires a crop coefficient (Kc) that varies with species and growth stage, and actual stress additionally depends on soil water storage, rooting depth, and irrigation. TexasClimate has none of these, which is exactly why its water term is named a PROXY.',
  },
};

/* ══════════════════════════════════════════════════════════════════════════════
   RETIRED CLAIMS — previously displayed on this site, now removed or rewritten.
   Kept visible so the correction is auditable.
   ════════════════════════════════════════════════════════════════════════════ */
const TC_RETIRED_CLAIMS = [
  {
    was: 'Switchgrass "produces 540% more energy than it consumes."',
    problem: 'Stated as a universal property of the plant and as raw energy in vs. out. The study measured renewable energy output against NONRENEWABLE energy input, on 10 specific Northern Great Plains farms.',
    now: 'Rewritten and scoped — see claim switchgrass_net_energy.',
  },
  {
    was: 'Switchgrass "uses 98% less water than corn ethanol."',
    problem: 'No source could be identified for this figure, and a single cross-crop water ratio is not meaningful: water footprints depend on irrigation share, region, and system boundary.',
    now: 'Removed. Replaced by claim ethanol_water_footprint, which states the variability instead of a number.',
  },
  {
    was: 'Corn ethanol water footprint of "784 gallons per gallon of fuel," and cellulosic ethanol at "6–14 gallons per gallon."',
    problem: 'Presented as fixed universal values and compared to each other without establishing a shared system boundary. Published estimates for corn ethanol span roughly three orders of magnitude across U.S. states.',
    now: 'Removed from all UI. Replaced by claim ethanol_water_footprint.',
  },
  {
    was: 'Switchgrass biofuel yield of "200–280 GJ/ha/yr" and corn ethanol at "120–160 GJ/ha/yr," both attributed to Schmer et al. (2008).',
    problem: 'MISATTRIBUTION. Schmer et al. report an average net energy yield near 60 GJ/ha/yr for switchgrass and make no such corn comparison. The cited source does not contain these figures, and the two values were not established on a common system boundary.',
    now: 'Removed. No GJ/ha/yr comparison is displayed, because we do not have two figures computed on the same boundary.',
  },
  {
    was: 'Proline and glycine betaine described as "fermentation inhibitors."',
    problem: 'Overgeneralised. These are compatible solutes; a general inhibitory effect on industrial fermentation is not established. The well-documented fermentation inhibitors from lignocellulosic feedstocks are pretreatment-derived compounds (furfural, HMF, acetic acid, phenolics).',
    now: 'Rewritten. The app now describes osmolyte accumulation as a stress response of unknown consequence for conversion, and labels the link as a hypothesis.',
  },
  {
    was: 'Coastal proximity displayed as a salinity stress score.',
    problem: 'Distance to the coast is not a measurement of soil salinity. Soil EC depends on parent material, irrigation water quality, drainage, and management.',
    now: 'Removed as a score. Salinity is reported as UNKNOWN unless the user supplies a measured soil EC value.',
  },
  {
    was: 'Biogas listed among gasification products.',
    problem: 'Category error. Biogas is produced by anaerobic digestion (a biological process yielding CH4 + CO2). Gasification is thermochemical partial oxidation yielding syngas (CO + H2).',
    now: 'Corrected in the pathway definitions; the four pathways are now separated by process class.',
  },
  {
    was: 'The Biofuel Lab described its regional scores as "AI prototype estimates calibrated to published agronomic literature (Perrin 2008, DOE 2016, FAO HWSD)", and its methods table attributed them to NOAA reanalysis with DSSAT/APSIM crop models, CRU TS4.06 precipitation, an SPI-6/PDSI composite, FAO HWSD v2 with SoilGrids, LandScan 2023 and the World Bank Logistics Performance Index.',
    problem: 'None of those pipelines exists in this codebase, no calibration was ever performed, and no model produces those numbers — they are typed constants, which the file\'s own scenario note already called "mock data". This was fabricated methodology, and it was the most attackable claim on the site.',
    now: 'Every method string replaced with "Author-chosen illustrative value — no dataset". The tab carries a standing notice that it is a teaching model rather than data, and the arithmetic combining the scores is shown in full so the part that IS real can be checked.',
  },
  {
    was: 'The Biofuel Lab reported a "Survival Chance" — "composite probability that industrialization could persist over a 20-year horizon".',
    problem: 'An explicit probability, computed from invented inputs. Nothing in this app supports a persistence probability over any horizon.',
    now: 'Renamed "Composite Outlook Score" and described as an index built from illustrative inputs, with the probability language removed.',
  },
  {
    was: 'A soil carbon sequestration rate of 1.1–2.3 tCO2/ha/yr, attributed to the DOE Billion-Ton Report (2016), and used to compute a "CO2 Sequestered" total in the deployment calculator.',
    problem: 'The Billion-Ton Report is a feedstock supply assessment and an unlikely source for a soil-carbon rate; the figure could not be verified against it. A sequestration rate is also only meaningful with a stated soil, depth and time horizon, none of which was given.',
    now: 'Withdrawn everywhere, including from the calculator, which now reports CO2 sequestration as UNKNOWN rather than computing it from an unverifiable rate. No replacement figure is quoted.',
  },
  {
    was: 'Fu et al. (2011) cited as Nature Biotechnology for the 38% ethanol-yield improvement in COMT-downregulated switchgrass.',
    problem: 'Wrong journal. The paper is PNAS 108(9):3803–3808. The 38% figure itself is correct, but it applies to specific transgenic lines under laboratory process conditions, which was not stated.',
    now: 'Citation corrected and the result scoped to transgenic lines under conventional fermentation.',
  },
  {
    was: 'Lowry et al. (2019) cited as the source of 0–100 trait scores for the HAL2 and FIL2 Panicum hallii ecotypes.',
    problem: 'No published source reports 0–100 trait scores for those ecotypes. The paper supports the qualitative contrast between them, not the numbers displayed.',
    now: 'Citation scoped to the qualitative contrast only; the scores are labelled author-chosen illustrative values. The tab also now notes that P. hallii is a model organism for switchgrass research, not switchgrass itself.',
  },
  {
    was: 'The Field Observation report offered a "survival probability score", and per-species climate ranges in the scanner were headed "Real-world values drawn from published agronomy / ecology literature".',
    problem: 'The first was a probability the app cannot compute; the output is an index out of 100. The second claimed a per-value citation that does not exist — the same overclaim already corrected in the main species profile table.',
    now: 'Renamed a Site Suitability Score and described as an index; the climate ranges are labelled species-level literature-derived estimates, not individually cited.',
  },
  {
    was: 'While removing overstated AI branding, several pages went on to state that "no AI is used anywhere in this application".',
    problem: 'That over-correction is itself false. Field Observation Mode runs a real convolutional network — MobileNet v2 via TensorFlow.js, locally in the browser — to suggest a species from a photograph. Denying it is as inaccurate as the branding it replaced.',
    now: 'Rewritten to state precisely what runs: one real image classifier with its limits described at the point of use, and no language or generative model anywhere. An automated test now checks for the over-claim and the under-claim in both directions.',
  },
  {
    was: 'Vapour pressure deficit described as needing a "wet-bulb sensor" to improve.',
    problem: 'Misleading. VPD is computed from air temperature and relative humidity by a standard equation; the limitation is not the absence of a wet-bulb instrument.',
    now: 'Rewritten to describe the actual limitations: sensor height, canopy-versus-screen-level difference, and hourly averaging.',
  },
];

/** Fetch a claim by id, throwing loudly rather than silently returning nothing. */
function tcClaim(id) {
  const c = TC_CLAIMS[id];
  if (!c) { console.error('[TexasClimate] Unknown claim id:', id); return null; }
  return c;
}

/** Render a claim as an inline, checkable citation. */
function tcCite(id) {
  const c = tcClaim(id);
  if (!c) return '';
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  return `<a class="tc-cite" href="${esc(c.url)}" target="_blank" rel="noopener" ` +
         `title="${esc(c.source)}">${esc(c.source.split('(')[0].trim())} →</a>`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TC_CLAIMS, TC_RETIRED_CLAIMS, TC_EVIDENCE_TIER, tcClaim, tcCite };
}
