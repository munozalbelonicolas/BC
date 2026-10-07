/**
 * @file rbac.js
 * Role-Based Access Control (RBAC) engine with strict permission matrices.
 */

import { AdminRole, Permissions } from '../types/entities.js';

export const ROLE_DEFINITIONS = {
  [AdminRole.SUPER_ADMIN]: {
    id: AdminRole.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Acceso total y sin restricciones a toda la plataforma',
    badgeClass: 'badge-purple',
    permissions: Object.values(Permissions)
  },
  [AdminRole.ADMIN]: {
    id: AdminRole.ADMIN,
    name: 'Administrador',
    description: 'Acceso operativo y de gestión general',
    badgeClass: 'badge-blue',
    permissions: [
      Permissions.DASHBOARD_READ,
      Permissions.PRODUCT_READ, Permissions.PRODUCT_CREATE, Permissions.PRODUCT_UPDATE, Permissions.PRODUCT_EXPORT,
      Permissions.CATEGORY_READ, Permissions.CATEGORY_CREATE, Permissions.CATEGORY_UPDATE,
      Permissions.BRAND_READ, Permissions.BRAND_CREATE, Permissions.BRAND_UPDATE,
      Permissions.INVENTORY_READ, Permissions.INVENTORY_UPDATE, Permissions.INVENTORY_EXPORT,
      Permissions.ORDER_READ, Permissions.ORDER_UPDATE, Permissions.ORDER_EXPORT,
      Permissions.CUSTOMER_READ, Permissions.CUSTOMER_UPDATE, Permissions.CUSTOMER_EXPORT,
      Permissions.PROMOTION_READ, Permissions.PROMOTION_CREATE, Permissions.PROMOTION_UPDATE,
      Permissions.COUPON_READ, Permissions.COUPON_CREATE, Permissions.COUPON_UPDATE,
      Permissions.PAYMENT_READ,
      Permissions.SHIPPING_READ,
      Permissions.AUDIT_READ
    ]
  },
  [AdminRole.SALES]: {
    id: AdminRole.SALES,
    name: 'Ventas',
    description: 'Gestión comercial de pedidos, clientes y catálogo',
    badgeClass: 'badge-emerald',
    permissions: [
      Permissions.DASHBOARD_READ,
      Permissions.PRODUCT_READ,
      Permissions.ORDER_READ, Permissions.ORDER_UPDATE, Permissions.ORDER_EXPORT,
      Permissions.CUSTOMER_READ, Permissions.CUSTOMER_UPDATE,
      Permissions.COUPON_READ
    ]
  },
  [AdminRole.WAREHOUSE]: {
    id: AdminRole.WAREHOUSE,
    name: 'Depósito y Logística',
    description: 'Control de stock físico, inventario y despachos',
    badgeClass: 'badge-amber',
    permissions: [
      Permissions.DASHBOARD_READ,
      Permissions.PRODUCT_READ,
      Permissions.INVENTORY_READ, Permissions.INVENTORY_UPDATE, Permissions.INVENTORY_EXPORT,
      Permissions.ORDER_READ, Permissions.ORDER_UPDATE
    ]
  },
  [AdminRole.MARKETING]: {
    id: AdminRole.MARKETING,
    name: 'Marketing',
    description: 'Estrategias de precios, promociones y analítica',
    badgeClass: 'badge-pink',
    permissions: [
      Permissions.DASHBOARD_READ,
      Permissions.PRODUCT_READ, Permissions.PRODUCT_UPDATE,
      Permissions.PROMOTION_READ, Permissions.PROMOTION_CREATE, Permissions.PROMOTION_UPDATE, Permissions.PROMOTION_DELETE,
      Permissions.COUPON_READ, Permissions.COUPON_CREATE, Permissions.COUPON_UPDATE, Permissions.COUPON_DELETE,
      Permissions.CUSTOMER_READ
    ]
  }
};

class RbacAuthorizer {
  constructor() {
    this.currentUser = {
      id: 'b42c925d-41d7-4264-a122-13670261f37a',
      name: 'Nicolás Muñoz',
      email: 'munozalbelonicolas@gmail.com',
      role: AdminRole.SUPER_ADMIN,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    };
    this.listeners = new Set();
  }

  getCurrentUser() {
    return { ...this.currentUser };
  }

  setCurrentUser(user) {
    this.currentUser = { ...this.currentUser, ...user };
    this.notify();
  }

  setRole(roleId) {
    if (ROLE_DEFINITIONS[roleId]) {
      this.currentUser.role = roleId;
      this.notify();
    }
  }

  getRoleDefinition(roleId = this.currentUser.role) {
    return ROLE_DEFINITIONS[roleId] || ROLE_DEFINITIONS[AdminRole.ADMIN];
  }

  can(permission) {
    const roleDef = this.getRoleDefinition(this.currentUser.role);
    if (!roleDef) return false;
    return roleDef.permissions.includes(permission);
  }

  canAny(permissionsList = []) {
    return permissionsList.some(p => this.can(p));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.currentUser));
  }
}

export const authorizer = new RbacAuthorizer();
