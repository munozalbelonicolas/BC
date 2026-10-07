/**
 * @file BrandsView.js
 * Brands (Marcas) CRUD management view.
 */

import { brandRepo } from '../repositories/factory.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { toast } from '../components/Toast.js';

export class BrandsView {
  constructor(options = {}) {
    this.container = options.container;
    this.brands = [];
  }

  async init() {
    this.renderLayout();
    await this.loadBrands();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Marcas Oficiales</h1>
          <p>Administrá los fabricantes y marcas internacionales del catálogo</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="brand-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Marca
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Slug</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="brands-table-body">
              <tr><td colspan="5" style="text-align:center; padding:30px;">Cargando marcas...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.querySelector('#brand-new-btn').addEventListener('click', () => this.openBrandModal());
  }

  async loadBrands() {
    try {
      this.brands = await brandRepo.getAll();
      this.renderTable();
    } catch (err) {
      toast.show('Error al cargar marcas: ' + err.message, 'danger');
    }
  }

  renderTable() {
    const tbody = this.container.querySelector('#brands-table-body');
    if (this.brands.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No hay marcas registradas.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.brands.map(b => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${b.logo || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=80&q=80'}" style="width:36px; height:36px; border-radius:6px; object-fit:cover; border:1px solid #e2e8f0;" />
            <strong style="color:var(--text-main);">${b.name}</strong>
          </div>
        </td>
        <td><code style="font-size:12px; color:var(--text-muted);">${b.slug}</code></td>
        <td style="color:var(--text-muted); font-size:13px; max-width:260px;">${b.description || 'Sin descripción'}</td>
        <td><span class="badge ${b.status === 'active' ? 'badge-emerald' : 'badge-slate'}">${b.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm btn-icon" data-action="edit" data-id="${b.id}">✎</button>
          <button class="btn btn-secondary btn-sm btn-icon" data-action="delete" data-id="${b.id}" style="color:var(--danger);">&times;</button>
        </td>
      </tr>
    `).join('');

    this.bindActions();
  }

  bindActions() {
    const tbody = this.container.querySelector('#brands-table-body');
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const brand = this.brands.find(b => b.id === btn.dataset.id);
        if (brand) this.openBrandModal(brand);
      });
    });

    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: '¿Eliminar marca?',
          message: 'Esta acción no se puede deshacer.',
          isDanger: true
        });
        if (confirmed) {
          await brandRepo.delete(btn.dataset.id);
          toast.show('Marca eliminada.', 'success');
          this.loadBrands();
        }
      });
    });
  }

  openBrandModal(brand = null) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    const isEdit = Boolean(brand);

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width:460px;">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Editar Marca' : 'Nueva Marca'}</h3>
          <button class="modal-close" id="bm-close-btn">&times;</button>
        </div>
        <form id="brand-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre de Marca <span class="required">*</span></label>
            <input type="text" id="bm-name" class="form-input" value="${brand?.name || ''}" placeholder="Ej: Sony" required />
          </div>
          <div class="form-group">
            <label class="form-label">Slug</label>
            <input type="text" id="bm-slug" class="form-input" value="${brand?.slug || ''}" placeholder="sony" />
          </div>
          <div class="form-group">
            <label class="form-label">URL del Logo</label>
            <input type="text" id="bm-logo" class="form-input" value="${brand?.logo || ''}" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="bm-desc" class="form-textarea" rows="2">${brand?.description || ''}</textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="bm-cancel-btn">Cancelar</button>
          <button type="submit" form="brand-form" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Marca'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('#bm-close-btn').addEventListener('click', close);
    backdrop.querySelector('#bm-cancel-btn').addEventListener('click', close);

    backdrop.querySelector('#brand-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = backdrop.querySelector('#bm-name').value.trim();
      const slug = backdrop.querySelector('#bm-slug').value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = {
        name,
        slug,
        logo: backdrop.querySelector('#bm-logo').value.trim(),
        description: backdrop.querySelector('#bm-desc').value.trim(),
        status: 'active'
      };

      try {
        if (isEdit) {
          await brandRepo.update(brand.id, payload);
          toast.show('Marca actualizada.', 'success');
        } else {
          await brandRepo.create(payload);
          toast.show('Marca creada exitosamente.', 'success');
        }
        close();
        this.loadBrands();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }
}
