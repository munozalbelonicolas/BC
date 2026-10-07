/**
 * @file AccountFavoritesView.js
 * Customer Wishlist grid with stock check and one-click add to cart.
 */

import { customerFavoritesRepo } from '../repositories/factory.js';
import { customerAuthService } from '../services/customerAuthService.js';
import { store } from '../../state.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountFavoritesView {
  constructor(options = {}) {
    this.container = options.container;
    this.favorites = [];
  }

  async init() {
    const user = customerAuthService.getCurrentCustomer();
    if (user) {
      this.favorites = await customerFavoritesRepo.getFavorites(user.id);
    }
    this.render();
  }

  render() {
    let cardsHtml = '';
    if (this.favorites.length === 0) {
      cardsHtml = `
        <div class="portal-empty-state" style="grid-column: 1 / -1;">
          <div class="portal-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <h3 class="portal-empty-title">Aún no guardaste productos en favoritos</h3>
          <p class="portal-empty-text">Guardá los productos que te gusten mientras navegás por la tienda haciendo clic en el corazón.</p>
          <a href="/" class="btn-portal btn-portal-primary">Explorar Catálogo</a>
        </div>
      `;
    } else {
      cardsHtml = this.favorites.map(p => {
        const hasStock = p.stock > 0;
        return `
          <div class="favorite-card">
            <div class="favorite-img-wrap">
              <img src="${p.image}" alt="${p.name}" />
              <button class="btn-remove-favorite" data-action="remove-fav" data-id="${p.id}" title="Eliminar de favoritos">
                ✕
              </button>
            </div>

            <div class="favorite-card-body">
              <div>
                <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--acc-muted);">${p.brand}</span>
                <div style="font-weight:700; font-size:14px; color:var(--acc-text); margin:2px 0 6px;">${p.name}</div>
                <div style="font-size:16px; font-weight:800; color:var(--acc-text);">$${Number(p.price).toLocaleString('es-AR')}</div>
              </div>

              <div style="margin-top:14px;">
                ${hasStock ? `
                  <button class="btn-portal btn-portal-primary btn-portal-sm" style="width:100%;" data-action="add-cart" data-id="${p.id}">
                    Agregar al Carrito
                  </button>
                ` : `
                  <div style="font-size:12px; color:var(--acc-danger-text); background:var(--acc-danger-light); padding:6px; border-radius:6px; text-align:center; font-weight:600;">
                    Sin stock disponible
                  </div>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    this.container.innerHTML = `
      <div class="portal-page-header">
        <h1>Mis Favoritos (${this.favorites.length})</h1>
        <p>Productos que guardaste para comprar más tarde</p>
      </div>

      <div class="favorites-grid">
        ${cardsHtml}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('[data-action="remove-fav"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const user = customerAuthService.getCurrentCustomer();
        if (user) {
          await customerFavoritesRepo.removeFavorite(user.id, btn.dataset.id);
          store.toggleWishlist(btn.dataset.id);
          accountToast.show('Producto eliminado de favoritos.', 'success');
          this.init();
        }
      });
    });

    this.container.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = this.favorites.find(p => p.id === btn.dataset.id);
        if (prod) {
          store.addToCart(prod.id, 1);
          accountToast.show(`¡${prod.name} agregado al carrito!`, 'success');
        }
      });
    });
  }
}
