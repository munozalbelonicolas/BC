/**
 * @file productService.js
 * Business logic, validations, margin computations, and bulk operations for products.
 */

import { productRepo } from '../repositories/factory.js';
import { calculateProfitMargin, ProductStatus } from '../types/entities.js';
import { auditLogger } from '../core/audit.js';

export class ProductService {
  static async getProducts(options = {}) {
    return productRepo.getAll(options);
  }

  static async getProductById(id) {
    return productRepo.getById(id);
  }

  static async createProduct(payload) {
    this.validateProduct(payload);

    const price = Number(payload.price);
    const cost = Number(payload.cost || 0);
    const margin = calculateProfitMargin(price, cost);

    const slug = payload.slug || payload.name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const productData = {
      ...payload,
      slug,
      price,
      cost,
      margin,
      originalPrice: payload.originalPrice ? Number(payload.originalPrice) : null,
      stock: Number(payload.stock ?? 0),
      minStock: Number(payload.minStock ?? 2),
      status: payload.status || ProductStatus.ACTIVE,
      images: payload.images?.length ? payload.images : [payload.image || '/images/store_front.jpg'],
      image: payload.images?.[0] || payload.image || '/images/store_front.jpg',
      variants: payload.variants || [
        {
          id: `var_${Date.now()}`,
          name: 'Estándar',
          sku: payload.sku,
          price,
          cost,
          stock: Number(payload.stock ?? 0),
          image: payload.image
        }
      ]
    };

    const created = await productRepo.create(productData);

    await auditLogger.log({
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: created.id,
      newValues: { name: created.name, sku: created.sku, price: created.price, stock: created.stock },
      notes: `Producto "${created.name}" creado exitosamente.`
    });

    return created;
  }

  static async updateProduct(id, updates) {
    const existing = await productRepo.getById(id);
    if (!existing) throw new Error('Producto inexistente');

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('El nombre del producto no puede estar vacío.');
    }
    if (updates.price !== undefined && Number(updates.price) <= 0) {
      throw new Error('El precio de venta debe ser un monto mayor a 0.');
    }

    const price = updates.price !== undefined ? Number(updates.price) : existing.price;
    const cost = updates.cost !== undefined ? Number(updates.cost) : existing.cost;
    const margin = calculateProfitMargin(price, cost);

    const merged = {
      ...updates,
      price,
      cost,
      margin
    };

    if (updates.images && updates.images.length > 0) {
      merged.image = updates.images[0];
    }

    const updated = await productRepo.update(id, merged);

    await auditLogger.log({
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: id,
      oldValues: { price: existing.price, stock: existing.stock, status: existing.status },
      newValues: { price: updated.price, stock: updated.stock, status: updated.status },
      notes: `Producto "${updated.name}" actualizado.`
    });

    return updated;
  }

  static async duplicateProduct(id) {
    const original = await productRepo.getById(id);
    const duplicateData = {
      ...original,
      id: undefined,
      name: `${original.name} (Copia)`,
      slug: `${original.slug}-copia-${Date.now().toString(36)}`,
      sku: `${original.sku}-COP`,
      status: ProductStatus.DRAFT
    };
    return this.createProduct(duplicateData);
  }

  static async archiveProduct(id) {
    return this.updateProduct(id, { status: ProductStatus.ARCHIVED });
  }

  static async deleteProduct(id) {
    const existing = await productRepo.getById(id);
    const deleted = await productRepo.delete(id);

    await auditLogger.log({
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: id,
      oldValues: { name: existing.name, sku: existing.sku },
      notes: `Producto permanentemente eliminado.`
    });

    return deleted;
  }

  // --- Bulk Operations ---
  static async bulkActivate(ids) {
    const res = await productRepo.bulkUpdate(ids, { status: ProductStatus.ACTIVE });
    await auditLogger.log({
      action: 'PRODUCTS_BULK_ACTIVATED',
      entity: 'Product',
      entityId: `[${ids.length} items]`,
      notes: `Activación masiva de ${ids.length} productos.`
    });
    return res;
  }

  static async bulkDeactivate(ids) {
    const res = await productRepo.bulkUpdate(ids, { status: ProductStatus.INACTIVE });
    await auditLogger.log({
      action: 'PRODUCTS_BULK_DEACTIVATED',
      entity: 'Product',
      entityId: `[${ids.length} items]`,
      notes: `Desactivación masiva de ${ids.length} productos.`
    });
    return res;
  }

  static async bulkChangeCategory(ids, newCategory) {
    if (!newCategory) throw new Error('Categoría inválida para cambio masivo.');
    const res = await productRepo.bulkUpdate(ids, { category: newCategory });
    await auditLogger.log({
      action: 'PRODUCTS_BULK_CATEGORY_CHANGED',
      entity: 'Product',
      entityId: `[${ids.length} items]`,
      notes: `Cambio de categoría masivo a "${newCategory}".`
    });
    return res;
  }

  static async bulkUpdatePricePercentage(ids, percent) {
    const pct = Number(percent);
    if (isNaN(pct) || pct === 0) throw new Error('Porcentaje de ajuste inválido.');

    let modifiedCount = 0;
    for (const id of ids) {
      const prod = await productRepo.getById(id);
      const newPrice = Math.round(prod.price * (1 + pct / 100));
      await productRepo.update(id, { price: newPrice });
      modifiedCount++;
    }

    await auditLogger.log({
      action: 'PRODUCTS_BULK_PRICE_UPDATED',
      entity: 'Product',
      entityId: `[${ids.length} items]`,
      notes: `Ajuste masivo de precios (${pct > 0 ? '+' : ''}${pct}%) en ${modifiedCount} productos.`
    });

    return { success: true, count: modifiedCount };
  }

  static async bulkDelete(ids) {
    const res = await productRepo.bulkDelete(ids);
    await auditLogger.log({
      action: 'PRODUCTS_BULK_DELETED',
      entity: 'Product',
      entityId: `[${ids.length} items]`,
      notes: `Eliminación masiva de ${ids.length} productos.`
    });
    return res;
  }

  static validateProduct(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('El nombre del producto es obligatorio.');
    }
    if (!data.sku || !data.sku.trim()) {
      throw new Error('El código SKU es obligatorio para el control de inventario.');
    }
    if (!data.category) {
      throw new Error('Debe asignar una categoría al producto.');
    }
    if (!data.price || Number(data.price) <= 0) {
      throw new Error('El precio de venta debe ser mayor a 0.');
    }
  }
}
