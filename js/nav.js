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

// ── Navigation ────────────────────────────────────────────────────────────────
function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => {
    const isActive = n.dataset.page === id;
    n.classList.toggle('active', isActive);
    n.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
  const page = document.getElementById('page-'+id);
  if(page) page.classList.add('active');
  const title = PAGE_TITLES[id] || 'Dashboard';
  document.getElementById('pageTitle').textContent = title;
  announce(`Navigated to ${title}`);
  closeSidebar();

  if(id === 'map')        renderMap();
  if(id === 'forecasts')  renderForecastPage();
  if(id === 'agriculture')renderAg();
  if(id === 'sgbiofuel')  sgBiofuelInit();
  if(id === 'scanner')    scannerInit();
  if(id === 'fueleff')    fuelEffInit();
  if(id !== 'scanner' && typeof scannerCleanup === 'function') scannerCleanup();
  if(id === 'trends')     renderTrends();
  if(id === 'airquality') renderAQ();
  if(id === 'water')      renderWater();
  if(id === 'energy')     renderEnergy();
  if(id === 'severe')     renderSevere();
  if(id === 'compare')    renderCompare();
  if(id === 'reports')    renderReports();
  if(id === 'settings')   renderSettings();
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
  const match = CITIES.find(c => c.name.toLowerCase().includes(trimmed.toLowerCase()));
  if(match){
    fb.textContent = '';
    fb.classList.remove('visible');
    selectCity(match.name);
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
