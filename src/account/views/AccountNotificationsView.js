/**
 * @file AccountNotificationsView.js
 * Notifications center with mark-as-read and notification preferences controls.
 */

import { CustomerNotificationService } from '../services/customerNotificationService.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountNotificationsView {
  constructor(options = {}) {
    this.container = options.container;
    this.onNavigate = options.onNavigate || (() => {});
    this.notifications = [];
    this.preferences = {};
  }

  async init() {
    this.notifications = await CustomerNotificationService.getNotifications();
    this.preferences = CustomerNotificationService.getNotificationPreferences();
    this.render();
  }

  render() {
    const notifsHtml = this.notifications.length > 0 ? this.notifications.map(n => `
      <div style="padding:16px 20px; border-bottom:1px solid var(--acc-border); background:${n.isRead ? 'white' : '#f0fdf4'}; display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="font-size:14px; color:var(--acc-text);">${n.title}</strong>
            ${!n.isRead ? `<span style="width:7px; height:7px; border-radius:50%; background:#10b981;"></span>` : ''}
          </div>
          <p style="font-size:13px; color:var(--acc-muted); margin:4px 0 6px;">${n.message}</p>
          <span style="font-size:11.5px; color:var(--acc-light);">${new Date(n.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          ${n.linkUrl ? `
            <button class="btn-portal btn-portal-secondary btn-portal-sm" data-action="goto" data-url="${n.linkUrl}">
              Ver
            </button>
          ` : ''}
          ${!n.isRead ? `
            <button class="btn-portal btn-portal-sm" data-action="mark-read" data-id="${n.id}" style="color:var(--acc-muted); border:none; background:none; cursor:pointer;" title="Marcar como leída">
              ✓
            </button>
          ` : ''}
        </div>
      </div>
    `).join('') : `
      <div style="padding:40px; text-align:center; color:var(--acc-muted); font-size:13.5px;">
        No tenés notificaciones pendientes.
      </div>
    `;

    this.container.innerHTML = `
      <div class="portal-page-header">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1>Centro de Notificaciones</h1>
            <p>Novedades sobre tus compras, avisos de despacho y promociones exclusivas</p>
          </div>
          <button class="btn-portal btn-portal-secondary btn-portal-sm" id="btn-mark-all-read">
            Marcar todas como leídas
          </button>
        </div>
      </div>

      <!-- Notifications stream -->
      <div class="portal-card" style="padding:0; overflow:hidden; margin-bottom:24px;">
        ${notifsHtml}
      </div>

      <!-- Preferences Card -->
      <div class="portal-card">
        <div class="portal-card-title" style="margin-bottom:14px;">Preferencias de Notificación y Canales</div>

        <div style="display:flex; flex-direction:column; gap:14px;">
          <label style="display:flex; align-items:center; justify-content:space-between; font-size:13.5px; cursor:pointer;">
            <div>
              <strong style="color:var(--acc-text);">Actualizaciones de Pedidos y Envíos</strong>
              <div style="font-size:12px; color:var(--acc-muted);">Avisos cuando tu pago se aprueba y cuando el paquete sale de depósito</div>
            </div>
            <input type="checkbox" id="pref-orders" ${this.preferences.orderUpdates ? 'checked' : ''} />
          </label>

          <label style="display:flex; align-items:center; justify-content:space-between; font-size:13.5px; cursor:pointer; padding-top:12px; border-top:1px solid var(--acc-border);">
            <div>
              <strong style="color:var(--acc-text);">Avisos por WhatsApp Directo</strong>
              <div style="font-size:12px; color:var(--acc-muted);">Notificaciones en tiempo real con el código de seguimiento de Andreani</div>
            </div>
            <input type="checkbox" id="pref-whatsapp" ${this.preferences.whatsappUpdates ? 'checked' : ''} />
          </label>

          <label style="display:flex; align-items:center; justify-content:space-between; font-size:13.5px; cursor:pointer; padding-top:12px; border-top:1px solid var(--acc-border);">
            <div>
              <strong style="color:var(--acc-text);">Cupones y Ofertas Especiales</strong>
              <div style="font-size:12px; color:var(--acc-muted);">Beneficios exclusivos por email para próximas compras</div>
            </div>
            <input type="checkbox" id="pref-promos" ${this.preferences.promotions ? 'checked' : ''} />
          </label>
        </div>

        <div style="margin-top:20px; display:flex; justify-content:flex-end;">
          <button class="btn-portal btn-portal-primary btn-portal-sm" id="btn-save-prefs">
            Guardar Preferencias
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#btn-mark-all-read').addEventListener('click', async () => {
      await CustomerNotificationService.markAllAsRead();
      accountToast.show('Todas las notificaciones marcadas como leídas.', 'success');
      this.init();
    });

    this.container.querySelectorAll('[data-action="mark-read"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await CustomerNotificationService.markAsRead(btn.dataset.id);
        this.init();
      });
    });

    this.container.querySelectorAll('[data-action="goto"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.url.replace('#', '');
        this.onNavigate(route);
      });
    });

    this.container.querySelector('#btn-save-prefs').addEventListener('click', () => {
      const prefs = {
        orderUpdates: this.container.querySelector('#pref-orders').checked,
        whatsappUpdates: this.container.querySelector('#pref-whatsapp').checked,
        promotions: this.container.querySelector('#pref-promos').checked,
        emailSummaries: true
      };
      CustomerNotificationService.saveNotificationPreferences(prefs);
      accountToast.show('Preferencias de notificación guardadas.', 'success');
    });
  }
}
