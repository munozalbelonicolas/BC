/**
 * @file AccountOrdersView.js
 * Customer Orders directory with consumer-friendly cards, simple filters, and re-order triggers.
 */

import { CustomerOrderService } from '../services/customerOrderService.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountOrdersView {
  constructor(options = {}) {
    this.container = options.container;
    this.onNavigate = options.onNavigate || (() => {});
    this.allOrders = [];
    this.filteredOrders = [];
    this.activeFilter = 'todos'; // 'todos' | 'en_curso' | 'entregados' | 'cancelados'
  }

  async init() {
    this.allOrders = await CustomerOrderService.getOrders();
    this.applyFilter();
    this.render();
  }

  applyFilter() {
    if (this.activeFilter === 'en_curso') {
      this.filteredOrders = this.allOrders.filter(o => !o.status.includes('Entregado') && !o.status.includes('Cancelado'));
    } else if (this.activeFilter === 'entregados') {
      this.filteredOrders = this.allOrders.filter(o => o.status.includes('Entregado'));
    } else if (this.activeFilter === 'cancelados') {
      this.filteredOrders = this.allOrders.filter(o => o.status.includes('Cancelado'));
    } else {
      this.filteredOrders = [...this.allOrders];
    }
  }

  render() {
    const filterTabs = [
      { id: 'todos', label: 'Todos' },
      { id: 'en_curso', label: 'En Curso' },
      { id: 'entregados', label: 'Entregados' },
      { id: 'cancelados', label: 'Cancelados' }
    ].map(f => `
      <button class="btn-portal btn-portal-sm ${this.activeFilter === f.id ? 'btn-portal-primary' : 'btn-portal-secondary'}" data-filter="${f.id}">
        ${f.label}
      </button>
    `).join('');

    let ordersListHtml = '';
    if (this.filteredOrders.length === 0) {
      ordersListHtml = `
        <div class="portal-empty-state">
          <div class="portal-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <h3 class="portal-empty-title">Todavía no registrás pedidos en este estado</h3>
          <p class="portal-empty-text">Explorá nuestro catálogo de tecnología y electrodomésticos importados con garantía oficial.</p>
          <a href="/" class="btn-portal btn-portal-primary">Ver Productos</a>
        </div>
      `;
    } else {
      ordersListHtml = this.filteredOrders.map(o => {
        let badgeCls = 'primary';
        if (o.status.includes('Entregado')) badgeCls = 'success';
        if (o.status.includes('Cancelado')) badgeCls = 'danger';

        const totalItemsCount = (o.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

        return `
          <div class="customer-order-card">
            <div class="order-card-top">
              <div>
                <span class="order-card-id">Pedido ${o.id}</span>
                <span class="order-card-date">• ${new Date(o.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <span class="status-pill ${badgeCls}">${o.status}</span>
            </div>

            <div class="order-card-body">
              <div class="order-thumbs-row">
                ${(o.items || []).slice(0, 3).map(i => `
                  <img src="${i.image}" class="order-thumb-img" alt="${i.name}" title="${i.name}" />
                `).join('')}
                <div class="order-details-summary" style="margin-left:4px;">
                  <span style="font-size:14px; font-weight:600; color:var(--acc-text);">${o.items?.[0]?.name || 'Producto'}</span>
                  ${(o.items || []).length > 1 ? `<span style="font-size:12px; color:var(--acc-muted);">y ${o.items.length - 1} producto(s) más</span>` : ''}
                  <span style="font-size:12px; color:var(--acc-muted); margin-top:2px;">${totalItemsCount} unidad(es) en total</span>
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
                <div style="text-align:right;">
                  <div style="font-size:11px; text-transform:uppercase; color:var(--acc-muted); font-weight:600;">Total abonado</div>
                  <div class="order-total-amount">$${Number(o.total).toLocaleString('es-AR')}</div>
                </div>

                <div class="order-card-actions">
                  <button class="btn-portal btn-portal-secondary btn-portal-sm" data-action="view-detail" data-id="${o.id}">
                    Ver Detalle
                  </button>
                  <button class="btn-portal btn-portal-primary btn-portal-sm" data-action="reorder" data-id="${o.id}">
                    Volver a Comprar
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    this.container.innerHTML = `
      <div class="portal-page-header">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1>Mis Pedidos</h1>
            <p>Historial completo de tus compras y comprobantes de entrega</p>
          </div>
          <div style="display:flex; gap:8px;">
            ${filterTabs}
          </div>
        </div>
      </div>

      <div id="orders-list-mount">
        ${ordersListHtml}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.dataset.filter;
        this.applyFilter();
        this.render();
      });
    });

    this.container.querySelectorAll('[data-action="view-detail"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.onNavigate(`pedidos/${btn.dataset.id}`);
      });
    });

    this.container.querySelectorAll('[data-action="reorder"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const order = this.allOrders.find(o => o.id === btn.dataset.id);
        if (order && order.items) {
          const res = CustomerOrderService.reorderItems(order.items);
          if (res.success) {
            accountToast.show(`¡Se agregaron ${res.added.length} producto(s) a tu carrito con el precio actual!`, 'success');
          }
          if (res.unavailable.length > 0) {
            accountToast.show(`Atención: ${res.unavailable.join(', ')}`, 'warning');
          }
        }
      });
    });
  }
}
