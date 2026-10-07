/**
 * @file ProductImportModal.js
 * Multi-step CSV Product Import Wizard with preview, column mapping, validation engine, and error reporting.
 */

import { ExportImportService } from '../services/exportImportService.js';
import { toast } from '../components/Toast.js';

export class ProductImportModal {
  constructor(options = {}) {
    this.onSuccess = options.onSuccess || (() => {});
    this.step = 1; // 1: Upload, 2: Mapping & Preview, 3: Validation & Confirm
    this.parsedData = null; // { headers: [], rows: [] }
    this.columnMap = {
      name: '',
      sku: '',
      brand: '',
      category: '',
      price: '',
      cost: '',
      stock: '',
      image: '',
      description: ''
    };
    this.validationResult = null;
    this.backdrop = null;
  }

  open() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    document.body.appendChild(this.backdrop);
    this.render();
  }

  render() {
    let bodyContent = '';

    if (this.step === 1) {
      bodyContent = `
        <div style="text-align:center; padding: 20px;">
          <div class="image-upload-zone" id="csv-dropzone" style="padding: 40px 20px;">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" style="margin: 0 auto 12px;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <h3 style="font-size:16px; font-weight:700; color:var(--text-main);">Subir archivo CSV de productos</h3>
            <p style="font-size:13px; color:var(--text-muted); margin-top:6px;">Seleccioná un archivo .csv exportado de tu sistema anterior o Excel</p>
            <input type="file" id="csv-file-input" accept=".csv,text/csv" style="display:none;" />
            <button type="button" class="btn btn-secondary btn-sm" style="margin-top:16px;">Seleccionar Archivo</button>
          </div>
          <div style="margin-top:16px; font-size:12.5px; color:var(--text-muted); background:#f8fafc; padding:12px; border-radius:8px; text-align:left;">
            <strong>Nota:</strong> El importador leerá los encabezados y te permitirá mapear cada columna antes de validar e ingresar cualquier registro.
          </div>
        </div>
      `;
    } else if (this.step === 2) {
      const { headers, rows } = this.parsedData;
      const previewRows = rows.slice(0, 3);

      const makeSelect = (fieldKey, label, required = false) => `
        <div class="form-group">
          <label class="form-label">${label} ${required ? '<span class="required">*</span>' : ''}</label>
          <select class="form-select column-map-select" data-field="${fieldKey}">
            <option value="">-- No mapear --</option>
            ${headers.map(h => `
              <option value="${h}" ${h.toLowerCase().includes(fieldKey) || (fieldKey === 'name' && h.toLowerCase().includes('nombre')) || (fieldKey === 'price' && h.toLowerCase().includes('precio')) ? 'selected' : ''}>${h}</option>
            `).join('')}
          </select>
        </div>
      `;

      bodyContent = `
        <div style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Se detectaron <strong>${rows.length}</strong> filas y <strong>${headers.length}</strong> columnas. Mapeá los campos correspondientes:
        </div>

        <div class="form-grid" style="margin-bottom:20px;">
          ${makeSelect('name', 'Nombre del Producto', true)}
          ${makeSelect('sku', 'Código SKU', true)}
          ${makeSelect('price', 'Precio de Venta', true)}
          ${makeSelect('stock', 'Stock Inicial', true)}
          ${makeSelect('brand', 'Marca')}
          ${makeSelect('category', 'Categoría')}
          ${makeSelect('cost', 'Costo')}
          ${makeSelect('image', 'URL de Imagen')}
        </div>

        <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">
          Vista Previa de Datos Crudos (Primeras 3 filas):
        </div>
        <div style="overflow-x:auto; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:16px;">
          <table class="data-table" style="font-size:12px;">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${previewRows.map(r => `
                <tr>${headers.map(h => `<td>${r[h] || ''}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.step === 3) {
      const { isValid, totalRows, validRows, errors } = this.validationResult;

      bodyContent = `
        <div style="margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
            <div style="flex:1; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:12px; text-align:center;">
              <div style="font-size:20px; font-weight:700; color:#065f46;">${validRows.length}</div>
              <div style="font-size:12px; color:#047857; font-weight:600;">Filas Válidas Listas</div>
            </div>
            <div style="flex:1; background:${errors.length > 0 ? '#fef2f2' : '#f8fafc'}; border:1px solid ${errors.length > 0 ? '#fecaca' : '#e2e8f0'}; border-radius:8px; padding:12px; text-align:center;">
              <div style="font-size:20px; font-weight:700; color:${errors.length > 0 ? '#dc2626' : '#64748b'};">${errors.length}</div>
              <div style="font-size:12px; color:${errors.length > 0 ? '#b91c1c' : '#64748b'}; font-weight:600;">Filas con Errores</div>
            </div>
          </div>

          ${errors.length > 0 ? `
            <div style="font-size:13px; font-weight:700; color:#dc2626; margin-bottom:8px;">Detalle de Errores Encontrados:</div>
            <div style="max-height:200px; overflow-y:auto; border:1px solid #fee2e2; background:#fff5f5; border-radius:8px; padding:12px; font-size:12.5px;">
              ${errors.map(err => `
                <div style="margin-bottom:6px; border-bottom:1px solid #fee2e2; padding-bottom:4px;">
                  <strong>Fila ${err.row} (SKU: ${err.sku}):</strong> ${err.errors.join(', ')}
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="background:#ecfdf5; border:1px solid #6ee7b7; padding:14px; border-radius:8px; color:#065f46; font-size:13.5px; display:flex; align-items:center; gap:10px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>¡Validación exitosa! Todos los registros cumplen con las reglas del sistema.</span>
            </div>
          `}
        </div>
      `;
    }

    this.backdrop.innerHTML = `
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Asistente de Importación de Productos</h2>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
              Paso ${this.step} de 3: ${this.step === 1 ? 'Carga de Archivo' : this.step === 2 ? 'Mapeo de Columnas y Preview' : 'Validación y Confirmación'}
            </div>
          </div>
          <button class="modal-close" id="imp-close-btn">&times;</button>
        </div>

        <div class="modal-body">
          ${bodyContent}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="imp-cancel-btn">${this.step === 1 ? 'Cancelar' : 'Atrás'}</button>
          ${this.step === 2 ? `
            <button type="button" class="btn btn-primary" id="imp-validate-btn">Validar Datos →</button>
          ` : ''}
          ${this.step === 3 ? `
            <button type="button" class="btn btn-primary" id="imp-confirm-btn" ${!this.validationResult?.validRows?.length ? 'disabled' : ''}>
              Confirmar Importación (${this.validationResult?.validRows?.length || 0} productos)
            </button>
          ` : ''}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.backdrop.querySelector('#imp-close-btn');
    const cancelBtn = this.backdrop.querySelector('#imp-cancel-btn');

    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => {
      if (this.step > 1) {
        this.step--;
        this.render();
      } else {
        this.close();
      }
    });

    if (this.step === 1) {
      const dropzone = this.backdrop.querySelector('#csv-dropzone');
      const fileInput = this.backdrop.querySelector('#csv-file-input');

      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          this.parsedData = await ExportImportService.parseCSV(file);
          this.step = 2;
          this.render();
        } catch (err) {
          toast.show(`Error al procesar archivo: ${err.message}`, 'danger');
        }
      });
    }

    if (this.step === 2) {
      const validateBtn = this.backdrop.querySelector('#imp-validate-btn');
      validateBtn.addEventListener('click', () => {
        // Collect mapping
        this.backdrop.querySelectorAll('.column-map-select').forEach(sel => {
          this.columnMap[sel.dataset.field] = sel.value;
        });

        if (!this.columnMap.name || !this.columnMap.sku || !this.columnMap.price || !this.columnMap.stock) {
          toast.show('Debes mapear los campos requeridos: Nombre, SKU, Precio y Stock.', 'warning');
          return;
        }

        this.validationResult = ExportImportService.validateProductImport(this.parsedData.rows, this.columnMap);
        this.step = 3;
        this.render();
      });
    }

    if (this.step === 3) {
      const confirmBtn = this.backdrop.querySelector('#imp-confirm-btn');
      confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Importando registros...';

        try {
          const res = await ExportImportService.commitProductImport(this.validationResult.validRows);
          toast.show(`¡Éxito! Se importaron ${res.importedCount} productos correctamente.`, 'success');
          this.close();
          this.onSuccess();
        } catch (err) {
          toast.show(`Error durante la importación: ${err.message}`, 'danger');
          confirmBtn.disabled = false;
        }
      });
    }
  }

  close() {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
    }
  }
}
