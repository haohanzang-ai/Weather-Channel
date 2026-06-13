# TexasClimate Intelligence Platform

Real-time weather dashboard for 10 Texas cities — live data, no API key, no cost.

**[→ Open the live site](https://haohanzang-ai.github.io/Weather-Channel/)**

---

## What it does

Pulls current conditions and 7-day forecasts for Austin, Houston, Dallas, San Antonio, Fort Worth, El Paso, Arlington, Corpus Christi, Plano, and Lubbock — all at once, refreshing every 10 minutes automatically.

Data comes from [Open-Meteo](https://open-meteo.com/) (free, no sign-up, CORS-friendly). No backend, no database, no API key to manage.

## What's inside

| Tab | What you get |
|-----|-------------|
| Dashboard | Live conditions for all 10 cities — temp, humidity, wind, UV, AQI, pressure |
| Interactive Map | SVG Texas map with clickable city markers and 7-day forecast popups |
| Forecasts | Per-city 7-day forecast with precipitation probability and temp chart |
| Air Quality | US AQI readings with health context |
| Agriculture | Heat stress, drought, irrigation, and crop suitability indices |
| Severe Weather | Storm and hazard tracking |
| Water Resources | Drought and water condition indicators |
| Energy Intelligence | Energy demand estimates by weather condition |
| Climate Trends | 7-day temperature trend charts by city |
| City Comparison | Side-by-side comparison across cities |
| Switchgrass Biofuel Lab | Biofuel yield modeling by weather conditions |
| Fuel Efficiency Center | Vehicle efficiency estimates by temperature and conditions |
| AI Reports | Weather narrative summaries |

## Stack

- Vanilla JS, HTML, CSS — no framework
- [Open-Meteo Forecast API](https://api.open-meteo.com) for weather + daily forecasts
- [Open-Meteo Air Quality API](https://air-quality-api.open-meteo.com) for US AQI
- Chart.js for graphs
- Hosted on GitHub Pages

## Run it locally

No build step needed.

```bash
git clone https://github.com/haohanzang-ai/Weather-Channel.git
cd Weather-Channel
git checkout fix/interaction
# open index.html in your browser
```

Or with a local server to avoid any CORS quirks:

```bash
npx serve .
```

## Contributing

If something looks wrong, a metric seems off, or you have an idea — open a [Discussion](https://github.com/haohanzang-ai/Weather-Channel/discussions) or a PR. Branch off `fix/interaction`.

---

Built for Texas. Data refreshes every 10 minutes.
