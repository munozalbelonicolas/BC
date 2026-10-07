/**
 * @file DashboardView.js
 * Primary executive analytics dashboard with period filtering, interactive SVG charts, and operational alerts.
 */

import { AnalyticsService } from '../services/analyticsService.js';
import { renderMetricCard } from '../components/MetricCard.js';
import { ChartComponent } from '../components/ChartComponent.js';

export class DashboardView {
  constructor(options = {}) {
    this.container = options.container;
    this.onNavigate = options.onNavigate || (() => {});
    this.currentPeriod = '30days';
    this.metrics = null;
    this.isLoading = true;
  }

  async init() {
    this.renderLoading();
    await this.loadData();
    this.render();
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.metrics = await AnalyticsService.getDashboardMetrics(this.currentPeriod);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      this.isLoading = false;
    }
  }

  renderLoading() {
    this.container.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;"></div>
        <p style="color: var(--text-muted); font-size: 14px;">Cargando métricas y análisis en tiempo real...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  }

  render() {
    if (!this.metrics) return;

    const {
      totalSales,
      ordersCount,
      avgTicket,
      statuses,
      inventory,
      paymentMethods,
      dailySeries,
      topSellingProducts,
      recentOrders
    } = this.metrics;

    // Period options labels
    const periodButtons = [
      { id: 'today', label: 'Hoy' },
      { id: '7days', label: 'Últimos 7 días' },
      { id: '30days', label: 'Últimos 30 días' },
      { id: 'thisMonth', label: 'Este mes' },
      { id: 'lastMonth', label: 'Mes anterior' }
    ].map(p => `
      <button class="btn btn-sm ${this.currentPeriod === p.id ? 'btn-primary' : 'btn-secondary'}" data-period="${p.id}">
        ${p.label}
      </button>
    `).join('');

    // Low stock alert banner
    let alertBanner = '';
    if (inventory.lowStockCount > 0 || inventory.outOfStockCount > 0) {
      alertBanner = `
        <div style="background-color:#fffbeb; border:1px solid #fde68a; border-radius:var(--radius-lg); padding:14px 20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <strong style="color:#92400e; font-size:14px;">Alerta Operativa de Stock:</strong>
              <span style="color:#78350f; font-size:13.5px; margin-left:4px;">
                Hay <strong>${inventory.outOfStockCount}</strong> producto(s) sin stock y <strong>${inventory.lowStockCount}</strong> en nivel crítico.
              </span>
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" id="dash-goto-inventory-btn" style="border-color:#fcd34d; background:white; color:#92400e;">
            Gestionar Stock
          </button>
        </div>
      `;
    }

    // Top Metric Cards
    const kpiCardsHtml = `
      <div class="metrics-grid">
        ${renderMetricCard({
          title: 'Ventas Totales',
          value: totalSales,
          isCurrency: true,
          delta: 14.8,
          deltaText: 'vs período anterior',
          iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
        })}
        ${renderMetricCard({
          title: 'Pedidos Confirmados',
          value: ordersCount,
          delta: 8.2,
          deltaText: 'pedidos concretados',
          iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`
        })}
        ${renderMetricCard({
          title: 'Ticket Promedio',
          value: avgTicket,
          isCurrency: true,
          delta: 4.1,
          deltaText: 'por pedido',
          iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M16 2v4"/><path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>`
        })}
        ${renderMetricCard({
          title: 'Stock Crítico',
          value: inventory.lowStockCount + inventory.outOfStockCount,
          delta: null,
          deltaText: `${inventory.outOfStockCount} agotados / ${inventory.lowStockCount} bajos`,
          iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
        })}
      </div>
    `;

    // Order status breakdown strip
    const orderStatusStrip = `
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <span class="card-title">Estado de Flujo de Pedidos</span>
          <a href="#orders" style="font-size:12.5px; color:var(--primary); text-decoration:none; font-weight:600;">Ver todos los pedidos →</a>
        </div>
        <div class="card-body" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; padding:16px;">
          <div style="background:#f8fafc; border-radius:8px; padding:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">Pendientes</div>
            <div style="font-size:22px; font-weight:700; color:#d97706; margin-top:4px;">${statuses.pending}</div>
          </div>
          <div style="background:#f8fafc; border-radius:8px; padding:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">En Preparación</div>
            <div style="font-size:22px; font-weight:700; color:#2563eb; margin-top:4px;">${statuses.preparing}</div>
          </div>
          <div style="background:#f8fafc; border-radius:8px; padding:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">Enviados</div>
            <div style="font-size:22px; font-weight:700; color:#7c3aed; margin-top:4px;">${statuses.shipped}</div>
          </div>
          <div style="background:#f8fafc; border-radius:8px; padding:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">Entregados</div>
            <div style="font-size:22px; font-weight:700; color:#059669; margin-top:4px;">${statuses.delivered}</div>
          </div>
          <div style="background:#f8fafc; border-radius:8px; padding:12px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">Cancelados</div>
            <div style="font-size:22px; font-weight:700; color:#dc2626; margin-top:4px;">${statuses.cancelled}</div>
          </div>
        </div>
      </div>
    `;

    // Charts Section
    const chartsHtml = `
      <div class="dashboard-charts-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Evolución de Facturación y Ventas</span>
            <span style="font-size:12px; color:var(--text-muted);">Valores en ARS ($)</span>
          </div>
          <div class="card-body">
            ${ChartComponent.renderAreaChart(dailySeries)}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Medios de Pago Utilizados</span>
            <span style="font-size:12px; color:var(--text-muted);">${ordersCount} transacciones</span>
          </div>
          <div class="card-body">
            ${ChartComponent.renderDonutChart(paymentMethods)}
          </div>
        </div>
      </div>
    `;

    // Lower Two Columns: Recent Orders and Top Selling Products
    const recentOrdersTable = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Últimos Pedidos Registrados</span>
          <button class="btn btn-sm btn-secondary" id="dash-see-all-orders">Ver Todos</button>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${recentOrders.map(order => `
                <tr style="cursor:pointer;" class="dash-order-row" data-id="${order.id}">
                  <td><strong style="color:var(--primary);">${order.id}</strong></td>
                  <td>${order.customer?.name || 'Cliente'}</td>
                  <td><strong>$${Number(order.total).toLocaleString('es-AR')}</strong></td>
                  <td><span class="badge badge-blue">${order.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const topProductsTable = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Productos Más Vendidos</span>
          <button class="btn btn-sm btn-secondary" id="dash-see-all-products">Ver Catálogo</button>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Unidades</th>
                <th>Facturación</th>
              </tr>
            </thead>
            <tbody>
              ${topSellingProducts.map(p => `
                <tr>
                  <td>
                    <div class="table-product-cell">
                      <img src="${p.image}" class="table-product-thumb" alt="${p.name}" />
                      <div class="table-product-info">
                        <span class="table-product-name" style="font-size:13px;">${p.name}</span>
                      </div>
                    </div>
                  </td>
                  <td><strong style="color:var(--text-main);">${p.unitsSold} u.</strong></td>
                  <td><strong style="color:var(--success-text);">$${Number(p.revenue).toLocaleString('es-AR')}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Dashboard Ejecutivo</h1>
          <p>Métricas clave, volumen de operaciones y rendimiento comercial en tiempo real</p>
        </div>
        <div class="page-actions">
          ${periodButtons}
        </div>
      </div>

      ${alertBanner}
      ${kpiCardsHtml}
      ${orderStatusStrip}
      ${chartsHtml}

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
        ${recentOrdersTable}
        ${topProductsTable}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Period buttons
    this.container.querySelectorAll('[data-period]').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.currentPeriod = btn.dataset.period;
        await this.init();
      });
    });

    // Quick links
    const invBtn = this.container.querySelector('#dash-goto-inventory-btn');
    if (invBtn) invBtn.addEventListener('click', () => this.onNavigate('inventory'));

    const allOrdersBtn = this.container.querySelector('#dash-see-all-orders');
    if (allOrdersBtn) allOrdersBtn.addEventListener('click', () => this.onNavigate('orders'));

    const allProductsBtn = this.container.querySelector('#dash-see-all-products');
    if (allProductsBtn) allProductsBtn.addEventListener('click', () => this.onNavigate('products'));

    this.container.querySelectorAll('.dash-order-row').forEach(row => {
      row.addEventListener('click', () => {
        this.onNavigate('orders', row.dataset.id);
      });
    });
  }
}
