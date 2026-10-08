import { environment } from './core/environment.js';
import { PRODUCTS } from './data/products.js';

// LocalStorage keys segregated by environment
const getStorageKey = (base) => `${base}_${environment.current}`;

const CART_STORAGE_KEY = 'bc_cart_v2';
const WISHLIST_STORAGE_KEY = 'bc_wishlist_v2';
const USER_STORAGE_KEY = 'bc_user_v2';
const ORDERS_STORAGE_KEY = 'bc_orders_v2';

class Store {
  constructor() {
    this.catalog = [...PRODUCTS];
    this.cart = this.loadCart();
    this.wishlist = this.loadWishlist();
    this.user = this.loadUser();
    this.orders = this.loadOrders();
    this.coupon = null;
    this.discountPercent = 0;
    this.activeCategory = 'todos';
    this.searchQuery = '';
    this.sortOption = 'default';
    this.listeners = new Set();
  }

  setCatalog(products) {
    this.catalog = Array.isArray(products) ? products : [];
    this.notify();
  }

  loadCart() {
    try {
      const data = localStorage.getItem(getStorageKey(CART_STORAGE_KEY));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveCart() {
    localStorage.setItem(getStorageKey(CART_STORAGE_KEY), JSON.stringify(this.cart));
    this.notify();
  }

  loadWishlist() {
    try {
      const data = localStorage.getItem(getStorageKey(WISHLIST_STORAGE_KEY));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveWishlist() {
    localStorage.setItem(getStorageKey(WISHLIST_STORAGE_KEY), JSON.stringify(this.wishlist));
    this.notify();
  }

  loadUser() {
    try {
      const data = localStorage.getItem(getStorageKey(USER_STORAGE_KEY));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveUser(user) {
    this.user = user;
    if (user) {
      localStorage.setItem(getStorageKey(USER_STORAGE_KEY), JSON.stringify(user));
    } else {
      localStorage.removeItem(getStorageKey(USER_STORAGE_KEY));
    }
    this.notify();
  }

  loadOrders() {
    try {
      const data = localStorage.getItem(getStorageKey(ORDERS_STORAGE_KEY));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveOrders() {
    localStorage.setItem(getStorageKey(ORDERS_STORAGE_KEY), JSON.stringify(this.orders));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  // Cart operations
  addToCart(productId, quantity = 1, productData = null) {
    const product = productData || this.catalog.find(p => p.id === productId);
    if (!product) return false;

    const existingIndex = this.cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        brand: product.brand,
        specsSummary: product.specsSummary || product.shortDescription,
        quantity: quantity,
        dataEnvironment: product.dataEnvironment || environment.dataEnvironment
      });
    }

    this.saveCart();
    return true;
  }

  updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const item = this.cart.find(i => i.id === productId);
    if (item) {
      item.quantity = quantity;
      this.saveCart();
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
  }

  clearCart() {
    this.cart = [];
    this.coupon = null;
    this.discountPercent = 0;
    this.saveCart();
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  getCartSubtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getShippingCost() {
    const subtotal = this.getCartSubtotal();
    if (subtotal === 0) return 0;
    // Free shipping if order > $500.000
    return subtotal >= 500000 ? 0 : 25000;
  }

  applyCoupon(code) {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'BC10') {
      this.coupon = 'BC10';
      this.discountPercent = 0.10;
      this.notify();
      return { success: true, message: '¡Cupón BC10 aplicado con éxito! 10% de descuento.' };
    } else if (cleanCode === 'BIENVENIDA') {
      this.coupon = 'BIENVENIDA';
      this.discountPercent = 0.15;
      this.notify();
      return { success: true, message: '¡Cupón BIENVENIDA aplicado! 15% de descuento.' };
    } else {
      return { success: false, message: 'Cupón inválido o expirado. Prueba con BC10.' };
    }
  }

  removeCoupon() {
    this.coupon = null;
    this.discountPercent = 0;
    this.notify();
  }

  getCartDiscount() {
    const subtotal = this.getCartSubtotal();
    return Math.round(subtotal * this.discountPercent);
  }

  getCartTotal() {
    const subtotal = this.getCartSubtotal();
    const discount = this.getCartDiscount();
    const shipping = this.getShippingCost();
    return Math.max(0, subtotal - discount + shipping);
  }

  // Wishlist operations
  toggleWishlist(productId) {
    const index = this.wishlist.indexOf(productId);
    let added = false;
    if (index > -1) {
      this.wishlist.splice(index, 1);
      added = false;
    } else {
      this.wishlist.push(productId);
      added = true;
    }
    this.saveWishlist();
    return added;
  }

  isInWishlist(productId) {
    return this.wishlist.includes(productId);
  }

  getWishlistCount() {
    return this.wishlist.length;
  }

  // Order creation
  createOrder(orderData) {
    const newOrder = {
      id: `BC-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('es-AR'),
      items: [...this.cart],
      subtotal: this.getCartSubtotal(),
      discount: this.getCartDiscount(),
      shippingCost: this.getShippingCost(),
      total: this.getCartTotal(),
      status: "Confirmado - Preparando despacho",
      trackingCode: `AND-${Math.floor(10000000 + Math.random() * 90000000)}-AR`,
      carrier: orderData.shippingType === 'sucursal' ? 'Retiro en Showroom CABA' : 'Andreani Express',
      customer: orderData.customer,
      paymentMethod: orderData.paymentMethod,
      dataEnvironment: environment.dataEnvironment
    };

    this.orders.unshift(newOrder);
    this.saveOrders();
    this.clearCart();
    return newOrder;
  }
}

export const store = new Store();
