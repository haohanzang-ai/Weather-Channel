'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   TexasClimate — Model Cards
   ──────────────────────────────────────────────────────────────────────────────
   One card per model, in the style used for documenting machine-learning
   systems: purpose, inputs, output, assumptions, version, validation status,
   limitations, and — the section that matters most here — what the model is
   NOT for. Written so that a sceptical reviewer can find the weak point
   quickly rather than having to dig for it.
   ════════════════════════════════════════════════════════════════════════════ */

const TC_MODEL_CARDS = [
  {
    model: 'tolerance',
    purpose: 'Express how far inside a species\' documented environmental tolerance envelope the current conditions at a point sit, as one comparable number.',
    inputs: [
      'Air temperature (LIVE, Open-Meteo)',
      'Vapour pressure deficit (LIVE provider field, or DERIVED from temperature and humidity)',
      '30-day reference ET and precipitation (LIVE, Open-Meteo archive)',
      'Surface soil moisture, 0–1 cm (LIVE, Open-Meteo)',
      'Species tolerance thresholds (LITERATURE)',
    ],
    output: 'Environmental Tolerance Match, 0–100. Higher means conditions sit further inside the documented envelope.',
    assumptions: [
      'Stress from each factor rises linearly between the published onset and critical thresholds. Real stress responses are non-linear.',
      'The four stressors combine additively. In reality they interact — high VPD and high temperature compound each other rather than summing.',
      'The species-level threshold is representative of whatever cultivar is actually growing. Within-species variation is often larger than the between-site differences being measured.',
      'Gridded model output at your coordinates approximates conditions at your site.',
    ],
    validation: 'NONE. The weights were chosen by the author to order stressors sensibly. They have never been fitted to, or tested against, observed plant outcomes. There is no training set, no validation set, and no accuracy figure — because no such exercise has been performed.',
    limitations: [
      'Not a survival probability. A score of 30 does not mean a 30% chance of anything.',
      'Reflects conditions at one moment (plus a 30-day water window), not a growing season.',
      'Blind to soil texture, rooting depth, nitrogen, pests, disease, stand age and management.',
      'Absent inputs are dropped and weights renormalised, so a score computed from two terms is not equivalent to one computed from four, even when the numbers match.',
    ],
    intendedUse: 'Comparing places against each other, or species against each other, under one consistent set of assumptions. Teaching how environmental variables relate to plant tolerance limits.',
    notIntendedUse: 'Deciding what to plant on real land. Estimating yield. Replacing a site assessment, a soil test, or an agronomist.',
  },
  {
    model: 'productivity',
    purpose: 'Indicate how much current conditions are likely to be limiting growth, as distinct from threatening persistence.',
    inputs: ['Air temperature (LIVE)', 'VPD (LIVE or DERIVED)', '30-day water deficit proxy (DERIVED from LIVE archive)', 'Species thresholds (LITERATURE)'],
    output: 'Productivity Stress Proxy, 0–100. Higher means fewer growth-limiting stressors at this moment.',
    assumptions: [
      'Biomass accumulation is more sensitive to sub-lethal stress than persistence is — a plant can survive conditions that stop its growth.',
      'Surface soil moisture is excluded deliberately: the 0–1 cm layer responds to the last rain shower and is a poor predictor of season-scale growth.',
    ],
    validation: 'NONE. No biomass measurement has ever been compared against this proxy.',
    limitations: [
      'Contains no biomass measurement of any kind. The name says "proxy" because that is exactly what it is.',
      'Must NOT be subtracted from the Environmental Tolerance Match. The two use different term sets, so their difference has no meaning.',
      'Says nothing about accumulated growth — only about conditions right now.',
    ],
    intendedUse: 'Showing that "can persist here" and "will grow well here" are different questions with different answers.',
    notIntendedUse: 'Forecasting tonnes per hectare. Any economic projection.',
  },
  {
    model: 'suitability',
    purpose: 'Roll the environmental, chemistry and conversion sub-scores into one number so that plant/location combinations can be ranked in a single ordering.',
    inputs: ['Environmental Tolerance Match', 'Productivity Stress Proxy', 'Water supply vs. requirement', 'Stress-chemistry safety (EXPERIMENTAL heuristic)', 'Conversion compatibility (EXPERIMENTAL heuristic)', 'Environmental co-benefit (LITERATURE)', 'Input completeness'],
    output: 'Bioenergy Suitability Index, 0–100. A ranking position under a stated set of assumptions.',
    assumptions: [
      'The seven sub-scores are commensurable enough to be averaged. This is the weakest assumption in the whole app: it places a live temperature measurement and a literature-derived co-benefit rating on the same 0–100 scale.',
      'Weights reflect how much each component should matter. They are author-chosen.',
      'Two of the seven inputs (chemistry safety, conversion compatibility) are themselves uncalibrated heuristics, so roughly 30% of this index rests on heuristics stacked on heuristics.',
      'Worse than that: those two are NOT independent. Chemistry safety is derived from the stress-chemistry heuristic, and conversion compatibility is a pathway score that already has the same chemistry penalty subtracted from it. They move together, so that 30% is two views of one estimate counted twice, not two lines of evidence. Fixing this properly means either dropping one term or making the pathway score independent of chemistry — neither has been done.',
    ],
    validation: 'NONE. No plant/location combination scored by this index has been grown, harvested, or converted.',
    limitations: [
      'Not a probability. A score of 72 is not a 72% chance of anything.',
      'Not a commercial viability assessment. It contains no cost, no logistics, no policy and no market price.',
      'Its Evidence Confidence is structurally capped at LOW, and that cap is part of the result, not a disclaimer attached to it.',
      'Comparisons are only valid between analyses run with the same model version and similar input completeness.',
    ],
    intendedUse: 'Ranking candidate combinations to decide what deserves a closer look. Teaching how a composite index is built and where it becomes fragile.',
    notIntendedUse: 'Siting a real biorefinery. Any investment or land-use decision. Reporting as a scientific result.',
  },
  {
    model: 'confidence',
    purpose: 'Report how much evidence stands behind a result, separately from what the result says.',
    inputs: ['Which providers responded', 'Whether values were measured, modelled or derived', 'Data age', 'Whether the location falls inside the modelled domain', 'Whether species profile, cultivar, growth stage and soil EC are known', 'The inference distance between measurement and claim'],
    output: 'HIGH / MEDIUM / LOW per pipeline layer, each with written reasons, plus an end-to-end level equal to the weakest layer.',
    assumptions: [
      'Confidence cannot exceed the confidence of the inputs feeding it. This is enforced structurally, not by judgement.',
      'Certain ceilings follow from facts that better weather data cannot fix: no tissue is measured, no cultivar is known, no model is validated.',
      'The end-to-end level is the weakest layer, never an average — an average would let a strong measurement layer conceal a weak inference layer.',
    ],
    validation: 'NONE, and validating it would be difficult in principle: there is no ground truth for "how confident should someone have been". The levels are a structured, auditable argument, not a calibrated probability.',
    limitations: [
      'The HIGH/MEDIUM/LOW bands come from penalty thresholds that are themselves author-chosen.',
      'It cannot detect a provider returning plausible but wrong values. It measures whether data arrived and how far the inference runs, not whether the data is correct.',
      'It does not account for a species profile being wrong in the literature.',
    ],
    intendedUse: 'Preventing the central failure mode of tools like this — a confident-looking number with nothing behind it.',
    notIntendedUse: 'Treating LOW as "ignore this" or HIGH as "this is certain". The reasons matter more than the label.',
  },
  {
    model: 'pathway',
    purpose: 'Rank conversion routes by how well a plant\'s general chemistry class suits each process.',
    inputs: ['Plant chemistry class (LITERATURE)', 'Current stress-chemistry risk (EXPERIMENTAL)', 'Per-pathway base compatibility (EXPERIMENTAL, author-chosen)'],
    output: 'Per-pathway compatibility score, 0–100.',
    assumptions: [
      'A plant can be assigned to one of eleven chemistry classes, and that class predicts conversion behaviour. Real feedstock composition varies with cultivar, tissue, harvest timing and storage.',
      'Environmental stress degrades pathway suitability in proportion to a per-pathway sensitivity coefficient. The coefficients are author-chosen and the proportionality is assumed.',
    ],
    validation: 'NONE. No conversion trial informs these numbers.',
    limitations: [
      'No biomass from any plant analysed here has been assayed for composition.',
      'Process economics, feedstock logistics and plant scale are absent entirely.',
      'The four routes are separated by process class — biochemical fermentation, biological anaerobic digestion, and two thermochemical routes. An earlier version conflated biogas with gasification; that was a category error and has been corrected.',
    ],
    intendedUse: 'Teaching why lignin-rich feedstocks suit thermal routes while wet, low-lignin material suits digestion.',
    notIntendedUse: 'Selecting a conversion technology. Any engineering or procurement decision.',
  },
  {
    model: 'chem',
    purpose: 'Flag which stress-related chemistry changes are plausible given the environmental history, as a qualitative risk category.',
    inputs: ['Stress scores (DERIVED)', 'Plant chemistry class and inherent inhibitor risk (LITERATURE)', 'UV index (LIVE)'],
    output: 'Low / Medium / High risk per chemistry axis, with written reasoning.',
    assumptions: [
      'Documented stress-response chemistry generalises from the species where it was studied to the species being analysed.',
      'The direction of each relationship (drought raises osmolytes, UV and heat raise phenolics) is supported; the magnitude and the thresholds between Low, Medium and High are not.',
    ],
    validation: 'NONE. No compound concentration is measured anywhere in this app.',
    limitations: [
      'Weather cannot measure lignin, cellulose, S:G ratio, phenolics, biomass or fermentation performance. Every output here is a hypothesis about what MIGHT be occurring.',
      'An earlier version described proline and glycine betaine as fermentation inhibitors. That was an overgeneralisation and has been withdrawn — accumulation of these compatible solutes under stress is well supported, but a general inhibitory effect on industrial fermentation is not. The documented inhibitors in lignocellulosic processing are pretreatment-derived compounds such as furfural, HMF, acetic acid and phenolics.',
      'Qualitative categories are used precisely because a numeric concentration would imply a measurement that does not exist.',
    ],
    intendedUse: 'Showing that environmental stress plausibly changes feedstock chemistry, and that testing this requires a laboratory.',
    notIntendedUse: 'Any statement about what a specific plant actually contains.',
  },
];

