'use strict';

// ── Mobile nav ────────────────────────────────────────────────────────────────
function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
  document.getElementById('hamburgerBtn').setAttribute('aria-expanded','true');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.getElementById('hamburgerBtn').setAttribute('aria-expanded','false');
}

// ── Tab render map — what to call when each main tab is shown ─────────────────
const TAB_RENDERERS = {
  analyze:    () => {
    renderDashboard(); renderAg();
    if (typeof renderStressProfile      === 'function') renderStressProfile();
    if (typeof renderAgScore            === 'function') renderAgScore();
    if (typeof renderReport             === 'function') renderReport();
    if (typeof renderPlantCityComparison=== 'function') renderPlantCityComparison();
  },
  mapcompare: () => {
    renderMap();
    renderCompare();
    renderForecastPage();
    renderTrends();
    renderAQ();
    renderWater();
    renderEnergy();
    renderSevere();
    if (typeof renderPlantCityComparison === 'function') renderPlantCityComparison();
  },
  bioenergy:  () => { sgBiofuelInit(); fuelEffInit(); scannerInit(); },
  science:      () => {},
  graphbuilder: () => { if (typeof graphBuilderInit === 'function') graphBuilderInit('sc-graphbuilder'); },
  sources:      () => { renderReports(); },
  settings:   () => { renderSettings(); },
};

// Legacy page IDs → resolved 5-tab IDs (keeps old onclick links working)
const LEGACY_MAP = {
  dashboard: 'analyze', agriculture: 'analyze',
  map: 'mapcompare', forecasts: 'mapcompare', trends: 'mapcompare',
  airquality: 'mapcompare', water: 'mapcompare', energy: 'mapcompare',
  severe: 'mapcompare', compare: 'mapcompare',
  sgbiofuel: 'bioenergy', fueleff: 'bioenergy', scanner: 'bioenergy',
  reports: 'sources',
};

// ── Navigation ────────────────────────────────────────────────────────────────
function showPage(id){
  const resolved = LEGACY_MAP[id] || id;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => {
    const isActive = n.dataset.page === resolved;
    n.classList.toggle('active', isActive);
    n.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  const page = document.getElementById('page-' + resolved);
  if(page) page.classList.add('active');

  const title = PAGE_TITLES[resolved] || 'TexasClimate';
  document.getElementById('pageTitle').textContent = title;
  announce(`Navigated to ${title}`);
  closeSidebar();

  // Scanner cleanup when leaving the bioenergy tab
  if(resolved !== 'bioenergy' && typeof scannerCleanup === 'function') scannerCleanup();

  if(TAB_RENDERERS[resolved]) TAB_RENDERERS[resolved]();
}

// ── Search ────────────────────────────────────────────────────────────────────
function debouncedSearch(val){
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=> handleSearch(val), 250);
}

function handleSearch(val){
  const trimmed = val.trim();
  const fb = document.getElementById('searchFeedback');
  if(!trimmed){ fb.textContent=''; fb.classList.remove('visible'); return; }
  const match = ALL_CITIES.find(c => c.name.toLowerCase().includes(trimmed.toLowerCase()));
  if(match){
    fb.textContent = '';
    fb.classList.remove('visible');
    showPage('mapcompare');
    selectedCity = match.name;
    if(WEATHER_DATA[match.name]){
      showCityDetail(match.name);
    } else {
      _mapFetchAndShow(match);
    }
  } else {
    fb.textContent = `No city matching "${escapeHtml(trimmed)}"`;
    fb.classList.add('visible');
    setTimeout(()=>{ fb.classList.remove('visible'); }, 3000);
  }
}

// ── Clock ─────────────────────────────────────────────────────────────────────
function updateClock(){
  const el = document.getElementById('clock');
  el.textContent = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

// ── Refresh — re-fetches live data from Open-Meteo ───────────────────────────
function refreshData(e){
  const btn = e.currentTarget;
  btn.textContent = '↻ Syncing…';
  btn.disabled = true;
  fetchAllWeatherData().finally(() => {
    btn.textContent = '↻ Refresh';
    btn.disabled = false;
    announce('Dashboard data refreshed');
  });
}
