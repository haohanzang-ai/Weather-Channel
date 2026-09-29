'use strict';

// ── Pathway compatibility profiles ────────────────────────────────────────────
// base (0-100): compatibility before stress modifiers
// stressSensitivity: how much fermentation/phenolic risk degrades the pathway
// chemTypes: which plant chem profiles are NOT well-suited to this pathway
// Four conversion routes, separated by PROCESS CLASS. They were previously
// described loosely enough that biogas read as a gasification product; it is
// not. Anaerobic digestion is biological (microbes → CH4 + CO2). Gasification
// is thermochemical partial oxidation (→ syngas, CO + H2). Pyrolysis is
// thermochemical in the absence of oxygen (→ bio-oil, biochar, syngas).
// Fermentation is biological, after chemical/enzymatic depolymerisation.
//
// EVERY NUMBER BELOW IS AN AUTHOR-CHOSEN HEURISTIC. The `baseByChem` values
// rank chemistry classes against each pathway in an order supported by the
// general literature (lignin-rich feedstocks suit thermochemical routes; wet
// feedstocks suit digestion), but they are not measured compatibilities and
// have never been validated against conversion trials.
const BIOENERGY_PATHWAYS = {
  cellulosic_ethanol: {
    name: 'Cellulosic Ethanol',
    icon: '🧪',
    processClass: 'Biochemical — pretreatment, enzymatic hydrolysis, then microbial fermentation',
    desc: 'Cell-wall polysaccharides are broken down to sugars, then fermented to ethanol. Lignin is the principal obstacle, which is why a pretreatment step is required.',
    maturity: 'Early commercial',
    stressSensitivity: 0.65,
    badChemTypes: ['cactus-mucilage','succulent-inulin','woody-resin','woody-aromatic'],
    baseByChem: { 'grass-cellulosic':88, 'fiber-cellulosic':78, 'grass-sucrose':65, 'woody-lignin':45, 'woody-tannin':38, 'woody-aromatic':30, 'woody-resin':28, 'succulent-inulin':42, 'cactus-mucilage':25, 'aquatic-cellulosic':60, 'aquatic-lipid':20, 'unknown':50 },
    source: 'Ranking informed by Mosier et al. (2005) Bioresource Technology 96(6):673–686. Values author-chosen.',
  },
  anaerobic_digestion: {
    name: 'Biogas (Anaerobic Digestion)',
    icon: '♻️',
    processClass: 'Biological — microbial digestion without oxygen, yielding methane-rich biogas',
    desc: 'Wet organic matter is digested by microbial consortia to a methane and carbon dioxide mixture. This is a biological process and is NOT a form of gasification; the two were previously conflated here.',
    maturity: 'Mature commercial',
    stressSensitivity: 0.25,
    badChemTypes: [],
    baseByChem: { 'grass-cellulosic':72, 'fiber-cellulosic':65, 'grass-sucrose':80, 'woody-lignin':48, 'woody-tannin':45, 'woody-aromatic':40, 'woody-resin':38, 'succulent-inulin':75, 'cactus-mucilage':70, 'aquatic-cellulosic':88, 'aquatic-lipid':82, 'unknown':58 },
    source: 'Ranking informed by general anaerobic digestion literature (wet, low-lignin feedstocks favoured). Values author-chosen.',
  },
  pyrolysis: {
    name: 'Pyrolysis → Bio-oil / Biochar',
    icon: '🔥',
    processClass: 'Thermochemical — heating without oxygen, yielding bio-oil, biochar and syngas',
    desc: 'Biomass is heated to roughly 400–700 °C in the absence of oxygen. Lignin-rich feedstocks perform well here precisely because lignin is not a barrier to a thermal process.',
    maturity: 'Mature commercial',
    stressSensitivity: 0.12,
    badChemTypes: [],
    baseByChem: { 'grass-cellulosic':72, 'fiber-cellulosic':70, 'grass-sucrose':65, 'woody-lignin':88, 'woody-tannin':85, 'woody-aromatic':82, 'woody-resin':78, 'succulent-inulin':68, 'cactus-mucilage':58, 'aquatic-cellulosic':55, 'aquatic-lipid':60, 'unknown':65 },
    source: 'Ranking informed by Bridgwater (2012) Biomass & Bioenergy 38:68–94. Values author-chosen.',
  },
  combustion: {
    name: 'Direct Combustion / Pellets',
    icon: '🔆',
    processClass: 'Thermochemical — full oxidation for heat and power',
    desc: 'Dried biomass is burned directly or densified into pellets. Moisture content and ash dominate performance, which is why wet and succulent feedstocks rank poorly.',
    maturity: 'Mature commercial',
    stressSensitivity: 0.08,
    badChemTypes: ['aquatic-cellulosic','aquatic-lipid','cactus-mucilage'],
    baseByChem: { 'grass-cellulosic':75, 'fiber-cellulosic':72, 'grass-sucrose':60, 'woody-lignin':88, 'woody-tannin':85, 'woody-aromatic':80, 'woody-resin':78, 'succulent-inulin':55, 'cactus-mucilage':30, 'aquatic-cellulosic':35, 'aquatic-lipid':45, 'unknown':65 },
    source: 'Ranking informed by general solid-biomass combustion literature. Values author-chosen.',
  },
};

