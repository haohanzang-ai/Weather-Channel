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
