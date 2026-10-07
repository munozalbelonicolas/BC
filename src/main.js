import { PRODUCTS, CATEGORIES, FAQS, TESTIMONIALS } from './data/products.js';
import { store } from './state.js';

// Utility: format Argentine Peso currency
function formatARS(amount) {
  return '$ ' + Math.round(amount).toLocaleString('es-AR');
}

// Utility: Toast notification
export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-alert ${type}`;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' 
        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ===================================================================
   PRODUCT CARD RENDERING
   =================================================================== */
function createProductCardHTML(product) {
  const isWish = store.isInWishlist(product.id);
  const badgeHtml = product.badge 
    ? `<span class="product-badge-tag ${product.isNew ? 'tag-new' : (product.badge.includes('OFF') || product.badge.includes('OFERTA') ? 'tag-sale' : '')}">${product.badge}</span>`
    : `<span></span>`;

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="card-top-row">
        ${badgeHtml}
        <button 
          class="wishlist-toggle-btn ${isWish ? 'is-active' : ''}" 
          data-id="${product.id}"
          aria-label="${isWish ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
        >
          <svg viewBox="0 0 24 24" fill="${isWish ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
      </div>

      <div class="product-img-box" data-action="quickview" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
        <span class="quick-view-hover-btn">Vista Rápida</span>
      </div>

      <div class="product-meta-block">
        <span class="product-brand">${product.brand}</span>
        <h3 class="product-title" data-action="quickview" data-id="${product.id}">${product.name}</h3>
        <p class="product-specs-summary">${product.specsSummary}</p>

        <div class="product-rating-row">
          <div class="star-rating-row" aria-label="${product.rating} estrellas">
            ${Array(product.rating).fill('<span class="star-gold">★</span>').join('')}
          </div>
          <span class="reviews-count">(${product.reviewsCount})</span>
        </div>

        <div class="product-price-box">
          <span class="product-price">${formatARS(product.price)}</span>
          ${product.originalPrice ? `<span class="product-original-price">${formatARS(product.originalPrice)}</span>` : ''}
        </div>

        <button class="btn-add-to-cart" data-action="add-cart" data-id="${product.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          <span>Agregar al carrito</span>
        </button>
      </div>
    </article>
  `;
}

