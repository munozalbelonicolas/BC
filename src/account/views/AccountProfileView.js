/**
 * @file AccountProfileView.js
 * Customer Profile editor with secure email change flow and validation states.
 */

import { customerAuthService } from '../services/customerAuthService.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountProfileView {
  constructor(options = {}) {
    this.container = options.container;
  }

  async init() {
    this.render();
  }

  render() {
    const user = customerAuthService.getCurrentCustomer() || {
      name: '',
      lastName: '',
      email: '',
      phone: '',
      documentId: ''
    };

    this.container.innerHTML = `
      <div class="portal-page-header">
        <h1>Mis Datos Personales</h1>
        <p>Administrá tu información de contacto e identidad para compras y facturación</p>
      </div>

      <div class="portal-card">
        <div class="portal-card-header">
          <span class="portal-card-title">Información de Perfil</span>
        </div>

        <form id="profile-form">
          <div class="portal-form-grid" style="margin-bottom:20px;">
            <div class="portal-form-group">
              <label class="portal-label">Nombre</label>
              <input type="text" id="prof-name" class="portal-input" value="${user.name || ''}" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Apellido</label>
              <input type="text" id="prof-lastname" class="portal-input" value="${user.lastName || ''}" required />
            </div>

            <div class="portal-form-group">
              <label class="portal-label">Teléfono Móvil (WhatsApp)</label>
              <input type="tel" id="prof-phone" class="portal-input" value="${user.phone || ''}" placeholder="+54 11 4455-8899" />
              <span style="font-size:12px; color:var(--acc-muted);">Utilizado para coordinar entregas y avisos de despacho</span>
            </div>

            <div class="portal-form-group">
              <label class="portal-label">DNI o CUIT (Para Facturación)</label>
              <input type="text" id="prof-document" class="portal-input" value="${user.documentId || ''}" placeholder="32.456.789" />
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button type="submit" class="btn-portal btn-portal-primary" id="prof-submit-btn">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      <!-- Email Change Security Card -->
      <div class="portal-card">
        <div class="portal-card-header">
          <div>
            <span class="portal-card-title">Correo Electrónico de la Cuenta</span>
            <div style="font-size:13px; color:var(--acc-muted); margin-top:2px;">
              Tu email actual es: <strong>${user.email}</strong>
            </div>
          </div>
        </div>

        <p style="font-size:13.5px; color:var(--acc-muted); margin-bottom:16px;">
          Por razones de seguridad, si cambiás tu dirección de correo electrónico se enviará un enlace de verificación al nuevo buzón antes de actualizar el acceso.
        </p>

        <form id="email-change-form" style="display:flex; gap:12px; max-width:540px; flex-wrap:wrap;">
          <input type="email" id="new-email-input" class="portal-input" placeholder="Ingresá tu nuevo email" style="flex:1; min-width:240px;" required />
          <button type="submit" class="btn-portal btn-portal-secondary">
            Solicitar Cambio Seguro
          </button>
        </form>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Profile save
    const profileForm = this.container.querySelector('#profile-form');
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = this.container.querySelector('#prof-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      try {
        await customerAuthService.updateProfile({
          name: this.container.querySelector('#prof-name').value.trim(),
          lastName: this.container.querySelector('#prof-lastname').value.trim(),
          phone: this.container.querySelector('#prof-phone').value.trim(),
          documentId: this.container.querySelector('#prof-document').value.trim()
        });
        accountToast.show('Datos actualizados correctamente.', 'success');
      } catch (err) {
        accountToast.show(err.message, 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios';
      }
    });

    // Email change
    const emailForm = this.container.querySelector('#email-change-form');
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = this.container.querySelector('#new-email-input');
      const newEmail = input.value.trim();

      try {
        const res = await customerAuthService.requestEmailChange(newEmail);
        accountToast.show(res.message, 'success');
        input.value = '';
      } catch (err) {
        accountToast.show(err.message, 'danger');
      }
    });
  }
}
