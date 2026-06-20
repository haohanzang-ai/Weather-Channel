# TexasClimate — Competition Build Prompts
# Step-by-step prompts to insert into Claude/AI coding sessions.
# Each prompt is self-contained. Complete them in order for best results.

---

## STEP 1 — Interactive Map Zoom (Regions → Cities → Towns)
**File: js/map.js**

```
I'm building TexasClimate, a vanilla JS + HTML/CSS site on GitHub Pages using MapLibre GL.
The map is initialized in js/map.js as a MapLibre GL map with id "texasSVG", centered at
[-99.5, 31.0] zoom 5.2. The map already has weather overlay layers (rain, cloud, severe,
drought) toggled via _mapLayers and mapToggleLayer().

Add multi-level interactive zoom with these behaviors:

1. Define 5 named Texas regions as bounding boxes:
   - Panhandle: bounds [[-103.1, 34.3], [-99.9, 36.6]]
   - West Texas: bounds [[-106.7, 29.0], [-99.5, 34.3]]
   - Central Texas: bounds [[-100.0, 29.0], [-96.5, 33.0]]
   - East Texas: bounds [[-97.0, 29.5], [-93.5, 33.5]]
   - Gulf Coast: bounds [[-98.0, 25.8], [-93.5, 30.0]]

2. Add clickable region overlay buttons above the map (matching existing .map-layer-btn style,
   using CSS vars --accent, --text1, --card1). Clicking a region flies the map to that
   bounding box using _mlMap.fitBounds() with padding 40.

3. Add a breadcrumb bar below the region buttons that updates as the user zooms:
   - zoom < 6: shows "Texas"
   - zoom 6–8: shows "Texas > [Region Name]" (detect based on map center)
   - zoom > 8: shows "Texas > [Region] > [nearest city name]"
   Use _mlMap.on('moveend') to update the breadcrumb. Match the existing JetBrains Mono
   monospace style used throughout the site. Color: --text3 with --accent for separators.

4. Add a "Reset View" button that flies back to center [-99.5, 31.0] zoom 5.2.

Keep all existing layer functionality intact. Do not change _mapLayers or mapToggleLayer().
```

---

## STEP 2 — Agricultural Pollution Overlay
**File: js/map.js (add after Step 1)**

```
In js/map.js, the MapLibre GL map already has weather overlays (rain, cloud, severe, drought)
as circle layers added in _mlAddOverlaySources(). The toggle system uses _mapLayers object
and mapToggleLayer(layerName) which toggles layer visibility and .active class on
.map-layer-btn buttons.

Add 3 new pollution overlay layers using static county-level approximation data:

1. Define a static JS object POLLUTION_DATA (in map.js) with these Texas county centroids
   and intensity values (0.0–1.0):
   - Agricultural Runoff (key: 'runoff'): High in Rio Grande Valley (Hidalgo, Cameron,
     Starr counties ~0.9), Central (Bell, McLennan ~0.6), Panhandle (Deaf Smith, Castro ~0.8)
   - Pesticide Intensity (key: 'pesticide'): High in Panhandle (Lubbock, Hale, Floyd ~0.85),
     Lower Rio Grande Valley (~0.8), East Texas cotton belt (~0.65)
   - GHG Emissions (key: 'ghg'): High in Houston/Harris (~0.9), Midland/Odessa (~0.85),
     Dallas/Tarrant (~0.75), Corpus Christi/Nueces (~0.7)
   Use approximate lat/lon for each county center (look up real values).

2. Add each as a MapLibre circle layer with:
   - runoff: color #1A6B3A (dark green), opacity tied to intensity property
   - pesticide: color #8B4513 (brown), opacity tied to intensity
   - ghg: color #FF4500 (red-orange), opacity tied to intensity
   - radius expression same as existing _radiusExpr()

3. Add the 3 new toggle buttons to the map controls section in index.html alongside existing
   layer buttons. Use the same .map-layer-b3tn class and data-layer attribute. Label them:
   "🌊 Runoff", "🧪 Pesticide", "💨 GHG Emissions". Default state: off (not in _mapLayers).

4. On hover over any pollution circle, show a tooltip (using existing showTooltip/hideTooltip
   functions) that displays:
   - County name + pollution type + intensity level (Low/Moderate/High/Critical)
   - One-line comparison: "Biofuel crops here could reduce [X] type pollution by replacing
     conventional agriculture"

5. Add a small "Pollution vs. Biofuel" legend card below the map (match existing card styling
   with --card1 background, --accent border) explaining what each color represents.

Do not modify existing weather layer sources or the _mapLayers variable.
```

