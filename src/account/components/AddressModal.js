/**
 * @file AddressModal.js
 * Modal dialog for creating and editing customer delivery addresses.
 */

import { CustomerAddressService } from '../services/customerAddressService.js';
import { accountToast } from './AccountToast.js';

export class AddressModal {
  constructor(options = {}) {
    this.address = options.address || null;
    this.onSave = options.onSave || (() => {});
    this.backdrop = null;
  }

  open() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'portal-modal-backdrop';

    const a = this.address || {
      alias: 'Casa',
      recipientName: '',
      phone: '',
      street: '',
      number: '',
      floor: '',
      apartment: '',
      zipCode: '',
      city: 'CABA',
      province: 'Buenos Aires',
      reference: '',
      isDefault: false
    };

    const isEdit = Boolean(this.address);

    this.backdrop.innerHTML = `
      <div class="portal-modal-box" style="max-width:540px;">
        <div class="portal-modal-header">
          <h3 style="font-size:17px; font-weight:700; color:var(--acc-text);">${isEdit ? 'Editar Dirección' : 'Nueva Dirección de Entrega'}</h3>
          <button style="background:none; border:none; cursor:pointer; font-size:18px;" id="addr-close-btn">&times;</button>
        </div>

        <form id="address-form" class="portal-modal-body">
          <div class="portal-form-grid">
            <div class="portal-form-group">
              <label class="portal-label">Alias de la Dirección</label>
              <input type="text" id="am-alias" class="portal-input" value="${a.alias || 'Casa'}" placeholder="Ej: Casa, Trabajo, Depto" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Nombre del Destinatario</label>
              <input type="text" id="am-recipient" class="portal-input" value="${a.recipientName || ''}" placeholder="Quién recibe el paquete" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Teléfono de Contacto</label>
              <input type="tel" id="am-phone" class="portal-input" value="${a.phone || ''}" placeholder="+54 11 4455-8899" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Código Postal</label>
              <input type="text" id="am-zip" class="portal-input" value="${a.zipCode || ''}" placeholder="1425" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Calle</label>
              <input type="text" id="am-street" class="portal-input" value="${a.street || ''}" placeholder="Av. Corrientes" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Número</label>
              <input type="text" id="am-number" class="portal-input" value="${a.number || ''}" placeholder="1450" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Piso (Opcional)</label>
              <input type="text" id="am-floor" class="portal-input" value="${a.floor || ''}" placeholder="4" />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Depto (Opcional)</label>
              <input type="text" id="am-apartment" class="portal-input" value="${a.apartment || ''}" placeholder="B" />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Ciudad / Localidad</label>
              <input type="text" id="am-city" class="portal-input" value="${a.city || 'CABA'}" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Provincia</label>
              <select id="am-province" class="portal-select">
                <option value="Buenos Aires" ${a.province === 'Buenos Aires' ? 'selected' : ''}>Buenos Aires</option>
                <option value="CABA" ${a.province === 'CABA' ? 'selected' : ''}>Ciudad Autónoma de Buenos Aires</option>
                <option value="Córdoba" ${a.province === 'Córdoba' ? 'selected' : ''}>Córdoba</option>
                <option value="Santa Fe" ${a.province === 'Santa Fe' ? 'selected' : ''}>Santa Fe</option>
                <option value="Mendoza" ${a.province === 'Mendoza' ? 'selected' : ''}>Mendoza</option>
                <option value="Otra" ${!['Buenos Aires','CABA','Córdoba','Santa Fe','Mendoza'].includes(a.province) ? 'selected' : ''}>Otra Provincia</option>
              </select>
            </div>

            <div class="portal-form-group portal-form-group-full">
              <label class="portal-label">Referencias Adicionales</label>
              <input type="text" id="am-reference" class="portal-input" value="${a.reference || ''}" placeholder="Ej: Portón negro, timbre 4B, entre calles..." />
            </div>

            <div class="portal-form-group portal-form-group-full" style="margin-top:6px;">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13.5px;">
                <input type="checkbox" id="am-default" ${a.isDefault ? 'checked' : ''} />
                <span>Establecer como mi dirección predeterminada para futuras compras</span>
              </label>
            </div>
          </div>
        </form>

        <div class="portal-modal-footer">
          <button type="button" class="btn-portal btn-portal-secondary" id="am-cancel-btn">Cancelar</button>
          <button type="submit" form="address-form" class="btn-portal btn-portal-primary">${isEdit ? 'Guardar Cambios' : 'Guardar Dirección'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    const close = () => this.backdrop.remove();
    this.backdrop.querySelector('#addr-close-btn').addEventListener('click', close);
    this.backdrop.querySelector('#am-cancel-btn').addEventListener('click', close);

    this.backdrop.querySelector('#address-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        id: this.address?.id,
        alias: this.backdrop.querySelector('#am-alias').value.trim(),
        recipientName: this.backdrop.querySelector('#am-recipient').value.trim(),
        phone: this.backdrop.querySelector('#am-phone').value.trim(),
        street: this.backdrop.querySelector('#am-street').value.trim(),
        number: this.backdrop.querySelector('#am-number').value.trim(),
        floor: this.backdrop.querySelector('#am-floor').value.trim(),
        apartment: this.backdrop.querySelector('#am-apartment').value.trim(),
        zipCode: this.backdrop.querySelector('#am-zip').value.trim(),
        city: this.backdrop.querySelector('#am-city').value.trim(),
        province: this.backdrop.querySelector('#am-province').value,
        reference: this.backdrop.querySelector('#am-reference').value.trim(),
        isDefault: this.backdrop.querySelector('#am-default').checked
      };

      try {
        await CustomerAddressService.saveAddress(payload);
        accountToast.show('Dirección guardada exitosamente.', 'success');
        close();
        this.onSave();
      } catch (err) {
        accountToast.show(err.message, 'danger');
      }
    });
  }
}
