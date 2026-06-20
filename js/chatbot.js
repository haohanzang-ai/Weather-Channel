'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   TexasClimate — Local Chatbot
   No API key required. Keyword/intent matching against built-in knowledge.
   ══════════════════════════════════════════════════════════════════════════ */

(function () {

  /* ── Knowledge Base ─────────────────────────────────────────────────── */
  const INTENTS = [
    {
      id: 'demo',
      triggers: ['demo', 'walkthrough', 'guide', 'tour', 'show me', 'start demo', 'judge'],
      response: 'Launching the 12-step Demo Walkthrough! It guides judges (and anyone curious) through every feature — switchgrass, Austin TX, live weather, stress scores, bioenergy, map, scanner, and sources.',
      action: 'startDemo'
    },
    {
      id: 'liveData',
      triggers: ['live', 'real', 'api', 'actual', 'fetch', 'live data', 'what is live', 'real-time'],
      response: '🟢 Live from real APIs:\n• Temperature, humidity, wind, weather code → Open-Meteo Current Weather API\n• 7-day forecast + ET0 → Open-Meteo Forecast API\n• Air Quality Index → Open-Meteo Air Quality API\n• NWS Severe Weather Alerts → api.weather.gov\n\n🟡 Live-Derived (calculated from above):\n• Heat stress, moisture stress, Cooling Demand Index\n\n🔵 Research estimates (not live sensors):\n• Bioenergy confidence score, lignin risk\n\n❌ Not yet integrated:\n• Soil moisture, TWDB reservoir levels, ERCOT grid'
    },
    {
      id: 'bioenergyScore',
      triggers: ['bioenergy score', 'bioenergy confidence', 'energy score', 'how is bioenergy', 'how is the score', 'confidence score'],
      response: '⚡ The Bioenergy Confidence Score combines:\n1. Heat stress (from live Open-Meteo temperature)\n2. Drought/moisture stress (ET0 vs. precipitation)\n3. Plant profile match (species drought/heat tolerance from literature)\n4. Conversion chemistry risk (estimated from stress level)\n\nOutput: 0–100% confidence that this plant-location combination is suitable for bioenergy development.\n\n⚠ Research estimate — lab biomass data is needed for exact fuel yield.'
    },
    {
      id: 'stressScore',
      triggers: ['stress score', 'plant stress', 'heat stress', 'drought stress', 'moisture stress', 'how is stress', 'stress calc'],
      response: '⚠ Stress Scores use live Open-Meteo data:\n• Heat stress = max(0, (T°F − 68) / 36 × 100)\n• Moisture/drought stress = max(0, ET0 − precip) / ET0 × 100\n• Salinity: low confidence — coastal proximity proxy only (no soil EC sensor)\n\nAll are derived estimates, not physical sensor readings.'
    },
    {
      id: 'switchgrass',
      triggers: ['switchgrass', 'panicum', 'panicum virgatum', 'why switchgrass', 'what is switchgrass'],
      response: '🌾 Switchgrass (Panicum virgatum) is:\n• A native North American perennial grass\n• U.S. DOE priority cellulosic ethanol feedstock\n• Produces biomass for 15+ years per planting\n• 540% net energy return (Schmer et al., PNAS 2008)\n• Very drought + heat tolerant — suits much of Texas\n• Needs 6–14 gal water per gallon of fuel (vs. 784 for corn)\n• Grows on marginal land, competing less with food crops\n\nThe barrier: lignin in the cell wall requires expensive pretreatment. Researchers are working on low-lignin varieties.'
    },
    {
      id: 'corn',
      triggers: ['corn', 'corn ethanol', 'corn vs', 'why not corn'],
      response: '🌽 Switchgrass vs. Corn for bioenergy:\n• Water: Switchgrass 6–14 gal/gal vs. Corn 784 gal/gal\n• Land: Switchgrass grows on marginal land corn cannot use\n• Inputs: Far fewer pesticides and fertilizers needed\n• Net energy: Switchgrass ~540% vs. Corn ~125%\n• Food competition: Corn is food; switchgrass is not\n• Commercial readiness: Corn ethanol is commercial now. Switchgrass cellulosic is still scaling up — the lignin pretreatment cost remains the barrier.'
    },
    {
      id: 'lignin',
      triggers: ['lignin', 'cell wall', 'pretreatment', 'conversion barrier', 'why is conversion', 'barrier', 'cellulose'],
      response: '⚗️ Lignin is the key technical barrier to affordable cellulosic biofuel:\n\nInside the plant cell wall:\n🪵 Lignin — structural shield (the problem)\n🍬 Cellulose → can become fuel\n🍬 Hemicellulose → can become fuel\n\nLignin blocks enzymes from reaching cellulose. Removing it requires expensive pretreatment: heat, acid, ammonia (AFEX), or steam explosion.\n\nHigh stress → altered lignin (higher condensed fraction) → harder and costlier to pretreat.\n\nSource: Mosier et al. (2005), Bioresource Technology 96(6):673–686'
    },
    {
      id: 'scanner',
      triggers: ['scanner', 'plant scanner', 'photo', 'upload', 'camera', 'identify', 'plantnet', 'image'],
      response: '🔬 Plant-to-Fuel Scanner (Bioenergy Engine tab):\n• Upload or capture a plant photo\n• Confirm plant type (user confirmation always required)\n• Describe size, condition, canopy density\n• Get an educational bioenergy relevance analysis\n\n⚠ Photos CANNOT measure:\n❌ Lignin content  ❌ Cellulose %\n❌ Biomass (dry tons)  ❌ Fuel yield\n\nThis is educational — not a lab test, not a fuel forecast. No PlantNet API yet (planned for future version).'
    },
    {
      id: 'map',
      triggers: ['map', 'texas map', 'city', 'overlay', 'pollution', 'layer', 'maplibre'],
      response: '◉ Texas Map (Map & Compare tab) shows:\n🌧 Live precipitation overlay\n☁️ Live cloud cover\n⚡ Live severe weather zones\n🏜 Live drought stress\n🌊 Agricultural runoff (static county approximation)\n🧪 Pesticide intensity (static county data)\n💨 GHG emission hotspots (static data)\n\nAll 10 Texas cities have live temperature + AQI. Click a city to expand details.\n\nPollution layers are static approximations — not real-time sensors.'
    },
    {
      id: 'sources',
      triggers: ['source', 'citation', 'reference', 'peer reviewed', 'where does', 'bibliography', 'who says'],
      response: '📚 Key sources:\n• Schmer et al. (2008), PNAS — switchgrass 540% net energy\n• Mosier et al. (2005), Bioresource Technology — lignin barrier\n• Ragauskas et al. (2006), Science — biofuel pathway science\n• DOE EERE — switchgrass as priority feedstock\n• NREL — cellulosic bioenergy conversion research\n• Szabados & Savouré (2010), Trends Plant Sci — osmolyte stress\n• Open-Meteo API (free, open-source)\n• api.weather.gov — NWS alerts\n\nSee the Sources & Data Status tab for the full citation table.'
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
      response: '🌿 Welcome to TexasClimate!\n\nCore question: "Can this plant survive here and become useful clean bioenergy?"\n\nFeatures:\n1. Live weather — 10 Texas cities (Open-Meteo)\n2. Plant stress scores — heat, drought, moisture\n3. Bioenergy confidence score\n4. Interactive Texas map + pollution overlays\n5. Plant-to-Fuel Scanner (educational)\n6. 12-step Demo Walkthrough\n7. Gene & Pathway Atlas\n8. Graph Builder (live data charts)\n\nBuilt for the Congressional App Challenge. All data is labeled: Live API / Live-Derived / Research Estimate / Demo.\n\nSay "demo" to launch the guided walkthrough, or "sources" to see all citations.'
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
    btn.setAttribute('aria-label', 'Ask TexasClimate AI Assistant');
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
      '    <div class="chatbot-title">🌿 TexasClimate Assistant</div>',
      '    <div class="chatbot-subtitle">Local knowledge · No API key required · Offline capable</div>',
      '  </div>',
      '  <button class="chatbot-close" id="chatbotCloseBtn" aria-label="Close assistant">✕</button>',
      '</div>',
      '<div class="chatbot-messages" id="chatbotMessages">',
      '  <div class="chatbot-msg bot">',
      '    <span class="chatbot-msg-icon">🌿</span>',
      '    <div class="chatbot-msg-text">Hi! I\'m the TexasClimate guide.<br><br>I can explain scores, data sources, and features — or launch the Demo Walkthrough for judges. What would you like to know?</div>',
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
