'use strict';

// ── TexasClimate Analyze workflow — step status + sample analysis ──────────────

function wfInit() {
  wfUpdateSteps();
  _wfWirePipeline();
}

// Called whenever appState changes (plant selected, env loaded, scoring complete)
function wfUpdateSteps() {
  if (typeof appState === 'undefined') return;
  const has1 = !!appState.plant;
  const has2 = !!appState.envData;
  const has3 = !!appState.stressScores;
  const has4 = !!appState.agricultureScore;
  const has5 = !!appState.bioenergyScore;

  _wfBadge(1, has1 ? 'complete' : 'active');
  _wfBadge(2, has2 ? 'complete' : has1 ? 'active' : 'idle');
  _wfBadge(3, has3 ? 'complete' : (has1 && has2) ? 'active' : 'waiting');
  _wfBadge(4, has4 ? 'complete' : has3         ? 'active' : 'waiting');
  _wfBadge(5, has5 ? 'complete' : has4         ? 'active' : 'waiting');
  _wfBadge(6, has5                             ? 'active' : 'waiting');

  _wfPipelineSync();
}

const _WF_BADGE = {
  idle:     { text: '○ Select a plant first',    cls: 'wf-st-idle' },
  active:   { text: '→ Ready — action required', cls: 'wf-st-active' },
  complete: { text: '✓ Complete',                cls: 'wf-st-complete' },
  waiting:  { text: '○ Needs Steps 1 + 2',       cls: 'wf-st-waiting' },
};

function _wfBadge(step, status) {
  const el = document.getElementById('wf-status-' + step);
  if (!el) return;
  const cfg = _WF_BADGE[status] || _WF_BADGE.idle;
  el.textContent = cfg.text;
  el.className = 'wf-step-status ' + cfg.cls;
}

// Sync the pipeline diagram dots to match appState
function _wfPipelineSync() {
  if (typeof appState === 'undefined') return;
  // Map each of the 6 pipeline steps to a completed condition
  const done = [
    !!appState.plant,
    !!appState.envData,
    !!appState.envData,        // "Environment" step uses same gate as location
    !!appState.stressScores,
    !!appState.bioenergyScore,
    !!appState.bioenergyScore,
  ];
  const steps = document.querySelectorAll('.tc-wf-step');
  steps.forEach((s, i) => {
    const isDone   = !!done[i];
    const isActive = !isDone && (i === 0 || !!done[i - 1]);
    s.classList.toggle('complete', isDone);
    s.classList.toggle('active', isActive);
  });
}

// Make each pipeline diagram step clickable → scroll to that section
function _wfWirePipeline() {
  const targets = [
    'az-step1',
    'az-step2',
    'az-step2',
    'stressTabSection',
    'bioTabSection',
    'reportTabSection',
  ];
  document.querySelectorAll('.tc-wf-step').forEach((s, i) => {
    s.style.cursor = 'pointer';
    s.title = 'Go to Step ' + (i + 1);
    s.addEventListener('click', () => _wfScrollTo(targets[i]));
  });
}

function _wfScrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const content = document.querySelector('.content');
  if (content) {
    const top = el.getBoundingClientRect().top - content.getBoundingClientRect().top - 70;
    content.scrollBy({ top, behavior: 'smooth' });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Sample Analysis ───────────────────────────────────────────────────────────
// Runs full pipeline with Switchgrass + Austin, TX using live API data

async function wfRunSample() {
  const btn = document.getElementById('wfSampleBtn');
  const setBtn = (text, disabled) => {
    if (btn) { btn.textContent = text; btn.disabled = !!disabled; }
  };

  setBtn('⏳ Fetching live data for Austin, TX…', true);

  try {
    // Step 1 — Switchgrass: top Texas bioenergy crop, well-validated profile
    if (typeof analyzeSetPlant === 'function') analyzeSetPlant('switchgrass');

    // Step 2 — Austin, TX coordinates
    if (typeof appState !== 'undefined') {
      appState.locationMethod = 'city';
      appState.locationLabel  = 'Austin, TX';
      appState.lat = 30.2672;
      appState.lon = -97.7431;
    }
    if (typeof _locSetStatus === 'function') {
      _locSetStatus('ok', '📍 Austin, TX — sample analysis');
    }
    wfUpdateSteps();

    // Steps 3–6 — fetch live environment data; pipeline auto-runs via _locTriggerScoring
    if (typeof locFetchEnvironment === 'function') {
      await locFetchEnvironment(30.2672, -97.7431);
    }

    wfUpdateSteps();

    // Scroll to stress results after short delay (let DOM update)
    setTimeout(() => _wfScrollTo('stressTabSection'), 500);

  } catch (e) {
    console.error('[TexasClimate] Sample analysis failed:', e);
    setBtn('Sample run failed — click to retry', false);
    return;
  }

  setBtn('▶ Run Sample TexasClimate Analysis', false);
}