// ── Environmental scores ──────────────────────────────────────────────────────
// This function is now a THIN ADAPTER. All arithmetic lives in js/tolerance-model.js
// as pure, tested functions; this layer only shapes app state into model inputs
// and the model output into something the renderers can display. Keeping the
// maths out of the UI file is what stops a presentation change from silently
// moving a scientific result — see tests/test-models.js for the pinned fixtures.
// `stress` is accepted for call-site symmetry with the rest of the pipeline but
// is not read: every term is recomputed here from envData through the model
// layer, so this function cannot silently inherit a stale stress object.
function agScoreCompute(_stress, plant, envData) {
  if (!plant || !envData) return null;
  const profile = (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES[plant.key])
    || (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES._default) || {};

  // Build model terms from live data. Temperature is normalised to °C once,
  // here, so the models never have to care about the user's display units.
  const isF = envData.tSuffix === '°F';
  const tempC = envData.current?.temp != null
    ? (isF ? fToC(envData.current.temp) : envData.current.temp) : null;
  const vpdKPa = envData.hourlyVPD != null
    ? envData.hourlyVPD
    : computeVPD(tempC, envData.current?.humidity ?? null);

  const terms = {
    heat:  heatStressTerm(tempC, profile),
    water: waterDeficitProxyTerm(envData.archive30?.deficit ?? null, profile),
    vpd:   vpdTerm(vpdKPa, profile),
    soil:  soilStressTerm(envData.hourlySoil ?? null, profile),
  };

  const tolerance    = computeToleranceMatch(terms);
  const productivity = computeProductivityProxy(terms);
  const inputs       = computeInputCompleteness(envData);

  const missing = [];
  for (const [k, t] of Object.entries(terms)) {
    if (t.score == null) missing.push({ key: k, label: t.note || k, status: TC_STATUS.UNKNOWN });
  }

  // Water supply vs. requirement — a separate question from the deficit proxy:
  // "did enough rain fall for this species?" rather than "how dry was the air?".
  let waterSupply = null, waterSupplySrc = null, waterSupplyStatus = TC_STATUS.UNKNOWN;
  if (envData.archive30?.precipSum != null && profile.waterReq30mm != null) {
    const precip = envData.archive30.precipSum;
    const req    = profile.waterReq30mm;
    if (req >= 999) {
      waterSupply = null;
      waterSupplyStatus = TC_STATUS.UNKNOWN;
      waterSupplySrc = 'This species requires standing water. Rainfall totals do not describe its water supply, so this is left UNKNOWN rather than scored.';
    } else {
      const ratio = precip / req;
      if (ratio >= 1.5)      waterSupply = 95;
      else if (ratio >= 1.0) waterSupply = Math.round(70 + (ratio - 1.0) * 50);
      else if (ratio >= 0.5) waterSupply = Math.round(35 + (ratio - 0.5) * 70);
      else                   waterSupply = Math.round(ratio * 70);
      waterSupply = Math.min(100, Math.max(0, waterSupply));
      waterSupplyStatus = TC_STATUS.DERIVED;
      waterSupplySrc = `${precip} mm fell over ${envData.archive30.days} days against a literature minimum of ${req} mm/30 d for this species (ratio ${ratio.toFixed(2)}). Rainfall only — irrigation and soil storage are not counted.`;
    }
  } else {
    missing.push({ key: 'precip', label: '30-day precipitation total', status: TC_STATUS.UNKNOWN });
  }

  // Texas heat/drought envelope — a property of the SPECIES, not of today, and
  // deliberately named that way. It is a monotone transform of the species' own
  // heat threshold against anchors chosen for Texas conditions: it answers "how
  // much heat does this species tolerate, relative to what a Texas summer
  // demands", NOT "does this species suit Texas". A desert succulent scores
  // highest here regardless of anything else about the site.
  const lo = TC_ENV.texasEnvelopeLowF.value, hi = TC_ENV.texasEnvelopeHighF.value;
  const heatMatch    = profile.heatStressF != null
    ? Math.round(Math.max(0, Math.min(100, (profile.heatStressF - lo) / (hi - lo) * 100))) : null;
  const droughtMatch = profile.droughtScore ?? null;
  const envelopeMatch = (heatMatch != null && droughtMatch != null)
    ? Math.round(heatMatch * 0.5 + droughtMatch * 0.5) : null;

  return {
    // primary results
    tolerance, productivity, inputs,
    toleranceScore:    tolerance.score,
    productivityScore: productivity.score,
    waterSupply, waterSupplySrc, waterSupplyStatus,
    heatMatch, droughtMatch, envelopeMatch,
    envelopeSrc: profile.heatStressF != null
      ? `Species heat threshold ${profile.heatStressF} °F scaled between ${TC_ENV.texasEnvelopeLowF.value} °F and the Texas record high of ${TC_ENV.texasEnvelopeHighF.value} °F, plus drought tolerance ${profile.droughtScore}/100 — both species-level literature estimates. Describes the species, not this location or today.`
      : 'No species profile available.',
    envelopeStatus: TC_STATUS.LITERATURE,
    inputCompleteness: inputs.score,
    terms, missing,
    envBenefit: profile.envBenefit ?? null,
    envBenefitSrc: 'Literature-derived co-benefit rating for this species (native status, perennial root system, input requirements). A species-level property, not a site measurement.',
    profile,
  };
}

