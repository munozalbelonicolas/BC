/**
 * @file ProductFormModal.js
 * Comprehensive Product Create/Edit modal with real-time margin calculation,
 * variants manager, image dropzone, and field validations.
 */

import { ProductService } from '../services/productService.js';
import { StorageService } from '../core/storage.js';
import { calculateProfitMargin, ProductStatus } from '../types/entities.js';
import { toast } from '../components/Toast.js';

export class ProductFormModal {
  constructor(options = {}) {
    this.product = options.product || null;
    this.categories = options.categories || [];
    this.brands = options.brands || [];
    this.onSave = options.onSave || (() => {});
    this.images = this.product?.images ? [...this.product.images] : (this.product?.image ? [this.product.image] : []);
    this.variants = this.product?.variants ? JSON.parse(JSON.stringify(this.product.variants)) : [
      { id: 'v1', name: 'Estándar', sku: this.product?.sku || '', price: this.product?.price || '', stock: this.product?.stock ?? 10 }
    ];
    this.backdrop = null;
  }

  open() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';

    const isEdit = Boolean(this.product);
    const p = this.product || {
      name: '',
      sku: '',
      slug: '',
      brand: 'SAMSUNG',
      category: 'electrodomesticos',
      subcategory: '',
      shortDescription: '',
      description: '',
      price: '',
      originalPrice: '',
      cost: '',
      stock: 10,
      minStock: 2,
      allowBackorder: false,
      status: ProductStatus.ACTIVE,
      tags: []
    };

    const initialMargin = calculateProfitMargin(Number(p.price) || 0, Number(p.cost) || 0);

