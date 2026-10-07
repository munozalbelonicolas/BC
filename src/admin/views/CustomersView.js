/**
 * @file CustomersView.js
 * Customers directory with search, LTV statistics, and profile slide-over.
 */

import { customerRepo } from '../repositories/factory.js';
import { DataTable } from '../components/DataTable.js';
import { CustomerDetailModal } from './CustomerDetailModal.js';
import { ExportImportService } from '../services/exportImportService.js';
import { toast } from '../components/Toast.js';

export class CustomersView {
  constructor(options = {}) {
    this.container = options.container;
    this.dataTable = null;
    this.queryOptions = {
      page: 1,
      pageSize: 10,
      search: ''
    };
  }

  async init() {
    this.renderLayout();
    this.setupDataTable();
    await this.fetchCustomers();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Directorio de Clientes</h1>
          <p>Métricas de recurrencia, valor de vida (LTV) e historial de interacciones</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="cust-export-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar Clientes (CSV)
          </button>
        </div>
      </div>

      <div id="customers-table-mount"></div>
    `;

    this.container.querySelector('#cust-export-btn').addEventListener('click', async () => {
      try {
        const { items } = await customerRepo.getAll({ pageSize: 1000 });
        const data = items.map(c => ({
          Nombre: c.name,
          Email: c.email,
          Telefono: c.phone,
          Pedidos: c.ordersCount,
          TotalGastado: c.totalSpent,
          UltimaCompra: c.lastOrderDate
        }));
        ExportImportService.exportToCSV(data, `bc_clientes_${new Date().toISOString().split('T')[0]}.csv`);
        toast.show('Listado de clientes exportado con éxito.', 'success');
      } catch (err) {
        toast.show('Error al exportar clientes: ' + err.message, 'danger');
      }
    });
  }

  setupDataTable() {
    const mountEl = this.container.querySelector('#customers-table-mount');

    this.dataTable = new DataTable({
      container: mountEl,
      selectable: false,
      columns: [
        {
          key: 'name',
          label: 'Cliente',
          render: (c) => `
            <div>
              <strong style="color:var(--text-main); font-size:14px;">${c.name}</strong>
              <div style="font-size:12px; color:var(--text-muted);">${c.email}</div>
            </div>
          `
        },
        {
          key: 'phone',
          label: 'Teléfono',
          render: (c) => `<span style="font-size:13px; color:var(--text-muted);">${c.phone || '-'}</span>`
        },
        {
          key: 'ordersCount',
          label: 'Pedidos',
          sortable: true,
          render: (c) => `<strong>${c.ordersCount}</strong>`
        },
        {
          key: 'totalSpent',
          label: 'Total Comprado (LTV)',
          sortable: true,
          render: (c) => `<strong style="color:#065f46; font-size:14px;">$${Number(c.totalSpent).toLocaleString('es-AR')}</strong>`
        },
        {
          key: 'averageTicket',
          label: 'Ticket Promedio',
          render: (c) => `<span style="font-size:13px;">$${Number(c.averageTicket).toLocaleString('es-AR')}</span>`
        },
        {
          key: 'lastOrderDate',
          label: 'Última Compra',
          render: (c) => `
            <span style="font-size:12.5px; color:var(--text-muted);">
              ${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('es-AR') : 'Sin compras'}
            </span>
          `
        },
        {
          key: 'actions',
          label: 'Acciones',
          render: (c) => `
            <button class="btn btn-secondary btn-sm" data-action="view-profile" data-id="${c.id}">
              Ver Perfil 360°
            </button>
          `
        }
      ],
      onSearch: (q) => {
        this.queryOptions.search = q;
        this.queryOptions.page = 1;
        this.fetchCustomers();
      },
      onPageChange: (p) => {
        this.queryOptions.page = p;
        this.fetchCustomers();
      },
      onRowClick: (c) => this.openCustomerProfile(c)
    });

    this.bindRowActions();
  }

  async fetchCustomers() {
    this.dataTable.setData({ items: [], isLoading: true });
    try {
      const res = await customerRepo.getAll(this.queryOptions);
      this.dataTable.setData({
        items: res.items,
        totalItems: res.total,
        currentPage: res.page,
        pageSize: res.pageSize,
        isLoading: false
      });
      this.bindRowActions();
    } catch (err) {
      toast.show('Error al cargar clientes: ' + err.message, 'danger');
      this.dataTable.setData({ items: [], isLoading: false });
    }
  }

  bindRowActions() {
    const mountEl = this.container.querySelector('#customers-table-mount');
    mountEl.querySelectorAll('[data-action="view-profile"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const customer = await customerRepo.getById(btn.dataset.id);
        this.openCustomerProfile(customer);
      });
    });
  }

  openCustomerProfile(customer) {
    const modal = new CustomerDetailModal({
      customer,
      onUpdate: () => this.fetchCustomers()
    });
    modal.open();
  }
}
