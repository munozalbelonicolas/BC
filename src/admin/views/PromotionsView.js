/**
 * @file PromotionsView.js
 * Marketing Promotions engine supporting percentage, fixed discount, 2x1, bulk, category, and product discounts.
 */

import { promotionRepo } from '../repositories/factory.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { toast } from '../components/Toast.js';

export class PromotionsView {
  constructor(options = {}) {
    this.container = options.container;
    this.promotions = [];
  }

  async init() {
    this.renderLayout();
    await this.loadPromotions();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Promociones & Campañas</h1>
          <p>Configuración de reglas de descuento dinámicas (2x1, combos, descuentos por volumen y categoría)</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="promo-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Promoción
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Tipo de Regla</th>
                <th>Beneficio</th>
                <th>Condiciones</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="promos-table-body">
              <tr><td colspan="7" style="text-align:center; padding:30px;">Cargando promociones...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.querySelector('#promo-new-btn').addEventListener('click', () => this.openPromoModal());
  }

  async loadPromotions() {
    try {
      this.promotions = await promotionRepo.getAll();
      this.renderTable();
    } catch (err) {
      toast.show('Error al cargar promociones: ' + err.message, 'danger');
    }
  }

  renderTable() {
    const tbody = this.container.querySelector('#promos-table-body');
    if (this.promotions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No hay promociones activas registradas.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.promotions.map(p => {
      const typeLabel = {
        percentage: 'Porcentaje %',
        fixed: 'Monto Fijo $',
        buy_x_get_y: '2x1 / Combo',
        bulk: 'Volumen',
        category: 'Categoría'
      }[p.type] || p.type;

      return `
        <tr>
          <td>
            <strong style="color:var(--text-main); font-size:14px;">${p.name}</strong>
            <div style="font-size:12px; color:var(--text-muted); max-width:280px;">${p.description || ''}</div>
          </td>
          <td><span class="badge badge-purple">${typeLabel}</span></td>
          <td>
            <strong style="color:#065f46; font-size:14px;">
              ${p.type === 'percentage' ? `${p.discountValue}% OFF` : `$${Number(p.discountValue).toLocaleString('es-AR')} OFF`}
            </strong>
          </td>
          <td style="font-size:12.5px; color:var(--text-muted);">
            Min: $${Number(p.minSpend || 0).toLocaleString('es-AR')} (min ${p.minQuantity || 1} u.)
          </td>
          <td style="font-size:12px; color:var(--text-muted);">
            Hasta ${new Date(p.endDate).toLocaleDateString('es-AR')}
          </td>
          <td>
            <span class="badge ${p.isActive ? 'badge-emerald' : 'badge-slate'}">
              ${p.isActive ? 'Activa' : 'Inactiva'}
            </span>
          </td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm btn-icon" data-action="delete" data-id="${p.id}" style="color:var(--danger);">&times;</button>
          </td>
        </tr>
      `;
    }).join('');

    this.bindRowActions();
  }

  bindRowActions() {
    const tbody = this.container.querySelector('#promos-table-body');
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: '¿Eliminar promoción?',
          message: 'Esta regla dejará de aplicarse automáticamente al carrito.',
          isDanger: true
        });
        if (confirmed) {
          await promotionRepo.delete(btn.dataset.id);
          toast.show('Promoción eliminada.', 'success');
          this.loadPromotions();
        }
      });
    });
  }

  openPromoModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width:540px;">
        <div class="modal-header">
          <h3 class="modal-title">Nueva Regla de Promoción</h3>
          <button class="modal-close" id="pm-close-btn">&times;</button>
        </div>
        <form id="promo-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre de la Campaña <span class="required">*</span></label>
            <input type="text" id="pm-name" class="form-input" placeholder="Ej: Hot Sale Línea Blanca" required />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción Informativa</label>
            <input type="text" id="pm-desc" class="form-input" placeholder="15% OFF en heladeras y lavarropas" />
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Tipo de Descuento</label>
              <select id="pm-type" class="form-select">
                <option value="percentage">Porcentaje (% OFF)</option>
                <option value="fixed">Monto Fijo ($ ARS)</option>
                <option value="buy_x_get_y">2x1 / Segunda unidad</option>
                <option value="bulk">Descuento por Cantidad</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valor del Descuento (% o $) <span class="required">*</span></label>
              <input type="number" id="pm-value" class="form-input" min="1" placeholder="15" required />
            </div>
            <div class="form-group">
              <label class="form-label">Compra Mínima ($ ARS)</label>
              <input type="number" id="pm-min-spend" class="form-input" min="0" value="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Cantidad Mínima de Unidades</label>
              <input type="number" id="pm-min-qty" class="form-input" min="1" value="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Inicio</label>
              <input type="date" id="pm-start" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Finalización</label>
              <input type="date" id="pm-end" class="form-input" value="${new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}" />
            </div>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="pm-cancel-btn">Cancelar</button>
          <button type="submit" form="promo-form" class="btn btn-primary">Crear Promoción</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('#pm-close-btn').addEventListener('click', close);
    backdrop.querySelector('#pm-cancel-btn').addEventListener('click', close);

    backdrop.querySelector('#promo-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: backdrop.querySelector('#pm-name').value.trim(),
        description: backdrop.querySelector('#pm-desc').value.trim(),
        type: backdrop.querySelector('#pm-type').value,
        discountValue: parseFloat(backdrop.querySelector('#pm-value').value),
        minSpend: parseFloat(backdrop.querySelector('#pm-min-spend').value) || 0,
        minQuantity: parseInt(backdrop.querySelector('#pm-min-qty').value, 10) || 1,
        startDate: new Date(backdrop.querySelector('#pm-start').value).toISOString(),
        endDate: new Date(backdrop.querySelector('#pm-end').value).toISOString(),
        isActive: true
      };

      try {
        await promotionRepo.create(payload);
        toast.show('Promoción creada exitosamente.', 'success');
        close();
        this.loadPromotions();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }
}
