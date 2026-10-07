/**
 * @file AccountAddressesView.js
 * Address book directory for managing shipping destinations.
 */

import { CustomerAddressService } from '../services/customerAddressService.js';
import { AddressModal } from '../components/AddressModal.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountAddressesView {
  constructor(options = {}) {
    this.container = options.container;
    this.addresses = [];
  }

  async init() {
    this.addresses = await CustomerAddressService.getAddresses();
    this.render();
  }

  render() {
    const addressCardsHtml = this.addresses.length > 0 ? this.addresses.map(a => `
      <div class="address-card ${a.isDefault ? 'default-address' : ''}">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="font-size:15px; color:var(--acc-text);">${a.alias}</strong>
              ${a.isDefault ? `<span class="status-pill success" style="font-size:11px; padding:2px 8px;">Predeterminada</span>` : ''}
            </div>
            <button class="btn-portal btn-portal-secondary btn-portal-sm" data-action="edit" data-id="${a.id}" style="padding:4px 8px;">
              Editar
            </button>
          </div>

          <div style="font-size:13.5px; line-height:1.6; color:var(--acc-text);">
            <div><strong>${a.recipientName}</strong> • ${a.phone}</div>
            <div>${a.street} ${a.number} ${a.floor ? `Piso ${a.floor}` : ''} ${a.apartment ? `Depto ${a.apartment}` : ''}</div>
            <div style="color:var(--acc-muted);">${a.city}, ${a.province} (CP ${a.zipCode})</div>
            ${a.reference ? `<div style="font-size:12px; color:var(--acc-muted); font-style:italic; margin-top:4px;">"${a.reference}"</div>` : ''}
          </div>
        </div>

        <div style="margin-top:16px; padding-top:12px; border-top:1px solid var(--acc-border); display:flex; justify-content:space-between; align-items:center;">
          ${!a.isDefault ? `
            <button class="btn-portal btn-portal-secondary btn-portal-sm" data-action="set-default" data-id="${a.id}">
              Hacer Predeterminada
            </button>
          ` : `<span></span>`}

          <button class="btn-portal btn-portal-sm" data-action="delete" data-id="${a.id}" style="color:var(--acc-danger); border:none; background:none; cursor:pointer;">
            Eliminar
          </button>
        </div>
      </div>
    `).join('') : `
      <div class="portal-empty-state" style="grid-column: 1 / -1;">
        <h3 class="portal-empty-title">Aún no agregaste direcciones guardadas</h3>
        <p class="portal-empty-text">Guardá la dirección de tu casa u oficina para no tener que cargarla de nuevo en el checkout.</p>
        <button class="btn-portal btn-portal-primary" id="empty-add-address-btn">Agregar Dirección</button>
      </div>
    `;

    this.container.innerHTML = `
      <div class="portal-page-header">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1>Mis Direcciones de Entrega</h1>
            <p>Gestioná los domicilios a donde enviamos tus compras de BC Especial Import</p>
          </div>
          <button class="btn-portal btn-portal-primary" id="addr-new-btn">
            + Nueva Dirección
          </button>
        </div>
      </div>

      <div class="addresses-grid">
        ${addressCardsHtml}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const newBtn = this.container.querySelector('#addr-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.openAddressModal());
    }

    const emptyBtn = this.container.querySelector('#empty-add-address-btn');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => this.openAddressModal());
    }

    this.container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const addr = this.addresses.find(a => a.id === btn.dataset.id);
        if (addr) this.openAddressModal(addr);
      });
    });

    this.container.querySelectorAll('[data-action="set-default"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await CustomerAddressService.setDefault(btn.dataset.id);
        accountToast.show('Dirección establecida como predeterminada.', 'success');
        this.init();
      });
    });

    this.container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Eliminar esta dirección guardada?')) {
          await CustomerAddressService.deleteAddress(btn.dataset.id);
          accountToast.show('Dirección eliminada.', 'success');
          this.init();
        }
      });
    });
  }

  openAddressModal(address = null) {
    const modal = new AddressModal({
      address,
      onSave: () => this.init()
    });
    modal.open();
  }
}