// ── Pathway analysis ──────────────────────────────────────────────────────────
function pathwayAnalysis(plant, stress, chemRisk) {
  if (!plant) return [];
  const profile = (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES[plant.key])
    || (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES._default) || { chem:'unknown' };
  const chemType = profile.chem || 'unknown';

  return Object.entries(BIOENERGY_PATHWAYS).map(([key, pw]) => {
    let base = pw.baseByChem[chemType] ?? pw.baseByChem.unknown ?? 50;

    // stress penalty: weighted by pathway sensitivity to stress chemistry
    let stressPenalty = 0;
    if (chemRisk) {
      const avgChemScore = (chemRisk.osmolyte.score + chemRisk.fermentation.score) / 2;
      stressPenalty = Math.round(avgChemScore * pw.stressSensitivity);
    }
    if (pw.badChemTypes.includes(chemType)) stressPenalty += 20;

    const final = Math.max(0, Math.min(100, base - stressPenalty));
    const tier  = final >= 70 ? 'Strong' : final >= 45 ? 'Moderate' : 'Weak';
    const tierColor = final >= 70 ? '#5DDBA8' : final >= 45 ? '#F5A623' : '#E87A7A';

    return { key, name: pw.name, icon: pw.icon, desc: pw.desc, maturity: pw.maturity,
             processClass: pw.processClass, score: final, tier, tierColor, stressPenalty,
             source: pw.source, chemType, status: TC_STATUS.EXPERIMENTAL };
  }).sort((a, b) => b.score - a.score);
}

// ── Bioenergy Suitability Index ───────────────────────────────────────────────
// RENAMED from "Bioenergy Confidence Score". That name conflated two different
// things: how well a plant/location combination scores, and how much evidence
// stands behind that score. They are now separate outputs. A location can score
// 85 with LOW evidence confidence; both numbers matter and neither substitutes
// for the other.
function bioScoreCompute(ag, chemRisk, pathways) {
  if (!ag) return null;

  // NOTE ON DOUBLE COUNTING, stated because it is a real weakness of this index:
  // chemSafety is derived from chemRisk, and the conversion sub-score is the top
  // pathway score, which pathwayAnalysis computes as (base - chemistry penalty).
  // Both therefore move with the same underlying heuristic. Together they carry
  // 30% of the index, so roughly a third of it is two views of one uncalibrated
  // estimate rather than two independent lines of evidence. This is surfaced on
  // the suitability model card rather than left for a reader to discover.
  const chemSafety = chemRisk
    ? Math.round(100 - (chemRisk.osmolyte.score + chemRisk.saponin.score +
                        chemRisk.phenolic.score + chemRisk.fermentation.score) / 4)
    : null;

  const index = computeSuitabilityIndex({
    tolerance:    ag.toleranceScore,
    productivity: ag.productivityScore,
    water:        ag.waterSupply,
    chemSafety,
    conversion:   pathways && pathways.length ? pathways[0].score : null,
    envBenefit:   ag.envBenefit,
    inputs:       ag.inputCompleteness,
  });

  return {
    total: index.score,
    index,
    bestPathway: pathways && pathways.length ? pathways[0].name : null,
    note: 'A relative ranking aid for comparing plant and location combinations under one consistent set of assumptions. Not a probability, not a yield forecast, not a commercial viability assessment.',
  };
}

