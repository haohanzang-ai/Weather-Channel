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

// ── Scanner State ─────────────────────────────────────────────────────────────
let scanInited       = false;
let scanImageURL     = null;
let scanCameraStream = null;
let scanPlantKey     = 'unknown_grass';
let scanLocationId   = 'austin';
let scanReportShown  = false;

// ── Init ──────────────────────────────────────────────────────────────────────
function scannerInit() {
  if (!scanInited) {
    _scanBuildPlantOptions();
    _scanBuildLocationOptions();
    _scanSetupFileInputs();
    _scanSetupLiveCamera();
    _scanSetupSafetyObserver();
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
function _scanShowPreview(url) {
  const img     = document.getElementById('scanPreviewImg');
  const preview = document.getElementById('scanPreviewCard');
  const confirm = document.getElementById('scanConfirmCard');
  const hint    = document.getElementById('scanVisualHint');
  if (img)     { img.src = url; img.alt = 'User-uploaded plant image for educational analysis'; }
  if (preview) preview.style.display = 'block';
  if (confirm) confirm.style.display = 'block';
  if (hint)    {
    hint.style.display = 'block';
    hint.innerHTML = '🔍 <strong>Visual note:</strong> Automated plant identification is not performed in this prototype. Visual analysis by image is unreliable, especially for grasses. Please confirm the plant type below before generating your analysis.';
  }
  _scanStopCameraStream();
  setTimeout(() => confirm?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

// ── Clear image ───────────────────────────────────────────────────────────────
function scannerClearImage() {
  if (scanImageURL && scanImageURL.startsWith('blob:')) URL.revokeObjectURL(scanImageURL);
  scanImageURL = null;
  ['scanPreviewImg','scanPreviewCard','scanConfirmCard','scanReportCard','scanVisualHint'].forEach(id => {
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
      ⚠ <strong>Educational estimate only.</strong> This analysis is based on <em>user-confirmed plant category</em>, published biomass research, and regional climate context. It is <strong>not a lab test, fuel forecast, agronomic recommendation, or commercial viability assessment.</strong> Plant identification by image is unreliable.
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

// ── Cleanup when leaving the scanner ─────────────────────────────────────────
function scannerCleanup() {
  _scanStopCameraStream();
}
