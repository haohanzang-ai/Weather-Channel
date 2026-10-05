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
  overview:   () => {}, // static landing page — no dynamic rendering needed
  analyze:    () => {
    renderDashboard(); renderAg();
    if (typeof renderStressProfile      === 'function') renderStressProfile();
    if (typeof renderAgScore            === 'function') renderAgScore();
    if (typeof renderReport             === 'function') renderReport();
    if (typeof renderPlantCityComparison=== 'function') renderPlantCityComparison();
    if (typeof scenarioInit             === 'function') scenarioInit('scenarioSection');
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
  science:      () => { if (typeof renderModelCards === 'function') renderModelCards(); },
  graphbuilder: () => { if (typeof graphBuilderInit === 'function') graphBuilderInit('sc-graphbuilder'); },
  sources:      () => { renderReports(); },
  settings:   () => { renderSettings(); },
};

// Legacy page IDs → resolved tab IDs (keeps old onclick links working)
const LEGACY_MAP = {
  dashboard: 'analyze', agriculture: 'analyze',
  map: 'mapcompare', forecasts: 'mapcompare', trends: 'mapcompare',
  airquality: 'mapcompare', water: 'mapcompare', energy: 'mapcompare',
  severe: 'mapcompare', compare: 'mapcompare',
  sgbiofuel: 'bioenergy', fueleff: 'bioenergy', scanner: 'bioenergy',
  reports: 'sources',
  // "Science & Sources" top-nav tab covers both existing tabs
  'science-sources': 'science',
};

// ── Navigation ────────────────────────────────────────────────────────────────
function showPage(id){
  const resolved = LEGACY_MAP[id] || id;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Sidebar nav items
  document.querySelectorAll('.nav-item').forEach(n => {
    const isActive = n.dataset.page === resolved;
    n.classList.toggle('active', isActive);
    n.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  syncTopNavActive(resolved);

  const page = document.getElementById('page-' + resolved);
  if(page) page.classList.add('active');

  const title = PAGE_TITLES[resolved] || 'TexasClimate';
  document.getElementById('pageTitle').textContent = title;
  announce(`Navigated to ${title}`);
  closeSidebar();

  // Scroll content area back to top on page switch
  const content = document.querySelector('.content');
  if(content) content.scrollTop = 0;

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


/* Compare and Map are two top-nav tabs that resolve to the SAME page
   ('mapcompare') and differ only by subtab. Keying the active class on
   data-page alone lit both at once, and clicking Map never deselected Compare.
   Tabs that share a page are disambiguated by data-subtab; a tab that is the
   only one for its page matches on page alone. */
function syncTopNavActive(resolved) {
  const tabs = [...document.querySelectorAll('.ptn-tab[data-page]')];
  const onPage = tabs.filter(n => n.dataset.page === resolved);
  const shared = onPage.length > 1 && onPage.every(n => n.dataset.subtab);
  const activeSub = shared && typeof subtabCurrent === 'function'
    ? subtabCurrent(resolved) : null;

  tabs.forEach(n => {
    let on = false;
    if (n.dataset.page === resolved) {
      on = shared ? (activeSub ? n.dataset.subtab === activeSub : n === onPage[0])
                  : true;
    }
    n.classList.toggle('ptn-active', on);
    n.setAttribute('aria-current', on ? 'page' : 'false');
  });
}
