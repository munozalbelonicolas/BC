/**
 * @file DataTable.js
 * Production-ready reusable admin data table with search, filters, sorting, bulk actions, and pagination.
 */

export class DataTable {
  constructor(options = {}) {
    this.container = options.container;
    this.columns = options.columns || [];
    this.items = options.items || [];
    this.totalItems = options.totalItems || 0;
    this.currentPage = options.currentPage || 1;
    this.pageSize = options.pageSize || 10;
    this.selectable = options.selectable ?? true;
    this.bulkActions = options.bulkActions || [];
    this.filters = options.filters || [];
    this.selectedIds = new Set();
    this.currentSort = options.currentSort || { key: 'updatedAt', direction: 'desc' };
    this.isLoading = options.isLoading || false;
    this.emptyMessage = options.emptyMessage || 'No se encontraron registros.';

    this.onPageChange = options.onPageChange || (() => {});
    this.onSearch = options.onSearch || (() => {});
    this.onFilterChange = options.onFilterChange || (() => {});
    this.onSort = options.onSort || (() => {});
    this.onRowClick = options.onRowClick || null;

    this.debounceTimer = null;
    this.searchValue = options.searchValue || '';
    this.activeFilters = options.activeFilters || {};
  }

  setData({ items, totalItems, currentPage, pageSize, isLoading = false }) {
    this.items = items;
    if (totalItems !== undefined) this.totalItems = totalItems;
    if (currentPage !== undefined) this.currentPage = currentPage;
    if (pageSize !== undefined) this.pageSize = pageSize;
    this.isLoading = isLoading;
    this.selectedIds.clear();
    this.render();
  }