// ── "WHY?" breakdown renderer ─────────────────────────────────────────────────
// Generated from the SAME object that produced the number, so the explanation
// and the result cannot drift apart. Every row shows the measured input, its
// unit, the reference it was compared against, the weight, and the points.
function renderWhyPanel(id, result, opts) {
  opts = opts || {};
  if (!result || result.score == null) {
    return `<div class="tc-why" id="${id}"><div class="tc-why-empty">Not enough data to compute this score, so no breakdown exists. Nothing was assumed in place of the missing inputs.</div></div>`;
  }
  const isStress = opts.kind === 'stress';
  // data-label on every cell lets the same markup present as a table in a wide
  // container and as stacked label/value pairs in a narrow one (see the
  // @container rule in evidence.css). Without this, the weight and points
  // columns — the whole reason the panel exists — sat off-screen behind a
  // scrollbar inside the narrow score cards.
  const rows = result.contributors.map(c => `
    <tr>
      <th scope="row" class="tc-why-term">${escapeHtml(c.label)}</th>
      <td class="tc-why-val" data-label="Measured">${c.value != null ? escapeHtml(String(c.value)) + ' ' + escapeHtml(c.unit || '') : '<span class="tc-unknown">UNKNOWN</span>'}</td>
      <td class="tc-why-ref" data-label="Compared against">${c.reference ? escapeHtml(c.reference) : '—'}</td>
      <td class="tc-why-wt" data-label="Weight">${c.nominalWeight != null ? Math.round(c.nominalWeight*100)+'%' : '—'}${
        c.effectiveWeight != null && Math.abs(c.effectiveWeight - c.nominalWeight) > 0.001
          ? `<span class="tc-why-renorm" title="Renormalised because another term was unavailable">&rarr;${Math.round(c.effectiveWeight*100)}%</span>` : ''}</td>
      <td class="tc-why-contrib ${c.contribution < 0 ? 'neg' : 'pos'}" data-label="Points">${c.contribution > 0 ? '+' : ''}${c.contribution}</td>
      <td class="tc-why-status" data-label="Source type">${typeof tcStatusBadge === 'function' ? tcStatusBadge(c.status) : escapeHtml(c.status || '')}</td>
    </tr>`).join('');

  const model = result.model || {};
  return `
    <details class="tc-why" id="${id}">
      <summary class="tc-why-summary"><span class="tc-why-q">WHY?</span> Show how this number was calculated</summary>
      <div class="tc-why-body">
        <table class="tc-why-table">
          <caption class="sr-only">Contribution of each input to the ${escapeHtml(opts.title || 'score')}</caption>
          <thead><tr><th scope="col">Input</th><th scope="col">Measured</th><th scope="col">Compared against</th><th scope="col">Weight</th><th scope="col">Points</th><th scope="col">Source type</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr>
            <th scope="row" colspan="4">${isStress ? 'Total stress' : 'Starting from 100, after contributions'}</th>
            <td class="tc-why-total">${result.score}</td><td></td>
          </tr></tfoot>
        </table>
        ${result.renormalised ? `<p class="tc-why-renorm-note"><strong>Weights were renormalised.</strong> ${escapeHtml(result.note)} Absent inputs are dropped, never scored as zero stress — treating a missing measurement as "no problem" would inflate the score exactly where we know least.</p>` : ''}
        <p class="tc-why-model">
          Model: <strong>${escapeHtml(model.name || '—')} v${escapeHtml(model.version || '—')}</strong>
          ${typeof tcStatusBadge === 'function' ? tcStatusBadge(model.status || 'EXPERIMENTAL') : ''}
          <a class="tc-why-card-link" href="#" onclick="showPage('science');setTimeout(()=>document.getElementById('sc-models')?.scrollIntoView({behavior:'smooth'}),200);return false;">Read the model card →</a>
        </p>
      </div>
    </details>`;
}

// ── DOM Renderers ─────────────────────────────────────────────────────────────

