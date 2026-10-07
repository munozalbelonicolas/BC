/**
 * @file CommandPalette.js
 * Global Command Palette (CMD + K) for rapid system-wide search and navigation.
 */

import { productRepo, orderRepo, customerRepo } from '../repositories/factory.js';

export class CommandPalette {
  constructor(onNavigate) {
    this.onNavigate = onNavigate;
    this.isOpen = false;
    this.backdrop = null;
    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'command-palette-backdrop';

    this.backdrop.innerHTML = `
      <div class="command-palette-box">
        <div class="command-palette-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="command-palette-input" id="cp-input" placeholder="Buscar productos, SKUs, pedidos, clientes o acciones..." autofocus />
          <kbd style="font-size:11px; font-family:monospace; color:var(--text-muted); background:#f1f5f9; padding:2px 6px; border-radius:4px;">ESC</kbd>
        </div>
        <div class="command-palette-results" id="cp-results">
          <div class="command-palette-group-title">Navegación Rápida</div>
          <div class="command-palette-item" data-action="route" data-route="dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <div>
              <div class="item-title">Dashboard Principal</div>
              <div class="item-sub">Ver métricas, gráficos y resumen de ventas</div>
            </div>
          </div>
          <div class="command-palette-item" data-action="route" data-route="products">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            <div>
              <div class="item-title">Catálogo de Productos</div>
              <div class="item-sub">Gestionar artículos, precios, variantes y stock</div>
            </div>
          </div>
          <div class="command-palette-item" data-action="route" data-route="orders">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <div>
              <div class="item-title">Gestión de Pedidos</div>
              <div class="item-sub">Revisar ventas, estados de entrega y pagos</div>
            </div>
          </div>
          <div class="command-palette-item" data-action="route" data-route="inventory">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
            <div>
              <div class="item-title">Control de Inventario</div>
              <div class="item-sub">Ajustes de stock, trazabilidad y movimientos</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);

    const input = this.backdrop.querySelector('#cp-input');
    input.focus();

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    input.addEventListener('input', (e) => this.handleSearch(e.target.value));

    this.bindResultClicks();
  }

  close() {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
    }
    this.isOpen = false;
  }

  async handleSearch(query) {
    const q = query.trim().toLowerCase();
    const resultsContainer = this.backdrop.querySelector('#cp-results');
    if (!q) return;

    try {
      const [productsRes, ordersRes, customersRes] = await Promise.all([
        productRepo.getAll({ search: q, pageSize: 4 }),
        orderRepo.getAll({ search: q, pageSize: 4 }),
        customerRepo.getAll({ search: q, pageSize: 4 })
      ]);

      let html = '';

      if (productsRes.items.length > 0) {
        html += `<div class="command-palette-group-title">Productos (${productsRes.items.length})</div>`;
        html += productsRes.items.map(p => `
          <div class="command-palette-item" data-action="route" data-route="products" data-param="${p.id}">
            <img src="${p.image}" style="width:28px; height:28px; border-radius:4px; object-fit:cover;" />
            <div>
              <div class="item-title">${p.name}</div>
              <div class="item-sub">SKU: ${p.sku} | $${Number(p.price).toLocaleString('es-AR')} | Stock: ${p.stock}</div>
            </div>
          </div>
        `).join('');
      }

      if (ordersRes.items.length > 0) {
        html += `<div class="command-palette-group-title">Pedidos (${ordersRes.items.length})</div>`;
        html += ordersRes.items.map(o => `
          <div class="command-palette-item" data-action="route" data-route="orders" data-param="${o.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <div>
              <div class="item-title">Pedido ${o.id} - ${o.customer?.name}</div>
              <div class="item-sub">Total: $${Number(o.total).toLocaleString('es-AR')} | Estado: ${o.status}</div>
            </div>
          </div>
        `).join('');
      }

      if (customersRes.items.length > 0) {
        html += `<div class="command-palette-group-title">Clientes (${customersRes.items.length})</div>`;
        html += customersRes.items.map(c => `
          <div class="command-palette-item" data-action="route" data-route="customers" data-param="${c.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <div>
              <div class="item-title">${c.name}</div>
              <div class="item-sub">${c.email} | ${c.phone}</div>
            </div>
          </div>
        `).join('');
      }

      if (!html) {
        html = `<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13.5px;">No se encontraron resultados para "${query}".</div>`;
      }

      resultsContainer.innerHTML = html;
      this.bindResultClicks();
    } catch (err) {
      console.error('Command palette search error:', err);
    }
  }

  bindResultClicks() {
    this.backdrop.querySelectorAll('.command-palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        const param = item.dataset.param;
        this.close();
        if (this.onNavigate) this.onNavigate(route, param);
      });
    });
  }
}