---

## STEP 3 — Plant Scanner: Land Survey & Survival Calculator
**File: js/scanner.js**

```
In js/scanner.js, after a plant is identified (user selects from SCAN_PLANTS and a result
card is shown), I need to add a "Site Suitability Analysis" section that surveys the user's
location and calculates survival probability.

The site already fetches climate data from Open-Meteo. The existing CSP allows
https://api.open-meteo.com and https://archive-api.open-meteo.com.

Add a function _surveyLand(plantKey, lat, lon) that:

1. Fetches climate normals for the given lat/lon from Open-Meteo archive API:
   URL: https://archive-api.open-meteo.com/v1/archive
   Params: latitude, longitude, start_date=2015-01-01, end_date=2024-12-31,
   daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration
   Aggregate to annual averages: avg annual precip (mm), avg max temp (°C), avg min temp (°C).

2. Cross-reference the plant's known tolerances from a static PLANT_TOLERANCES object you
   define inside scanner.js. Include at minimum these plants with real values:
   switchgrass, mesquite, eastern_redcedar, giant_miscanthus, agave, sorghum, hemp,
   eastern_gamagrass, sugarcanesorghumhybrid, bermudagrass.
   Each entry: { minTempC, maxTempC, minPrecipMm, maxPrecipMm, droughtTolerant: bool }

3. Calculate a Site Suitability Score (0–100):
   - Temp in range → +40 points
   - Precip in range → +40 points
   - Drought tolerance match → +20 points
   - Deduct points proportionally for how far outside range values fall.

4. Render a result card below the existing scanner output with:
   - Score displayed as a large number with color (green ≥ 70, yellow 40–69, red < 40)
   - Labeled breakdown: Temperature fit, Precipitation fit, Drought resilience
   - A one-sentence plain-language verdict: "This site is [excellent/marginal/unsuitable]
     for [Plant Name] based on 10-year climate averages."
   - 3 nearby alternative locations: pick from ALL_CITIES (already defined in data.js)
     the 3 cities with highest suitability scores for this plant, show as chips with scores.

5. The function is triggered by a "Analyze My Location" button added to the scanner result
   card. The button first calls navigator.geolocation.getCurrentPosition() to get lat/lon,
   then calls _surveyLand(). Show a loading spinner (match existing ls-dot animation style)
   while fetching.

Match the existing scanner card styles (.scanner-card, --card1, --accent colors).
```

---

## STEP 4 — User-Configurable Graph Builder
**File: new file js/graphbuilder.js + section in index.html**

