'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   TexasClimate — Scenario ("what if") mode
   ──────────────────────────────────────────────────────────────────────────────
   Re-runs the full pipeline against a HAND-MODIFIED environment. Two rules make
   this safe rather than misleading:

     1. A scenario result is never mistaken for an observation. It is stamped
        EXPERIMENTAL SCENARIO everywhere, and the Evidence Confidence engine
        penalises it explicitly (see the isScenario branch there).
     2. The measured baseline is never overwritten. Leaving the scenario always
        restores the real analysis exactly, because the original envData object
        is kept aside rather than mutated.
   ════════════════════════════════════════════════════════════════════════════ */

let _tcScenarioBaseline = null;

function scenarioInit(containerId) {
  const el = document.getElementById(containerId || 'scenarioSection');
  if (!el) return;
  el.innerHTML = `
    <div class="scn-card">
      <div class="scn-head">
        <h3 class="scn-title">Scenario — what if conditions changed?</h3>
        <p class="scn-lede">Adjust the measured environment and re-run the whole pipeline. Results are marked
          <strong>EXPERIMENTAL SCENARIO</strong> and carry lower Evidence Confidence than the observed analysis,
          because a modified input is no longer a measurement.</p>
      </div>
      <div class="scn-controls">
        <div class="scn-field">
          <label for="scnTemp">Temperature change</label>
          <input type="range" id="scnTemp" min="-5" max="8" step="0.5" value="0"
                 aria-describedby="scnTempVal" oninput="scenarioPreview()">
          <output id="scnTempVal" class="scn-out">0 °C</output>
        </div>
        <div class="scn-field">
          <label for="scnPrecip">Precipitation change</label>
          <input type="range" id="scnPrecip" min="-80" max="80" step="5" value="0"
                 aria-describedby="scnPrecipVal" oninput="scenarioPreview()">
          <output id="scnPrecipVal" class="scn-out">0%</output>
        </div>
        <div class="scn-field">
          <label for="scnEC">Measured soil EC (optional)</label>
          <input type="number" id="scnEC" min="0" max="30" step="0.1" placeholder="dS/m — leave blank if unknown"
                 class="scn-num" oninput="scenarioPreview()">
          <span class="scn-hint">Supplying a real measurement moves salinity from UNKNOWN to USER INPUT.</span>
        </div>
      </div>
      <div class="scn-actions">
        <button class="btn-sm scn-run" onclick="scenarioApply()">Run scenario →</button>
        <button class="btn-sm scn-reset" onclick="scenarioReset()">Restore measured conditions</button>
      </div>
      <div id="scnStatus" class="scn-status" role="status" aria-live="polite"></div>
    </div>`;
  scenarioPreview();
}

function _scnRead() {
  return {
    tempDeltaC: parseFloat(document.getElementById('scnTemp')?.value || 0),
    precipPct:  parseFloat(document.getElementById('scnPrecip')?.value || 0),
    soilEC:     document.getElementById('scnEC')?.value !== '' && document.getElementById('scnEC')?.value != null
                  ? parseFloat(document.getElementById('scnEC').value) : null,
  };
}

function scenarioPreview() {
  const s = _scnRead();
  const t = document.getElementById('scnTempVal');
  const p = document.getElementById('scnPrecipVal');
  if (t) t.textContent = `${s.tempDeltaC > 0 ? '+' : ''}${s.tempDeltaC} °C`;
  if (p) p.textContent = `${s.precipPct > 0 ? '+' : ''}${s.precipPct}%`;
}

function scenarioApply() {
  const status = document.getElementById('scnStatus');
  if (!appState.envData) {
    if (status) status.innerHTML = '<span class="scn-err">Measure a location in Step 2 first — a scenario modifies real data, it does not invent it.</span>';
    return;
  }
  const s = _scnRead();
  if (!s.tempDeltaC && !s.precipPct && s.soilEC == null) {
    if (status) status.innerHTML = '<span class="scn-warn">Nothing changed. Move a slider or enter a soil EC value.</span>';
    return;
  }
  // Keep the measured baseline so it can always be restored exactly.
  //
  // Guard against a stale baseline: if the user fetched a NEW location while a
  // scenario was active, the stored baseline describes the previous location,
  // and "restore measured conditions" would have quietly swapped in another
  // city's weather under the current label. Re-baseline whenever the underlying
  // measurement changes.
  const live = appState.envData;
  const baselineMatches = _tcScenarioBaseline &&
    _tcScenarioBaseline.lat === live.lat &&
    _tcScenarioBaseline.lon === live.lon &&
    (!live.isScenario || _tcScenarioBaseline.fetchTime === live.fetchTime);
  if (!_tcScenarioBaseline || (!live.isScenario && !baselineMatches)) {
    _tcScenarioBaseline = live;
  }

  const modified = applyScenario(_tcScenarioBaseline, s);
  appState.envData = modified;
  _tcRerunPipeline();

  if (status) {
    status.innerHTML = `<span class="scn-active">${tcStatusBadge('EXPERIMENTAL')}
      <strong>Scenario active:</strong> ${escapeHtml(modified.scenarioDesc.join(', '))}.
      Every score below now describes this hypothetical, not the measured environment.</span>`;
  }
  document.body.classList.add('tc-scenario-active');
  if (typeof announce === 'function') announce('Experimental scenario applied. All results below are hypothetical.');
}

/* Called by the fetch layer whenever a fresh environment lands, so a scenario
   can never straddle two locations. */
function scenarioInvalidateBaseline() {
  _tcScenarioBaseline = null;
  document.body.classList.remove('tc-scenario-active');
  const status = document.getElementById('scnStatus');
  if (status) status.innerHTML = '';
  ['scnTemp','scnPrecip'].forEach(id => { const e = document.getElementById(id); if (e) e.value = 0; });
  const ec = document.getElementById('scnEC'); if (ec) ec.value = '';
  if (typeof scenarioPreview === 'function') scenarioPreview();
}

function scenarioReset() {
  const status = document.getElementById('scnStatus');
  if (!_tcScenarioBaseline) {
    if (status) status.innerHTML = '<span class="scn-warn">No scenario is active — these are the measured conditions.</span>';
    return;
  }
  appState.envData = _tcScenarioBaseline;
  _tcScenarioBaseline = null;
  ['scnTemp','scnPrecip'].forEach(id => { const e = document.getElementById(id); if (e) e.value = 0; });
  const ec = document.getElementById('scnEC'); if (ec) ec.value = '';
  scenarioPreview();
  _tcRerunPipeline();
  document.body.classList.remove('tc-scenario-active');
  if (status) status.innerHTML = '<span class="scn-ok">Restored. All results below describe the measured environment again.</span>';
  if (typeof announce === 'function') announce('Scenario cleared. Showing measured conditions.');
}

/* One place that re-runs the chain, so a scenario and a fresh fetch always
   traverse the identical sequence of renderers. */
function _tcRerunPipeline() {
  if (typeof locRenderProfile      === 'function' && appState.envData) locRenderProfile(appState.envData);
  if (typeof renderStressProfile   === 'function') renderStressProfile();
  if (typeof renderPlantCityComparison === 'function') renderPlantCityComparison();
  // renderReport was missing here: appState updated but the report DOM did not,
  // so the printable artefact silently kept the pre-scenario numbers while the
  // rest of the page was stamped EXPERIMENTAL SCENARIO. renderStressProfile
  // chains into it, but only when the stress section is present in the DOM, so
  // call it explicitly rather than relying on that.
  if (typeof renderReport === 'function') renderReport();
}
