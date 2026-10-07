/**
 * @file InventoryView.js
 * Comprehensive stock control dashboard with real-time stock levels, adjustment modal, and movement audit history.
 */

import { InventoryService } from '../services/inventoryService.js';
import { StockAdjustModal } from './StockAdjustModal.js';
import { StockStatus } from '../types/entities.js';
import { toast } from '../components/Toast.js';

export class InventoryView {
  constructor(options = {}) {
    this.container = options.container;
    this.activeTab = 'stock'; // 'stock' | 'movements'
    this.overviewItems = [];
    this.movements = [];
    this.searchQuery = '';
    this.statusFilter = 'all';
  }

  async init() {
    this.renderLayout();
    await this.loadData();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Control de Inventario y Stock</h1>
          <p>Supervisión de existencias en depósito, alertas de abastecimiento y trazabilidad de movimientos</p>
        </div>
        <div class="page-actions">
          <div style="display:flex; background:#f1f5f9; padding:4px; border-radius:8px; gap:4px;">
            <button class="btn btn-sm ${this.activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}" id="inv-tab-stock">
              Niveles de Stock
            </button>
            <button class="btn btn-sm ${this.activeTab === 'movements' ? 'btn-primary' : 'btn-secondary'}" id="inv-tab-movements">
              Historial de Movimientos
            </button>
          </div>
        </div>
      </div>

      <div class="card" id="inv-content-card">
        <div class="card-body" style="padding:0;" id="inv-body-mount">
          <div style="padding:40px; text-align:center; color:var(--text-muted);">Cargando inventario...</div>
        </div>
      </div>
    `;

    this.bindTabEvents();
  }

  bindTabEvents() {
    this.container.querySelector('#inv-tab-stock').addEventListener('click', () => {
      this.activeTab = 'stock';
      this.renderLayout();
      this.loadData();
    });

    this.container.querySelector('#inv-tab-movements').addEventListener('click', () => {
      this.activeTab = 'movements';
      this.renderLayout();
      this.loadData();
    });
  }

  async loadData() {
    const mount = this.container.querySelector('#inv-body-mount');
    try {
      if (this.activeTab === 'stock') {
        this.overviewItems = await InventoryService.getOverview({
          status: this.statusFilter,
          search: this.searchQuery
        });
        this.renderStockTable();
      } else {
        this.movements = await InventoryService.getMovements();
        this.renderMovementsTable();
      }
    } catch (err) {
      toast.show('Error al cargar datos de inventario: ' + err.message, 'danger');
    }
  }

  renderStockTable() {
    const mount = this.container.querySelector('#inv-body-mount');

    const toolbar = `
      <div class="table-toolbar" style="border-top:none;">
        <div class="toolbar-filters">
          <div class="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="inv-search-input" placeholder="Buscar por producto o SKU..." value="${this.searchQuery}" />
          </div>
          <select class="select-filter" id="inv-status-filter">
            <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>Todos los estados</option>
            <option value="${StockStatus.AVAILABLE}" ${this.statusFilter === StockStatus.AVAILABLE ? 'selected' : ''}>Disponible</option>
            <option value="${StockStatus.LOW_STOCK}" ${this.statusFilter === StockStatus.LOW_STOCK ? 'selected' : ''}>Stock Bajo</option>
            <option value="${StockStatus.OUT_OF_STOCK}" ${this.statusFilter === StockStatus.OUT_OF_STOCK ? 'selected' : ''}>Sin Stock</option>
          </select>
        </div>
      </div>
    `;

    const rows = this.overviewItems.map(item => {
      let badgeCls = 'badge-emerald';
      let statusText = 'Disponible';
      if (item.status === StockStatus.OUT_OF_STOCK) {
        badgeCls = 'badge-danger';
        statusText = 'Sin Stock';
      } else if (item.status === StockStatus.LOW_STOCK) {
        badgeCls = 'badge-amber';
        statusText = 'Stock Bajo';
      }

      return `
        <tr>
          <td>
            <div class="table-product-cell">
              <img src="${item.image || '/images/store_front.jpg'}" class="table-product-thumb" alt="${item.productName}" />
              <div class="table-product-info">
                <span class="table-product-name">${item.productName}</span>
                <span class="table-product-sku">SKU: ${item.sku}</span>
              </div>
            </div>
          </td>
          <td><span style="font-size:13px; font-weight:500;">${item.variant}</span></td>
          <td><strong style="font-size:15px; color:var(--text-main);">${item.availableStock} u.</strong></td>
          <td><span style="color:var(--text-muted);">${item.reservedStock} u.</span></td>
          <td><span style="color:var(--text-muted);">${item.minStock} u.</span></td>
          <td><span class="badge ${badgeCls}">${statusText}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm" data-action="adjust-stock" data-pid="${item.productId}">
              Ajustar Stock
            </button>
          </td>
        </tr>
      `;
    }).join('');

    mount.innerHTML = `
      ${toolbar}
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Producto / SKU</th>
              <th>Variante</th>
              <th>Stock Disponible</th>
              <th>Reservado</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th style="text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="7" style="text-align:center; padding:30px;">No se encontraron artículos.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    // Search input
    let timer = null;
    mount.querySelector('#inv-search-input').addEventListener('input', (e) => {
      clearTimeout(timer);
      this.searchQuery = e.target.value;
      timer = setTimeout(() => this.loadData(), 300);
    });

    mount.querySelector('#inv-status-filter').addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.loadData();
    });

    // Adjust button clicks
    mount.querySelectorAll('[data-action="adjust-stock"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = this.overviewItems.find(i => i.productId === btn.dataset.pid);
        if (item) {
          const modal = new StockAdjustModal({
            item,
            onSuccess: () => this.loadData()
          });
          modal.open();
        }
      });
    });
  }

  renderMovementsTable() {
    const mount = this.container.querySelector('#inv-body-mount');

    const rows = this.movements.map(m => {
      const typeMap = {
        ingreso: { label: 'Ingreso', cls: 'badge-emerald' },
        egreso: { label: 'Egreso', cls: 'badge-danger' },
        ajuste: { label: 'Corrección', cls: 'badge-amber' },
        venta: { label: 'Venta', cls: 'badge-blue' }
      };
      const t = typeMap[m.type] || { label: m.type, cls: 'badge-slate' };
      const dateFormatted = new Date(m.createdAt).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
      });

      return `
        <tr>
          <td><span style="font-size:12.5px; color:var(--text-muted);">${dateFormatted}</span></td>
          <td>
            <strong>${m.productName}</strong>
            <div style="font-size:11.5px; color:var(--text-muted); font-family:monospace;">SKU: ${m.variantSku || 'STD'}</div>
          </td>
          <td><span class="badge ${t.cls}">${t.label}</span></td>
          <td>
            <strong style="color:${m.quantity > 0 ? '#059669' : (m.quantity < 0 ? '#dc2626' : '#2563eb')};">
              ${m.quantity > 0 ? '+' : ''}${m.quantity} u.
            </strong>
          </td>
          <td><span style="color:var(--text-muted);">${m.stockBefore} → <strong>${m.stockAfter}</strong></span></td>
          <td style="max-width:240px; font-size:12.5px; color:var(--text-main);">${m.reason}</td>
          <td><span style="font-size:12px; color:var(--text-muted);">${m.userEmail}</span></td>
        </tr>
      `;
    }).join('');

    mount.innerHTML = `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Variación</th>
              <th>Motivo Registrado</th>
              <th>Operador</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="7" style="text-align:center; padding:30px;">No hay movimientos registrados aún.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }
}
