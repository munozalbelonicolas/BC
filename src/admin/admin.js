/**
 * @file admin.js
 * Application Bootstrap, Router, RBAC Gatekeeper, and Event Dispatcher.
 */

import './styles/admin.css';
import { AdminLayout } from './components/AdminLayout.js';
import { CommandPalette } from './components/CommandPalette.js';
import { authorizer } from './core/rbac.js';

// Module Views
import { DashboardView } from './views/DashboardView.js';
import { ProductsView } from './views/ProductsView.js';
import { CategoriesView } from './views/CategoriesView.js';
import { BrandsView } from './views/BrandsView.js';
import { InventoryView } from './views/InventoryView.js';
import { OrdersView } from './views/OrdersView.js';
import { CustomersView } from './views/CustomersView.js';
import { PaymentsView } from './views/PaymentsView.js';
import { ShippingView } from './views/ShippingView.js';
import { PromotionsView } from './views/PromotionsView.js';
import { CouponsView } from './views/CouponsView.js';
import { UsersView } from './views/UsersView.js';
import { SettingsView } from './views/SettingsView.js';
import { AuditView } from './views/AuditView.js';

class AdminApp {
  constructor() {
    this.root = document.getElementById('admin-root');
    this.layout = null;
    this.commandPalette = null;
    this.currentView = null;
    this.activeRoute = 'dashboard';
    this.routeParam = null;

    this.routeMap = {
      dashboard: { view: DashboardView, permission: 'dashboard.read' },
      products: { view: ProductsView, permission: 'product.read' },
      categories: { view: CategoriesView, permission: 'category.read' },
      brands: { view: BrandsView, permission: 'brand.read' },
      inventory: { view: InventoryView, permission: 'inventory.read' },
      orders: { view: OrdersView, permission: 'order.read' },
      customers: { view: CustomersView, permission: 'customer.read' },
      payments: { view: PaymentsView, permission: 'payment.read' },
      shipping: { view: ShippingView, permission: 'shipping.read' },
      promotions: { view: PromotionsView, permission: 'promotion.read' },
      coupons: { view: CouponsView, permission: 'coupon.read' },
      users: { view: UsersView, permission: 'user.read' },
      settings: { view: SettingsView, permission: 'settings.read' },
      audit: { view: AuditView, permission: 'audit.read' }
    };
  }

  async init() {
    if (!this.root) {
      console.error('admin-root container not found');
      return;
    }

    // Initialize Master Layout
    this.layout = new AdminLayout({
      container: this.root,
      activeRoute: this.activeRoute,
      onNavigate: (route, param) => this.navigate(route, param),
      onRoleChange: () => this.handleRoleChanged()
    });
    this.layout.render();

    // Initialize Command Palette (CMD + K)
    this.commandPalette = new CommandPalette((route, param) => this.navigate(route, param));

    // Connect Topbar search trigger
    const searchTrigger = document.getElementById('topbar-command-trigger');
    if (searchTrigger) {
      searchTrigger.addEventListener('click', () => this.commandPalette.open());
    }

    // Subscribe to Authorizer changes
    authorizer.subscribe(() => {
      this.layout.render();
      this.renderCurrentRoute();
    });

    // Hash change listener
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '').trim();
    const parts = hash.split('/');
    const route = parts[0] || 'dashboard';
    const param = parts[1] || null;

    this.navigate(route, param, false);
  }

  navigate(route, param = null, updateHash = true) {
    if (!this.routeMap[route]) {
      route = 'dashboard';
    }

    this.activeRoute = route;
    this.routeParam = param;

    if (updateHash) {
      window.location.hash = param ? `${route}/${param}` : route;
    }

    this.layout.setActiveRoute(route);
    this.renderCurrentRoute();
  }

  handleRoleChanged() {
    this.renderCurrentRoute();
  }

  renderCurrentRoute() {
    const mountEl = document.getElementById('admin-view-root');
    if (!mountEl) return;

    const routeConfig = this.routeMap[this.activeRoute];

    // RBAC Authorization Gate
    if (!authorizer.can(routeConfig.permission)) {
      this.renderUnauthorized(mountEl, routeConfig.permission);
      return;
    }

    // Clean previous view
    mountEl.innerHTML = '';

    // Instantiate and mount new view
    const ViewClass = routeConfig.view;
    const viewOptions = {
      container: mountEl,
      onNavigate: (r, p) => this.navigate(r, p)
    };

    if (this.activeRoute === 'orders' && this.routeParam) {
      viewOptions.initialOrderId = this.routeParam;
    }

    this.currentView = new ViewClass(viewOptions);
    this.currentView.init();
  }

  renderUnauthorized(mountEl, requiredPermission) {
    const user = authorizer.getCurrentUser();
    const roleDef = authorizer.getRoleDefinition();

    mountEl.innerHTML = `
      <div style="background:white; border:1px solid #fee2e2; border-radius:12px; padding:60px 24px; text-align:center; max-width:540px; margin:40px auto; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="width:52px; height:52px; background:#fef2f2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-bottom:8px;">Acceso No Autorizado (403)</h2>
        <p style="font-size:14px; color:#64748b; line-height:1.5; margin-bottom:20px;">
          Tu rol actual (<strong>${roleDef.name}</strong>) no posee el permiso requerido: <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:12px;">${requiredPermission}</code>
        </p>
        <button class="btn btn-primary btn-sm" id="unauth-back-btn">
          Volver al Dashboard
        </button>
      </div>
    `;

    mountEl.querySelector('#unauth-back-btn').addEventListener('click', () => {
      this.navigate('dashboard');
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AdminApp();
  app.init();
});
