'use strict';

// ── TexasClimate Settings Module ──────────────────────────────────────────────

const SETTINGS_KEY = 'tc_settings_v1';
const DEFAULTS = {
  theme:         'blue',     // blue | teal | amber | rose | violet | mint
  bg:            'dark',     // dark | midnight | slate | charcoal
  fontSize:      'medium',   // small | medium | large
  units:         'imperial', // imperial | metric
  complexity:    'standard', // simple | standard | expert
  lang:          'en',       // en | es | fr | pt | de
  refreshMin:    10,         // 5 | 10 | 20 | 30
  reducedMotion: false,
  highContrast:  false
};

let _cfg = {...DEFAULTS};

// ── Persistence ───────────────────────────────────────────────────────────────

function loadSettings(){
  try { _cfg = {...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}; }
  catch(e){ _cfg = {...DEFAULTS}; }
  applySettings();
}

function save(k, v){
  _cfg[k] = v;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(_cfg)); } catch(e){}
  applySettings();
  // Re-render the active tab so unit/complexity changes are visible immediately
  const active = document.querySelector('.nav-item[aria-current="page"]');
  if(active && active.dataset.page !== 'settings'){
    showPage(active.dataset.page);
  }
}

function getSetting(k){ return _cfg[k] ?? DEFAULTS[k]; }

function resetSettings(){
  if(!confirm('Reset all settings to defaults?')) return;
  try { localStorage.removeItem(SETTINGS_KEY); } catch(e){}
  _cfg = {...DEFAULTS};
  applySettings();
  renderSettings();
}

// ── Public helpers (used by render tabs) ──────────────────────────────────────

window.TC = {
  tempUnit:   () => getSetting('units')==='metric' ? '°C' : '°F',
  windUnit:   () => getSetting('units')==='metric' ? 'km/h' : 'mph',
  precipUnit: () => 'mm',   // ET₀ is always mm/day; precip stays mm for consistency
  isMetric:   () => getSetting('units')==='metric',
  complexity: () => getSetting('complexity'),
  describe:   (simple, standard, expert) => {
    const c = getSetting('complexity');
    return c==='simple' ? simple : (c==='expert' ? (expert||standard) : standard);
  },
  t: (key) => (STRINGS[getSetting('lang')]||STRINGS.en)[key] || STRINGS.en[key] || key
};

// ── Translations ──────────────────────────────────────────────────────────────

