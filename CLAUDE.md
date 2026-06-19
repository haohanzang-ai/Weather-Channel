# TexasClimate — Congress App Competition Master Plan

## Project Overview
**Name:** TexasClimate — Plant · Environment · Bioenergy Intelligence  
**Stack:** Vanilla JS, HTML/CSS, GitHub Pages (static)  
**Google Analytics ID:** G-EPP05BJFJ3  
**Competition:** Congress App Competition (congressional district student coding competition)  
**Goal:** Win by demonstrating technical depth, real-world impact, and polished UX

## Existing Features (✅ Done)
- Language syncing across the whole site
- Map displays for location-based tabs (cities)
- Photo + file upload to identify plant, predict energy production
- Plant gene index connection (gene-atlas.js) — isolates genes and responses
- Mission/pursuit/goal defined (mission.js)
- Google Analytics set up (G-EPP05BJFJ3 in index.html)

## Active Checklist — "The $10K Checklist" Design Standards
The competition cares about **both** technical merit AND design quality. Apply these to every page:

1. **Point of view, not a template** — Site needs a clear voice/identity, not generic
2. **Typography that does work** — Inter + JetBrains Mono already used; tighten hierarchy
3. **A restrained color system** — Current: #4A90E2 (blue), #5DDBA8 (green), #0b0f18 (bg). Stay disciplined.
4. **Hierarchy that breathes** — More whitespace, cleaner section divisions
5. **Imagery with intent** — Every visual should communicate data, not decorate
6. **Motion that whispers** — Subtle animations (like loading screen) are good; add micro-interactions
7. **Mobile that's designed, not shrunk** — Full responsive audit needed
8. **The invisible expensive stuff** — Performance (CSP already set), accessibility, SEO

---

## Open TODO Items (Priority Order)

### 🔴 HIGH PRIORITY — Tech Features

#### 1. Plant Scanner → Land Survey & Survival Calculator
**File:** `js/scanner.js`  
**Goal:** After plant is identified, survey surrounding land conditions and calculate:
- Optimal planting location within user's area
- Survival probability (%) based on soil type, rainfall, temp range, elevation
- Recommended zone within Texas (cross-reference map)  
**Implementation:**
- Use Open-Meteo climate normals API for historical temperature/precipitation at lat/lon
- Cross-reference USDA Plant Hardiness Zones (static JSON lookup)
- Add a "Site Suitability Score" card with color-coded output (green/yellow/red)
- Show top 3 alternative locations nearby if current site is suboptimal

#### 2. Agricultural Pollution Overlay on Map
**File:** `js/map.js`  
**Goal:** Layer onto the Texas map:
- Agricultural runoff zones (USDA/EPA data or static approximation)
- Pesticide misuse hotspots (cross-reference known agricultural regions)
- Greenhouse gas emission intensity by county
- Comparison panel: "How does this area compare to clean biofuel baseline?"  
**Implementation:**
- Add toggle buttons for each pollution layer (like existing `_mapLayers` toggles)
- Use county-level static GeoJSON with color-coded intensity
- Source: EPA EnviroMapper data (can be fetched or bundled as JSON)
- Add a "Pollution vs. Biofuel" comparison tooltip on hover

#### 3. Interactive Texas Map Zoom (Regions → Cities → Suburbs → Rural → Towns)
**File:** `js/map.js`  
**Goal:** Multi-level zoom with SVG pan/zoom  
**Implementation:**
- Add SVG viewBox animation (CSS transform: scale + translate) for zoom
- Define zoom levels: State → Region (West/Central/East/Gulf/Panhandle) → Metro → City → Town
- Each level reveals more detail (more city pins, smaller area labels)
- Use mouse wheel + pinch-to-zoom (touch events)
- Breadcrumb nav: "Texas > Gulf Coast > Houston Metro > Sugar Land"

#### 4. User-Configurable Graph Builder
**Goal:** Let user pick chart type, axes, and data source; site auto-generates it  
**Implementation:**
- Sidebar panel: select Chart Type (line, bar, scatter, area, pie)
- Select X-axis: time range, city, plant species
- Select Y-axis: temperature, rainfall, air quality, biofuel yield, gene expression
- Pull from existing live data already fetched in `js/data.js`
- Use Chart.js (already allowed in artifacts) or vanilla canvas
- "Export as PNG" button

