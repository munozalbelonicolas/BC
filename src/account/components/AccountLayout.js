/**
 * @file AccountLayout.js
 * Master layout for Customer Account Portal with branded header, mobile navigation, and user menu.
 */

import { customerAuthService } from '../services/customerAuthService.js';
import { store } from '../../state.js';

export class AccountLayout {
  constructor(options = {}) {
    this.container = options.container;
    this.activeRoute = options.activeRoute || 'dashboard';
    this.unreadNotificationsCount = options.unreadNotificationsCount || 0;
    this.onNavigate = options.onNavigate || (() => {});
    this.onLogout = options.onLogout || (() => {});
  }

  render() {
    const user = customerAuthService.getCurrentCustomer();
    const cartCount = store.getCartCount();
    const initials = user ? `${user.name[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';

    const navItems = [
      { id: 'dashboard', label: 'Mi Cuenta', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
      { id: 'pedidos', label: 'Mis Pedidos', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>` },
      { id: 'direcciones', label: 'Mis Direcciones', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>` },
      { id: 'favoritos', label: 'Mis Favoritos', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>` },
      { id: 'cupones', label: 'Mis Cupones', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>` },
      { id: 'devoluciones', label: 'Devoluciones y Cambios', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>` },
      { id: 'notificaciones', label: 'Notificaciones', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`, badge: this.unreadNotificationsCount > 0 ? this.unreadNotificationsCount : null },
      { id: 'perfil', label: 'Mis Datos Personales', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
      { id: 'seguridad', label: 'Seguridad de la Cuenta', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` }
    ];

    const sidebarNavHtml = navItems.map(item => `
      <a class="portal-nav-item ${this.activeRoute === item.id ? 'active' : ''}" data-route="${item.id}">
        ${item.icon}
        <span>${item.label}</span>
        ${item.badge ? `<span class="portal-nav-badge">${item.badge}</span>` : ''}
      </a>
    `).join('');

    const mobileNavHtml = navItems.map(item => `
      <a class="mobile-nav-item ${this.activeRoute === item.id ? 'active' : ''}" data-route="${item.id}">
        ${item.label} ${item.badge ? `(${item.badge})` : ''}
      </a>
    `).join('');

    this.container.innerHTML = `
      <!-- Consumer Header -->
      <header class="portal-header">
        <div class="portal-header-inner">
          <div style="display:flex; align-items:center; gap:16px;">
            <a href="/" class="portal-brand">
              <img src="/images/logo-transparent.png" alt="BC Especial Import" />
              <span class="portal-brand-text">BC IMPORT</span>
            </a>
            <span class="portal-brand-badge">Mi Cuenta</span>
          </div>

          <div class="portal-header-actions">
            <a href="/" class="portal-back-store-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span>Volver a la Tienda</span>
            </a>

            <button class="portal-notification-bell" id="bell-notif-btn" title="Notificaciones" aria-label="Notificaciones">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              ${this.unreadNotificationsCount > 0 ? `<span class="portal-notification-badge"></span>` : ''}
            </button>

            <a href="/#carrito" class="portal-back-store-btn" style="position:relative;" title="Carrito de compras">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              ${cartCount > 0 ? `<span style="background:var(--acc-primary); color:white; font-size:10px; font-weight:700; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; margin-left:4px;">${cartCount}</span>` : ''}
            </a>

            <div class="portal-user-chip" id="portal-user-dropdown-btn">
              <div class="portal-avatar">${initials}</div>
              <span class="portal-user-name">${user ? user.name : 'Usuario'}</span>
            </div>
          </div>
        </div>

        <!-- Mobile Horizontal Tab Strip -->
        <nav class="mobile-nav-bar">
          ${mobileNavHtml}
        </nav>
      </header>

      <!-- Main Layout -->
      <div class="portal-layout">
        <!-- Desktop Sidebar -->
        <aside class="portal-sidebar">
          <div class="portal-nav-group-title">Menú de Cuenta</div>
          <nav style="display:flex; flex-direction:column; gap:2px;">
            ${sidebarNavHtml}
          </nav>

          <div style="margin-top:16px; padding-top:12px; border-top:1px solid var(--acc-border);">
            <button class="portal-nav-item" id="sidebar-logout-btn" style="color:var(--acc-danger); width:100%; border:none; background:none; text-align:left;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        <!-- View Body -->
        <main class="portal-main" id="portal-view-mount">
          <!-- Dynamic view content injected here -->
        </main>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.dataset.route;
        this.activeRoute = route;
        this.render();
        this.onNavigate(route);
      });
    });

    const logoutBtn = this.container.querySelector('#sidebar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.onLogout());
    }

    const bellBtn = this.container.querySelector('#bell-notif-btn');
    if (bellBtn) {
      bellBtn.addEventListener('click', () => {
        this.onNavigate('notificaciones');
      });
    }
  }

  setActiveRoute(route) {
    this.activeRoute = route;
    this.render();
  }
}
