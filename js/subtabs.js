'use strict';

// ── Sub-tab navigation config ─────────────────────────────────────────────────
// Each entry: { label, id, locked? }
// locked: section starts hidden (e.g. steps 3-6 until pipeline runs)
const SUBTAB_CONFIG = {
  analyze: [
    { label: 'Overview',       id: 'az-overview' },
    { label: 'Agriculture',    id: 'az-ag' },
    { label: '1 · Plant',      id: 'az-step1' },
    { label: '2 · Environment',id: 'az-step2' },
    { label: '3 · Stress',     id: 'az-step3' },
    { label: '4 · Ag Score',   id: 'az-step4' },
    { label: '5 · Bioenergy',  id: 'az-step5' },
    { label: '6 · Report',     id: 'az-step6' },
  ],
  mapcompare: [
    { label: 'Map',           id: 'mc-map' },
    { label: 'Compare',       id: 'mc-compare' },
    { label: 'Forecasts',     id: 'mc-forecast' },
    { label: 'Severe',        id: 'mc-severe' },
    { label: 'Trends',        id: 'mc-trends' },
    { label: 'Air Quality',   id: 'mc-aq' },
    { label: 'Water',         id: 'mc-water' },
    { label: 'Energy',        id: 'mc-energy' },
    { label: 'Plant × Cities',id: 'mc-plantcmp' },
  ],
  bioenergy: [
    { label: 'Biofuel Lab',   id: 'be-biofuellab' },
    { label: 'Fuel Pathways', id: 'be-fueleff' },
    { label: 'Plant Scanner', id: 'be-scanner' },
    { label: 'Stress-to-Fuel',id: 'be-stress' },
  ],
  science: [
    { label: 'Stress Chain',  id: 'sc-stress' },
    { label: 'Gene Atlas',    id: 'sc-atlas' },
    { label: 'Data Limits',   id: 'sc-limits' },
    { label: 'Mission',       id: 'sc-mission' },
    { label: 'Why Not Yet',   id: 'sc-why' },
    { label: 'Calculator',    id: 'sc-calc' },
  ],
  sources: [
    { label: 'Summaries',     id: 'sr-live' },
    { label: 'Transparency',  id: 'sr-transparency' },
    { label: 'Data Sources',  id: 'sr-sources' },
    { label: 'Citations',     id: 'sr-citations' },
  ],
};

// Alias existing step IDs to the az-step* names
const _ID_ALIASES = {
  'az-step3': 'stressTabSection',
  'az-step4': 'agTabSection',
  'az-step5': 'bioTabSection',
  'az-step6': 'reportTabSection',
};

const _subtabObservers = {}; // pageId -> IntersectionObserver

function subtabsInit() {
  Object.entries(SUBTAB_CONFIG).forEach(([pageId, tabs]) => {
    const page = document.getElementById('page-' + pageId);
    if (!page) return;

    // Build bar
    const bar = document.createElement('nav');
    bar.className = 'subtab-bar';
    bar.id = 'subtab-bar-' + pageId;
    bar.setAttribute('aria-label', 'Section navigation');
    bar.setAttribute('role', 'tablist');

    tabs.forEach((tab, i) => {
      const targetId = _ID_ALIASES[tab.id] || tab.id;
      const btn = document.createElement('button');
      btn.className = 'subtab-btn' + (tab.locked ? ' locked' : '') + (i === 0 ? ' active' : '');
      btn.textContent = tab.label;
      btn.dataset.targetId = targetId;
      btn.dataset.tabId    = tab.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => {
        const el = document.getElementById(targetId);
        if (!el) return;
        // If section is hidden, reveal it first
        if (el.style.display === 'none') el.style.display = '';
        // Scroll within .content
        const content = document.querySelector('.content');
        if (content) {
          const elTop = el.getBoundingClientRect().top;
          const contentTop = content.getBoundingClientRect().top;
          content.scrollBy({ top: elTop - contentTop - 60, behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        _subtabSetActive(pageId, targetId);
      });
      bar.appendChild(btn);
    });

    // Insert bar as first child of page (before data-status panel if on analyze)
    page.insertBefore(bar, page.firstChild);

    // IntersectionObserver — update active tab as user scrolls
    const content = document.querySelector('.content');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          _subtabSetActive(pageId, entry.target.id);
        }
      });
    }, {
      root: content,
      rootMargin: '-10% 0px -60% 0px',
      threshold: 0,
    });

    tabs.forEach(tab => {
      const targetId = _ID_ALIASES[tab.id] || tab.id;
      const el = document.getElementById(targetId);
      if (el) observer.observe(el);
    });

    _subtabObservers[pageId] = observer;
  });
}

function _subtabSetActive(pageId, targetId) {
  const bar = document.getElementById('subtab-bar-' + pageId);
  if (!bar) return;
  bar.querySelectorAll('.subtab-btn').forEach(btn => {
    const isActive = btn.dataset.targetId === targetId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
    // If previously locked and now visible, unlock it
    if (isActive && btn.classList.contains('locked')) {
      const el = document.getElementById(targetId);
      if (el && el.style.display !== 'none') btn.classList.remove('locked');
    }
  });
}

// Call after pipeline reveals a locked section (from _locShowScoringSteps)
function subtabsUnlock(sectionId) {
  document.querySelectorAll('.subtab-btn').forEach(btn => {
    if (btn.dataset.targetId === sectionId || btn.dataset.tabId === sectionId) {
      btn.classList.remove('locked');
    }
  });
}