const STRINGS = {
  en:{
    dashboard:'Dashboard',map:'Texas Map',forecasts:'Forecasts',agriculture:'Agriculture',
    sgbiofuel:'Biofuel Lab',fueleff:'Fuel Efficiency',trends:'Climate Trends',
    airquality:'Air Quality',water:'Water Resources',energy:'Energy',
    severe:'Severe Weather',compare:'City Comparison',reports:'AI Reports',settings:'Settings',
    main:'Main',environment:'Environment',analysis:'Analysis',preferences:'Preferences',
    syncedAt:'Synced',searchPlaceholder:'Search cities…',
    liveDot:'Intelligence Platform'
  },
  es:{
    dashboard:'Tablero',map:'Mapa de Texas',forecasts:'Pronósticos',agriculture:'Agricultura',
    sgbiofuel:'Lab Biocombustible',fueleff:'Eficiencia de Combustible',trends:'Tendencias Climáticas',
    airquality:'Calidad del Aire',water:'Recursos Hídricos',energy:'Energía',
    severe:'Clima Severo',compare:'Comparar Ciudades',reports:'Informes IA',settings:'Ajustes',
    main:'Principal',environment:'Medio Ambiente',analysis:'Análisis',preferences:'Preferencias',
    syncedAt:'Sincronizado',searchPlaceholder:'Buscar ciudades…',
    liveDot:'Plataforma de Inteligencia'
  },
  fr:{
    dashboard:'Tableau de bord',map:'Carte du Texas',forecasts:'Prévisions',agriculture:'Agriculture',
    sgbiofuel:'Lab Biocarburant',fueleff:'Efficacité Énergétique',trends:'Tendances Climatiques',
    airquality:"Qualité de l'Air",water:'Ressources en Eau',energy:'Énergie',
    severe:'Météo Sévère',compare:'Comparer les Villes',reports:'Rapports IA',settings:'Paramètres',
    main:'Principal',environment:'Environnement',analysis:'Analyse',preferences:'Préférences',
    syncedAt:'Synchronisé',searchPlaceholder:'Rechercher des villes…',
    liveDot:'Plateforme de Renseignement'
  },
  pt:{
    dashboard:'Painel',map:'Mapa do Texas',forecasts:'Previsões',agriculture:'Agricultura',
    sgbiofuel:'Lab Biocombustível',fueleff:'Eficiência de Combustível',trends:'Tendências Climáticas',
    airquality:'Qualidade do Ar',water:'Recursos Hídricos',energy:'Energia',
    severe:'Clima Severo',compare:'Comparar Cidades',reports:'Relatórios IA',settings:'Configurações',
    main:'Principal',environment:'Meio Ambiente',analysis:'Análise',preferences:'Preferências',
    syncedAt:'Sincronizado',searchPlaceholder:'Buscar cidades…',
    liveDot:'Plataforma de Inteligência'
  },
  de:{
    dashboard:'Dashboard',map:'Texas-Karte',forecasts:'Vorhersagen',agriculture:'Landwirtschaft',
    sgbiofuel:'Biokraftstoff-Labor',fueleff:'Kraftstoffeffizienz',trends:'Klimatrends',
    airquality:'Luftqualität',water:'Wasserressourcen',energy:'Energie',
    severe:'Unwetter',compare:'Städtevergleich',reports:'KI-Berichte',settings:'Einstellungen',
    main:'Hauptmenü',environment:'Umwelt',analysis:'Analyse',preferences:'Einstellungen',
    syncedAt:'Synchronisiert',searchPlaceholder:'Städte suchen…',
    liveDot:'Intelligenzplattform'
  },
  zh:{
    dashboard:'仪表板',map:'德克萨斯地图',forecasts:'天气预报',agriculture:'农业',
    sgbiofuel:'生物燃料实验室',fueleff:'燃油效率',trends:'气候趋势',
    airquality:'空气质量',water:'水资源',energy:'能源',
    severe:'恶劣天气',compare:'城市对比',reports:'智能报告',settings:'设置',
    main:'主菜单',environment:'环境',analysis:'分析',preferences:'偏好设置',
    syncedAt:'同步于',searchPlaceholder:'搜索城市…',liveDot:'智能平台'
  },
  ko:{
    dashboard:'대시보드',map:'텍사스 지도',forecasts:'날씨 예보',agriculture:'농업',
    sgbiofuel:'바이오연료 랩',fueleff:'연료 효율',trends:'기후 트렌드',
    airquality:'대기질',water:'수자원',energy:'에너지',
    severe:'악천후',compare:'도시 비교',reports:'AI 리포트',settings:'설정',
    main:'메인',environment:'환경',analysis:'분석',preferences:'환경설정',
    syncedAt:'동기화',searchPlaceholder:'도시 검색…',liveDot:'인텔리전스 플랫폼'
  },
  vi:{
    dashboard:'Bảng điều khiển',map:'Bản đồ Texas',forecasts:'Dự báo',agriculture:'Nông nghiệp',
    sgbiofuel:'Lab Nhiên liệu sinh học',fueleff:'Hiệu quả nhiên liệu',trends:'Xu hướng khí hậu',
    airquality:'Chất lượng không khí',water:'Tài nguyên nước',energy:'Năng lượng',
    severe:'Thời tiết khắc nghiệt',compare:'So sánh thành phố',reports:'Báo cáo AI',settings:'Cài đặt',
    main:'Chính',environment:'Môi trường',analysis:'Phân tích',preferences:'Tùy chọn',
    syncedAt:'Đồng bộ',searchPlaceholder:'Tìm kiếm thành phố…',liveDot:'Nền tảng thông minh'
  },
  hi:{
    dashboard:'डैशबोर्ड',map:'टेक्सास मानचित्र',forecasts:'पूर्वानुमान',agriculture:'कृषि',
    sgbiofuel:'जैव ईंधन लैब',fueleff:'ईंधन दक्षता',trends:'जलवायु प्रवृत्तियाँ',
    airquality:'वायु गुणवत्ता',water:'जल संसाधन',energy:'ऊर्जा',
    severe:'गंभीर मौसम',compare:'शहर तुलना',reports:'AI रिपोर्ट',settings:'सेटिंग्स',
    main:'मुख्य',environment:'पर्यावरण',analysis:'विश्लेषण',preferences:'प्राथमिकताएँ',
    syncedAt:'सिंक किया',searchPlaceholder:'शहर खोजें…',liveDot:'इंटेलिजेंस प्लेटफ़ॉर्म'
  },
  ar:{
    dashboard:'لوحة التحكم',map:'خريطة تكساس',forecasts:'التوقعات',agriculture:'الزراعة',
    sgbiofuel:'مختبر الوقود الحيوي',fueleff:'كفاءة الوقود',trends:'اتجاهات المناخ',
    airquality:'جودة الهواء',water:'الموارد المائية',energy:'الطاقة',
    severe:'الطقس القاسي',compare:'مقارنة المدن',reports:'تقارير الذكاء الاصطناعي',settings:'الإعدادات',
    main:'الرئيسية',environment:'البيئة',analysis:'التحليل',preferences:'التفضيلات',
    syncedAt:'تمت المزامنة',searchPlaceholder:'ابحث عن مدينة…',liveDot:'منصة الذكاء'
  },
  ru:{
    dashboard:'Панель',map:'Карта Техаса',forecasts:'Прогнозы',agriculture:'С/х',
    sgbiofuel:'Лаб. биотоплива',fueleff:'Топливная эффективность',trends:'Климатические тренды',
    airquality:'Качество воздуха',water:'Водные ресурсы',energy:'Энергетика',
    severe:'Опасная погода',compare:'Сравнение городов',reports:'ИИ Отчёты',settings:'Настройки',
    main:'Главное',environment:'Окружающая среда',analysis:'Анализ',preferences:'Настройки',
    syncedAt:'Синхронизировано',searchPlaceholder:'Поиск города…',liveDot:'Платформа аналитики'
  },
  ja:{
    dashboard:'ダッシュボード',map:'テキサス地図',forecasts:'天気予報',agriculture:'農業',
    sgbiofuel:'バイオ燃料ラボ',fueleff:'燃料効率',trends:'気候トレンド',
    airquality:'大気質',water:'水資源',energy:'エネルギー',
    severe:'悪天候',compare:'都市比較',reports:'AIレポート',settings:'設定',
    main:'メイン',environment:'環境',analysis:'分析',preferences:'設定',
    syncedAt:'同期',searchPlaceholder:'都市を検索…',liveDot:'インテリジェンスプラットフォーム'
  },
  bn:{
    dashboard:'ড্যাশবোর্ড',map:'টেক্সাস মানচিত্র',forecasts:'পূর্বাভাস',agriculture:'কৃষি',
    sgbiofuel:'জৈব জ্বালানি ল্যাব',fueleff:'জ্বালানি দক্ষতা',trends:'জলবায়ু প্রবণতা',
    airquality:'বায়ু মান',water:'জল সম্পদ',energy:'শক্তি',
    severe:'ভয়াবহ আবহাওয়া',compare:'শহর তুলনা',reports:'AI রিপোর্ট',settings:'সেটিংস',
    main:'প্রধান',environment:'পরিবেশ',analysis:'বিশ্লেষণ',preferences:'পছন্দসমূহ',
    syncedAt:'সিঙ্ক',searchPlaceholder:'শহর খুঁজুন…',liveDot:'ইন্টেলিজেন্স প্ল্যাটফর্ম'
  },
  tr:{
    dashboard:'Gösterge Paneli',map:'Teksas Haritası',forecasts:'Tahminler',agriculture:'Tarım',
    sgbiofuel:'Biyoyakıt Lab.',fueleff:'Yakıt Verimliliği',trends:'İklim Trendleri',
    airquality:'Hava Kalitesi',water:'Su Kaynakları',energy:'Enerji',
    severe:'Şiddetli Hava',compare:'Şehir Karşılaştırma',reports:'YZ Raporları',settings:'Ayarlar',
    main:'Ana Menü',environment:'Çevre',analysis:'Analiz',preferences:'Tercihler',
    syncedAt:'Senkronize edildi',searchPlaceholder:'Şehir ara…',liveDot:'Zeka Platformu'
  },
  it:{
    dashboard:'Dashboard',map:'Mappa del Texas',forecasts:'Previsioni',agriculture:'Agricoltura',
    sgbiofuel:'Lab Biocarburante',fueleff:'Efficienza Carburante',trends:'Tendenze Climatiche',
    airquality:"Qualità dell'Aria",water:'Risorse Idriche',energy:'Energia',
    severe:'Meteo Estremo',compare:'Confronto Città',reports:'Rapporti IA',settings:'Impostazioni',
    main:'Principale',environment:'Ambiente',analysis:'Analisi',preferences:'Preferenze',
    syncedAt:'Sincronizzato',searchPlaceholder:'Cerca città…',liveDot:'Piattaforma Intelligence'
  },
  id:{
    dashboard:'Dasbor',map:'Peta Texas',forecasts:'Prakiraan',agriculture:'Pertanian',
    sgbiofuel:'Lab Biofuel',fueleff:'Efisiensi Bahan Bakar',trends:'Tren Iklim',
    airquality:'Kualitas Udara',water:'Sumber Daya Air',energy:'Energi',
    severe:'Cuaca Ekstrem',compare:'Perbandingan Kota',reports:'Laporan AI',settings:'Pengaturan',
    main:'Utama',environment:'Lingkungan',analysis:'Analisis',preferences:'Preferensi',
    syncedAt:'Disinkronkan',searchPlaceholder:'Cari kota…',liveDot:'Platform Kecerdasan'
  }
};

