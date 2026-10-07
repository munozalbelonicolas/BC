/**
 * @file account.js
 * Entry point and router for the Customer Account Portal.
 */

import './styles/account.css';
import { customerAuthService } from './services/customerAuthService.js';
import { CustomerNotificationService } from './services/customerNotificationService.js';
import { AccountLayout } from './components/AccountLayout.js';
import { AccountAuthView } from './views/AccountAuthView.js';
import { AccountDashboardView } from './views/AccountDashboardView.js';
import { AccountOrdersView } from './views/AccountOrdersView.js';
import { AccountOrderDetailView } from './views/AccountOrderDetailView.js';
import { AccountAddressesView } from './views/AccountAddressesView.js';
import { AccountFavoritesView } from './views/AccountFavoritesView.js';
import { AccountCouponsView } from './views/AccountCouponsView.js';
import { AccountReturnsView } from './views/AccountReturnsView.js';
import { AccountNotificationsView } from './views/AccountNotificationsView.js';
import { AccountProfileView } from './views/AccountProfileView.js';
import { AccountSecurityView } from './views/AccountSecurityView.js';
import { accountToast } from './components/AccountToast.js';

class CustomerAccountApp {
  constructor() {
    this.root = document.getElementById('account-root');
    this.layout = null;
    this.currentView = null;
    this.unreadNotificationsCount = 0;
  }

  async init() {
    if (!this.root) {
      console.error('Customer Account root element (#account-root) not found.');
      return;
    }

    // Subscribe to auth state changes
    customerAuthService.subscribe((profile) => {
      if (!profile) {
        this.renderAuth();
      }
    });

    // Check if authenticated
    if (!customerAuthService.isAuthenticated()) {
      this.renderAuth();
      return;
    }

    await this.mountLayoutAndRoute();

    // Listen to hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  renderAuth() {
    this.layout = null;
    this.root.innerHTML = '';
    const authView = new AccountAuthView(async (profile) => {
      await this.mountLayoutAndRoute();
    });
    authView.render(this.root);
  }

  async mountLayoutAndRoute() {
    try {
      const notifs = await CustomerNotificationService.getNotifications();
      this.unreadNotificationsCount = notifs.filter(n => !n.isRead).length;
    } catch {
      this.unreadNotificationsCount = 0;
    }

    this.root.innerHTML = '';
    this.layout = new AccountLayout({
      container: this.root,
      activeRoute: this.getNormalizedRoute(),
      unreadNotificationsCount: this.unreadNotificationsCount,
      onNavigate: (route) => {
        window.location.hash = `#${route}`;
      },
      onLogout: async () => {
        await customerAuthService.signOut();
        accountToast.info('Has cerrado sesión correctamente.');
        this.renderAuth();
      }
    });

    this.layout.render();
    await this.handleRoute();
  }

  getNormalizedRoute() {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (!hash) return 'dashboard';
    const [section] = hash.split('/');
    return section || 'dashboard';
  }

  async handleRoute() {
    if (!customerAuthService.isAuthenticated()) {
      this.renderAuth();
      return;
    }

    // Ensure layout exists
    if (!this.layout || !document.getElementById('portal-view-mount')) {
      await this.mountLayoutAndRoute();
      return;
    }

    const mount = document.getElementById('portal-view-mount');
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    const parts = hash.split('/');
    const mainSection = parts[0] || 'dashboard';
    const subParam = parts[1] || null;

    // Update active nav state in layout
    this.layout.setActiveRoute(mainSection);

    // Show smooth skeleton during view initialization
    mount.innerHTML = `
      <div style="padding: 24px 0;">
        <div style="height: 28px; width: 220px; background: #e2e8f0; border-radius: 8px; margin-bottom: 12px; animation: pulse 1.5s infinite;"></div>
        <div style="height: 16px; width: 340px; background: #f1f5f9; border-radius: 6px; margin-bottom: 24px; animation: pulse 1.5s infinite;"></div>
        <div style="height: 140px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; animation: pulse 1.5s infinite;"></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;

    try {
      if (mainSection === 'dashboard') {
        this.currentView = new AccountDashboardView({
          container: mount,
          onNavigate: (route) => { window.location.hash = `#${route}`; }
        });
        await this.currentView.init();
      } else if (mainSection === 'pedidos') {
        if (subParam) {
          // Single Order Detail view
          this.currentView = new AccountOrderDetailView({
            container: mount,
            orderId: subParam,
            onNavigate: (route) => { window.location.hash = `#${route}`; }
          });
          await this.currentView.init();
        } else {
          // Orders List view
          this.currentView = new AccountOrdersView({
            container: mount,
            onNavigate: (route) => { window.location.hash = `#${route}`; }
          });
          await this.currentView.init();
        }
      } else if (mainSection === 'direcciones') {
        this.currentView = new AccountAddressesView({
          container: mount
        });
        await this.currentView.init();
      } else if (mainSection === 'favoritos') {
        this.currentView = new AccountFavoritesView({
          container: mount
        });
        await this.currentView.init();
      } else if (mainSection === 'cupones') {
        this.currentView = new AccountCouponsView({
          container: mount
        });
        await this.currentView.init();
      } else if (mainSection === 'devoluciones') {
        this.currentView = new AccountReturnsView({
          container: mount
        });
        await this.currentView.init();
      } else if (mainSection === 'notificaciones') {
        this.currentView = new AccountNotificationsView({
          container: mount,
          onNavigate: (route) => { window.location.hash = `#${route}`; }
        });
        await this.currentView.init();
      } else if (mainSection === 'perfil') {
        this.currentView = new AccountProfileView({
          container: mount
        });
        await this.currentView.init();
      } else if (mainSection === 'seguridad') {
        this.currentView = new AccountSecurityView({
          container: mount,
          onLogout: async () => {
            await customerAuthService.signOut();
            accountToast.info('Sesión cerrada.');
            this.renderAuth();
          }
        });
        await this.currentView.init();
      } else {
        // Fallback to dashboard
        window.location.hash = '#dashboard';
      }
    } catch (err) {
      console.error('Error rendering customer portal view:', err);
      mount.innerHTML = `
        <div class="portal-card" style="text-align: center; padding: 48px 24px;">
          <h3 style="font-size: 18px; font-weight: 700; color: var(--acc-danger); margin-bottom: 8px;">No pudimos cargar esta sección</h3>
          <p style="color: var(--acc-muted); font-size: 14px; margin-bottom: 20px;">Por favor intentá nuevamente o regresá al panel principal.</p>
          <a href="#dashboard" class="btn-portal btn-portal-primary">Ir a Mi Cuenta</a>
        </div>
      `;
    }

    // Scroll to top of main on view transition
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new CustomerAccountApp();
  app.init();
});
