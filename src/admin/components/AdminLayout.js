/**
 * @file AdminLayout.js
 * Master Administrative Layout with responsive Sidebar, Topbar, Breadcrumbs, and RBAC switcher.
 */

import { authorizer, ROLE_DEFINITIONS } from '../core/rbac.js';

export class AdminLayout {
  constructor(options = {}) {
    this.container = options.container;
    this.activeRoute = options.activeRoute || 'dashboard';
    this.onNavigate = options.onNavigate || (() => {});
    this.onRoleChange = options.onRoleChange || (() => {});
    this.isSidebarOpenMobile = false;
  }

  render() {
    const user = authorizer.getCurrentUser();
    const roleDef = authorizer.getRoleDefinition();

    const navSections = [
      {
        title: 'Principal',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
            permission: 'dashboard.read'
          }
        ]
      },
      {
        title: 'Catálogo & Stock',
        items: [
          {
            id: 'products',
            label: 'Productos',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
            permission: 'product.read'
          },
          {
            id: 'categories',
            label: 'Categorías',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/></svg>`,
            permission: 'category.read'
          },
          {
            id: 'brands',
            label: 'Marcas',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`,
            permission: 'brand.read'
          },
          {
            id: 'inventory',
            label: 'Inventario',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
            permission: 'inventory.read'
          }
        ]
      },
      {
        title: 'Ventas & Operaciones',
        items: [
          {
            id: 'orders',
            label: 'Pedidos',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
            permission: 'order.read'
          },
          {
            id: 'customers',
            label: 'Clientes',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
            permission: 'customer.read'
          },
          {
            id: 'payments',
            label: 'Pagos',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
            permission: 'payment.read'
          },
          {
            id: 'shipping',
            label: 'Envíos',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
            permission: 'shipping.read'
          }
        ]
      },
      {
        title: 'Marketing & Promociones',
        items: [
          {
            id: 'promotions',
            label: 'Promociones',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
            permission: 'promotion.read'
          },
          {
            id: 'coupons',
            label: 'Cupones',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
            permission: 'coupon.read'
          }
        ]
      },
      {
        title: 'Sistema & Auditoría',
        items: [
          {
            id: 'users',
            label: 'Usuarios y Roles',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>`,
            permission: 'user.read'
          },
          {
            id: 'settings',
            label: 'Configuración',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
            permission: 'settings.read'
          },
          {
            id: 'audit',
            label: 'Auditoría',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
            permission: 'audit.read'
          }
        ]
      }
    ];

    const navHtml = navSections.map(section => {
      // Filter items according to permissions
      const visibleItems = section.items.filter(item => authorizer.can(item.permission));
      if (visibleItems.length === 0) return '';

      return `
        <div class="sidebar-section-title">${section.title}</div>
        ${visibleItems.map(item => `
          <a class="nav-item ${this.activeRoute === item.id ? 'active' : ''}" data-nav="${item.id}">
            ${item.icon}
            <span>${item.label}</span>
          </a>
        `).join('')}
      `;
    }).join('');

    const routeTitles = {
      dashboard: 'Dashboard',
      products: 'Productos',
      categories: 'Categorías',
      brands: 'Marcas',
      inventory: 'Inventario y Stock',
      orders: 'Pedidos',
      customers: 'Clientes',
      payments: 'Pagos y Transacciones',
      shipping: 'Métodos de Envío',
      promotions: 'Promociones',
      coupons: 'Cupones de Descuento',
      users: 'Usuarios y Roles',
      settings: 'Configuración General',
      audit: 'Registro de Auditoría'
    };

    const currentTitle = routeTitles[this.activeRoute] || 'Panel de Administración';

    this.container.innerHTML = `
      <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="admin-sidebar ${this.isSidebarOpenMobile ? 'open' : ''}" id="admin-sidebar">
          <div class="sidebar-header">
            <a href="#dashboard" class="sidebar-brand">
              <img src="/images/logo-bc-oscuro.png" alt="BC Especial Import" />
            </a>
            <span class="sidebar-brand-badge">PRO</span>
          </div>

          <div style="padding: 10px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:600; margin-bottom:4px;">Probar Rol (RBAC):</div>
            <select id="role-switcher-select" style="width:100%; font-size:12px; background:#1e293b; color:white; border:1px solid #334155; border-radius:6px; padding:4px 8px; outline:none; cursor:pointer;">
              ${Object.values(ROLE_DEFINITIONS).map(r => `
                <option value="${r.id}" ${user.role === r.id ? 'selected' : ''}>${r.name}</option>
              `).join('')}
            </select>
          </div>

          <nav class="sidebar-nav">
            ${navHtml}
          </nav>

          <div class="sidebar-footer">
            <div class="sidebar-user">
              <img src="${user.avatar}" class="sidebar-user-avatar" alt="Avatar" />
              <div class="sidebar-user-info">
                <div class="sidebar-user-name">${user.name}</div>
                <div class="sidebar-user-role">${roleDef.name}</div>
              </div>
            </div>
            <a href="/" target="_blank" title="Ver Tienda" style="color:#94a3b8; display:flex; align-items:center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>

          <div class="sidebar-powered">
            <span class="sidebar-powered-label">Powered by</span>
            <div class="sidebar-nilotech-brand">
              <img src="/images/logo-nilo.png" alt="Nilotech" class="sidebar-nilotech-logo" />
              <span>Nilotech</span>
            </div>
          </div>
        </aside>

        <!-- Main Body -->
        <div class="admin-main">
          <!-- Topbar Header -->
          <header class="admin-topbar">
            <div class="topbar-left">
              <button class="btn-mobile-sidebar" id="btn-toggle-sidebar" aria-label="Toggle menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>

              <nav class="breadcrumbs">
                <a href="#dashboard">Admin</a>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="current">${currentTitle}</span>
              </nav>
            </div>

            <div class="topbar-right">
              <!-- Global Command Search Trigger -->
              <div class="command-palette-trigger" id="topbar-command-trigger">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span>Buscar cualquier cosa...</span>
                <kbd>⌘K</kbd>
              </div>

              <!-- Customer Portal link -->
              <a href="/cuenta.html" class="store-preview-btn" style="border-color:#38bdf8; color:#38bdf8;" title="Ver Portal de Cuenta de Cliente">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/></svg>
                <span>Portal Cliente 👤</span>
              </a>

              <!-- Storefront link -->
              <a href="/" target="_blank" class="store-preview-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>Ver Tienda</span>
              </a>
            </div>
          </header>

          <!-- Module View Container -->
          <main class="page-container" id="admin-view-root">
            <!-- Dynamic view loads here -->
          </main>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Navigation clicks
    this.container.querySelectorAll('[data-nav]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.dataset.nav;
        this.isSidebarOpenMobile = false;
        this.onNavigate(route);
      });
    });

    // Mobile sidebar toggle
    const toggleBtn = this.container.querySelector('#btn-toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const sidebar = this.container.querySelector('#admin-sidebar');
        sidebar.classList.toggle('open');
      });
    }

    // Role switcher
    const roleSelect = this.container.querySelector('#role-switcher-select');
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        authorizer.setRole(e.target.value);
        if (this.onRoleChange) this.onRoleChange(e.target.value);
      });
    }
  }

  setActiveRoute(route) {
    this.activeRoute = route;
    this.render();
  }
}