function renderModelCards() {
  const el = document.getElementById('sc-models');
  if (!el) return;
  el.innerHTML = `
    <div class="tab-subsection-header">🧾 Model Cards — every model, its assumptions and its validation status</div>
    <p class="mc-lede">
      Six models produce every number in this app. None of them has been validated against field outcomes, and each
      card says so in its own words rather than in a footnote. If you are here to find the weakest point, the
      "Validation status" and "Not intended for" rows are where to look first.
    </p>
    <div class="mc-grid">
      ${TC_MODEL_CARDS.map(c => {
        const m = TC_MODELS[c.model];
        return `
        <article class="mc-card" aria-labelledby="mc-h-${c.model}">
          <header class="mc-card-head">
            <h3 class="mc-card-title" id="mc-h-${c.model}">${escapeHtml(m.name)}</h3>
            <div class="mc-card-meta">
              <span class="mc-version">v${escapeHtml(m.version)}</span>
              ${tcStatusBadge(m.status)}
              <code class="mc-id">${escapeHtml(m.id)}</code>
            </div>
          </header>
          <dl class="mc-dl">
            <dt>Purpose</dt><dd>${escapeHtml(c.purpose)}</dd>
            <dt>Inputs</dt><dd><ul>${c.inputs.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul></dd>
            <dt>Output</dt><dd>${escapeHtml(c.output)}</dd>
            <dt>Assumptions</dt><dd><ul>${c.assumptions.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul></dd>
            <dt class="mc-dt-warn">Validation status</dt><dd class="mc-dd-warn">${escapeHtml(c.validation)}</dd>
            <dt>Limitations</dt><dd><ul>${c.limitations.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul></dd>
            <dt>Intended for</dt><dd>${escapeHtml(c.intendedUse)}</dd>
            <dt class="mc-dt-warn">Not intended for</dt><dd class="mc-dd-warn">${escapeHtml(c.notIntendedUse)}</dd>
          </dl>
        </article>`;
      }).join('')}
    </div>

    <section class="mc-corrections" aria-labelledby="mc-corr-h">
      <h3 class="mc-corrections-title" id="mc-corr-h">Corrections log — claims this site used to make</h3>
      <p class="mc-lede">Each of these appeared on TexasClimate and was removed or rewritten during a scientific
        audit. They are listed rather than quietly deleted, because a tool that asks to be trusted on uncertainty
        should show its own error history.</p>
      <ol class="mc-corr-list">
        ${TC_RETIRED_CLAIMS.map(r => `
          <li class="mc-corr-item">
            <div class="mc-corr-was"><span class="mc-corr-tag mc-corr-tag-was">Was</span> ${escapeHtml(r.was)}</div>
            <div class="mc-corr-why"><span class="mc-corr-tag mc-corr-tag-why">Problem</span> ${escapeHtml(r.problem)}</div>
            <div class="mc-corr-now"><span class="mc-corr-tag mc-corr-tag-now">Now</span> ${escapeHtml(r.now)}</div>
          </li>`).join('')}
      </ol>
    </section>

    <section class="mc-claims" aria-labelledby="mc-claims-h">
      <h3 class="mc-corrections-title" id="mc-claims-h">Claim registry — every load-bearing claim, with its scope</h3>
      <p class="mc-lede">These are stored once, centrally, and referenced by the interface. A claim and its scope
        cannot drift apart because they are the same record.</p>
      <div class="mc-claim-grid">
        ${Object.values(TC_CLAIMS).map(c => `
          <article class="mc-claim">
            <div class="mc-claim-head">${tcStatusBadge(c.status)}
              <span class="mc-tier" title="${escapeHtml(TC_EVIDENCE_TIER[c.tier].label)}">Evidence tier ${TC_EVIDENCE_TIER[c.tier].short}</span></div>
            <p class="mc-claim-text">${escapeHtml(c.claim)}</p>
            <p class="mc-claim-scope"><strong>Established under:</strong> ${escapeHtml(c.scope)}</p>
            <p class="mc-claim-notes">${escapeHtml(c.notes)}</p>
            <a class="mc-claim-src" href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.source)} →</a>
          </article>`).join('')}
      </div>
    </section>
  `;
}