// ── All supported languages ───────────────────────────────────────────────────

const ALL_LANGS = [
  {id:'en',flag:'🇺🇸',label:'English'},
  {id:'es',flag:'🇪🇸',label:'Español'},
  {id:'fr',flag:'🇫🇷',label:'Français'},
  {id:'pt',flag:'🇧🇷',label:'Português'},
  {id:'de',flag:'🇩🇪',label:'Deutsch'},
  {id:'zh',flag:'🇨🇳',label:'中文'},
  {id:'ko',flag:'🇰🇷',label:'한국어'},
  {id:'vi',flag:'🇻🇳',label:'Tiếng Việt'},
  {id:'hi',flag:'🇮🇳',label:'हिन्दी'},
  {id:'ar',flag:'🇸🇦',label:'العربية'},
  {id:'ru',flag:'🇷🇺',label:'Русский'},
  {id:'ja',flag:'🇯🇵',label:'日本語'},
  {id:'bn',flag:'🇧🇩',label:'বাংলা'},
  {id:'tr',flag:'🇹🇷',label:'Türkçe'},
  {id:'it',flag:'🇮🇹',label:'Italiano'},
  {id:'id',flag:'🇮🇩',label:'Bahasa Indonesia'}
];

const RTL_LANGS = new Set(['ar']);