function renderAgScore() {
  const el = document.getElementById('agScoreSection');
  if (!el) return;

  const plant = appState.plant, envData = appState.envData, stress = appState.stressScores;
  if (!plant || !envData || !stress) {
    el.innerHTML = '<div class="score-needs-data">Complete Steps 1 and 2 first.</div>';
    return;
  }
  const ag = agScoreCompute(stress, plant, envData);
  if (!ag) { el.innerHTML = '<div class="score-needs-data">Unable to compute scores.</div>'; return; }
  appState.agricultureScore = ag;

  // Chemistry must exist BEFORE pathways: pathwayAnalysis subtracts a stress
  // penalty derived from it, so running with chemRisk == null silently removes
  // that penalty, raising pathway scores, the conversion sub-score and the whole
  // Suitability Index with no indication. This used to depend on
  // renderStressProfile having run first — an ordering dependency across two
  // files. Compute it here if it is absent instead of trusting the caller.
  if (!appState.chemRisk && typeof chemRiskCompute === 'function') {
    appState.chemRisk = chemRiskCompute(stress, plant, envData.current?.uv ?? null);
  }
  const pathways = pathwayAnalysis(plant, stress, appState.chemRisk);
  appState.pathways = pathways;

  // Evidence confidence — computed once here and reused by every card below,
  // so a single result can never show two different confidence levels.
  const ec = evidenceConfidenceCompute(envData, plant, stress, {
    hasSpeciesProfile: typeof PLANT_ENV_PROFILES !== 'undefined' && !!PLANT_ENV_PROFILES[plant.key],
    hasCultivar:       !!appState.cultivar,
    soilECProvided:    envData.userSoilEC != null,
    isScenario:        !!envData.isScenario,
    // How much of the model actually ran, and how good the downstream evidence
    // is — so the confidence levels move with the analysis instead of sitting
    // at fixed values that read as boilerplate.
    droppedTerms:      ag.tolerance?.dropped?.length ?? 0,
    geneRecordCount:   typeof atlasGeneCountFor === 'function' ? atlasGeneCountFor(plant.key) : null,
    topGeneTier:       typeof atlasTopTierFor   === 'function' ? atlasTopTierFor(plant.key)   : null,
    chemInputsMissing: !(envData.current?.uv != null) || envData.archive30?.deficit == null,
  });
  appState.evidenceConfidence = ec;

  const _gauge = (val) => {
    if (val == null) return `<div class="ag-gauge ag-gauge-unknown"></div><span class="score-na">UNKNOWN</span>`;
    const b = tcBand(val);
    return `<div class="ag-gauge"><div class="ag-gauge-fill" style="width:${val}%;background:${b.color}"></div></div>
            <span class="ag-gauge-val" style="color:${b.color}">${val}<span class="ag-gauge-denom">/100</span></span>
            <span class="ag-gauge-word">${b.word}</span>`;
  };
  // Which layer's confidence a card carries follows one rule, stated here
  // because three cards previously showed different layers under an identical
  // "Evidence Confidence" label with no explanation:
  //   · a composite index we compute      → the tolerance layer
  //   · a direct measurement comparison   → the stress layer
  //   · a species property from literature → no chip (it does not vary by site)
  const _conf = (layer) => {
    const L = ec.layers[layer];
    return `<div class="tc-conf-chip tc-conf-${L.level.toLowerCase()}" tabindex="0"
                 title="${escapeHtml(L.why.join(' '))}">
              <span class="tc-conf-label">Evidence Confidence</span>
              <strong>${L.level}</strong></div>`;
  };

  el.innerHTML = `
    <div class="tc-split-note">
      <strong>Two different questions, two different answers.</strong> The score says how favourable conditions look.
      Evidence Confidence says how much should be read into that. They move independently — a high score with LOW
      confidence means "this ranks well under our assumptions, and our assumptions are weakly supported".
    </div>

    <div class="ag-scores-grid">

      <div class="ag-score-card">
        <div class="ag-score-title">Environmental Tolerance Match</div>
        ${_gauge(ag.toleranceScore)}
        <div class="ag-score-sub">How far inside this species' documented tolerance envelope current conditions sit. Not a survival probability.</div>
        ${_conf('tolerance')}
        ${renderWhyPanel('why-tolerance', ag.tolerance, { title: 'Environmental Tolerance Match' })}
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Productivity Stress Proxy</div>
        ${_gauge(ag.productivityScore)}
        <div class="ag-score-sub">Growth-limiting stress right now. A proxy for conditions, not a biomass measurement or yield forecast.</div>
        ${_conf('tolerance')}
        ${renderWhyPanel('why-productivity', ag.productivity, { title: 'Productivity Stress Proxy' })}
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Water Supply vs. Requirement</div>
        ${_gauge(ag.waterSupply)}
        <div class="ag-score-sub">Rainfall over the window against this species' documented minimum. Excludes irrigation and soil storage.</div>
        <div class="score-src">${escapeHtml(ag.waterSupplySrc || 'No 30-day precipitation total available.')} ${tcStatusBadge(ag.waterSupplyStatus)}</div>
        ${_conf('stress')}
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Species Heat &amp; Drought Envelope</div>
        ${_gauge(ag.envelopeMatch)}
        <div class="ag-score-sub">A property of the <em>species</em>, not of this site: heat tolerance ${ag.heatMatch ?? '—'}/100 against Texas summer anchors, and drought tolerance ${ag.droughtMatch ?? '—'}/100. It does not change with today's weather, and a desert succulent scores highest here wherever you are.</div>
        <div class="score-src">${escapeHtml(ag.envelopeSrc)} ${tcStatusBadge(ag.envelopeStatus)}</div>
      </div>

      <div class="ag-score-card">
        <div class="ag-score-title">Input Completeness</div>
        ${_gauge(ag.inputCompleteness)}
        <div class="ag-score-sub">Which data providers responded. Measures availability, <em>not</em> accuracy — this was previously mislabelled "Data Quality".</div>
        <div class="score-src">${ag.inputs.present.map(p=>escapeHtml(p.label)+' ('+p.weight+')').join(' · ')}
          ${ag.inputs.absent.length ? '<br><span class="score-na">Absent: '+ag.inputs.absent.map(x=>escapeHtml(x.label)).join(', ')+'</span>' : ''}
          ${tcStatusBadge('DERIVED')}</div>
      </div>

    </div>

    ${ag.missing.length ? `<div class="stress-missing-bar"><strong>Left UNKNOWN rather than assumed:</strong>
      ${ag.missing.map(m=>`<span class="score-missing-item">${tcStatusBadge('UNKNOWN')} ${escapeHtml(m.label)}</span>`).join('')}</div>` : ''}

    <h3 class="sub-section-title">Bioenergy Pathway Compatibility
      <span class="sub-section-tag">${tcStatusBadge('EXPERIMENTAL')} heuristic — not validated</span></h3>
    <p class="sub-section-lede">These scores rank conversion routes by the plant's general chemistry class and its
      current stress. They are heuristics: no biomass from this plant has been assayed, and no conversion has been performed.</p>
    <div class="pathway-grid">
      ${pathways.map(p => `
        <div class="pathway-card">
          <div class="pathway-card-head">
            <span class="pathway-icon" aria-hidden="true">${p.icon}</span>
            <div>
              <div class="pathway-name">${escapeHtml(p.name)}</div>
              <span class="pathway-tier" style="color:${p.tierColor}">${escapeHtml(p.tier)}</span>
              <span class="pathway-maturity">${escapeHtml(p.maturity)}</span>
            </div>
            <div class="pathway-score" style="color:${p.tierColor}">${p.score}</div>
          </div>
          <div class="pathway-bar-wrap"><div class="pathway-bar-fill" style="width:${p.score}%;background:${p.tierColor}"></div></div>
          <div class="pathway-process"><strong>Process class:</strong> ${escapeHtml(p.processClass)}</div>
          <div class="pathway-desc">${escapeHtml(p.desc)}</div>
          <div class="score-src">${escapeHtml(p.source)} ${tcStatusBadge('EXPERIMENTAL')}</div>
          ${p.stressPenalty > 0 ? `<div class="pathway-penalty">Stress-chemistry penalty: −${p.stressPenalty} points</div>` : ''}
        </div>`).join('')}
    </div>
  `;

  renderBioScore();
}

