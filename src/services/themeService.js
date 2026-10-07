/**
 * @file themeService.js
 * Theme management (light / dark) defaulting strictly to clean Light mode.
 */

class ThemeService {
  constructor() {
    this.storageKey = 'bc_theme_v2';
    try {
      localStorage.removeItem('bc_theme');
    } catch {}
    this.theme = this.detectInitialTheme();
    this.applyTheme(this.theme);
  }

  detectInitialTheme() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}

    // Default strictly to clean Light mode
    return 'light';
  }

  init() {
    this.theme = this.detectInitialTheme();
    this.applyTheme(this.theme);
    return this.theme;
  }

  getTheme() {
    return this.theme;
  }

  setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    this.theme = theme;
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {}
    this.applyTheme(theme);
    window.dispatchEvent(new CustomEvent('bc:theme-change', { detail: { theme } }));
  }

  toggleTheme() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  applyTheme(theme) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (document.body) {
        document.body.setAttribute('data-theme', theme);
      }
    }
  }
}

export const themeService = new ThemeService();
