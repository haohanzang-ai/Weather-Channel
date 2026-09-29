'use strict';

// ── Plant Gene & Pathway Atlas ────────────────────────────────────────────────
// Data is loaded from data/plant_pathways.json and data/plant_genes_switchgrass.json
// Biology is sourced from published databases and peer-reviewed literature only.
// No gene, pathway, or function was invented without a cited source.

const ATLAS_DATA_PATHS = {
  pathways: 'data/plant_pathways.json',
  genes:    'data/plant_genes_switchgrass.json',
};

// Multi-plant gene atlas lookup (plant key → gene JSON file)
const ATLAS_PLANT_GENE_FILES = {
  switchgrass:      'data/plant_genes_switchgrass.json',
  sorghum:          'data/plant_genes_sorghum.json',
  miscanthus:       'data/plant_genes_miscanthus.json',
  agave:            'data/plant_genes_agave.json',
  algae:            'data/plant_genes_algae.json',
};

// Human-readable species names for atlas header
const ATLAS_SPECIES_LABELS = {
  switchgrass:  { badge: '🌿 Panicum virgatum — Switchgrass',          intro: 'Switchgrass (<em>Panicum virgatum</em>), Texas\'s primary native cellulosic bioenergy crop.' },
  sorghum:      { badge: '🌱 Sorghum bicolor — Energy Sorghum',        intro: 'Energy Sorghum (<em>Sorghum bicolor</em>), a drought-tolerant C4 annual with strong Texas bioenergy potential.' },
  miscanthus:   { badge: '🌾 Miscanthus × giganteus — Miscanthus',     intro: 'Miscanthus (<em>Miscanthus × giganteus</em>), a high-yield perennial C4 grass for cellulosic ethanol.' },
  agave:        { badge: '🌵 Agave spp. — Agave / Century Plant',      intro: 'Agave (<em>Agave spp.</em>), a CAM succulent uniquely adapted to arid West Texas with minimal water use.' },
  algae:        { badge: '💧 Chlorella / Chlamydomonas — Microalgae',  intro: 'Microalgae (<em>Chlorella vulgaris / Chlamydomonas reinhardtii</em>), high-productivity aquatic biofuel organisms.' },
};

// Module state
const _atlasState = {
  pathways: null,
  genes: null,
  loaded: false,
  activeRegion: null,   // 'all' | region key
  activeGroup: null,    // pathway group id
  selectedGene: null,   // gene record
  compareGene:  null,   // gene saved for side-by-side comparison
};

// Plant regions definition (display label → region keys in gene data)
const ATLAS_REGIONS = [
  { key: 'all',            label: 'All Regions',      icon: '🌿' },
  { key: 'leaf',           label: 'Leaf',             icon: '🍃' },
  { key: 'stem',           label: 'Stem',             icon: '🌱' },
  { key: 'root',           label: 'Root',             icon: '🪨' },
  { key: 'vascular_tissue',label: 'Vascular Tissue',  icon: '🔀' },
  { key: 'cell_wall',      label: 'Cell Wall',        icon: '🧱' },
  { key: 'chloroplast',    label: 'Chloroplast',      icon: '☀️' },
];

/* ── Evidence ladder ──────────────────────────────────────────────────────────
   The Gene Atlas is a MECHANISM AND EVIDENCE EXPLORER, not an expression
   detector. Nothing here observes gene activity in anyone's plant. What each
   record says is: "the published literature associates this gene or pathway
   with this stress response" — and the tier says how far that evidence sits
   from the species being analysed.

   Tier 1 is the strongest and the rarest. Most switchgrass gene records in any
   public resource are tier 4 or 5, because switchgrass is far less studied than
   Arabidopsis. Showing the tier is the honest alternative to letting a
   projected ortholog look like a measured result. */
const EVIDENCE_LADDER = [
  { tier: 1, key: 'direct-species', label: 'Direct experiment in switchgrass',
    short: 'T1', dot: '#2ECC8B', glyph: '●',
    meaning: 'The gene was studied experimentally in Panicum virgatum itself.' },
  { tier: 2, key: 'related-genus',  label: 'Experiment in a related Panicum species',
    short: 'T2', dot: '#5DDBA8', glyph: '◕',
    meaning: 'Studied in a close relative. Transfer is plausible but not demonstrated.' },
  { tier: 3, key: 'other-grass',    label: 'Experiment in another grass',
    short: 'T3', dot: '#4A90E2', glyph: '◑',
    meaning: 'Studied in rice, maize, sorghum or similar. Grasses share much of this machinery, but not all of it.' },
  { tier: 4, key: 'model-dicot',    label: 'Arabidopsis or other model species',
    short: 'T4', dot: '#F5A623', glyph: '◔',
    meaning: 'Studied in a model plant, often a dicot. The switchgrass counterpart is inferred, not observed.' },
  { tier: 5, key: 'computational',  label: 'Computational projection only',
    short: 'T5', dot: '#E57373', glyph: '○',
    meaning: 'Identified by sequence similarity. No experiment in any grass supports this specific gene\'s role here.' },
];

/* Map the evidence labels used in the data files onto the ladder. */
const EVIDENCE_TIER_OF = {
  'Peer-Reviewed Literature':       3,
  'Curated Database Reference':     4,
  'Homology-Based Projection':      5,
  'Environment-Relevance Estimate': 5,
};

