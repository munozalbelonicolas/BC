/**
 * @file AccountDashboardView.js
 * Customer Account home dashboard with personalized greeting, active order tracker, and quick shortcuts.
 */

import { customerAuthService } from '../services/customerAuthService.js';
import { CustomerOrderService } from '../services/customerOrderService.js';
import { SupportModal } from '../components/SupportModal.js';

export class AccountDashboardView {
  constructor(options = {}) {
    this.container = options.container;
    this.onNavigate = options.onNavigate || (() => {});
    this.recentOrders = [];
  }

  async init() {
    this.recentOrders = await CustomerOrderService.getOrders();
    this.render();
  }

  render() {
    const user = customerAuthService.getCurrentCustomer();
    const name = user ? user.name : 'Cliente';
    const activeOrder = this.recentOrders[0] || null;

    // Fast tracking visual bar for active order
    let activeOrderCard = '';
    if (activeOrder) {
      const step = activeOrder.statusStep || 2;
      activeOrderCard = `
        <div class="portal-card" style="border-left: 4px solid var(--acc-primary);">
          <div class="portal-card-header">
            <div>
              <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--acc-primary); letter-spacing:0.04em;">Último Pedido en Curso</span>
              <h2 style="font-size:18px; font-weight:800; color:var(--acc-text); margin-top:2px;">Pedido ${activeOrder.id}</h2>
              <span style="font-size:12.5px; color:var(--acc-muted);">${new Date(activeOrder.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}</span>
            </div>
            <span class="status-pill ${activeOrder.status.includes('Entregado') ? 'success' : 'primary'}">
              ${activeOrder.status}
            </span>
          </div>

          <!-- Stepper Visual -->
          <div class="customer-stepper">
            <div class="step-node ${step >= 1 ? 'completed' : ''}">
              <div class="step-node-dot">${step > 1 ? '✓' : '1'}</div>
              <span class="step-node-label">Confirmado</span>
            </div>
            <div class="step-node ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}">
              <div class="step-node-dot">${step > 2 ? '✓' : '2'}</div>
              <span class="step-node-label">Preparando</span>
            </div>
            <div class="step-node ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}">
              <div class="step-node-dot">${step > 3 ? '✓' : '3'}</div>
              <span class="step-node-label">Despachado</span>
            </div>
            <div class="step-node ${step >= 4 ? 'completed' : ''}">
              <div class="step-node-dot">4</div>
              <span class="step-node-label">Entregado</span>
            </div>
          </div>

          <!-- Items preview & CTA -->
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:16px; padding-top:16px; border-top:1px solid var(--acc-border); flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              ${(activeOrder.items || []).slice(0, 3).map(i => `
                <img src="${i.image}" style="width:48px; height:48px; border-radius:8px; object-fit:cover; border:1px solid var(--acc-border);" title="${i.name}" />
              `).join('')}
              <div style="font-size:13px; color:var(--acc-muted); margin-left:6px;">
                ${activeOrder.items?.length || 1} producto(s) • <strong>$${Number(activeOrder.total).toLocaleString('es-AR')}</strong>
              </div>
            </div>

            <div style="display:flex; gap:8px;">
              <button class="btn-portal btn-portal-primary btn-portal-sm" id="dash-view-order-btn">
                Ver Detalle del Pedido
              </button>
            </div>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="portal-page-header">
        <h1>¡Hola, ${name}! 👋</h1>
        <p>Bienvenido a tu panel personal. Gestioná tus compras, envíos y preferencias desde aquí.</p>
      </div>

      ${activeOrderCard}

      <!-- Quick Access Cards -->
      <div class="portal-quick-grid">
        <div class="portal-quick-card" data-goto="pedidos">
          <div class="portal-quick-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <div class="portal-quick-title">Mis Pedidos</div>
          <div class="portal-quick-desc">Consultá tus compras anteriores, facturas y seguimiento</div>
        </div>

        <div class="portal-quick-card" data-goto="direcciones">
          <div class="portal-quick-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="portal-quick-title">Direcciones</div>
          <div class="portal-quick-desc">Guardá tus domicilios para recibir tus entregas más rápido</div>
        </div>

        <div class="portal-quick-card" data-goto="favoritos">
          <div class="portal-quick-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <div class="portal-quick-title">Favoritos</div>
          <div class="portal-quick-desc">Artículos guardados listos para sumar a tu carrito</div>
        </div>

        <div class="portal-quick-card" data-goto="cupones">
          <div class="portal-quick-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
          </div>
          <div class="portal-quick-title">Mis Cupones</div>
          <div class="portal-quick-desc">Aprovechá descuentos exclusivos para tu cuenta</div>
        </div>

        <div class="portal-quick-card" data-goto="perfil">
          <div class="portal-quick-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="portal-quick-title">Mis Datos</div>
          <div class="portal-quick-desc">Modificá tu nombre, teléfono y datos de contacto</div>
        </div>

        <div class="portal-quick-card" data-goto="seguridad">
          <div class="portal-quick-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="portal-quick-title">Seguridad</div>
          <div class="portal-quick-desc">Cambiá tu contraseña y revisá sesiones activas</div>
        </div>
      </div>

      <!-- Support Banner -->
      <div style="background:#f8fafc; border:1px solid var(--acc-border); border-radius:var(--acc-radius-md); padding:18px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#ecfdf5; color:#059669; display:flex; align-items:center; justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div>
            <div style="font-weight:700; font-size:14px; color:var(--acc-text);">¿Tenés alguna duda o consulta con una compra?</div>
            <div style="font-size:12.5px; color:var(--acc-muted);">Nuestro equipo te asiste en tiempo real vía WhatsApp o email oficial.</div>
          </div>
        </div>
        <button class="btn-portal btn-portal-secondary btn-portal-sm" id="dash-support-btn">
          Contactar a Soporte
        </button>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('[data-goto]').forEach(card => {
      card.addEventListener('click', () => {
        this.onNavigate(card.dataset.goto);
      });
    });

    const viewOrderBtn = this.container.querySelector('#dash-view-order-btn');
    if (viewOrderBtn && this.recentOrders[0]) {
      viewOrderBtn.addEventListener('click', () => {
        this.onNavigate(`pedidos/${this.recentOrders[0].id}`);
      });
    }

    const supportBtn = this.container.querySelector('#dash-support-btn');
    if (supportBtn) {
      supportBtn.addEventListener('click', () => {
        const modal = new SupportModal();
        modal.open();
      });
    }
  }
}
