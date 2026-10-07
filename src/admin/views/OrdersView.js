/**
 * @file OrdersView.js
 * Orders management table with live status filtering, bulk actions, and order slide-over inspector.
 */

import { OrderService } from '../services/orderService.js';
import { DataTable } from '../components/DataTable.js';
import { OrderDetailModal } from './OrderDetailModal.js';
import { ExportImportService } from '../services/exportImportService.js';
import { OrderStatus, PaymentStatus } from '../types/entities.js';
import { toast } from '../components/Toast.js';

export class OrdersView {
  constructor(options = {}) {
    this.container = options.container;
    this.initialOrderId = options.initialOrderId || null;
    this.dataTable = null;
    this.queryOptions = {
      page: 1,
      pageSize: 10,
      search: '',
      status: 'all',
      paymentStatus: 'all'
    };
  }

  async init() {
    this.renderLayout();
    this.setupDataTable();
    await this.fetchOrders();

    if (this.initialOrderId) {
      this.openOrderById(this.initialOrderId);
    }
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Gestión de Pedidos</h1>
          <p>Administración de ventas, estados de entrega y seguimiento logístico</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="ord-export-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar Pedidos (CSV)
          </button>
        </div>
      </div>

      <div id="orders-table-mount"></div>
    `;

    this.container.querySelector('#ord-export-btn').addEventListener('click', async () => {
      try {
        const { items } = await OrderService.getOrders({ pageSize: 1000 });
        const exportData = items.map(o => ({
          NumeroPedido: o.id,
          Cliente: o.customer?.name,
          Email: o.customer?.email,
          Telefono: o.customer?.phone,
          Total: o.total,
          EstadoPedido: o.status,
          EstadoPago: o.paymentStatus,
          MetodoPago: o.paymentMethod,
          Transportista: o.carrier,
          Tracking: o.trackingCode,
          Fecha: o.createdAt
        }));
        ExportImportService.exportToCSV(exportData, `bc_pedidos_${new Date().toISOString().split('T')[0]}.csv`);
        toast.show('Reporte de pedidos exportado.', 'success');
      } catch (err) {
        toast.show('Error al exportar: ' + err.message, 'danger');
      }
    });
  }

  setupDataTable() {
    const mountEl = this.container.querySelector('#orders-table-mount');

    this.dataTable = new DataTable({
      container: mountEl,
      columns: [
        {
          key: 'id',
          label: 'N° Pedido',
          render: (o) => `<strong style="color:var(--primary); font-family:var(--font-mono); font-size:13px;">${o.id}</strong>`
        },
        {
          key: 'customer',
          label: 'Cliente',
          render: (o) => `
            <div>
              <div style="font-weight:600; color:var(--text-main); font-size:13.5px;">${o.customer?.name || 'Cliente'}</div>
              <div style="font-size:12px; color:var(--text-muted);">${o.customer?.email || ''}</div>
            </div>
          `
        },
        {
          key: 'createdAt',
          label: 'Fecha',
          render: (o) => `
            <span style="font-size:12.5px; color:var(--text-muted);">
              ${new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          `
        },
        {
          key: 'items',
          label: 'Artículos',
          render: (o) => `
            <span style="font-size:13px; font-weight:500;">
              ${(o.items || []).length} prod. (${(o.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0)} u.)
            </span>
          `
        },
        {
          key: 'total',
          label: 'Total',
          render: (o) => `<strong style="color:var(--text-main); font-size:14px;">$${Number(o.total).toLocaleString('es-AR')}</strong>`
        },
        {
          key: 'paymentStatus',
          label: 'Pago',
          render: (o) => {
            const map = {
              [PaymentStatus.PAID]: { cls: 'badge-emerald', label: 'Pagado' },
              [PaymentStatus.PENDING]: { cls: 'badge-amber', label: 'Pendiente' },
              [PaymentStatus.REJECTED]: { cls: 'badge-danger', label: 'Rechazado' },
              [PaymentStatus.REFUNDED]: { cls: 'badge-purple', label: 'Reembolsado' }
            };
            const s = map[o.paymentStatus] || { cls: 'badge-slate', label: o.paymentStatus || 'Pendiente' };
            return `<span class="badge ${s.cls}">${s.label}</span>`;
          }
        },
        {
          key: 'status',
          label: 'Estado del Pedido',
          render: (o) => {
            const map = {
              [OrderStatus.PENDING]: { cls: 'badge-amber', label: 'Pendiente' },
              [OrderStatus.CONFIRMED]: { cls: 'badge-blue', label: 'Confirmado' },
              [OrderStatus.PREPARING]: { cls: 'badge-purple', label: 'En Preparación' },
              [OrderStatus.READY]: { cls: 'badge-emerald', label: 'Listo' },
              [OrderStatus.SHIPPED]: { cls: 'badge-blue', label: 'Enviado' },
              [OrderStatus.DELIVERED]: { cls: 'badge-emerald', label: 'Entregado' },
              [OrderStatus.CANCELLED]: { cls: 'badge-danger', label: 'Cancelado' }
            };
            const s = map[o.status] || { cls: 'badge-slate', label: o.status };
            return `<span class="badge ${s.cls}">${s.label}</span>`;
          }
        },
        {
          key: 'carrier',
          label: 'Entrega',
          render: (o) => `<span style="font-size:12.5px; color:var(--text-muted);">${o.carrier || 'Envío estándar'}</span>`
        },
        {
          key: 'actions',
          label: 'Acciones',
          render: (o) => `
            <button class="btn btn-secondary btn-sm" data-action="view-order" data-id="${o.id}">
              Ver Detalle
            </button>
          `
        }
      ],
      filters: [
        {
          key: 'status',
          label: 'Estado Pedido',
          options: [
            { label: 'Pendiente', value: OrderStatus.PENDING },
            { label: 'Confirmado', value: OrderStatus.CONFIRMED },
            { label: 'En Preparación', value: OrderStatus.PREPARING },
            { label: 'Enviado', value: OrderStatus.SHIPPED },
            { label: 'Entregado', value: OrderStatus.DELIVERED },
            { label: 'Cancelado', value: OrderStatus.CANCELLED }
          ]
        },
        {
          key: 'paymentStatus',
          label: 'Estado Pago',
          options: [
            { label: 'Pagado', value: PaymentStatus.PAID },
            { label: 'Pendiente', value: PaymentStatus.PENDING },
            { label: 'Reembolsado', value: PaymentStatus.REFUNDED }
          ]
        }
      ],
      bulkActions: [
        {
          label: 'Avanzar a En Preparación',
          onClick: async (ids) => {
            for (const id of ids) {
              await OrderService.updateOrderStatus(id, OrderStatus.PREPARING, 'Actualización masiva de depósito');
            }
            toast.show(`${ids.length} pedidos pasados a En Preparación.`, 'success');
            this.fetchOrders();
          }
        },
        {
          label: 'Marcar como Enviados',
          onClick: async (ids) => {
            for (const id of ids) {
              await OrderService.updateOrderStatus(id, OrderStatus.SHIPPED, 'Actualización masiva de despacho');
            }
            toast.show(`${ids.length} pedidos despachados.`, 'success');
            this.fetchOrders();
          }
        }
      ],
      onSearch: (q) => {
        this.queryOptions.search = q;
        this.queryOptions.page = 1;
        this.fetchOrders();
      },
      onFilterChange: (filters) => {
        this.queryOptions.status = filters.status || 'all';
        this.queryOptions.paymentStatus = filters.paymentStatus || 'all';
        this.queryOptions.page = 1;
        this.fetchOrders();
      },
      onPageChange: (p) => {
        this.queryOptions.page = p;
        this.fetchOrders();
      },
      onRowClick: (order) => {
        this.openOrderDetail(order);
      }
    });

    this.bindRowActions();
  }

  async fetchOrders() {
    this.dataTable.setData({ items: [], isLoading: true });
    try {
      const res = await OrderService.getOrders(this.queryOptions);
      this.dataTable.setData({
        items: res.items,
        totalItems: res.total,
        currentPage: res.page,
        pageSize: res.pageSize,
        isLoading: false
      });
      this.bindRowActions();
    } catch (err) {
      toast.show('Error al cargar pedidos: ' + err.message, 'danger');
      this.dataTable.setData({ items: [], isLoading: false });
    }
  }

  bindRowActions() {
    const mountEl = this.container.querySelector('#orders-table-mount');
    mountEl.querySelectorAll('[data-action="view-order"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.openOrderById(btn.dataset.id);
      });
    });
  }

  async openOrderById(orderId) {
    try {
      const order = await OrderService.getOrderById(orderId);
      this.openOrderDetail(order);
    } catch (err) {
      toast.show('No se pudo abrir el pedido: ' + err.message, 'danger');
    }
  }

  openOrderDetail(order) {
    const modal = new OrderDetailModal({
      order,
      onUpdate: () => this.fetchOrders()
    });
    modal.open();
  }
}
