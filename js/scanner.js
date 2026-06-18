'use strict';

// ── Plant-to-Fuel Scanner v3 ──────────────────────────────────────────────────
// Static GitHub Pages — 36-plant dynamic evidence engine with source library.
// No API keys exposed. Plant identification is NOT automated or claimed.
//
// Security note: API integration (PlantNet, OpenAI) MUST use a serverless
// proxy (Cloudflare Worker / Netlify Function) — no keys in frontend JS.
// ─────────────────────────────────────────────────────────────────────────────

// ── Source Library ────────────────────────────────────────────────────────────
// Referenced by plant entries via sourceIds:[...] arrays.
// sourceType: 'peer-reviewed' | 'government' | 'university' | 'technical documentation'
// Scientific claims are based on government, university, peer-reviewed, or technical
// documentation sources when available. Values shown are educational estimates.
const SCAN_SOURCES = {

  schmer2008: {
    id:'schmer2008', year:2008, sourceType:'peer-reviewed',
    title:'Net energy of cellulosic ethanol from switchgrass',
    authors:'Schmer MR, Vogel KP, Mitchell RB, Perrin RK',
    url:'https://www.pnas.org/doi/10.1073/pnas.0704767105',
    relevance:['switchgrass','biofuel pathway','biomass energy']
  },

  doe_bioenergy: {
    id:'doe_bioenergy', year:null, sourceType:'government',
    title:'Bioenergy Basics',
    authors:'U.S. Department of Energy — Office of Energy Efficiency & Renewable Energy',
    url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics',
    relevance:['biofuel pathway','conversion barrier','biomass energy']
  },

  usda_ers: {
    id:'usda_ers', year:null, sourceType:'government',
    title:'Bioenergy — Farm Economy',
    authors:'USDA Economic Research Service',
    url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/',
    relevance:['biomass energy','biofuel pathway','switchgrass','energy crops']
  },

  nrel_32438: {
    id:'nrel_32438', year:2002, sourceType:'technical documentation',
    title:'Lignocellulosic Biomass to Ethanol Process Design and Economics',
    authors:'Aden A, Ruth M, Ibsen K, et al. — NREL',
    url:'https://docs.nrel.gov/docs/fy02osti/32438.pdf',
    relevance:['biofuel pathway','conversion barrier','lignocellulosic biomass']
  },

  afdc_ethanol: {
    id:'afdc_ethanol', year:null, sourceType:'government',
    title:'Ethanol Fuel Basics',
    authors:'U.S. Department of Energy — Alternative Fuels Data Center',
    url:'https://afdc.energy.gov/fuels/ethanol-fuel-basics',
    relevance:['biofuel pathway','ethanol','biomass energy']
  },

  monteith1972: {
    id:'monteith1972', year:1972, sourceType:'peer-reviewed',
    title:'Solar radiation and productivity in tropical ecosystems',
    authors:'Monteith JL',
    url:'https://www.jstor.org/stable/2401901',
    relevance:['productivity model','NPP','light-use efficiency']
  },

  potter1993: {
    id:'potter1993', year:1993, sourceType:'peer-reviewed',
    title:'Terrestrial Ecosystem Production: A Process Model Based on Global Satellite and Surface Data (CASA model)',
    authors:'Potter CS, Randerson JT, Field CB, Matson PA, Vitousek PM, Mooney HA, Klooster SA',
    url:'https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/93GB02725',
    relevance:['productivity model','NPP','CASA','biomass estimation']
  },

  running2004: {
    id:'running2004', year:2004, sourceType:'peer-reviewed',
    title:'A Continuous Satellite-Derived Measure of Global Terrestrial Primary Production',
    authors:'Running SW, Nemani RR, Heinsch FA, Zhao M, Reeves M, Hashimoto H',
    url:'https://www.science.org/doi/10.1126/science.1092358',
    relevance:['productivity model','NPP','satellite biomass']
  },

  field1998: {
    id:'field1998', year:1998, sourceType:'peer-reviewed',
    title:'Primary Production of the Biosphere: Integrating Terrestrial and Oceanic Components',
    authors:'Field CB, Behrenfeld MJ, Randerson JT, Falkowski P',
    url:'https://www.science.org/doi/10.1126/science.281.5374.237',
    relevance:['productivity model','NPP','global primary production']
  },

  kiniry_c4: {
    id:'kiniry_c4', year:null, sourceType:'peer-reviewed',
    title:'Radiation-use efficiency responses to vapour pressure deficit for maize and sorghum',
    authors:'Kiniry JR, et al. — USDA ARS',
    url:'https://www.ars.usda.gov/research/publications/',
    relevance:['C4 photosynthesis','light-use efficiency','sorghum','switchgrass','biomass estimation']
  },

  nasa_mod17: {
    id:'nasa_mod17', year:null, sourceType:'technical documentation',
    title:'MODIS/Terra Net Primary Production Yearly Global 500m (MOD17A3HGF)',
    authors:'NASA Land Processes DAAC',
    url:'https://lpdaac.usgs.gov/products/mod17a3hgfv061/',
    relevance:['productivity model','NPP','satellite biomass','fPAR']
  },

  plantnet_api: {
    id:'plantnet_api', year:null, sourceType:'technical documentation',
    title:'PlantNet API Documentation',
    authors:'Pl@ntNet — INRIA / CIRAD / INRAE / IRD',
    url:'https://my.plantnet.org/doc/api/openapi',
    relevance:['plant identification','future integration']
  },

  mdn_camera: {
    id:'mdn_camera', year:null, sourceType:'technical documentation',
    title:'Taking still photos from the camera — Media Capture and Streams API',
    authors:'MDN Web Docs — Mozilla',
    url:'https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos',
    relevance:['safety-technical implementation','camera API']
  },

  tamu_cedar: {
    id:'tamu_cedar', year:null, sourceType:'university',
    title:'Cedar Control — Texas Rangelands',
    authors:'Texas A&M AgriLife Extension',
    url:'https://agrilifeextension.tamu.edu/library/ranching/cedar-control/',
    relevance:['eastern_redcedar','mesquite','Texas invasive','biomass management']
  },

  davis2011: {
    id:'davis2011', year:2011, sourceType:'peer-reviewed',
    title:'Agave as a bioenergy feedstock in Mexico',
    authors:'Davis SC, Dohleman FG, Long SP',
    url:'https://onlinelibrary.wiley.com/doi/10.1111/j.1757-1707.2010.01085.x',
    relevance:['agave','biofuel pathway','arid-land biomass']
  },

  usda_hemp: {
    id:'usda_hemp', year:null, sourceType:'government',
    title:'Industrial Hemp in the United States',
    authors:'USDA Economic Research Service',
    url:'https://www.ers.usda.gov/webdocs/publications/101748/eib-218.pdf',
    relevance:['hemp','biofuel pathway','fiber crop']
  },

  nrel_bioenergy: {
    id:'nrel_bioenergy', year:null, sourceType:'government',
    title:'Bioenergy Research — National Renewable Energy Laboratory',
    authors:'National Renewable Energy Laboratory (NREL)',
    url:'https://www.nrel.gov/bioenergy/',
    relevance:['biofuel pathway','biomass energy','general reference']
  }

};