// ── Apply settings → DOM + CSS vars ──────────────────────────────────────────

function applySettings(){
  const r = document.documentElement;

  // Accent color
  const themes = {
    blue:   ['#4A90E2','rgba(74,144,226,0.15)','rgba(74,144,226,0.35)','0 0 30px rgba(74,144,226,0.14)'],
    teal:   ['#2DD4BF','rgba(45,212,191,0.15)', 'rgba(45,212,191,0.35)', '0 0 30px rgba(45,212,191,0.14)'],
    amber:  ['#F59E0B','rgba(245,158,11,0.15)', 'rgba(245,158,11,0.35)', '0 0 30px rgba(245,158,11,0.14)'],
    rose:   ['#F43F5E','rgba(244,63,94,0.15)',  'rgba(244,63,94,0.35)',  '0 0 30px rgba(244,63,94,0.14)'],
    violet: ['#8B5CF6','rgba(139,92,246,0.15)', 'rgba(139,92,246,0.35)', '0 0 30px rgba(139,92,246,0.14)'],
    mint:   ['#22C55E','rgba(34,197,94,0.15)',  'rgba(34,197,94,0.35)',  '0 0 30px rgba(34,197,94,0.14)']
  };
  const t = themes[_cfg.theme] || themes.blue;
  r.style.setProperty('--blue', t[0]);
  r.style.setProperty('--blue-dim', t[1]);
  r.style.setProperty('--blue-mid', t[2]);
  r.style.setProperty('--glow', t[3]);

  // Background palette
  const bgs = {
    dark:     ['#070E1A','#0B1623','#0F1E30','#152540'],
    midnight: ['#020408','#050B14','#08101E','#0D1628'],
    slate:    ['#0F172A','#1A2540','#1E2D3D','#263548'],
    charcoal: ['#111827','#1A2535','#1F2D3D','#273549']
  };
  const bg = bgs[_cfg.bg] || bgs.dark;
  r.style.setProperty('--bg0', bg[0]); r.style.setProperty('--bg1', bg[1]);
  r.style.setProperty('--bg2', bg[2]); r.style.setProperty('--bg3', bg[3]);

  // Font size
  document.body.style.fontSize = {small:'11px',medium:'13px',large:'15px'}[_cfg.fontSize]||'13px';

  // High contrast
  const hc = _cfg.highContrast;
  r.style.setProperty('--text1', hc?'#ffffff':'rgba(255,255,255,0.87)');
  r.style.setProperty('--text2', hc?'rgba(255,255,255,0.92)':'rgba(255,255,255,0.64)');
  r.style.setProperty('--text3', hc?'rgba(255,255,255,0.78)':'rgba(255,255,255,0.45)');
  r.style.setProperty('--border', hc?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.08)');
  r.style.setProperty('--border2', hc?'rgba(255,255,255,0.40)':'rgba(255,255,255,0.14)');

  // Reduced motion
  if(_cfg.reducedMotion){
    if(!document.getElementById('_tcNoMotion')){
      const s=document.createElement('style'); s.id='_tcNoMotion';
      s.textContent='*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}';
      document.head.appendChild(s);
    }
  } else { const ex=document.getElementById('_tcNoMotion'); if(ex) ex.remove(); }

  // RTL support for Arabic
  document.documentElement.dir = RTL_LANGS.has(_cfg.lang) ? 'rtl' : 'ltr';

  applyLanguage();
  applyRefreshInterval();
}

