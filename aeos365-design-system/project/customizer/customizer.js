/**
 * AEOS365 Customizer — Phase 4
 * Floating bubble + slide-in drawer for real-time theme customization.
 * Persistence: localStorage key "aeos-theme-prefs"
 *
 * Dependency: customizer.css must be loaded first.
 * Auto-inits on DOMContentLoaded (or immediately if DOM is already ready).
 *
 * Public API (for programmatic control):
 *   window.aeosCustomizer.openDrawer()
 *   window.aeosCustomizer.closeDrawer()
 *   window.aeosCustomizer.setMode('dark' | 'light' | 'oled' | 'system')
 *   window.aeosCustomizer.setTheme(name)
 *   window.aeosCustomizer.setAccentColor('#hex')
 *   window.aeosCustomizer.setCardStyle(name)
 *   window.aeosCustomizer.setShell(name)
 *   window.aeosCustomizer.getPrefs()  → returns current prefs object
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────────
     Constants
  ────────────────────────────────────────────────────────────── */
  const STORAGE_KEY = 'aeos-theme-prefs';

  const DEFAULTS = {
    mode:      'dark',
    theme:     'default',
    accent:    '#00E5FF',
    cardStyle: 'flat',
    shell:     'sidebar',
  };

  const ACCENT_SWATCHES = [
    { hex: '#00E5FF', label: 'Cyan (default)' },
    { hex: '#6366F1', label: 'Indigo'         },
    { hex: '#FFB347', label: 'Amber'          },
    { hex: '#22C55E', label: 'Green'          },
    { hex: '#F43F5E', label: 'Rose'           },
    { hex: '#3B82F6', label: 'Blue'           },
  ];

  /* ──────────────────────────────────────────────────────────────
     Helper: safely parse localStorage
  ────────────────────────────────────────────────────────────── */
  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : Object.assign({}, DEFAULTS);
    } catch (_) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (_) {
      // Storage unavailable (private mode, quota exceeded) — fail silently.
    }
  }

  /* ──────────────────────────────────────────────────────────────
     Helper: hex → RGB channel string (e.g. "0, 229, 255")
  ────────────────────────────────────────────────────────────── */
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const int   = parseInt(clean, 16);
    const r     = (int >> 16) & 255;
    const g     = (int >>  8) & 255;
    const b     =  int        & 255;
    return { r, g, b, str: `${r}, ${g}, ${b}` };
  }

  /* ──────────────────────────────────────────────────────────────
     Helper: derive companion accent tokens from a hex string
     Returns CSS variable overrides as a plain object.
  ────────────────────────────────────────────────────────────── */
  function deriveAccentTokens(hex) {
    const { r, g, b } = hexToRgb(hex);
    return {
      '--aeos-primary':       hex,
      '--aeos-primary-deep':  hex,
      '--aeos-cyan':          hex,
      '--aeos-cyan-deep':     hex,
      '--aeos-glow-cyan':     `0 0 24px rgba(${r}, ${g}, ${b}, 0.30)`,
      '--aeos-glow-cyan-l':   `0 0 40px rgba(${r}, ${g}, ${b}, 0.50)`,
      '--aeos-glass-border':  `rgba(${r}, ${g}, ${b}, 0.12)`,
      '--aeos-glass-border-h':`rgba(${r}, ${g}, ${b}, 0.20)`,
    };
  }

  /* ──────────────────────────────────────────────────────────────
     AeosCustomizer Class
  ────────────────────────────────────────────────────────────── */
  class AeosCustomizer {
    constructor() {
      this.prefs      = loadPrefs();
      this._bubble    = null;
      this._backdrop  = null;
      this._drawer    = null;
      this._isOpen    = false;

      this._init();
    }

    /* ── Bootstrap ────────────────────────────────────────────── */
    _init() {
      this._createDOM();
      this._attachListeners();
      this._applyAllPrefs(this.prefs);
    }

    /* ── DOM construction ─────────────────────────────────────── */
    _createDOM() {
      /* Bubble */
      const bubble = document.createElement('button');
      bubble.className    = 'aeos-customizer-bubble';
      bubble.innerHTML    = '&#10022;';   /* ✦ */
      bubble.setAttribute('aria-label',    'Open Theme Studio');
      bubble.setAttribute('aria-expanded', 'false');
      bubble.setAttribute('aria-haspopup', 'dialog');

      /* Backdrop */
      const backdrop = document.createElement('div');
      backdrop.className   = 'aeos-customizer-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');

      /* Swatch markup */
      const swatchHTML = ACCENT_SWATCHES.map(s =>
        `<div class="aeos-customizer-swatch"
              data-color="${s.hex}"
              role="radio"
              tabindex="0"
              aria-label="${s.label}"
              style="background:${s.hex};"
              title="${s.label}"></div>`
      ).join('');

      /* Drawer */
      const drawer = document.createElement('div');
      drawer.className    = 'aeos-customizer-drawer';
      drawer.setAttribute('role',          'dialog');
      drawer.setAttribute('aria-label',    'Theme Studio');
      drawer.setAttribute('aria-modal',    'true');
      drawer.innerHTML = `
        <div class="aeos-customizer-header">
          <div class="aeos-customizer-title">Theme Studio</div>
          <button class="aeos-customizer-close" aria-label="Close Theme Studio">&#10005;</button>
        </div>
        <div class="aeos-customizer-tabs" role="tablist">
          <button class="aeos-customizer-tab active" data-tab="appearance" role="tab" aria-selected="true">Appearance</button>
          <button class="aeos-customizer-tab" data-tab="layout" role="tab" aria-selected="false">Layout</button>
          <button class="aeos-customizer-tab" data-tab="typography" role="tab" aria-selected="false">Type</button>
          <button class="aeos-customizer-tab" data-tab="effects" role="tab" aria-selected="false">Effects</button>
        </div>
        <div class="aeos-customizer-body">

          <!-- Appearance panel -->
          <div class="aeos-customizer-tab-panel" id="aeos-panel-appearance" role="tabpanel">
            <div class="aeos-customizer-section">
              <div class="aeos-customizer-label">Mode</div>
              <div class="aeos-customizer-pills" id="aeos-mode-pills" role="radiogroup" aria-label="Color mode">
                <button class="aeos-customizer-pill" data-mode="dark"   role="radio">Dark</button>
                <button class="aeos-customizer-pill" data-mode="light"  role="radio">Light</button>
                <button class="aeos-customizer-pill" data-mode="oled"   role="radio">OLED</button>
                <button class="aeos-customizer-pill" data-mode="system" role="radio">System</button>
              </div>
            </div>

            <div class="aeos-customizer-section">
              <div class="aeos-customizer-label">Theme</div>
              <div class="aeos-customizer-pills" id="aeos-theme-pills" role="radiogroup" aria-label="Theme variant" style="grid-template-columns: repeat(4, 1fr);">
                <button class="aeos-customizer-pill" data-theme="default"       role="radio">Default</button>
                <button class="aeos-customizer-pill" data-theme="warm"          role="radio">Warm</button>
                <button class="aeos-customizer-pill" data-theme="cool"          role="radio">Cool</button>
                <button class="aeos-customizer-pill" data-theme="forest"        role="radio">Forest</button>
                <button class="aeos-customizer-pill" data-theme="rose"          role="radio">Rose</button>
                <button class="aeos-customizer-pill" data-theme="midnight"      role="radio">Midnight</button>
                <button class="aeos-customizer-pill" data-theme="paper"         role="radio">Paper</button>
                <button class="aeos-customizer-pill" data-theme="high-contrast" role="radio">HC</button>
              </div>
            </div>

            <div class="aeos-customizer-section">
              <div class="aeos-customizer-label">Accent Color</div>
              <div class="aeos-customizer-swatches" id="aeos-color-swatches" role="radiogroup" aria-label="Accent color">
                ${swatchHTML}
              </div>
            </div>
          </div>

          <!-- Layout panel -->
          <div class="aeos-customizer-tab-panel" id="aeos-panel-layout" role="tabpanel" style="display:none;">
            <div class="aeos-customizer-section">
              <div class="aeos-customizer-label">Card Style</div>
              <div class="aeos-customizer-pills" id="aeos-card-pills" role="radiogroup" aria-label="Card style" style="grid-template-columns: repeat(3, 1fr);">
                <button class="aeos-customizer-pill" data-card-style="flat"            role="radio">Flat</button>
                <button class="aeos-customizer-pill" data-card-style="glass"           role="radio">Glass</button>
                <button class="aeos-customizer-pill" data-card-style="glow"            role="radio">Glow</button>
                <button class="aeos-customizer-pill" data-card-style="gradient-border" role="radio">Grad</button>
                <button class="aeos-customizer-pill" data-card-style="outline"         role="radio">Outline</button>
                <button class="aeos-customizer-pill" data-card-style="noise"           role="radio">Noise</button>
              </div>
            </div>

            <div class="aeos-customizer-section">
              <div class="aeos-customizer-label">Shell Layout</div>
              <div class="aeos-customizer-pills" id="aeos-shell-pills" role="radiogroup" aria-label="Shell layout">
                <button class="aeos-customizer-pill" data-shell="sidebar"  role="radio">Sidebar</button>
                <button class="aeos-customizer-pill" data-shell="topnav"   role="radio">TopNav</button>
                <button class="aeos-customizer-pill" data-shell="floating" role="radio">Float</button>
                <button class="aeos-customizer-pill" data-shell="command"  role="radio">Command</button>
              </div>
            </div>
          </div>

          <!-- Typography panel -->
          <div class="aeos-customizer-tab-panel" id="aeos-panel-typography" role="tabpanel" style="display:none;">
            <div class="aeos-customizer-section">
              <div class="aeos-customizer-label">Font Scale</div>
              <div class="aeos-customizer-range">
                <input type="range" id="aeos-font-scale" min="0.85" max="1.20" step="0.05" value="1.00" aria-label="Font scale">
                <span class="aeos-customizer-range-value" id="aeos-font-scale-value">1.0</span>
              </div>
            </div>
            <div class="aeos-customizer-section">
              <div class="aeos-customizer-label">Content Density</div>
              <div class="aeos-customizer-pills" id="aeos-density-pills" role="radiogroup" aria-label="Content density" style="grid-template-columns: repeat(3, 1fr);">
                <button class="aeos-customizer-pill" data-density="0.8"  role="radio">Compact</button>
                <button class="aeos-customizer-pill active" data-density="1.0" role="radio">Normal</button>
                <button class="aeos-customizer-pill" data-density="1.2"  role="radio">Relaxed</button>
              </div>
            </div>
          </div>

          <!-- Effects panel -->
          <div class="aeos-customizer-tab-panel" id="aeos-panel-effects" role="tabpanel" style="display:none;">
            <div class="aeos-customizer-section">
              <div class="aeos-customizer-label">Performance</div>
              <label class="aeos-check-label" style="font-size:0.82rem;color:var(--aeos-text-secondary);">
                <input type="checkbox" id="aeos-toggle-blur"> Disable Blur Effects
              </label>
              <label class="aeos-check-label" style="font-size:0.82rem;color:var(--aeos-text-secondary);">
                <input type="checkbox" id="aeos-toggle-glow"> Disable Glow Effects
              </label>
              <label class="aeos-check-label" style="font-size:0.82rem;color:var(--aeos-text-secondary);">
                <input type="checkbox" id="aeos-toggle-motion"> Reduce Motion
              </label>
              <label class="aeos-check-label" style="font-size:0.82rem;color:var(--aeos-text-secondary);">
                <input type="checkbox" id="aeos-toggle-gradient-text"> Disable Gradient Text
              </label>
              <label class="aeos-check-label" style="font-size:0.82rem;color:var(--aeos-text-secondary);">
                <input type="checkbox" id="aeos-toggle-grid"> Disable Grid Texture
              </label>
            </div>
          </div>

        </div>
        <div class="aeos-customizer-footer">
          <button class="aeos-customizer-btn aeos-customizer-btn-secondary" id="aeos-export-btn">Export CSS</button>
          <button class="aeos-customizer-btn aeos-customizer-btn-primary"   id="aeos-reset-btn">Reset</button>
          <button class="aeos-customizer-btn aeos-customizer-btn-primary"   id="aeos-save-btn">Save</button>
        </div>
      `;

      document.body.appendChild(bubble);
      document.body.appendChild(backdrop);
      document.body.appendChild(drawer);

      this._bubble   = bubble;
      this._backdrop = backdrop;
      this._drawer   = drawer;
    }

    /* ── Event wiring ─────────────────────────────────────────── */
    _attachListeners() {
      const d = this._drawer;

      /* Bubble */
      this._bubble.addEventListener('click', () => this.toggleDrawer());

      /* Backdrop */
      this._backdrop.addEventListener('click', () => this.closeDrawer());

      /* Close button */
      d.querySelector('.aeos-customizer-close').addEventListener('click', () => this.closeDrawer());

      /* Escape key */
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._isOpen) this.closeDrawer();
      });

      /* Tabs */
      d.querySelectorAll('.aeos-customizer-tab').forEach(tab => {
        tab.addEventListener('click', () => this._switchTab(tab.dataset.tab));
      });

      /* Mode pills */
      d.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
      });

      /* Theme pills */
      d.querySelectorAll('[data-theme]').forEach(btn => {
        btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
      });

      /* Color swatches (click + keyboard) */
      d.querySelectorAll('[data-color]').forEach(swatch => {
        swatch.addEventListener('click', () => this.setAccentColor(swatch.dataset.color));
        swatch.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.setAccentColor(swatch.dataset.color);
          }
        });
      });

      /* Card style pills */
      d.querySelectorAll('[data-card-style]').forEach(btn => {
        btn.addEventListener('click', () => this.setCardStyle(btn.dataset.cardStyle));
      });

      /* Shell pills */
      d.querySelectorAll('[data-shell]').forEach(btn => {
        btn.addEventListener('click', () => this.setShell(btn.dataset.shell));
      });

      /* Density pills */
      d.querySelectorAll('[data-density]').forEach(btn => {
        btn.addEventListener('click', () => this._setDensity(parseFloat(btn.dataset.density)));
      });

      /* Font scale range */
      const fontRange = d.querySelector('#aeos-font-scale');
      if (fontRange) {
        fontRange.addEventListener('input', () => {
          const v = parseFloat(fontRange.value);
          this._setFontScale(v);
          d.querySelector('#aeos-font-scale-value').textContent = v.toFixed(2);
        });
      }

      /* Effect toggles */
      this._wireEffectToggle('#aeos-toggle-blur',          'aeos--no-blur');
      this._wireEffectToggle('#aeos-toggle-glow',          'aeos--no-glow');
      this._wireEffectToggle('#aeos-toggle-motion',        'aeos--reduce-motion');
      this._wireEffectToggle('#aeos-toggle-gradient-text', 'aeos--no-gradient-text');
      this._wireEffectToggle('#aeos-toggle-grid',          'aeos--no-grid-texture');

      /* Footer buttons */
      d.querySelector('#aeos-save-btn').addEventListener('click',   () => this._save());
      d.querySelector('#aeos-export-btn').addEventListener('click', () => this._exportCSS());
      d.querySelector('#aeos-reset-btn').addEventListener('click',  () => this._resetToDefaults());
    }

    _wireEffectToggle(selector, bodyClass) {
      const el = this._drawer.querySelector(selector);
      if (!el) return;
      el.addEventListener('change', () => {
        document.body.classList.toggle(bodyClass, el.checked);
      });
    }

    /* ── Tab switching ────────────────────────────────────────── */
    _switchTab(tabName) {
      this._drawer.querySelectorAll('.aeos-customizer-tab').forEach(t => {
        const isActive = t.dataset.tab === tabName;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive);
      });

      this._drawer.querySelectorAll('.aeos-customizer-tab-panel').forEach(p => {
        p.style.display = p.id === `aeos-panel-${tabName}` ? 'flex' : 'none';
        p.style.flexDirection = 'column';
        p.style.gap = '20px';
      });
    }

    /* ── Drawer open/close ────────────────────────────────────── */
    toggleDrawer() {
      this._isOpen ? this.closeDrawer() : this.openDrawer();
    }

    openDrawer() {
      this._isOpen = true;
      this._drawer.classList.add('open');
      this._backdrop.classList.add('open');
      this._bubble.setAttribute('aria-expanded', 'true');
      // Move focus inside drawer for accessibility
      const firstFocusable = this._drawer.querySelector('button, [tabindex="0"]');
      if (firstFocusable) firstFocusable.focus();
    }

    closeDrawer() {
      this._isOpen = false;
      this._drawer.classList.remove('open');
      this._backdrop.classList.remove('open');
      this._bubble.setAttribute('aria-expanded', 'false');
      this._bubble.focus();
    }

    /* ── Apply all stored prefs on load ──────────────────────── */
    _applyAllPrefs(prefs) {
      this._applyMode(prefs.mode || 'dark');
      this._applyTheme(prefs.theme || 'default', prefs.mode || 'dark');
      this._applyAccentTokens(prefs.accent || '#00E5FF');
      this._applyCardStyle(prefs.cardStyle || 'flat');
      this._applyShell(prefs.shell || 'sidebar');

      // Sync UI pill states
      this._syncPillUI('aeos-mode-pills',   'data-mode',       prefs.mode       || 'dark');
      this._syncPillUI('aeos-theme-pills',  'data-theme',      prefs.theme      || 'default');
      this._syncPillUI('aeos-card-pills',   'data-card-style', prefs.cardStyle  || 'flat');
      this._syncPillUI('aeos-shell-pills',  'data-shell',      prefs.shell      || 'sidebar');
      this._syncSwatchUI(prefs.accent || '#00E5FF');
    }

    /* ── Mode ─────────────────────────────────────────────────── */
    _applyMode(mode) {
      const body = document.body;
      body.classList.remove('aeos--light', 'aeos--oled', 'aeos--system');
      if (!body.classList.contains('aeos')) body.classList.add('aeos');

      if (mode === 'light')  body.classList.add('aeos--light');
      if (mode === 'oled')   body.classList.add('aeos--oled');
      if (mode === 'system') body.classList.add('aeos--system');
    }

    setMode(mode) {
      this.prefs.mode = mode;
      this._applyMode(mode);
      // Re-apply theme so its scoping class is correct for mode
      this._applyTheme(this.prefs.theme, mode);
      this._syncPillUI('aeos-mode-pills', 'data-mode', mode);
    }

    /* ── Theme ────────────────────────────────────────────────── */
    _applyTheme(theme, mode) {
      const body = document.body;
      // Remove all existing scoped theme classes
      Array.from(body.classList).forEach(cls => {
        if (
          (cls.startsWith('aeos--dark-') || cls.startsWith('aeos--light-')) &&
          cls !== 'aeos--light' &&
          cls !== 'aeos--oled' &&
          cls !== 'aeos--system'
        ) {
          body.classList.remove(cls);
        }
      });

      if (theme && theme !== 'default') {
        const prefix  = (mode === 'light') ? 'aeos--light-' : 'aeos--dark-';
        body.classList.add(`${prefix}${theme}`);
      }
    }

    setTheme(theme) {
      this.prefs.theme = theme;
      this._applyTheme(theme, this.prefs.mode);
      this._syncPillUI('aeos-theme-pills', 'data-theme', theme);
    }

    /* ── Accent Color ─────────────────────────────────────────── */
    _applyAccentTokens(hex) {
      const root   = document.documentElement;
      const tokens = deriveAccentTokens(hex);
      Object.entries(tokens).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
      });
    }

    setAccentColor(hex) {
      this.prefs.accent = hex;
      this._applyAccentTokens(hex);
      this._syncSwatchUI(hex);
    }

    /* ── Card Style ───────────────────────────────────────────── */
    _applyCardStyle(style) {
      document.body.setAttribute('data-card-style', style);
    }

    setCardStyle(style) {
      this.prefs.cardStyle = style;
      this._applyCardStyle(style);
      this._syncPillUI('aeos-card-pills', 'data-card-style', style);
    }

    /* ── Shell Layout ─────────────────────────────────────────── */
    _applyShell(shell) {
      // Find the first data-aeos-shell host in the page (outside the drawer)
      const host = document.querySelector('[data-aeos-shell]');
      if (host) {
        host.setAttribute('data-aeos-shell', shell);
      }
    }

    setShell(shell) {
      this.prefs.shell = shell;
      this._applyShell(shell);
      this._syncPillUI('aeos-shell-pills', 'data-shell', shell);
    }

    /* ── Density (--aeos-density-factor) ─────────────────────── */
    _setDensity(factor) {
      document.documentElement.style.setProperty('--aeos-density-factor', factor.toString());
      this._syncPillUI('aeos-density-pills', 'data-density', factor.toString());
    }

    /* ── Font scale ───────────────────────────────────────────── */
    _setFontScale(scale) {
      document.documentElement.style.setProperty('--aeos-font-scale', scale.toString());
      // Update all clamp-based sizes proportionally via a root font-size nudge
      document.documentElement.style.fontSize = `${scale * 100}%`;
    }

    /* ── Sync UI helpers ──────────────────────────────────────── */
    _syncPillUI(containerId, attr, value) {
      const container = this._drawer.querySelector(`#${containerId}`);
      if (!container) return;
      container.querySelectorAll(`[${attr}]`).forEach(btn => {
        const isActive = btn.getAttribute(attr) === String(value);
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive);
      });
    }

    _syncSwatchUI(hex) {
      this._drawer.querySelectorAll('[data-color]').forEach(swatch => {
        const isActive = swatch.dataset.color.toLowerCase() === hex.toLowerCase();
        swatch.classList.toggle('active', isActive);
        swatch.setAttribute('aria-checked', isActive);
        if (isActive) {
          swatch.style.boxShadow = `0 0 0 2px #fff, 0 0 0 4px ${hex}`;
        } else {
          swatch.style.boxShadow = '';
        }
      });
    }

    /* ── Persist ──────────────────────────────────────────────── */
    _save() {
      savePrefs(this.prefs);
      // Brief visual feedback on button
      const btn = this._drawer.querySelector('#aeos-save-btn');
      const orig = btn.textContent;
      btn.textContent = 'Saved';
      btn.disabled    = true;
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled    = false;
      }, 1500);
    }

    /* ── Reset to defaults ────────────────────────────────────── */
    _resetToDefaults() {
      this.prefs = Object.assign({}, DEFAULTS);
      this._applyAllPrefs(this.prefs);
      savePrefs(this.prefs);

      // Reset effect toggles
      ['aeos-toggle-blur', 'aeos-toggle-glow', 'aeos-toggle-motion',
       'aeos-toggle-gradient-text', 'aeos-toggle-grid'].forEach(id => {
        const el = this._drawer.querySelector(`#${id}`);
        if (el) el.checked = false;
      });
      ['aeos--no-blur', 'aeos--no-glow', 'aeos--reduce-motion',
       'aeos--no-gradient-text', 'aeos--no-grid-texture'].forEach(cls => {
        document.body.classList.remove(cls);
      });

      // Reset font scale slider
      const slider = this._drawer.querySelector('#aeos-font-scale');
      if (slider) {
        slider.value = '1.00';
        this._drawer.querySelector('#aeos-font-scale-value').textContent = '1.00';
      }
      document.documentElement.style.removeProperty('--aeos-font-scale');
      document.documentElement.style.removeProperty('--aeos-density-factor');
      document.documentElement.style.fontSize = '';
    }

    /* ── CSS Export ───────────────────────────────────────────── */
    _exportCSS() {
      const p = this.prefs;
      const modeClass  = p.mode !== 'dark' ? ` aeos--${p.mode}` : '';
      const themeClass = (p.theme && p.theme !== 'default')
        ? ` ${p.mode === 'light' ? 'aeos--light-' : 'aeos--dark-'}${p.theme}`
        : '';

      const accentTokens = deriveAccentTokens(p.accent || '#00E5FF');
      const tokenLines   = Object.entries(accentTokens)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');

      const css = `/* ═══════════════════════════════════════════════
   AEOS365 Custom Theme Export
   Generated: ${new Date().toISOString()}
   Mode:      ${p.mode}
   Theme:     ${p.theme}
   Accent:    ${p.accent}
   Card:      ${p.cardStyle}
   Shell:     ${p.shell}
═══════════════════════════════════════════════ */

/* Apply these classes to your root element */
/* <body class="aeos${modeClass}${themeClass}"> */

:root {
${tokenLines}
}

/* Card Style Override */
body { }
/* add: data-card-style="${p.cardStyle}" to <body> */

/* Shell */
/* add: data-aeos-shell="${p.shell}" to your layout wrapper */
`;

      try {
        const blob = new Blob([css], { type: 'text/css' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `aeos-theme-${Date.now()}.css`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (_) {
        // Fallback: show in new tab
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<pre>${css.replace(/</g, '&lt;')}</pre>`);
          win.document.close();
        }
      }
    }

    /* ── Public API ───────────────────────────────────────────── */
    getPrefs() {
      return Object.assign({}, this.prefs);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     Auto-init
  ────────────────────────────────────────────────────────────── */
  function boot() {
    const instance = new AeosCustomizer();
    // Expose on window for programmatic control
    window.aeosCustomizer = instance;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