function renderBioScore() {
  const el = document.getElementById('bioScoreSection');
  if (!el) return;

  const ag = appState.agricultureScore;
  if (!ag) { el.innerHTML = '<div class="score-needs-data">Environmental scores not yet computed.</div>'; return; }

  const bioScore = bioScoreCompute(ag, appState.chemRisk, appState.pathways);
  if (!bioScore) return;
  appState.bioenergyScore = bioScore;

  const ec = appState.evidenceConfidence;
  const total = bioScore.total;
  const band  = tcBand(total);
  const label = total == null ? 'Incomplete data'
              : total >= 75 ? 'Ranks well under our assumptions'
              : total >= 55 ? 'Ranks moderately under our assumptions'
              : total >= 35 ? 'Ranks marginally under our assumptions'
              : 'Ranks poorly under our assumptions';
  const fuelConf = ec ? ec.layers.bioenergy : null;

  el.innerHTML = `
    <div class="bio-score-hero">
      <div class="bio-score-ring" style="border-color:${band.color}">
        <div class="bio-score-number" style="color:${band.color}">${total ?? '—'}</div>
        <div class="bio-score-denom">/100</div>
      </div>
      <div class="bio-score-hero-right">
        <div class="bio-score-name">Bioenergy Suitability Index</div>
        <div class="bio-score-label" style="color:${band.color}">${escapeHtml(label)}</div>
        <div class="bio-score-plant">${escapeHtml(appState.plant?.name || '')} · ${escapeHtml(appState.locationLabel || 'Location not set')}</div>
        ${fuelConf ? `<div class="tc-conf-chip tc-conf-${fuelConf.level.toLowerCase()} tc-conf-lg">
            <span class="tc-conf-label">Evidence Confidence</span><strong>${fuelConf.level}</strong></div>` : ''}
        <div class="bio-score-note">${escapeHtml(bioScore.note)}</div>
        <div class="bio-score-model">${tcStatusBadge('EXPERIMENTAL')} ${escapeHtml(tcModelStamp(TC_MODELS.suitability))}</div>
      </div>
    </div>

    ${fuelConf ? `
    <div class="tc-conf-explain">
      <div class="tc-conf-explain-head">Why this confidence, and not higher?</div>
      <ul class="tc-conf-reasons">${fuelConf.why.map(w=>`<li>${escapeHtml(w)}</li>`).join('')}</ul>
    </div>` : ''}

    ${renderWhyPanel('why-suitability', bioScore.index, { title: 'Bioenergy Suitability Index' })}

    ${bioScore.index.missing.length ? `<div class="stress-missing-bar"><strong>Sub-scores unavailable:</strong>
      ${bioScore.index.missing.map(m=>`<span class="score-missing-item">${tcStatusBadge('UNKNOWN')} ${escapeHtml(m.label)} (${Math.round(m.weight*100)}% of the model)</span>`).join('')}</div>` : ''}

    ${ec ? renderConfidenceLadder(ec) : ''}
    ${ec ? renderUnknownsPanel(ec) : ''}
  `;

  if (typeof renderReport === 'function') renderReport();
}

