'use strict';

// ── Plant Gene & Pathway Atlas ────────────────────────────────────────────────
// Data is loaded from data/plant_pathways.json and data/plant_genes_switchgrass.json
// Biology is sourced from published databases and peer-reviewed literature only.
// No gene, pathway, or function was invented without a cited source.

const ATLAS_DATA_PATHS = {
  pathways: 'data/plant_pathways.json',
  genes:    'data/plant_genes_switchgrass.json',
};

// Module state
const _atlasState = {
  pathways: null,
  genes: null,
  loaded: false,
  activeRegion: null,   // 'all' | region key
  activeGroup: null,    // pathway group id
  selectedGene: null,   // gene record
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

const EVIDENCE_CONFIG = {
  'Peer-Reviewed Literature':   { cls: 'peer',     label: 'Peer-Reviewed Literature',   dot: '#5DDBA8' },
  'Curated Database Reference': { cls: 'curated',  label: 'Curated Database',           dot: '#4A90E2' },
  'Homology-Based Projection':  { cls: 'homology', label: 'Homology-Based Projection',  dot: '#F5A623' },
  'Environment-Relevance Estimate': { cls: 'estimate', label: 'Environment-Relevance Estimate', dot: '#E57373' },
};

// ── Public init (called from index.html after DOM ready) ──────────────────────
function atlasInit(containerId) {
  const container = document.getElementById(containerId || 'sc-atlas');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="tab-subsection-header">🧬 Plant Gene &amp; Pathway Atlas
      <span class="tsh-badge">Curated Database</span>
    </div>
    <div style="padding:24px;color:var(--text3);font-size:11px;text-align:center">
      Loading gene atlas data…
    </div>`;

  Promise.all([
    fetch(ATLAS_DATA_PATHS.pathways).then(r => r.json()),
    fetch(ATLAS_DATA_PATHS.genes).then(r => r.json()),
  ]).then(([pathwayData, geneData]) => {
    _atlasState.pathways = pathwayData;
    _atlasState.genes    = geneData.genes || [];
    _atlasState.loaded   = true;
    _atlasState.activeRegion = 'all';
    _atlasRender(container);
  }).catch(err => {
    container.innerHTML = `
      <div class="tab-subsection-header">🧬 Plant Gene &amp; Pathway Atlas</div>
      <div style="padding:20px;color:var(--text3);font-size:11px">
        Gene atlas data could not be loaded. Ensure data/plant_pathways.json and
        data/plant_genes_switchgrass.json are present.
        <br><small style="opacity:0.6">${err.message}</small>
      </div>`;
  });
}

// ── Render the full atlas UI ──────────────────────────────────────────────────
function _atlasRender(container) {
  const pd = _atlasState.pathways;
  const genes = _atlasState.genes;

  // Determine which plant is selected
  const plantKey = (typeof appState !== 'undefined' && appState.plant?.key) || null;
  const isSwitchgrass = !plantKey || plantKey === 'switchgrass';

  // Build the full section
  const html = `
    <div class="tab-subsection-header">🧬 Plant Gene &amp; Pathway Atlas
      <span class="tsh-badge">Curated Database</span>
    </div>
    <div class="atlas-wrap" id="atlasWrap">

      ${isSwitchgrass ? _atlasRenderMain(pd, genes) : _atlasRenderFallback(plantKey)}

    </div>`;

  container.innerHTML = html;

  if (!isSwitchgrass) return;

  // Wire up interactions after DOM insertion
  _atlasWireRegions();
  _atlasWirePathwayGroups();
  _atlasUpdateStressBar();
}

// ── Fallback for non-switchgrass plants ──────────────────────────────────────
function _atlasRenderFallback(plantKey) {
  const name = (typeof appState !== 'undefined' && appState.plant?.name) || (plantKey || 'this plant');
  return `
    <div class="atlas-fallback">
      <div class="atlas-fallback-title">🧬 Gene Atlas — ${escapeHtml(name)}</div>
      <p>Detailed gene atlas is currently available for <strong>switchgrass (<em>Panicum virgatum</em>)</strong> only.</p>
      <p style="margin-top:8px;color:var(--text3);font-size:10.5px">
        Other species support can be added later using curated databases such as Phytozome, Gramene, Plant Reactome, and KEGG.<br>
        Select <strong>Switchgrass</strong> in Step 1 to explore the full atlas.
      </p>
    </div>`;
}

// ── Main atlas render (switchgrass) ──────────────────────────────────────────
function _atlasRenderMain(pd, genes) {
  const groups = pd.pathwayGroups;
  const totalGenes = genes.length;
  const peerCount = genes.filter(g => g.evidenceLevel === 'Peer-Reviewed Literature').length;
  const curatedCount = genes.filter(g => g.evidenceLevel === 'Curated Database Reference').length;

  return `
    <!-- Intro banner -->
    <div class="atlas-intro">
      <div class="atlas-species-badge">🌿 Panicum virgatum — Switchgrass</div>
      <div class="atlas-intro-title">🧬 Plant Gene &amp; Pathway Atlas</div>
      <div class="atlas-intro-desc">
        Explore how environmental stress connects to plant pathways, genes, survival, productivity,
        and bioenergy conversion — for switchgrass (<em>Panicum virgatum</em>), Texas's primary candidate bioenergy crop.
        Click a pathway group to expand it, then click any gene chip to see its function, evidence level, and source.
      </div>
      <div class="atlas-intro-note">
        TexasClimate begins with a curated pathway-focused gene atlas for switchgrass, prioritizing genes most relevant
        to environmental stress, survival, biomass formation, and bioenergy conversion. The database is designed to scale,
        but the current version focuses on explainable, source-linked biology instead of raw gene quantity.
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
      ${Object.entries(EVIDENCE_CONFIG).map(([k, v]) => `
        <span class="atlas-legend-item">
          <span class="atlas-legend-dot" style="background:${v.dot}"></span>
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
      <strong style="color:var(--text2)">Important:</strong>
      This atlas does <em>not</em> claim to detect gene expression from weather data or scanned images.
      "Relevant pathway" means the pathway is biologically important under this type of stress, based on published plant physiology —
      not that any gene has been measured as active right now.
      Expression or lab data is needed to confirm actual pathway activity in a specific plant under field conditions.
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
                const ev = EVIDENCE_CONFIG[g.evidenceLevel];
                const isPeer = g.evidenceLevel === 'Peer-Reviewed Literature';
                return `<button class="atlas-gene-chip${isPeer ? ' peer-lit' : ''}"
                                data-gene-id="${escapeHtml(g.geneId)}"
                                title="${escapeHtml(g.name)} — ${escapeHtml(g.evidenceLevel)}"
                                onclick="atlasSelectGene('${escapeHtml(g.geneId)}')">
                  ${escapeHtml(g.symbol)}
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

  const heat    = stress.heatStress    ?? 0;
  const drought = stress.droughtMemory ?? 0;
  const salt    = stress.saltRisk      ?? 0;  // may be null if no salt data
  const vpd     = stress.vpdStress     ?? 0;

  if (drought > 30 || vpd > 30) {
    active.push('drought_aba', 'cellulose_biomass', 'growth_productivity');
    chips.push({ label: `Drought / ABA (score: ${drought})`, cls: 'active' });
    chips.push({ label: 'Osmolyte inhibitor risk elevated', cls: 'active' });
  }
  if (heat > 35) {
    active.push('heat_ros', 'photosynthesis_c4', 'growth_productivity');
    chips.push({ label: `Heat / ROS (score: ${heat})`, cls: 'active' });
  }
  if (salt > 25) {
    active.push('salt_ion', 'drought_aba');
    chips.push({ label: `Salt stress (estimate: ${salt})`, cls: 'active' });
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

  // Mark all chips; deselect others
  document.querySelectorAll('.atlas-gene-chip').forEach(chip => {
    chip.classList.toggle('selected', chip.dataset.geneId === geneId);
  });

  const detail = document.getElementById('atlasGeneDetail');
  if (!detail) return;

  const ev = EVIDENCE_CONFIG[gene.evidenceLevel] || EVIDENCE_CONFIG['Homology-Based Projection'];
  const group = _atlasState.pathways?.pathwayGroups?.find(g => g.id === gene.pathwayGroup);

  const stressTags = (gene.stressLinks || [])
    .map(s => `<span class="atlas-gd-tag stress">${escapeHtml(s.replace(/_/g, ' '))}</span>`).join('');
  const bioTags = (gene.bioenergyLinks || [])
    .map(s => `<span class="atlas-gd-tag bio">${escapeHtml(s.replace(/_/g, ' '))}</span>`).join('');
  const regionTags = (gene.plantRegions || [])
    .map(s => `<span class="atlas-gd-tag region">${escapeHtml(s.replace(/_/g, ' '))}</span>`).join('');

  const sourceLinks = (gene.sourceLinks || []).map(url => {
    const domain = _atlasDomainLabel(url);
    return `<div class="atlas-gd-source-item">→ <a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(domain)}</a></div>`;
  }).join('');

  detail.innerHTML = `
    <div class="atlas-gene-detail">
      <div class="atlas-gd-header">
        <div class="atlas-gd-symbol">${escapeHtml(gene.symbol)}</div>
        <div class="atlas-gd-name">${escapeHtml(gene.name)}</div>
        <div class="atlas-gd-species"><em>${escapeHtml(gene.species)}</em></div>
        <span class="atlas-evidence-badge ${ev.cls}">● ${escapeHtml(ev.label)}</span>
      </div>

      ${group ? `
      <div class="atlas-gd-section">
        <div class="atlas-gd-section-label">Pathway</div>
        <div class="atlas-gd-section-body">
          <span style="color:${group.colorHex}">${group.icon}</span>
          ${escapeHtml(group.name)} — ${escapeHtml(gene.pathwayName)}
        </div>
      </div>` : ''}

      <div class="atlas-gd-section">
        <div class="atlas-gd-section-label">Function</div>
        <div class="atlas-gd-section-body">${escapeHtml(gene.functionSummary)}</div>
      </div>

      ${stressTags ? `
      <div class="atlas-gd-section">
        <div class="atlas-gd-section-label">Stress Relevance</div>
        <div class="atlas-gd-tags">${stressTags}</div>
      </div>` : ''}

      ${bioTags ? `
      <div class="atlas-gd-section">
        <div class="atlas-gd-section-label">Bioenergy Relevance</div>
        <div class="atlas-gd-tags">${bioTags}</div>
      </div>` : ''}

      ${regionTags ? `
      <div class="atlas-gd-section">
        <div class="atlas-gd-section-label">Plant Regions</div>
        <div class="atlas-gd-tags">${regionTags}</div>
      </div>` : ''}

      <div class="atlas-gd-section">
        <div class="atlas-gd-section-label">Evidence &amp; Source</div>
        <div class="atlas-gd-section-body" style="font-size:10.5px">
          ${escapeHtml(gene.orthologSource || gene.evidenceLevel)}
        </div>
        <div class="atlas-gd-sources" style="margin-top:4px">${sourceLinks}</div>
      </div>

      ${gene.requiresLabValidation ? `
      <div class="atlas-lab-note">
        ⚠ Expression or lab data is needed to confirm activity of this gene under specific field conditions.
        Environmental conditions suggest this pathway may be important, but gene-level activity has not been directly
        measured from weather data or plant images.
      </div>` : ''}

      <div class="atlas-limit-note">
        ${escapeHtml(gene.limitationNote || 'No additional limitation notes.')}
      </div>
    </div>`;
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
