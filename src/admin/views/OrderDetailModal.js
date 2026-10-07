/**
 * @file OrderDetailModal.js
 * Comprehensive slide-over drawer for order inspection, timeline tracking,
 * status transitions, tracking code updates, and internal notes.
 */

import { OrderService } from '../services/orderService.js';
import { OrderStatus, PaymentStatus } from '../types/entities.js';
import { toast } from '../components/Toast.js';

export class OrderDetailModal {
  constructor(options = {}) {
    this.order = options.order;
    this.onUpdate = options.onUpdate || (() => {});
    this.backdrop = null;
    this.panel = null;
  }

  open() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'drawer-backdrop';

    this.panel = document.createElement('div');
    this.panel.className = 'drawer-panel';

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.panel);

    this.render();
  }

  render() {
    const o = this.order;
    const formattedDate = new Date(o.createdAt).toLocaleString('es-AR', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    // Timeline elements
    const timelineHtml = (o.timeline || []).map((t, idx) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-title">${t.title || t.status}</div>
        <div class="timeline-meta">
          ${new Date(t.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} • Por: ${t.user || 'Sistema'}
          ${t.reason ? `<div style="font-style:italic; margin-top:2px;">"${t.reason}"</div>` : ''}
        </div>
      </div>
    `).join('');

    // Items list
    const itemsHtml = (o.items || []).map(item => `
      <tr>
        <td>
          <div class="table-product-cell">
            <img src="${item.image || '/images/store_front.jpg'}" class="table-product-thumb" style="width:38px; height:38px;" />
            <div class="table-product-info">
              <span class="table-product-name" style="font-size:13px;">${item.name}</span>
              <span class="table-product-sku">SKU: ${item.sku || 'N/A'} • ${item.variant || 'Estándar'}</span>
            </div>
          </div>
        </td>
        <td style="text-align:center;"><strong>${item.quantity}</strong></td>
        <td style="text-align:right;">$${Number(item.unitPrice).toLocaleString('es-AR')}</td>
        <td style="text-align:right;"><strong>$${Number(item.subtotal || item.unitPrice * item.quantity).toLocaleString('es-AR')}</strong></td>
      </tr>
    `).join('');

    this.panel.innerHTML = `
      <div class="drawer-header">
        <div>
          <div style="display:flex; align-items:center; gap:10px;">
            <h2 style="font-size:18px; font-weight:700; color:var(--text-main);">Pedido ${o.id}</h2>
            <span class="badge badge-blue">${o.status}</span>
          </div>
          <div style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">
            ${formattedDate}
          </div>
        </div>
        <button class="modal-close" id="od-close-btn">&times;</button>
      </div>

      <div class="drawer-body">
        <!-- Status change action bar -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Actualizar Estado Operativo:</div>
            <select id="od-status-select" class="form-select" style="margin-top:4px; padding:5px 10px; font-size:13px;">
              <option value="${OrderStatus.PENDING}" ${o.status === OrderStatus.PENDING ? 'selected' : ''}>Pendiente de Confirmación</option>
              <option value="${OrderStatus.CONFIRMED}" ${o.status === OrderStatus.CONFIRMED ? 'selected' : ''}>Confirmado</option>
              <option value="${OrderStatus.PREPARING}" ${o.status === OrderStatus.PREPARING ? 'selected' : ''}>En Preparación (Depósito)</option>
              <option value="${OrderStatus.READY}" ${o.status === OrderStatus.READY ? 'selected' : ''}>Listo para Retiro / Despacho</option>
              <option value="${OrderStatus.SHIPPED}" ${o.status === OrderStatus.SHIPPED ? 'selected' : ''}>Enviado / En Tránsito</option>
              <option value="${OrderStatus.DELIVERED}" ${o.status === OrderStatus.DELIVERED ? 'selected' : ''}>Entregado al Cliente</option>
              <option value="${OrderStatus.CANCELLED}" ${o.status === OrderStatus.CANCELLED ? 'selected' : ''}>Cancelado</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="od-save-status-btn" style="margin-top:16px;">
            Guardar Estado
          </button>
        </div>

        <!-- 2 Columns: Customer Info & Shipping Address -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
          <div class="card" style="padding:14px;">
            <div style="font-size:11.5px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">
              Datos del Cliente
            </div>
            <div style="font-size:14px; font-weight:600; color:var(--text-main);">${o.customer?.name}</div>
            <div style="font-size:13px; color:var(--text-muted); margin-top:2px;">
              <a href="mailto:${o.customer?.email}" style="color:var(--primary); text-decoration:none;">${o.customer?.email}</a>
            </div>
            <div style="font-size:13px; color:var(--text-muted); margin-top:2px;">${o.customer?.phone || 'Sin teléfono'}</div>
            ${o.customer?.document ? `<div style="font-size:12px; color:var(--text-muted); margin-top:2px;">DNI/CUIT: ${o.customer?.document}</div>` : ''}
          </div>

          <div class="card" style="padding:14px;">
            <div style="font-size:11.5px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">
              Dirección de Entrega
            </div>
            <div style="font-size:14px; font-weight:600; color:var(--text-main);">${o.shippingAddress?.street || 'Retiro en Showroom'} ${o.shippingAddress?.floor || ''}</div>
            <div style="font-size:13px; color:var(--text-muted); margin-top:2px;">
              ${o.shippingAddress?.city || 'CABA'}, ${o.shippingAddress?.province || 'Buenos Aires'} (CP ${o.shippingAddress?.zip || '1042'})
            </div>
            <div style="font-size:12px; color:var(--primary); font-weight:600; margin-top:4px;">
              Método: ${o.carrier || 'Andreani Express'}
            </div>
          </div>
        </div>

        <!-- Products Table -->
        <div class="card" style="margin-bottom:20px; overflow:hidden;">
          <div class="card-header" style="padding:12px 16px;">
            <span class="card-title" style="font-size:14px;">Artículos del Pedido (${o.items?.length || 0})</span>
          </div>
          <table class="data-table" style="font-size:13px;">
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align:center;">Cant.</th>
                <th style="text-align:right;">Precio</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Financial Summary -->
        <div class="card" style="padding:16px; margin-bottom:20px; background:#f8fafc;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;">
            <span style="color:var(--text-muted);">Subtotal Productos:</span>
            <span>$${Number(o.subtotal).toLocaleString('es-AR')}</span>
          </div>
          ${o.discount ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px; color:var(--danger-text);">
              <span>Descuento Cupón (${o.couponCode || 'PROMO'}):</span>
              <span>-$${Number(o.discount).toLocaleString('es-AR')}</span>
            </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;">
            <span style="color:var(--text-muted);">Costo de Envío:</span>
            <span>${o.shippingCost ? `$${Number(o.shippingCost).toLocaleString('es-AR')}` : 'Gratis'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-top:10px; border-top:1px solid #e2e8f0; font-size:16px; font-weight:700;">
            <span>Total Final Cobrado:</span>
            <span style="color:var(--primary);">$${Number(o.total).toLocaleString('es-AR')}</span>
          </div>
          <div style="margin-top:8px; font-size:12px; color:var(--text-muted);">
            Método de Pago: <strong>${o.paymentMethod || 'Mercado Pago'}</strong> (${o.paymentStatus || 'Pagado'})
          </div>
        </div>

        <!-- Tracking & Logistics -->
        <div class="card" style="padding:16px; margin-bottom:20px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:10px;">
            Seguimiento de Envíos y Despacho
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Transportista / Operador Logístico</label>
              <input type="text" id="od-carrier" class="form-input" value="${o.carrier || 'Andreani'}" />
            </div>
            <div class="form-group">
              <label class="form-label">Código de Seguimiento (Tracking)</label>
              <input type="text" id="od-tracking" class="form-input" value="${o.trackingCode || ''}" placeholder="Ej: AND-9941123-AR" />
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="od-save-tracking-btn">Actualizar Tracking</button>
        </div>

        <!-- Internal Notes -->
        <div class="card" style="padding:16px; margin-bottom:20px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:6px;">
            Notas Internas del Equipo
          </div>
          <div style="font-size:13px; color:var(--text-main); background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:10px; margin-bottom:10px; white-space:pre-line;">
            ${o.internalNotes || 'Sin notas internas registradas.'}
          </div>
          <div style="display:flex; gap:8px;">
            <input type="text" id="od-new-note" class="form-input" placeholder="Escribir nota interna del pedido..." />
            <button class="btn btn-secondary btn-sm" id="od-add-note-btn">Agregar</button>
          </div>
        </div>

        <!-- Timeline of Events -->
        <div class="card" style="padding:16px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:12px;">
            Línea Temporal del Pedido
          </div>
          <div class="timeline">
            ${timelineHtml}
          </div>
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

    this.panel.querySelector('#od-close-btn').addEventListener('click', close);
    this.backdrop.addEventListener('click', close);

    // Save status
    this.panel.querySelector('#od-save-status-btn').addEventListener('click', async () => {
      const newStatus = this.panel.querySelector('#od-status-select').value;
      try {
        await OrderService.updateOrderStatus(this.order.id, newStatus, 'Modificado desde panel de pedido');
        this.order.status = newStatus;
        toast.show(`Estado actualizado a ${newStatus}.`, 'success');
        this.onUpdate();
        this.render();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });

    // Save tracking
    this.panel.querySelector('#od-save-tracking-btn').addEventListener('click', async () => {
      const carrier = this.panel.querySelector('#od-carrier').value.trim();
      const code = this.panel.querySelector('#od-tracking').value.trim();
      try {
        await OrderService.updateTracking(this.order.id, carrier, code);
        this.order.carrier = carrier;
        this.order.trackingCode = code;
        toast.show('Datos de tracking guardados.', 'success');
        this.onUpdate();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });

    // Add note
    this.panel.querySelector('#od-add-note-btn').addEventListener('click', async () => {
      const input = this.panel.querySelector('#od-new-note');
      const note = input.value.trim();
      if (!note) return;
      try {
        await OrderService.addInternalNote(this.order.id, note);
        this.order.internalNotes = this.order.internalNotes ? `${this.order.internalNotes}\n- ${note}` : note;
        input.value = '';
        toast.show('Nota interna guardada.', 'success');
        this.render();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }
}
