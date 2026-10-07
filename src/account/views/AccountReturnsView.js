/**
 * @file AccountReturnsView.js
 * Customer Returns and Exchanges center with history tracking and guided request modal.
 */

import { CustomerReturnsService } from '../services/customerReturnsService.js';
import { CustomerOrderService } from '../services/customerOrderService.js';
import { ReturnModal } from '../components/ReturnModal.js';

export class AccountReturnsView {
  constructor(options = {}) {
    this.container = options.container;
    this.returns = [];
    this.orders = [];
  }

  async init() {
    const [rets, ords] = await Promise.all([
      CustomerReturnsService.getReturns(),
      CustomerOrderService.getOrders()
    ]);
    this.returns = rets;
    this.orders = ords;
    this.render();
  }

  render() {
    const deliveredOrders = this.orders.filter(o => o.status.includes('Entregado'));

    let historyHtml = '';
    if (this.returns.length === 0) {
      historyHtml = `
        <div style="padding:30px; text-align:center; color:var(--acc-muted); font-size:13.5px;">
          No poseés solicitudes de devolución ni cambios en curso.
        </div>
      `;
    } else {
      historyHtml = this.returns.map(r => `
        <div style="padding:16px; border-bottom:1px solid var(--acc-border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:10px;">
              <strong style="font-size:14px; color:var(--acc-text);">${r.productName}</strong>
              <span class="status-pill warning" style="font-size:11px;">${r.status}</span>
            </div>
            <div style="font-size:12.5px; color:var(--acc-muted); margin-top:2px;">
              Vinculado a Pedido ${r.orderId} • Motivo: <em>${r.reason}</em>
            </div>
            ${r.comments ? `<div style="font-size:12px; color:var(--acc-muted); margin-top:2px;">"${r.comments}"</div>` : ''}
          </div>
          <span style="font-size:12px; color:var(--acc-muted);">
            ${new Date(r.createdAt).toLocaleDateString('es-AR')}
          </span>
        </div>
      `).join('');
    }

    this.container.innerHTML = `
      <div class="portal-page-header">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h1>Devoluciones & Cambios</h1>
            <p>Gestioná garantías, cambios directos y solicitudes de reintegro conforme a nuestra política comercial</p>
          </div>
          <button class="btn-portal btn-portal-primary" id="ret-new-btn">
            + Solicitar Devolución o Cambio
          </button>
        </div>
      </div>

      <!-- Commercial Guarantee info card -->
      <div class="portal-card" style="background:var(--acc-subtle); margin-bottom:20px;">
        <h3 style="font-size:15px; font-weight:700; color:var(--acc-text); margin-bottom:8px;">Garantía de Satisfacción BC Especial Import</h3>
        <ul style="font-size:13px; color:var(--acc-muted); line-height:1.7; padding-left:18px;">
          <li>Tenés <strong>30 días corridos</strong> desde la entrega para realizar cambios directos por cualquier disconformidad o falla de fábrica.</li>
          <li>Todos nuestros electrodomésticos y dispositivos cuentan con <strong>12 meses de garantía oficial</strong> respaldada por servicio técnico homologado.</li>
          <li>El producto debe conservarse en su empaque original con accesorios y manuales para cambios de talle o modelo.</li>
        </ul>
      </div>

      <!-- History card -->
      <div class="portal-card" style="padding:0; overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--acc-border); font-weight:700; font-size:15px;">
          Tus Solicitudes Registradas (${this.returns.length})
        </div>
        <div>
          ${historyHtml}
        </div>
      </div>
    `;

    this.container.querySelector('#ret-new-btn').addEventListener('click', () => {
      const modal = new ReturnModal({
        deliveredOrders,
        onSuccess: () => this.init()
      });
      modal.open();
    });
  }
}
