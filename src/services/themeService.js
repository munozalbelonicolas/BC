/**
 * @file themeService.js
 * Theme management (light / dark) with persistence in localStorage and system preference detection.
 */

class ThemeService {
  constructor() {
    this.storageKey = 'bc_theme';
    this.theme = this.detectInitialTheme();
    this.applyTheme(this.theme);
  }

  detectInitialTheme() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}

    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
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
