'use strict';

// ── Plant-to-Fuel Scanner ─────────────────────────────────────────────────────
// V1: Static GitHub Pages prototype — local educational plant database only.
// No API keys are exposed. Plant identification is NOT automated or claimed.
//
// Future API integration note:
//   Real plant identification (PlantNet, Plant.id, etc.) MUST be called through
//   a secure serverless proxy — Cloudflare Worker, Netlify Function, or Vercel Function
//   — so no private API key is ever present in frontend JavaScript.
//   See: https://my.plantnet.org/doc/api/openapi
// ─────────────────────────────────────────────────────────────────────────────

const SCAN_PLANTS = {
  switchgrass: {
    commonName: 'Switchgrass',
    scientificName: 'Panicum virgatum',
    category: 'Perennial grass / lignocellulosic biomass',
    icon: '🌿',
    biomassPotential: 'High',
    sustainabilityPotential: 'Medium-high',
    conversionMethods: [
      'Cellulosic ethanol (primary research pathway)',
      'Pyrolysis → bio-oil / biochar',
      'Gasification → syngas',
      'Biopower (direct combustion)'
    ],
    processingBarrier: 'Lignin and cell-wall recalcitrance block enzymatic access to cellulose and hemicellulose, requiring costly chemical or biological pretreatment (acid, AFEX, steam explosion).',
    educationalSuitability: 'Medium-high',
    evidenceStrength: 'Strong for research potential; limited for local commercial prediction',
    climateContextAustin: 'Switchgrass is native to Central Texas and drought-tolerant. Heat and periodic drought are relevant but manageable. Yield and establishment depend on rainfall patterns, soil conditions, management inputs, and harvest logistics.',
    reasoning: 'Switchgrass is the most widely studied cellulosic bioenergy crop in the U.S. and is native to Texas. However, an image alone cannot determine fuel value — real evaluation requires field yield data, moisture content, biomass composition, pretreatment performance, logistics access, and conversion economics.',
    sources: [
      { label: 'Schmer et al. (2008) — Net energy of cellulosic ethanol from switchgrass, PNAS', url: 'https://www.pnas.org/doi/10.1073/pnas.0704767105' },
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' },
      { label: 'NREL Lignocellulosic Biomass to Ethanol Process Design', url: 'https://docs.nrel.gov/docs/fy02osti/32438.pdf' },
      { label: 'AFDC — Ethanol Fuel Basics', url: 'https://afdc.energy.gov/fuels/ethanol-fuel-basics' }
    ]
  },
  miscanthus: {
    commonName: 'Miscanthus',
    scientificName: 'Miscanthus × giganteus',
    category: 'Perennial grass / high-yield lignocellulosic biomass',
    icon: '🌾',
    biomassPotential: 'High',
    sustainabilityPotential: 'Medium-high',
    conversionMethods: [
      'Cellulosic ethanol (after pretreatment)',
      'Biopower (combustion / co-firing)',
      'Pyrolysis',
      'Pelletization for solid fuel'
    ],
    processingBarrier: 'Similar to switchgrass — lignin recalcitrance requires chemical pretreatment. Sterile hybrid propagates vegetatively, raising establishment cost.',
    educationalSuitability: 'Medium-high',
    evidenceStrength: 'Strong for yield potential in temperate climates; limited evidence for Central Texas field conditions',
    climateContextAustin: 'Miscanthus performs best in temperate, wetter climates (Europe, Midwest U.S.). Central Texas heat and drought risk may reduce yield compared to published field trials in more temperate regions.',
    reasoning: 'Miscanthus yields some of the highest biomass per hectare among energy grasses, but its water demand exceeds switchgrass. Austin-area performance is not well-established in published literature.',
    sources: [
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' },
      { label: 'AFDC — Ethanol Fuel Basics', url: 'https://afdc.energy.gov/fuels/ethanol-fuel-basics' }
    ]
  },
  corn_stover: {
    commonName: 'Corn Stover',
    scientificName: 'Zea mays (crop residue)',
    category: 'Agricultural residue / lignocellulosic biomass',
    icon: '🌽',
    biomassPotential: 'Medium-high',
    sustainabilityPotential: 'Medium',
    conversionMethods: [
      'Cellulosic ethanol (with pretreatment)',
      'Biogas (anaerobic digestion)',
      'Biopower',
      'Biochar via pyrolysis'
    ],
    processingBarrier: 'High ash content and variable composition; sustainability constraint — removing too much stover reduces soil organic matter and increases erosion risk.',
    educationalSuitability: 'Medium',
    evidenceStrength: 'Strong in U.S. corn belt; limited relevance in Central Texas where corn production is lower',
    climateContextAustin: 'Corn is grown in parts of Texas but Central Texas heat and drought limit yields and stover availability. Corn belt studies may not apply directly to this region.',
    reasoning: 'Corn stover has bioenergy potential but soil health constraints limit sustainable removal rates. In Central Texas, corn production and stover availability are lower than in Midwest contexts.',
    sources: [
      { label: 'USDA ERS — Bioenergy', url: 'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' },
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ]
  },
  sorghum: {
    commonName: 'Sorghum',
    scientificName: 'Sorghum bicolor',
    category: 'Annual grass / dual-use energy crop',
    icon: '🌱',
    biomassPotential: 'Medium-high',
    sustainabilityPotential: 'Medium-high',
    conversionMethods: [
      'Sweet sorghum juice → direct ethanol fermentation (no pretreatment)',
      'Biomass sorghum → cellulosic ethanol (with pretreatment)',
      'Biogas (anaerobic digestion)',
      'Biopower'
    ],
    processingBarrier: 'Sweet sorghum ferments directly; biomass sorghum requires full cellulosic pretreatment. Narrow harvest window limits scheduling flexibility.',
    educationalSuitability: 'High',
    evidenceStrength: 'Medium-strong — well-adapted to Texas; fewer large-scale cellulosic ethanol field trials than switchgrass',
    climateContextAustin: 'Sorghum is among the most drought-tolerant grain and energy crops. A strong regional candidate for bioenergy in Central Texas heat and drought conditions.',
    reasoning: 'Sorghum is a regionally relevant energy crop for Texas. Sweet sorghum ferments directly like sugarcane; biomass sorghum requires cellulosic processing. Its climate fit for Central Texas is among the strongest of all studied energy crops.',
    sources: [
      { label: 'USDA ERS — Bioenergy', url: 'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' },
      { label: 'AFDC — Ethanol Fuel Basics', url: 'https://afdc.energy.gov/fuels/ethanol-fuel-basics' }
    ]
  },
  sugarcane: {
    commonName: 'Sugarcane',
    scientificName: 'Saccharum officinarum',
    category: 'Tropical perennial grass / sucrose-rich energy crop',
    icon: '🍬',
    biomassPotential: 'High',
    sustainabilityPotential: 'Medium',
    conversionMethods: [
      'Direct sucrose fermentation → ethanol',
      'Bagasse (fibrous residue) → cellulosic ethanol',
      'Bagasse → biopower via combustion'
    ],
    processingBarrier: 'Requires tropical or subtropical climate with high rainfall. Crushing and juice extraction infrastructure needed. High water use raises sustainability concerns in drier regions.',
    educationalSuitability: 'Medium',
    evidenceStrength: 'Strong globally (Brazil model); limited for Central Texas which lacks the tropical climate and reliable rainfall sugarcane requires',
    climateContextAustin: 'Sugarcane is commercially grown in South Texas (Rio Grande Valley), not Central Texas. Austin area rainfall is insufficient without heavy irrigation, which raises water sustainability concerns.',
    reasoning: 'Sugarcane is the most efficient ethanol feedstock globally — Brazil produces ~640 liters per tonne of cane. Austin-area conditions are not well-matched. The bagasse residue can provide additional cellulosic ethanol or biopower.',
    sources: [
      { label: 'AFDC — Ethanol Fuel Basics', url: 'https://afdc.energy.gov/fuels/ethanol-fuel-basics' },
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ]
  },
  wood_biomass: {
    commonName: 'Wood / Tree Biomass',
    scientificName: 'Various woody species',
    category: 'Woody biomass / lignocellulosic',
    icon: '🌲',
    biomassPotential: 'Medium-high',
    sustainabilityPotential: 'Medium',
    conversionMethods: [
      'Pyrolysis → biochar / bio-oil',
      'Gasification → syngas',
      'Biopower (direct combustion or co-firing)',
      'Cellulosic ethanol (with intensive pretreatment, expensive)'
    ],
    processingBarrier: 'High lignin content (20–35%) requires intensive pretreatment. Long growth cycles limit annual harvest. Land-use, biodiversity, and sustainability concerns are significant.',
    educationalSuitability: 'Medium',
    evidenceStrength: 'Medium — woody biomass is well-studied for biopower and pyrolysis; cellulosic ethanol from wood is expensive and less common at scale',
    climateContextAustin: 'Central Texas has limited dense forest. Live oak, cedar (Ashe juniper), and mesquite are regionally common but are ecologically significant and not typically managed for bioenergy.',
    reasoning: 'Woody biomass can serve as a bioenergy feedstock via pyrolysis or gasification, but fuel potential estimation by image is especially unreliable for trees — species, age, density, moisture, and growth all affect quality significantly.',
    sources: [
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' },
      { label: 'NREL Lignocellulosic Biomass to Ethanol Process Design', url: 'https://docs.nrel.gov/docs/fy02osti/32438.pdf' }
    ]
  },
  grass_clippings: {
    commonName: 'Grass Clippings / Lawn Grass',
    scientificName: 'Various turfgrass species',
    category: 'Yard waste / urban organic residue',
    icon: '✂️',
    biomassPotential: 'Low',
    sustainabilityPotential: 'Low-medium',
    conversionMethods: [
      'Composting (most practical use)',
      'Anaerobic digestion → biogas',
      'Very limited as direct biofuel feedstock at scale'
    ],
    processingBarrier: 'High moisture content (75–85%), inconsistent composition, contamination risk from pesticides and herbicides, and very low energy density make grass clippings a poor cellulosic ethanol feedstock at scale.',
    educationalSuitability: 'Low-medium',
    evidenceStrength: 'Medium — well-documented that lawn clippings have limited practical fuel value at industrial scale despite high organic content',
    climateContextAustin: 'Urban lawn clippings are plentiful in Austin, but contamination risk, moisture content, collection logistics, and low energy yield make them impractical as a primary biofuel feedstock.',
    reasoning: 'Grass clippings are better suited for composting or anaerobic digestion than cellulosic ethanol. This does not reflect on purpose-grown energy grasses (switchgrass, miscanthus), which are managed very differently.',
    sources: [
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ]
  },
  crop_residue: {
    commonName: 'Crop Residue',
    scientificName: 'Mixed agricultural residue',
    category: 'Agricultural residue / mixed lignocellulosic',
    icon: '🌾',
    biomassPotential: 'Medium',
    sustainabilityPotential: 'Medium',
    conversionMethods: [
      'Cellulosic ethanol (with pretreatment)',
      'Biogas (anaerobic digestion)',
      'Biopower',
      'Biochar via pyrolysis'
    ],
    processingBarrier: 'Variable composition across crop types. Removing too much residue from fields harms soil organic matter, erosion resistance, and long-term productivity.',
    educationalSuitability: 'Medium',
    evidenceStrength: 'Medium — well-studied, but sustainability constraints limit how much can actually be removed from farmland',
    climateContextAustin: 'Central Texas produces cotton, sorghum, and wheat residues more commonly than corn stover. Collection logistics and sustainable removal limits are context-dependent.',
    reasoning: 'Crop residue has bioenergy potential but soil health constraints are real — not all residue can be harvested sustainably. Actual potential depends on crop type, residue cover needs, and local farming practices.',
    sources: [
      { label: 'USDA ERS — Bioenergy', url: 'https://www.ers.usda.gov/topics/farm-economy/bioenergy/' },
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ]
  },
  unknown_broadleaf: {
    commonName: 'Unknown Broadleaf Plant',
    scientificName: 'Species unconfirmed',
    category: 'Unknown / broadleaf',
    icon: '🍃',
    biomassPotential: 'Not enough evidence',
    sustainabilityPotential: 'Not enough evidence',
    conversionMethods: ['Cannot be determined from image alone — species confirmation required'],
    processingBarrier: 'Cannot be assessed without confirmed plant identity and composition data.',
    educationalSuitability: 'Low — species unknown',
    evidenceStrength: 'None — plant identity not confirmed',
    climateContextAustin: 'Without confirmed plant identity, no regional climate context or biofuel suitability estimate can be responsibly provided.',
    reasoning: 'This tool cannot make a plant-specific biofuel claim for an unidentified broadleaf plant. Please use the confirmation dropdown to select the plant type if known.',
    sources: [
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ]
  },
  unknown_grass: {
    commonName: 'Unknown Grass',
    scientificName: 'Species unconfirmed (Poaceae family)',
    category: 'Unknown / grass family',
    icon: '🌿',
    biomassPotential: 'Not enough evidence',
    sustainabilityPotential: 'Not enough evidence',
    conversionMethods: ['Grasses vary enormously — species confirmation required before any pathway can be assessed'],
    processingBarrier: 'Cannot be assessed without confirmed species. Grasses range from low-yield lawn grass to high-yield energy crops with very different compositions.',
    educationalSuitability: 'Low — species unknown',
    evidenceStrength: 'None — plant identity not confirmed. Grasses vary enormously in yield, composition, and conversion suitability.',
    climateContextAustin: 'Many grasses grow in Central Texas. Only specific energy grasses (switchgrass, energy sorghum) have meaningful published biofuel data for this region.',
    reasoning: 'This tool cannot make a plant-specific biofuel claim for an unidentified grass. Please confirm the plant type using the dropdown. If truly unknown, "Unknown Grass" is the most honest selection.',
    sources: [
      { label: 'DOE Bioenergy Basics', url: 'https://www.energy.gov/eere/bioenergy/bioenergy-basics' }
    ]
  }
};

