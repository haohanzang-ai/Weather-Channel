'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   TexasClimate — Guided Review
   ──────────────────────────────────────────────────────────────────────────────
   A guided ~100-second run through the REAL pipeline, on REAL live data.

   It deliberately replaces the old 12-step walkthrough, which rendered its own
   mock panels alongside the app. Two problems with that: a feature tour teaches
   the menu rather than the idea, and showing a reviewer a simulation of your
   product when the product itself works is a credibility cost for no gain.

   This drives the actual interface: it selects a plant, fetches live weather,
   and then walks the reader through the same DOM every user sees, highlighting
   one thing at a time. If a step's target is missing — a provider failed, a
   section did not render — the step says so and moves on rather than pretending.

   Timings sum to roughly 100 seconds, leaving headroom inside a three-minute
   video for an intro and a close. It auto-advances but every step is
   interruptible; nothing here is on a rail the presenter cannot leave.
   ════════════════════════════════════════════════════════════════════════════ */

const JUDGE_PATH = [
  {
    id: 'problem',
    seconds: 12,
    page: 'overview',
    target: '.ov-pipeline',
    title: 'The question a weather app cannot answer',
    body: 'A weather app tells you what the weather <em>is</em>. TexasClimate asks what it may <em>mean</em>, biologically, for a bioenergy crop growing in it — and how strong the evidence behind that answer actually is.',
    aside: 'Six steps. Measured on the left, inferred on the right.',
  },
  {
    id: 'measure',
    seconds: 15,
    page: 'analyze',
    target: '#locProfileCard',
    title: 'Step 1 — Live environment, labelled by source',
    body: 'Switchgrass at a real Texas location. Temperature, humidity, vapour pressure deficit, surface soil moisture and a 30-day water balance, fetched now from Open-Meteo and the National Weather Service.',
    aside: 'Every value carries a provenance label. Anything a provider did not return stays UNKNOWN — never filled with a default.',
    run: async () => {
      if (typeof _scanSyncAppState === 'function') _scanSyncAppState('switchgrass');
      if (!appState.envData && typeof locFetchEnvironment === 'function') {
        appState.locationMethod = 'city';
        appState.locationLabel = 'Austin';
        appState.lat = 30.2672; appState.lon = -97.7431;
        await locFetchEnvironment(30.2672, -97.7431);
      }
      if (typeof renderStressProfile === 'function') renderStressProfile();
    },
  },
  {
    id: 'stress',
    seconds: 14,
    page: 'analyze',
    target: '#stressProfileSection',
    title: 'Step 2 — Measurement against published limits',
    body: 'Each measured value is compared to what the literature says this species tolerates. Heat against its stress-onset and critical temperatures; VPD against its stomatal threshold; the 30-day balance as a <em>climate water deficit proxy</em>.',
    aside: 'Named a proxy on purpose: reference ET minus rainfall is atmospheric demand, not the water a plant actually experiences.',
  },
  {
    id: 'why',
    seconds: 20,
    page: 'analyze',
    target: '#why-tolerance',
    title: 'Step 3 — Every number shows its work',
    body: 'The Environmental Tolerance Match, opened up: for each term, the measured input and its unit, the reference it was compared against, the weight applied, and the points it cost.',
    aside: 'This table is generated from the same object that produced the score, so the explanation and the result cannot drift apart.',
    run: () => {
      const d = document.getElementById('why-tolerance');
      if (d) d.setAttribute('open', '');
    },
  },
  {
    id: 'confidence',
    seconds: 16,
    page: 'analyze',
    target: '.tc-ladder',
    title: 'Step 4 — Confidence falls as certainty does',
    body: 'Evidence Confidence is computed separately from the score and reported per layer. It can only decrease downstream, because a conclusion is never more certain than its inputs.',
    aside: 'The bioenergy layer is capped at LOW by design — no tissue is measured, no model is validated. That cap is enforced in code and asserted in tests.',
  },
  {
    id: 'biology',
    seconds: 13,
    page: 'science',
    target: '#sc-atlas',
    title: 'Step 5 — Mechanism, with its evidence tier',
    body: 'The genes and pathways the literature associates with this stress — each carrying how far its evidence sits from switchgrass, on a five-tier ladder.',
    aside: 'Most records are tier 4 or 5: putative orthologs projected from model species. The atlas says so rather than presenting them as measured.',
  },
  {
    id: 'unknown',
    seconds: 14,
    page: 'analyze',
    target: '.tc-unknown-grid',
    title: 'Step 6 — What we do not know, and what would fix it',
    body: 'Cultivar, growth stage and soil salinity are always UNKNOWN unless supplied. Each unknown is paired with the measurement that would resolve it and what that would buy.',
    aside: 'Salinity is never inferred from coastal proximity — distance to the coast is not a measurement of soil EC.',
  },
  {
    id: 'depth',
    seconds: 12,
    page: 'science',
    target: '#sc-models',
    title: 'Under the hood',
    body: 'Six model cards, each stating its assumptions and its validation status. A corrections log of claims this site used to make and no longer does. A claim registry where every load-bearing figure carries its scope and a direct DOI.',
    aside: 'Pure model layer, 479 assertions, zero dependencies. The test suite fails the build if retired wording reappears.',
  },
];