// ── Confidence ladder: makes "confidence degrades along the pipeline" visible ──
function renderConfidenceLadder(ec) {
  const steps = [
    ['environment', 'Environment', 'What we measured at your coordinates'],
    ['stress',      'Stress',      'Measurement compared to published species limits'],
    ['tolerance',   'Tolerance',   'Our composite index over those stressors'],
    ['biology',     'Biology',     'Mechanisms associated in the literature'],
    ['bioenergy',   'Bioenergy',   'Inferred consequences for conversion'],
  ];
  return `
    <section class="tc-ladder" aria-label="How evidence confidence changes along the pipeline">
      <h3 class="tc-ladder-title">Evidence confidence along the pipeline</h3>
      <p class="tc-ladder-lede">Confidence can only fall as you move right. A conclusion is never more certain than
        the inputs feeding it, and the last two steps are inference rather than measurement.</p>
      <ol class="tc-ladder-steps">
        ${steps.map(([k,name,desc]) => {
          const L = ec.layers[k];
          return `<li class="tc-ladder-step tc-conf-${L.level.toLowerCase()}">
            <div class="tc-ladder-name">${name}</div>
            <div class="tc-ladder-level"><span class="tc-ladder-dot" aria-hidden="true"></span>${L.level}</div>
            <div class="tc-ladder-desc">${escapeHtml(desc)}</div>
            <details class="tc-ladder-why"><summary>Why?</summary>
              <ul>${L.why.map(w=>`<li>${escapeHtml(w)}</li>`).join('')}</ul></details>
          </li>`;
        }).join('')}
      </ol>
      ${ec.firstDrop ? `
      <p class="tc-ladder-foot tc-ladder-drop">
        Confidence first falls at the <strong>${escapeHtml(ec.firstDrop.label)}</strong> step
        (${ec.firstDrop.from} &rarr; ${ec.firstDrop.to}), because of ${escapeHtml(ec.firstDrop.because)}.
        ${ec.firstDrop.cause === 'ceiling'
          ? 'Better data would not lift this one.'
          : 'This is the step where better evidence would help most.'}
      </p>` : ''}
      <p class="tc-ladder-foot">End to end the chain carries <strong>${ec.overall}</strong> confidence &mdash;
        the weakest layer, not an average. The bioenergy step is capped at LOW by design, so the end-to-end
        figure is always LOW; the informative part is <em>where</em> the ladder drops above. ${escapeHtml(ec.model)}</p>
    </section>`;
}

// ── "What we do not know" + "What would improve this" ─────────────────────────
function renderUnknownsPanel(ec) {
  return `
    <div class="tc-unknown-grid">
      <section class="tc-unknown-panel" aria-label="What we do not know">
        <h3 class="tc-unknown-title">What we do not know</h3>
        ${ec.unknowns.length ? `<ul class="tc-unknown-list">
          ${ec.unknowns.map(u=>`<li><strong>${escapeHtml(u.what)}</strong><span>${escapeHtml(u.why)}</span></li>`).join('')}
        </ul>` : '<p class="tc-unknown-empty">Every input this model uses was available.</p>'}
      </section>
      <section class="tc-improve-panel" aria-label="What data would improve this analysis">
        <h3 class="tc-unknown-title">What would improve this analysis</h3>
        <ul class="tc-improve-list">
          ${ec.improvements.map(i=>`<li>
            <strong>${escapeHtml(i.input)}</strong>
            <span class="tc-improve-gain">${escapeHtml(i.gain)}</span>
            <span class="tc-improve-how">How: ${escapeHtml(i.how)}</span></li>`).join('')}
        </ul>
      </section>
    </div>`;
}