const SCAN_LOCATIONS = [
  { id:'austin',      label:'Austin, TX (default)', short:'Austin, TX',      context:'Central Texas — hot summers, ~34 in/yr average rainfall, periodic drought, drought-adapted native vegetation.' },
  { id:'houston',     label:'Houston, TX',           short:'Houston, TX',     context:'Gulf Coast Texas — humid subtropical, ~50 in/yr rainfall, mild winters, flood and hurricane risk.' },
  { id:'dallas',      label:'Dallas, TX',            short:'Dallas, TX',      context:'North Texas — hot dry summers, ~37 in/yr rainfall, periodic severe weather and ice storms.' },
  { id:'san_antonio', label:'San Antonio, TX',       short:'San Antonio, TX', context:'South-central Texas — hot and drier, ~30 in/yr, drought-prone, Edwards Plateau edge terrain.' },
  { id:'lubbock',     label:'Lubbock, TX',           short:'Lubbock, TX',     context:'West Texas / Llano Estacado — semi-arid, ~19 in/yr, high wind, flat terrain, extreme heat.' },
  { id:'other_tx',    label:'Other Texas location',  short:'Texas',           context:'Texas climate varies significantly by region. This analysis uses general Texas context.' }
];

// ── TF.js MobileNet label → plant key (first match wins) ─────────────────────
const _SCAN_LABEL_MAP = [
  { terms:['corn','maize','ear, spike','cornfield'],                            key:'corn_stover'      },
  { terms:['sugarcane','sugar cane','saccharum'],                               key:'sugarcane'        },
  { terms:['sorghum'],                                                           key:'sorghum'          },
  { terms:['bamboo'],                                                            key:'miscanthus'       },
  { terms:['hay','straw','switchgrass'],                                         key:'switchgrass'      },
  { terms:['lawn mower','lawn','grass clipping'],                               key:'grass_clippings'  },
  { terms:['log','lumber','wood','oak','pine','maple','birch','tree trunk',
            'tree stump','bark','forest','grove','acorn','willow'],             key:'wood_biomass'     },
  { terms:['combine','harvester','thresher','stubble'],                         key:'crop_residue'     },
  { terms:['grass','meadow','prairie','alang','pasture'],                       key:'unknown_grass'    },
  { terms:['leaf','plant','vine','shrub','bush','flower','daisy','fern',
            'weed','broadleaf','herb'],                                          key:'unknown_broadleaf'},
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

// ── Init ──────────────────────────────────────────────────────────────────────
function scannerInit() {
  if (!scanInited) {
    _scanBuildPlantOptions();
    _scanBuildLocationOptions();
    _scanSetupFileInputs();
    _scanSetupLiveCamera();
    _scanSetupSafetyObserver();
    if (_scanModelState === 'failed') _scanModelState = 'idle'; // allow retry after code update
    _scanPreloadModel();
    scanInited = true;
  }
  scanGA('plant_scanner_opened', {});
}

// ── GA4 helper ────────────────────────────────────────────────────────────────
function scanGA(eventName, params) {
  // Never send image data, exact location, or private user data to analytics
  if (typeof gtag === 'function') gtag('event', eventName, params);
}

// ── Build dropdowns ───────────────────────────────────────────────────────────
function _scanBuildPlantOptions() {
  const sel = document.getElementById('scanPlantSel');
  if (!sel) return;
  sel.innerHTML = Object.entries(SCAN_PLANTS).map(([k, p]) =>
    `<option value="${k}"${k === 'unknown_grass' ? ' selected' : ''}>${escapeHtml(p.icon + ' ' + p.commonName)}</option>`
  ).join('');
  sel.addEventListener('change', () => {
    scanPlantKey = sel.value;
    if (scanReportShown) _scanRenderReport();
  });
}

function _scanBuildLocationOptions() {
  const sel = document.getElementById('scanLocationSel');
  if (!sel) return;
  sel.innerHTML = SCAN_LOCATIONS.map(l =>
    `<option value="${l.id}"${l.id === 'austin' ? ' selected' : ''}>${escapeHtml(l.label)}</option>`
  ).join('');
  sel.addEventListener('change', () => {
    scanLocationId = sel.value;
    if (scanReportShown) _scanRenderReport();
  });
}

// ── File / camera-roll inputs ─────────────────────────────────────────────────
function _scanSetupFileInputs() {
  // Trigger hidden inputs via visible buttons
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

// ── Handle selected file ──────────────────────────────────────────────────────
function _scanHandleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (JPEG, PNG, WEBP, GIF, etc.).');
    return;
  }
  if (scanImageURL && scanImageURL.startsWith('blob:')) URL.revokeObjectURL(scanImageURL);
  scanImageURL = URL.createObjectURL(file);
  _scanShowPreview(scanImageURL);
  scanGA('plant_image_selected', { file_type: file.type });
}