let _jpIndex = 0, _jpTimer = null, _jpRunning = false, _jpStart = 0;

function judgePathTotalSeconds() { return JUDGE_PATH.reduce((s, x) => s + x.seconds, 0); }

async function judgePathStart() {
  if (_jpRunning) { judgePathStop(); return; }
  _jpRunning = true; _jpIndex = 0; _jpStart = Date.now();
  document.body.classList.add('jp-active');
  _jpEnsureShell();
  await _jpShow(0);
}

function judgePathStop() {
  _jpRunning = false;
  clearTimeout(_jpTimer);
  document.body.classList.remove('jp-active');
  document.querySelectorAll('.jp-spot').forEach(el => el.classList.remove('jp-spot'));
  const shell = document.getElementById('jpShell');
  if (shell) shell.remove();
  const btn = document.getElementById('judgeModeBtn');
  if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.textContent = '⚖ Guided Review'; }
  if (typeof announce === 'function') announce('Guided review ended.');
}

function _jpEnsureShell() {
  if (document.getElementById('jpShell')) return;
  const el = document.createElement('div');
  el.id = 'jpShell';
  el.className = 'jp-shell';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', 'Guided review path');
  el.innerHTML = `
    <div class="jp-progress" aria-hidden="true"><div class="jp-progress-fill" id="jpProgress"></div></div>
    <div class="jp-body">
      <div class="jp-step" id="jpStep"></div>
      <h3 class="jp-title" id="jpTitle"></h3>
      <p class="jp-text" id="jpText"></p>
      <p class="jp-aside" id="jpAside"></p>
    </div>
    <div class="jp-controls">
      <button class="jp-btn" onclick="judgePathPrev()" aria-label="Previous step">← Back</button>
      <button class="jp-btn jp-btn-pause" id="jpPause" onclick="judgePathPause()" aria-label="Pause or resume">⏸ Pause</button>
      <button class="jp-btn" onclick="judgePathNext()" aria-label="Next step">Next →</button>
      <button class="jp-btn jp-btn-exit" onclick="judgePathStop()" aria-label="Exit the guided path">Exit</button>
    </div>`;
  document.body.appendChild(el);
  document.addEventListener('keydown', _jpKeys);
}

function _jpKeys(e) {
  if (!_jpRunning) return;
  if (e.key === 'Escape')      { e.preventDefault(); judgePathStop(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); judgePathNext(); }
  else if (e.key === 'ArrowLeft')  { e.preventDefault(); judgePathPrev(); }
  else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); judgePathPause(); }
}

