/**
 * @file CategoriesView.js
 * Hierarchical Category management with tree structure and subcategory parent links.
 */

import { categoryRepo } from '../repositories/factory.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { toast } from '../components/Toast.js';

export class CategoriesView {
  constructor(options = {}) {
    this.container = options.container;
    this.categories = [];
  }

  async init() {
    this.renderLayout();
    await this.loadCategories();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Gestión de Categorías</h1>
          <p>Organización taxonómica del catálogo con jerarquías multinivel</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="cat-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Categoría
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Estructura Jerárquica de Categorías</span>
        </div>
        <div class="card-body" id="cat-tree-container" style="padding:16px;">
          <div style="text-align:center; padding:20px; color:var(--text-muted);">Cargando categorías...</div>
        </div>
      </div>
    `;

    this.container.querySelector('#cat-new-btn').addEventListener('click', () => this.openCategoryModal());
  }

  async loadCategories() {
    try {
      this.categories = await categoryRepo.getAll();
      this.renderTree();
    } catch (err) {
      toast.show('Error al cargar categorías: ' + err.message, 'danger');
    }
  }

  renderTree() {
    const container = this.container.querySelector('#cat-tree-container');
    if (this.categories.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No hay categorías registradas.</div>`;
      return;
    }

    const parents = this.categories.filter(c => !c.parentId);

    const html = parents.map(parent => `
      <div style="border:1px solid #e2e8f0; border-radius:8px; margin-bottom:12px; overflow:hidden; background:white;">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#f8fafc; border-bottom:1px solid #e2e8f0;">
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${parent.image || '/images/cat_electrodomesticos.jpg'}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;" />
            <div>
              <strong style="color:var(--text-main); font-size:14px;">${parent.name}</strong>
              <div style="font-size:11.5px; color:var(--text-muted); font-family:monospace;">Slug: /${parent.slug || parent.id}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="btn btn-secondary btn-sm" data-action="add-sub" data-id="${parent.id}">+ Subcategoría</button>
            <button class="btn btn-secondary btn-sm btn-icon" data-action="edit" data-id="${parent.id}">✎</button>
            <button class="btn btn-secondary btn-sm btn-icon" data-action="delete" data-id="${parent.id}" style="color:var(--danger);">&times;</button>
          </div>
        </div>

        <div style="padding:10px 16px 10px 48px;">
          ${(parent.subcategories || []).length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${parent.subcategories.map(sub => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 12px; background:#f1f5f9; border-radius:6px; font-size:13px;">
                  <span style="font-weight:500;">↳ ${sub.name}</span>
                  <span style="font-size:11px; color:var(--text-muted); font-family:monospace;">/${sub.slug}</span>
                </div>
              `).join('')}
            </div>
          ` : `<span style="font-size:12.5px; color:var(--text-muted); font-style:italic;">Sin subcategorías vinculadas</span>`}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
    this.bindTreeActions();
  }

  bindTreeActions() {
    const container = this.container.querySelector('#cat-tree-container');

    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = this.categories.find(c => c.id === btn.dataset.id);
        if (cat) this.openCategoryModal(cat);
      });
    });

    container.querySelectorAll('[data-action="add-sub"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openCategoryModal(null, btn.dataset.id);
      });
    });

    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: '¿Eliminar categoría?',
          message: 'Esta acción desvinculará los productos asociados.',
          isDanger: true
        });
        if (confirmed) {
          await categoryRepo.delete(btn.dataset.id);
          toast.show('Categoría eliminada.', 'success');
          this.loadCategories();
        }
      });
    });
  }

  openCategoryModal(category = null, defaultParentId = null) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const isEdit = Boolean(category);
    const parentId = category?.parentId || defaultParentId || '';

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width:480px;">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <button class="modal-close" id="cat-close-btn">&times;</button>
        </div>
        <form id="cat-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre <span class="required">*</span></label>
            <input type="text" id="cm-name" class="form-input" value="${category?.name || ''}" placeholder="Ej: Climatización y Calefacción" required />
          </div>
          <div class="form-group">
            <label class="form-label">Slug</label>
            <input type="text" id="cm-slug" class="form-input" value="${category?.slug || ''}" placeholder="climatizacion" />
          </div>
          <div class="form-group">
            <label class="form-label">Categoría Padre (Jerarquía)</label>
            <select id="cm-parent" class="form-select">
              <option value="">-- Ninguna (Categoría Principal Raíz) --</option>
              ${this.categories.filter(c => !c.parentId && c.id !== category?.id).map(c => `
                <option value="${c.id}" ${parentId === c.id ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">URL de Imagen</label>
            <input type="text" id="cm-image" class="form-input" value="${category?.image || '/images/cat_electrodomesticos.jpg'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="cm-desc" class="form-textarea" rows="2">${category?.description || ''}</textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cm-cancel-btn">Cancelar</button>
          <button type="submit" form="cat-form" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Categoría'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('#cat-close-btn').addEventListener('click', close);
    backdrop.querySelector('#cm-cancel-btn').addEventListener('click', close);

    backdrop.querySelector('#cat-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = backdrop.querySelector('#cm-name').value.trim();
      const slug = backdrop.querySelector('#cm-slug').value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const pId = backdrop.querySelector('#cm-parent').value || null;

      const payload = {
        name,
        slug,
        parentId: pId,
        image: backdrop.querySelector('#cm-image').value.trim(),
        description: backdrop.querySelector('#cm-desc').value.trim(),
        status: 'active'
      };

      try {
        if (isEdit) {
          await categoryRepo.update(category.id, payload);
          toast.show('Categoría actualizada.', 'success');
        } else {
          await categoryRepo.create(payload);
          toast.show('Categoría creada exitosamente.', 'success');
        }
        close();
        this.loadCategories();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }
}