// ── City comparison for Map & Compare ────────────────────────────────────────
function renderPlantCityComparison() {
  const el = document.getElementById('plantCompareContent');
  if (!el) return;

  const plant = appState.plant;
  if (!plant) {
    el.innerHTML = '<div class="score-needs-data">Select a plant in Analyze → Step 1 to compare across Texas cities.</div>';
    return;
  }
  if (typeof WEATHER_DATA === 'undefined' || !Object.keys(WEATHER_DATA).length) {
    el.innerHTML = '<div class="score-needs-data">City weather data not yet loaded. Please wait for the dashboard to load.</div>';
    return;
  }

  const profile = (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES[plant.key])
    || (typeof PLANT_ENV_PROFILES !== 'undefined' && PLANT_ENV_PROFILES._default) || {};

  // Use the unit the city data was actually FETCHED in, not the unit currently
  // selected in settings. WEATHER_DATA is fetched once at load; the settings
  // panel says a unit change applies "after the next refresh". Reading the live
  // setting here meant that toggling to metric without refreshing reinterpreted
  // 95 °F readings as 95 °C — heat stress pinned to 100 for every city and the
  // whole table silently collapsed, with no error and no warning.
  const isFahrenheit = (typeof WEATHER_UNITS_FETCHED !== 'undefined' && WEATHER_UNITS_FETCHED)
    ? WEATHER_UNITS_FETCHED !== 'metric'
    : (typeof getSetting === 'function' && getSetting('units') !== 'metric');
  const displayStale = (typeof WEATHER_UNITS_FETCHED !== 'undefined' && WEATHER_UNITS_FETCHED &&
                        typeof getSetting === 'function' &&
                        WEATHER_UNITS_FETCHED !== getSetting('units'));

  const rows = Object.entries(WEATHER_DATA).map(([cityName, d]) => {
    // Heat stress from current temp
    // A duplicate heat calculation used to sit here, unused — the row below reads
    // terms.heat.score from the model layer. It was a third copy of the same
    // conversion, one edit away from silently disagreeing with the other two.
    const t = d.temp;

    // Same shared model functions used everywhere else, so a city row and a
    // full analysis of the same point cannot disagree.
    const tC  = isFahrenheit ? fToC(t) : t;
    const vpd = computeVPD(tC, d.humidity);
    const terms = {
      heat:  heatStressTerm(tC, profile),
      water: { score: null },              // no 30-day archive per city — UNKNOWN, not zero
      vpd:   vpdTerm(vpd, profile),
      soil:  { score: null },
    };
    const tol  = computeToleranceMatch(terms);
    const prod = computeProductivityProxy(terms);
    const aqiVal = d.aqi;
    const survColor = tcBand(tol.score).color;

    return { cityName, temp: t, heat: terms.heat.score, vpd, vpdScore: terms.vpd.score,
             tolerance: tol.score, productivity: prod.score, aqiVal, survColor };
  }).sort((a, b) => (b.tolerance ?? -1) - (a.tolerance ?? -1));

  el.innerHTML = `
    <div class="plant-compare-header">
      <div class="plant-compare-title">🌿 ${escapeHtml(plant.name)} — Current Conditions Comparison</div>
      ${displayStale ? `<div class="plant-compare-stale">${tcStatusBadge('UNKNOWN')}
        <strong>Unit setting changed since this data was fetched.</strong> These rows are still in the units
        they were retrieved in, so the numbers remain correct. Refresh to re-fetch in your new unit.</div>` : ''}
      <div class="plant-compare-caveat">Current temperature and VPD only. The 30-day water balance and soil moisture are
        <strong>UNKNOWN</strong> for these rows, and the model weights are renormalised over the two available terms rather than
        assuming those stressors are absent. Every city is scored identically, so the ranking is comparable even though each
        individual number rests on two inputs instead of four.</div>
    </div>
    <div class="plant-compare-table-wrap">
      <table class="plant-compare-table">
        <thead>
          <tr>
            <th>City</th>
            <th>Temp</th>
            <th>Heat Stress</th>
            <th>VPD (est.)</th>
            <th>Tolerance Match</th>
            <th>Productivity Proxy</th>
            <th>AQI</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
          <tr>
            <td><strong>${escapeHtml(r.cityName)}</strong></td>
            <td>${r.temp}${isFahrenheit ? '°F' : '°C'}</td>
            <td><span style="color:${r.heat>=70?'#D64545':r.heat>=35?'#F5A623':'#5DDBA8'}">${r.heat}/100</span></td>
            <td>${r.vpd} kPa</td>
            <td><span class="compare-pill" style="background:${r.survColor}22;color:${r.survColor};border:1px solid ${r.survColor}55">${r.tolerance ?? '—'}/100</span></td>
            <td><span style="color:${tcBand(r.productivity).color}">${r.productivity ?? '—'}/100</span></td>
            <td>${r.aqiVal != null ? r.aqiVal : '<span class="score-na">N/A</span>'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="plant-compare-note">
      These are current-conditions indices, not survival or yield predictions. A full single-location analysis adds the
      30-day water balance and soil moisture, which usually moves the numbers substantially. The same formula is applied
      to every city, so the ordering is meaningful even where the absolute values are weakly constrained.
    </div>
  `;
}
