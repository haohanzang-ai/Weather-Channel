'use strict';

// ── Init ──────────────────────────────────────────────────────────────────────
if(window.Chart) Chart.defaults.font.family = "'JetBrains Mono', monospace";
populateForecastSelect();
updateClock();
setInterval(updateClock, 1000);

// Fetch live weather on load, then auto-refresh every 10 minutes
fetchAllWeatherData();
setInterval(fetchAllWeatherData, 10 * 60 * 1000);
