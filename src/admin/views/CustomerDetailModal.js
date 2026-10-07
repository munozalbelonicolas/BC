/**
 * @file CustomerDetailModal.js
 * Customer 360 profile slide-over with order history, addresses, lifetime value, and notes.
 */

import { customerRepo, orderRepo } from '../repositories/factory.js';
import { toast } from '../components/Toast.js';

export class CustomerDetailModal {
  constructor(options = {}) {
    this.customer = options.customer;
    this.onUpdate = options.onUpdate || (() => {});
    this.orders = [];
    this.backdrop = null;
    this.panel = null;
  }

  async open() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'drawer-backdrop';
    this.panel = document.createElement('div');
    this.panel.className = 'drawer-panel';

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.panel);

    try {
      const { items } = await orderRepo.getAll({ pageSize: 50 });
      this.orders = items.filter(o => o.customer?.email?.toLowerCase() === this.customer.email?.toLowerCase());
    } catch {
      this.orders = [];
    }

    this.render();
  }

  render() {
    const c = this.customer;
    const avgTicket = c.ordersCount > 0 ? Math.round(c.totalSpent / c.ordersCount) : 0;

    const ordersHtml = this.orders.length > 0 ? this.orders.map(o => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px;">
        <div>
          <strong style="color:var(--primary); font-size:13.5px;">${o.id}</strong>
          <span style="font-size:12px; color:var(--text-muted); margin-left:8px;">${new Date(o.createdAt).toLocaleDateString('es-AR')}</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="badge badge-blue">${o.status}</span>
          <strong style="font-size:14px;">$${Number(o.total).toLocaleString('es-AR')}</strong>
        </div>
      </div>
    `).join('') : `<div style="font-size:13px; color:var(--text-muted); font-style:italic;">No se registran pedidos previos asociados a este correo.</div>`;

    this.panel.innerHTML = `
      <div class="drawer-header">
        <div>
          <h2 style="font-size:18px; font-weight:700; color:var(--text-main);">${c.name}</h2>
          <div style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">
            Cliente desde ${new Date(c.createdAt || Date.now()).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button class="modal-close" id="cd-close-btn">&times;</button>
      </div>

      <div class="drawer-body">
        <!-- 3 KPIs -->
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:20px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Gasto Total (LTV)</div>
            <div style="font-size:18px; font-weight:700; color:#065f46; margin-top:4px;">$${Number(c.totalSpent).toLocaleString('es-AR')}</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Pedidos</div>
            <div style="font-size:18px; font-weight:700; color:var(--primary); margin-top:4px;">${c.ordersCount}</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Ticket Promedio</div>
            <div style="font-size:18px; font-weight:700; color:var(--text-main); margin-top:4px;">$${Number(avgTicket).toLocaleString('es-AR')}</div>
          </div>
        </div>

        <!-- Personal & Address Info -->
        <div class="card" style="padding:16px; margin-bottom:20px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:10px;">
            Contacto y Domicilio Principal
          </div>
          <div style="font-size:13.5px; line-height:1.6; color:var(--text-main);">
            <div><strong>Email:</strong> <a href="mailto:${c.email}" style="color:var(--primary);">${c.email}</a></div>
            <div><strong>Teléfono:</strong> ${c.phone || 'Sin registrar'}</div>
            <div><strong>DNI/Documento:</strong> ${c.documentId || 'Sin registrar'}</div>
            <div style="margin-top:6px; padding-top:6px; border-top:1px solid #f1f5f9;">
              <strong>Dirección:</strong> ${c.address?.street || 'Sin calle'} ${c.address?.floor || ''}, ${c.address?.city || 'CABA'}, ${c.address?.province || 'Buenos Aires'} (CP ${c.address?.zip || ''})
            </div>
          </div>
        </div>

        <!-- Orders History -->
        <div class="card" style="padding:16px; margin-bottom:20px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:12px;">
            Historial de Compras Realizadas (${this.orders.length})
          </div>
          ${ordersHtml}
        </div>

        <!-- Internal Notes -->
        <div class="card" style="padding:16px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:6px;">
            Notas Internas del Cliente
          </div>
          <textarea id="cd-notes" class="form-textarea" rows="3">${c.notes || ''}</textarea>
          <button class="btn btn-secondary btn-sm" id="cd-save-notes-btn" style="margin-top:10px;">Guardar Notas</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const close = () => {
      this.backdrop.remove();
      this.panel.remove();
    };

    this.panel.querySelector('#cd-close-btn').addEventListener('click', close);
    this.backdrop.addEventListener('click', close);

    this.panel.querySelector('#cd-save-notes-btn').addEventListener('click', async () => {
      const notes = this.panel.querySelector('#cd-notes').value.trim();
      try {
        await customerRepo.update(this.customer.id, { notes });
        this.customer.notes = notes;
        toast.show('Notas del cliente actualizadas.', 'success');
        this.onUpdate();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }
}
