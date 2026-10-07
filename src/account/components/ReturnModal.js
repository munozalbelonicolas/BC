/**
 * @file ReturnModal.js
 * Multi-step return request modal with eligible orders selector and reason options.
 */

import { CustomerReturnsService } from '../services/customerReturnsService.js';
import { ReturnReason } from '../types/customerEntities.js';
import { accountToast } from './AccountToast.js';

export class ReturnModal {
  constructor(options = {}) {
    this.deliveredOrders = options.deliveredOrders || [];
    this.onSuccess = options.onSuccess || (() => {});
    this.backdrop = null;
  }

  open() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'portal-modal-backdrop';

    if (this.deliveredOrders.length === 0) {
      this.backdrop.innerHTML = `
        <div class="portal-modal-box">
          <div class="portal-modal-header">
            <h3 style="font-size:17px; font-weight:700;">Solicitar Devolución o Cambio</h3>
            <button id="rm-close-btn" style="background:none; border:none; cursor:pointer; font-size:18px;">&times;</button>
          </div>
          <div class="portal-modal-body" style="text-align:center; padding:30px 20px;">
            <p style="font-size:14px; color:var(--acc-muted); margin-bottom:16px;">
              No poseés pedidos entregados dentro del período de garantía legal de 30 días para realizar una devolución.
            </p>
            <button class="btn-portal btn-portal-primary" id="rm-ok-btn">Entendido</button>
          </div>
        </div>
      `;
      document.body.appendChild(this.backdrop);
      const close = () => this.backdrop.remove();
      this.backdrop.querySelector('#rm-close-btn').addEventListener('click', close);
      this.backdrop.querySelector('#rm-ok-btn').addEventListener('click', close);
      return;
    }

    const firstOrder = this.deliveredOrders[0];

    this.backdrop.innerHTML = `
      <div class="portal-modal-box" style="max-width:520px;">
        <div class="portal-modal-header">
          <h3 style="font-size:17px; font-weight:700; color:var(--acc-text);">Solicitar Devolución o Cambio</h3>
          <button id="rm-close-btn" style="background:none; border:none; cursor:pointer; font-size:18px;">&times;</button>
        </div>

        <form id="return-form" class="portal-modal-body">
          <div class="portal-form-group" style="margin-bottom:14px;">
            <label class="portal-label">1. Seleccioná el pedido entregado</label>
            <select id="rm-order-select" class="portal-select">
              ${this.deliveredOrders.map(o => `
                <option value="${o.id}">Pedido ${o.id} • Entregado (${new Date(o.date).toLocaleDateString('es-AR')})</option>
              `).join('')}
            </select>
          </div>

          <div class="portal-form-group" style="margin-bottom:14px;">
            <label class="portal-label">2. Producto a devolver o cambiar</label>
            <select id="rm-prod-select" class="portal-select">
              ${(firstOrder.items || []).map(i => `
                <option value="${i.id}">${i.name} (Cant: ${i.quantity})</option>
              `).join('')}
            </select>
          </div>

          <div class="portal-form-group" style="margin-bottom:14px;">
            <label class="portal-label">3. Motivo principal</label>
            <select id="rm-reason-select" class="portal-select">
              ${Object.values(ReturnReason).map(r => `
                <option value="${r}">${r}</option>
              `).join('')}
            </select>
          </div>

          <div class="portal-form-group" style="margin-bottom:14px;">
            <label class="portal-label">4. Detalle adicional / Comentario explicativo</label>
            <textarea id="rm-comments" class="portal-textarea" rows="3" placeholder="Describí brevemente el problema o motivo de disconformidad..."></textarea>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:12px; color:var(--acc-muted); line-height:1.5;">
            <strong>Política de Garantía BC:</strong> Cuentas con 30 días corridos de cambio inmediato directo y 12 meses de garantía técnica oficial con repuestos de fábrica.
          </div>
        </form>

        <div class="portal-modal-footer">
          <button type="button" class="btn-portal btn-portal-secondary" id="rm-cancel-btn">Cancelar</button>
          <button type="submit" form="return-form" class="btn-portal btn-portal-primary">Enviar Solicitud</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    this.bindEvents();
  }

  bindEvents() {
    const close = () => this.backdrop.remove();
    this.backdrop.querySelector('#rm-close-btn').addEventListener('click', close);
    this.backdrop.querySelector('#rm-cancel-btn').addEventListener('click', close);

    const orderSelect = this.backdrop.querySelector('#rm-order-select');
    const prodSelect = this.backdrop.querySelector('#rm-prod-select');

    orderSelect.addEventListener('change', () => {
      const selected = this.deliveredOrders.find(o => o.id === orderSelect.value);
      if (selected && selected.items) {
        prodSelect.innerHTML = selected.items.map(i => `
          <option value="${i.id}">${i.name} (Cant: ${i.quantity})</option>
        `).join('');
      }
    });

    this.backdrop.querySelector('#return-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const orderId = orderSelect.value;
      const productId = prodSelect.value;
      const reason = this.backdrop.querySelector('#rm-reason-select').value;
      const comments = this.backdrop.querySelector('#rm-comments').value.trim();

      try {
        await CustomerReturnsService.requestReturn({
          orderId,
          productId,
          quantity: 1,
          reason,
          comments
        });
        accountToast.show('Solicitud enviada con éxito. Nuestro equipo la revisará dentro de las 24 hs.', 'success');
        close();
        this.onSuccess();
      } catch (err) {
        accountToast.show(err.message, 'danger');
      }
    });
  }
}
