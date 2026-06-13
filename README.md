# 🌤 TexasClimate — Weather, Climate & Biofuel Intelligence Platform

> An open, single-page environmental intelligence dashboard for everyday people, students, farmers, and researchers — tracking weather and natural-disaster conditions, surfacing climate-change insights, and modeling the real-world case for **switchgrass biofuel** over corn and other feedstocks.

**🔗 Live demo:** https://haohanzang-ai.github.io/Weather-Channel/

![Status](https://img.shields.io/badge/status-active%20prototype-4A90E2)
![Built with](https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS%20%7C%20JS-F5A623)
![Charts](https://img.shields.io/badge/charts-Chart.js-2ECC8B)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## 🌍 What is this?

**TexasClimate** is a free, browser-based dashboard that brings four things people care about into one place you can check every day:

1. **Live-style weather & natural-disaster monitoring** — current conditions, 7-day forecasts, severe-weather watches and warnings (tornado, flash flood, heat, wind), and storm-probability outlooks.
2. **Climate-change insights** — multi-week temperature, humidity, and rainfall trends compared against climatological normals, so patterns (not just today's number) become visible.
3. **Climate impact on the environment** — air quality by city, reservoir and drought tracking, water-conservation guidance, and grid/energy demand under heat stress.
4. **A Switchgrass Biofuel Efficiency Lab** — a research-style explorer making the case for *Panicum virgatum* (switchgrass) as a cleaner, more efficient biofuel feedstock than corn.

It runs entirely in the browser as a single HTML file — no build step, no server, no install. Open it and it works.

---

## ✨ Features

| Area | What it does |
|------|--------------|
| **Dashboard** | Statewide overview, current conditions for 10 major cities, active alerts, and an AI-style daily digest |
| **Interactive Map** | Temperature-coded city markers — click any city for full details |
| **Forecasts** | 7-day per-city outlook with temperature charts and precipitation probabilities |
| **Agriculture** | Crop-by-crop conditions, drought coverage, irrigation demand, heat-stress risk |
| **🌿 Biofuel Lab** | Switchgrass deployment modeling, region scoring, and a switchgrass-vs-corn comparison |
| **Fuel Efficiency** | Energy-return and efficiency framing for biofuel feedstocks |
| **Climate Trends** | 30-day temperature & humidity trends, monthly rainfall history |
| **Air Quality** | AQI rankings by city with health guidance |
| **Water Resources** | Reservoir storage levels, drought severity, conservation stages by region |
| **Energy** | Grid demand, renewable mix, and cooling-demand index by city |
| **Severe Weather** | Active watches/warnings and 24-hour storm probabilities |
| **City Comparison** | Side-by-side metrics across cities |
| **AI Reports** | Auto-generated daily, agricultural, and weekly climate summaries |

Plus: fully responsive (desktop → mobile), keyboard-navigable, screen-reader friendly, and a reduced-motion mode for accessibility.

---

## 🌿 The Switchgrass Biofuel Efficiency Lab

The heart of this project's "why it matters" story. The lab explores why **switchgrass is a strong candidate to outperform corn** as a biofuel feedstock — a case grounded in published agronomic research:

- **Higher net energy return.** As a cellulosic feedstock, switchgrass yields far more usable energy per unit of energy invested than corn-grain ethanol, whose net energy balance is close to break-even. Field research (e.g., Schmer et al., *PNAS*, 2008) reported switchgrass producing several times more renewable energy than was consumed to grow and process it.
- **Doesn't compete with food.** Corn ethanol diverts a food crop into fuel; switchgrass is a non-food perennial grass, sidestepping the "food vs. fuel" tradeoff.
- **Grows on marginal land.** Switchgrass thrives on land poorly suited to row crops, reducing pressure to convert productive farmland.
- **Lower inputs.** Less fertilizer, pesticide, and irrigation than corn, lowering both cost and environmental footprint.
- **Soil & climate benefits.** Deep perennial roots build soil carbon, curb erosion, and support large lifecycle greenhouse-gas reductions versus gasoline.
- **Plant once, harvest for years.** A perennial stand can be harvested for roughly a decade, versus annual replanting for corn.

> ⚠️ **Prototype disclaimer:** The Biofuel Lab's regional scores and predictions are **AI-generated, illustrative mock values** based on published agronomic literature — not commercial forecasts. "HAL2" and "FIL2" refer to *Panicum hallii* model ecotypes used in laboratory research, not commercial switchgrass varieties. Nothing here is investment, agronomic, or policy advice.

---

## 🛠 Tech stack

- **Plain HTML, CSS, and JavaScript** — a single self-contained `index.html`, no framework or bundler
- **[Chart.js](https://www.chartjs.org/)** for data visualizations (loaded via CDN)
- **Google Fonts** (Inter + JetBrains Mono) via CDN
- Accessibility-first markup: ARIA roles, live regions, skip links, keyboard support, and `prefers-reduced-motion`

---

## 🚀 Getting started

No installation required.

**Just view it:**
```
Download index.html → double-click it → it opens in your browser.
```

**Run a local live-reload server (optional, for editing):**
```bash
# Option A — VS Code: install the "Live Server" extension,
# then right-click index.html → "Open with Live Server"

# Option B — Python (built in on most systems):
python -m http.server 8000
# then visit http://localhost:8000
```

> An internet connection is needed for charts and fonts, which load from a CDN.

---

## 🗺 Roadmap — great first contributions

This is a prototype: the data is currently built-in sample data designed to demonstrate the interface. The biggest opportunity is wiring it up to **real, live sources**. Help wanted:

- [ ] Live weather + alerts from the **National Weather Service / NOAA API**
- [ ] Real air quality from **OpenAQ** or **AirNow**
- [ ] Live grid demand from the **ERCOT** public dashboard
- [ ] Drought data from the **U.S. Drought Monitor**
- [ ] Reservoir levels from **Water Data for Texas**
- [ ] Expand the Biofuel Lab with citation-linked, peer-reviewed datasets
- [ ] Add unit selection (°F/°C) and additional states/regions
- [ ] Persistent user preferences and saved cities

---

## 🤝 Contributing

Contributions of every size are welcome — code, data sources, accessibility fixes, documentation, or design ideas.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-idea`
3. Commit your changes: `git commit -m "Add your idea"`
4. Push: `git push origin feature/your-idea`
5. Open a Pull Request describing what you changed and why

Found a bug or have a feature request? [Open an issue](../../issues) — even a rough one helps.

---

## 📊 Data & accuracy disclaimer

This dashboard is an **educational prototype**. Current values are illustrative sample data, not a live operational feed. Do **not** use it for emergency decision-making — always rely on official sources such as the National Weather Service, local emergency management, and the EPA for real-time safety information.

---

## 📄 License

Released under the **MIT License** — free to use, modify, and share. (Add a `LICENSE` file to the repo to make this official.)

---

## 🙌 Acknowledgments

Built as an open exploration of how everyday climate awareness and next-generation biofuel science can live in one accessible, no-cost tool. Switchgrass research framing draws on the broader cellulosic-biofuel and agronomy literature.

*If this project is useful to you, a ⭐ on the repo helps others find it.*