```
I'm building TexasClimate on GitHub Pages with vanilla JS. The site already fetches live
weather data from Open-Meteo for 10 Texas cities. Data is stored in WEATHER_DATA[cityName]
(object with fields: temp, humidity, windSpeed, condition, precipAvg, et0Avg, aqi) and
FORECAST_DATA[cityName] (array of daily forecasts with temp, rain, condition fields).
Chart.js is available via CDN.

Create a new "Graph Builder" tab section. Add:

1. A new file js/graphbuilder.js with function graphBuilderInit(containerId) that renders
   a control panel + live chart area inside the given container div.

2. Control panel (left sidebar, ~280px, styled with --card1 background and --accent border):
   - Chart Type selector: Line, Bar, Scatter, Area (use styled radio buttons, not native select)
   - X-Axis selector: City (compare all 10 cities), Time (7-day forecast for selected city)
   - Y-Axis selector: Temperature (°C), Humidity (%), Wind Speed (km/h), Precipitation (mm),
     AQI, ET₀ Evapotranspiration
   - City picker (shown only when X = Time): dropdown of all 10 cities
   - "Generate Graph" button with --accent background
   - "Export PNG" button that calls chart.toBase64Image() and triggers download

3. Chart area (right side): render using Chart.js. Style the chart to match site theme:
   - Background: transparent
   - Grid lines: rgba(255,255,255,0.06)
   - Font: Inter (already loaded)
   - Colors: primary #4A90E2, secondary #5DDBA8
   - Legend and axis labels in --text2 color

4. Wire "Generate Graph": read control values, pull from WEATHER_DATA / FORECAST_DATA,
   build Chart.js datasets, destroy any existing chart instance, render new one.

5. Add a <div id="sc-graphbuilder"> section inside index.html in the appropriate tab
   (after the existing gene atlas section or as its own tab — match existing tab structure).
   Call graphBuilderInit('sc-graphbuilder') in the tab's activation handler.

Use JetBrains Mono for axis tick labels. Keep Chart.js CDN import in index.html only
(CSP already allows cdnjs.cloudflare.com).
```

---

## STEP 5 — Gene Deep-Dive Panel
**File: js/gene-atlas.js**

```
In js/gene-atlas.js, the gene atlas renders a list of genes from data/plant_genes_switchgrass.json.
The module state object _atlasState has a selectedGene field. When a gene row is clicked,
_atlasState.selectedGene is set but the deep-dive panel is not yet fully implemented.

Implement the full gene detail panel:

1. When a gene is clicked, call _atlasShowGeneDetail(gene) which renders a slide-in panel
   (position: fixed, right side, 380px wide on desktop / full-width on mobile) with:

   a. Header: gene symbol (JetBrains Mono, large), gene full name, organism badge
      ("Panicum virgatum — Switchgrass")
   b. Evidence badge: color-coded pill using EVIDENCE_CONFIG (already defined in gene-atlas.js)
   c. Function section: gene.function description rendered as paragraph text
   d. Expression table: if gene.expression exists, show a small table of conditions
      (drought, heat, cold, normal) vs. expression level (Up / Down / No change)
      with color-coded arrows (↑ green, ↓ red, → gray)
   e. Biofuel Connection card (--card1 bg, --accent left border): explain in 1–2 sentences
      how this gene's function connects to bioenergy (e.g., cell wall genes → cellulose
      content → ethanol yield). Derive this from gene.pathway or gene.group fields.
   f. Source citations: list gene.sources as linked footnotes (matching existing atlas
      evidence-dot styling)
   g. "Compare" button: if another gene is already in _atlasState.compareGene, show a
      side-by-side modal comparing the two genes across all fields above. Otherwise, set
      _atlasState.compareGene = current gene and show a toast: "Gene saved — click another
      to compare"

2. Panel closes on clicking an X button or pressing Escape. Use CSS transition (transform:
   translateX) for slide-in/out animation (matches site "motion that whispers" principle).

3. Add a thin "selected" highlight ring (--accent color) to the gene row that is currently
   open in the detail panel.

4. On mobile (<640px), the panel takes full screen width and slides up from the bottom
   (transform: translateY) instead of from the right.

Keep all existing region filter and pathway group filter functionality intact.
```

---

## STEP 6 — $10K Design Checklist: Typography & Hierarchy
**File: styles/base.css**

