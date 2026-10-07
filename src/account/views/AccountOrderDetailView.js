/**
 * @file AccountOrderDetailView.js
 * Detailed Order View for customers with visual stepping timeline, tracking,
 * re-order stock validator, invoice slip, and support trigger.
 */

import { CustomerOrderService } from '../services/customerOrderService.js';
import { SupportModal } from '../components/SupportModal.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountOrderDetailView {
  constructor(options = {}) {
    this.container = options.container;
    this.orderId = options.orderId;
    this.onNavigate = options.onNavigate || (() => {});
    this.order = null;
    this.isLoading = true;
  }

  async init() {
    this.isLoading = true;
    try {
      this.order = await CustomerOrderService.getOrderById(this.orderId);
    } catch (err) {
      console.warn('Error fetching customer order:', err);
    } finally {
      this.isLoading = false;
    }
    this.render();
  }

  render() {
    if (!this.order) {
      this.container.innerHTML = `
        <div class="portal-empty-state">
          <h3 class="portal-empty-title">Pedido no encontrado</h3>
          <p class="portal-empty-text">No pudimos encontrar los detalles del pedido solicitado o no pertenece a tu cuenta.</p>
          <button class="btn-portal btn-portal-primary" id="od-back-btn">Volver a Mis Pedidos</button>
        </div>
      `;
      this.container.querySelector('#od-back-btn').addEventListener('click', () => this.onNavigate('pedidos'));
      return;
    }

    const o = this.order;
    const step = o.statusStep || 2;
    const isDelivered = o.status.includes('Entregado');
    const isCancelled = o.status.includes('Cancelado');

    // Products table list
    const itemsHtml = (o.items || []).map(item => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 0; border-bottom:1px solid var(--acc-border); gap:16px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:14px;">
          <img src="${item.image}" style="width:60px; height:60px; border-radius:8px; object-fit:cover; border:1px solid var(--acc-border);" alt="${item.name}" />
          <div>
            <div style="font-weight:700; font-size:14px; color:var(--acc-text);">${item.name}</div>
            <div style="font-size:12.5px; color:var(--acc-muted);">${item.variant || 'Estándar'} • Cant: <strong>${item.quantity}</strong></div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:15px; color:var(--acc-text);">$${Number(item.subtotal || item.unitPrice * item.quantity).toLocaleString('es-AR')}</div>
          <div style="font-size:11.5px; color:var(--acc-muted);">$${Number(item.unitPrice).toLocaleString('es-AR')} c/u</div>
        </div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div style="margin-bottom:20px;">
        <button class="btn-portal btn-portal-secondary btn-portal-sm" id="od-back-list-btn" style="margin-bottom:12px;">
          ← Volver a Mis Pedidos
        </button>

        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="font-size:24px; font-weight:800; color:var(--acc-text);">Pedido ${o.id}</h1>
            <div style="font-size:13px; color:var(--acc-muted); margin-top:2px;">
              Realizado el ${new Date(o.date).toLocaleDateString('es-AR', { dateStyle: 'full' })}
            </div>
          </div>

          <div style="display:flex; gap:10px; align-items:center;">
            <span class="status-pill ${isDelivered ? 'success' : (isCancelled ? 'danger' : 'primary')}">
              ${o.status}
            </span>
          </div>
        </div>
      </div>

      <!-- Stepper Visual -->
      <div class="portal-card" style="padding:24px 20px;">
        <div style="font-size:13px; font-weight:700; color:var(--acc-text); margin-bottom:12px;">
          Progreso del Envío:
        </div>
        <div class="customer-stepper">
          <div class="step-node ${step >= 1 ? 'completed' : ''}">
            <div class="step-node-dot">${step > 1 ? '✓' : '1'}</div>
            <span class="step-node-label">Pedido Realizado</span>
          </div>
          <div class="step-node ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}">
            <div class="step-node-dot">${step > 2 ? '✓' : '2'}</div>
            <span class="step-node-label">Pago Aprobado</span>
          </div>
          <div class="step-node ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}">
            <div class="step-node-dot">${step > 2 ? '✓' : '3'}</div>
            <span class="step-node-label">En Preparación</span>
          </div>
          <div class="step-node ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}">
            <div class="step-node-dot">${step > 3 ? '✓' : '4'}</div>
            <span class="step-node-label">Despachado</span>
          </div>
          <div class="step-node ${step >= 4 ? 'completed' : ''}">
            <div class="step-node-dot">${step >= 4 ? '✓' : '5'}</div>
            <span class="step-node-label">Entregado</span>
          </div>
        </div>

        ${o.trackingCode ? `
          <div style="background:var(--acc-subtle); border:1px solid var(--acc-border); border-radius:10px; padding:14px; margin-top:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="font-size:11.5px; text-transform:uppercase; font-weight:700; color:var(--acc-muted);">Seguimiento Logístico (${o.carrier})</span>
              <div style="font-family:monospace; font-size:14px; font-weight:700; color:var(--acc-text); margin-top:2px;">
                Código: ${o.trackingCode}
              </div>
              <div style="font-size:12px; color:var(--acc-muted);">Fecha estimada: <strong>${o.estimatedDelivery || 'En los próximos días'}</strong></div>
            </div>
            <a href="https://www.andreani.com/#!/personas" target="_blank" class="btn-portal btn-portal-primary btn-portal-sm" style="text-decoration:none;">
              Seguir Envío en Andreani ↗
            </a>
          </div>
        ` : ''}
      </div>

      <!-- 2 Columns: Items & Summary -->
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; align-items:start;">
        <!-- Left: Items -->
        <div class="portal-card">
          <div class="portal-card-header">
            <span class="portal-card-title">Artículos Comprados (${o.items?.length || 1})</span>
            <button class="btn-portal btn-portal-secondary btn-portal-sm" id="od-reorder-all-btn">
              Volver a Comprar Todo
            </button>
          </div>

          <div>
            ${itemsHtml}
          </div>

          <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn-portal btn-portal-secondary btn-portal-sm" id="od-help-btn">
              ¿Necesitás ayuda con este pedido?
            </button>
            <button class="btn-portal btn-portal-secondary btn-portal-sm" id="od-receipt-btn">
              Ver Comprobante Oficial
            </button>
            ${o.canCancel ? `
              <button class="btn-portal btn-portal-sm" id="od-cancel-order-btn" style="color:var(--acc-danger); border-color:#fecaca;">
                Cancelar Pedido
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Right: Financial Summary & Delivery Info -->
        <div>
          <div class="portal-card" style="margin-bottom:16px;">
            <div class="portal-card-title" style="margin-bottom:14px;">Resumen del Pedido</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13.5px; color:var(--acc-muted);">
              <span>Subtotal:</span>
              <span>$${Number(o.subtotal).toLocaleString('es-AR')}</span>
            </div>
            ${o.discount ? `
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13.5px; color:var(--acc-success-text);">
                <span>Descuento aplicado:</span>
                <span>-$${Number(o.discount).toLocaleString('es-AR')}</span>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:13.5px; color:var(--acc-muted);">
              <span>Envío:</span>
              <span>${o.shippingCost ? `$${Number(o.shippingCost).toLocaleString('es-AR')}` : 'Gratis'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid var(--acc-border); font-size:17px; font-weight:800; color:var(--acc-text);">
              <span>Total:</span>
              <span>$${Number(o.total).toLocaleString('es-AR')}</span>
            </div>
            <div style="font-size:12px; color:var(--acc-muted); margin-top:8px;">
              Medio de pago: <strong>${o.paymentMethod || 'Tarjeta / Mercado Pago'}</strong>
            </div>
          </div>

          <div class="portal-card">
            <div class="portal-card-title" style="margin-bottom:12px;">Datos de Entrega</div>
            <div style="font-size:13.5px; line-height:1.6; color:var(--acc-text);">
              <div style="font-weight:700;">${o.shippingAddress?.recipient || 'Destinatario'}</div>
              <div>${o.shippingAddress?.street || 'Domicilio Showroom'}</div>
              <div style="color:var(--acc-muted);">${o.shippingAddress?.city || 'CABA, Argentina'}</div>
              <div style="margin-top:6px; font-size:12px; color:var(--acc-primary); font-weight:600;">
                Logística: ${o.carrier || 'Andreani Express'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#od-back-list-btn').addEventListener('click', () => {
      this.onNavigate('pedidos');
    });

    const reorderBtn = this.container.querySelector('#od-reorder-all-btn');
    if (reorderBtn) {
      reorderBtn.addEventListener('click', () => {
        const res = CustomerOrderService.reorderItems(this.order.items);
        if (res.success) {
          accountToast.show(`¡Agregamos ${res.added.length} artículo(s) al carrito con el precio actual!`, 'success');
        }
        if (res.unavailable.length > 0) {
          accountToast.show(`No disponibles: ${res.unavailable.join(', ')}`, 'warning');
        }
      });
    }

    const helpBtn = this.container.querySelector('#od-help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        const modal = new SupportModal({ orderId: this.order.id });
        modal.open();
      });
    }

    const receiptBtn = this.container.querySelector('#od-receipt-btn');
    if (receiptBtn) {
      receiptBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }
}