function renderCatalog() {
  const featuredGrid = document.getElementById('featuredProductsGrid');
  const newArrivalsGrid = document.getElementById('newArrivalsGrid');

  let filtered = [...PRODUCTS];

  // Category filter
  if (store.activeCategory === 'ofertas') {
    filtered = filtered.filter(p => p.badge?.includes('OFF') || p.badge?.includes('OFERTA') || p.originalPrice > p.price);
  } else if (store.activeCategory !== 'todos') {
    filtered = filtered.filter(p => p.category === store.activeCategory);
  }

  // Search filter
  if (store.searchQuery.trim()) {
    const q = store.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      p.specsSummary.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (store.sortOption === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (store.sortOption === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (store.sortOption === 'rating') {
    filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
  }

  if (featuredGrid) {
    if (filtered.length === 0) {
      featuredGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;">
          <p style="font-size: 1.1rem; color: #64748b; margin-bottom: 12px;">No encontramos productos con esos filtros.</p>
          <button class="btn btn-primary" id="resetFiltersBtn">Ver todos los productos</button>
        </div>
      `;
      document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
        store.activeCategory = 'todos';
        store.searchQuery = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        updateCategoryPillUI();
        renderCatalog();
      });
    } else {
      // Show first 4 in featured grid as in image 3
      featuredGrid.innerHTML = filtered.slice(0, 4).map(createProductCardHTML).join('');
    }
  }

  // New arrivals grid (remaining products or newly marked ones)
  if (newArrivalsGrid) {
    const newItems = PRODUCTS.filter(p => p.isNew || !p.featured);
    newArrivalsGrid.innerHTML = newItems.slice(0, 4).map(createProductCardHTML).join('');
  }
}

/* ===================================================================
   SEARCH AUTOCOMPLETE
   =================================================================== */
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchDropdown = document.getElementById('searchDropdown');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');

  if (!searchInput || !searchDropdown) return;

  function doSearch(query) {
    if (!query.trim()) {
      searchDropdown.classList.add('hidden');
      return;
    }

    const q = query.toLowerCase().trim();
    const matches = PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matches.length === 0) {
      searchDropdown.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 0.9rem;">
          No se encontraron resultados para "${query}"
        </div>
      `;
    } else {
      searchDropdown.innerHTML = matches.map(prod => `
        <div class="search-result-item" data-id="${prod.id}">
          <img src="${prod.image}" alt="${prod.name}" class="search-result-thumb">
          <div class="search-result-details">
            <div class="search-result-title">${prod.name}</div>
            <div class="search-result-price">${formatARS(prod.price)}</div>
          </div>
        </div>
      `).join('');
    }

    searchDropdown.classList.remove('hidden');
  }

  searchInput.addEventListener('input', (e) => {
    doSearch(e.target.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      store.searchQuery = searchInput.value;
      store.activeCategory = 'todos';
      updateCategoryPillUI();
      renderCatalog();
      searchDropdown.classList.add('hidden');
      document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  searchSubmitBtn?.addEventListener('click', () => {
    store.searchQuery = searchInput.value;
    store.activeCategory = 'todos';
    updateCategoryPillUI();
    renderCatalog();
    searchDropdown.classList.add('hidden');
    document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Clicking an autocomplete item opens quickview modal
  searchDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item) {
      const prodId = item.dataset.id;
      searchDropdown.classList.add('hidden');
      openProductModal(prodId);
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#searchContainer')) {
      searchDropdown.classList.add('hidden');
    }
  });
}

/* ===================================================================
   CATEGORY FILTERS & PILLS UI
   =================================================================== */
function updateCategoryPillUI() {
  document.querySelectorAll('#categoryFilterPills .filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === store.activeCategory);
  });

  document.querySelectorAll('#navLinksList .nav-link-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === store.activeCategory);
  });
}

function setupCategoryNavigation() {
  // Pill filters on catalog section
  document.getElementById('categoryFilterPills')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (pill) {
      store.activeCategory = pill.dataset.cat;
      store.searchQuery = '';
      updateCategoryPillUI();
      renderCatalog();
    }
  });

  // Secondary nav links in top bar
  document.getElementById('navLinksList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-link-btn');
    if (btn) {
      store.activeCategory = btn.dataset.category;
      store.searchQuery = '';
      updateCategoryPillUI();
      renderCatalog();
      document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Category cards click (Electrodomésticos, Tecnología, Hogar, Aire Libre)
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      if (cat) {
        store.activeCategory = cat;
        store.searchQuery = '';
        updateCategoryPillUI();
        renderCatalog();
        document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Banner "Ver todas las categorías" and "Ver ofertas" buttons
  document.getElementById('bannerVerCategoriasBtn')?.addEventListener('click', () => {
    store.activeCategory = 'todos';
    updateCategoryPillUI();
    renderCatalog();
    document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('bannerVerOfertasBtn')?.addEventListener('click', () => {
    store.activeCategory = 'ofertas';
    updateCategoryPillUI();
    renderCatalog();
    document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('linkVerTodosDestacados')?.addEventListener('click', (e) => {
    e.preventDefault();
    store.activeCategory = 'todos';
    updateCategoryPillUI();
    renderCatalog();
    document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('linkVerTodosNuevos')?.addEventListener('click', () => {
    store.activeCategory = 'todos';
    updateCategoryPillUI();
    renderCatalog();
    document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Sorting dropdown
  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    store.sortOption = e.target.value;
    renderCatalog();
  });
}

/* ===================================================================
   CART DRAWER & WISHLIST LOGIC
   =================================================================== */
function updateCartUI() {
  const count = store.getCartCount();
  const subtotal = store.getCartSubtotal();
  const discount = store.getCartDiscount();
  const shipping = store.getShippingCost();
  const total = store.getCartTotal();

  // Badges
  const cartBadge = document.getElementById('cartCount');
  const drawerCount = document.getElementById('drawerCartCount');
  if (cartBadge) cartBadge.textContent = count;
  if (drawerCount) drawerCount.textContent = count;

  // Free shipping progress bar
  const threshold = 500000;
  const progressPercent = Math.min(100, Math.round((subtotal / threshold) * 100));
  const shippingProgressBar = document.getElementById('shippingProgressBar');
  const shippingProgressText = document.getElementById('shippingProgressText');

  if (shippingProgressBar) shippingProgressBar.style.width = `${progressPercent}%`;
  if (shippingProgressText) {
    if (subtotal >= threshold) {
      shippingProgressText.innerHTML = `🎉 <strong>¡Felicitaciones! Tenés Envío Gratis en tu pedido.</strong>`;
    } else {
      const remaining = threshold - subtotal;
      shippingProgressText.innerHTML = `¡Agregá <strong>${formatARS(remaining)}</strong> más para obtener <strong>Envío Gratis</strong>!`;
    }
  }

  // Price summary in drawer
  const subtotalEl = document.getElementById('cartSubtotalText');
  const discountRow = document.getElementById('discountSummaryRow');
  const discountEl = document.getElementById('cartDiscountText');
  const shippingEl = document.getElementById('cartShippingText');
  const totalEl = document.getElementById('cartTotalText');

  if (subtotalEl) subtotalEl.textContent = formatARS(subtotal);
  if (discountRow && discountEl) {
    if (discount > 0) {
      discountRow.classList.remove('hidden');
      discountEl.textContent = `-${formatARS(discount)}`;
    } else {
      discountRow.classList.add('hidden');
    }
  }
  if (shippingEl) {
    shippingEl.textContent = shipping === 0 ? '¡GRATIS!' : formatARS(shipping);
  }
  if (totalEl) totalEl.textContent = formatARS(total);

  // Cart body list
  const cartBody = document.getElementById('cartDrawerBody');
  if (!cartBody) return;

  if (store.cart.length === 0) {
    cartBody.innerHTML = `
      <div class="empty-cart-state">
        <svg class="empty-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
        </svg>
        <h4 class="empty-cart-title">Tu carrito está vacío</h4>
        <p class="empty-cart-sub">Explorá nuestras categorías y encontrá las mejores marcas importadas con garantía oficial.</p>
        <button class="btn btn-primary" id="cartStartShoppingBtn">Explorar productos</button>
      </div>
    `;
    document.getElementById('cartStartShoppingBtn')?.addEventListener('click', () => {
      closeCartDrawer();
      document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
    });
  } else {
    cartBody.innerHTML = `
      <div class="cart-items-list">
        ${store.cart.map(item => `
          <div class="cart-item-row" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
              <span class="cart-item-brand">${item.brand}</span>
              <h4 class="cart-item-name">${item.name}</h4>
              <div class="cart-item-price">${formatARS(item.price)}</div>
            </div>
            <div class="cart-qty-controls">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Disminuir">−</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Aumentar">+</button>
            </div>
            <button class="cart-remove-item-btn" data-action="remove" data-id="${item.id}" aria-label="Eliminar producto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function updateWishlistUI() {
  const count = store.getWishlistCount();
  const wishlistBadge = document.getElementById('wishlistCount');
  const drawerCount = document.getElementById('drawerWishlistCount');

  if (wishlistBadge) {
    wishlistBadge.textContent = count;
    wishlistBadge.classList.toggle('hidden', count === 0);
  }
  if (drawerCount) drawerCount.textContent = count;

  // Render wishlist drawer items
  const wishlistBody = document.getElementById('wishlistDrawerBody');
  if (!wishlistBody) return;

  const wishlistProducts = PRODUCTS.filter(p => store.isInWishlist(p.id));

  if (wishlistProducts.length === 0) {
    wishlistBody.innerHTML = `
      <div class="empty-cart-state">
        <svg class="empty-cart-icon text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
        <h4 class="empty-cart-title">No tenés favoritos guardados</h4>
        <p class="empty-cart-sub">Hacé clic en el corazón de cualquier producto para guardarlo y comprarlo cuando quieras.</p>
      </div>
    `;
  } else {
    wishlistBody.innerHTML = `
      <div class="cart-items-list">
        ${wishlistProducts.map(p => `
          <div class="cart-item-row" data-id="${p.id}">
            <img src="${p.image}" alt="${p.name}" class="cart-item-img">
            <div class="cart-item-info">
              <span class="cart-item-brand">${p.brand}</span>
              <h4 class="cart-item-name">${p.name}</h4>
              <div class="cart-item-price">${formatARS(p.price)}</div>
            </div>
            <button class="btn btn-sm btn-primary" data-action="wishlist-to-cart" data-id="${p.id}">
              Comprar
            </button>
            <button class="cart-remove-item-btn" data-action="remove-wishlist" data-id="${p.id}">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function openCartDrawer() {
  document.getElementById('cartBackdrop')?.classList.remove('hidden');
  document.getElementById('cartDrawer')?.classList.remove('hidden');
  updateCartUI();
}

function closeCartDrawer() {
  document.getElementById('cartBackdrop')?.classList.add('hidden');
  document.getElementById('cartDrawer')?.classList.add('hidden');
}

function openWishlistDrawer() {
  document.getElementById('wishlistBackdrop')?.classList.remove('hidden');
  document.getElementById('wishlistDrawer')?.classList.remove('hidden');
  updateWishlistUI();
}

function closeWishlistDrawer() {
  document.getElementById('wishlistBackdrop')?.classList.add('hidden');
  document.getElementById('wishlistDrawer')?.classList.add('hidden');
}

/* ===================================================================
   PRODUCT QUICK VIEW MODAL
   =================================================================== */
function openProductModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modalBackdrop = document.getElementById('productModalBackdrop');
  const modalContent = document.getElementById('productModalContent');
  if (!modalBackdrop || !modalContent) return;

  const installmentVal = Math.round(product.price / 12);

  modalContent.innerHTML = `
    <div class="modal-product-gallery">
      <div class="modal-main-img-box">
        <img src="${product.image}" alt="${product.name}">
      </div>
    </div>

    <div class="modal-product-details">
      <span class="modal-product-brand">${product.brand}</span>
      <h2 class="modal-product-title">${product.name}</h2>
      
      <div class="installments-badge">
        💳 12 cuotas fijas de ${formatARS(installmentVal)}
      </div>

      <div class="modal-product-price-box">
        <span class="modal-price">${formatARS(product.price)}</span>
        ${product.originalPrice ? `<span class="product-original-price">${formatARS(product.originalPrice)}</span>` : ''}
      </div>

      <p class="modal-desc">${product.description}</p>

      <table class="specs-table">
        <tbody>
          ${Object.entries(product.specs).map(([key, val]) => `
            <tr>
              <td>${key}</td>
              <td>${val}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <button class="btn btn-primary btn-block" id="modalAddToCartBtn" data-id="${product.id}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          <span>Agregar al carrito</span>
        </button>
        <button class="btn btn-outline" id="modalWishlistBtn" data-id="${product.id}" aria-label="Favoritos">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${store.isInWishlist(product.id) ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('modalAddToCartBtn')?.addEventListener('click', () => {
    store.addToCart(product.id, 1);
    modalBackdrop.classList.add('hidden');
    openCartDrawer();
    showToast(`¡${product.name} añadido al carrito!`, 'success');
  });

  document.getElementById('modalWishlistBtn')?.addEventListener('click', () => {
    const added = store.toggleWishlist(product.id);
    modalBackdrop.classList.add('hidden');
    renderCatalog();
    updateWishlistUI();
    showToast(added ? 'Añadido a tus favoritos' : 'Eliminado de tus favoritos', 'info');
  });

  modalBackdrop.classList.remove('hidden');
}

/* ===================================================================
   CHECKOUT STEP-BY-STEP FLOW
   =================================================================== */
let checkoutStep = 1;
let checkoutFormData = {
  customer: {
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: 'Buenos Aires',
    codigoPostal: ''
  },
  shippingType: 'domicilio',
  paymentMethod: 'mercadopago'
};

function renderCheckoutStep() {
  const body = document.getElementById('checkoutModalBody');
  const ind1 = document.getElementById('stepIndicator1');
  const ind2 = document.getElementById('stepIndicator2');
  const ind3 = document.getElementById('stepIndicator3');

  ind1?.classList.toggle('active', checkoutStep === 1);
  ind2?.classList.toggle('active', checkoutStep === 2);
  ind3?.classList.toggle('active', checkoutStep === 3);

  if (!body) return;

  if (checkoutStep === 1) {
    body.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">1. Datos de Contacto y Envío</h3>
      <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 20px;">Completá los datos para despachar tu pedido con seguimiento oficial.</p>

      <form id="checkoutStep1Form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input type="text" class="form-input" id="cNombre" required value="${checkoutFormData.customer.nombre || 'Nicolás'}">
          </div>
          <div class="form-group">
            <label class="form-label">Apellido *</label>
            <input type="text" class="form-input" id="cApellido" required value="${checkoutFormData.customer.apellido || 'Muñoz'}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Correo Electrónico *</label>
            <input type="email" class="form-input" id="cEmail" required value="${checkoutFormData.customer.email || 'nicolas@ejemplo.com'}">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono / WhatsApp *</label>
            <input type="tel" class="form-input" id="cTelefono" required value="${checkoutFormData.customer.telefono || '11 5544-3322'}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Dirección (Calle y Número) *</label>
          <input type="text" class="form-input" id="cDireccion" required value="${checkoutFormData.customer.direccion || 'Av. Corrientes 1540'}">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Ciudad / Localidad *</label>
            <input type="text" class="form-input" id="cCiudad" required value="${checkoutFormData.customer.ciudad || 'CABA'}">
          </div>
          <div class="form-group">
            <label class="form-label">Provincia *</label>
            <select class="form-input" id="cProvincia">
              <option value="CABA">CABA</option>
              <option value="Buenos Aires" selected>Buenos Aires</option>
              <option value="Córdoba">Córdoba</option>
              <option value="Santa Fe">Santa Fe</option>
              <option value="Mendoza">Mendoza</option>
              <option value="Tucumán">Tucumán</option>
              <option value="Otras Provincias">Otras Provincias</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Código Postal *</label>
            <input type="text" class="form-input" id="cCP" required value="${checkoutFormData.customer.codigoPostal || '1042'}">
          </div>
        </div>

        <div class="form-group" style="margin-top: 10px;">
          <label class="form-label">Método de Envío:</label>
          <div style="display: flex; gap: 12px; margin-top: 6px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
              <input type="radio" name="shippingOpt" value="domicilio" checked>
              <span>Envío a Domicilio Express (${store.getShippingCost() === 0 ? '¡GRATIS!' : formatARS(store.getShippingCost())})</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer;">
              <input type="radio" name="shippingOpt" value="sucursal">
              <span>Retiro en Showroom CABA (Gratis)</span>
            </label>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
          <button type="submit" class="btn btn-primary" style="padding: 12px 28px;">
            Continuar al Pago →
          </button>
        </div>
      </form>
    `;

    document.getElementById('checkoutStep1Form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      checkoutFormData.customer = {
        nombre: document.getElementById('cNombre').value,
        apellido: document.getElementById('cApellido').value,
        email: document.getElementById('cEmail').value,
        telefono: document.getElementById('cTelefono').value,
        direccion: document.getElementById('cDireccion').value,
        ciudad: document.getElementById('cCiudad').value,
        provincia: document.getElementById('cProvincia').value,
        codigoPostal: document.getElementById('cCP').value,
      };
      checkoutFormData.shippingType = document.querySelector('input[name="shippingOpt"]:checked')?.value || 'domicilio';
      checkoutStep = 2;
      renderCheckoutStep();
    });
  } else if (checkoutStep === 2) {
    const total = store.getCartTotal();
    body.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">2. Método de Pago</h3>
      <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 20px;">Total a pagar: <strong style="color: #0066ff; font-size: 1.1rem;">${formatARS(total)}</strong></p>

      <div class="payment-options-grid">
        <div class="payment-method-card selected" data-method="mercadopago">
          <h4>Mercado Pago</h4>
          <p>Dinero en cuenta, Débito o hasta 12 cuotas</p>
        </div>
        <div class="payment-method-card" data-method="tarjeta">
          <h4>Tarjeta de Crédito</h4>
          <p>Visa, MasterCard, Amex en cuotas fijas</p>
        </div>
        <div class="payment-method-card" data-method="transferencia">
          <h4>Transferencia Bancaria</h4>
          <p style="color: #15803d; font-weight: 700;">¡10% OFF EXTRA acumulable!</p>
        </div>
        <div class="payment-method-card" data-method="efectivo">
          <h4>Efectivo en Showroom</h4>
          <p>Al retirar en Montevideo 1234, CABA</p>
        </div>
      </div>

      <div id="paymentDetailsContainer" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <p style="font-size: 0.88rem; color: #334155;">
          🔒 Serás redirigido a la pasarela protegida de <strong>Mercado Pago</strong> para completar tu compra con acreditación instantánea.
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" class="btn btn-outline" id="checkoutBackToStep1Btn">← Volver a Datos</button>
        <button type="button" class="btn btn-primary" id="checkoutConfirmOrderBtn" style="padding: 12px 32px;">
          Confirmar y Finalizar Pedido 🎉
        </button>
      </div>
    `;

    document.querySelectorAll('.payment-method-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        checkoutFormData.paymentMethod = card.dataset.method;

        const details = document.getElementById('paymentDetailsContainer');
        if (details) {
          if (card.dataset.method === 'transferencia') {
            details.innerHTML = `
              <p style="font-size: 0.88rem; color: #15803d; font-weight: 700; margin-bottom: 6px;">¡Beneficio aplicado: 10% OFF extra por Transferencia Bancaria!</p>
              <p style="font-size: 0.84rem; color: #334155;">Alias: <strong>BC.ESPECIAL.IMPORT</strong> | CBU: 0720194820000039281749<br>Razón Social: BC Especial Import S.A. | CUIT: 30-71649201-9</p>
            `;
          } else if (card.dataset.method === 'tarjeta') {
            details.innerHTML = `
              <p style="font-size: 0.88rem; color: #334155;">
                Aceptamos todas las tarjetas bancarias con chip y contactless. Recibirás el link de pago seguro 3D-Secure.
              </p>
            `;
          } else if (card.dataset.method === 'efectivo') {
            details.innerHTML = `
              <p style="font-size: 0.88rem; color: #334155;">
                Tu producto quedará reservado por 48 horas en nuestro Showroom Central de Montevideo 1234, CABA.
              </p>
            `;
          } else {
            details.innerHTML = `
              <p style="font-size: 0.88rem; color: #334155;">
                🔒 Serás redirigido a la pasarela protegida de <strong>Mercado Pago</strong> para completar tu compra con acreditación instantánea.
              </p>
            `;
          }
        }
      });
    });

    document.getElementById('checkoutBackToStep1Btn')?.addEventListener('click', () => {
      checkoutStep = 1;
      renderCheckoutStep();
    });

    document.getElementById('checkoutConfirmOrderBtn')?.addEventListener('click', () => {
      const createdOrder = store.createOrder(checkoutFormData);
      checkoutStep = 3;
      renderCheckoutConfirmation(createdOrder);
    });
  }
}

function renderCheckoutConfirmation(order) {
  const body = document.getElementById('checkoutModalBody');
  const ind1 = document.getElementById('stepIndicator1');
  const ind2 = document.getElementById('stepIndicator2');
  const ind3 = document.getElementById('stepIndicator3');

  ind1?.classList.remove('active');
  ind2?.classList.remove('active');
  ind3?.classList.add('active');

  if (!body) return;

  body.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <div style="width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 style="font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">¡Muchas gracias por tu compra!</h3>
      <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 24px;">
        Tu pedido <strong>#${order.id}</strong> ha sido confirmado con éxito.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px; font-size: 0.9rem;">
          <span>Código de Seguimiento:</span>
          <strong style="color: #0066ff;">${order.trackingCode}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px; font-size: 0.9rem;">
          <span>Operador Logístico:</span>
          <strong>${order.carrier}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px; font-size: 0.9rem;">
          <span>Titular:</span>
          <strong>${order.customer?.nombre || ''} ${order.customer?.apellido || ''}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 800; color: #0f172a;">
          <span>Total Abonado:</span>
          <span style="color: #0066ff;">${formatARS(order.total)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-primary" id="checkoutFinishOkBtn">
          Seguir Explorando la Tienda
        </button>
        <button class="btn btn-outline" id="printReceiptBtn">
          🖨️ Descargar Comprobante
        </button>
      </div>
    </div>
  `;

  document.getElementById('checkoutFinishOkBtn')?.addEventListener('click', () => {
    document.getElementById('checkoutModalBackdrop')?.classList.add('hidden');
    checkoutStep = 1;
    showToast('¡Pedido completado con éxito!', 'success');
  });

  document.getElementById('printReceiptBtn')?.addEventListener('click', () => {
    window.print();
  });
}

function openCheckoutModal() {
  if (store.cart.length === 0) {
    showToast('Tu carrito está vacío. Agregá productos antes de continuar.', 'info');
    return;
  }
  closeCartDrawer();
  checkoutStep = 1;
  renderCheckoutStep();
  document.getElementById('checkoutModalBackdrop')?.classList.remove('hidden');
}

/* ===================================================================
   ACCOUNT MODAL (LOGIN / REGISTER / MIS PEDIDOS)
   =================================================================== */
let accountActiveTab = 'orders';

function renderAccountBody() {
  const body = document.getElementById('accountModalBody');
  const tabLogin = document.getElementById('tabLoginBtn');
  const tabRegister = document.getElementById('tabRegisterBtn');
  const tabOrders = document.getElementById('tabOrdersBtn');

  tabLogin?.classList.toggle('active', accountActiveTab === 'login');
  tabRegister?.classList.toggle('active', accountActiveTab === 'register');
  tabOrders?.classList.toggle('active', accountActiveTab === 'orders');

  if (!body) return;

  if (accountActiveTab === 'login') {
    body.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Bienvenido de nuevo</h3>
      <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 20px;">Ingresá con tu correo electrónico registrado.</p>

      <form id="accountLoginForm">
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input type="email" class="form-input" id="loginEmail" required value="nicolas@ejemplo.com">
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" class="form-input" id="loginPass" required value="••••••••">
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px;">
          Ingresar a Mi Cuenta
        </button>
      </form>
    `;

    document.getElementById('accountLoginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      store.saveUser({ name: 'Nicolás Muñoz', email: 'nicolas@ejemplo.com' });
      accountActiveTab = 'orders';
      renderAccountBody();
      showToast('¡Sesión iniciada con éxito! Hola Nicolás 👋', 'success');
    });
  } else if (accountActiveTab === 'register') {
    body.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Crear una cuenta</h3>
      <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 20px;">Accedé a promociones exclusivas y seguimiento en tiempo real.</p>

      <form id="accountRegisterForm">
        <div class="form-group">
          <label class="form-label">Nombre Completo</label>
          <input type="text" class="form-input" id="regName" required placeholder="Ej: Juan Pérez">
        </div>
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input type="email" class="form-input" id="regEmail" required placeholder="tu@email.com">
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" class="form-input" id="regPass" required placeholder="Mínimo 6 caracteres">
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px;">
          Crear mi cuenta
        </button>
      </form>
    `;

    document.getElementById('accountRegisterForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      store.saveUser({ name, email });
      accountActiveTab = 'orders';
      renderAccountBody();
      showToast('¡Cuenta creada con éxito!', 'success');
    });
  } else if (accountActiveTab === 'orders') {
    if (store.orders.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <p style="color: #64748b; font-size: 1rem;">No registrás pedidos anteriores.</p>
        </div>
      `;
    } else {
      body.innerHTML = `
        <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Historial de Pedidos y Envíos</h3>
        <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 18px;">Seguimiento en tiempo real de tus compras en BC Especial Import.</p>

        <div>
          ${store.orders.map(order => `
            <div class="order-history-card">
              <div class="order-history-header">
                <div>
                  <strong>Pedido #${order.id}</strong> · <span style="color: #64748b;">${order.date}</span>
                </div>
                <span class="order-badge-status">${order.status}</span>
              </div>
              <div style="font-size: 0.84rem; color: #475569; margin-bottom: 8px;">
                Transporte: <strong>${order.carrier}</strong> | Guía: <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${order.trackingCode}</code>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 0.95rem;">
                <span style="color: #64748b;">Total:</span>
                <strong style="color: #0066ff;">${formatARS(order.total)}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}

/* ===================================================================
   FAQ ACCORDION & STATIC SECTIONS
   =================================================================== */
function setupFaqs() {
  const container = document.getElementById('faqAccordion');
  if (!container) return;

  container.innerHTML = FAQS.map((faq, index) => `
    <div class="accordion-item ${index === 0 ? 'open' : ''}">
      <button class="accordion-trigger" aria-expanded="${index === 0}">
        <span>${faq.question}</span>
        <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <div class="accordion-content">
        <p>${faq.answer}</p>
      </div>
    </div>
  `).join('');

  container.addEventListener('click', (e) => {
    const trigger = e.target.closest('.accordion-trigger');
    if (trigger) {
      const item = trigger.closest('.accordion-item');
      const wasOpen = item.classList.contains('open');
      
      // Close all
      container.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      
      // Toggle selected
      if (!wasOpen) {
        item.classList.add('open');
      }
    }
  });
}

/* ===================================================================
   WHATSAPP SIMULATOR CHAT
   =================================================================== */
function setupWhatsappChat() {
  const chatForm = document.getElementById('whatsappChatForm');
  const chatInput = document.getElementById('whatsappInput');
  const messagesBox = document.getElementById('whatsappMessages');

  if (!chatForm || !chatInput || !messagesBox) return;

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Append outgoing bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'wa-bubble outgoing';
    userBubble.innerHTML = `${text} <span class="wa-time">Ahora</span>`;
    messagesBox.appendChild(userBubble);
    chatInput.value = '';
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // Simulate agent response after 1 second
    setTimeout(() => {
      const agentBubble = document.createElement('div');
      agentBubble.className = 'wa-bubble incoming';
      agentBubble.innerHTML = `¡Excelente! Tomamos tu consulta sobre "${text}". Un asesor especializado de BC Especial Import se pondrá en contacto a la brevedad. También podés llamarnos al 11 1234-5678. <span class="wa-time">Ahora</span>`;
      messagesBox.appendChild(agentBubble);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }, 1000);
  });
}

/* ===================================================================
   EVENT LISTENERS INITIALIZATION
   =================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial renders
  renderCatalog();
  updateCartUI();
  updateWishlistUI();
  setupSearch();
  setupCategoryNavigation();
  setupFaqs();
  setupWhatsappChat();

  // Subscribe state changes
  store.subscribe(() => {
    updateCartUI();
    updateWishlistUI();
    renderCatalog();
  });

  // 2. Global delegate for product card clicks (add to cart, wishlist, quick view)
  document.addEventListener('click', (e) => {
    const addCartBtn = e.target.closest('[data-action="add-cart"]');
    if (addCartBtn) {
      e.stopPropagation();
      const id = addCartBtn.dataset.id;
      store.addToCart(id, 1);
      openCartDrawer();
      const p = PRODUCTS.find(prod => prod.id === id);
      showToast(`¡${p ? p.name : 'Producto'} añadido al carrito!`, 'success');
      return;
    }

    const wishBtn = e.target.closest('.wishlist-toggle-btn');
    if (wishBtn) {
      e.stopPropagation();
      const id = wishBtn.dataset.id;
      const added = store.toggleWishlist(id);
      renderCatalog();
      updateWishlistUI();
      showToast(added ? 'Añadido a tus favoritos' : 'Eliminado de tus favoritos', 'info');
      return;
    }

    const quickView = e.target.closest('[data-action="quickview"]');
    if (quickView) {
      const id = quickView.dataset.id;
      openProductModal(id);
      return;
    }

    // Cart drawer internal actions
    const incBtn = e.target.closest('[data-action="increase"]');
    if (incBtn) {
      const id = incBtn.dataset.id;
      const item = store.cart.find(i => i.id === id);
      if (item) store.updateCartQuantity(id, item.quantity + 1);
      return;
    }

    const decBtn = e.target.closest('[data-action="decrease"]');
    if (decBtn) {
      const id = decBtn.dataset.id;
      const item = store.cart.find(i => i.id === id);
      if (item) store.updateCartQuantity(id, item.quantity - 1);
      return;
    }

    const removeBtn = e.target.closest('[data-action="remove"]');
    if (removeBtn) {
      const id = removeBtn.dataset.id;
      store.removeFromCart(id);
      return;
    }

    const wishToCartBtn = e.target.closest('[data-action="wishlist-to-cart"]');
    if (wishToCartBtn) {
      const id = wishToCartBtn.dataset.id;
      store.addToCart(id, 1);
      closeWishlistDrawer();
      openCartDrawer();
      showToast('¡Añadido al carrito!', 'success');
      return;
    }

    const removeWishBtn = e.target.closest('[data-action="remove-wishlist"]');
    if (removeWishBtn) {
      const id = removeWishBtn.dataset.id;
      store.toggleWishlist(id);
      updateWishlistUI();
      renderCatalog();
      return;
    }
  });

  // 3. Header Action buttons
  document.getElementById('cartHeaderBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartBackdrop')?.addEventListener('click', closeCartDrawer);

  document.getElementById('wishlistHeaderBtn')?.addEventListener('click', openWishlistDrawer);
  document.getElementById('closeWishlistBtn')?.addEventListener('click', closeWishlistDrawer);
  document.getElementById('wishlistBackdrop')?.addEventListener('click', closeWishlistDrawer);

  // Mi cuenta
  const accountBtn = document.getElementById('accountBtn');
  const accountModal = document.getElementById('accountModalBackdrop');
  accountBtn?.addEventListener('click', () => {
    accountActiveTab = store.user ? 'orders' : 'login';
    renderAccountBody();
    accountModal?.classList.remove('hidden');
  });
  document.getElementById('closeAccountModalBtn')?.addEventListener('click', () => {
    accountModal?.classList.add('hidden');
  });
  accountModal?.addEventListener('click', (e) => {
    if (e.target === accountModal) accountModal.classList.add('hidden');
  });

  document.getElementById('tabLoginBtn')?.addEventListener('click', () => {
    accountActiveTab = 'login';
    renderAccountBody();
  });
  document.getElementById('tabRegisterBtn')?.addEventListener('click', () => {
    accountActiveTab = 'register';
    renderAccountBody();
  });
  document.getElementById('tabOrdersBtn')?.addEventListener('click', () => {
    accountActiveTab = 'orders';
    renderAccountBody();
  });

  // Product modal close
  const prodModal = document.getElementById('productModalBackdrop');
  document.getElementById('closeProductModalBtn')?.addEventListener('click', () => {
    prodModal?.classList.add('hidden');
  });
  prodModal?.addEventListener('click', (e) => {
    if (e.target === prodModal) prodModal.classList.add('hidden');
  });

  // Checkout modal
  document.getElementById('checkoutTriggerBtn')?.addEventListener('click', openCheckoutModal);
  const checkoutModal = document.getElementById('checkoutModalBackdrop');
  document.getElementById('closeCheckoutModalBtn')?.addEventListener('click', () => {
    checkoutModal?.classList.add('hidden');
  });
  checkoutModal?.addEventListener('click', (e) => {
    if (e.target === checkoutModal) checkoutModal.classList.add('hidden');
  });

  // Coupon application
  document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
    const input = document.getElementById('couponInput');
    if (input) {
      const res = store.applyCoupon(input.value);
      showToast(res.message, res.success ? 'success' : 'info');
      if (res.success) {
        document.getElementById('couponAppliedTag')?.classList.remove('hidden');
        document.getElementById('appliedCouponCode').textContent = store.coupon;
        document.getElementById('appliedCouponPercent').textContent = Math.round(store.discountPercent * 100);
      }
    }
  });

  document.getElementById('removeCouponBtn')?.addEventListener('click', () => {
    store.removeCoupon();
    document.getElementById('couponAppliedTag')?.classList.add('hidden');
    showToast('Cupón removido', 'info');
  });

  // Sobre Nosotros Modal
  const aboutModal = document.getElementById('aboutModalBackdrop');
  document.getElementById('openAboutModalBtn')?.addEventListener('click', () => {
    aboutModal?.classList.remove('hidden');
  });
  document.getElementById('closeAboutModalBtn')?.addEventListener('click', () => {
    aboutModal?.classList.add('hidden');
  });
  document.getElementById('aboutModalCloseOkBtn')?.addEventListener('click', () => {
    aboutModal?.classList.add('hidden');
  });
  aboutModal?.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.classList.add('hidden');
  });

  // WhatsApp Chat Modal
  const waModal = document.getElementById('whatsappModalBackdrop');
  const openWa = () => waModal?.classList.remove('hidden');
  const closeWa = () => waModal?.classList.add('hidden');

  document.getElementById('floatingWhatsappBtn')?.addEventListener('click', openWa);
  document.getElementById('channelWhatsappBtn')?.addEventListener('click', openWa);
  document.getElementById('closeWhatsappModalBtn')?.addEventListener('click', closeWa);
  waModal?.addEventListener('click', (e) => {
    if (e.target === waModal) closeWa();
  });

  // Newsletter Form
  document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail')?.value;
    if (email) {
      showToast(`¡Gracias por suscribirte (${email})! Usá el cupón BC10 para 10% OFF.`, 'success');
      document.getElementById('newsletterEmail').value = '';
    }
  });

  // Legal / Terms Modals
  const showLegalNotice = (title) => {
    showToast(`${title} de BC Especial Import S.A. - Conforme a Ley 24.240 de Defensa del Consumidor de Argentina.`, 'info');
  };
  document.getElementById('openTermsBtn')?.addEventListener('click', () => showLegalNotice('Términos y Condiciones'));
  document.getElementById('legalTermsBtn')?.addEventListener('click', () => showLegalNotice('Términos y Condiciones'));
  document.getElementById('legalPrivacyBtn')?.addEventListener('click', () => showLegalNotice('Políticas de Privacidad'));
});