/* How many curated gene records exist for a species, and how strong the best of
   them is. Used by the Evidence Confidence engine so the Biology layer reflects
   the evidence actually available for the selected plant, rather than assuming
   switchgrass-level coverage for every species. */
function atlasGeneCountFor(plantKey) {
  const g = _atlasState?.genes;
  if (!Array.isArray(g)) return null;
  return g.length;
}
function atlasTopTierFor(plantKey) {
  const g = _atlasState?.genes;
  if (!Array.isArray(g) || !g.length) return null;
  return Math.min(...g.map(x => atlasTier(x).tier));
}

function atlasTier(gene) {
  // A record that names Panicum virgatum as its own study species outranks the
  // generic label, so direct switchgrass work is not buried under "literature".
  if (gene && gene.evidenceLevel === 'Peer-Reviewed Literature' &&
      /Panicum virgatum/i.test(gene.orthologSource || '') &&
      !/Arabidopsis|Oryza|Zea|rice|maize/i.test(gene.orthologSource || '')) return EVIDENCE_LADDER[0];
  const t = EVIDENCE_TIER_OF[gene?.evidenceLevel] || 5;
  return EVIDENCE_LADDER[t - 1];
}

/* Name a projected gene honestly. A tier-4/5 record is a PUTATIVE ORTHOLOG,
   and its display name should say so rather than presenting the projected
   switchgrass symbol as though the gene had been characterised. */
