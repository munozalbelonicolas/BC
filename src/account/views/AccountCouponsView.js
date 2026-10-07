/**
 * @file AccountCouponsView.js
 * Personal discount coupons directory with 1-click clipboard copy.
 */

import { CustomerCouponService } from '../services/customerCouponService.js';
import { accountToast } from '../components/AccountToast.js';

export class AccountCouponsView {
  constructor(options = {}) {
    this.container = options.container;
    this.coupons = [];
  }

  async init() {
    this.coupons = await CustomerCouponService.getAvailableCoupons();
    this.render();
  }

  render() {
    const cardsHtml = this.coupons.map(c => `
      <div class="customer-coupon-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div class="coupon-code-pill">
              <span>${c.code}</span>
              <button class="btn-copy-code" data-code="${c.code}" title="Copiar código" style="background:none; border:none; cursor:pointer; color:var(--acc-primary); font-size:14px;">
                📋
              </button>
            </div>
            <span class="status-pill success">Disponible</span>
          </div>

          <div style="font-size:16px; font-weight:800; color:var(--acc-text); margin-bottom:4px;">
            ${c.benefit}
          </div>
          <p style="font-size:12.5px; color:var(--acc-muted); line-height:1.5;">${c.condition}</p>
        </div>

        <div style="margin-top:16px; padding-top:12px; border-top:1px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--acc-muted);">
          <span>Compra mínima: <strong>$${Number(c.minSpend).toLocaleString('es-AR')}</strong></span>
          <span>Vence: <strong>${new Date(c.expiresAt).toLocaleDateString('es-AR')}</strong></span>
        </div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="portal-page-header">
        <h1>Mis Cupones Disponibles</h1>
        <p>Descuentos y beneficios exclusivos asignados a tu cuenta para aplicar en el checkout</p>
      </div>

      <div class="coupons-grid">
        ${cardsHtml}
      </div>

      <div style="margin-top:24px; padding:16px; background:var(--acc-primary-light); border:1px solid var(--acc-border); border-radius:12px; font-size:13px; color:var(--acc-text); display:flex; align-items:center; gap:12px;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--acc-primary); flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>¿Cómo usarlos? Copiá el código de tu cupón y pegalo en el campo "Cupón de descuento" al momento de finalizar tu compra en el carrito.</span>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        navigator.clipboard.writeText(code).then(() => {
          accountToast.show(`¡Código "${code}" copiado al portapapeles!`, 'success');
        });
      });
    });
  }
}
