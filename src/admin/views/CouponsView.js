/**
 * @file CouponsView.js
 * Discount Coupons management interface with usage limits and expiry tracking.
 */

import { couponRepo } from '../repositories/factory.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { toast } from '../components/Toast.js';

export class CouponsView {
  constructor(options = {}) {
    this.container = options.container;
    this.coupons = [];
  }

  async init() {
    this.renderLayout();
    await this.loadCoupons();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Cupones de Descuento</h1>
          <p>Creá y administrá códigos promocionales para checkout con límites de uso</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="coupon-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Cupón
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo y Valor</th>
                <th>Compra Mínima</th>
                <th>Usos Registrados</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="coupons-table-body">
              <tr><td colspan="7" style="text-align:center; padding:30px;">Cargando cupones...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.querySelector('#coupon-new-btn').addEventListener('click', () => this.openCouponModal());
  }

  async loadCoupons() {
    try {
      this.coupons = await couponRepo.getAll();
      this.renderTable();
    } catch (err) {
      toast.show('Error al cargar cupones: ' + err.message, 'danger');
    }
  }

  renderTable() {
    const tbody = this.container.querySelector('#coupons-table-body');
    if (this.coupons.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No hay cupones creados.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.coupons.map(c => `
      <tr>
        <td><strong style="color:var(--primary); font-family:var(--font-mono); font-size:14px;">${c.code}</strong></td>
        <td>
          <span style="font-weight:600; color:#065f46;">
            ${c.type === 'percentage' ? `${c.value}% OFF` : `$${Number(c.value).toLocaleString('es-AR')} OFF`}
          </span>
        </td>
        <td><span style="color:var(--text-muted);">$${Number(c.minSpend || 0).toLocaleString('es-AR')}</span></td>
        <td>
          <div style="font-size:13px; font-weight:600;">
            ${c.usesCount || 0} / ${c.maxUses}
          </div>
          <div style="width:100px; height:4px; background:#e2e8f0; border-radius:2px; margin-top:4px; overflow:hidden;">
            <div style="width:${Math.min(100, ((c.usesCount || 0) / c.maxUses) * 100)}%; height:100%; background:var(--primary);"></div>
          </div>
        </td>
        <td><span style="font-size:12.5px; color:var(--text-muted);">${new Date(c.expiresAt).toLocaleDateString('es-AR')}</span></td>
        <td><span class="badge ${c.status === 'active' ? 'badge-emerald' : 'badge-slate'}">${c.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm btn-icon" data-action="delete" data-id="${c.id}" style="color:var(--danger);">&times;</button>
        </td>
      </tr>
    `).join('');

    this.bindRowActions();
  }

  bindRowActions() {
    const tbody = this.container.querySelector('#coupons-table-body');
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: '¿Eliminar cupón?',
          message: 'El código dejará de funcionar de inmediato en el checkout.',
          isDanger: true
        });
        if (confirmed) {
          await couponRepo.delete(btn.dataset.id);
          toast.show('Cupón eliminado.', 'success');
          this.loadCoupons();
        }
      });
    });
  }

  openCouponModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width:480px;">
        <div class="modal-header">
          <h3 class="modal-title">Nuevo Cupón de Descuento</h3>
          <button class="modal-close" id="coup-close-btn">&times;</button>
        </div>
        <form id="coupon-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Código del Cupón <span class="required">*</span></label>
            <input type="text" id="cp-code" class="form-input" placeholder="Ej: BCVERANO20" style="text-transform:uppercase; font-family:monospace; font-weight:700;" required />
            <span class="form-helper">Los clientes ingresarán este código exacto en el checkout</span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Tipo de Descuento</label>
              <select id="cp-type" class="form-select">
                <option value="percentage">Porcentaje (% OFF)</option>
                <option value="fixed">Monto Fijo ($ ARS)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valor del Beneficio <span class="required">*</span></label>
              <input type="number" id="cp-value" class="form-input" min="1" placeholder="15" required />
            </div>
            <div class="form-group">
              <label class="form-label">Compra Mínima ($ ARS)</label>
              <input type="number" id="cp-min-spend" class="form-input" min="0" value="100000" />
            </div>
            <div class="form-group">
              <label class="form-label">Cantidad Máxima de Usos</label>
              <input type="number" id="cp-max-uses" class="form-input" min="1" value="100" />
            </div>
            <div class="form-group form-group-full">
              <label class="form-label">Fecha de Vencimiento</label>
              <input type="date" id="cp-expires" class="form-input" value="${new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}" required />
            </div>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="coup-cancel-btn">Cancelar</button>
          <button type="submit" form="coupon-form" class="btn btn-primary">Crear Cupón</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('#coup-close-btn').addEventListener('click', close);
    backdrop.querySelector('#coup-cancel-btn').addEventListener('click', close);

    backdrop.querySelector('#coupon-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = backdrop.querySelector('#cp-code').value.trim().toUpperCase();
      const payload = {
        code,
        type: backdrop.querySelector('#cp-type').value,
        value: parseFloat(backdrop.querySelector('#cp-value').value),
        minSpend: parseFloat(backdrop.querySelector('#cp-min-spend').value) || 0,
        maxUses: parseInt(backdrop.querySelector('#cp-max-uses').value, 10) || 100,
        expiresAt: new Date(backdrop.querySelector('#cp-expires').value).toISOString(),
        status: 'active'
      };

      try {
        await couponRepo.create(payload);
        toast.show(`Cupón "${code}" creado con éxito.`, 'success');
        close();
        this.loadCoupons();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }
}