function atlasDisplayName(gene) {
  const tier = atlasTier(gene).tier;
  if (tier <= 3) return gene.symbol;
  const src = gene.orthologSource || '';
  const m = src.match(/^([A-Za-z][A-Za-z\s.]*?)\s+(At[A-Z0-9]+|[A-Z][A-Za-z0-9]+)\s*\(/);
  const from = m ? `${m[1].trim()} ${m[2]}` : (src.split(';')[0] || 'a model species');
  return `Putative switchgrass ortholog of ${from}`;
}

const EVIDENCE_CONFIG = {
  'Peer-Reviewed Literature':   { cls: 'peer',     label: 'Peer-Reviewed Literature',   dot: '#5DDBA8' },
  'Curated Database Reference': { cls: 'curated',  label: 'Curated Database',           dot: '#4A90E2' },
  'Homology-Based Projection':  { cls: 'homology', label: 'Homology-Based Projection',  dot: '#F5A623' },
  'Environment-Relevance Estimate': { cls: 'estimate', label: 'Environment-Relevance Estimate', dot: '#E57373' },
};

// ── Public init (called from index.html or subtabs.js after DOM ready) ────────
function atlasInit(containerId) {
  const container = document.getElementById(containerId || 'sc-atlas');
  if (!container) return;

  const plantKey = (typeof appState !== 'undefined' && appState.plant?.key) || 'switchgrass';
  const geneFile = ATLAS_PLANT_GENE_FILES[plantKey] || null;

  container.innerHTML = `
    <div class="tab-subsection-header">🧬 Plant Gene &amp; Pathway Atlas
      <span class="tsh-badge">Curated Database</span>
    </div>
    <div style="padding:24px;color:var(--text3);font-size:11px;text-align:center">
      Loading gene atlas data…
    </div>`;

  if (!geneFile) {
    // Plant has no gene data — show supported-plant list
    container.innerHTML = `
      <div class="tab-subsection-header">🧬 Plant Gene &amp; Pathway Atlas
        <span class="tsh-badge">Curated Database</span>
      </div>
      <div class="atlas-wrap">
        ${_atlasRenderFallback(plantKey)}
      </div>`;
    return;
  }

  Promise.all([
    fetch(ATLAS_DATA_PATHS.pathways).then(r => r.json()),
    fetch(geneFile).then(r => r.json()),
  ]).then(([pathwayData, geneData]) => {
    _atlasState.pathways   = pathwayData;
    _atlasState.genes      = geneData.genes || [];
    _atlasState.species    = geneData.species || '';
    _atlasState.commonName = geneData.commonName || '';
    _atlasState.plantKey   = plantKey;
    _atlasState.loaded     = true;
    _atlasState.activeRegion = 'all';
    _atlasRender(container);
  }).catch(err => {
    container.innerHTML = `
      <div class="tab-subsection-header">🧬 Plant Gene &amp; Pathway Atlas</div>
      <div style="padding:20px;color:var(--text3);font-size:11px">
        Gene atlas data could not be loaded. Ensure data/plant_pathways.json and
        ${escapeHtml(geneFile)} are present.
        <br><small style="opacity:0.6">${escapeHtml(err.message)}</small>
      </div>`;
  });
}

// ── Render the full atlas UI ──────────────────────────────────────────────────
function _atlasRender(container) {
  const pd = _atlasState.pathways;
  const genes = _atlasState.genes;

  const currentPlantKey = _atlasState.plantKey || 'switchgrass';

  // Build the full section
  const html = `
    <div class="tab-subsection-header">🧬 Plant Gene &amp; Pathway Atlas
      <span class="tsh-badge">Curated Database</span>
    </div>
    <div class="atlas-wrap" id="atlasWrap">
      ${_atlasRenderMain(pd, genes, currentPlantKey)}
    </div>`;

  container.innerHTML = html;

  // Wire up interactions after DOM insertion
  _atlasWireRegions();
  _atlasWirePathwayGroups();
  _atlasUpdateStressBar();
}

// ── Fallback for plants without gene atlas data ───────────────────────────────
function _atlasRenderFallback(plantKey) {
  const name = (typeof appState !== 'undefined' && appState.plant?.name) || (plantKey || 'this plant');
  const supported = Object.keys(ATLAS_PLANT_GENE_FILES);
  return `
    <div class="atlas-fallback">
      <div class="atlas-fallback-title">🧬 Gene Atlas — ${escapeHtml(name)}</div>
      <p>Gene atlas data is not yet available for this species.</p>
      <p style="margin-top:8px;color:var(--text3);font-size:10.5px">
        <strong>Currently supported species:</strong><br>
        ${supported.map(k => `<span style="display:inline-block;margin:2px 4px;padding:2px 8px;background:var(--surface2);border-radius:10px;font-size:10px">${escapeHtml(ATLAS_SPECIES_LABELS[k]?.badge || k)}</span>`).join('')}
      </p>
      <p style="margin-top:8px;color:var(--text3);font-size:10px">
        Select one of the supported plants in Step 1 of the Analyze tab, then re-open the Gene Atlas subtab.
      </p>
    </div>`;
}

// ── Main atlas render (multi-species) ────────────────────────────────────────
function _atlasRenderMain(pd, genes, plantKey) {
  const groups = pd.pathwayGroups;
  const totalGenes = genes.length;
  const peerCount = genes.filter(g => g.evidenceLevel === 'Peer-Reviewed Literature').length;
  const curatedCount = genes.filter(g => g.evidenceLevel === 'Curated Database Reference').length;
  const specLabel = ATLAS_SPECIES_LABELS[plantKey] || ATLAS_SPECIES_LABELS.switchgrass;

  return `
    <!-- Intro banner -->
    <div class="atlas-intro">
      <div class="atlas-species-badge">${escapeHtml(specLabel.badge)}</div>
      <div class="atlas-intro-title">🧬 Plant Gene &amp; Pathway Atlas</div>
      <div class="atlas-intro-desc">
        Explore how environmental stress connects to plant pathways, genes, stress tolerance and growth,
        and bioenergy conversion — for ${specLabel.intro}
        Click a pathway group to expand it, then click any gene chip to see its function, evidence level, and source.
      </div>
      <div class="atlas-intro-note">
        Genes are curated from peer-reviewed literature, Phytozome, Gramene, Plant Reactome, and KEGG.
        Evidence level is shown for each gene. Homology-based projections require lab validation in the target species.
      </div>
    </div>

    <!-- Stats row -->
    <div class="atlas-stats-row">
      <div class="atlas-stat-chip"><strong>${totalGenes}</strong> source-linked genes</div>
      <div class="atlas-stat-chip"><strong>${groups.length}</strong> pathway groups</div>
      <div class="atlas-stat-chip"><strong>${peerCount}</strong> peer-reviewed (direct switchgrass)</div>
      <div class="atlas-stat-chip"><strong>${curatedCount}</strong> curated database</div>
    </div>

    <!-- Environment connection — stress highlight bar -->
    <div id="atlasStressBar" class="atlas-stress-bar">
      <span class="atlas-stress-bar-label">⚡ Stress context:</span>
      <span class="atlas-stress-none" id="atlasStressBarMsg">Select a plant and location in Step 1–2 to see stress-relevant pathways highlighted.</span>
    </div>

    <!-- Evidence legend -->
    <div class="atlas-legend">
      <span class="atlas-legend-label">Evidence:</span>
      <span class="atlas-legend-title">Evidence ladder — strongest first:</span>
      ${EVIDENCE_LADDER.map(v => `
        <span class="atlas-legend-item" title="${escapeHtml(v.meaning)}">
          <span class="atlas-legend-dot" style="background:${v.dot}" aria-hidden="true"></span>
          <span class="atlas-legend-glyph" aria-hidden="true">${v.glyph}</span>
          <span class="atlas-legend-tier">${v.short}</span>
          ${escapeHtml(v.label)}
        </span>`).join('')}
    </div>

    <!-- 3-panel layout -->
    <div class="atlas-panels">

      <!-- LEFT — plant region selector -->
      <div class="atlas-panel atlas-panel-left" id="atlasPanelLeft">
        <div class="atlas-panel-title">📍 Plant Region</div>
        <div class="atlas-region-diagram" id="atlasRegionList">
          ${ATLAS_REGIONS.map(r => {
            const count = r.key === 'all'
              ? genes.length
              : genes.filter(g => g.plantRegions && g.plantRegions.includes(r.key)).length;
            return `<button class="atlas-region-btn${r.key === 'all' ? ' active' : ''}"
                            data-region="${r.key}"
                            onclick="atlasSelectRegion('${r.key}')">
              <span>${r.icon}</span>
              <span>${escapeHtml(r.label)}</span>
              <span class="atlas-region-count">${count}</span>
            </button>`;
          }).join('')}
        </div>
      </div>

      <!-- MIDDLE — pathway groups -->
      <div class="atlas-panel atlas-panel-mid" id="atlasPanelMid">
        <div class="atlas-panel-title">🔬 Pathway Groups</div>
        <div class="atlas-pathway-list" id="atlasPathwayList">
          ${groups.map(g => _atlasRenderPathwayGroup(g, genes)).join('')}
        </div>
      </div>

      <!-- RIGHT — gene detail -->
      <div class="atlas-panel atlas-panel-right" id="atlasPanelRight">
        <div class="atlas-panel-title">🧪 Gene Detail</div>
        <div id="atlasGeneDetail">
          <div class="atlas-gene-detail-empty">
            <div class="atlas-gene-detail-empty-icon">🧬</div>
            <div class="atlas-gene-detail-empty-text">
              Click a pathway group to expand it,<br>then click any gene chip to view details.
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Important disclaimer -->
    <div style="padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r8);font-size:10.5px;color:var(--text3);line-height:1.7">
      <strong style="color:var(--text2)">What this atlas is, and is not:</strong>
      It is a <em>mechanism and evidence explorer</em>. It shows which genes and pathways the published literature
      <em>associates</em> with a given stress response, and how far that evidence sits from switchgrass on the evidence
      ladder above. It is <strong>not</strong> an expression detector. No gene activity is measured from weather data,
      from a photograph, or from anything else in this app &mdash; and nothing here indicates that a gene is currently
      active in any real plant. Records at tier 4 and 5 are <em>putative orthologs</em>: a switchgrass counterpart
      inferred from sequence similarity to a gene characterised in another species. Confirming any of this in a
      specific plant requires RNA-seq or qPCR on real tissue.
      Sources: Plant Reactome · Phytozome · Gramene · TAIR · KEGG · NCBI Gene · peer-reviewed literature.
    </div>`;
}

// ── Render one pathway group accordion ───────────────────────────────────────
function _atlasRenderPathwayGroup(group, allGenes) {
  const regionFilter = _atlasState.activeRegion || 'all';
  const genesInGroup = allGenes.filter(g => {
    if (g.pathwayGroup !== group.id) return false;
    if (regionFilter !== 'all') {
      return g.plantRegions && g.plantRegions.includes(regionFilter);
    }
    return true;
  });

  const isActive  = _atlasState.activeGroup === group.id;
  const isHighlit = _atlasState._stressGroups && _atlasState._stressGroups.includes(group.id);

  return `
    <div class="atlas-pathway-group${isActive ? ' active' : ''}${isHighlit ? ' highlighted' : ''}"
         id="atlas-pg-${group.id}">
      <div class="atlas-pathway-group-header"
           onclick="atlasToggleGroup('${group.id}')">
        <span class="atlas-pathway-icon">${group.icon}</span>
        <span class="atlas-pathway-dot" style="background:${group.colorHex}"></span>
        <span class="atlas-pathway-group-name">${escapeHtml(group.name)}</span>
        ${isHighlit ? '<span class="atlas-pathway-stress-tag">⚡ Stress-Relevant</span>' : ''}
        <span class="atlas-pathway-meta">${genesInGroup.length} gene${genesInGroup.length !== 1 ? 's' : ''} ▾</span>
      </div>
      <div class="atlas-pathway-group-body" id="atlas-pgb-${group.id}">
        <div class="atlas-pathway-group-desc">${escapeHtml(group.description)}</div>
        ${group.bioenergyRelevance ? `
          <div class="atlas-pathway-bioenergy">
            <strong>⚡ Bioenergy Relevance:</strong> ${escapeHtml(group.bioenergyRelevance)}
          </div>` : ''}
        <div style="margin-top:8px;margin-bottom:4px;font-size:9.5px;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em">Genes</div>
        <div class="atlas-gene-chips" id="atlas-chips-${group.id}">
          ${genesInGroup.length === 0
            ? `<span style="font-size:10px;color:var(--text3);font-style:italic">No genes match the current region filter.</span>`
            : genesInGroup.map(g => {
                const t = atlasTier(g);
                // The tier travels with the chip, as a glyph AND a code, so the
                // strength of the evidence is visible before anyone clicks in
                // — and legible without relying on colour.
                return `<button class="atlas-gene-chip atlas-tier-${t.tier}"
                                data-gene-id="${escapeHtml(g.geneId)}"
                                title="${escapeHtml(g.name)} — ${escapeHtml(t.label)}. ${escapeHtml(t.meaning)}"
                                onclick="atlasSelectGene('${escapeHtml(g.geneId)}')">
                  <span class="atlas-chip-tier" style="color:${t.dot}" aria-hidden="true">${t.glyph}</span>
                  ${escapeHtml(g.symbol)}
                  <span class="sr-only"> — evidence ${escapeHtml(t.label)}</span>
                </button>`;
              }).join('')}
        </div>
      </div>
    </div>`;
}

// ── Wire region buttons ───────────────────────────────────────────────────────
function _atlasWireRegions() {
  // Already wired via onclick attributes; just ensure counts update on region change
}

// ── Wire pathway group toggles ────────────────────────────────────────────────
function _atlasWirePathwayGroups() {
  // Already wired via onclick attributes
}

// ── Update stress highlight bar based on appState ────────────────────────────
function _atlasUpdateStressBar() {
  const bar = document.getElementById('atlasStressBar');
  const msg = document.getElementById('atlasStressBarMsg');
  if (!bar) return;

  const stress = (typeof appState !== 'undefined') ? appState.stressScores : null;
  const plant  = (typeof appState !== 'undefined') ? appState.plant : null;

  if (!stress || !plant) {
    if (msg) msg.textContent = 'Select a plant and location in Steps 1–2 to see stress-relevant pathways highlighted.';
    _atlasState._stressGroups = [];
    return;
  }

  const active = [];
  const chips  = [];

  // These previously read `stress.saltRisk` and `stress.vpdStress`. Neither has
  // ever been set by stressCompute: salinity was deliberately removed (coastal
  // proximity is not a salinity measurement) and the VPD field is called
  // `vpdPressure`. Both silently evaluated to 0, so the VPD half of the drought
  // condition could never fire and the salt branch was unreachable dead code.
  const heat    = stress.heatStress    ?? 0;
  const drought = stress.droughtMemory ?? 0;
  const vpd     = stress.vpdPressure   ?? 0;
  // Salinity enters ONLY from a measured soil EC the user supplied. It is never
  // inferred, so with no measurement this stays null and the branch stays off.
  const soilEC  = (typeof appState !== 'undefined' && appState.envData?.userSoilEC != null)
    ? appState.envData.userSoilEC : null;

  if (drought > 30 || vpd > 30) {
    active.push('drought_aba', 'cellulose_biomass', 'growth_productivity');
    if (drought > 30) chips.push({ label: `Water deficit / ABA pathways (deficit proxy ${drought})`, cls: 'active' });
    if (vpd > 30)     chips.push({ label: `Stomatal / VPD response (VPD stress ${vpd})`, cls: 'active' });
    // Previously "Osmolyte inhibitor risk elevated" — the osmolyte-to-inhibitor
    // link is a retired claim. Osmolyte accumulation is well supported; calling
    // those compounds fermentation inhibitors was not.
    chips.push({ label: 'Osmolyte accumulation pathways — literature-associated', cls: 'active' });
  }
  if (heat > 35) {
    active.push('heat_ros', 'photosynthesis_c4', 'growth_productivity');
    chips.push({ label: `Heat / ROS pathways (heat stress ${heat})`, cls: 'active' });
  }
  if (soilEC != null && soilEC > 4) {
    // 4 dS/m is the conventional threshold above which a soil is called saline.
    active.push('salt_ion', 'drought_aba');
    chips.push({ label: `Ion transport / salt tolerance (measured soil EC ${soilEC} dS/m)`, cls: 'active' });
  } else {
    chips.push({ label: 'Salt / ion pathways — UNKNOWN, needs a measured soil EC', cls: 'inactive' });
  }
  // Always relevant for bioenergy
  active.push('lignin_cellwall', 'secondary_metabolites');
  chips.push({ label: 'Lignin / Cell Wall — always relevant', cls: 'inactive' });

  _atlasState._stressGroups = [...new Set(active)];

  // Re-render pathway groups to apply highlighting
  const pathwayList = document.getElementById('atlasPathwayList');
  if (pathwayList && _atlasState.pathways) {
    pathwayList.innerHTML = _atlasState.pathways.pathwayGroups
      .map(g => _atlasRenderPathwayGroup(g, _atlasState.genes)).join('');
  }

  // Update stress bar
  if (msg) {
    msg.outerHTML = chips.map(c =>
      `<span class="atlas-stress-chip ${c.cls}">${escapeHtml(c.label)}</span>`
    ).join('') + (chips.length === 0
      ? '<span class="atlas-stress-none" id="atlasStressBarMsg">No stress data available.</span>'
      : '');
  }
}

// ── Public: called when user selects a plant region ───────────────────────────
function atlasSelectRegion(regionKey) {
  _atlasState.activeRegion = regionKey;

  // Update region button states
  document.querySelectorAll('.atlas-region-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.region === regionKey);
  });

  // Re-render pathway gene chips (counts/filter changes)
  const pathwayList = document.getElementById('atlasPathwayList');
  if (pathwayList && _atlasState.pathways) {
    pathwayList.innerHTML = _atlasState.pathways.pathwayGroups
      .map(g => _atlasRenderPathwayGroup(g, _atlasState.genes)).join('');
  }
}