const SCAN_PLANTS = {

  // ── Grasses / Energy Crops ──────────────────────────────────────────────────

  switchgrass: {
    commonName:'Switchgrass', scientificName:'Panicum virgatum',
    category:'Perennial grass / lignocellulosic biomass', icon:'🌿',
    biomassPotential:'High', sustainabilityPotential:'Medium-high',
    waterUse:'Low', droughtTolerance:'High', texasFit:'Excellent',
    conversionMethods:[
      'Cellulosic ethanol (primary research pathway)',
      'Pyrolysis → bio-oil / biochar',
      'Gasification → syngas for power or fuel',
      'Biopower via direct combustion'
    ],
    processingBarrier:'Lignin recalcitrance blocks enzymatic access to cellulose and hemicellulose, requiring costly chemical or biological pretreatment (acid, AFEX, steam explosion).',
    climateContext:'Switchgrass is native to Central Texas and well-adapted to heat and periodic drought. It is the most widely studied cellulosic bioenergy crop in the U.S. Yield and establishment quality depend on local rainfall, soil type, management inputs, and harvest logistics — not on a photograph.',
    texasSuitability:'Native, drought-tolerant, and well-studied in Texas. Among the highest-priority bioenergy crops for this region. Does not require irrigation in Central Texas with normal rainfall.',
    reasoning:'Switchgrass is the most widely studied cellulosic bioenergy crop in the U.S. and is native to Texas. An image alone cannot determine fuel value — real evaluation requires field yield data, moisture content, biomass composition, pretreatment performance, logistics access, and conversion economics.',
    sources:[
      { label:'Schmer et al. (2008) — Net energy of cellulosic ethanol from switchgrass, PNAS', url:'https://www.pnas.org/doi/10.1073/pnas.0704767105' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' },
      { label:'NREL Lignocellulosic Biomass Process Design', url:'https://docs.nrel.gov/docs/fy02osti/32438.pdf' },
      { label:'AFDC — Ethanol Fuel Basics', url:'https://afdc.energy.gov/fuels/ethanol-fuel-basics' }
    ],
    heatingValueRange:'17–19 MJ/kg dry',
    evidenceStrength:'Strong',
    sourceIds:['schmer2008','doe_bioenergy','usda_ers','nrel_32438','afdc_ethanol','kiniry_c4']
  },

  miscanthus: {
    commonName:'Miscanthus', scientificName:'Miscanthus × giganteus',
    category:'Perennial grass / high-yield lignocellulosic biomass', icon:'🌾',
    biomassPotential:'High', sustainabilityPotential:'Medium-high',
    waterUse:'Medium', droughtTolerance:'Medium', texasFit:'Fair',
    conversionMethods:[
      'Cellulosic ethanol (after pretreatment)',
      'Biopower via combustion or co-firing',
      'Pyrolysis → bio-oil / biochar',
      'Pelletization for solid fuel export'
    ],
    processingBarrier:'Similar to switchgrass — lignin recalcitrance requires pretreatment. Sterile hybrid propagates vegetatively, raising establishment cost per acre.',
    climateContext:'Miscanthus performs best in temperate, wetter climates (Europe, Midwest U.S.). Central Texas heat and drought risk may substantially reduce yields compared to published trials. East Texas with higher rainfall is a better potential growing region.',
    texasSuitability:'Fair — water demands limit potential in Central and West Texas. Moderate potential in East Texas near piney woods region.',
    reasoning:'Miscanthus yields some of the highest biomass per hectare among energy grasses in temperate zones, but its water demand exceeds switchgrass. Texas performance, especially in drier regions, is not well-established in published literature.',
    sources:[
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' },
      { label:'AFDC — Ethanol Fuel Basics', url:'https://afdc.energy.gov/fuels/ethanol-fuel-basics' }
    ],
    heatingValueRange:'17–19 MJ/kg dry',
    evidenceStrength:'Moderate',
    sourceIds:['doe_bioenergy','afdc_ethanol','usda_ers']
  },

  sorghum: {
    commonName:'Energy Sorghum', scientificName:'Sorghum bicolor',
    category:'Annual grass / dual-use energy crop', icon:'🌱',
    biomassPotential:'Medium-high', sustainabilityPotential:'Medium-high',
    waterUse:'Low-Medium', droughtTolerance:'High', texasFit:'Excellent',
    conversionMethods:[
      'Sweet sorghum juice → direct ethanol fermentation (no pretreatment)',
      'Biomass sorghum → cellulosic ethanol (with pretreatment)',
      'Biogas via anaerobic digestion of whole plant',
      'Biopower via combustion or co-firing'
    ],
    processingBarrier:'Sweet sorghum ferments directly; biomass sorghum requires full cellulosic pretreatment. Narrow harvest window limits scheduling and logistics flexibility.',
    climateContext:'Sorghum is among the most drought-tolerant grain and energy crops. It is a strong regional candidate for bioenergy in Central Texas heat and drought conditions, with an established agricultural base in Texas.',
    texasSuitability:'Excellent — one of the best bioenergy crop matches for Texas climate, especially Central and West Texas. Commercial production infrastructure already exists.',
    reasoning:'Sorghum is a regionally relevant energy crop for Texas. Sweet sorghum can ferment directly like sugarcane juice; biomass sorghum requires the full cellulosic pretreatment chain. Its drought and heat tolerance gives it among the strongest climate fits of any studied energy crop in this region.',
    sources:[
      { label:'USDA ERS — Bioenergy', url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' },
      { label:'AFDC — Ethanol Fuel Basics', url:'https://afdc.energy.gov/fuels/ethanol-fuel-basics' }
    ],
    heatingValueRange:'15–18 MJ/kg dry',
    evidenceStrength:'Strong',
    sourceIds:['usda_ers','afdc_ethanol','doe_bioenergy','kiniry_c4']
  },

  sugarcane: {
    commonName:'Sugarcane', scientificName:'Saccharum officinarum',
    category:'Tropical perennial grass / sucrose-rich energy crop', icon:'🍬',
    biomassPotential:'High', sustainabilityPotential:'Medium',
    waterUse:'Very High', droughtTolerance:'Low', texasFit:'Poor (South TX only)',
    conversionMethods:[
      'Direct sucrose fermentation → ethanol (most efficient global pathway)',
      'Bagasse (fibrous residue) → cellulosic ethanol',
      'Bagasse → biopower via combustion'
    ],
    processingBarrier:'Requires tropical/subtropical climate with high and reliable rainfall. Crushing and juice extraction infrastructure needed. High water use is a serious sustainability concern in drier Texas regions.',
    climateContext:'Sugarcane is commercially grown only in South Texas (Rio Grande Valley), not Central Texas. Austin-area rainfall is insufficient without heavy irrigation, which raises significant water sustainability concerns. The bagasse residue can provide additional cellulosic ethanol or biopower.',
    texasSuitability:'Poor for most of Texas. Limited commercial potential to the lower Rio Grande Valley. Water requirements are prohibitive in drought-prone areas.',
    reasoning:'Sugarcane is the most efficient ethanol feedstock globally — Brazil produces ~640 liters per tonne of cane. Austin-area conditions are not well-matched without intensive irrigation. A photo cannot determine sugar content, fiber composition, or regional water availability.',
    sources:[
      { label:'AFDC — Ethanol Fuel Basics', url:'https://afdc.energy.gov/fuels/ethanol-fuel-basics' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'14–17 MJ/kg dry (bagasse)',
    evidenceStrength:'Strong',
    sourceIds:['afdc_ethanol','doe_bioenergy','usda_ers']
  },

  bamboo: {
    commonName:'Bamboo', scientificName:'Phyllostachys / Bambusa spp.',
    category:'Woody grass / rapid-growth lignocellulosic biomass', icon:'🎋',
    biomassPotential:'High', sustainabilityPotential:'Medium',
    waterUse:'Medium', droughtTolerance:'Medium', texasFit:'Fair',
    conversionMethods:[
      'Cellulosic ethanol (after pretreatment — high lignin content)',
      'Pyrolysis → high-quality biochar',
      'Biopower via direct combustion or co-firing',
      'Pelletization for solid fuel'
    ],
    processingBarrier:'Dense silica deposits and high lignin (25–35%) require intensive pretreatment. Some running bamboo species are invasive — uncontrolled spread in new regions is a documented ecological risk that must be managed.',
    climateContext:'Bamboo can grow in parts of Central and East Texas but is not native. Running bamboos have become invasive in some Texas communities. Biomass yields can be impressive in wetter East Texas climates, but performance in semi-arid Central Texas is not well-documented in published literature.',
    texasSuitability:'Fair — best potential in East Texas and Gulf Coast where moisture is adequate. Invasive risk requires management. Limited published bioenergy field data for Texas-specific conditions.',
    reasoning:'Bamboo is studied as a bioenergy feedstock globally, achieving 20+ dry tonnes/ha in Asian trials. U.S. temperate-climate data is more limited, and Texas-specific field performance is not well-established. Its invasive potential adds an ecological complexity that must be taken seriously before any planting decision.',
    sources:[
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' },
      { label:'AFDC — Ethanol Fuel Basics', url:'https://afdc.energy.gov/fuels/ethanol-fuel-basics' }
    ],
    heatingValueRange:'17–20 MJ/kg dry',
    evidenceStrength:'Moderate',
    sourceIds:['doe_bioenergy','afdc_ethanol']
  },

  hemp: {
    commonName:'Industrial Hemp', scientificName:'Cannabis sativa (industrial)',
    category:'Annual fiber/oilseed crop / emerging bioenergy feedstock', icon:'🌿',
    biomassPotential:'Medium', sustainabilityPotential:'Medium-high',
    waterUse:'Medium', droughtTolerance:'Medium', texasFit:'Fair–Good',
    conversionMethods:[
      'Hurds (woody core) → cellulosic ethanol after pretreatment',
      'Seeds → biodiesel via oil extraction',
      'Whole plant → biogas via anaerobic digestion',
      'Pyrolysis → biochar / bio-oil'
    ],
    processingBarrier:'Texas hemp regulations are evolving (legal since 2019, THC < 0.3%). Harvest timing is critical. The woody core (hurd) is the primary bioenergy fraction; fiber and seed markets may be more economically attractive than bioenergy use.',
    climateContext:'Hemp grows in a wide range of climates and has been piloted in Texas. It is more drought-tolerant than corn and can produce usable biomass with moderate rainfall or supplemental irrigation. The Texas hemp industry is young, and bioenergy is likely a secondary use case alongside fiber and food markets.',
    texasSuitability:'Fair to Good — Texas climate is manageable for hemp. Economic competition from fiber and CBD/seed markets may limit bioenergy-specific adoption.',
    reasoning:'Industrial hemp offers dual-use bioenergy potential (fiber for cellulosic ethanol, seed oil for biodiesel), but the bioenergy economics are nascent. Texas production infrastructure for hemp is still developing. An image cannot determine variety, harvested composition, or economic context.',
    sources:[
      { label:'USDA ERS — Industrial Hemp', url:'https://www.ers.usda.gov/webdocs/publications/101748/eib-218.pdf' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'15–18 MJ/kg dry (hurds)',
    evidenceStrength:'Emerging',
    sourceIds:['usda_hemp','doe_bioenergy']
  },

  agave: {
    commonName:'Agave / Century Plant', scientificName:'Agave spp. (A. americana, A. lechuguilla)',
    category:'Desert succulent / CAM photosynthesis bioenergy crop', icon:'🌵',
    biomassPotential:'Medium', sustainabilityPotential:'High',
    waterUse:'Very Low', droughtTolerance:'Very High', texasFit:'Excellent',
    conversionMethods:[
      'Juice/bagasse → ethanol fermentation (similar to sugarcane)',
      'Inulin hydrolysis → fermentable sugars → bioethanol',
      'Dry biomass → biochar via pyrolysis',
      'Fiber (ixtle) → industrial applications'
    ],
    processingBarrier:'Long establishment period (5–15 years before first harvest depending on species). Tough fibrous structure requires specialized harvesting equipment. Processing infrastructure is not yet common in the U.S.',
    climateContext:'Agave is native to Texas and uses CAM (Crassulacean Acid Metabolism) photosynthesis — producing biomass with remarkably little water. Researchers at UT Austin and elsewhere have identified agave as a potentially significant arid-land bioenergy feedstock. West Texas, South Texas, and the Edwards Plateau are well-suited growing regions.',
    texasSuitability:'Excellent for arid West Texas, Hill Country, and South Texas — one of the few bioenergy crops that genuinely thrives in the Texas climate without irrigation. Emerging research pathway, not yet commercial at scale.',
    reasoning:'Agave\'s extreme drought efficiency (CAM photosynthesis captures CO₂ at night, avoiding water loss) makes it uniquely promising for Texas. Published research highlights its potential in arid regions globally. The long growth cycle and establishment cost are barriers, but the water-efficiency case is strong.',
    sources:[
      { label:'Davis et al. (2011) — Agave as bioenergy feedstock, GCB Bioenergy', url:'https://onlinelibrary.wiley.com/doi/10.1111/j.1757-1707.2010.01085.x' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'14–18 MJ/kg dry',
    evidenceStrength:'Emerging',
    sourceIds:['davis2011','doe_bioenergy']
  },

  mesquite: {
    commonName:'Mesquite', scientificName:'Prosopis glandulosa (honey mesquite)',
    category:'Invasive woody shrub / high-BTU Texas rangeland biomass', icon:'🌳',
    biomassPotential:'Medium', sustainabilityPotential:'High (invasive removal)',
    waterUse:'Low', droughtTolerance:'Very High', texasFit:'Very High',
    conversionMethods:[
      'Pyrolysis → high-quality biochar (dense wood, high carbon content)',
      'Biopower via direct combustion (high BTU hardwood)',
      'Gasification → syngas',
      'Tannin / phenolic extractives as chemical byproducts'
    ],
    processingBarrier:'Dense thorny hardwood requires heavy equipment to harvest and chip. Deep roots re-sprout aggressively after top removal. Economics of large-scale removal-for-bioenergy have not been proven at scale in published literature.',
    climateContext:'Honey mesquite covers approximately 55 million acres of Texas rangeland and is considered an invasive problem by ranchers and land managers. If harvested as a bioenergy feedstock, removal could yield dual benefits — biomass energy AND rangeland restoration for grazing and water infiltration.',
    texasSuitability:'Very High ecological rationale for Central, West, and South Texas. Mesquite is essentially ubiquitous across much of Texas. The concept of "brushland bioenergy" is an active area of research and landowner interest in Texas.',
    reasoning:'Mesquite\'s very high abundance in Texas, combined with strong landowner motivation for its management, makes it a uniquely Texas-relevant feedstock. The key challenge is economic — harvesting, chipping, and transporting a dense, thorny, re-sprouting shrub profitably at scale. A photo cannot determine density, moisture, or logistics costs.',
    sources:[
      { label:'USDA ERS — Bioenergy', url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'19–21 MJ/kg dry (hardwood)',
    evidenceStrength:'Limited',
    sourceIds:['usda_ers','doe_bioenergy','tamu_cedar']
  },

  eastern_redcedar: {
    commonName:'Eastern Redcedar / Ashe Juniper', scientificName:'Juniperus virginiana / J. ashei',
    category:'Invasive conifer / dense woody biomass', icon:'🌲',
    biomassPotential:'Medium', sustainabilityPotential:'High (invasive clearing)',
    waterUse:'Low', droughtTolerance:'High', texasFit:'Very High',
    conversionMethods:[
      'Pyrolysis → high-quality aromatic biochar',
      'Biopower via direct combustion (dry wood, high BTU)',
      'Essential oil (cedarwood oil) extraction — high-value byproduct',
      'Gasification → syngas'
    ],
    processingBarrier:'Cedar oil content (10–18%) can interfere with some microbial fermentation processes — pyrolysis and biopower are more practical than cellulosic ethanol. Dense root systems complicate complete removal. Economics of commercial cedar bioenergy not yet proven at scale.',
    climateContext:'Ashe Juniper (locally called "cedar") has dramatically expanded across the Texas Hill Country over the past century due to grazing pressure and fire suppression. It consumes significant groundwater (Edwards Aquifer recharge zone) and is the primary cause of Cedar Fever allergy season. Bioenergy-motivated clearing could yield ecological and hydrological co-benefits simultaneously.',
    texasSuitability:'Very High ecological rationale for Central Texas — clearing juniper for bioenergy simultaneously addresses an invasive species, improves rangelands, and may boost Edwards Aquifer recharge.',
    reasoning:'Eastern redcedar bioenergy is attractive as a dual-use proposition — clearing an invasive while generating biochar or biopower. The cedarwood oil is a commercially valuable byproduct. However, the economics of large-scale clearing and processing are not yet proven without land-clearing incentive programs.',
    sources:[
      { label:'Texas A&M — Cedar Management', url:'https://agrilifeextension.tamu.edu/library/ranching/cedar-control/' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'18–21 MJ/kg dry (aromatic wood)',
    evidenceStrength:'Limited',
    sourceIds:['tamu_cedar','doe_bioenergy']
  },

  prickly_pear: {
    commonName:'Prickly Pear Cactus', scientificName:'Opuntia engelmannii (Texas state plant)',
    category:'Desert CAM cactus / mucilage-rich biomass', icon:'🌵',
    biomassPotential:'Low-Medium', sustainabilityPotential:'High',
    waterUse:'Very Low', droughtTolerance:'Very High', texasFit:'Excellent',
    conversionMethods:[
      'Mucilage fermentation → bioethanol (emerging research pathway)',
      'Biogas via anaerobic digestion of fresh pads',
      'Biochar from dried pads via pyrolysis',
      'Water treatment applications (mucilage as natural coagulant)'
    ],
    processingBarrier:'Mucilage (gel) inhibits enzymatic and microbial fermentation and requires removal or treatment. Very high water content in fresh pads (85–95% moisture). Spines require careful handling. Low energy density per acre compared to grasses.',
    climateContext:'Prickly pear is widespread across Texas and thrives in the harshest arid conditions. Research on mucilage fermentation for ethanol production is emerging and genuinely interesting, though not yet commercially proven. It represents a unique Texas bioenergy opportunity requiring very little water.',
    texasFit:'Excellent climate fit — virtually no irrigation required. Technology for efficient ethanol production from cactus mucilage is early-stage and not yet commercially proven in the U.S.',
    texasSuitability:'Excellent climate match for Central, West, and South Texas. Still an emerging technology pathway rather than a proven commercial option.',
    reasoning:'Prickly pear\'s extreme drought tolerance (it is the Texas state plant) and the emerging research on mucilage ethanol make it an interesting subject, but the conversion pathway is not commercially mature. Do not make investment or land-use decisions based on this educational overview.',
    sources:[
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' },
      { label:'NREL Biomass Research', url:'https://www.nrel.gov/bioenergy/' }
    ],
    heatingValueRange:'12–16 MJ/kg dry (high moisture, variable)',
    evidenceStrength:'Emerging',
    sourceIds:['doe_bioenergy','nrel_bioenergy']
  },

  // ── Residues ────────────────────────────────────────────────────────────────

  corn_stover: {
    commonName:'Corn Stover', scientificName:'Zea mays (crop residue)',
    category:'Agricultural residue / lignocellulosic', icon:'🌽',
    biomassPotential:'Medium-high', sustainabilityPotential:'Medium',
    waterUse:'N/A (residue)', droughtTolerance:'N/A', texasFit:'Fair',
    conversionMethods:[
      'Cellulosic ethanol (with pretreatment)',
      'Biogas via anaerobic digestion',
      'Biopower via combustion',
      'Biochar via pyrolysis'
    ],
    processingBarrier:'High ash content and variable composition. Sustainability constraint — removing too much stover reduces soil organic matter and increases erosion risk. Maximum sustainable removal rate is typically 25–50% of available residue.',
    climateContext:'Corn is grown in parts of Texas but Central Texas heat and drought significantly limit yields and stover availability compared to the U.S. corn belt. Cotton stover and grain sorghum residues are more regionally significant Texas crop residues.',
    texasSuitability:'Fair — corn stover bioenergy context is most relevant to the U.S. Midwest. In Texas, cotton stover and sorghum residue are more abundant crop residues.',
    reasoning:'Corn stover has bioenergy potential but soil health constraints limit the sustainable removal rate. In Central Texas, corn production and stover availability are substantially lower than in Midwest contexts. An image cannot identify stover from a standing corn plant or determine harvest-appropriate moisture.',
    sources:[
      { label:'USDA ERS — Bioenergy', url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'16–18 MJ/kg dry',
    evidenceStrength:'Strong',
    sourceIds:['usda_ers','doe_bioenergy','nrel_32438','afdc_ethanol']
  },

  cotton_stover: {
    commonName:'Cotton Stover / Gin Trash', scientificName:'Gossypium hirsutum (residue)',
    category:'Agricultural residue / Texas-specific lignocellulosic', icon:'🌱',
    biomassPotential:'Medium', sustainabilityPotential:'Medium',
    waterUse:'N/A (residue)', droughtTolerance:'N/A', texasFit:'Excellent (West TX)',
    conversionMethods:[
      'Cellulosic ethanol (with pretreatment)',
      'Biogas via anaerobic digestion',
      'Biopower via combustion',
      'Biochar via pyrolysis',
      'Cottonseed oil → biodiesel (separate value chain)'
    ],
    processingBarrier:'High ash content, especially in gin trash. Sustainable removal rates are limited by soil health needs. Varying fiber quality and composition across growing seasons and regions.',
    climateContext:'Texas leads the U.S. in cotton production — primarily in the South Plains (Lubbock area). Cotton stover (stalks, leaves, and gin trash) is a significant agricultural residue stream specific to Texas and represents a locally relevant bioenergy feedstock opportunity for West Texas.',
    texasSuitability:'Excellent contextual relevance for West Texas and the South Plains cotton farming region. A genuinely Texas-specific bioenergy feedstock with existing collection infrastructure in cotton gin facilities.',
    reasoning:'Cotton stover is a major, underutilized Texas agricultural residue. Gin trash (the fibrous, leafy waste from cotton gin operations) is particularly abundant. The bioenergy potential is real, and proximity to existing agricultural infrastructure reduces logistics barriers — though the conversion economics at scale are not yet fully proven.',
    sources:[
      { label:'USDA ERS — Bioenergy', url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' },
      { label:'Texas A&M AgriLife Cotton Research', url:'https://agriliferesearch.tamu.edu/programs/cotton/' }
    ],
    heatingValueRange:'15–17 MJ/kg dry',
    evidenceStrength:'Moderate',
    sourceIds:['usda_ers','doe_bioenergy']
  },

  crop_residue: {
    commonName:'General Crop Residue', scientificName:'Mixed agricultural residue',
    category:'Agricultural residue / mixed lignocellulosic', icon:'🌾',
    biomassPotential:'Medium', sustainabilityPotential:'Medium',
    waterUse:'N/A', droughtTolerance:'N/A', texasFit:'Good',
    conversionMethods:[
      'Cellulosic ethanol (with pretreatment)',
      'Biogas via anaerobic digestion',
      'Biopower via combustion',
      'Biochar via pyrolysis'
    ],
    processingBarrier:'Variable composition across crop types. Removing too much residue harms soil organic matter, erosion resistance, and long-term farm productivity. Logistics and collection are cost-intensive.',
    climateContext:'Central Texas produces cotton, sorghum, and wheat residues more commonly than corn stover. Collection logistics and sustainable removal limits are highly context-dependent on crop type, soil conditions, and farm management practices.',
    texasSuitability:'Good contextual relevance — Texas generates significant volumes of diverse crop residues. Cotton and grain sorghum residues are particularly relevant to this state.',
    reasoning:'Crop residue has bioenergy potential but soil health constraints are real — not all residue should or can be harvested sustainably. Actual potential depends heavily on crop type, residue cover needs, and local farming practices. An image alone cannot identify the specific crop or residue type with confidence.',
    sources:[
      { label:'USDA ERS — Bioenergy', url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'14–18 MJ/kg dry (varies by crop type)',
    evidenceStrength:'Moderate',
    sourceIds:['usda_ers','doe_bioenergy']
  },

  wood_biomass: {
    commonName:'Wood / Tree Biomass', scientificName:'Various woody species',
    category:'Woody biomass / lignocellulosic', icon:'🌲',
    biomassPotential:'Medium-high', sustainabilityPotential:'Medium',
    waterUse:'Low (trees)', droughtTolerance:'Medium-High', texasFit:'Fair',
    conversionMethods:[
      'Pyrolysis → biochar / bio-oil',
      'Gasification → syngas for power or fuel',
      'Biopower via direct combustion or co-firing with coal',
      'Cellulosic ethanol (with intensive pretreatment — expensive)'
    ],
    processingBarrier:'High lignin content (20–35%) requires intensive pretreatment for liquid fuels. Long growth cycles limit annual harvest rates. Land-use, biodiversity, and sustainability concerns are significant for purpose-grown forest bioenergy.',
    climateContext:'Central Texas has limited dense forest. Live oak, Ashe juniper, and mesquite are regionally common but are ecologically significant species not typically managed for bioenergy. East Texas piney woods offer more traditional woody biomass opportunities.',
    texasSuitability:'Fair for Central Texas. Better potential in East Texas piney woods region. Invasive species (mesquite, juniper) represent a more sustainable woody biomass opportunity for Central Texas.',
    reasoning:'Woody biomass can serve as a bioenergy feedstock via pyrolysis or gasification, but fuel potential estimation by image is especially unreliable — species, age, density, moisture content, and growth conditions all significantly affect quality.',
    sources:[
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' },
      { label:'NREL Lignocellulosic Biomass Process Design', url:'https://docs.nrel.gov/docs/fy02osti/32438.pdf' }
    ],
    heatingValueRange:'18–21 MJ/kg dry (varies by species)',
    evidenceStrength:'Moderate',
    sourceIds:['doe_bioenergy','nrel_32438']
  },

  grass_clippings: {
    commonName:'Grass Clippings / Lawn Grass', scientificName:'Various turfgrass species',
    category:'Yard waste / urban organic residue', icon:'✂️',
    biomassPotential:'Low', sustainabilityPotential:'Low-Medium',
    waterUse:'N/A (urban residue)', droughtTolerance:'N/A', texasFit:'Low value',
    conversionMethods:[
      'Composting (most practical and highest value use)',
      'Anaerobic digestion → biogas (small scale)',
      'Very limited viability as primary biofuel feedstock at industrial scale'
    ],
    processingBarrier:'High moisture content (75–85%), inconsistent composition, contamination risk from pesticides and herbicides, very low energy density per unit, and difficult collection logistics make grass clippings a poor cellulosic ethanol feedstock at industrial scale.',
    climateContext:'Urban lawn clippings are plentiful in Texas cities but contamination risk, high moisture content, collection logistics, and low energy yield make them impractical as a primary biofuel feedstock. Composting and soil amendment are higher-value uses for this material.',
    texasSuitability:'Low value as a bioenergy feedstock. Composting or mulching is a better use in Texas gardens and lawns. This is very different from purpose-grown energy grasses (switchgrass, miscanthus) managed on agricultural land.',
    reasoning:'Grass clippings are much better suited for composting or anaerobic digestion than liquid fuel production. This assessment does not reflect on purpose-grown energy grasses, which are managed very differently at much larger scale.',
    sources:[
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'14–17 MJ/kg dry (very high moisture when fresh)',
    evidenceStrength:'Limited',
    sourceIds:['doe_bioenergy']
  },

  water_hyacinth: {
    commonName:'Water Hyacinth', scientificName:'Pontederia crassipes',
    category:'Aquatic invasive / high-yield aquatic biomass', icon:'💧',
    biomassPotential:'Medium-high', sustainabilityPotential:'High (invasive harvest)',
    waterUse:'Aquatic (no cropland needed)', droughtTolerance:'None (aquatic only)', texasFit:'Fair (TX waterways)',
    conversionMethods:[
      'Biogas via anaerobic digestion (most practical current pathway)',
      'Cellulosic ethanol (after dewatering and pretreatment)',
      'Biochar from sun-dried biomass via pyrolysis',
      'Nutrient-rich compost or aquafeed supplement'
    ],
    processingBarrier:'90–95% water content requires expensive dewatering before most conversion pathways. Biogas via anaerobic digestion is the most energy-practical option. Transportation of wet biomass from waterways is logistically challenging.',
    climateContext:'Water hyacinth is a severe aquatic invasive in Texas rivers, lakes, and reservoirs — including Lady Bird Lake (Austin), East Texas reservoirs, and Gulf Coast bayous. Harvesting it for bioenergy simultaneously controls the invasive and generates feedstock, a genuine dual-use sustainability opportunity.',
    texasSuitability:'Fair — limited to Texas waterways with active infestations. Harvesting cost is the main barrier. Biogas from anaerobic digestion is the most practical near-term pathway.',
    reasoning:'Water hyacinth is one of the most productive aquatic plants on earth by biomass rate. Its invasive status in Texas actually creates a sustainability argument for harvest — you are removing an invasive while generating energy. However, dewatering costs and logistics make it challenging to be cost-competitive with terrestrial feedstocks.',
    sources:[
      { label:'NREL Biomass Research', url:'https://www.nrel.gov/bioenergy/' },
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'13–16 MJ/kg dry (90–95% moisture when fresh)',
    evidenceStrength:'Emerging',
    sourceIds:['nrel_bioenergy','doe_bioenergy']
  },

  // ── Unknown fallbacks ───────────────────────────────────────────────────────

  unknown_broadleaf: {
    commonName:'Unknown Broadleaf Plant', scientificName:'Species unconfirmed',
    category:'Unknown / broadleaf', icon:'🍃',
    biomassPotential:'Not enough evidence', sustainabilityPotential:'Not enough evidence',
    waterUse:'Unknown', droughtTolerance:'Unknown', texasFit:'Cannot assess',
    conversionMethods:['Cannot be determined from image alone — species confirmation required'],
    processingBarrier:'Cannot be assessed without confirmed plant identity and composition data.',
    climateContext:'Without confirmed plant identity, no regional climate context or biofuel suitability estimate can be responsibly provided. Please use the confirmation dropdown to select the plant type if known.',
    texasSuitability:'Cannot assess without species identification.',
    reasoning:'This tool cannot make a plant-specific biofuel claim for an unidentified broadleaf plant. Please confirm the plant type using the dropdown. If the species is genuinely unknown, "Unknown Broadleaf" is the most honest selection — and the safest one.',
    sources:[
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'Not enough evidence — species not confirmed',
    evidenceStrength:'Insufficient',
    sourceIds:['doe_bioenergy']
  },

  unknown_grass: {
    commonName:'Unknown Grass', scientificName:'Species unconfirmed (Poaceae family)',
    category:'Unknown / grass family', icon:'🌿',
    biomassPotential:'Not enough evidence', sustainabilityPotential:'Not enough evidence',
    waterUse:'Unknown', droughtTolerance:'Unknown', texasFit:'Cannot assess',
    conversionMethods:['Grasses vary enormously — species confirmation required before any pathway can be assessed'],
    processingBarrier:'Cannot be assessed without confirmed species. Grasses range from low-yield lawn grass to high-yield energy crops with very different compositions and yields.',
    climateContext:'Many grasses grow in Central Texas. Only specific energy grasses (switchgrass, energy sorghum) have meaningful published biofuel data for this region. If the grass is unidentified, no suitability claim can be made responsibly.',
    texasSuitability:'Cannot assess without species identification.',
    reasoning:'This tool cannot make a plant-specific biofuel claim for an unidentified grass. Please confirm the plant type using the dropdown. If truly unknown, "Unknown Grass" is the most honest and safest selection.',
    sources:[
      { label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ],
    heatingValueRange:'Not enough evidence — species not confirmed',
    evidenceStrength:'Insufficient',
    sourceIds:['doe_bioenergy']
  },

  // ── Additional Energy Crops ──────────────────────────────────────────────────

  energy_cane: {
    commonName:'Energy Cane', scientificName:'Saccharum spp. (energy cultivars)',
    category:'Perennial tropical grass / high-fiber sugarcane hybrid', icon:'🌿',
    biomassPotential:'High', sustainabilityPotential:'Medium',
    waterUse:'High', droughtTolerance:'Low-Medium', texasFit:'Poor–Fair (South TX only)',
    conversionMethods:[
      'Cellulosic ethanol from high-fiber bagasse (after pretreatment)',
      'Direct combustion / biopower from bagasse',
      'Pyrolysis → bio-oil'
    ],
    processingBarrier:'Requires warm humid climate similar to sugarcane. High water demand. Fiber-rich varieties need full cellulosic pretreatment unlike sweet sorghum.',
    climateContext:'Energy cane varieties are bred for high fiber biomass rather than sugar. Suited to Gulf Coast and South Texas. Central Texas heat and drought risk limit yields significantly.',
    texasSuitability:'Poor to Fair — viable only in South Texas and Gulf Coast with adequate rainfall or irrigation. Published field data specific to Texas is limited.',
    reasoning:'Energy cane is a promising high-biomass hybrid but its climate requirements (humid subtropical) restrict it to a small portion of Texas. Published field data specific to Texas is limited.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'15–17 MJ/kg dry (bagasse)',
    evidenceStrength:'Moderate',
    sourceIds:['afdc_ethanol','doe_bioenergy','usda_ers']
  },

  corn_plant: {
    commonName:'Corn Plant (whole)', scientificName:'Zea mays',
    category:'Annual C4 grain crop / dual-use biomass', icon:'🌽',
    biomassPotential:'Medium-high', sustainabilityPotential:'Low-Medium',
    waterUse:'High', droughtTolerance:'Low', texasFit:'Fair (East TX / irrigated)',
    conversionMethods:[
      'Corn grain → starch ethanol (most common U.S. pathway)',
      'Whole plant → cellulosic ethanol (experimental)',
      'Biogas via anaerobic digestion of whole plant'
    ],
    processingBarrier:'Grain ethanol requires high water and fertilizer inputs. High food-vs-fuel competition. Drought sensitive — poor fit for most of Texas without irrigation.',
    climateContext:'Corn grain is the dominant U.S. ethanol feedstock but is poorly suited to Central Texas heat and drought. East Texas with higher rainfall has better corn potential. Water use is a significant sustainability concern in drought-prone Texas.',
    texasSuitability:'Fair only in East Texas or irrigated farms. Corn stover (crop residue after harvest) is a separate, related feedstock.',
    reasoning:'U.S. corn ethanol is the most commercially established biofuel pathway but corn\'s climate requirements make it a poor fit for most of Texas. A photo cannot determine grain yield, moisture, or ethanol potential.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'14–17 MJ/kg dry (stover fraction)',
    evidenceStrength:'Strong',
    sourceIds:['afdc_ethanol','doe_bioenergy','usda_ers','kiniry_c4']
  },

  wheat_straw: {
    commonName:'Wheat Straw', scientificName:'Triticum aestivum (crop residue)',
    category:'Agricultural residue / lignocellulosic', icon:'🌾',
    biomassPotential:'Medium', sustainabilityPotential:'Medium',
    waterUse:'N/A (residue)', droughtTolerance:'N/A', texasFit:'Fair (North/West TX)',
    conversionMethods:[
      'Cellulosic ethanol (after pretreatment)',
      'Biogas via anaerobic digestion',
      'Biopower via direct combustion',
      'Pelletization for solid fuel'
    ],
    processingBarrier:'High silica (ash) content can foul boilers and inhibit fermentation. Sustainable removal rate limited by soil health needs. Logistics of baling and transport add cost.',
    climateContext:'Wheat is grown across North and West Texas, making wheat straw a locally relevant agricultural residue. The South Plains and Panhandle produce significant wheat straw volumes. Sustainable removal is limited to avoid soil erosion.',
    texasSuitability:'Fair — relevant in North and West Texas wheat-growing regions. Limited data on large-scale wheat straw bioenergy in Texas specifically.',
    reasoning:'Wheat straw is a globally studied cellulosic feedstock. In Texas, straw availability is highest in Panhandle and South Plains wheat country. High ash content and soil health constraints limit the fraction that can be sustainably removed.',
    sources:[{ label:'USDA ERS — Bioenergy', url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' }],
    heatingValueRange:'15–17 MJ/kg dry',
    evidenceStrength:'Moderate',
    sourceIds:['usda_ers','doe_bioenergy','nrel_32438']
  },

  rice_straw: {
    commonName:'Rice Straw', scientificName:'Oryza sativa (crop residue)',
    category:'Agricultural residue / high-silica lignocellulosic', icon:'🌾',
    biomassPotential:'Medium', sustainabilityPotential:'Medium',
    waterUse:'N/A (residue)', droughtTolerance:'N/A', texasFit:'Limited (Gulf Coast only)',
    conversionMethods:[
      'Biogas via anaerobic digestion',
      'Cellulosic ethanol (after pretreatment — high silica challenge)',
      'Biochar via pyrolysis (silica-rich ash useful as soil amendment)'
    ],
    processingBarrier:'Very high silica content (up to 20% ash) severely limits ethanol fermentation and causes boiler fouling. Typically burned in-field despite air quality concerns. Anaerobic digestion and pyrolysis are more practical pathways.',
    climateContext:'Rice is grown in the Gulf Coast counties of Texas (Jefferson, Chambers, Liberty, Matagorda). Rice straw from these areas represents a localized bioenergy opportunity, but the scale is small compared to Midwest rice or sugarcane states.',
    texasSuitability:'Limited — relevant only to the Gulf Coast rice-growing region. High silica content is a serious processing barrier for most pathways.',
    reasoning:'Rice straw is globally abundant but its very high silica content makes it challenging for both ethanol and biopower pathways. Texas rice production is localized to the Gulf Coast.',
    sources:[{ label:'USDA ERS — Bioenergy', url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' }],
    heatingValueRange:'13–15 MJ/kg dry (high ash content)',
    evidenceStrength:'Moderate',
    sourceIds:['usda_ers','doe_bioenergy']
  },

  // ── Woody & Shrub Biomass ────────────────────────────────────────────────────

  poplar: {
    commonName:'Poplar / Cottonwood', scientificName:'Populus spp.',
    category:'Short-rotation woody crop / lignocellulosic', icon:'🌲',
    biomassPotential:'Medium-high', sustainabilityPotential:'Medium',
    waterUse:'High', droughtTolerance:'Low', texasFit:'Poor–Fair (East TX only)',
    conversionMethods:[
      'Cellulosic ethanol (after pretreatment)',
      'Biopower via direct combustion or co-firing',
      'Pyrolysis → biochar / bio-oil',
      'Gasification → syngas'
    ],
    processingBarrier:'High water demand limits Texas suitability. Long growth cycle (5–10 years to harvest). High lignin content requires intensive pretreatment for ethanol.',
    climateContext:'Poplar (including cottonwood) grows naturally along Texas river corridors but is not well-suited for dryland energy production. East Texas offers the best potential for short-rotation poplar energy crops.',
    texasSuitability:'Poor to Fair — limited to East Texas or irrigated river-bottom sites. Water requirements are prohibitive for most of Texas.',
    reasoning:'Poplar is one of the most studied short-rotation woody bioenergy crops in the U.S. Texas is at the warm, dry edge of its range. Water requirements are a serious constraint for most Texas regions.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'18–20 MJ/kg dry',
    evidenceStrength:'Moderate',
    sourceIds:['doe_bioenergy','nrel_32438','usda_ers']
  },

  willow: {
    commonName:'Willow (shrub willow)', scientificName:'Salix spp.',
    category:'Short-rotation coppice woody crop / lignocellulosic', icon:'🌿',
    biomassPotential:'Medium', sustainabilityPotential:'Medium',
    waterUse:'Very High', droughtTolerance:'Very Low', texasFit:'Poor',
    conversionMethods:[
      'Biopower via direct combustion or co-firing',
      'Cellulosic ethanol (after pretreatment)',
      'Pyrolysis → biochar / bio-oil'
    ],
    processingBarrier:'Requires wet or riparian sites. Very high water demand makes it unsuitable for most of Texas. Primarily studied in northeastern U.S. and Europe.',
    climateContext:'Willow short-rotation coppice is extensively studied in the northeastern U.S. and Europe. Texas\'s hot, dry climate is poorly matched to willow water requirements. Not a recommended feedstock for Texas.',
    texasSuitability:'Poor — willow\'s very high water demand makes it poorly suited for any Texas region outside of permanently wet areas.',
    reasoning:'Willow bioenergy is well-documented in Europe and northeastern U.S. but is not an appropriate Texas feedstock recommendation due to water requirements. This entry is included for educational comparison.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'17–19 MJ/kg dry',
    evidenceStrength:'Moderate',
    sourceIds:['doe_bioenergy','usda_ers']
  },

  pine: {
    commonName:'Pine', scientificName:'Pinus spp. (loblolly, slash, longleaf)',
    category:'Softwood / lignocellulosic woody biomass', icon:'🌲',
    biomassPotential:'Medium-high', sustainabilityPotential:'Medium',
    waterUse:'Medium', droughtTolerance:'Medium', texasFit:'Fair (East TX piney woods)',
    conversionMethods:[
      'Biopower via direct combustion or co-firing (primary commercial use)',
      'Pyrolysis → bio-oil / biochar',
      'Gasification → syngas',
      'Pelletization for export solid fuel'
    ],
    processingBarrier:'High resin content can interfere with some microbial fermentation pathways. Cellulosic ethanol from pine is more difficult than from hardwoods.',
    climateContext:'East Texas piney woods support commercial pine timber production. Pine residues (sawdust, chips, bark) are already used for biopower by East Texas forest products industry — the most commercially relevant woody bioenergy pathway in Texas.',
    texasSuitability:'Fair to Good for East Texas piney woods region. Poor fit for Central, West, or South Texas. Established timber-bioenergy industry already exists in East Texas.',
    reasoning:'Pine biopower is commercially established in East Texas via co-location with timber mills. Cellulosic ethanol from pine is technically challenging due to resin content. A photo cannot determine timber quality, moisture, or age.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'18–21 MJ/kg dry',
    evidenceStrength:'Moderate',
    sourceIds:['doe_bioenergy','nrel_bioenergy','usda_ers']
  },

  oak: {
    commonName:'Oak', scientificName:'Quercus spp. (live oak, post oak, water oak)',
    category:'Hardwood / ecologically significant — NOT a recommended bioenergy crop', icon:'🌳',
    biomassPotential:'Medium', sustainabilityPotential:'Low',
    waterUse:'Low-Medium', droughtTolerance:'Medium-High', texasFit:'Not recommended',
    conversionMethods:[
      'Pyrolysis → high-quality hardwood biochar (not commercially prioritized)',
      'Firewood / direct combustion (traditional use only)',
      'Note: Oak is NOT a recommended bioenergy feedstock in Texas'
    ],
    processingBarrier:'Oak is ecologically important as wildlife habitat and is not a recommended bioenergy feedstock. Very slow growth makes sustainable commercial harvest economically and ecologically unjustifiable. Live oak is a protected species in some Texas jurisdictions.',
    climateContext:'Oak species (live oak, post oak, water oak) are ecologically significant Texas trees important for wildlife, shade, soil stability, and landscape character. This is not a practical bioenergy feedstock for this region. Do not make land-use or harvesting decisions based on this tool.',
    texasSuitability:'Not recommended as a bioenergy feedstock. Oak\'s ecological importance and slow growth far outweigh any bioenergy benefit.',
    reasoning:'Oak wood has high heating value but the ecological cost of removing established oak trees far exceeds any bioenergy benefit. This tool does not recommend harvesting oak for bioenergy. Do not make land-use or harvesting decisions based on this educational overview.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'19–21 MJ/kg dry (dense hardwood)',
    evidenceStrength:'Limited',
    sourceIds:['doe_bioenergy']
  },

  eucalyptus: {
    commonName:'Eucalyptus', scientificName:'Eucalyptus spp.',
    category:'Short-rotation woody crop / invasive risk', icon:'🌿',
    biomassPotential:'High', sustainabilityPotential:'Low-Medium',
    waterUse:'High', droughtTolerance:'Medium', texasFit:'Poor–Fair',
    conversionMethods:[
      'Biopower via direct combustion or co-firing',
      'Cellulosic ethanol (after pretreatment)',
      'Pyrolysis → bio-oil / biochar'
    ],
    processingBarrier:'Invasive potential is a serious ecological concern in Texas. High water demand. Allelopathic chemicals can affect soil and nearby vegetation. Freeze events can cause severe damage or mortality.',
    climateContext:'Eucalyptus grows rapidly in warm humid climates but faces serious invasive species concerns and freeze vulnerability in Texas. Regulatory and ecological concerns limit its use. Not recommended for widespread planting in Texas.',
    texasSuitability:'Poor to Fair — freeze risk and invasive potential are significant concerns. Not recommended for widespread planting. Do not plant based on this educational analysis.',
    reasoning:'Eucalyptus is a fast-growing bioenergy crop in warmer climates (Brazil, Australia, Southeast U.S.) but its invasive potential, freeze sensitivity, and water demands are concerns for Texas.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'18–21 MJ/kg dry',
    evidenceStrength:'Emerging',
    sourceIds:['doe_bioenergy','nrel_bioenergy']
  },

  wood_chips: {
    commonName:'Wood Chips / Chipped Biomass', scientificName:'Mixed woody species (chipped)',
    category:'Processed woody residue / solid biofuel feedstock', icon:'🪵',
    biomassPotential:'Medium-high', sustainabilityPotential:'Medium',
    waterUse:'N/A (processed residue)', droughtTolerance:'N/A', texasFit:'Fair (East TX)',
    conversionMethods:[
      'Biopower via direct combustion or co-firing',
      'Gasification → syngas for heat or power',
      'Pyrolysis → biochar / bio-oil',
      'Pelletization → wood pellets for export or heating'
    ],
    processingBarrier:'Energy density lower than coal — transport distance matters economically. Moisture content must be managed (ideally below 25% for combustion). Source sustainability varies significantly.',
    climateContext:'Wood chips are already used commercially in East Texas biopower plants co-located with timber processing facilities. Feedstock sourcing sustainability depends heavily on forest management practices, harvest method, and transport distance.',
    texasSuitability:'Fair — commercially relevant in East Texas timber corridor. Minimal relevance in other Texas regions without nearby forest resources.',
    reasoning:'Wood chips for biopower are commercially established in East Texas. A photo of wood chips alone cannot determine species, moisture content, ash content, or sourcing sustainability.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'17–20 MJ/kg dry (varies by species and moisture)',
    evidenceStrength:'Moderate',
    sourceIds:['doe_bioenergy','nrel_bioenergy','usda_ers']
  },

  // ── Aquatic & Other ──────────────────────────────────────────────────────────

  algae: {
    commonName:'Algae (microalgae / macroalgae)', scientificName:'Various species',
    category:'Aquatic biomass / lipid-rich biofuel feedstock', icon:'🟢',
    biomassPotential:'Medium-high', sustainabilityPotential:'Medium-high',
    waterUse:'Aquatic (minimal freshwater for some species)', droughtTolerance:'N/A (aquatic)', texasFit:'Emerging',
    conversionMethods:[
      'Lipid extraction → biodiesel (primary research pathway)',
      'Whole biomass → biogas via anaerobic digestion',
      'Hydrothermal liquefaction → bio-crude',
      'Pyrolysis → bio-oil'
    ],
    processingBarrier:'Harvesting and dewatering algae is extremely energy-intensive and expensive. Cost-competitive algae biofuel is not yet commercially proven despite decades of research.',
    climateContext:'Texas\'s high solar irradiance and warm temperatures are theoretically well-suited for algae cultivation. Commercial-scale algae biofuel production has not been demonstrated cost-effectively anywhere in the world as of the mid-2020s.',
    texasSuitability:'Emerging — strong theoretical fit for Texas solar resource. Not commercially proven. Academic and early-stage pilot projects ongoing.',
    reasoning:'Algae biofuel is one of the most-studied but least commercially mature pathways. The dewatering energy penalty and high capital costs have not been overcome at commercial scale. Do not use this tool to assess commercial viability of algae projects.',
    sources:[{ label:'NREL Bioenergy Research', url:'https://www.nrel.gov/bioenergy/' }],
    heatingValueRange:'20–29 MJ/kg dry (lipid-rich, highly variable by species)',
    evidenceStrength:'Emerging',
    sourceIds:['doe_bioenergy','nrel_bioenergy']
  },

  wetland_plant: {
    commonName:'Wetland Plant (cattail, bulrush, reed)', scientificName:'Typha / Scirpus / Phragmites spp.',
    category:'Wetland / aquatic vascular plant', icon:'🌿',
    biomassPotential:'Low-Medium', sustainabilityPotential:'Low (ecological sensitivity)',
    waterUse:'Wetland dependent', droughtTolerance:'None (wetland only)', texasFit:'Limited',
    conversionMethods:[
      'Biogas via anaerobic digestion (most practical option)',
      'Pyrolysis → biochar from dried biomass',
      'Biopower via combustion of dried biomass'
    ],
    processingBarrier:'Wetlands are ecologically protected in most Texas jurisdictions. Harvesting wetland vegetation may require permits. Very high moisture content requires dewatering. Wetland ecological services far exceed any bioenergy value.',
    climateContext:'Texas wetlands along the Gulf Coast, river bottoms, and playa lakes support ecologically important plant communities. Bioenergy harvesting of these areas is not recommended without proper permitting and ecological assessment.',
    texasSuitability:'Limited — wetland harvesting is regulated and ecologically sensitive. Biogas from anaerobic digestion is most practical if material is already being managed for invasive control.',
    reasoning:'Wetland plant bioenergy is a niche pathway applicable mainly when invasive wetland plants (common reed, water hyacinth) are being removed for ecological restoration. Do not harvest native wetland plants for bioenergy without proper permits and ecological guidance.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'13–16 MJ/kg dry (high moisture content)',
    evidenceStrength:'Limited',
    sourceIds:['doe_bioenergy','nrel_bioenergy']
  },

  ornamental: {
    commonName:'Ornamental / Landscape Plant', scientificName:'Species unconfirmed (cultivated)',
    category:'Cultivated landscape plant / not a bioenergy feedstock', icon:'🌺',
    biomassPotential:'Not enough evidence', sustainabilityPotential:'Not enough evidence',
    waterUse:'Unknown', droughtTolerance:'Unknown', texasFit:'Not applicable',
    conversionMethods:['Not applicable — ornamental plants are not bioenergy feedstocks'],
    processingBarrier:'Ornamental plants are not evaluated as bioenergy feedstocks. They are often bred for appearance, not biomass yield, and may contain pesticide residues from landscape maintenance.',
    climateContext:'This appears to be a cultivated ornamental or landscape plant. Ornamental plants are not biomass energy feedstocks. This scanner is designed for purpose-grown energy crops and agricultural residues.',
    texasSuitability:'Not applicable as a bioenergy feedstock.',
    reasoning:'Ornamental plants are not bioenergy feedstocks. If you intended to scan a different plant, please re-upload and select the correct plant type from the dropdown.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'Not applicable',
    evidenceStrength:'Insufficient',
    sourceIds:['doe_bioenergy']
  },

  food_waste: {
    commonName:'Food Waste / Plant-Based Food Residue', scientificName:'Mixed organic food waste',
    category:'Organic municipal solid waste / anaerobic digestion feedstock', icon:'🍎',
    biomassPotential:'Low-Medium', sustainabilityPotential:'High (waste diversion)',
    waterUse:'N/A (waste stream)', droughtTolerance:'N/A', texasFit:'Urban waste stream',
    conversionMethods:[
      'Anaerobic digestion → biogas / biomethane (most practical pathway)',
      'Composting (soil amendment — often higher ecological value)',
      'Thermochemical conversion (limited by moisture and composition variability)'
    ],
    processingBarrier:'Highly variable composition. High moisture content. Contamination from non-organic materials. Collection logistics are complex in most Texas municipalities. Not a viable cellulosic ethanol feedstock.',
    climateContext:'Texas cities generate significant food waste streams. Austin operates composting programs and some anaerobic digestion facilities. Food waste diversion from landfill is primarily an environmental benefit, with biogas as a secondary energy co-product.',
    texasSuitability:'Urban waste management application — relevant to Austin, Houston, Dallas, and San Antonio. This is a waste diversion application, not a primary bioenergy crop.',
    reasoning:'Food waste bioenergy (biogas) is most relevant as a waste management tool that also generates energy — not as a primary bioenergy feedstock. A photo of food waste cannot determine composition, contamination level, or energy content.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'Highly variable — anaerobic digestion pathway only',
    evidenceStrength:'Limited',
    sourceIds:['doe_bioenergy','nrel_bioenergy']
  },

  // ── Texas Native & Invasive (additional) ─────────────────────────────────────

  invasive_grass: {
    commonName:'Invasive Grass (KR Bluestem / Guinea Grass etc.)', scientificName:'Bothriochloa ischaemum / Megathyrsus maximus (examples)',
    category:'Invasive grass / ecological concern', icon:'🌿',
    biomassPotential:'Low-Medium', sustainabilityPotential:'Medium (controlled removal only)',
    waterUse:'Low', droughtTolerance:'High', texasFit:'High abundance (invasive)',
    conversionMethods:[
      'Biopower via direct combustion (if harvested as part of removal)',
      'Biogas via anaerobic digestion',
      'Cellulosic ethanol (low priority — composition not well-studied)'
    ],
    processingBarrier:'Invasive grasses in Texas are fire-adapted and spread aggressively — harvesting can stimulate regrowth. Bioenergy use is low-priority compared to eradication. Cellulosic composition is not well-documented for most Texas invasive grasses.',
    climateContext:'Texas has multiple invasive grass species including King Ranch (KR) Bluestem and Guinea Grass that have displaced native grasslands across millions of acres. Removal for any purpose has ecological co-benefits, but bioenergy-specific economics for these species are not well-established.',
    texasSuitability:'High abundance across Central and South Texas, but bioenergy potential is poorly documented. Removal is ecologically beneficial regardless of bioenergy use.',
    reasoning:'If harvesting or removing invasive grasses for any purpose, that has ecological co-benefits. However, bioenergy-specific economics for these species are not well-established in published literature.',
    sources:[{ label:'USDA ERS — Bioenergy', url:'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' }],
    heatingValueRange:'14–17 MJ/kg dry (estimated — poorly documented)',
    evidenceStrength:'Limited',
    sourceIds:['doe_bioenergy','usda_ers']
  },

  native_prairie_grass: {
    commonName:'Native Prairie Grass (mixed native)', scientificName:'Various Poaceae (native Texas species)',
    category:'Native grass / ecological value — not a recommended bioenergy harvest target', icon:'🌾',
    biomassPotential:'Low-Medium', sustainabilityPotential:'High (if not harvested)',
    waterUse:'Low', droughtTolerance:'High', texasFit:'Excellent (native — but protect, not harvest)',
    conversionMethods:[
      'Native grasses should NOT be harvested from wild or remnant stands for bioenergy',
      'Purpose-grown switchgrass (a native grass) is the recommended bioenergy alternative'
    ],
    processingBarrier:'Native prairie grasslands are ecologically irreplaceable. Harvesting native grasses from remnant prairies for bioenergy would cause significant harm to biodiversity, soil health, and carbon storage.',
    climateContext:'Native Texas prairie grasses (little bluestem, big bluestem, sideoats grama, buffalo grass) are the foundation of Texas grassland ecosystems. They sequester carbon, support pollinators and wildlife, and stabilize soil. Switchgrass — itself a native grass — is the recommended bioenergy alternative when purpose-grown on degraded land.',
    texasSuitability:'Native prairie grasses should be protected, not harvested. Switchgrass (purpose-grown on appropriate land) is the well-documented native alternative for bioenergy purposes.',
    reasoning:'This scanner strongly discourages harvesting wild or remnant native prairie grasses for bioenergy. If you are interested in grass-based bioenergy, switchgrass (purpose-grown) is the appropriate native alternative. Do not make land-use decisions based on this tool.',
    sources:[{ label:'Schmer et al. (2008) — switchgrass net energy, PNAS', url:'https://www.pnas.org/doi/10.1073/pnas.0704767105' }],
    heatingValueRange:'15–18 MJ/kg dry (estimated; purpose-grown switchgrass preferred)',
    evidenceStrength:'Limited',
    sourceIds:['schmer2008','doe_bioenergy','usda_ers']
  },

  // ── Urban / Yard Waste ───────────────────────────────────────────────────────

  leaves_yard: {
    commonName:'Leaves / Yard Waste', scientificName:'Mixed deciduous leaf litter',
    category:'Urban organic residue / low-energy-density waste', icon:'🍂',
    biomassPotential:'Low', sustainabilityPotential:'Medium',
    waterUse:'N/A (urban residue)', droughtTolerance:'N/A', texasFit:'Low value as bioenergy',
    conversionMethods:[
      'Composting (highest-value use for soil health)',
      'Mulching (soil moisture retention and weed suppression)',
      'Biogas via anaerobic digestion (small-scale only)',
      'Biochar via pyrolysis (small-scale only)'
    ],
    processingBarrier:'Variable composition, high moisture content, contamination risk from pesticides and herbicides, and very low energy density per unit make yard waste a poor cellulosic ethanol feedstock. Composting and mulching provide better ecological value.',
    climateContext:'Leaf litter and yard waste are abundant in Texas urban areas, particularly in fall. However, the best use for this material is composting or mulching to return nutrients to soil. As a bioenergy feedstock, collection logistics and energy cost exceed the yield for most scenarios.',
    texasSuitability:'Low value as bioenergy. Better used for composting, soil amendment, or mulching in Texas gardens and lawns.',
    reasoning:'Yard waste composting is more practical and ecologically valuable than bioenergy conversion. This is very different from purpose-grown energy grasses managed at agricultural scale.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'14–17 MJ/kg dry (highly variable, high moisture when fresh)',
    evidenceStrength:'Limited',
    sourceIds:['doe_bioenergy']
  },

  // ── Unconfirmed (additional) ─────────────────────────────────────────────────

  unknown_woody: {
    commonName:'Unknown Woody Plant / Shrub', scientificName:'Species unconfirmed (woody)',
    category:'Unknown / woody plant', icon:'🪵',
    biomassPotential:'Not enough evidence', sustainabilityPotential:'Not enough evidence',
    waterUse:'Unknown', droughtTolerance:'Unknown', texasFit:'Cannot assess',
    conversionMethods:['Cannot be determined without confirmed species and context'],
    processingBarrier:'Cannot be assessed without confirmed species identity. Woody plants vary enormously in composition, density, and ecological significance.',
    climateContext:'Without confirmed species identity, no bioenergy claim can be responsibly made for an unidentified woody plant. Some Texas woody plants (oak, pecan) are ecologically important and should not be harvested for bioenergy.',
    texasSuitability:'Cannot assess without species identification.',
    reasoning:'This tool cannot make a plant-specific biofuel claim for an unidentified woody plant. Please confirm the species using the dropdown or consult a local extension service.',
    sources:[{ label:'DOE Bioenergy Basics', url:'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }],
    heatingValueRange:'Not enough evidence — species not confirmed',
    evidenceStrength:'Insufficient',
    sourceIds:['doe_bioenergy']
  }

};

// ── Locations (10) ────────────────────────────────────────────────────────────
const SCAN_LOCATIONS = [
  { id:'austin',       label:'Austin, TX (default)',  short:'Austin, TX',       context:'Central Texas — hot summers (~105°F peak), ~34 in/yr rainfall, periodic severe drought, limestone soils, Edwards Aquifer recharge zone.' },
  { id:'houston',      label:'Houston, TX',            short:'Houston, TX',      context:'Gulf Coast — humid subtropical, ~50 in/yr rainfall, mild winters, flood and hurricane risk, high heat index in summer.' },
  { id:'dallas',       label:'Dallas–Fort Worth, TX',  short:'Dallas, TX',       context:'North Texas — hot dry summers (~102°F), ~37 in/yr rainfall, periodic severe weather and ice storms, clay soils.' },
  { id:'san_antonio',  label:'San Antonio, TX',        short:'San Antonio, TX',  context:'South-central Texas — hot and drier, ~30 in/yr, drought-prone, Edwards Plateau terrain, Balcones Escarpment.' },
  { id:'lubbock',      label:'Lubbock / South Plains', short:'Lubbock, TX',      context:'West Texas — semi-arid, ~19 in/yr, high wind, flat terrain, extreme heat, major cotton and grain sorghum growing area.' },
  { id:'el_paso',      label:'El Paso, TX',            short:'El Paso, TX',      context:'Chihuahuan Desert — hyper-arid, ~9 in/yr rainfall, extreme heat, high solar resource, Rio Grande valley agriculture.' },
  { id:'corpus',       label:'Corpus Christi, TX',     short:'Corpus Christi, TX', context:'Coastal Bend — humid, ~30 in/yr, high humidity, hurricane risk, petrochemical industrial corridor, coastal wetlands.' },
  { id:'amarillo',     label:'Amarillo / Panhandle',   short:'Amarillo, TX',     context:'High Plains — semi-arid, ~20 in/yr, high wind, cooler than south TX, grain crops, Ogallala Aquifer dependency.' },
  { id:'east_tx',      label:'East Texas',             short:'East TX',          context:'Piney Woods — highest rainfall in TX (~55 in/yr), humid, forested, timber industry, similar to Deep South U.S.' },
  { id:'other_tx',     label:'Other Texas location',   short:'Texas',            context:'Texas climate varies significantly by region. This analysis uses general Texas context — select a specific city for better accuracy.' }
];

// ── MobileNet label → plant key ───────────────────────────────────────────────
const _SCAN_LABEL_MAP = [
  { terms:['sugarcane','sugar cane','saccharum'],                                              key:'sugarcane'           },
  { terms:['energy cane','cane field','cane grass'],                                          key:'energy_cane'         },
  { terms:['corn stalk','corn stover','cornstalk'],                                           key:'corn_stover'         },
  { terms:['corn','maize','ear, spike','cornfield'],                                          key:'corn_plant'          },
  { terms:['wheat','wheat field','grain field','straw bale'],                                 key:'wheat_straw'         },
  { terms:['rice','rice field','rice paddy','rice plant'],                                    key:'rice_straw'          },
  { terms:['sorghum','milo'],                                                                  key:'sorghum'             },
  { terms:['bamboo','bamboo shoot','bamboo grove','bamboo forest','moso'],                    key:'bamboo'              },
  { terms:['hay','switchgrass','prairie grass','bunch grass'],                                key:'switchgrass'         },
  { terms:['hemp','cannabis','fiber crop','kenaf'],                                           key:'hemp'                },
  { terms:['agave','century plant','maguey','yucca'],                                        key:'agave'               },
  { terms:['succulent','cactus','prickly pear','opuntia','nopal','barrel cactus'],           key:'prickly_pear'        },
  { terms:['algae','seaweed','microalgae','pond scum','green algae'],                        key:'algae'               },
  { terms:['eucalyptus','gum tree','eucalypt'],                                               key:'eucalyptus'          },
  { terms:['poplar','cottonwood','aspen'],                                                    key:'poplar'              },
  { terms:['willow','weeping willow'],                                                        key:'willow'              },
  { terms:['pine cone','pine needle','pine bark','pine tree','spruce','fir'],                key:'pine'                },
  { terms:['oak','acorn','live oak','post oak'],                                              key:'oak'                 },
  { terms:['mesquite','thorny shrub','scrub brush','chaparral'],                             key:'mesquite'            },
  { terms:['acacia'],                                                                          key:'mesquite'            },
  { terms:['cedar','juniper','conifer','cypress'],                                            key:'eastern_redcedar'    },
  { terms:['lawn mower','lawn','grass clipping','turf','turfgrass'],                         key:'grass_clippings'     },
  { terms:['wood chip','woodchip','chipped wood','timber chip'],                             key:'wood_chips'          },
  { terms:['log','lumber','tree trunk','tree stump','bark','forest','grove','birch','maple'],key:'wood_biomass'        },
  { terms:['combine','harvester','thresher','stubble','stover','crop field'],                key:'crop_residue'        },
  { terms:['cotton','boll','gin'],                                                            key:'cotton_stover'       },
  { terms:['water hyacinth','hyacinth','aquatic plant','water plant','pond weed','pondweed'],key:'water_hyacinth'      },
  { terms:['compost','food waste','organic waste','compost bin'],                            key:'food_waste'          },
  { terms:['reed','cattail','bulrush','wetland','marsh'],                                    key:'wetland_plant'       },
  { terms:['grass','meadow','prairie','alang','pasture','field grass'],                      key:'unknown_grass'       },
  { terms:['leaf','plant','vine','shrub','bush','flower','daisy','fern',
            'weed','broadleaf','herb','wildflower','foliage'],                              key:'unknown_broadleaf'   },
];

// ── Scanner State ─────────────────────────────────────────────────────────────
let scanInited       = false;
let scanImageURL     = null;
let scanCameraStream = null;
let scanPlantKey     = 'unknown_grass';
let scanLocationId   = 'austin';
let scanReportShown  = false;
let _scanModel       = null;
let _scanModelState  = 'idle'; // 'idle' | 'loading' | 'ready' | 'failed'
let _scanTFLib       = null;   // saved TF.js ref — GTM may overwrite window.tf
let scanSizeCategory = 'medium';   // 'small' | 'medium' | 'large' | 'patch'
let scanHeight       = '';
let scanArea         = '';
let scanCondition    = 'fresh';    // 'fresh' | 'dry' | 'stressed'
let scanCanopyDensity= 'moderate'; // 'sparse' | 'moderate' | 'dense'
let scanOrganShown   = 'auto';     // 'auto' | 'whole' | 'leaf' | 'flower' | 'fruit' | 'bark' | 'stem'
let scanDemoMode     = false;

// ── Init ──────────────────────────────────────────────────────────────────────
function scannerInit() {
  if (!scanInited) {
    _scanBuildPlantOptions();
    _scanBuildLocationOptions();
    _scanBuildExtendedInputs();
    _scanSetupFileInputs();
    _scanSetupLiveCamera();
    _scanSetupSafetyObserver();
    _scanSetupDemoBtn();
    if (_scanModelState === 'failed') _scanModelState = 'idle';
    _scanPreloadModel();
    scanInited = true;
  }
  scanGA('plant_scanner_opened', {});
}

function scanGA(eventName, params) {
  if (typeof gtag === 'function') gtag('event', eventName, params);
}

// ── Sync selected plant into appState (for Analyze pipeline) ─────────────────
function _scanSyncAppState(key) {
  if (typeof appState === 'undefined' || !key) return;
  const p = SCAN_PLANTS[key];
  if (!p) return;
  appState.plant = {
    key,
    name:           p.commonName,
    scientificName: p.scientificName,
    category:       p.category,
    texasFit:       p.texasFit,
    droughtTolerance: p.droughtTolerance,
    waterUse:       p.waterUse,
    biomassPotential: p.biomassPotential,
    conversionMethods: p.conversionMethods,
    evidenceStrength: p.evidenceStrength,
    sourceIds:      p.sourceIds,
  };
  // Trigger scoring if location data already available
  if (typeof _locTriggerScoring === 'function') _locTriggerScoring();
  // Update plant selector UI in Analyze tab if it exists
  const analyzesel = document.getElementById('analyzePlantSel');
  if (analyzesel) analyzesel.value = key;
}

// ── Analyze tab: public plant selector ───────────────────────────────────────
function analyzeSetPlant(key) {
  _scanSyncAppState(key);
  _analyzeRenderPlantPreview(key);
}

function _analyzeRenderPlantPreview(key) {
  const el = document.getElementById('plantProfilePreview');
  if (!el) return;
  if (!key) { el.style.display = 'none'; el.innerHTML = ''; return; }
  const p = SCAN_PLANTS[key];
  if (!p) { el.style.display = 'none'; return; }
  const profile = (typeof PLANT_ENV_PROFILES !== 'undefined') ? PLANT_ENV_PROFILES[key] : null;
  const threshStr = profile
    ? `Heat stress above <strong>${profile.heatStressF}°F</strong>, critical at <strong>${profile.heatCriticalF}°F</strong>. 30-day water need: <strong>${profile.waterReq30mm} mm</strong>.`
    : 'Environmental thresholds: <em>not in profile library</em>';
  el.style.display = 'block';
  el.innerHTML = `
    <div class="ppv-name">${escapeHtml(p.icon || '')} ${escapeHtml(p.commonName)}</div>
    <div class="ppv-sci">${escapeHtml(p.scientificName || '')}</div>
    <div class="ppv-badges">
      <span class="ppv-badge">Texas Fit: ${escapeHtml(p.texasFit || '—')}</span>
      <span class="ppv-badge">Drought: ${escapeHtml(p.droughtTolerance || '—')}</span>
      <span class="ppv-badge">Water Use: ${escapeHtml(p.waterUse || '—')}</span>
      ${p.biomassPotential ? `<span class="ppv-badge">Biomass: ${escapeHtml(p.biomassPotential)}</span>` : ''}
    </div>
    <div class="ppv-chem">${threshStr}<br>Conversion methods: <strong>${(p.conversionMethods||[]).join(', ') || 'Not listed'}</strong></div>
  `;
}

function _analyzeBuildPlantDropdown() {
  const sel = document.getElementById('analyzePlantSel');
  if (!sel) return;
  const groups = {
    'Energy Crops & Grasses':  ['switchgrass','miscanthus','sorghum','energy_cane','sugarcane','bamboo','hemp','agave'],
    'Woody & Shrub Biomass':   ['poplar','willow','eucalyptus','pine','oak','wood_biomass','wood_chips'],
    'Texas Native & Invasive': ['mesquite','eastern_redcedar','prickly_pear','water_hyacinth','invasive_grass','native_prairie_grass'],
    'Agricultural Residues':   ['corn_stover','corn_plant','cotton_stover','wheat_straw','rice_straw','crop_residue','grass_clippings','leaves_yard'],
    'Aquatic & Other':         ['algae','wetland_plant','ornamental','food_waste'],
    'Unconfirmed':             ['unknown_grass','unknown_broadleaf','unknown_woody']
  };
  sel.innerHTML = '<option value="">— choose a plant or crop —</option>' +
    Object.entries(groups).map(([grpName, keys]) =>
      `<optgroup label="${escapeHtml(grpName)}">${keys.map(k => {
        const p = SCAN_PLANTS[k];
        return p ? `<option value="${k}">${escapeHtml((p.icon||'') + ' ' + p.commonName)}</option>` : '';
      }).join('')}</optgroup>`
    ).join('');
}

// ── Build dropdowns ───────────────────────────────────────────────────────────
function _scanBuildPlantOptions() {
  const sel = document.getElementById('scanPlantSel');
  if (!sel) return;
  // Group: energy crops / residues / unknowns
  const groups = {
    'Energy Crops & Grasses':  ['switchgrass','miscanthus','sorghum','energy_cane','sugarcane','bamboo','hemp','agave'],
    'Woody & Shrub Biomass':   ['poplar','willow','eucalyptus','pine','oak','wood_biomass','wood_chips'],
    'Texas Native & Invasive': ['mesquite','eastern_redcedar','prickly_pear','water_hyacinth','invasive_grass','native_prairie_grass'],
    'Agricultural Residues':   ['corn_stover','corn_plant','cotton_stover','wheat_straw','rice_straw','crop_residue','grass_clippings','leaves_yard'],
    'Aquatic & Other':         ['algae','wetland_plant','ornamental','food_waste'],
    'Unconfirmed':             ['unknown_grass','unknown_broadleaf','unknown_woody']
  };
  sel.innerHTML = Object.entries(groups).map(([grpName, keys]) =>
    `<optgroup label="${escapeHtml(grpName)}">${keys.map(k => {
      const p = SCAN_PLANTS[k];
      return p ? `<option value="${k}"${k==='unknown_grass'?' selected':''}>${escapeHtml(p.icon+' '+p.commonName)}</option>` : '';
    }).join('')}</optgroup>`
  ).join('');
  sel.addEventListener('change', () => {
    scanPlantKey = sel.value;
    _scanSyncAppState(sel.value);
    if (scanReportShown) renderScannerReport();
  });
}

function _scanBuildLocationOptions() {
  const sel = document.getElementById('scanLocationSel');
  if (!sel) return;
  sel.innerHTML = SCAN_LOCATIONS.map(l =>
    `<option value="${l.id}"${l.id==='austin'?' selected':''}>${escapeHtml(l.label)}</option>`
  ).join('');
  sel.addEventListener('change', () => {
    scanLocationId = sel.value;
    if (scanReportShown) renderScannerReport();
  });
}

// ── Extended inputs (size, condition, density, organ, height, area) ───────────
function _scanBuildExtendedInputs() {
  const sizeSel  = document.getElementById('scanSizeSel');
  const condSel  = document.getElementById('scanCondSel');
  const denseSel = document.getElementById('scanDensitySel');
  const organSel = document.getElementById('scanOrganSel');
  const heightIn = document.getElementById('scanHeightIn');
  const areaIn   = document.getElementById('scanAreaIn');
  if (sizeSel)  sizeSel.addEventListener('change',  () => { scanSizeCategory  = sizeSel.value;        if (scanReportShown) renderScannerReport(); });
  if (condSel)  condSel.addEventListener('change',  () => { scanCondition      = condSel.value;        if (scanReportShown) renderScannerReport(); });
  if (denseSel) denseSel.addEventListener('change', () => { scanCanopyDensity  = denseSel.value;       if (scanReportShown) renderScannerReport(); });
  if (organSel) organSel.addEventListener('change', () => { scanOrganShown     = organSel.value;       if (scanReportShown) renderScannerReport(); });
  if (heightIn) heightIn.addEventListener('input',  () => { scanHeight         = heightIn.value.trim(); if (scanReportShown) renderScannerReport(); });
  if (areaIn)   areaIn.addEventListener('input',    () => { scanArea           = areaIn.value.trim();   if (scanReportShown) renderScannerReport(); });
}

// ── Demo button ───────────────────────────────────────────────────────────────
function _scanSetupDemoBtn() {
  const btn = document.getElementById('scanDemoBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    scanPlantKey      = 'switchgrass';
    scanLocationId    = 'austin';
    scanSizeCategory  = 'large';
    scanCondition     = 'fresh';
    scanCanopyDensity = 'dense';
    scanOrganShown    = 'whole';
    scanHeight        = '1.5 m';
    scanArea          = '10 m²';
    scanDemoMode      = true;
    const plantSel = document.getElementById('scanPlantSel');
    const locSel   = document.getElementById('scanLocationSel');
    const sizeSel  = document.getElementById('scanSizeSel');
    const condSel  = document.getElementById('scanCondSel');
    const denSel   = document.getElementById('scanDensitySel');
    const orgSel   = document.getElementById('scanOrganSel');
    const htIn     = document.getElementById('scanHeightIn');
    const arIn     = document.getElementById('scanAreaIn');
    if (plantSel) plantSel.value = 'switchgrass';
    if (locSel)   locSel.value   = 'austin';
    if (sizeSel)  sizeSel.value  = 'large';
    if (condSel)  condSel.value  = 'fresh';
    if (denSel)   denSel.value   = 'dense';
    if (orgSel)   orgSel.value   = 'whole';
    if (htIn)     htIn.value     = '1.5 m';
    if (arIn)     arIn.value     = '10 m²';
    const confirmCard = document.getElementById('scanConfirmCard');
    const reportCard  = document.getElementById('scanReportCard');
    if (confirmCard) confirmCard.style.display = 'block';
    if (reportCard)  reportCard.style.display  = 'block';
    scanReportShown = true;
    renderScannerReport();
    if (reportCard) setTimeout(() => reportCard.scrollIntoView({ behavior:'smooth', block:'start' }), 80);
    scanGA('sample_switchgrass_viewed', { demo: true });
  });
}

// ── File / camera inputs ──────────────────────────────────────────────────────
function _scanSetupFileInputs() {
  const libBtn = document.getElementById('scanLibraryBtn');
  const camBtn = document.getElementById('scanMobileCapBtn');
  const fileIn = document.getElementById('scanFileInput');
  const camIn  = document.getElementById('scanCameraInput');
  if (libBtn && fileIn) libBtn.addEventListener('click', () => fileIn.click());
  if (camBtn && camIn)  camBtn.addEventListener('click', () => camIn.click());
  [fileIn, camIn].forEach(inp => {
    if (!inp) return;
    inp.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) _scanHandleFile(file);
      inp.value = '';
    });
  });
  const clearBtn   = document.getElementById('scanClearBtn');
  const analyzeBtn = document.getElementById('scanAnalyzeBtn');
  if (clearBtn)   clearBtn.addEventListener('click', scannerClearImage);
  if (analyzeBtn) analyzeBtn.addEventListener('click', scannerAnalyze);
}

function _scanHandleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (JPEG, PNG, WEBP, etc.).');
    return;
  }
  if (scanImageURL && scanImageURL.startsWith('blob:')) URL.revokeObjectURL(scanImageURL);
  scanImageURL = URL.createObjectURL(file);
  _scanShowPreview(scanImageURL);
  scanGA('plant_image_selected', { file_type: file.type });
}

// ── Show preview & trigger AI ─────────────────────────────────────────────────
async function _scanShowPreview(url) {
  const img     = document.getElementById('scanPreviewImg');
  const preview = document.getElementById('scanPreviewCard');
  const confirm = document.getElementById('scanConfirmCard');
  const hint    = document.getElementById('scanVisualHint');
  if (img)     { img.src = url; img.alt = 'User-uploaded plant image for educational analysis'; }
  if (preview) preview.style.display = 'block';
  if (confirm) confirm.style.display = 'block';
  if (hint)    {
    hint.style.display = 'block';
    hint.innerHTML = '🔍 <strong>Image loaded.</strong> Running visual analysis — matching against plant database. Results are approximate — user confirmation is always required.';
  }
  _scanStopCameraStream();
  setTimeout(() => confirm?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  _scanShowAISuggestLoading();
  const result = await _scanIdentifyImage(img);
  _scanUpdateAISuggest(result);
}

// ── Clear image ───────────────────────────────────────────────────────────────
function scannerClearImage() {
  if (scanImageURL && scanImageURL.startsWith('blob:')) URL.revokeObjectURL(scanImageURL);
  scanImageURL = null;
  ['scanPreviewImg','scanPreviewCard','scanConfirmCard','scanReportCard','scanVisualHint','scanAISuggest'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'scanPreviewImg') el.src = '';
    else el.style.display = 'none';
  });
  scanReportShown = false;
}

// ── Live camera ───────────────────────────────────────────────────────────────
function _scanSetupLiveCamera() {
  const liveSection = document.getElementById('scanLiveCameraSection');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (liveSection) liveSection.innerHTML = '<p class="scan-note">Live camera preview not available in this browser. Use Upload or Take Photo.</p>';
    return;
  }
  const startBtn = document.getElementById('scanStartCameraBtn');
  const stopBtn  = document.getElementById('scanStopCameraBtn');
  const capBtn   = document.getElementById('scanCaptureBtn');
  if (startBtn) startBtn.addEventListener('click', _scanStartCamera);
  if (stopBtn)  stopBtn.addEventListener('click',  _scanStopCameraStream);
  if (capBtn)   capBtn.addEventListener('click',   _scanCaptureFrame);
}

function _scanStartCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    .then(stream => {
      scanCameraStream = stream;
      const video    = document.getElementById('scanVideo');
      const liveWrap = document.getElementById('scanLiveWrap');
      const startBtn = document.getElementById('scanStartCameraBtn');
      if (video)    { video.srcObject = stream; video.play(); }
      if (liveWrap) liveWrap.style.display = 'block';
      if (startBtn) startBtn.style.display = 'none';
      scanGA('plant_camera_started', {});
    })
    .catch(err => {
      console.warn('Camera error:', err.message);
      alert('Camera access denied or unavailable. Please use Upload or Take Photo instead.');
    });
}

function _scanStopCameraStream() {
  if (scanCameraStream) { scanCameraStream.getTracks().forEach(t => t.stop()); scanCameraStream = null; }
  const video    = document.getElementById('scanVideo');
  const liveWrap = document.getElementById('scanLiveWrap');
  const startBtn = document.getElementById('scanStartCameraBtn');
  if (video)    video.srcObject = null;
  if (liveWrap) liveWrap.style.display = 'none';
  if (startBtn) startBtn.style.display = 'inline-flex';
}

function _scanCaptureFrame() {
  const video  = document.getElementById('scanVideo');
  const canvas = document.getElementById('scanCanvas');
  if (!video || !canvas || !scanCameraStream) return;
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataURL = canvas.toDataURL('image/jpeg', 0.85);
  _scanStopCameraStream();
  if (scanImageURL && scanImageURL.startsWith('blob:')) URL.revokeObjectURL(scanImageURL);
  scanImageURL = dataURL;
  _scanShowPreview(dataURL);
  scanGA('plant_photo_captured', {});
}

// ── Multi-step analysis with progress ─────────────────────────────────────────
async function scannerAnalyze() {
  if (!scanImageURL) { alert('Please upload or capture a plant image first.'); return; }
  const btn    = document.getElementById('scanAnalyzeBtn');
  const report = document.getElementById('scanReportCard');
  if (btn) { btn.textContent = '⏳ Analyzing…'; btn.disabled = true; }

  const loc = SCAN_LOCATIONS.find(l => l.id === scanLocationId) || SCAN_LOCATIONS[0];
  const plantCount = Object.keys(SCAN_PLANTS).length;

  const steps = [
    { icon: '🔍', label: 'Reading image pixels and color data…' },
    { icon: '🌿', label: `Matching visual features against ${plantCount} plant profiles…` },
    { icon: '🔬', label: 'Looking up biomass & drought data from plant literature database…' },
    { icon: '📍', label: `Applying ${loc.short} regional climate context…` },
    { icon: '📊', label: 'Compiling educational analysis and sources…' },
  ];

  // Show the report card with the progress display
  if (report) {
    report.style.display = 'block';
    report.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  _scanShowProgressSteps(steps, report);

  // Advance steps with realistic-feeling delays
  const delays = [500, 700, 600, 550, 450];
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, delays[i]));
    _scanMarkStepDone(i, steps.length);
  }

  await new Promise(r => setTimeout(r, 280));
  scanDemoMode = false;
  renderScannerReport();
  if (report) report.scrollIntoView({ behavior: 'smooth', block: 'start' });
  scanReportShown = true;
  if (btn) { btn.textContent = '🔬 Regenerate Analysis'; btn.disabled = false; }
  scanGA('plant_analysis_generated', { plant_category: scanPlantKey, location_context: scanLocationId });
}

function _scanShowProgressSteps(steps, container) {
  if (!container) return;
  container.innerHTML = `
    <div class="scan-progress-card">
      <div class="scan-progress-title">🔬 Generating Educational Analysis…</div>
      <div class="scan-progress-steps" id="scanProgressSteps">
        ${steps.map((s, i) => `
          <div class="scan-step scan-step-${i===0?'active':'pending'}" id="scanStep${i}">
            <span class="scan-step-icon">${s.icon}</span>
            <span class="scan-step-label">${escapeHtml(s.label)}</span>
            <span class="scan-step-check" aria-hidden="true"></span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _scanMarkStepDone(stepIdx, total) {
  const current = document.getElementById(`scanStep${stepIdx}`);
  if (current) {
    current.classList.replace('scan-step-active', 'scan-step-done');
    current.querySelector('.scan-step-check').textContent = '✓';
  }
  if (stepIdx + 1 < total) {
    const next = document.getElementById(`scanStep${stepIdx + 1}`);
    if (next) next.classList.replace('scan-step-pending', 'scan-step-active');
  }
}

// ── Render educational report ─────────────────────────────────────────────────
function _scanRenderReport() {
  const el = document.getElementById('scanReportCard');
  if (!el) return;
  const plant = SCAN_PLANTS[scanPlantKey];
  const loc   = SCAN_LOCATIONS.find(l => l.id === scanLocationId) || SCAN_LOCATIONS[0];
  if (!plant) return;

  const potColor = v => {
    if (!v || v === 'Not enough evidence' || v === 'Cannot assess') return '#E87A7A';
    if (v.startsWith('Very High') || v === 'Excellent')      return '#5DDBA8';
    if (v.startsWith('High') || v === 'Good')                return '#5DDBA8';
    if (v.startsWith('Medium-high') || v === 'Fair–Good')    return '#7DB9F2';
    if (v.startsWith('Medium') || v === 'Fair')              return '#F8C06A';
    if (v === 'Low-Medium')                                  return '#F8C06A';
    return '#E87A7A';
  };

  // Contextual note: highlight if invasive species
  const isInvasive = ['mesquite','eastern_redcedar','water_hyacinth'].includes(scanPlantKey);
  const invasiveBadge = isInvasive
    ? `<span class="credibility-badge badge-proto" title="Invasive species — bioenergy harvest may carry dual ecological benefit">🌍 Invasive Species</span>` : '';

  const methods = plant.conversionMethods.map(m => `<li>${escapeHtml(m)}</li>`).join('');
  const sources = plant.sources.map(s => `
    <div class="scan-source-item">
      <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer"
         onclick="scanGA('plant_source_clicked',{source:'${escapeHtml(s.label.slice(0,50))}'})"
         class="scan-source-link">📖 ${escapeHtml(s.label)}</a>
    </div>`).join('');

  // Build metric cards (6 total)
  const metrics = [
    { label:'Biomass Potential',    val: plant.biomassPotential,     color: potColor(plant.biomassPotential)     },
    { label:'Sustainability Score', val: plant.sustainabilityPotential, color: potColor(plant.sustainabilityPotential) },
    { label:'Water Requirement',    val: plant.waterUse,             color: ['Very Low','Low','Low-Medium'].some(v => plant.waterUse.startsWith(v)) ? '#5DDBA8' : plant.waterUse.startsWith('Very High') ? '#E87A7A' : '#F8C06A' },
    { label:'Drought Tolerance',    val: plant.droughtTolerance,     color: potColor(plant.droughtTolerance)     },
    { label:'Texas Regional Fit',   val: plant.texasFit,             color: potColor(plant.texasFit)             },
    { label:'Evidence Strength',    val: plant.evidenceStrength || '—', color: 'var(--text1)'                   },
  ];

  el.innerHTML = `
    <div class="scan-report-disclaimer">
      ⚠ <strong>Educational estimate only.</strong> Based on visual AI analysis, user-confirmed plant category, published biomass research, and regional climate context. This is <strong>not a lab test, fuel forecast, agronomic recommendation, or commercial viability assessment.</strong> Do not use for farming, investment, land-use, policy, or fuel-production decisions.
    </div>

    <div class="scan-report-header">
      <span class="scan-big-icon" aria-hidden="true">${plant.icon}</span>
      <div>
        <div class="scan-report-name">${escapeHtml(plant.commonName)}</div>
        <div class="scan-report-sci"><em>${escapeHtml(plant.scientificName)}</em></div>
        <div class="scan-report-cat">${escapeHtml(plant.category)}</div>
        <div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">
          <span class="credibility-badge badge-edu-est">Educational Estimate</span>
          <span class="credibility-badge badge-cited-sci">Cited Science</span>
          <span class="credibility-badge badge-user-input">User-Confirmed Plant</span>
          ${invasiveBadge}
        </div>
      </div>
    </div>

    <div class="scan-metrics-grid">
      ${metrics.map(m => `
        <div class="scan-metric-card">
          <div class="scan-metric-label">${escapeHtml(m.label)}</div>
          <div class="scan-metric-val" style="color:${m.color}">${escapeHtml(String(m.val))}</div>
        </div>`).join('')}
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📍 ${escapeHtml(loc.short)} — Regional Climate Context</div>
      <p class="scan-report-text">${escapeHtml(plant.climateContext)}</p>
      <p class="scan-climate-note"><em>📌 Selected region: ${escapeHtml(loc.context)}</em></p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">🎯 Texas Suitability Assessment</div>
      <p class="scan-report-text">${escapeHtml(plant.texasSuitability)}</p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">⚗️ Possible Conversion Pathways</div>
      <ul class="scan-method-list">${methods}</ul>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">🛡 Key Processing Barrier</div>
      <p class="scan-report-text">${escapeHtml(plant.processingBarrier)}</p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📋 Reasoning &amp; Limitations</div>
      <p class="scan-report-text">${escapeHtml(plant.reasoning)}</p>
      <p class="scan-report-text" style="margin-top:8px;color:var(--text2);font-size:11px">
        ⚠ This tool cannot calculate energy value, lignin %, cellulose %, biomass yield, moisture, ash, or fuel gallons from a photograph. Visual appearance does not predict biofuel output.
      </p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📚 Sources for This Analysis</div>
      <div class="scan-report-sources">${sources}</div>
    </div>
  `;
}

// ── Safety IntersectionObserver ───────────────────────────────────────────────
function _scanSetupSafetyObserver() {
  const card = document.getElementById('scanSafetyCard');
  if (!card || !window.IntersectionObserver) return;
  let fired = false;
  const obs = new IntersectionObserver(entries => {
    if (!fired && entries[0].isIntersecting) {
      fired = true;
      scanGA('plant_safety_note_viewed', {});
      obs.disconnect();
    }
  }, { threshold: 0.4 });
  obs.observe(card);
}

// ── TF.js + MobileNet — lazy load ────────────────────────────────────────────
function _scanLoadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function _scanRestoreTF() {
  if (_scanTFLib && typeof _scanTFLib.tensor === 'function') window.tf = _scanTFLib;
}

async function _scanLoadScripts() {
  if (!_scanTFLib || typeof _scanTFLib.tensor !== 'function') {
    await _scanLoadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js');
    _scanTFLib = window.tf;
  }
  _scanRestoreTF();
  if (typeof mobilenet === 'undefined' || typeof mobilenet.load !== 'function') {
    await _scanLoadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
  }
  _scanRestoreTF();
}

async function _scanPreloadModel() {
  if (_scanModelState !== 'idle') return;
  _scanModelState = 'loading';
  try {
    await _scanLoadScripts();
    if (typeof mobilenet === 'undefined' || typeof mobilenet.load !== 'function') throw new Error('MobileNet unavailable');
    _scanModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    _scanModelState = 'ready';
  } catch(e) {
    console.warn('[Scanner] Model load failed:', e.message);
    _scanModelState = 'failed';
  }
}

// ── 3-stage AI identification pipeline ───────────────────────────────────────
async function _scanIdentifyImage(imgEl) {
  if (!imgEl.complete || !imgEl.naturalWidth) {
    await new Promise(r => { imgEl.onload = r; imgEl.onerror = r; });
  }
  // Update stage label to phase 2
  _scanSetAIStage('stage2');

  const deadline = Date.now() + 30000;
  while (_scanModelState === 'loading' && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 400));
  }

  if (_scanModelState === 'ready' && _scanModel) {
    try {
      _scanRestoreTF();
      _scanSetAIStage('stage3');
      const preds = await _scanModel.classify(imgEl, 15);
      for (const pred of preds) {
        const lbl = pred.className.toLowerCase();
        for (const { terms, key } of _SCAN_LABEL_MAP) {
          if (terms.some(t => lbl.includes(t))) {
            return { key, confidence: pred.probability, rawLabel: pred.className, matched: true, method: 'mobilenet' };
          }
        }
      }
      // No label match — fall through to enhanced color analysis
      const colorResult = _scanColorAnalyze(imgEl);
      if (colorResult && colorResult.matched) {
        return { ...colorResult, rawLabel: `MobileNet: "${preds[0]?.className || 'unknown'}" — color fallback: ${colorResult.rawLabel}` };
      }
      return { key: null, confidence: preds[0]?.probability || 0, rawLabel: preds[0]?.className || 'Unknown', matched: false, method: 'mobilenet' };
    } catch(e) {
      console.warn('[Scanner] MobileNet error:', e.message);
    }
  }

  return _scanColorAnalyze(imgEl);
}

// ── Enhanced color analysis with texture scoring ──────────────────────────────
function _scanColorAnalyze(imgEl) {
  try {
    const SIZE = 100;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, SIZE, SIZE);
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

    let rSum=0, gSum=0, bSum=0;
    let greenPx=0, brownPx=0, yellowPx=0, whitePx=0, blueGreenPx=0, redPx=0, grayPx=0;
    let textureSum = 0, prevR=128, prevG=128, prevB=128;
    const n = SIZE * SIZE;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      rSum += r; gSum += g; bSum += b;

      // Color buckets
      if (g > r*1.12 && g > b*1.12 && g > 55)             greenPx++;
      if (r > 100 && g > 65 && b < 65 && r > g*1.05)      brownPx++;
      if (r > 145 && g > 120 && b < 85 && r > b*1.5)      yellowPx++;
      if (r > 195 && g > 195 && b > 195)                   whitePx++;
      if (b > 90 && g > 90 && b >= g && r < g*0.85)        blueGreenPx++;
      if (r > 130 && r > g*1.4 && r > b*1.3)               redPx++;
      if (Math.abs(r-g)<18 && Math.abs(g-b)<18 && r>80)    grayPx++;

      // Texture: sum of pixel-to-pixel color changes (high = textured/leafy)
      textureSum += Math.abs(r-prevR) + Math.abs(g-prevG) + Math.abs(b-prevB);
      prevR=r; prevG=g; prevB=b;
    }

    const rAvg = rSum/n, gAvg = gSum/n, bAvg = bSum/n;
    const greenFrac    = greenPx    / n;
    const brownFrac    = brownPx    / n;
    const yellowFrac   = yellowPx   / n;
    const bgFrac       = whitePx    / n;
    const blueGreenFrac = blueGreenPx / n;
    const textureScore = textureSum / (n * 3 * 255); // 0–1: how textured the image is

    // Mostly background
    if (greenFrac + brownFrac + yellowFrac + blueGreenFrac < 0.08 && bgFrac > 0.55) {
      return { key: null, confidence: 0.12, rawLabel: `Color: mostly background (RGB avg ${Math.round(rAvg)},${Math.round(gAvg)},${Math.round(bAvg)})`, matched: false, method: 'color' };
    }

    // Blue-green tones → cactus/agave (succulent-like)
    if (blueGreenFrac > 0.20 && blueGreenFrac >= greenFrac * 0.8) {
      return { key: 'agave', confidence: 0.35, rawLabel: `Color: blue-green succulent tones (${Math.round(blueGreenFrac*100)}% of pixels)`, matched: true, method: 'color' };
    }

    // Yellow-dominant with green → corn/stover
    if (yellowFrac > 0.28 && yellowFrac >= greenFrac) {
      return { key: 'corn_stover', confidence: 0.44, rawLabel: `Color: dominant yellow-gold tones (${Math.round(yellowFrac*100)}% of pixels)`, matched: true, method: 'color' };
    }

    // Brown dominant, low texture → wood/bark
    if (brownFrac > 0.35 && textureScore < 0.12) {
      return { key: 'wood_biomass', confidence: 0.42, rawLabel: `Color: smooth brown tones (${Math.round(brownFrac*100)}% brown, low texture)`, matched: true, method: 'color' };
    }

    // Very green, high texture (leaves) → broadleaf
    if (greenFrac > 0.42 && textureScore > 0.14) {
      return { key: 'unknown_broadleaf', confidence: 0.45, rawLabel: `Color: dense green with leaf texture (${Math.round(greenFrac*100)}% green, texture ${(textureScore*100).toFixed(0)})`, matched: true, method: 'color' };
    }

    // Strong green, lower texture → grass
    if (greenFrac > 0.30) {
      const key = greenFrac > 0.55 ? 'unknown_grass' : 'switchgrass';
      return { key, confidence: 0.40 + greenFrac*0.1, rawLabel: `Color: dominant green tones (${Math.round(greenFrac*100)}% of pixels)`, matched: true, method: 'color' };
    }

    // Brown + yellow mix → crop residue / straw
    if (brownFrac > 0.20 && yellowFrac > 0.12) {
      return { key: 'crop_residue', confidence: 0.36, rawLabel: `Color: brown/straw tones (${Math.round(brownFrac*100)}% brown, ${Math.round(yellowFrac*100)}% yellow)`, matched: true, method: 'color' };
    }

    // Some green
    if (greenFrac > 0.10) {
      return { key: 'unknown_grass', confidence: 0.28, rawLabel: `Color: mixed tones with green (${Math.round(greenFrac*100)}% green pixels)`, matched: true, method: 'color' };
    }

    return { key: null, confidence: 0.10, rawLabel: `Color: inconclusive (RGB avg ${Math.round(rAvg)},${Math.round(gAvg)},${Math.round(bAvg)})`, matched: false, method: 'color' };
  } catch(e) {
    return null;
  }
}

// ── AI suggestion UI — 3 stages ───────────────────────────────────────────────
function _scanShowAISuggestLoading() {
  const el = document.getElementById('scanAISuggest');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `<div class="scanAIBox scanAIBox-loading">
    <span class="scanAIDot" aria-hidden="true"></span>
    <span class="scanAIStatus" id="scanAIStatus">Stage 1 — Loading image into memory…</span>
  </div>`;
  // Advance to stage 2 after short delay (stage 1 is nearly instant)
  setTimeout(() => _scanSetAIStage('stage2'), 600);
}

function _scanSetAIStage(stage) {
  const el = document.getElementById('scanAIStatus');
  if (!el) return;
  const labels = {
    stage2: 'Stage 2 — Analyzing visual features with TF.js MobileNet…',
    stage3: `Stage 3 — Scoring against ${Object.keys(SCAN_PLANTS).length} plant profiles…`
  };
  if (labels[stage]) el.textContent = labels[stage];
}

function _scanUpdateAISuggest(result) {
  const el = document.getElementById('scanAISuggest');
  if (!el) return;

  if (!result) {
    el.innerHTML = `<div class="scanAIBox scanAIBox-unavail">
      <span class="scanAIBadge scanAIBadge-warn">⚠ Analysis unavailable</span>
      <span class="scanAINote">Visual model could not load. Please select the plant manually from the dropdown below.</span>
    </div>`;
    return;
  }

  const pct = Math.round(result.confidence * 100);
  const methodLabel = result.method === 'mobilenet' ? '🤖 MobileNet AI' : '🎨 Color Analysis';
  const methodNote  = result.method === 'mobilenet'
    ? `TF.js MobileNet (general-purpose vision, not a specialist plant identifier). Visual confidence: ${pct}%. Please verify or correct the selection below.`
    : `Based on pixel color and texture distribution. Accuracy is limited — please verify or correct below.`;

  if (result.matched && result.key) {
    const plant = SCAN_PLANTS[result.key];
    const sel = document.getElementById('scanPlantSel');
    if (sel) { sel.value = result.key; scanPlantKey = result.key; }
    el.innerHTML = `<div class="scanAIBox scanAIBox-match">
      <div class="scanAIBoxRow">
        <span class="scanAIBadge">${escapeHtml(methodLabel)}</span>
        <span class="scanAIConf">${pct}% visual confidence</span>
      </div>
      <div class="scanAILabel">Detected: <em>${escapeHtml(result.rawLabel)}</em> → pre-selected <strong>${plant ? escapeHtml(plant.icon+' '+plant.commonName) : result.key}</strong></div>
      <div class="scanAINote">${escapeHtml(methodNote)}</div>
    </div>`;
  } else {
    el.innerHTML = `<div class="scanAIBox scanAIBox-nomatch">
      <div class="scanAIBoxRow">
        <span class="scanAIBadge scanAIBadge-warn">🔍 No plant match found</span>
        <span class="scanAIConf">${pct}% visual confidence</span>
      </div>
      <div class="scanAILabel"><em>${escapeHtml(result.rawLabel)}</em></div>
      <div class="scanAINote">Could not match to a plant category from visual features alone. Please select the plant manually from the dropdown below. A closer photo of leaves, stems, or distinctive features may help on retry.</div>
    </div>`;
  }
}

// ── Dynamic report engine ─────────────────────────────────────────────────────

function getSelectedPlantProfile() {
  return SCAN_PLANTS[scanPlantKey] || SCAN_PLANTS['unknown_grass'];
}

function getLocationContext() {
  return SCAN_LOCATIONS.find(l => l.id === scanLocationId) || SCAN_LOCATIONS[0];
}

function estimateVisualBiomassIndicators() {
  const densityMap = { sparse:'Low', moderate:'Medium', dense:'High' };
  const organMap   = {
    auto:'Whole plant (estimated)', whole:'Whole plant', leaf:'Leaf (partial view)',
    flower:'Flower / inflorescence', fruit:'Fruit / seed', bark:'Bark / trunk', stem:'Stem / cane'
  };
  const greennessLabel = scanCondition === 'fresh'    ? 'High'
                       : scanCondition === 'stressed' ? 'Low-Medium' : 'Low';
  const stressLabel    = scanCondition === 'dry'       ? 'High'
                       : scanCondition === 'stressed'  ? 'Medium'    : 'Low';
  const densityLabel   = densityMap[scanCanopyDensity] || 'Medium';
  const organLabel     = organMap[scanOrganShown]      || organMap['auto'];
  const hasUserInputs  = !!(scanHeight || scanArea);
  return { greennessLabel, stressLabel, densityLabel, organLabel, hasUserInputs };
}

function estimatePhotoReliability() {
  let score = 0;
  if (!['unknown_grass','unknown_broadleaf','unknown_woody'].includes(scanPlantKey)) score += 2;
  if (scanCanopyDensity !== 'sparse') score++;
  if (scanOrganShown === 'whole')     score++;
  if (scanHeight)                     score++;
  if (scanArea)                       score++;
  if (scanCondition === 'fresh')      score++;
  if (scanDemoMode) score = 3;
  if (score >= 6) return { label:'Moderate',      note:'Multiple user inputs provided; still a qualitative estimate.' };
  if (score >= 4) return { label:'Low-Moderate',  note:'Some inputs provided; visual traits only partially characterize biomass.' };
  if (score >= 2) return { label:'Low',           note:'Limited inputs; photo alone cannot measure dry mass, moisture, or fuel yield.' };
  return           { label:'Very Low',            note:'Plant unconfirmed and minimal inputs given. Results are illustrative only.' };
}

function estimateBiomassEnergyRange(plant, loc) {
  const na = { qualLabel:'Cannot Estimate', heatingNote:'Insufficient data to form a range.', energyNote:'', condNote:'' };
  if (!plant || !plant.heatingValueRange) return na;
  const [hvLow, hvHigh] = plant.heatingValueRange;
  if (!hvLow && !hvHigh) return na;
  const condMod    = { fresh:1.0, dry:0.85, stressed:0.90 }[scanCondition]         || 1.0;
  const densityMod = { sparse:0.75, moderate:1.0, dense:1.1 }[scanCanopyDensity]   || 1.0;
  const sizeMod    = { small:0.7, medium:1.0, large:1.2, patch:1.3 }[scanSizeCategory] || 1.0;
  const combinedMod = condMod * densityMod * sizeMod;
  const adjLow  = (hvLow  * combinedMod).toFixed(1);
  const adjHigh = (hvHigh * combinedMod).toFixed(1);
  const hvLabel = plant.biomassPotential === 'Not enough evidence'
    ? 'Limited evidence — no reliable heating-value range in literature for this category'
    : `Literature heating-value range: ${hvLow}–${hvHigh} GJ/dry tonne`;
  const modDesc = combinedMod >= 1.1
    ? 'conditions suggest higher end of range'
    : combinedMod <= 0.85 ? 'stress/dryness indicators push toward lower bound'
    : 'conditions near average for this species';
  return {
    qualLabel: plant.biomassPotential || 'Unknown',
    hvLow, hvHigh, adjLow, adjHigh,
    heatingNote: hvLabel,
    energyNote:  `Photo-inferred adjustment (qualitative only): ${modDesc}.`,
    condNote:    `Condition ${condMod.toFixed(2)} × density ${densityMod.toFixed(2)} × size ${sizeMod.toFixed(2)} = ${combinedMod.toFixed(2)}`
  };
}

function generateProductivityExplanation(plant) {
  const isC4 = plant && /C4|switchgrass|sorghum|sugarcane|miscanthus|energy.?cane|Saccharum|Sorghum|Panicum|Miscanthus/i
    .test((plant.category || '') + (plant.scientificName || ''));
  const epsilon = isC4 ? '~2.5–3.5%' : '~1.0–2.0%';
  return {
    isC4,
    epsilon,
    parNote:   'PAR (Photosynthetically Active Radiation) is the 400–700 nm band plants use for photosynthesis.',
    aparNote:  'APAR = PAR × fPAR, where fPAR (fraction of PAR absorbed) ranges from ~0.1 (sparse canopy) to ~0.9 (dense canopy).',
    nppNote:   `NPP ≈ APAR × ε — where ε is radiation-use efficiency. For ${isC4 ? 'C4' : 'C3'} plants, ε is typically ${epsilon} (Potter et al. 1993; Running et al. 2004).`,
    casaNote:  'The CASA model (Carnegie-Ames-Stanford Approach) operationalizes this at landscape scale using satellite fPAR + climate drivers (Field et al. 1998; NASA MOD17).',
    limitNote: 'A single photo cannot determine APAR, ε, or growing-season length — all required inputs for any NPP estimate. Visible greenness is a rough proxy for fPAR only.',
    localNote: plant ? `Literature productivity values for ${plant.commonName} are shown as a range below — not a site-specific prediction.` : ''
  };
}

function generateBiofuelPathwayReport(plant) {
  if (!plant) return [];
  return (plant.conversionMethods || []).map((m, i) => ({
    name:    m,
    primary: i === 0,
    note:    i === 0
      ? `Primary pathway for ${plant.commonName} based on sugar/cellulose/lignin composition in literature.`
      : 'Alternative or emerging pathway — typically requires pre-treatment or specialized infrastructure.'
  }));
}

function generateConfidenceLabels() {
  const isKnown  = !['unknown_grass','unknown_broadleaf','unknown_woody'].includes(scanPlantKey);
  const plant    = getSelectedPlantProfile();
  const evidStr  = plant.evidenceStrength || 'Medium';
  const idConf   = scanDemoMode ? 'Demo (Switchgrass)' : isKnown ? 'User-confirmed' : 'Unconfirmed';
  const idLevel  = scanDemoMode || isKnown ? 'medium' : 'low';
  const idNote   = scanDemoMode
    ? 'Demo mode — identity pre-set to switchgrass for illustration only.'
    : isKnown ? 'Plant category selected by user. Cannot verify from photo alone.'
    : 'Plant type not confirmed. Select from dropdown for a better-matched report.';
  const vizConf  = scanDemoMode ? 'Illustrative' : (scanHeight || scanArea) ? 'Low-Moderate' : 'Low';
  const vizLevel = scanDemoMode ? 'low-medium'   : (scanHeight || scanArea) ? 'low-medium'   : 'low';
  const evLevel  = evidStr === 'Strong' ? 'high' : evidStr === 'Moderate' ? 'medium' : 'low';
  return [
    { axis:'Plant ID',            conf:idConf,             level:idLevel,     note:idNote },
    { axis:'Visual Biomass',      conf:vizConf,            level:vizLevel,    note:'Visual traits (greenness, density, condition) are rough proxies — not physical measurements.' },
    { axis:'Literature Evidence', conf:evidStr,            level:evLevel,     note:`Evidence strength for ${plant.commonName}: ${evidStr}. Based on peer-reviewed sources listed below.` },
    { axis:'Local Prediction',    conf:'Not a prediction', level:'low',       note:'This tool does not predict fuel yield, commercial viability, or site-specific productivity. Results are educational only.' }
  ];
}

function renderSourceCards(sourceIds) {
  if (!sourceIds || !sourceIds.length) return '<p class="scan-report-text">No specific sources listed for this plant profile.</p>';
  return sourceIds.map(id => {
    const s = SCAN_SOURCES[id];
    if (!s) return '';
    return `<div class="scan-source-item">
      <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer"
         onclick="scanGA('scanner_source_clicked',{source_id:'${escapeHtml(id)}'})"
         class="scan-source-link">📖 ${escapeHtml(s.title)}</a>
      <div class="scan-source-author">${escapeHtml(s.author)} (${escapeHtml(String(s.year))})</div>
    </div>`;
  }).join('');
}

function renderScannerReport() {
  const el = document.getElementById('scanReportCard');
  if (!el) return;
  const plant    = getSelectedPlantProfile();
  const loc      = getLocationContext();
  const indics   = estimateVisualBiomassIndicators();
  const photRel  = estimatePhotoReliability();
  const energy   = estimateBiomassEnergyRange(plant, loc);
  const prodExp  = generateProductivityExplanation(plant);
  const pathways = generateBiofuelPathwayReport(plant);
  const confLbls = generateConfidenceLabels();
  scanReportShown = true;

  const clrConf = lv => ({ high:'#5DDBA8', medium:'#7DB9F2', 'low-medium':'#F8C06A', low:'#E87A7A' }[lv] || '#E87A7A');

  const indBadge = (level, text) => {
    const cls = { High:'ind-high', Medium:'ind-med', 'Low-Medium':'ind-med', Low:'ind-low', Illustrative:'ind-neutral' }[level] || 'ind-neutral';
    return `<span class="scan-indicator-badge ${cls}">${escapeHtml(text)}</span>`;
  };

  const isInvasive = ['mesquite','eastern_redcedar','water_hyacinth','invasive_grass'].includes(scanPlantKey);
  const demoNote   = scanDemoMode ? `<span class="credibility-badge badge-proto">⚗ Demo Mode</span>` : '';

  el.innerHTML = `
    <div class="scan-report-disclaimer">
      ⚠ <strong>Educational estimate only.</strong> A photo cannot measure cellulose, lignin, moisture, dry mass, fuel yield, or commercial value. Results are based on visible traits, user inputs, plant identity, regional climate context, and cited research. <strong>Not for farming, investment, policy, land-use, or fuel-production decisions.</strong>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">🌿 1. Plant Identity</div>
      <div class="scan-report-header">
        <span class="scan-big-icon" aria-hidden="true">${plant.icon}</span>
        <div>
          <div class="scan-report-name">${escapeHtml(plant.commonName)}</div>
          <div class="scan-report-sci"><em>${escapeHtml(plant.scientificName)}</em></div>
          <div class="scan-report-cat">${escapeHtml(plant.category)}</div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <span class="credibility-badge badge-edu-est">Educational Estimate</span>
            <span class="credibility-badge badge-cited-sci">Cited Science</span>
            <span class="credibility-badge badge-user-input">User-Confirmed Plant</span>
            ${demoNote}
            ${isInvasive ? '<span class="credibility-badge badge-proto">🌍 Invasive Species</span>' : ''}
          </div>
          <div style="margin-top:7px;font-size:11px;color:var(--text3)">
            Current mode: ${scanDemoMode
              ? '<strong>demo mode — pre-loaded switchgrass example</strong>'
              : 'dynamic local evidence engine with manual plant confirmation'}
          </div>
        </div>
      </div>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📍 2. Climate Context — ${escapeHtml(loc.short)}</div>
      <p class="scan-report-text">${escapeHtml(plant.climateContext)}</p>
      <p class="scan-climate-note"><em>📌 ${escapeHtml(loc.context)}</em></p>
      <p class="scan-report-text" style="margin-top:8px">${escapeHtml(plant.texasSuitability)}</p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📸 3. Photo-Informed Biomass Indicators</div>
      <p style="font-size:11px;color:var(--text3);margin:0 0 10px">Traits below are rough visual proxies — not measurements. A photo cannot determine dry mass, moisture, lignin, or fuel yield.</p>
      <div class="scan-indicator-row">
        ${indBadge(indics.greennessLabel, '🟢 Greenness: ' + indics.greennessLabel)}
        ${indBadge(indics.densityLabel,   '🌿 Canopy density: ' + indics.densityLabel)}
        ${indBadge(indics.stressLabel === 'Low' ? 'High' : 'Low', '⚠ Stress: ' + indics.stressLabel)}
        <span class="scan-indicator-badge ind-neutral">🔬 Organ: ${escapeHtml(indics.organLabel)}</span>
        ${scanHeight ? `<span class="scan-indicator-badge ind-neutral">📏 Height: ${escapeHtml(scanHeight)}</span>` : ''}
        ${scanArea   ? `<span class="scan-indicator-badge ind-neutral">📐 Area: ${escapeHtml(scanArea)}</span>` : ''}
      </div>
      <div style="margin-top:6px;font-size:11px;color:var(--text3)">
        Photo reliability: <strong>${escapeHtml(photRel.label)}</strong> — ${escapeHtml(photRel.note)}
      </div>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📐 4. Productivity Estimate Explanation</div>
      <div class="scan-productivity-box">
        <div class="scan-formula-line">NPP ≈ APAR × ε</div>
        <div class="scan-prod-stats">
          <div>${escapeHtml(prodExp.parNote)}</div>
          <div>${escapeHtml(prodExp.aparNote)}</div>
          <div>${escapeHtml(prodExp.nppNote)}</div>
          <div>${escapeHtml(prodExp.casaNote)}</div>
        </div>
      </div>
      <p style="margin-top:10px;font-size:11px;color:var(--text3)">⚠ ${escapeHtml(prodExp.limitNote)}</p>
      <p style="margin-top:6px;font-size:11px;color:var(--text1)">${escapeHtml(prodExp.localNote)}</p>
      <p style="margin-top:4px;font-size:11px;color:var(--text3)">Radiation-use efficiency (ε): ${escapeHtml(prodExp.epsilon)} — ${prodExp.isC4 ? 'C4 species (higher than C3)' : 'C3 species'} (IPCC 2011; Field et al. 1998).</p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">⚡ 5. Biomass-Energy Estimate</div>
      <div class="scan-metrics-grid">
        <div class="scan-metric-card">
          <div class="scan-metric-label">Biomass Potential</div>
          <div class="scan-metric-val">${escapeHtml(energy.qualLabel)}</div>
        </div>
        <div class="scan-metric-card">
          <div class="scan-metric-label">Literature Heating Value</div>
          <div class="scan-metric-val" style="font-size:12px">${energy.hvLow && energy.hvHigh ? escapeHtml(energy.hvLow+'–'+energy.hvHigh+' GJ/t') : 'Insufficient data'}</div>
        </div>
        <div class="scan-metric-card">
          <div class="scan-metric-label">Photo-adjusted (qualitative)</div>
          <div class="scan-metric-val" style="font-size:12px">${energy.adjLow && energy.adjHigh ? escapeHtml(energy.adjLow+'–'+energy.adjHigh+' GJ/t') : '—'}</div>
        </div>
      </div>
      <p style="margin-top:8px;font-size:11px;color:var(--text1)">${escapeHtml(energy.heatingNote)}</p>
      <p style="margin-top:4px;font-size:11px;color:var(--text3)">${escapeHtml(energy.energyNote)}</p>
      <p style="margin-top:4px;font-size:10px;color:var(--text3)">Modifier formula: ${escapeHtml(energy.condNote)}</p>
      <p style="margin-top:8px;font-size:11px;color:var(--text3)">⚠ These are literature-range values for the species category — not a measurement of this plant. Lab assay required for actual heating value, moisture, ash, or fuel yield.</p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">⚗️ 6. Biofuel Conversion Pathways</div>
      ${pathways.map(p => `
        <div class="scan-pathway-item">
          <span>${p.primary ? '🥇' : '🔹'}</span>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text0)">${escapeHtml(p.name)}</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px">${escapeHtml(p.note)}</div>
          </div>
        </div>`).join('')}
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">🛡 7. Main Processing Barrier</div>
      <p class="scan-report-text">${escapeHtml(plant.processingBarrier)}</p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">🌱 8. Sustainability Considerations</div>
      <div class="scan-metrics-grid">
        <div class="scan-metric-card">
          <div class="scan-metric-label">Sustainability Score</div>
          <div class="scan-metric-val">${escapeHtml(plant.sustainabilityPotential)}</div>
        </div>
        <div class="scan-metric-card">
          <div class="scan-metric-label">Water Use</div>
          <div class="scan-metric-val">${escapeHtml(plant.waterUse)}</div>
        </div>
        <div class="scan-metric-card">
          <div class="scan-metric-label">Drought Tolerance</div>
          <div class="scan-metric-val">${escapeHtml(plant.droughtTolerance)}</div>
        </div>
        <div class="scan-metric-card">
          <div class="scan-metric-label">Texas Regional Fit</div>
          <div class="scan-metric-val">${escapeHtml(plant.texasFit)}</div>
        </div>
      </div>
      ${isInvasive ? '<p class="scan-report-text" style="margin-top:10px">🌍 <strong>Invasive species note:</strong> Bioenergy harvest of invasive plants may carry dual ecological benefit — reducing invasive biomass while generating energy. Logistics and economics vary widely by site.</p>' : ''}
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📊 9. Confidence &amp; Uncertainty</div>
      <div class="scan-confidence-grid">
        ${confLbls.map(c => `
          <div class="scan-conf-item">
            <div class="scan-conf-label">${escapeHtml(c.axis)}</div>
            <div class="scan-conf-level" style="color:${clrConf(c.level)}">${escapeHtml(c.conf)}</div>
            <div class="scan-conf-note">${escapeHtml(c.note)}</div>
          </div>`).join('')}
      </div>
      <div class="scan-warn-card">
        <div style="font-size:12px;font-weight:700;color:#E87A7A;margin-bottom:6px">⚠ Why this is NOT a fuel prediction</div>
        <p style="font-size:11px;color:var(--text1);line-height:1.6;margin:0">
          This process is for learning only. A photo cannot directly measure cellulose, lignin, moisture, dry mass, fuel yield, or commercial value.
          Results are based on visible traits, user inputs, plant identity, regional climate context, and cited research.
          Do not use this output for any production, investment, or policy decision.
        </p>
      </div>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📚 10. Sources &amp; Limitations</div>
      <div class="scan-report-sources">${renderSourceCards(plant.sourceIds || [])}</div>
      <p style="margin-top:12px;font-size:11px;color:var(--text1)">
        <strong>Reasoning &amp; limitations:</strong> ${escapeHtml(plant.reasoning)}
      </p>
      <p style="margin-top:8px;font-size:11px;color:var(--text3)">
        ⚠ This tool cannot calculate energy value, lignin %, cellulose %, biomass yield, moisture, ash, or fuel gallons from a photograph. Visual appearance does not predict biofuel output.
      </p>
      <p style="margin-top:8px;font-size:10px;color:var(--text3)">
        Future mode: PlantNet-assisted identification and AI-generated explanation through secure backend.
      </p>
    </div>
  `;
  scanGA('productivity_estimate_generated', { plant_key: scanPlantKey, demo: scanDemoMode });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
function scannerCleanup() {
  _scanStopCameraStream();
}