    this.backdrop.innerHTML = `
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h2 class="modal-title">${isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
          <button class="modal-close" id="pf-close-btn">&times;</button>
        </div>

        <form id="product-form" class="modal-body" style="padding-bottom:10px;">
          <!-- Section 1: General Info -->
          <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px; letter-spacing:0.05em;">
            1. Información General
          </div>

          <div class="form-grid">
            <div class="form-group form-group-full">
              <label class="form-label">Nombre del Producto <span class="required">*</span></label>
              <input type="text" id="pf-name" class="form-input" value="${p.name || ''}" placeholder="Ej: Smart TV Samsung 55 Crystal 4K" required />
            </div>

            <div class="form-group">
              <label class="form-label">Código SKU <span class="required">*</span></label>
              <input type="text" id="pf-sku" class="form-input" value="${p.sku || ''}" placeholder="Ej: BC-SAM-55CU70" required />
              <span class="form-helper">Identificador único de inventario</span>
            </div>

            <div class="form-group">
              <label class="form-label">Slug URL</label>
              <input type="text" id="pf-slug" class="form-input" value="${p.slug || ''}" placeholder="Autogenerado desde el nombre" />
            </div>

            <div class="form-group">
              <label class="form-label">Marca</label>
              <select id="pf-brand" class="form-select">
                ${this.brands.map(b => `
                  <option value="${b.name}" ${p.brand?.toLowerCase() === b.name.toLowerCase() ? 'selected' : ''}>${b.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Categoría Principal <span class="required">*</span></label>
              <select id="pf-category" class="form-select">
                ${this.categories.map(c => `
                  <option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group form-group-full">
              <label class="form-label">Descripción Corta / Resumen de Especificaciones</label>
              <input type="text" id="pf-short-desc" class="form-input" value="${p.shortDescription || ''}" placeholder="Ej: 55 pulgadas | 4K Crystal UHD | Tizen Smart Hub" />
            </div>

            <div class="form-group form-group-full">
              <label class="form-label">Descripción Completa</label>
              <textarea id="pf-desc" class="form-textarea" rows="3" placeholder="Detalles técnicos, garantía, especificaciones completas...">${p.description || ''}</textarea>
            </div>
          </div>

          <!-- Section 2: Pricing & Profit Margin -->
          <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin:20px 0 12px; letter-spacing:0.05em;">
            2. Precios y Margen de Rentabilidad
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Precio de Venta ($ ARS) <span class="required">*</span></label>
              <input type="number" id="pf-price" class="form-input" value="${p.price || ''}" min="1" step="100" placeholder="1129000" required />
            </div>

            <div class="form-group">
              <label class="form-label">Precio Anterior / Tachado ($ ARS)</label>
              <input type="number" id="pf-original-price" class="form-input" value="${p.originalPrice || ''}" min="0" step="100" placeholder="1299000" />
            </div>

            <div class="form-group">
              <label class="form-label">Costo de Adquisición / Importación ($ ARS)</label>
              <input type="number" id="pf-cost" class="form-input" value="${p.cost || ''}" min="0" step="100" placeholder="750000" />
            </div>

            <div class="form-group">
              <label class="form-label">Margen Estimado de Ganancia</label>
              <div id="pf-margin-badge" style="padding:9px 12px; border-radius:var(--radius-md); font-weight:700; background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; font-size:14px;">
                ${initialMargin}% de ganancia
              </div>
            </div>
          </div>

          <!-- Section 3: Inventory & State -->
          <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin:20px 0 12px; letter-spacing:0.05em;">
            3. Inventario y Estado
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Stock Actual <span class="required">*</span></label>
              <input type="number" id="pf-stock" class="form-input" value="${p.stock ?? 10}" min="0" required />
            </div>

            <div class="form-group">
              <label class="form-label">Stock Mínimo de Alerta</label>
              <input type="number" id="pf-min-stock" class="form-input" value="${p.minStock ?? 2}" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label">Estado de Publicación</label>
              <select id="pf-status" class="form-select">
                <option value="${ProductStatus.ACTIVE}" ${p.status === ProductStatus.ACTIVE ? 'selected' : ''}>Activo (En catálogo)</option>
                <option value="${ProductStatus.DRAFT}" ${p.status === ProductStatus.DRAFT ? 'selected' : ''}>Borrador</option>
                <option value="${ProductStatus.INACTIVE}" ${p.status === ProductStatus.INACTIVE ? 'selected' : ''}>Inactivo</option>
                <option value="${ProductStatus.ARCHIVED}" ${p.status === ProductStatus.ARCHIVED ? 'selected' : ''}>Archivado</option>
              </select>
            </div>

            <div class="form-group" style="justify-content:center;">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13.5px; margin-top:20px;">
                <input type="checkbox" id="pf-allow-backorder" ${p.allowBackorder ? 'checked' : ''} />
                <span>Permitir venta sin stock disponible (Backorder)</span>
              </label>
            </div>
          </div>

          <!-- Section 4: Images Manager -->
          <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin:20px 0 12px; letter-spacing:0.05em;">
            4. Galería de Imágenes (Multi-Upload)
          </div>

          <div class="image-upload-zone" id="pf-dropzone">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" style="margin:0 auto 8px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div style="font-size:13.5px; font-weight:600; color:var(--text-main);">Arrastrá imágenes aquí o hacé clic para subir</div>
            <div style="font-size:12px; color:var(--text-muted);">Formatos PNG, JPG, WebP. La primera imagen será la portada.</div>
            <input type="file" id="pf-file-input" multiple accept="image/*" style="display:none;" />
          </div>

          <div class="image-thumbnails-grid" id="pf-thumbs-container"></div>
        </form>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="pf-cancel-btn">Cancelar</button>
          <button type="submit" form="product-form" class="btn btn-primary" id="pf-submit-btn">
            ${isEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    this.renderThumbnails();
    this.bindEvents();
  }

  renderThumbnails() {
    const container = this.backdrop.querySelector('#pf-thumbs-container');
    if (!container) return;

    if (this.images.length === 0) {
      container.innerHTML = `<span style="font-size:12px; color:var(--text-muted); font-style:italic;">No hay imágenes cargadas aún.</span>`;
      return;
    }

    container.innerHTML = this.images.map((img, idx) => `
      <div class="image-thumbnail-item" style="position:relative;">
        <img src="${img}" alt="Thumb" />
        ${idx === 0 ? `<span style="position:absolute; bottom:2px; left:2px; background:rgba(37,99,235,0.9); color:white; font-size:9px; padding:1px 4px; border-radius:3px; font-weight:700;">PORTADA</span>` : ''}
        <button type="button" class="btn-remove-thumb" data-thumb-idx="${idx}">&times;</button>
      </div>
    `).join('');

    container.querySelectorAll('.btn-remove-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.thumbIdx, 10);
        this.images.splice(idx, 1);
        this.renderThumbnails();
      });
    });
  }

  bindEvents() {
    const form = this.backdrop.querySelector('#product-form');
    const closeBtn = this.backdrop.querySelector('#pf-close-btn');
    const cancelBtn = this.backdrop.querySelector('#pf-cancel-btn');
    const dropzone = this.backdrop.querySelector('#pf-dropzone');
    const fileInput = this.backdrop.querySelector('#pf-file-input');
    const priceInput = this.backdrop.querySelector('#pf-price');
    const costInput = this.backdrop.querySelector('#pf-cost');
    const marginBadge = this.backdrop.querySelector('#pf-margin-badge');

    // Close actions
    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Real-time Margin Calculation
    const updateMargin = () => {
      const price = parseFloat(priceInput.value) || 0;
      const cost = parseFloat(costInput.value) || 0;
      const margin = calculateProfitMargin(price, cost);
      marginBadge.textContent = `${margin}% de ganancia estimada`;
      marginBadge.style.background = margin >= 25 ? '#ecfdf5' : (margin >= 10 ? '#fffbeb' : '#fef2f2');
      marginBadge.style.color = margin >= 25 ? '#065f46' : (margin >= 10 ? '#92400e' : '#991b1b');
    };

    priceInput.addEventListener('input', updateMargin);
    costInput.addEventListener('input', updateMargin);

    // Image Upload triggers
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        try {
          const res = await StorageService.uploadImage(file, 'products');
          this.images.push(res.url);
        } catch (err) {
          toast.show(`Error al cargar imagen: ${err.message}`, 'danger');
        }
      }
      this.renderThumbnails();
    });

    // Form Submission with Strict Validations
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = this.backdrop.querySelector('#pf-name').value.trim();
      const sku = this.backdrop.querySelector('#pf-sku').value.trim();
      const price = parseFloat(priceInput.value);
      const cost = parseFloat(costInput.value) || 0;

      if (!name) {
        toast.show('El nombre del producto es obligatorio.', 'warning');
        return;
      }
      if (!sku) {
        toast.show('El código SKU es obligatorio.', 'warning');
        return;
      }
      if (isNaN(price) || price <= 0) {
        toast.show('El precio de venta debe ser un número mayor a 0.', 'warning');
        return;
      }

      const payload = {
        name,
        sku,
        slug: this.backdrop.querySelector('#pf-slug').value.trim() || undefined,
        brand: this.backdrop.querySelector('#pf-brand').value,
        category: this.backdrop.querySelector('#pf-category').value,
        shortDescription: this.backdrop.querySelector('#pf-short-desc').value.trim(),
        description: this.backdrop.querySelector('#pf-desc').value.trim(),
        price,
        originalPrice: parseFloat(this.backdrop.querySelector('#pf-original-price').value) || null,
        cost,
        stock: parseInt(this.backdrop.querySelector('#pf-stock').value, 10) || 0,
        minStock: parseInt(this.backdrop.querySelector('#pf-min-stock').value, 10) || 2,
        status: this.backdrop.querySelector('#pf-status').value,
        allowBackorder: this.backdrop.querySelector('#pf-allow-backorder').checked,
        images: this.images.length > 0 ? this.images : ['/images/store_front.jpg'],
        image: this.images[0] || '/images/store_front.jpg',
        variants: this.variants
      };

      try {
        if (this.product?.id) {
          await ProductService.updateProduct(this.product.id, payload);
          toast.show('Producto actualizado exitosamente.', 'success');
        } else {
          await ProductService.createProduct(payload);
          toast.show('Producto creado correctamente en el catálogo.', 'success');
        }
        this.close();
        this.onSave();
      } catch (err) {
        toast.show(err.message, 'danger');
      }
    });
  }

  close() {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
    }
  }
}