// ── Language ──────────────────────────────────────────────────────────────────

function applyLanguage(){
  const str = STRINGS[_cfg.lang]||STRINGS.en;

  // Nav buttons
  document.querySelectorAll('.nav-item[data-page]').forEach(btn=>{
    const key = btn.dataset.page;
    if(!str[key]) return;
    const icon = btn.querySelector('.nav-icon');
    btn.textContent = str[key];
    if(icon) btn.insertBefore(icon, btn.firstChild);
  });

  // Nav section labels (Main / Environment / Analysis / Preferences)
  const secLabels = document.querySelectorAll('.nav-section .nav-label');
  const secKeys   = ['main','environment','analysis','preferences'];
  secLabels.forEach((el,i)=>{ if(str[secKeys[i]]) el.textContent = str[secKeys[i]]; });

  // Search placeholder
  const sb = document.getElementById('searchBox');
  if(sb) sb.placeholder = `🔍  ${str.searchPlaceholder||'Search cities…'}`;

  // Header sync label
  const meta = document.querySelector('.header-meta');
  const sync = document.getElementById('lastSync');
  if(meta && sync){
    const t = sync.textContent;
    meta.innerHTML = `${str.syncedAt||'Synced'}: <span id="lastSync">${t}</span>`;
  }

  // Sidebar sub ("Intelligence Platform")
  const logoSub = document.querySelector('.logo-sub');
  if(logoSub){
    const dot = logoSub.querySelector('.live-dot');
    logoSub.textContent = str.liveDot||'Intelligence Platform';
    if(dot) logoSub.insertBefore(dot, logoSub.firstChild);
  }

  // PAGE_TITLES (header on tab switch)
  if(typeof PAGE_TITLES!=='undefined'){
    Object.keys(PAGE_TITLES).forEach(k=>{ if(str[k]) PAGE_TITLES[k]=str[k]; });
  }

  // Current page title
  const active = document.querySelector('.nav-item[aria-current="page"]');
  if(active){ const pid=active.dataset.page; if(str[pid]) document.getElementById('pageTitle').textContent=str[pid]; }
}

// ── Auto-refresh interval ─────────────────────────────────────────────────────