// ── Public: toggle a pathway group accordion ──────────────────────────────────
function atlasToggleGroup(groupId) {
  _atlasState.activeGroup = (_atlasState.activeGroup === groupId) ? null : groupId;

  // Re-render pathway groups to update active state
  const pathwayList = document.getElementById('atlasPathwayList');
  if (pathwayList && _atlasState.pathways) {
    pathwayList.innerHTML = _atlasState.pathways.pathwayGroups
      .map(g => _atlasRenderPathwayGroup(g, _atlasState.genes)).join('');
  }
}

// ── Public: show gene detail panel ───────────────────────────────────────────
function atlasSelectGene(geneId) {
  const gene = _atlasState.genes.find(g => g.geneId === geneId);
  if (!gene) return;

  _atlasState.selectedGene = gene;

  // Update chip selection state + ring highlight
  document.querySelectorAll('.atlas-gene-chip').forEach(chip => {
    chip.classList.toggle('selected', chip.dataset.geneId === geneId);
  });

  // Show slide-in deep-dive panel
  _atlasShowGeneDetail(gene);

  // Right column: mini-state indicating panel is open
  const detail = document.getElementById('atlasGeneDetail');
  if (detail) {
    detail.innerHTML = `
      <div class="atlas-gene-detail-empty">
        <div class="atlas-gene-detail-empty-icon">🧬</div>
        <div style="font-size:13px;font-weight:700;color:var(--text1);font-family:var(--mono)">${escapeHtml(gene.symbol)}</div>
        <div class="atlas-gene-detail-empty-text" style="margin-top:3px">Detail panel open →</div>
      </div>`;
  }
}

