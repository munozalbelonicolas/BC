/**
 * @file SettingsView.js
 * Comprehensive Store Settings interface with General, Address, Ecommerce, Payments, and Logistics tabs.
 */

import { settingsRepo } from '../repositories/factory.js';
import { toast } from '../components/Toast.js';

export class SettingsView {
  constructor(options = {}) {
    this.container = options.container;
    this.activeTab = 'general';
    this.settings = null;
  }

  async init() {
    this.settings = await settingsRepo.getSettings();
    this.render();
  }

  render() {
    const s = this.settings;

    const tabs = [
      { id: 'general', label: 'General' },
      { id: 'address', label: 'Dirección Comercial' },
      { id: 'ecommerce', label: 'E-commerce & Impuestos' },
      { id: 'payments', label: 'Pasarelas de Pago' },
      { id: 'shipping', label: 'Logística de Envíos' }
    ].map(t => `
      <button class="btn btn-sm ${this.activeTab === t.id ? 'btn-primary' : 'btn-secondary'}" data-tab="${t.id}">
        ${t.label}
      </button>
    `).join('');

    let tabBody = '';

    if (this.activeTab === 'general') {
      tabBody = `
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nombre del Comercio</label>
            <input type="text" id="set-store-name" class="form-input" value="${s.general.storeName}" />
          </div>
          <div class="form-group">
            <label class="form-label">Eslogan / Subtítulo</label>
            <input type="text" id="set-tagline" class="form-input" value="${s.general.tagline}" />
          </div>
          <div class="form-group">
            <label class="form-label">Email Legal de Contacto</label>
            <input type="email" id="set-email" class="form-input" value="${s.general.email}" />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono / WhatsApp de Atención</label>
            <input type="text" id="set-phone" class="form-input" value="${s.general.phone}" />
          </div>
          <div class="form-group">
            <label class="form-label">CUIT de la Empresa</label>
            <input type="text" id="set-cuit" class="form-input" value="${s.general.cuit}" />
          </div>
          <div class="form-group">
            <label class="form-label">Cuenta de Instagram</label>
            <input type="text" id="set-instagram" class="form-input" value="${s.general.instagram}" />
          </div>
        </div>
      `;
    } else if (this.activeTab === 'address') {
      tabBody = `
        <div class="form-grid">
          <div class="form-group form-group-full">
            <label class="form-label">Calle y Altura Comercial</label>
            <input type="text" id="set-street" class="form-input" value="${s.address.street}" />
          </div>
          <div class="form-group">
            <label class="form-label">Piso / Showroom</label>
            <input type="text" id="set-floor" class="form-input" value="${s.address.floor}" />
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad / Localidad</label>
            <input type="text" id="set-city" class="form-input" value="${s.address.city}" />
          </div>
          <div class="form-group">
            <label class="form-label">Provincia</label>
            <input type="text" id="set-province" class="form-input" value="${s.address.province}" />
          </div>
          <div class="form-group">
            <label class="form-label">Código Postal</label>
            <input type="text" id="set-zip" class="form-input" value="${s.address.zip}" />
          </div>
        </div>
      `;
    } else if (this.activeTab === 'ecommerce') {
      tabBody = `
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Símbolo de Moneda</label>
            <input type="text" id="set-currency-symbol" class="form-input" value="${s.ecommerce.currencySymbol}" />
          </div>
          <div class="form-group">
            <label class="form-label">Código ISO de Moneda</label>
            <input type="text" id="set-currency-code" class="form-input" value="${s.ecommerce.currencyCode}" />
          </div>
          <div class="form-group">
            <label class="form-label">Alícuota IVA (%)</label>
            <input type="number" id="set-tax-rate" class="form-input" value="${s.ecommerce.taxRate}" />
          </div>
          <div class="form-group">
            <label class="form-label">Umbral de Alerta de Stock Bajo (unidades)</label>
            <input type="number" id="set-min-stock-alert" class="form-input" value="${s.ecommerce.minStockAlert}" />
          </div>
          <div class="form-group form-group-full">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="set-auto-reserve" ${s.ecommerce.autoReserveStock ? 'checked' : ''} />
              <span style="font-size:13.5px;">Reservar stock físico automáticamente cuando el pedido pasa a estado "Confirmado"</span>
            </label>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'payments') {
      tabBody = `
        <div class="form-grid">
          <div class="form-group form-group-full">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="set-mp-enabled" ${s.payments.mercadopagoEnabled ? 'checked' : ''} />
              <strong style="font-size:14px;">Habilitar Checkout de Mercado Pago (Tarjetas, Dinero en cuenta, Cuotas)</strong>
            </label>
          </div>
          <div class="form-group form-group-full">
            <label class="form-label">Mercado Pago Public Key</label>
            <input type="text" id="set-mp-key" class="form-input" value="${s.payments.mercadopagoPublicKey}" />
          </div>
          <div class="form-group form-group-full">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="set-bt-enabled" ${s.payments.bankTransferEnabled ? 'checked' : ''} />
              <strong style="font-size:14px;">Habilitar Transferencia Bancaria Directa</strong>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">Descuento por Transferencia (%)</label>
            <input type="number" id="set-bt-discount" class="form-input" value="${s.payments.bankTransferDiscount}" />
          </div>
          <div class="form-group">
            <label class="form-label">Alias CBU / CVU</label>
            <input type="text" id="set-bt-alias" class="form-input" value="${s.payments.bankAlias}" />
          </div>
          <div class="form-group form-group-full">
            <label class="form-label">CBU Oficial de la Empresa</label>
            <input type="text" id="set-bt-cbu" class="form-input" value="${s.payments.bankCbu}" />
          </div>
        </div>
      `;
    } else if (this.activeTab === 'shipping') {
      tabBody = `
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Monto Mínimo para Envío Gratis ($ ARS)</label>
            <input type="number" id="set-ship-free" class="form-input" value="${s.shipping.freeShippingThreshold}" />
          </div>
          <div class="form-group">
            <label class="form-label">Costo Envío Express CABA ($ ARS)</label>
            <input type="number" id="set-ship-express" class="form-input" value="${s.shipping.expressDeliveryFee}" />
          </div>
          <div class="form-group form-group-full">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="set-ship-pickup" ${s.shipping.enableLocalPickup ? 'checked' : ''} />
              <span style="font-size:13.5px;">Permitir retiro inmediato en Showroom Central</span>
            </label>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Configuración General del Negocio</h1>
          <p>Ajustes globales de tienda, impuestos, pasarelas de pago y logística</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="set-save-btn">
            Guardar Configuración
          </button>
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
        ${tabs}
      </div>

      <div class="card">
        <div class="card-body">
          ${tabBody}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });

