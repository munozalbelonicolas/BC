/**
 * @file entities.js
 * Domain models, entity schemas, and status enumerations for the BC Admin Panel.
 */

export const ProductStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

export const OrderStatus = {
  PENDING: 'pendiente',
  CONFIRMED: 'confirmado',
  PREPARING: 'en_preparacion',
  READY: 'listo',
  SHIPPED: 'enviado',
  DELIVERED: 'entregado',
  CANCELLED: 'cancelado'
};

export const PaymentStatus = {
  PENDING: 'pendiente',
  PAID: 'pagado',
  REJECTED: 'rechazado',
  REFUNDED: 'reembolsado',
  PARTIALLY_REFUNDED: 'parcialmente_reembolsado'
};

export const InventoryMovementType = {
  ENTRY: 'ingreso',
  EXIT: 'egreso',
  ADJUSTMENT: 'ajuste',
  SALE: 'venta',
  RETURN: 'devolucion'
};

export const StockStatus = {
  AVAILABLE: 'disponible',
  LOW_STOCK: 'stock_bajo',
  OUT_OF_STOCK: 'sin_stock'
};

export const PromotionType = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  BUY_X_GET_Y: 'buy_x_get_y',
  BULK: 'bulk',
  CATEGORY: 'category',
  PRODUCT: 'product'
};

export const CouponType = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
};

export const AdminRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALES: 'ventas',
  WAREHOUSE: 'deposito',
  MARKETING: 'marketing'
};

export const Permissions = {
  DASHBOARD_READ: 'dashboard.read',
  
  PRODUCT_READ: 'product.read',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_IMPORT: 'product.import',
  PRODUCT_EXPORT: 'product.export',
  
  CATEGORY_READ: 'category.read',
  CATEGORY_CREATE: 'category.create',
  CATEGORY_UPDATE: 'category.update',
  CATEGORY_DELETE: 'category.delete',
  
  BRAND_READ: 'brand.read',
  BRAND_CREATE: 'brand.create',
  BRAND_UPDATE: 'brand.update',
  BRAND_DELETE: 'brand.delete',
  
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_EXPORT: 'inventory.export',
  
  ORDER_READ: 'order.read',
  ORDER_UPDATE: 'order.update',
  ORDER_EXPORT: 'order.export',
  
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_EXPORT: 'customer.export',
  
  PROMOTION_READ: 'promotion.read',
  PROMOTION_CREATE: 'promotion.create',
  PROMOTION_UPDATE: 'promotion.update',
  PROMOTION_DELETE: 'promotion.delete',
  
  COUPON_READ: 'coupon.read',
  COUPON_CREATE: 'coupon.create',
  COUPON_UPDATE: 'coupon.update',
  COUPON_DELETE: 'coupon.delete',
  
  PAYMENT_READ: 'payment.read',
  PAYMENT_REFUND: 'payment.refund',
  
  SHIPPING_READ: 'shipping.read',
  SHIPPING_UPDATE: 'shipping.update',
  
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  
  AUDIT_READ: 'audit.read'
};

/**
 * Calculates financial margin percentage
 * @param {number} salePrice 
 * @param {number} costPrice 
 * @returns {number} Margin in percentage (e.g. 35.5)
 */
export function calculateProfitMargin(salePrice, costPrice) {
  if (!salePrice || salePrice <= 0) return 0;
  if (!costPrice || costPrice <= 0) return 100;
  const margin = ((salePrice - costPrice) / salePrice) * 100;
  return Math.round(margin * 10) / 10;
}

/**
 * Resolves stock status based on current stock and threshold
 * @param {number} currentStock 
 * @param {number} minStock 
 * @returns {string}
 */
export function getStockStatus(currentStock, minStock = 3) {
  if (currentStock <= 0) return StockStatus.OUT_OF_STOCK;
  if (currentStock <= minStock) return StockStatus.LOW_STOCK;
  return StockStatus.AVAILABLE;
}