// ── Slide-in gene detail panel ────────────────────────────────────────────────
function _atlasShowGeneDetail(gene) {
  const ev    = EVIDENCE_CONFIG[gene.evidenceLevel] || EVIDENCE_CONFIG['Homology-Based Projection'];
  const group = _atlasState.pathways?.pathwayGroups?.find(g => g.id === gene.pathwayGroup);

  // ── Expression table (only rendered if gene.expression data exists) ──
  let exprHtml = '';
  if (gene.expression) {
    const COND = { drought: 'Drought', heat: 'Heat', cold: 'Cold', normal: 'Normal' };
    const ARROWS = {
      up:        { sym: '↑', cls: 'up',   text: 'Up' },
      down:      { sym: '↓', cls: 'down', text: 'Down' },
      no_change: { sym: '→', cls: 'nc',   text: 'No change' },
    };
    const rows = Object.entries(COND).map(([key, label]) => {
      const val = gene.expression[key];
      if (!val) return '';
      const a = ARROWS[val] || { sym: '—', cls: 'nc', text: val };
      return `<tr>
        <td class="atlas-expr-cond">${escapeHtml(label)}</td>
        <td class="atlas-expr-val atlas-expr-${a.cls}">${a.sym} ${a.text}</td>
      </tr>`;
    }).filter(Boolean).join('');
    if (rows) {
      exprHtml = `
        <div class="atlas-dp-section">
          <div class="atlas-dp-label">Expression Levels</div>
          <table class="atlas-expr-table">
            <thead><tr><th>Condition</th><th>Level</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }
  }

  // ── Biofuel connection card ──
  const bioNote  = _atlasBiofuelNote(gene, group);
  const biofuelHtml = bioNote ? `
    <div class="atlas-dp-biofuel-card">
      <div class="atlas-dp-biofuel-title">⚡ Bioenergy Connection</div>
      <p class="atlas-dp-text">${escapeHtml(bioNote)}</p>
    </div>` : '';

  // ── Source citations (footnote-style) ──
  const sourceLinks = gene.sourceLinks || [];
  const sourcesHtml = sourceLinks.length ? `
    <div class="atlas-dp-section">
      <div class="atlas-dp-label">Sources</div>
      <div class="atlas-dp-sources">
        ${sourceLinks.map((url, i) => `
          <div class="atlas-dp-source-item">
            <span class="atlas-dp-source-num">${i + 1}</span>
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener"
               class="atlas-dp-source-link">${escapeHtml(_atlasDomainLabel(url))}</a>
          </div>`).join('')}
      </div>
    </div>` : '';

  // ── Compare button ──
  const cmpGene   = _atlasState.compareGene;
  const hasCompare = cmpGene && cmpGene.geneId !== gene.geneId;
  const compareBtnHtml = `
    <div class="atlas-dp-compare-wrap">
      <button class="atlas-dp-compare-btn" id="atlasDpCmpBtn"
              onclick="_atlasCompareAction('${escapeHtml(gene.geneId)}')">
        ${hasCompare ? `⚖ Compare with ${escapeHtml(cmpGene.symbol)}` : '⊕ Save to Compare'}
      </button>
    </div>`;

  // ── Remove any existing panel ──
  document.getElementById('atlasDpOverlay')?.remove();
  document.getElementById('atlasDpPanel')?.remove();

  // ── Inject overlay + panel ──
  document.body.insertAdjacentHTML('beforeend', `
    <div class="atlas-dp-overlay" id="atlasDpOverlay"
         onclick="_atlasCloseGeneDetail()"></div>
    <div class="atlas-dp-panel" id="atlasDpPanel"
         role="dialog" aria-modal="true"
         aria-label="Gene detail: ${escapeHtml(gene.symbol)}">

      <div class="atlas-dp-header">
        <div class="atlas-dp-header-text">
          <div class="atlas-dp-symbol">${escapeHtml(gene.symbol)}</div>
          <div class="atlas-dp-name">${escapeHtml(gene.name)}</div>
          <div class="atlas-dp-species-badge">🌿 Panicum virgatum — Switchgrass</div>
        </div>
        <button class="atlas-dp-close" onclick="_atlasCloseGeneDetail()"
                aria-label="Close gene detail panel">✕</button>
      </div>

      <div class="atlas-dp-body">
        <span class="atlas-evidence-badge ${escapeHtml(ev.cls)}"
              title="${escapeHtml(atlasTier(gene).meaning)}">
          <span aria-hidden="true">${atlasTier(gene).glyph}</span>
          Evidence ${escapeHtml(atlasTier(gene).short)} — ${escapeHtml(atlasTier(gene).label)}
        </span>
        ${atlasTier(gene).tier >= 4 ? `<div class="atlas-putative">
          <strong>Displayed as:</strong> ${escapeHtml(atlasDisplayName(gene))}.
          This is an inferred counterpart, not a characterised switchgrass gene. Nothing about its
          activity in a real plant has been observed here.</div>` : ''}

        <div class="atlas-dp-section">
          <div class="atlas-dp-label">Function</div>
          <p class="atlas-dp-text">${escapeHtml(gene.functionSummary)}</p>
        </div>

        ${exprHtml}
        ${biofuelHtml}
        ${sourcesHtml}
        ${compareBtnHtml}
      </div>
    </div>`);

  // Animate in next frame so CSS transition fires
  requestAnimationFrame(() => {
    document.getElementById('atlasDpPanel')?.classList.add('open');
    document.getElementById('atlasDpOverlay')?.classList.add('open');
  });
}

// ── Close gene detail panel ───────────────────────────────────────────────────
function _atlasCloseGeneDetail() {
  const panel   = document.getElementById('atlasDpPanel');
  const overlay = document.getElementById('atlasDpOverlay');
  if (!panel) return;

  panel.classList.remove('open');
  overlay?.classList.remove('open');

  setTimeout(() => { panel.remove(); overlay?.remove(); }, 300);

  // Remove selected chip ring
  document.querySelectorAll('.atlas-gene-chip').forEach(c => c.classList.remove('selected'));
  _atlasState.selectedGene = null;

  // Restore right panel empty state
  const detail = document.getElementById('atlasGeneDetail');
  if (detail) {
    detail.innerHTML = `
      <div class="atlas-gene-detail-empty">
        <div class="atlas-gene-detail-empty-icon">🧬</div>
        <div class="atlas-gene-detail-empty-text">
          Click a pathway group to expand it,<br>then click any gene chip to view details.
        </div>
      </div>`;
  }
}

// ── Compare action ─────────────────────────────────────────────────────────────
function _atlasCompareAction(geneId) {
  const gene = _atlasState.genes.find(g => g.geneId === geneId);
  if (!gene) return;

  const cmp = _atlasState.compareGene;
  if (cmp && cmp.geneId !== geneId) {
    // Both genes ready — show side-by-side modal
    _atlasShowCompareModal(cmp, gene);
  } else {
    // Save this gene and toast
    _atlasState.compareGene = gene;
    _atlasShowToast(`${gene.symbol} saved — click another gene to compare`);
    const btn = document.getElementById('atlasDpCmpBtn');
    if (btn) btn.textContent = `✓ ${gene.symbol} saved for comparison`;
  }
}

// ── Side-by-side comparison modal ────────────────────────────────────────────
function _atlasShowCompareModal(geneA, geneB) {
  document.getElementById('atlasCompareModal')?.remove();

  const evA  = EVIDENCE_CONFIG[geneA.evidenceLevel] || EVIDENCE_CONFIG['Homology-Based Projection'];
  const evB  = EVIDENCE_CONFIG[geneB.evidenceLevel] || EVIDENCE_CONFIG['Homology-Based Projection'];
  const grpA = _atlasState.pathways?.pathwayGroups?.find(g => g.id === geneA.pathwayGroup);
  const grpB = _atlasState.pathways?.pathwayGroups?.find(g => g.id === geneB.pathwayGroup);

  const tagRow = arr => (arr && arr.length)
    ? `<div class="atlas-gd-tags">${arr.map(t => `<span class="atlas-gd-tag">${escapeHtml(t.replace(/_/g,' '))}</span>`).join('')}</div>`
    : '<span style="color:var(--text3);font-style:italic;font-size:10px">—</span>';

  const row = (label, a, b) => `
    <tr>
      <td class="atlas-cmp-label">${label}</td>
      <td class="atlas-cmp-val">${a}</td>
      <td class="atlas-cmp-val">${b}</td>
    </tr>`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="atlas-cmp-backdrop" id="atlasCompareModal"
         onclick="if(event.target===this)_atlasCloseCompare()">
      <div class="atlas-cmp-modal">
        <div class="atlas-cmp-header">
          <div class="atlas-cmp-title">⚖ Gene Comparison</div>
          <button class="atlas-dp-close" onclick="_atlasCloseCompare()"
                  aria-label="Close comparison">✕</button>
        </div>
        <div class="atlas-cmp-body">
          <table class="atlas-cmp-table">
            <thead>
              <tr>
                <th class="atlas-cmp-th-label">Field</th>
                <th class="atlas-cmp-th-gene">${escapeHtml(geneA.symbol)}</th>
                <th class="atlas-cmp-th-gene">${escapeHtml(geneB.symbol)}</th>
              </tr>
            </thead>
            <tbody>
              ${row('Full Name', escapeHtml(geneA.name), escapeHtml(geneB.name))}
              ${row('Evidence',
                `<span class="atlas-evidence-badge ${evA.cls}">● ${escapeHtml(evA.label)}</span>`,
                `<span class="atlas-evidence-badge ${evB.cls}">● ${escapeHtml(evB.label)}</span>`)}
              ${row('Pathway',
                escapeHtml((grpA?.name||'') + (geneA.pathwayName ? ' — ' + geneA.pathwayName : '')),
                escapeHtml((grpB?.name||'') + (geneB.pathwayName ? ' — ' + geneB.pathwayName : '')))}
              ${row('Function', escapeHtml(geneA.functionSummary), escapeHtml(geneB.functionSummary))}
              ${row('Stress Links',     tagRow(geneA.stressLinks),    tagRow(geneB.stressLinks))}
              ${row('Bioenergy Links',  tagRow(geneA.bioenergyLinks), tagRow(geneB.bioenergyLinks))}
              ${row('Plant Regions',   tagRow(geneA.plantRegions),   tagRow(geneB.plantRegions))}
            </tbody>
          </table>
        </div>
        <div class="atlas-cmp-footer">
          <button class="atlas-dp-compare-btn" onclick="_atlasCloseCompare()">
            ✕ Clear &amp; Close
          </button>
        </div>
      </div>
    </div>`);
}

// ── Close comparison modal ────────────────────────────────────────────────────
function _atlasCloseCompare() {
  document.getElementById('atlasCompareModal')?.remove();
  _atlasState.compareGene = null;
  // Reset compare button if detail panel still open
  const btn = document.getElementById('atlasDpCmpBtn');
  if (btn && _atlasState.selectedGene) {
    btn.textContent = '⊕ Save to Compare';
    btn.onclick = () => _atlasCompareAction(_atlasState.selectedGene.geneId);
  }
}

// ── Toast notification ─────────────────────────────────────────────────────────
function _atlasShowToast(msg) {
  document.getElementById('atlasToast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'atlasToast';
  toast.className = 'atlas-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ── Biofuel connection note (derived from pathway group) ──────────────────────
function _atlasBiofuelNote(gene, group) {
  const NOTES = {
    lignin_cellwall:
      'Genes in this pathway directly control lignin deposition and cellulose synthesis in cell walls. ' +
      'Lower lignin and higher cellulose content mean more fermentable sugar — greater ethanol output per ton of switchgrass.',
    cellulose_biomass:
      'Cellulose-synthesis genes set the raw fermentable sugar content of switchgrass biomass. ' +
      'Higher cellulose fractions mean more glucose available for microbial fermentation into bioethanol.',
    drought_aba:
      'Drought-stress response genes govern water-use efficiency and sustained biomass production during dry years. ' +
      'Better drought tolerance keeps switchgrass productive even under Texas\'s irregular rainfall, protecting feedstock yield.',
    heat_ros:
      'Heat and ROS-management genes protect photosynthetic machinery through peak Texas summers. ' +
      'Plants that survive heat stress maintain biomass supply needed for year-round biorefinery operation.',
    photosynthesis_c4:
      'C4 photosynthesis genes underpin switchgrass\'s exceptional carbon-capture efficiency — up to 3× higher than C3 crops. ' +
      'Maximizing C4 performance directly increases dry-matter biomass available for ethanol or advanced biofuel conversion.',
    growth_productivity:
      'Growth regulators set the final biomass yield ceiling per acre. ' +
      'Genes promoting tiller count, stem elongation, and dry-matter accumulation directly scale the feedstock supply for biorefining.',
    salt_ion:
      'Ion-transport and salt-tolerance genes allow switchgrass to colonize marginal, saline soils unsuitable for food crops. ' +
      'Expanding the cultivable land base increases total biofuel feedstock without displacing existing agriculture.',
    secondary_metabolites:
      'Secondary metabolite pathways — especially phenylpropanoid biosynthesis — feed into lignin formation. ' +
      'Tuning these genes can reduce cell-wall recalcitrance and improve the efficiency of cellulosic ethanol production.',
  };

  if (NOTES[gene.pathwayGroup]) return NOTES[gene.pathwayGroup];
  if (group?.bioenergyRelevance) return group.bioenergyRelevance;
  const links = gene.bioenergyLinks || [];
  if (links.length) {
    return `This gene is linked to ${links.map(l => l.replace(/_/g,' ')).join(', ')}, ` +
      'which are key factors in bioenergy conversion and biomass quality in switchgrass.';
  }
  return null;
}

// ── Helper: extract readable domain from URL ──────────────────────────────────
function _atlasDomainLabel(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host;
  } catch {
    return url.length > 60 ? url.slice(0, 57) + '…' : url;
  }
}

// ── Called by bioenergy-engine / stress module after scoring updates ──────────
function atlasOnStressUpdate() {
  if (!_atlasState.loaded) return;
  _atlasUpdateStressBar();
}

// ── Called when plant selection changes ───────────────────────────────────────
function atlasOnPlantChange() {
  const container = document.getElementById('sc-atlas');
  if (!container || !_atlasState.loaded) return;
  _atlasRender(container);
}

// ── Global Escape handler (compare modal takes priority over detail panel) ────
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  if (document.getElementById('atlasCompareModal')) { _atlasCloseCompare(); return; }
  if (document.getElementById('atlasDpPanel'))       { _atlasCloseGeneDetail(); }
});