    this.container.querySelector('#set-save-btn').addEventListener('click', async () => {
      try {
        if (this.activeTab === 'general') {
          this.settings.general.storeName = this.container.querySelector('#set-store-name').value.trim();
          this.settings.general.tagline = this.container.querySelector('#set-tagline').value.trim();
          this.settings.general.email = this.container.querySelector('#set-email').value.trim();
          this.settings.general.phone = this.container.querySelector('#set-phone').value.trim();
          this.settings.general.cuit = this.container.querySelector('#set-cuit').value.trim();
          this.settings.general.instagram = this.container.querySelector('#set-instagram').value.trim();
        } else if (this.activeTab === 'address') {
          this.settings.address.street = this.container.querySelector('#set-street').value.trim();
          this.settings.address.city = this.container.querySelector('#set-city').value.trim();
          this.settings.address.province = this.container.querySelector('#set-province').value.trim();
          this.settings.address.zip = this.container.querySelector('#set-zip').value.trim();
        } else if (this.activeTab === 'ecommerce') {
          this.settings.ecommerce.currencySymbol = this.container.querySelector('#set-currency-symbol').value.trim();
          this.settings.ecommerce.taxRate = parseFloat(this.container.querySelector('#set-tax-rate').value);
          this.settings.ecommerce.minStockAlert = parseInt(this.container.querySelector('#set-min-stock-alert').value, 10);
        } else if (this.activeTab === 'payments') {
          this.settings.payments.mercadopagoEnabled = this.container.querySelector('#set-mp-enabled').checked;
          this.settings.payments.bankTransferEnabled = this.container.querySelector('#set-bt-enabled').checked;
          this.settings.payments.bankTransferDiscount = parseFloat(this.container.querySelector('#set-bt-discount').value);
          this.settings.payments.bankAlias = this.container.querySelector('#set-bt-alias').value.trim();
        } else if (this.activeTab === 'shipping') {
          this.settings.shipping.freeShippingThreshold = parseFloat(this.container.querySelector('#set-ship-free').value);
          this.settings.shipping.expressDeliveryFee = parseFloat(this.container.querySelector('#set-ship-express').value);
        }

        await settingsRepo.updateSettings(this.settings);
        toast.show('Ajustes guardados correctamente.', 'success');
      } catch (err) {
        toast.show('Error al guardar: ' + err.message, 'danger');
      }
    });
  }
}
