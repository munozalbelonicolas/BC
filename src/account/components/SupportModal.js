/**
 * @file SupportModal.js
 * Customer assistance modal with automatic order context pre-fill and direct WhatsApp/Email actions.
 */

import { customerAuthService } from '../services/customerAuthService.js';

export class SupportModal {
  constructor(options = {}) {
    this.orderId = options.orderId || null;
    this.backdrop = null;
  }

  open() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'portal-modal-backdrop';

    const user = customerAuthService.getCurrentCustomer();
    const orderContextText = this.orderId ? `Hola, necesito asistencia con mi pedido ${this.orderId}.` : 'Hola, tengo una consulta sobre mi cuenta en BC Especial Import.';
    const encodedText = encodeURIComponent(orderContextText);
    const whatsappUrl = `https://wa.me/5491155001122?text=${encodedText}`;

    this.backdrop.innerHTML = `
      <div class="portal-modal-box">
        <div class="portal-modal-header">
          <div>
            <h3 style="font-size:17px; font-weight:700; color:var(--acc-text);">Atención al Cliente & Soporte</h3>
            ${this.orderId ? `<div style="font-size:12px; color:var(--acc-primary); font-weight:600; margin-top:2px;">Consulta vinculada al Pedido ${this.orderId}</div>` : ''}
          </div>
          <button class="portal-modal-close" id="supp-close-btn" style="background:none; border:none; cursor:pointer; font-size:18px;">&times;</button>
        </div>

        <div class="portal-modal-body">
          <p style="font-size:13.5px; color:var(--acc-muted); margin-bottom:20px;">
            Nuestro equipo de atención está disponible de lunes a sábados de 10:00 a 19:00 hs.
          </p>

          <a href="${whatsappUrl}" target="_blank" class="btn-portal btn-portal-primary" style="width:100%; margin-bottom:12px; background:#10b981; text-decoration:none;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Escribir por WhatsApp Directo
          </a>

          <a href="mailto:contacto@bcespecialimport.com?subject=${encodeURIComponent(this.orderId ? `Consulta Pedido ${this.orderId}` : 'Consulta de Cliente')}&body=${encodedText}" class="btn-portal btn-portal-secondary" style="width:100%; text-decoration:none;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Enviar Consulta por Email
          </a>

          <div style="margin-top:20px; padding:12px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; font-size:12px; color:var(--acc-muted);">
            <strong>Showroom Central:</strong> Av. Corrientes 1450, CABA.<br>
            Teléfono: +54 11 5500-1122
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    const close = () => this.backdrop.remove();
    this.backdrop.querySelector('#supp-close-btn').addEventListener('click', close);
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) close();
    });
  }
}