  render() {
    if (!this.container) return;

    const totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    const isAllSelected = this.items.length > 0 && this.items.every(item => this.selectedIds.has(item.id));

    // 1. Toolbar Filters HTML
    const filtersHtml = this.filters.map(filter => `
      <select class="select-filter" data-filter-key="${filter.key}">
        <option value="all">${filter.label}: Todos</option>
        ${filter.options.map(opt => `
          <option value="${opt.value}" ${this.activeFilters[filter.key] === opt.value ? 'selected' : ''}>
            ${opt.label}
          </option>
        `).join('')}
      </select>
    `).join('');

    // 2. Bulk Action Bar HTML
    const bulkBarHtml = (this.selectable && this.selectedIds.size > 0) ? `
      <div class="bulk-action-bar">
        <span class="selected-count">${this.selectedIds.size} elemento(s) seleccionado(s)</span>
        <div class="bulk-actions-group">
          ${this.bulkActions.map((action, idx) => `
            <button class="bulk-btn ${action.className || ''}" data-bulk-idx="${idx}">
              ${action.icon ? action.icon + ' ' : ''}${action.label}
            </button>
          `).join('')}
          <button class="bulk-btn" data-action="clear-selection" style="opacity:0.8;">Deseleccionar</button>
        </div>
      </div>
    ` : '';

    // 3. Table Headers HTML
    const theadHtml = `
      <thead>
        <tr>
          ${this.selectable ? `
            <th style="width: 44px; text-align: center;">
              <input type="checkbox" id="dt-select-all" ${isAllSelected ? 'checked' : ''} />
            </th>
          ` : ''}
          ${this.columns.map(col => {
            const isSorted = this.currentSort.key === col.key;
            const sortIcon = isSorted ? (this.currentSort.direction === 'asc' ? '↑' : '↓') : '';
            return `
              <th class="${col.sortable ? 'sortable' : ''}" data-col-key="${col.key}" style="${col.width ? `width:${col.width};` : ''}">
                ${col.label} ${col.sortable ? `<span style="font-size:11px; margin-left:3px;">${sortIcon}</span>` : ''}
              </th>
            `;
          }).join('')}
        </tr>
      </thead>
    `;

    // 4. Table Body HTML
    let tbodyHtml = '';
    if (this.isLoading) {
      tbodyHtml = `
        <tbody>
          ${[1, 2, 3, 4, 5].map(() => `
            <tr>
              ${this.selectable ? `<td style="text-align:center;"><div style="width:16px; height:16px; background:#e2e8f0; border-radius:3px;"></div></td>` : ''}
              ${this.columns.map(() => `
                <td><div style="height: 18px; background: #f1f5f9; border-radius: 4px; width: 80%;"></div></td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      `;
    } else if (this.items.length === 0) {
      tbodyHtml = `
        <tbody>
          <tr>
            <td colspan="${this.columns.length + (this.selectable ? 1 : 0)}" style="text-align: center; padding: 50px 20px;">
              <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span style="font-weight:600; color:var(--text-main); font-size:15px;">${this.emptyMessage}</span>
                <span style="color:var(--text-muted); font-size:13px;">Intentá ajustar los términos de búsqueda o filtros.</span>
              </div>
            </td>
          </tr>
        </tbody>
      `;
    } else {
      tbodyHtml = `
        <tbody>
          ${this.items.map(item => {
            const isSelected = this.selectedIds.has(item.id);
            return `
              <tr class="${isSelected ? 'row-selected' : ''}" data-row-id="${item.id}" style="${this.onRowClick ? 'cursor:pointer;' : ''}">
                ${this.selectable ? `
                  <td style="text-align: center;" onclick="event.stopPropagation();">
                    <input type="checkbox" class="dt-row-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''} />
                  </td>
                ` : ''}
                ${this.columns.map(col => `
                  <td>${col.render ? col.render(item) : (item[col.key] ?? '')}</td>
                `).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      `;
    }

    // 5. Pagination HTML
    const startRecord = this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endRecord = Math.min(this.currentPage * this.pageSize, this.totalItems);

    const paginationHtml = `
      <div class="table-pagination">
        <span>Mostrando <strong>${startRecord}</strong> - <strong>${endRecord}</strong> de <strong>${this.totalItems}</strong> registros</span>
        <div class="pagination-controls">
          <button class="pagination-btn" id="dt-prev-btn" ${this.currentPage <= 1 ? 'disabled' : ''}>Anterior</button>
          <span style="font-weight:600; font-size:12.5px; padding: 0 6px;">Página ${this.currentPage} de ${totalPages}</span>
          <button class="pagination-btn" id="dt-next-btn" ${this.currentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
        </div>
      </div>
    `;

    // Assembly
    this.container.innerHTML = `
      <div class="table-container">
        <div class="table-toolbar">
          <div class="toolbar-filters">
            <div class="search-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="dt-search-input" placeholder="Buscar por nombre, SKU, código..." value="${this.searchValue}" />
            </div>
            ${filtersHtml}
          </div>
        </div>
        ${bulkBarHtml}
        <div class="data-table-wrapper">
          <table class="data-table">
            ${theadHtml}
            ${tbodyHtml}
          </table>
        </div>
        ${paginationHtml}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Search with debounce
    const searchInput = this.container.querySelector('#dt-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchValue = e.target.value;
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.onSearch(this.searchValue);
        }, 300);
      });
    }

    // Filters
    this.container.querySelectorAll('.select-filter').forEach(select => {
      select.addEventListener('change', (e) => {
        const key = e.target.dataset.filterKey;
        this.activeFilters[key] = e.target.value;
        this.onFilterChange(this.activeFilters);
      });
    });

    // Select All
    const selectAllCheckbox = this.container.querySelector('#dt-select-all');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.items.forEach(item => this.selectedIds.add(item.id));
        } else {
          this.selectedIds.clear();
        }
        this.render();
      });
    }

    // Row Checkbox
    this.container.querySelectorAll('.dt-row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          this.selectedIds.add(id);
        } else {
          this.selectedIds.delete(id);
        }
        this.render();
      });
    });

    // Clear Selection
    const clearBtn = this.container.querySelector('[data-action="clear-selection"]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.selectedIds.clear();
        this.render();
      });
    }

    // Bulk actions
    this.container.querySelectorAll('[data-bulk-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.bulkIdx, 10);
        const action = this.bulkActions[idx];
        if (action && typeof action.onClick === 'function') {
          action.onClick(Array.from(this.selectedIds));
        }
      });
    });

    // Sorting
    this.container.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.colKey;
        const direction = (this.currentSort.key === key && this.currentSort.direction === 'asc') ? 'desc' : 'asc';
        this.currentSort = { key, direction };
        this.onSort(this.currentSort);
      });
    });

    // Pagination
    const prevBtn = this.container.querySelector('#dt-prev-btn');
    const nextBtn = this.container.querySelector('#dt-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.onPageChange(this.currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.onPageChange(this.currentPage + 1));

    // Row Click
    if (this.onRowClick) {
      this.container.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('click', () => {
          const id = row.dataset.rowId;
          const item = this.items.find(i => i.id === id);
          if (item) this.onRowClick(item);
        });
      });
    }
  }
}