async function _jpShow(i) {
  if (!_jpRunning) return;
  if (i >= JUDGE_PATH.length) return _jpFinish();
  _jpIndex = i;
  const step = JUDGE_PATH[i];
  clearTimeout(_jpTimer);

  if (typeof showPage === 'function' && step.page) showPage(step.page);

  // Let the page paint, then run any setup this step needs.
  await new Promise(r => setTimeout(r, 260));
  if (typeof step.run === 'function') {
    try { await step.run(); } catch (err) { console.warn('[JudgePath] step setup failed:', err); }
  }
  await new Promise(r => setTimeout(r, 220));

  document.querySelectorAll('.jp-spot').forEach(el => el.classList.remove('jp-spot'));
  const target = step.target ? document.querySelector(step.target) : null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (target) {
    target.classList.add('jp-spot');
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  }

  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  set('jpStep',  `Step ${i + 1} of ${JUDGE_PATH.length} · about ${judgePathTotalSeconds()}s total`);
  set('jpTitle', escapeHtml(step.title));
  // A missing target means something did not render — say so instead of
  // narrating over an empty screen.
  set('jpText',  (step.target && !target)
    ? `<em>This section is not on screen right now — most likely a data provider did not respond. The path continues; nothing here is faked to cover a gap.</em>`
    : step.body);
  set('jpAside', escapeHtml(step.aside || ''));

  const prog = document.getElementById('jpProgress');
  if (prog) {
    const done = JUDGE_PATH.slice(0, i).reduce((s, x) => s + x.seconds, 0);
    prog.style.width = Math.round(done / judgePathTotalSeconds() * 100) + '%';
  }
  if (typeof announce === 'function') announce(step.title);

  _jpTimer = setTimeout(() => _jpShow(i + 1), step.seconds * 1000);
}

function _jpFinish() {
  const elapsed = Math.round((Date.now() - _jpStart) / 1000);
  document.querySelectorAll('.jp-spot').forEach(el => el.classList.remove('jp-spot'));
  const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  set('jpStep',  `Complete · ${elapsed}s`);
  set('jpTitle', 'From environment to biology');
  set('jpText',  'TexasClimate turns raw environmental data into an evidence-backed biological explanation in minutes — and tells you, at every step, how much of it to believe.');
  set('jpAside', 'Live APIs · a pure tested model layer · a confidence engine that only ever loses certainty · a published record of its own corrections.');
  const prog = document.getElementById('jpProgress');
  if (prog) prog.style.width = '100%';
  const pause = document.getElementById('jpPause');
  if (pause) pause.style.display = 'none';
  if (typeof announce === 'function') announce('Guided review complete.');
}

function judgePathNext() { if (_jpRunning) _jpShow(Math.min(_jpIndex + 1, JUDGE_PATH.length)); }
function judgePathPrev() { if (_jpRunning) _jpShow(Math.max(_jpIndex - 1, 0)); }

function judgePathPause() {
  const btn = document.getElementById('jpPause');
  if (_jpTimer) {
    clearTimeout(_jpTimer); _jpTimer = null;
    if (btn) btn.textContent = '▶ Resume';
    if (typeof announce === 'function') announce('Paused.');
  } else {
    if (btn) btn.textContent = '⏸ Pause';
    _jpTimer = setTimeout(() => _jpShow(_jpIndex + 1), (JUDGE_PATH[_jpIndex]?.seconds || 10) * 1000);
    if (typeof announce === 'function') announce('Resumed.');
  }
}

/* Replaces the old cosmetic Review Mode toggle. */
function toggleJudgeMode() {
  const btn = document.getElementById('judgeModeBtn');
  if (_jpRunning) { judgePathStop(); return; }
  if (btn) { btn.setAttribute('aria-pressed', 'true'); btn.textContent = '■ Stop Path'; }
  judgePathStart();
}