// ── Show preview ──────────────────────────────────────────────────────────────
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
    hint.innerHTML = '🔍 <strong>Image analysis:</strong> TF.js MobileNet is running on your image in-browser. Results are approximate — user confirmation is always required before generating the analysis.';
  }
  _scanStopCameraStream();
  setTimeout(() => confirm?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

  // Run TF.js identification in the background; update dropdown when done
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

// ── Live camera via getUserMedia ───────────────────────────────────────────────
function _scanSetupLiveCamera() {
  const liveSection = document.getElementById('scanLiveCameraSection');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (liveSection) liveSection.innerHTML = '<p class="scan-note">Live camera preview is not available in this browser. Use the Upload or Take Photo options above.</p>';
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
      console.warn('Camera access error:', err.message);
      alert('Camera access was denied or unavailable. Please use the Upload or Take Photo option instead.');
    });
}

function _scanStopCameraStream() {
  if (scanCameraStream) {
    scanCameraStream.getTracks().forEach(t => t.stop());
    scanCameraStream = null;
  }
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

// ── Analyze ───────────────────────────────────────────────────────────────────
function scannerAnalyze() {
  if (!scanImageURL) {
    alert('Please upload or capture a plant image first.');
    return;
  }
  const btn = document.getElementById('scanAnalyzeBtn');
  if (btn) { btn.textContent = '⏳ Generating analysis…'; btn.disabled = true; }
  setTimeout(() => {
    _scanRenderReport();
    if (btn) { btn.textContent = '🔬 Regenerate Analysis'; btn.disabled = false; }
    const report = document.getElementById('scanReportCard');
    if (report) {
      report.style.display = 'block';
      report.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    scanReportShown = true;
    scanGA('plant_analysis_generated', { plant_category: scanPlantKey, location_context: scanLocationId });
  }, 950);
}

// ── Render educational report ─────────────────────────────────────────────────
function _scanRenderReport() {
  const el = document.getElementById('scanReportCard');
  if (!el) return;
  const plant = SCAN_PLANTS[scanPlantKey];
  const loc   = SCAN_LOCATIONS.find(l => l.id === scanLocationId) || SCAN_LOCATIONS[0];

  const potColor = v => {
    if (!v || v === 'Not enough evidence') return '#E87A7A';
    if (v.startsWith('High'))        return '#5DDBA8';
    if (v.startsWith('Medium-high')) return '#7DB9F2';
    if (v.startsWith('Medium'))      return '#F8C06A';
    return '#E87A7A';
  };

  const methods  = plant.conversionMethods.map(m => `<li>${escapeHtml(m)}</li>`).join('');
  const sources  = plant.sources.map(s => `
    <div class="scan-source-item">
      <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer"
         onclick="scanGA('plant_source_clicked',{source:'${escapeHtml(s.label.slice(0,50))}'})"
         class="scan-source-link">📖 ${escapeHtml(s.label)}</a>
    </div>`).join('');

  el.innerHTML = `
    <div class="scan-report-disclaimer">
      ⚠ <strong>Educational estimate only.</strong> This analysis is based on <em>TF.js MobileNet image analysis + user-confirmed plant category</em>, published biomass research, and regional climate context. It is <strong>not a lab test, fuel forecast, agronomic recommendation, or commercial viability assessment.</strong> MobileNet is a general-purpose vision model, not a specialist botanical identifier — user confirmation is always required.
    </div>

    <div class="scan-report-header">
      <span class="scan-big-icon" aria-hidden="true">${plant.icon}</span>
      <div>
        <div class="scan-report-name">${escapeHtml(plant.commonName)}</div>
        <div class="scan-report-sci"><em>${escapeHtml(plant.scientificName)}</em></div>
        <div class="scan-report-cat">${escapeHtml(plant.category)}</div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
          <span class="credibility-badge badge-edu-est">Educational Estimate</span>
          <span class="credibility-badge badge-cited-sci">Cited Science</span>
          <span class="credibility-badge badge-user-input">User-Confirmed</span>
        </div>
      </div>
    </div>

    <div class="scan-metrics-grid">
      <div class="scan-metric-card">
        <div class="scan-metric-label">Biomass Potential</div>
        <div class="scan-metric-val" style="color:${potColor(plant.biomassPotential)}">${escapeHtml(plant.biomassPotential)}</div>
      </div>
      <div class="scan-metric-card">
        <div class="scan-metric-label">Sustainability Potential</div>
        <div class="scan-metric-val" style="color:${potColor(plant.sustainabilityPotential)}">${escapeHtml(plant.sustainabilityPotential)}</div>
      </div>
      <div class="scan-metric-card">
        <div class="scan-metric-label">Educational Suitability</div>
        <div class="scan-metric-val" style="color:${potColor(plant.educationalSuitability)}">${escapeHtml(plant.educationalSuitability)}</div>
      </div>
      <div class="scan-metric-card">
        <div class="scan-metric-label">Evidence Strength</div>
        <div class="scan-metric-val scan-metric-evidence">${escapeHtml(plant.evidenceStrength)}</div>
      </div>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📍 ${escapeHtml(loc.short)} — Climate Context</div>
      <p class="scan-report-text">${escapeHtml(plant.climateContextAustin)}</p>
      <p class="scan-climate-note"><em>${escapeHtml(loc.context)}</em></p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">⚗️ Possible Conversion Pathways</div>
      <ul class="scan-method-list">${methods}</ul>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">🛡 Processing Barrier</div>
      <p class="scan-report-text">${escapeHtml(plant.processingBarrier)}</p>
    </div>

    <div class="scan-report-section">
      <div class="scan-section-title">📋 Reasoning &amp; Limitations</div>
      <p class="scan-report-text">${escapeHtml(plant.reasoning)}</p>
      <p class="scan-report-text" style="margin-top:8px;color:var(--text2);font-size:11px">
        This tool cannot calculate exact energy value, lignin content, cellulose content, biomass yield, moisture, ash, or fuel gallons from a photo. Do not use this for farming, investment, land-use, or fuel-production decisions.
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

// ── TF.js MobileNet — lazy load + identify ───────────────────────────────────

let _scanTFLib = null; // saved reference — GTM (gtag.js) sets window.tf={} and may overwrite TF.js

function _scanLoadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function _scanRestoreTF() {
  // GTM may overwrite window.tf={}; always restore our reference before TF.js calls
  if (_scanTFLib && typeof _scanTFLib.tensor === 'function') window.tf = _scanTFLib;
}

async function _scanLoadScripts() {
  // Load TF.js and capture its reference immediately before GTM can overwrite it
  if (!_scanTFLib || typeof _scanTFLib.tensor !== 'function') {
    await _scanLoadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js');
    _scanTFLib = window.tf; // capture immediately after load
  }
  _scanRestoreTF(); // ensure window.tf is TF.js before MobileNet loads

  if (typeof mobilenet === 'undefined' || typeof mobilenet.load !== 'function') {
    await _scanLoadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
  }
  _scanRestoreTF(); // ensure window.tf is TF.js before mobilenet.load() call
}

async function _scanPreloadModel() {
  if (_scanModelState !== 'idle') return;
  _scanModelState = 'loading';
  try {
    await _scanLoadScripts();
    if (typeof mobilenet === 'undefined' || typeof mobilenet.load !== 'function') {
      throw new Error('MobileNet not available');
    }
    _scanModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    _scanModelState = 'ready';
  } catch(e) {
    console.warn('[Scanner] Model load failed:', e.message);
    _scanModelState = 'failed';
  }
}

async function _scanIdentifyImage(imgEl) {
  // Wait for image to finish loading
  if (!imgEl.complete || !imgEl.naturalWidth) {
    await new Promise(r => { imgEl.onload = r; imgEl.onerror = r; });
  }

  // Wait up to 30 s for TF.js model
  const deadline = Date.now() + 30000;
  while (_scanModelState === 'loading' && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 400));
  }

  if (_scanModelState === 'ready' && _scanModel) {
    try {
      _scanRestoreTF(); // GTM may have overwritten window.tf since model loaded
      const preds = await _scanModel.classify(imgEl, 10);
      for (const pred of preds) {
        const lbl = pred.className.toLowerCase();
        for (const { terms, key } of _SCAN_LABEL_MAP) {
          if (terms.some(t => lbl.includes(t))) {
            return { key, confidence: pred.probability, rawLabel: pred.className, matched: true, method: 'mobilenet' };
          }
        }
      }
      return { key: null, confidence: preds[0]?.probability || 0, rawLabel: preds[0]?.className || 'Unknown', matched: false, method: 'mobilenet' };
    } catch(e) {
      console.warn('[Scanner] MobileNet classify error:', e.message);
    }
  }

  // Fallback: Canvas color analysis (works in every environment including headless)
  return _scanColorAnalyze(imgEl);
}

function _scanColorAnalyze(imgEl) {
  try {
    const SIZE = 80;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, SIZE, SIZE);
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

    let rSum=0, gSum=0, bSum=0;
    let greenPx=0, brownPx=0, yellowPx=0, whitePx=0;
    const n = SIZE * SIZE;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      rSum+=r; gSum+=g; bSum+=b;
      if (g > r*1.15 && g > b*1.15 && g > 60)   greenPx++;   // plant green
      if (r > 100 && g > 70 && b < 70 && r > g)  brownPx++;   // bark/wood/straw
      if (r > 150 && g > 130 && b < 90 && r > b) yellowPx++;  // corn/straw yellow
      if (r > 200 && g > 200 && b > 200)          whitePx++;   // sky/background
    }

    const rAvg=rSum/n, gAvg=gSum/n, bAvg=bSum/n;
    const greenFrac  = greenPx  / n;
    const brownFrac  = brownPx  / n;
    const yellowFrac = yellowPx / n;
    const bgFrac     = whitePx  / n;
    const plantFrac  = greenFrac + brownFrac + yellowFrac;

    if (plantFrac < 0.10 && bgFrac > 0.50) {
      return { key: null, confidence: 0.15, rawLabel: `Color analysis: mostly background (avg RGB ${Math.round(rAvg)},${Math.round(gAvg)},${Math.round(bAvg)})`, matched: false, method: 'color' };
    }
    if (yellowFrac > 0.25 && yellowFrac >= greenFrac) {
      return { key: 'corn_stover', confidence: 0.42, rawLabel: `Color analysis: dominant yellow-green tones (${Math.round(yellowFrac*100)}% of pixels)`, matched: true, method: 'color' };
    }
    if (greenFrac > 0.30) {
      const key = greenFrac > 0.55 ? 'unknown_grass' : 'switchgrass';
      return { key, confidence: 0.40 + greenFrac*0.15, rawLabel: `Color analysis: dominant green tones (${Math.round(greenFrac*100)}% of pixels)`, matched: true, method: 'color' };
    }
    if (brownFrac > 0.30) {
      return { key: 'wood_biomass', confidence: 0.38, rawLabel: `Color analysis: dominant brown/woody tones (${Math.round(brownFrac*100)}% of pixels)`, matched: true, method: 'color' };
    }
    if (greenFrac > 0.10) {
      return { key: 'unknown_grass', confidence: 0.28, rawLabel: `Color analysis: mixed tones with some green (${Math.round(greenFrac*100)}% green pixels)`, matched: true, method: 'color' };
    }
    return { key: null, confidence: 0.10, rawLabel: `Color analysis inconclusive (avg RGB ${Math.round(rAvg)},${Math.round(gAvg)},${Math.round(bAvg)})`, matched: false, method: 'color' };
  } catch(e) {
    return null;
  }
}

function _scanShowAISuggestLoading() {
  const el = document.getElementById('scanAISuggest');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `<div class="scanAIBox scanAIBox-loading">
    <span class="scanAIDot" aria-hidden="true"></span>
    <span class="scanAIStatus">Analyzing image with TF.js MobileNet…</span>
  </div>`;
}

function _scanUpdateAISuggest(result) {
  const el = document.getElementById('scanAISuggest');
  if (!el) return;

  if (!result) {
    el.innerHTML = `<div class="scanAIBox scanAIBox-unavail">
      <span class="scanAIBadge scanAIBadge-warn">⚠ AI unavailable</span>
      <span class="scanAINote">TF.js model could not load. Please select the plant manually below.</span>
    </div>`;
    return;
  }

  const pct = Math.round(result.confidence * 100);

  const isML     = result.method === 'mobilenet';
  const isColor  = result.method === 'color';
  const methodLabel = isML ? '🤖 MobileNet AI' : isColor ? '🎨 Color Analysis' : '🔍 Image Analysis';
  const methodNote  = isML
    ? 'Based on TF.js MobileNet (general-purpose vision model). Please verify or correct below.'
    : isColor
    ? 'Based on pixel color distribution from your image. Accuracy is limited — please verify or correct the selection below.'
    : 'Based on image analysis. Please verify or correct the selection below.';

  if (result.matched && result.key) {
    const plant = SCAN_PLANTS[result.key];
    const sel = document.getElementById('scanPlantSel');
    if (sel) { sel.value = result.key; scanPlantKey = result.key; }
    el.innerHTML = `<div class="scanAIBox scanAIBox-match">
      <div class="scanAIBoxRow">
        <span class="scanAIBadge">${escapeHtml(methodLabel)}</span>
        <span class="scanAIConf">${pct}% confidence</span>
      </div>
      <div class="scanAILabel">${escapeHtml(result.rawLabel)} → pre-selected <strong>${plant ? escapeHtml(plant.icon + ' ' + plant.commonName) : result.key}</strong></div>
      <div class="scanAINote">${escapeHtml(methodNote)}</div>
    </div>`;
  } else {
    el.innerHTML = `<div class="scanAIBox scanAIBox-nomatch">
      <div class="scanAIBoxRow">
        <span class="scanAIBadge scanAIBadge-warn">🔍 No plant match</span>
        <span class="scanAIConf">${pct}% confidence</span>
      </div>
      <div class="scanAILabel"><em>${escapeHtml(result.rawLabel)}</em></div>
      <div class="scanAINote">Could not match to a plant category. Please select manually below. Try a closer photo of leaves or stems.</div>
    </div>`;
  }
}

// ── FUTURE UPGRADE: PlantNet API via serverless proxy ─────────────────────────
// For real botanical species ID (500 free req/day via PlantNet):
//
// 1. Get a free key at https://my.plantnet.org/
// 2. Create a Cloudflare Worker (free tier: 100k req/day):
//      export default {
//        async fetch(req, env) {
//          const body = await req.formData();
//          const r = await fetch(
//            `https://my-api.plantnet.org/v2/identify/all?api-key=${env.PLANTNET_KEY}&nb-results=5`,
//            { method:'POST', body }
//          );
//          const data = await r.json();
//          return new Response(JSON.stringify(data), {
//            headers:{ 'Access-Control-Allow-Origin':'https://haohanzang-ai.github.io',
//                      'Content-Type':'application/json' }
//          });
//        }
//      };
// 3. Set PLANTNET_KEY as a Worker secret (never in frontend code)
// 4. Add worker URL to connect-src in CSP
// 5. Replace _scanIdentifyImage() call in _scanShowPreview() with:
//
// async function _scanPlantNetIdentify(imageURL) {
//   const blob = await fetch(imageURL).then(r => r.blob());
//   const form = new FormData();
//   form.append('images', blob, 'plant.jpg');
//   form.append('organs', 'auto');
//   const res  = await fetch('https://YOUR-WORKER.workers.dev/identify', { method:'POST', body:form });
//   if (!res.ok) return null;
//   const data = await res.json();
//   const top  = data.results?.[0];
//   if (!top || top.score < 0.10) return null;
//   const sci  = top.species?.scientificNameWithoutAuthor || '';
//   const sciMap = {
//     'Panicum virgatum':'switchgrass', 'Miscanthus giganteus':'miscanthus',
//     'Sorghum bicolor':'sorghum',      'Saccharum officinarum':'sugarcane',
//     'Zea mays':'corn_stover',
//   };
//   const key = Object.entries(sciMap).find(([k]) => sci.includes(k))?.[1] || null;
//   return { key, confidence:top.score, rawLabel:`${sci} (${top.species?.commonNames?.[0]})`, matched:!!key };
// }
// ─────────────────────────────────────────────────────────────────────────────

// ── Cleanup when leaving the scanner ─────────────────────────────────────────
function scannerCleanup() {
  _scanStopCameraStream();
}
