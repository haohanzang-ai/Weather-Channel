'use strict';

// ── Init ──────────────────────────────────────────────────────────────────────
if(window.Chart) Chart.defaults.font.family = "'JetBrains Mono', monospace";
populateForecastSelect();
renderDashboard();
updateClock();
setInterval(updateClock, 1000);
