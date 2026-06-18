'use strict';

// ── Init ──────────────────────────────────────────────────────────────────────
if(window.Chart) Chart.defaults.font.family = "'JetBrains Mono', monospace";

// Load persisted settings before first fetch (so units/theme are applied immediately)
loadSettings();

populateForecastSelect();
updateClock();
setInterval(updateClock, 1000);

// Initial data fetch — auto-refresh interval is managed by settings module
fetchAllWeatherData();

// Start dashboard biofuel fact widget
biofactInit();

// Initialize location measurement UI
locInit();

// Populate the Analyze tab plant dropdown (SCAN_PLANTS available from scanner.js)
if (typeof _analyzeBuildPlantDropdown === 'function') _analyzeBuildPlantDropdown();

// Build sub-tab navigation bars for all pages
subtabsInit();

// Initialize workflow step status badges + make pipeline diagram clickable
if (typeof wfInit === 'function') wfInit();