#### 5. Gene Deep-Dive — Clickable Gene Detail Panel
**File:** `js/gene-atlas.js`  
**Goal:** Click any gene → expand full in-depth panel  
**Already partially done** (selectedGene state exists)  
**Add:**
- Full gene function description with sourced citations
- Expression levels under different stress conditions (drought, heat, cold)
- Linked metabolic pathway visualization (mini flowchart)
- Cross-links to relevant biofuel pathway (e.g., "This gene affects cellulose content → impacts ethanol yield")
- "Compare genes" feature: select 2 genes, side-by-side comparison

---

### 🟡 MEDIUM PRIORITY — Impact Magnitude

#### 6. GitHub Community Posts
**Goal:** Show open-source community engagement (judges love this)  
**Implementation:**
- Create `/discussions` on the GitHub repo with:
  - "How to contribute plant data" thread
  - "Feature requests" thread  
  - "Data sources and methodology" thread
- Add a "Community" section to the website that links to GitHub Discussions
- Pin a "Good First Issue" labeled issue about adding a new plant species

#### 7. LinkedIn Posts (3-post series)
**Draft content:**
- Post 1: "Built a bioenergy intelligence platform for Texas using open data APIs — here's what I learned about plant-to-fuel conversion pathways" (technical deep-dive)
- Post 2: "Why agricultural pollution data should be overlaid on every bioenergy map" (policy angle, Congress App Competition relevance)
- Post 3: "Competing in the Congressional App Challenge — building tools for real environmental impact" (competition visibility)

#### 8. Instagram Content
- Story series: "Did you know [biofuel fact]?" (pull from existing facts.js)
- Reel: screen recording of the interactive map + plant scanner
- Carousel: "5 plants that could power Texas" with yield data from the scanner

#### 9. Common App Essay Explanation
**Goal:** Document this project for college applications  
**Write a 150-word summary covering:**
- Problem: Texas agricultural waste and bioenergy potential
- Solution: Real-time plant-environment intelligence platform
- Impact: Educational tool for students, farmers, policymakers
- Tech: Vanilla JS, 6+ open APIs, gene databases, 36-plant evidence engine
- Recognition: Congressional App Competition entry

---

### 🟢 LOWER PRIORITY — Polish

#### 10. Mobile Responsive Audit
- Test every tab on 375px (iPhone SE) and 390px (iPhone 14) widths
- Fix map SVG overflow on small screens
- Gene atlas table → card layout on mobile
- Scanner upload button → full-width on mobile

#### 11. Performance Pass
- Lazy-load gene data JSON (already structured for this in gene-atlas.js)
- Add `loading="lazy"` to any images
- Minify CSS for production

---

## Key Files Reference
```
index.html          — Main entry, Google Analytics, CSP, all tabs
js/scanner.js       — Plant scanner (36 plants, energy prediction)
js/gene-atlas.js    — Gene/pathway atlas (clickable genes — needs deep-dive panel)
js/map.js           — Texas SVG map (needs zoom levels + pollution overlays)
js/data.js          — Live data fetching (Open-Meteo, weather.gov)
js/compare.js       — Comparison tools
js/bioenergy-engine.js — Biofuel conversion calculations
js/mission.js       — Mission/purpose page
styles/base.css     — Core design system
styles/scanner.css  — Scanner component styles
styles/gene-atlas.css — Gene atlas styles
```

## APIs Already Connected
- Open-Meteo (weather, air quality, archive)
- weather.gov (severe weather)
- Google Analytics (G-EPP05BJFJ3)
- Plant pathways: `data/plant_pathways.json`
- Gene data: `data/plant_genes_switchgrass.json`

## Competition Scoring Angles
Congressional App Competition judges typically care about:
1. **Usefulness** — Does it solve a real constituent problem? ✅ (bioenergy + environment)
2. **Technical complexity** — Multiple APIs, gene databases, real-time data ✅
3. **Design quality** — Apply $10K checklist
4. **Community impact** — GitHub engagement, social media presence (TODO)
5. **Presentation** — Demo video + writeup (TODO)

## Next Session Priority
Start with **Item 3 (Map Zoom)** and **Item 2 (Pollution Overlay)** — these are the most visually impressive for judges and build on existing map.js infrastructure.