```
Apply "The $10K Design Checklist" principles to styles/base.css for TexasClimate, a dark-theme
bioenergy intelligence site. Current colors: bg #0b0f18, accent blue #4A90E2, accent green
#5DDBA8. Fonts: Inter (body/UI), JetBrains Mono (data/code). Do not change these.

Make the following targeted improvements:

1. TYPOGRAPHY SCALE — enforce a clear 6-step type scale with no rogue font sizes:
   --text-xs: 10px, --text-sm: 12px, --text-base: 14px, --text-md: 16px,
   --text-lg: 20px, --text-xl: 28px, --text-2xl: 40px
   Replace any hardcoded font-size values in base.css with these variables.

2. HIERARCHY — add consistent spacing tokens:
   --space-1: 4px, --space-2: 8px, --space-3: 12px, --space-4: 16px,
   --space-5: 24px, --space-6: 32px, --space-7: 48px, --space-8: 64px
   Apply to section padding, card gaps, and header margins.

3. CARD DEPTH — add a 3-level card system:
   --card1: current surface color
   --card2: slightly lighter (for nested content)
   --card3: for highlight / hover state
   Add a standard .card class with border-radius: 12px, padding: var(--space-5),
   background: var(--card1), border: 1px solid rgba(255,255,255,0.06).

4. MICRO-INTERACTIONS — add to base.css:
   - .btn transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease
   - .btn:hover: transform translateY(-1px), slight box-shadow lift
   - .btn:active: transform translateY(0)
   - All interactive elements: outline: 2px solid var(--accent) on :focus-visible
     (for accessibility, matches "invisible expensive stuff")

5. MOBILE — add a mobile-first breakpoint block at the bottom of base.css:
   @media (max-width: 640px) { }
   Inside it: reduce --text-xl to 22px, --text-2xl to 28px, set .card padding to
   var(--space-4), stack any .flex-row layouts to flex-direction: column.

Do not remove any existing rules. Only add or override. Comment each new section clearly.
```

---

## STEP 7 — Mobile Responsive Audit
**File: styles/scanner.css, styles/gene-atlas.css, styles/base.css**

```
TexasClimate is a dark-theme vanilla JS site. Audit and fix mobile layout for these 3 files.
Target breakpoints: 375px (iPhone SE) and 390px (iPhone 14).

In styles/scanner.css:
- The file upload / camera button should be width: 100% on mobile with min-height: 56px
  (touch target size)
- Scanner result cards (.scanner-card or equivalent) should have no horizontal overflow;
  set max-width: 100%, overflow-x: hidden
- Any side-by-side .flex or grid layout inside scanner results → stack to single column
  at max-width: 640px

In styles/gene-atlas.css:
- The gene table / gene grid should switch from table layout to card layout at 640px:
  each gene row becomes a .gene-card div with name, function, evidence badge stacked vertically
- Region filter buttons (the plant region pills: Leaf, Stem, Root, etc.) should wrap
  and be full-width scrollable row (overflow-x: auto, white-space: nowrap, -webkit-overflow-scrolling: touch)
- The atlas intro banner text should reduce font size by 2px steps on mobile

In styles/base.css:
- Add: * { -webkit-tap-highlight-color: transparent; } for cleaner mobile taps
- Ensure all touch targets are min 44x44px (add min-height: 44px to .btn, .tab-btn,
  .map-layer-btn)
- Navigation tabs: if there are more than 5 tabs, enable horizontal scroll
  (overflow-x: auto, scroll-snap-type: x mandatory, scroll-behavior: smooth)

Test mentally against 375px width. Flag any element wider than viewport.
```

---

## STEP 8 — GitHub Community + Social Content
**(Not a code prompt — content to post manually)**

**GitHub Discussions to create on your repo:**
1. Title: "📊 Data Sources & Methodology" — Body: explain Open-Meteo, USDA, EPA sources used
2. Title: "💡 Feature Requests" — Body: "What Texas environmental data would you add?"
3. Title: "🌱 How to Contribute Plant Data" — Body: link to plant_genes_switchgrass.json format

**GitHub Issues to open:**
- Label: `good first issue` — Title: "Add gene data for Giant Miscanthus (Miscanthus x giganteus)"
  Body: "Currently the gene atlas only covers switchgrass. Miscanthus is the second-highest
  priority bioenergy crop for Texas. Data can be sourced from Phytozome / Gramene databases."

