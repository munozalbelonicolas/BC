/**
 * @file AccountSecurityView.js
 * Account Security center for password updates, device sessions, and account deletion.
 */

import { customerAuthService } from '../services/customerAuthService.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountSecurityView {
  constructor(options = {}) {
    this.container = options.container;
    this.onLogout = options.onLogout || (() => {});
  }

  async init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="portal-page-header">
        <h1>Seguridad de la Cuenta</h1>
        <p>Controlá tus credenciales de acceso, sesiones activas y privacidad</p>
      </div>

      <!-- Password Change Card -->
      <div class="portal-card">
        <div class="portal-card-title" style="margin-bottom:14px;">Cambiar Contraseña</div>

        <form id="password-form" style="max-width:480px;">
          <div class="portal-form-group" style="margin-bottom:14px;">
            <label class="portal-label">Contraseña Actual</label>
            <input type="password" id="sec-current-pwd" class="portal-input" placeholder="••••••••" required />
          </div>

          <div class="portal-form-group" style="margin-bottom:14px;">
            <label class="portal-label">Nueva Contraseña</label>
            <input type="password" id="sec-new-pwd" class="portal-input" placeholder="Mínimo 6 caracteres" required />
          </div>

          <div class="portal-form-group" style="margin-bottom:18px;">
            <label class="portal-label">Confirmar Nueva Contraseña</label>
            <input type="password" id="sec-confirm-pwd" class="portal-input" placeholder="Repetí la nueva contraseña" required />
          </div>

          <button type="submit" class="btn-portal btn-portal-primary" id="btn-save-pwd">
            Actualizar Contraseña
          </button>
        </form>
      </div>

      <!-- Active Sessions Card -->
      <div class="portal-card">
        <div class="portal-card-title" style="margin-bottom:14px;">Dispositivos y Sesiones Activas</div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#f8fafc; border:1px solid var(--acc-border); border-radius:10px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              <div>
                <strong style="font-size:14px; color:var(--acc-text);">Navegador Web Actual (macOS / Chrome)</strong>
                <div style="font-size:12px; color:#059669; font-weight:600;">● Sesión activa en este dispositivo</div>
              </div>
            </div>
            <span class="status-pill success" style="font-size:11px;">En uso ahora</span>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#ffffff; border:1px solid var(--acc-border); border-radius:10px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
              <div>
                <strong style="font-size:14px; color:var(--acc-text);">Dispositivo Móvil (iOS Safari)</strong>
                <div style="font-size:12px; color:var(--acc-muted);">Última actividad hace 3 días • Buenos Aires, AR</div>
              </div>
            </div>
            <button class="btn-portal btn-portal-secondary btn-portal-sm" onclick="alert('Sesión móvil cerrada.')">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <!-- Danger Zone: Account Deletion -->
      <div class="portal-card" style="border-color:#fecaca; background:#fffafa;">
        <div style="font-size:16px; font-weight:700; color:var(--acc-danger-text); margin-bottom:6px;">Zona de Privacidad: Eliminar Cuenta</div>
        <p style="font-size:13px; color:var(--acc-muted); line-height:1.6; margin-bottom:16px;">
          Si decidís dar de baja tu cuenta, eliminaremos tus direcciones y preferencias personales. Las órdenes y comprobantes fiscales anteriores se conservarán únicamente por las obligaciones impositivas y legales vigentes ante AFIP/ARCA.
        </p>

        <button class="btn-portal btn-portal-sm" id="btn-delete-account" style="background:var(--acc-danger); color:white;">
          Eliminar Mi Cuenta Permanentemente
        </button>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const pwdForm = this.container.querySelector('#password-form');
    pwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cur = this.container.querySelector('#sec-current-pwd').value;
      const nw = this.container.querySelector('#sec-new-pwd').value;
      const cf = this.container.querySelector('#sec-confirm-pwd').value;

      try {
        const res = await customerAuthService.changePassword(cur, nw, cf);
        accountToast.show(res.message, 'success');
        pwdForm.reset();
      } catch (err) {
        accountToast.show(err.message, 'danger');
      }
    });

    const delBtn = this.container.querySelector('#btn-delete-account');
    delBtn.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseás eliminar tu cuenta? Esta acción cancelará tu perfil de cliente.')) {
        await customerAuthService.deleteAccount();
        accountToast.show('Tu cuenta ha sido eliminada.', 'success');
        setTimeout(() => this.onLogout(), 800);
      }
    });
  }
}