let _refreshTimer = null;
function applyRefreshInterval(){
  if(_refreshTimer) clearInterval(_refreshTimer);
  const mins = Math.max(1, parseInt(_cfg.refreshMin)||10);
  _refreshTimer = setInterval(()=>{ if(typeof fetchAllWeatherData==='function') fetchAllWeatherData(); }, mins*60*1000);
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderSettings(){
  const pg = document.getElementById('page-settings');
  if(!pg) return;
  injectSettingsCSS();

  const swatch = (id, col, label) =>
    `<button class="set-swatch${_cfg.theme===id?' active':''}" onclick="save('theme','${id}');renderSettings()"
      title="${label}" aria-label="${label}${_cfg.theme===id?' (selected)':''}" style="background:${col}"></button>`;

  const chip = (val, cur, label, onclick) =>
    `<button class="set-chip${cur===val?' active':''}" onclick="${onclick}">${label}</button>`;

  const toggle = (key, label, desc) =>
    `<div class="set-toggle-row">
      <div><div class="set-label">${label}</div><div class="set-desc">${desc}</div></div>
      <button class="set-toggle${_cfg[key]?' on':''}" onclick="save('${key}',${!_cfg[key]});renderSettings()"
        role="switch" aria-checked="${_cfg[key]}" aria-label="Toggle ${label.toLowerCase()}">
        <span class="set-toggle-thumb"></span></button>
    </div>`;

  const complexityPreview = {
    simple:   '🌡 It\'s too hot for most crops right now. Farmers should water their fields and watch out for wilting.',
    standard: 'Heat stress levels are elevated across Texas. Temperatures exceed optimal growing ranges. Increased irrigation is recommended to offset high evapotranspiration rates.',
    expert:   'Thermal stress threshold exceeded: avg temp > 95°F causes stomatal closure and reduced photosynthesis. ET₀ (FAO-56 Penman-Monteith) may exceed 8 mm/day — recommend Kc-adjusted irrigation scheduling and canopy monitoring.'
  };

  pg.innerHTML = `
  <div style="max-width:780px">
    <div style="margin-bottom:24px">
      <h1 style="font-size:22px;font-weight:800;color:var(--text0);margin-bottom:6px;letter-spacing:-.3px">⚙ Platform Settings</h1>
      <p style="font-size:12px;color:var(--text2);line-height:1.6">Personalize TexasClimate — all changes apply instantly and persist across sessions.</p>
    </div>

    <div class="set-section">
      <div class="set-section-title">🎨 Appearance</div>
      <div class="set-group">
        <div class="set-label">Accent Color</div>
        <div class="set-desc">Colors the sidebar, charts, links, and interactive elements</div>
        <div class="set-swatches">
          ${swatch('blue',  '#4A90E2','Ocean Blue')}
          ${swatch('teal',  '#2DD4BF','Teal')}
          ${swatch('amber', '#F59E0B','Amber')}
          ${swatch('rose',  '#F43F5E','Rose')}
          ${swatch('violet','#8B5CF6','Violet')}
          ${swatch('mint',  '#22C55E','Mint Green')}
        </div>
      </div>
      <div class="set-group">
        <div class="set-label">Background</div>
        <div class="set-desc">Controls the overall darkness and tint of the interface</div>
        <div class="set-chips">
          ${chip('dark',    _cfg.bg,'Dark',    "save('bg','dark');renderSettings()")}
          ${chip('midnight',_cfg.bg,'Midnight',"save('bg','midnight');renderSettings()")}
          ${chip('slate',   _cfg.bg,'Slate',   "save('bg','slate');renderSettings()")}
          ${chip('charcoal',_cfg.bg,'Charcoal',"save('bg','charcoal');renderSettings()")}
        </div>
      </div>
      <div class="set-group" style="margin-bottom:0">
        <div class="set-label">Font Size</div>
        <div class="set-desc">Adjusts text size across the entire platform</div>
        <div class="set-chips">
          ${chip('small', _cfg.fontSize,'Small', "save('fontSize','small');renderSettings()")}
          ${chip('medium',_cfg.fontSize,'Medium',"save('fontSize','medium');renderSettings()")}
          ${chip('large', _cfg.fontSize,'Large', "save('fontSize','large');renderSettings()")}
        </div>
      </div>
    </div>

    <div class="set-section">
      <div class="set-section-title">📊 Data Preferences</div>
      <div class="set-group">
        <div class="set-label">Measurement Units</div>
        <div class="set-desc">Applies to temperatures and wind speed — takes effect on next data refresh</div>
        <div class="set-chips">
          ${chip('imperial',_cfg.units,'🇺🇸 Imperial (°F · mph)',"save('units','imperial');renderSettings()")}
          ${chip('metric',  _cfg.units,'🌍 Metric (°C · km/h)',  "save('units','metric');renderSettings()")}
        </div>
        ${_cfg.units==='metric'?`<div class="set-hint">Metric units apply after the next refresh. Click <strong>↻ Refresh</strong> in the header to apply immediately. Note: ET₀ (evapotranspiration) is always displayed in mm/day per the FAO-56 standard.</div>`:''}
      </div>
      <div class="set-group">
        <div class="set-label">Data Complexity</div>
        <div class="set-desc">Controls how technical descriptions and analysis are presented across all tabs</div>
        <div class="set-complexity">
          <button class="set-complexity-card${_cfg.complexity==='simple'?' active':''}"
            onclick="save('complexity','simple');renderSettings()">
            <span class="set-complexity-icon">👶</span>
            <div class="set-complexity-label">Simple</div>
            <div class="set-complexity-desc">Plain language, no jargon. Ideal for students and general audiences.</div>
          </button>
          <button class="set-complexity-card${_cfg.complexity==='standard'?' active':''}"
            onclick="save('complexity','standard');renderSettings()">
            <span class="set-complexity-icon">📊</span>
            <div class="set-complexity-label">Standard</div>
            <div class="set-complexity-desc">Data with context and units. Default experience for most users.</div>
          </button>
          <button class="set-complexity-card${_cfg.complexity==='expert'?' active':''}"
            onclick="save('complexity','expert');renderSettings()">
            <span class="set-complexity-icon">🔬</span>
            <div class="set-complexity-label">Expert</div>
            <div class="set-complexity-desc">Full metrics, formulas, and raw values. For researchers and professionals.</div>
          </button>
        </div>
        <div class="set-preview">
          <div class="set-preview-label">Preview — Agriculture Heat Stress</div>
          <div class="set-preview-text">${complexityPreview[_cfg.complexity]||complexityPreview.standard}</div>
        </div>
      </div>
      <div class="set-group" style="margin-bottom:0">
        <div class="set-label">Auto-Refresh Interval</div>
        <div class="set-desc">How often live weather data is automatically re-fetched from Open-Meteo &amp; NWS</div>
        <div class="set-chips">
          ${[5,10,20,30].map(m=>chip(m,_cfg.refreshMin,`${m} min`,`save('refreshMin',${m});renderSettings()`)).join('')}
        </div>
      </div>
    </div>

    <div class="set-section">
      <div class="set-section-title">🌐 Language <span style="font-size:9px;background:var(--blue-dim);color:var(--blue);border:1px solid var(--blue-mid);border-radius:8px;padding:2px 8px;margin-left:8px;vertical-align:middle;font-weight:700;letter-spacing:.06em">${ALL_LANGS.length} LANGUAGES</span></div>
      <div class="set-group" style="margin-bottom:0">
        <div class="set-label">Interface Language</div>
        <div class="set-desc">Translates the full navigation, page titles, and UI strings. Live weather data is always sourced in English from the APIs.</div>
        <div class="set-langs-grid">
          ${ALL_LANGS.map(l=>`<button class="set-lang-btn${_cfg.lang===l.id?' active':''}"
            onclick="save('lang','${l.id}');renderSettings()" lang="${l.id}" aria-pressed="${_cfg.lang===l.id}">
            <span class="set-lang-flag">${l.flag}</span>
            <span class="set-lang-label">${l.label}</span>
          </button>`).join('')}
        </div>
      </div>
    </div>

    <div class="set-section">
      <div class="set-section-title">♿ Accessibility</div>
      ${toggle('reducedMotion','Reduce Motion','Disables all CSS animations and transitions — recommended for users with vestibular disorders')}
      ${toggle('highContrast','High Contrast','Increases text brightness and border visibility for improved readability')}
    </div>

    <div class="set-section">
      <div class="set-section-title">ℹ️ About</div>
      <div class="set-about-grid">
        <div class="set-about-item"><span class="set-about-key">Platform</span><span>TexasClimate Intelligence Platform</span></div>
        <div class="set-about-item"><span class="set-about-key">Version</span><span>v2.4.1</span></div>
        <div class="set-about-item"><span class="set-about-key">Data Sources</span><span>Open-Meteo · NWS api.weather.gov</span></div>
        <div class="set-about-item"><span class="set-about-key">Monitored Cities</span><span>10 major Texas cities</span></div>
        <div class="set-about-item"><span class="set-about-key">License</span><span>Open source · MIT</span></div>
        <div class="set-about-item"><span class="set-about-key">Repository</span>
          <span><a href="https://github.com/haohanzang-ai/Weather-Channel" target="_blank" rel="noopener" style="color:var(--blue)">github.com/haohanzang-ai/Weather-Channel</a></span>
        </div>
      </div>
      <div style="margin-top:14px">
        <button class="btn-sm" onclick="resetSettings()" style="border-color:rgba(212,53,53,0.4);color:#D64545;background:rgba(212,53,53,0.08)">↺ Reset All Settings to Defaults</button>
      </div>
    </div>
  </div>`;
}

// ── Settings CSS ──────────────────────────────────────────────────────────────

function injectSettingsCSS(){
  if(document.getElementById('_settingsCSS')) return;
  const s = document.createElement('style'); s.id='_settingsCSS';
  s.textContent=`
.set-section{background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;padding:22px;margin-bottom:16px}
.set-section-title{font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.12em;margin-bottom:18px}
.set-group{margin-bottom:22px}.set-group:last-child{margin-bottom:0}
.set-label{font-size:12px;font-weight:600;color:var(--text0);margin-bottom:3px}
.set-desc{font-size:10px;color:var(--text3);line-height:1.55;margin-bottom:10px}
.set-hint{margin-top:8px;font-size:10px;color:var(--text2);background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:6px;padding:7px 11px;line-height:1.5}
.set-swatches{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
.set-swatch{width:30px;height:30px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:transform .15s,box-shadow .15s;flex-shrink:0}
.set-swatch:hover{transform:scale(1.18)}
.set-swatch.active{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,0.22),0 0 12px rgba(255,255,255,0.1)}
.set-chips{display:flex;gap:6px;flex-wrap:wrap}
.set-chip{padding:6px 15px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--border2);background:rgba(255,255,255,0.05);color:var(--text1);transition:all .15s;font-family:var(--font)}
.set-chip:hover{background:rgba(255,255,255,0.1);border-color:var(--blue-mid)}
.set-chip.active{background:var(--blue-dim);border-color:var(--blue);color:var(--blue);font-weight:700}
.set-complexity{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}
.set-complexity-card{padding:16px;border-radius:10px;background:rgba(255,255,255,0.03);border:1.5px solid var(--border);cursor:pointer;text-align:left;transition:all .18s;font-family:var(--font)}
.set-complexity-card:hover{background:rgba(255,255,255,0.06);border-color:var(--blue-mid)}
.set-complexity-card.active{background:var(--blue-dim);border-color:var(--blue)}
.set-complexity-icon{font-size:24px;display:block;margin-bottom:10px}
.set-complexity-label{font-size:12px;font-weight:700;color:var(--text0);margin-bottom:4px}
.set-complexity-desc{font-size:10px;color:var(--text2);line-height:1.5}
.set-preview{background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:12px}
.set-preview-label{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px}
.set-preview-text{font-size:11px;color:var(--text1);line-height:1.65}
.set-langs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:7px}
.set-lang-btn{display:flex;align-items:center;gap:8px;padding:9px 13px;border-radius:10px;background:rgba(255,255,255,0.04);border:1.5px solid var(--border);cursor:pointer;font-family:var(--font);transition:all .16s;text-align:left;width:100%}
.set-lang-btn:hover{background:rgba(255,255,255,0.08);border-color:var(--blue-mid)}
.set-lang-btn.active{background:var(--blue-dim);border-color:var(--blue)}
.set-lang-flag{font-size:18px;line-height:1;flex-shrink:0}
.set-lang-label{font-size:11px;color:var(--text1);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.set-lang-btn.active .set-lang-label{color:var(--blue);font-weight:700}
.set-toggle-row{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:14px 0;border-bottom:1px solid var(--border)}
.set-toggle-row:last-child{border-bottom:none;padding-bottom:0}
.set-toggle-row:first-child{padding-top:0}
.set-toggle{width:44px;height:26px;border-radius:13px;background:rgba(255,255,255,0.12);border:none;cursor:pointer;position:relative;transition:background .22s;flex-shrink:0;margin-top:2px}
.set-toggle.on{background:var(--blue)}
.set-toggle-thumb{position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .22s;display:block;box-shadow:0 1px 4px rgba(0,0,0,0.45)}
.set-toggle.on .set-toggle-thumb{transform:translateX(18px)}
.set-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.set-about-item{display:flex;flex-direction:column;gap:4px;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)}
.set-about-key{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;font-weight:700}
.set-about-item>span:last-child{font-size:11px;color:var(--text1)}
@media(max-width:600px){.set-complexity{grid-template-columns:1fr}.set-about-grid{grid-template-columns:1fr}.set-langs-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}}
  `;
  document.head.appendChild(s);
}
