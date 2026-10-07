/**
 * @file ProductsView.js
 * Comprehensive Product management interface with DataTable, bulk actions, and modal flows.
 */

import { ProductService } from '../services/productService.js';
import { categoryRepo, brandRepo } from '../repositories/factory.js';
import { DataTable } from '../components/DataTable.js';
import { ProductFormModal } from './ProductFormModal.js';
import { ProductImportModal } from './ProductImportModal.js';
import { ExportImportService } from '../services/exportImportService.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { toast } from '../components/Toast.js';
import { getStockStatus, StockStatus, ProductStatus } from '../types/entities.js';

export class ProductsView {
  constructor(options = {}) {
    this.container = options.container;
    this.dataTable = null;
    this.categories = [];
    this.brands = [];
    this.queryOptions = {
      page: 1,
      pageSize: 10,
      search: '',
      category: 'all',
      brand: 'all',
      status: 'all',
      stockFilter: null,
      sortBy: 'updatedAt',
      sortDirection: 'desc'
    };
  }

  async init() {
    this.renderLayout();
    await this.loadDependencies();
    this.setupDataTable();
    await this.fetchProducts();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Catálogo de Productos</h1>
          <p>Administrá el inventario maestro, variantes, precios y márgenes comerciales</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="prod-export-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar CSV
          </button>
          <button class="btn btn-secondary" id="prod-import-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Importar CSV
          </button>
          <button class="btn btn-primary" id="prod-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      <div id="products-table-mount"></div>
    `;

    this.bindHeaderActions();
  }

  async loadDependencies() {
    try {
      const [cats, brs] = await Promise.all([
        categoryRepo.getAll(),
        brandRepo.getAll()
      ]);
      this.categories = cats;
      this.brands = brs;
    } catch (err) {
      console.warn('Error loading categories/brands for products view:', err);
    }
  }

  setupDataTable() {
    const mountEl = this.container.querySelector('#products-table-mount');

    this.dataTable = new DataTable({
      container: mountEl,
      columns: [
        {
          key: 'product',
          label: 'Producto',
          width: '320px',
          render: (p) => `
            <div class="table-product-cell">
              <img src="${p.image || '/images/store_front.jpg'}" class="table-product-thumb" alt="${p.name}" />
              <div class="table-product-info">
                <span class="table-product-name">${p.name}</span>
                <span class="table-product-sku">SKU: ${p.sku}</span>
              </div>
            </div>
          `
        },
        {
          key: 'category',
          label: 'Categoría',
          render: (p) => {
            const cat = this.categories.find(c => c.id === p.category);
            return `<span style="font-size:13px; color:var(--text-main);">${cat ? cat.name : p.category}</span>`;
          }
        },
        {
          key: 'price',
          label: 'Precio Venta',
          sortable: true,
          render: (p) => `
            <div style="font-weight:700; color:var(--text-main);">
              $${Number(p.price).toLocaleString('es-AR')}
            </div>
            ${p.originalPrice ? `<span style="font-size:11.5px; text-decoration:line-through; color:var(--text-muted);">$${Number(p.originalPrice).toLocaleString('es-AR')}</span>` : ''}
          `
        },
        {
          key: 'margin',
          label: 'Margen / Costo',
          render: (p) => `
            <div style="font-size:12.5px; font-weight:600; color:${p.margin >= 25 ? '#065f46' : '#92400e'};">
              ${p.margin ?? 35}%
            </div>
            <span style="font-size:11px; color:var(--text-muted);">Costo: $${Number(p.cost || 0).toLocaleString('es-AR')}</span>
          `
        },
        {
          key: 'stock',
          label: 'Stock',
          sortable: true,
          render: (p) => {
            const status = getStockStatus(p.stock, p.minStock || 3);
            let badgeClass = 'badge-emerald';
            let label = `${p.stock} u.`;
            if (status === StockStatus.OUT_OF_STOCK) {
              badgeClass = 'badge-danger';
              label = 'Agotado (0)';
            } else if (status === StockStatus.LOW_STOCK) {
              badgeClass = 'badge-amber';
              label = `Bajo (${p.stock} u.)`;
            }
            return `<span class="badge ${badgeClass}">${label}</span>`;
          }
        },
        {
          key: 'status',
          label: 'Estado',
          render: (p) => {
            const map = {
              [ProductStatus.ACTIVE]: { cls: 'badge-emerald', label: 'Activo' },
              [ProductStatus.DRAFT]: { cls: 'badge-slate', label: 'Borrador' },
              [ProductStatus.INACTIVE]: { cls: 'badge-amber', label: 'Inactivo' },
              [ProductStatus.ARCHIVED]: { cls: 'badge-purple', label: 'Archivado' }
            };
            const s = map[p.status] || { cls: 'badge-slate', label: p.status };
            return `<span class="badge ${s.cls}">${s.label}</span>`;
          }
        },
        {
          key: 'actions',
          label: 'Acciones',
          render: (p) => `
            <div style="display:flex; align-items:center; gap:6px;">
              <button class="btn btn-secondary btn-sm btn-icon" title="Editar" data-action="edit" data-id="${p.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" title="Duplicar" data-action="duplicate" data-id="${p.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" title="Eliminar" data-action="delete" data-id="${p.id}" style="color:var(--danger);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          `
        }
      ],
      filters: [
        {
          key: 'category',
          label: 'Categoría',
          options: this.categories.map(c => ({ label: c.name, value: c.id }))
        },
        {
          key: 'status',
          label: 'Estado',
          options: [
            { label: 'Activo', value: ProductStatus.ACTIVE },
            { label: 'Borrador', value: ProductStatus.DRAFT },
            { label: 'Inactivo', value: ProductStatus.INACTIVE },
            { label: 'Archivado', value: ProductStatus.ARCHIVED }
          ]
        }
      ],
      bulkActions: [
        {
          label: 'Activar',
          onClick: async (ids) => {
            await ProductService.bulkActivate(ids);
            toast.show(`${ids.length} productos activados.`, 'success');
            this.fetchProducts();
          }
        },
        {
          label: 'Desactivar',
          onClick: async (ids) => {
            await ProductService.bulkDeactivate(ids);
            toast.show(`${ids.length} productos desactivados.`, 'warning');
            this.fetchProducts();
          }
        },
        {
          label: 'Ajustar Precio (+10%)',
          onClick: async (ids) => {
            await ProductService.bulkUpdatePricePercentage(ids, 10);
            toast.show(`Precios incrementados en 10% para ${ids.length} productos.`, 'success');
            this.fetchProducts();
          }
        },
        {
          label: 'Eliminar Seleccionados',
          className: 'danger',
          onClick: async (ids) => {
            const confirmed = await confirmDialog({
              title: `¿Eliminar ${ids.length} productos?`,
              message: 'Esta acción eliminará permanentemente los artículos seleccionados y sus variantes asociadas.',
              confirmText: 'Eliminar Definitivamente',
              isDanger: true
            });
            if (confirmed) {
              await ProductService.bulkDelete(ids);
              toast.show(`Se eliminaron ${ids.length} productos.`, 'success');
              this.fetchProducts();
            }
          }
        }
      ],
      onSearch: (query) => {
        this.queryOptions.search = query;
        this.queryOptions.page = 1;
        this.fetchProducts();
      },
      onFilterChange: (filters) => {
        this.queryOptions.category = filters.category || 'all';
        this.queryOptions.status = filters.status || 'all';
        this.queryOptions.page = 1;
        this.fetchProducts();
      },
      onSort: (sort) => {
        this.queryOptions.sortBy = sort.key;
        this.queryOptions.sortDirection = sort.direction;
        this.fetchProducts();
      },
      onPageChange: (newPage) => {
        this.queryOptions.page = newPage;
        this.fetchProducts();
      }
    });

    this.bindRowActions();
  }

  async fetchProducts() {
    this.dataTable.setData({ items: [], isLoading: true });
    try {
      const res = await ProductService.getProducts(this.queryOptions);
      this.dataTable.setData({
        items: res.items,
        totalItems: res.total,
        currentPage: res.page,
        pageSize: res.pageSize,
        isLoading: false
      });
      this.bindRowActions();
    } catch (err) {
      toast.show(`Error al cargar catálogo: ${err.message}`, 'danger');
      this.dataTable.setData({ items: [], isLoading: false });
    }
  }

  bindHeaderActions() {
    // New Product
    this.container.querySelector('#prod-new-btn').addEventListener('click', () => {
      const modal = new ProductFormModal({
        categories: this.categories,
        brands: this.brands,
        onSave: () => this.fetchProducts()
      });
      modal.open();
    });

    // Import CSV
    this.container.querySelector('#prod-import-btn').addEventListener('click', () => {
      const modal = new ProductImportModal({
        onSuccess: () => this.fetchProducts()
      });
      modal.open();
    });

    // Export CSV
    this.container.querySelector('#prod-export-btn').addEventListener('click', async () => {
      try {
        const { items } = await ProductService.getProducts({ pageSize: 1000 });
        const exportData = items.map(p => ({
          SKU: p.sku,
          Nombre: p.name,
          Marca: p.brand,
          Categoria: p.category,
          Precio: p.price,
          Costo: p.cost,
          Margen: `${p.margin}%`,
          Stock: p.stock,
          Estado: p.status
        }));
        ExportImportService.exportToCSV(exportData, `bc_productos_${new Date().toISOString().split('T')[0]}.csv`);
        toast.show('Exportación generada exitosamente.', 'success');
      } catch (err) {
        toast.show(`Error al exportar: ${err.message}`, 'danger');
      }
    });
  }

  bindRowActions() {
    const mountEl = this.container.querySelector('#products-table-mount');

    mountEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const product = await ProductService.getProductById(id);
        const modal = new ProductFormModal({
          product,
          categories: this.categories,
          brands: this.brands,
          onSave: () => this.fetchProducts()
        });
        modal.open();
      });
    });

    mountEl.querySelectorAll('[data-action="duplicate"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await ProductService.duplicateProduct(id);
        toast.show('Producto duplicado como borrador.', 'success');
        this.fetchProducts();
      });
    });

    mountEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const confirmed = await confirmDialog({
          title: '¿Eliminar producto?',
          message: 'Esta acción eliminará el producto permanentemente del catálogo y de la base de datos.',
          confirmText: 'Eliminar Permanentemente',
          isDanger: true
        });
        if (confirmed) {
          await ProductService.deleteProduct(id);
          toast.show('Producto eliminado.', 'success');
          this.fetchProducts();
        }
      });
    });
  }
}
