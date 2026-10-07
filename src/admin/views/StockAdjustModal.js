/**
 * @file StockAdjustModal.js
 * Stock Adjustment Modal enforcing mandatory reason, operator attribution, and movement preview.
 */

import { InventoryService } from '../services/inventoryService.js';
import { toast } from '../components/Toast.js';

export class StockAdjustModal {
  constructor(options = {}) {
    this.item = options.item; // { productId, productName, sku, availableStock, variantSku }
    this.onSuccess = options.onSuccess || (() => {});
    this.backdrop = null;
  }

  open() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';

    const item = this.item;
    const currentStock = item.availableStock;

    this.backdrop.innerHTML = `
      <div class="modal-content" style="max-width:480px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Ajuste de Stock Físico</h3>
            <div style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">
              ${item.productName} (SKU: ${item.sku})
            </div>
          </div>
          <button class="modal-close" id="sa-close-btn">&times;</button>
        </div>

        <form id="stock-adjust-form" class="modal-body">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; color:var(--text-muted);">Stock actual disponible:</span>
            <strong style="font-size:16px; color:var(--text-main);">${currentStock} unidades</strong>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo de Movimiento <span class="required">*</span></label>
            <select id="sa-type" class="form-select" required>
              <option value="ingreso">Ingreso (+ Mercadería recibida / Importación)</option>
              <option value="egreso">Egreso (- Rotura / Muestra / Merma)</option>
              <option value="ajuste">Corrección de Inventario (Fijar conteo exacto)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Cantidad <span class="required">*</span></label>
            <input type="number" id="sa-qty" class="form-input" min="1" value="1" required />
            <span class="form-helper" id="sa-qty-help">Cantidad a sumar al inventario</span>
          </div>

          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; color:#1e40af; font-weight:500;">Stock resultante previsto:</span>
            <strong id="sa-preview-stock" style="font-size:18px; color:#1d4ed8;">${currentStock + 1} unidades</strong>
          </div>

          <div class="form-group">
            <label class="form-label">Motivo Obligatorio del Movimiento <span class="required">*</span></label>
            <textarea id="sa-reason" class="form-textarea" rows="3" placeholder="Ej: Recepción de embarque contenedor #AF-9921 de Aduana" required></textarea>
            <span class="form-helper">Se registrará en el historial de auditoría con tu usuario y fecha. Nunca se modifica stock de forma silenciosa.</span>
          </div>
        </form>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="sa-cancel-btn">Cancelar</button>
          <button type="submit" form="stock-adjust-form" class="btn btn-primary" id="sa-submit-btn">
            Confirmar Movimiento
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    this.bindEvents();
  }

  bindEvents() {
    const close = () => this.backdrop.remove();
    this.backdrop.querySelector('#sa-close-btn').addEventListener('click', close);
    this.backdrop.querySelector('#sa-cancel-btn').addEventListener('click', close);

    const typeSelect = this.backdrop.querySelector('#sa-type');
    const qtyInput = this.backdrop.querySelector('#sa-qty');
    const qtyHelp = this.backdrop.querySelector('#sa-qty-help');
    const previewStockEl = this.backdrop.querySelector('#sa-preview-stock');
    const reasonInput = this.backdrop.querySelector('#sa-reason');
    const currentStock = this.item.availableStock;

    const updatePreview = () => {
      const type = typeSelect.value;
      const qty = parseInt(qtyInput.value, 10) || 0;
      let resulting = currentStock;

      if (type === 'ingreso') {
        resulting = currentStock + qty;
        qtyHelp.textContent = 'Cantidad de unidades que ingresan al depósito';
      } else if (type === 'egreso') {
        resulting = Math.max(0, currentStock - qty);
        qtyHelp.textContent = 'Cantidad de unidades que se retiran del stock';
      } else if (type === 'ajuste') {
        resulting = Math.max(0, qty);
        qtyHelp.textContent = 'Nuevo stock real contado físicamente';
      }

      previewStockEl.textContent = `${resulting} unidades`;
    };

    typeSelect.addEventListener('change', updatePreview);
    qtyInput.addEventListener('input', updatePreview);

    this.backdrop.querySelector('#stock-adjust-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = typeSelect.value;
      const qty = parseInt(qtyInput.value, 10);
      const reason = reasonInput.value.trim();

      if (!reason || reason.length < 6) {
        toast.show('El motivo es obligatorio y debe tener al menos 6 caracteres descriptivos.', 'warning');
        return;
      }

      try {
        await InventoryService.recordStockAdjustment({
          productId: this.item.productId,
          quantity: qty,
          type,
          reason,
          variantSku: this.item.variantSku
        });

        toast.show('Movimiento de stock registrado correctamente en el historial.', 'success');
        close();
        this.onSuccess();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }
}
