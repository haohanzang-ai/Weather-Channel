'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   TexasClimate — Science Assistant
   ──────────────────────────────────────────────────────────────────────────
   THIS IS NOT AN LLM AND MAKES NO CLAIM TO BE ONE.

   It is deterministic local intent matching: the user's text is lowercased and
   tested against the trigger lists below; the first matching intent returns its
   pre-written response verbatim. There is no model, no API call, no generation,
   no inference of any kind. Every answer it can give is literally written in
   this file and can be read here.

   It was previously presented as an "AI Assistant". Anyone can read the source code,
   and a rule-based responder branded as AI is exactly the sort of thing that
   costs more credibility than the branding ever gains. Naming it accurately is
   the stronger position.
   ══════════════════════════════════════════════════════════════════════════ */

(function () {

  /* ── Knowledge Base ─────────────────────────────────────────────────── */
  const INTENTS = [
    {
      id: 'demo',
      triggers: ['demo', 'walkthrough', 'guide', 'tour', 'show me', 'start demo', 'judge'],
      response: 'Launching the 12-step Demo Walkthrough! It guides you through every feature — switchgrass, Austin TX, live weather, stress scores, bioenergy, map, scanner, and sources.',
      action: 'startDemo'
    },
    {
      id: 'liveData',
      triggers: ['live', 'real', 'api', 'actual', 'fetch', 'live data', 'what is live', 'real-time'],
response: 'Every value in this app carries one of six provenance labels:\n\n◉ LIVE — fetched this session from a provider:\n• Temperature, humidity, wind → Open-Meteo\n• 7-day forecast + reference ET → Open-Meteo\n• Soil moisture, hourly VPD → Open-Meteo\n• Air Quality Index → Open-Meteo AQI\n• Severe weather alerts → api.weather.gov\n(Note: these are gridded model output interpolated to your coordinates, not an instrument at your site.)\n\n∑ DERIVED — computed from LIVE inputs by a documented equation:\n• VPD, all stress scores, all composite indices\n\n❝ LITERATURE — published, cited, not measured here:\n• Species tolerance thresholds, gene records, bioenergy claims\n\n⚗ EXPERIMENTAL — our own heuristics, uncalibrated:\n• Every composite model and pathway score\n\n✎ USER INPUT — what you entered or confirmed\n\n? UNKNOWN — not available, and deliberately left blank rather than filled with a default. Soil salinity, cultivar and growth stage are always UNKNOWN unless you supply them.'
    },
    {
      id: 'bioenergyScore',
      triggers: ['bioenergy score', 'suitability index', 'bioenergy suitability', 'energy score', 'how is bioenergy', 'how is the score', 'evidence confidence'],
response: '⚡ Two separate outputs, and it matters that they are separate.\n\nBIOENERGY SUITABILITY INDEX (0–100) — how well this plant/location pair ranks under our assumptions:\n• Environmental Tolerance Match (20%)\n• Productivity Stress Proxy (20%)\n• Water supply vs. requirement (15%)\n• Stress-chemistry safety (15%)\n• Conversion compatibility (15%)\n• Environmental co-benefit (10%)\n• Input completeness (5%)\n\nEVIDENCE CONFIDENCE (HIGH/MEDIUM/LOW) — how much should be read into that index. It is computed separately and reported per pipeline layer, because confidence falls as you move from measurement toward inference.\n\nA location can score 85 with LOW confidence. That means it ranks well under our assumptions AND our assumptions are weakly supported. Both halves are the answer.\n\n⚠ The index is EXPERIMENTAL and uncalibrated. It is a ranking aid, not a probability or a yield forecast.'
    },
    {
      id: 'stressScore',
      triggers: ['stress score', 'plant stress', 'heat stress', 'drought stress', 'moisture stress', 'how is stress', 'stress calc'],
response: '⚠ Stress scores compare live values against published species thresholds:\n• Heat stress — linear ramp between the species stress-onset and critical temperatures\n• Climate Water Deficit Proxy — 30-day reference ET minus precipitation, scaled by species drought tolerance. This is ATMOSPHERIC DEMAND VS SUPPLY, not measured plant drought: it excludes crop coefficient, soil storage, rooting depth and irrigation\n• VPD — from temperature and humidity via the FAO-56 Tetens equation. Screen-level, not leaf-level\n• Soil moisture — 0–1 cm surface layer only, which is not the water the roots reach\n• Salinity — UNKNOWN. We removed the coastal-proximity proxy, because distance to the coast is not a measurement of soil EC\n\nNothing about the plant itself is measured. These describe the environment relative to what the literature says the species tolerates.'
    },
    {
      id: 'switchgrass',
      triggers: ['switchgrass', 'panicum', 'panicum virgatum', 'why switchgrass', 'what is switchgrass'],
      response: '🌾 Switchgrass (Panicum virgatum) is:\n• A native North American perennial grass\n• U.S. DOE priority cellulosic ethanol feedstock\n• Produces biomass for 15+ years per planting\n• On 10 Northern Great Plains farms (2000–2005), produced 540% more renewable energy than the NONRENEWABLE energy used to grow and convert it (Schmer et al., PNAS 2008) — a result for those farms, not a property of the species\n• Drought and heat tolerant relative to most row crops — suits much of Texas\n• Grows on marginal land, competing less with food crops\n\nThe barrier: lignin in the cell wall requires expensive pretreatment. Researchers are working on low-lignin varieties.'
    },
    {
      id: 'corn',
      triggers: ['corn', 'corn ethanol', 'corn vs', 'why not corn'],
      response: '🌽 Switchgrass vs. Corn for bioenergy:\n• Water: no honest single comparison exists. Corn ethanol water footprints span roughly three orders of magnitude across U.S. states depending on irrigation, so a one-number comparison is not defensible (Chiu et al., ES&T 2009)\n• Land: switchgrass can grow on marginal land corn cannot use\n• Inputs: generally fewer pesticide and fertiliser inputs\n• Net energy: the switchgrass 540% figure (renewable vs. NONRENEWABLE energy, 10 Northern Great Plains farms, Schmer et al. 2008) and typical corn-ethanol net-energy figures come from different studies with different system boundaries, so they should not be placed side by side\n• Food competition: Corn is food; switchgrass is not\n• Commercial readiness: Corn ethanol is commercial now. Switchgrass cellulosic is still scaling up — the lignin pretreatment cost remains the barrier.'
    },
    {
      id: 'lignin',
      triggers: ['lignin', 'cell wall', 'pretreatment', 'conversion barrier', 'why is conversion', 'barrier', 'cellulose'],
      response: '⚗️ Lignin is the key technical barrier to affordable cellulosic biofuel:\n\nInside the plant cell wall:\n🪵 Lignin — structural shield (the problem)\n🍬 Cellulose → can become fuel\n🍬 Hemicellulose → can become fuel\n\nLignin blocks enzymes from reaching cellulose. Removing it requires expensive pretreatment: heat, acid, ammonia (AFEX), or steam explosion.\n\nHigh stress → altered lignin (higher condensed fraction) → harder and costlier to pretreat.\n\nSource: Mosier et al. (2005), Bioresource Technology 96(6):673–686'
    },
    {
      id: 'scanner',
      triggers: ['scanner', 'plant scanner', 'photo', 'upload', 'camera', 'identify', 'plantnet', 'image'],
      response: '🔬 Field Observation Mode (Bioenergy Lab tab)\n\nImage classification is attempted here, and it is weaker than it looks. If MobileNet fails to load in your browser, the result says so and falls back to pixel-colour analysis rather than pretending a classification happened.\n\nWhat actually happens:\n• You photograph the plant. The image stays in your browser and is never uploaded\n• MobileNet v2 runs locally (TensorFlow.js) and labels it with an ImageNet category\n• ImageNet contains almost no bioenergy crops, so a keyword map turns that label into a SUGGESTED plant. That map has never been validated\n• The percentage shown is MobileNet confidence in an IMAGENET CLASS — not the probability that the plant is that species\n• YOU confirm or correct the suggestion. Your choice sets the species\n• You record size, canopy density and visible condition\n• Your observations are tagged USER INPUT, not measurements\n• They are combined with live environment data and the species literature profile\n\n⚠ A photograph cannot measure:\n❌ Lignin  ❌ Cellulose  ❌ Biomass  ❌ Moisture  ❌ Fuel yield\n\nIt was previously called the Plant-to-Fuel Scanner. That name implied image analysis that does not exist, so it was renamed.'
    },
    {
      id: 'map',
      triggers: ['map', 'texas map', 'city', 'overlay', 'pollution', 'layer', 'maplibre'],
      response: '◉ Texas Map (Map & Compare tab) shows:\n🌧 Live precipitation overlay\n☁️ Live cloud cover\n⚡ Live severe weather zones\n🏜 Live drought stress\n🌊 Agricultural runoff (static county approximation)\n🧪 Pesticide intensity (static county data)\n💨 GHG emission hotspots (static data)\n\nAll 10 Texas cities have live temperature + AQI. Click a city to expand details.\n\nPollution layers are static approximations — not real-time sensors.'
    },
    {
      id: 'sources',
      triggers: ['source', 'citation', 'reference', 'peer reviewed', 'where does', 'bibliography', 'who says'],
      response: '📚 Key sources:\n• Schmer et al. (2008), PNAS — 540% more renewable than nonrenewable energy, 10 Northern Great Plains farms\n• Mosier et al. (2005), Bioresource Technology — lignin barrier\n• Ragauskas et al. (2006), Science — biofuel pathway science\n• DOE EERE — switchgrass as priority feedstock\n• NREL — cellulosic bioenergy conversion research\n• Szabados & Savouré (2010), Trends Plant Sci — osmolyte stress\n• Open-Meteo API (free, open-source)\n• api.weather.gov — NWS alerts\n\nSee the Sources & Data Status tab for the full citation table.'
    },
    {
      id: 'safety',
      triggers: ['safe', 'danger', 'warning', 'advice', 'farm', 'invest', 'eat', 'medicine', 'emergency', 'harvest', 'touch', 'policy'],
      response: '⚠ Safety Reminders:\n• Educational prototype — NOT farming, investment, medical, or emergency advice\n• Do NOT eat, touch, or plant unknown species based on this tool\n• Do NOT use for emergency weather decisions — use official NWS alerts\n• Do NOT make investment or land-use decisions from this app\n• Photos cannot measure lignin, cellulose, or fuel yield\n• All scores are estimates — lab data is required for precision\n\nFor weather emergencies: weather.gov or call 911.'
    },
    {
      id: 'limitations',
      triggers: ['limitation', 'cannot', "what can't", "can't do", 'not possible', 'fake', 'wrong', 'estimate', 'accuracy', 'precision', 'lab'],
      response: "❌ What this app CANNOT do:\n• Measure lignin, cellulose, hemicellulose (lab assay required)\n• Predict exact fuel yield in gallons (biomass composition needed)\n• Identify plants from photos reliably (no PlantNet API yet)\n• Read soil moisture (NASA SMAP not connected)\n• Access ERCOT grid or TWDB reservoir data (not integrated)\n• Provide farming, investment, or emergency advice\n\n✅ What it CAN do:\n• Live weather for 10 Texas cities (Open-Meteo)\n• Heat/drought stress scores (derived from live data)\n• Educational bioenergy confidence estimate\n• NWS severe weather alerts\n• City-by-city climate comparison\n• Fuel pathway educational science"
    },
    {
      id: 'appOverview',
      triggers: ['what does', 'what is', 'about', 'explain', 'overview', 'overview of', 'tell me', 'hello', 'hi', 'help'],
      response: '🌿 Welcome to TexasClimate!\n\nCore question: "What might this environment mean, biologically, for this bioenergy crop — and how strong is the evidence?"\n\nThe pipeline:\nLOCATION → ENVIRONMENT → PLANT TOLERANCE → STRESS → BIOLOGICAL MECHANISM → BIOENERGY IMPLICATION → EVIDENCE\n\nFeatures:\n1. Live weather at any Texas point (Open-Meteo, NWS)\n2. Stress scores against published species thresholds\n3. Bioenergy Suitability Index, with Evidence Confidence reported separately\n4. Interactive Texas map + pollution overlays\n5. Gene & Pathway Atlas with an evidence ladder\n6. Field Observation Mode (local MobileNet suggests a species, you confirm it)\n7. Scenario mode (what-if, clearly marked experimental)\n8. Model cards for every model, with its validation status\n\nEvery value is labelled LIVE / DERIVED / LITERATURE / EXPERIMENTAL / USER INPUT / UNKNOWN.\n\nSay "demo" for the guided walkthrough, or "sources" for citations.'
    }
  ];

  const CHIPS = [
    { label: '▶ Run demo',              query: 'demo' },
    { label: '📡 What data is live?',   query: 'live data' },
    { label: '⚡ Bioenergy score?',     query: 'bioenergy score' },
    { label: '🌾 Why switchgrass?',     query: 'switchgrass' },
    { label: '📷 What can a photo do?', query: 'scanner' },
    { label: '📚 Show sources',         query: 'sources' },
  ];

  let isOpen = false;

  /* ── Build DOM ──────────────────────────────────────────────────────── */
  function init () {
    // Floating toggle button
    const btn = document.createElement('button');
    btn.id = 'chatbotToggle';
    btn.className = 'chatbot-toggle';
    btn.setAttribute('aria-label', 'Open the TexasClimate Science Assistant');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = '💬 Ask TexasClimate';
    btn.onclick = toggle;
    document.body.appendChild(btn);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'chatbotPanel';
    panel.className = 'chatbot-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', 'TexasClimate Assistant');
    panel.innerHTML = [
      '<div class="chatbot-header">',
      '  <div>',
      '    <div class=\"chatbot-title\">🌿 Science Assistant</div>',
      '    <div class=\"chatbot-subtitle\">Rule-based &middot; not an LLM &middot; matches your words against a written knowledge base</div>',
      '  </div>',
      '  <button class="chatbot-close" id="chatbotCloseBtn" aria-label="Close assistant">✕</button>',
      '</div>',
      '<div class="chatbot-messages" id="chatbotMessages">',
      '  <div class="chatbot-msg bot">',
      '    <span class="chatbot-msg-icon">🌿</span>',
      '    <div class="chatbot-msg-text">Hi! I\'m the TexasClimate guide.<br><br>I can explain scores, data sources, and features — or launch the Guided Walkthrough. What would you like to know?</div>',
      '  </div>',
      '</div>',
      '<div class="chatbot-chips" id="chatbotChips"></div>',
      '<div class="chatbot-input-row">',
      '  <input class="chatbot-input" id="chatbotInput" type="text" placeholder="Ask about the app…" autocomplete="off" aria-label="Chat message">',
      '  <button class="chatbot-send" id="chatbotSendBtn" aria-label="Send message">→</button>',
      '</div>',
    ].join('');
    document.body.appendChild(panel);

    // Wire events
    document.getElementById('chatbotCloseBtn').onclick = close;
    document.getElementById('chatbotSendBtn').onclick = send;
    document.getElementById('chatbotInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') send();
    });

    // Render chips
    const chipsEl = document.getElementById('chatbotChips');
    CHIPS.forEach(c => {
      const chip = document.createElement('button');
      chip.className = 'chatbot-chip';
      chip.textContent = c.label;
      chip.setAttribute('aria-label', 'Ask: ' + c.label);
      chip.onclick = () => ask(c.query);
      chipsEl.appendChild(chip);
    });
  }

  /* ── Open / Close ────────────────────────────────────────────────────── */
  function toggle () { isOpen ? close() : open(); }

  function open () {
    isOpen = true;
    document.getElementById('chatbotPanel').classList.add('open');
    document.getElementById('chatbotToggle').classList.add('active');
    setTimeout(() => {
      const input = document.getElementById('chatbotInput');
      if (input) input.focus();
    }, 200);
  }

  function close () {
    isOpen = false;
    document.getElementById('chatbotPanel').classList.remove('open');
    document.getElementById('chatbotToggle').classList.remove('active');
  }

  // Expose for demo.js
  window.closeChatbot = close;
  window.openChatbot  = open;

  /* ── Send / Ask ──────────────────────────────────────────────────────── */
  function send () {
    const input = document.getElementById('chatbotInput');
    const text  = (input.value || '').trim();
    if (!text) return;
    input.value = '';
    ask(text);
  }

  function ask (text) {
    addMsg(text, 'user');
    const result = resolve(text.toLowerCase());
    // Slight delay for natural feel
    setTimeout(() => {
      addMsg(result.response, 'bot');
      if (result.action === 'startDemo') {
        setTimeout(() => {
          if (typeof showPage === 'function') showPage('demo');
          if (typeof demoStart === 'function') demoStart();
          close();
        }, 500);
      }
    }, 280);
  }

  // Expose for external callers
  window.chatbotAsk = ask;

  /* ── Render Messages ─────────────────────────────────────────────────── */
  function addMsg (text, role) {
    const msgs = document.getElementById('chatbotMessages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'chatbot-msg ' + role;
    const escaped = esc(text).replace(/\n/g, '<br>');
    if (role === 'bot') {
      div.innerHTML = '<span class="chatbot-msg-icon">🌿</span><div class="chatbot-msg-text">' + escaped + '</div>';
    } else {
      div.innerHTML = '<div class="chatbot-msg-text">' + escaped + '</div>';
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── Intent Matching ─────────────────────────────────────────────────── */
  function resolve (text) {
    for (const intent of INTENTS) {
      if (intent.triggers.some(t => text.includes(t))) {
        return intent;
      }
    }
    // Fallback
    return {
      response: "I'm not sure about that! Try asking about:\n• \"demo\" — launch the walkthrough\n• \"live data\" — what APIs are connected\n• \"bioenergy score\" — how it's calculated\n• \"switchgrass\" — why this plant\n• \"scanner\" — the photo tool\n• \"sources\" — citations and transparency\n• \"limitations\" — what the app can't do\n• \"help\" — full overview"
    };
  }

  /* ── Utilities ───────────────────────────────────────────────────────── */
  function esc (s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Auto-init ───────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