**LinkedIn Post 1 (Technical):**
"Built a bioenergy intelligence platform for Texas using 6+ open data APIs and zero backend.
What I learned: plant-to-fuel conversion isn't just chemistry — it's geography. The same
switchgrass field in Lubbock vs. Houston has 40% different ethanol yield potential just
from rainfall and soil differences. Mapping that gap is what TexasClimate does.
Stack: Vanilla JS · Open-Meteo · MapLibre GL · USDA gene databases · GitHub Pages
#WebDev #Bioenergy #Texas #OpenData #CongressionalAppChallenge"

**LinkedIn Post 2 (Policy):**
"Agricultural pollution data should be on every bioenergy map — but it almost never is.
TexasClimate overlays runoff zones, pesticide intensity, and GHG emissions directly onto
the Texas plant suitability map. Why? Because the areas with the worst agricultural pollution
are often the best candidates for bioenergy crop replacement.
That's the argument I'm making to Congress. #ClimatePolicy #Bioenergy #Texas"

**LinkedIn Post 3 (Competition):**
"Competing in the Congressional App Challenge with TexasClimate — a plant-environment
intelligence platform built to help Texans understand bioenergy potential in their
own backyard. Real weather data. Real gene databases. Real impact.
Link in bio. #CongressionalAppChallenge #StudentDev #CleanEnergy"

---

## STEP 9 — Common App Project Summary (150 words)

```
Write a 150-word Common App activity description for this project:

Project: TexasClimate — Plant · Environment · Bioenergy Intelligence
Competition: Congressional App Competition
Stack: Vanilla JS, HTML/CSS, GitHub Pages (static, no backend)
APIs used: Open-Meteo (weather + air quality + archive), weather.gov (severe weather),
           MapLibre GL (interactive map), Google Analytics
Data: 36-plant bioenergy evidence engine, USDA/NREL sourced gene database for switchgrass
      (plant_genes_switchgrass.json), plant pathway data (plant_pathways.json)
Features: Photo-upload plant scanner with biofuel conversion prediction, interactive Texas
          map with weather + pollution overlays, gene atlas with clickable pathway visualization,
          land suitability calculator, user-configurable graph builder, full Spanish/English
          language toggle

Tone: Factual, specific, confident. Highlight technical depth (APIs, gene databases, real data),
real-world impact (farmers, students, policymakers), and competition context. Avoid vague
adjectives. Lead with the problem solved, not the tech used.
```

---

## STEP 10 — Final Polish & Performance
**File: index.html, all JS files**

```
TexasClimate is a GitHub Pages static site. Apply these final performance and polish improvements:

1. In index.html, add loading="lazy" to any <img> tags. Add fetchpriority="high" to the
   first visible above-fold image if one exists.

2. In js/gene-atlas.js, the gene data is already structured for lazy loading (fetched in
   atlasInit). Confirm the fetch is only triggered when the user first opens the Gene Atlas
   tab — not on page load. If it fires on page load, wrap the fetch inside the tab activation
   callback.

3. In index.html, add these meta tags if missing:
   <meta name="theme-color" content="#0b0f18">
   <link rel="apple-touch-icon" href="icon-192.png"> (create a placeholder if needed)
   <meta name="mobile-web-app-capable" content="yes">

4. Add a <noscript> fallback message after <body> open tag:
   <noscript>TexasClimate requires JavaScript for live weather data and interactive maps.
   Please enable JavaScript in your browser.</noscript>

5. In base.css, add: html { scroll-behavior: smooth; } and
   @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
   This handles accessibility for users who prefer no motion.

6. Verify the Google Analytics tag (G-EPP05BJFJ3) is only in <head> and not duplicated.
   It should be: <script async src="https://www.googletagmanager.com/gtag/js?id=G-EPP05BJFJ3">
   followed by the gtag() initialization block. Confirm CSP connect-src includes
   https://analytics.google.com and https://region1.google-analytics.com (already set).

Report any issues found.
```
