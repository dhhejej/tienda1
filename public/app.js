// State Management
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = [];

// DOM Elements
const productList = document.getElementById('product-list');
const ordersList = document.getElementById('orders-list');
const cartBadge = document.getElementById('cart-badge');
const cartDrawer = document.getElementById('cart-drawer');
const cartToggle = document.getElementById('cart-toggle');
const closeCart = document.getElementById('close-cart');
const drawerOverlay = document.getElementById('drawer-overlay');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const toast = document.getElementById('toast');

const navCatalogBtn = document.getElementById('nav-catalog-btn');
const navOrdersBtn = document.getElementById('nav-orders-btn');
const navAdminBtn = document.getElementById('nav-admin-btn');

// Elementos de la Pasarela de Pago
const paymentModal = document.getElementById('payment-modal');
const closePayment = document.getElementById('close-payment');
const paymentForm = document.getElementById('payment-form');
const cardNumberInput = document.getElementById('card-number');
const cardHolderInput = document.getElementById('card-holder');
const cardExpiryInput = document.getElementById('card-expiry');
const cardCvvInput = document.getElementById('card-cvv');
const previewNumber = document.getElementById('preview-number');
const previewHolder = document.getElementById('preview-holder');
const previewExpiry = document.getElementById('preview-expiry');
const payNowBtn = document.getElementById('pay-now-btn');

const catalogView = document.getElementById('catalog-view');
const ordersView = document.getElementById('orders-view');
const adminView = document.getElementById('admin-view');

const addProductForm = document.getElementById('add-product-form');
const inventoryList = document.getElementById('inventory-list');


// Fetch Catalog
async function fetchCatalog() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    renderCatalog();
    renderInventory();
    updateCartUI();
  } catch (err) {
    showToast('Error cargando los productos');
    console.error(err);
  }
}

// Fetch Orders
async function fetchOrders() {
  try {
    const res = await fetch('/api/orders');
    orders = await res.json();
    renderOrders();
  } catch (err) {
    showToast('Error cargando el historial de órdenes');
    console.error(err);
  }
}

// Render Products Catalog
function renderCatalog() {
  productList.innerHTML = '';
  products.forEach(p => {
    const inCartQty = getCartItemQty(p.id);
    const availableStock = p.stock - inCartQty;
    const isOutOfStock = availableStock <= 0;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-info">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="product-desc">${escapeHtml(p.description)}</p>
        <div class="product-meta">
          <span class="product-price">$${p.price.toLocaleString('es-MX')} MXN</span>
          <span class="stock-status ${p.stock > 0 ? 'stock-in' : 'stock-out'}">
            ${p.stock > 0 ? `Stock: ${p.stock}` : 'Agotado'}
          </span>
        </div>
      </div>
      <button class="add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart('${p.id}')">
        ${isOutOfStock ? 'Sin Stock' : 'Añadir al Carrito'}
      </button>
    `;
    productList.appendChild(card);
  });
}

// Helper to escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Get item quantity currently in cart
function getCartItemQty(productId) {
  const item = cart.find(item => item.productId === productId);
  return item ? item.quantity : 0;
}

// Add Item to Cart
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const cartItem = cart.find(item => item.productId === productId);
  const currentQty = cartItem ? cartItem.quantity : 0;

  if (currentQty >= product.stock) {
    showToast(`No hay suficiente stock de ${product.name}`);
    return;
  }

  if (cartItem) {
    cartItem.quantity++;
  } else {
    cart.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  renderCatalog();
  showToast(`Añadido: ${product.name}`);
}

// Remove/Decrease quantity in cart
function decreaseCartQty(productId) {
  const cartItem = cart.find(item => item.productId === productId);
  if (!cartItem) return;

  cartItem.quantity--;
  if (cartItem.quantity <= 0) {
    cart = cart.filter(item => item.productId !== productId);
  }

  saveCart();
  updateCartUI();
  renderCatalog();
}

// Increase quantity in cart
function increaseCartQty(productId) {
  const product = products.find(p => p.id === productId);
  const cartItem = cart.find(item => item.productId === productId);
  if (!product || !cartItem) return;

  if (cartItem.quantity >= product.stock) {
    showToast(`Límite de stock alcanzado para ${product.name}`);
    return;
  }

  cartItem.quantity++;
  saveCart();
  updateCartUI();
  renderCatalog();
}

// Save Cart to LocalStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Update Cart Badge and Drawer UI
function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.innerText = totalItems;

  cartItemsContainer.innerHTML = '';
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart-message"><p>Tu carrito está vacío</p></div>';
    checkoutBtn.disabled = true;
    cartSubtotal.innerText = '$0.00';
    cartTotal.innerText = '$0.00';
    return;
  }

  checkoutBtn.disabled = false;
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div class="cart-item-info">
        <h4>${escapeHtml(item.productName)}</h4>
        <p>$${item.price.toLocaleString('es-MX')} MXN c/u • $${itemTotal.toLocaleString('es-MX')} MXN</p>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" onclick="decreaseCartQty('${item.productId}')">-</button>
        <span class="qty-val">${item.quantity}</span>
        <button class="qty-btn" onclick="increaseCartQty('${item.productId}')">+</button>
        <button class="remove-item-btn" onclick="removeFromCart('${item.productId}')">&times;</button>
      </div>
    `;
    cartItemsContainer.appendChild(itemEl);
  });

  cartSubtotal.innerText = `$${subtotal.toLocaleString('es-MX')} MXN`;
  cartTotal.innerText = `$${subtotal.toLocaleString('es-MX')} MXN`;
}

// Render Orders History
function renderOrders() {
  ordersList.innerHTML = '';
  if (orders.length === 0) {
    ordersList.innerHTML = '<div class="no-orders-message"><p>No has realizado ninguna compra todavía.</p></div>';
    return;
  }

  orders.forEach(o => {
    const dateStr = new Date(o.createdAt).toLocaleString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const card = document.createElement('div');
    card.className = 'order-card';
    
    let itemsHtml = '';
    o.items.forEach(item => {
      itemsHtml += `
        <div class="order-item-row">
          <span><span class="order-item-qty">${item.quantity}x</span> ${escapeHtml(item.productName)}</span>
          <span>$${(item.price * item.quantity).toLocaleString('es-MX')} MXN</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="order-header">
        <div>
          <span class="order-title">Orden #${o.id.substring(6)}</span>
          <div class="order-date">${dateStr}</div>
        </div>
        <span class="order-status-badge">${o.status}</span>
      </div>
      <div class="order-items-list">
        ${itemsHtml}
      </div>
      <div class="order-total-row">
        <span>Total Pagado</span>
        <span>$${o.total.toLocaleString('es-MX')} MXN</span>
      </div>
    `;
    ordersList.appendChild(card);
  });
}

// Open/Close Cart Drawer
function toggleCartDrawer(open) {
  if (open) {
    cartDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
  } else {
    cartDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  }
}

// Open/Close Payment Modal
function togglePaymentModal(open) {
  if (open) {
    paymentModal.classList.add('open');
    drawerOverlay.classList.add('open');
    
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    payNowBtn.innerText = `Pagar $${subtotal.toLocaleString('es-MX')} MXN y Confirmar Compra`;
  } else {
    paymentModal.classList.remove('open');
    drawerOverlay.classList.remove('open');
    paymentForm.reset();
    resetCardPreview();
  }
}

function resetCardPreview() {
  previewNumber.innerText = '•••• •••• •••• ••••';
  previewHolder.innerText = 'NOMBRE COMPLETO';
  previewExpiry.innerText = 'MM/AA';
}

// Confirm Purchase / Redirect to Stripe Checkout
async function checkout() {
  if (cart.length === 0) return;

  checkoutBtn.disabled = true;
  checkoutBtn.innerText = 'Redirigiendo a Stripe... 💳';

  try {
    const res = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al iniciar el pago.');
    }

    // Redirigir a la pasarela segura de Stripe
    window.location.href = data.url;
  } catch (err) {
    showToast(err.message || 'Error al iniciar pasarela de pagos.');
    console.error(err);
    checkoutBtn.innerText = 'Confirmar Compra';
    checkoutBtn.disabled = false;
  }
}


// Process Simulated Payment and Submit Order
async function processPayment(e) {
  e.preventDefault();

  const cardNumber = cardNumberInput.value.replace(/\s/g, '');
  const cardHolder = cardHolderInput.value.trim();
  const cardExpiry = cardExpiryInput.value.trim();
  const cardCvv = cardCvvInput.value.trim();

  if (cardNumber.length !== 16 || isNaN(cardNumber)) {
    showToast('El número de tarjeta debe tener 16 dígitos');
    return;
  }
  if (!cardHolder) {
    showToast('Ingresa el nombre del titular');
    return;
  }
  if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
    showToast('Fecha de expiración inválida (MM/AA)');
    return;
  }
  if (cardCvv.length !== 3 || isNaN(cardCvv)) {
    showToast('El CVV debe tener 3 dígitos');
    return;
  }

  payNowBtn.disabled = true;
  payNowBtn.innerText = 'Procesando Pago... 🔒';

  setTimeout(async () => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error procesando la orden');
      }

      showToast('¡Pago Procesado y Compra Realizada con Éxito!');
      cart = [];
      saveCart();
      updateCartUI();
      togglePaymentModal(false);
      
      await fetchCatalog();
      switchView('orders');
    } catch (err) {
      showToast(err.message || 'Error al procesar el pago');
      console.error(err);
    } finally {
      payNowBtn.innerText = 'Pagar y Confirmar Compra';
      payNowBtn.disabled = false;
    }
  }, 1500);
}

// Remove item completely from cart
function removeFromCart(productId) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;

  cart = cart.filter(i => i.productId !== productId);
  saveCart();
  updateCartUI();
  renderCatalog();
  showToast(`Removido del carrito: ${item.productName}`);
}

// Show Toast Alert
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  toast.innerText = message;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Switch SPA views
function switchView(viewName) {
  navCatalogBtn.classList.remove('active');
  navOrdersBtn.classList.remove('active');
  navAdminBtn.classList.remove('active');
  catalogView.classList.remove('active');
  ordersView.classList.remove('active');
  adminView.classList.remove('active');

  if (viewName === 'catalog') {
    navCatalogBtn.classList.add('active');
    catalogView.classList.add('active');
    fetchCatalog();
  } else if (viewName === 'orders') {
    navOrdersBtn.classList.add('active');
    ordersView.classList.add('active');
    fetchOrders();
  } else if (viewName === 'admin') {
    navAdminBtn.classList.add('active');
    adminView.classList.add('active');
    fetchCatalog();
  }
}

// Event Listeners
cartToggle.addEventListener('click', () => toggleCartDrawer(true));
closeCart.addEventListener('click', () => toggleCartDrawer(false));
drawerOverlay.addEventListener('click', () => {
  toggleCartDrawer(false);
  togglePaymentModal(false);
});
checkoutBtn.addEventListener('click', checkout);
closePayment.addEventListener('click', () => togglePaymentModal(false));
paymentForm.addEventListener('submit', processPayment);

// Formateadores e Interactividad de la Tarjeta de Crédito
cardNumberInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  let formatted = '';
  for (let i = 0; i < value.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += ' ';
    }
    formatted += value[i];
  }
  e.target.value = formatted;
  previewNumber.innerText = formatted || '•••• •••• •••• ••••';
});

cardHolderInput.addEventListener('input', (e) => {
  let value = e.target.value.toUpperCase();
  e.target.value = value;
  previewHolder.innerText = value || 'NOMBRE COMPLETO';
});

cardExpiryInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  e.target.value = value;
  previewExpiry.innerText = value || 'MM/AA';
});

cardCvvInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '');
});

navCatalogBtn.addEventListener('click', () => switchView('catalog'));
navOrdersBtn.addEventListener('click', () => switchView('orders'));
navAdminBtn.addEventListener('click', () => switchView('admin'));
addProductForm.addEventListener('submit', handleAddProductSubmit);

// Render Inventory in Admin Panel
function renderInventory() {
  inventoryList.innerHTML = '';
  if (products.length === 0) {
    inventoryList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">No hay productos registrados</td></tr>';
    return;
  }
  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${escapeHtml(p.id)}</code></td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>$${p.price.toLocaleString('es-MX')} MXN</td>
      <td>${p.stock} uds</td>
      <td>
        <button class="delete-btn" onclick="deleteProduct('${p.id}')">Eliminar</button>
      </td>
    `;
    inventoryList.appendChild(tr);
  });
}

// Delete Product
async function deleteProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (!confirm(`¿Estás seguro de que deseas eliminar "${product.name}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al eliminar el producto');
    }

    showToast('Producto eliminado exitosamente');
    
    // Quitar del carrito si existía
    cart = cart.filter(item => item.productId !== productId);
    saveCart();

    await fetchCatalog();
  } catch (err) {
    showToast(err.message || 'Error al eliminar el producto');
    console.error(err);
  }
}

// Add Product Form Submit Handler
async function handleAddProductSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('prod-id').value.trim();
  const name = document.getElementById('prod-name').value.trim();
  const description = document.getElementById('prod-desc').value.trim();
  const price = Number(document.getElementById('prod-price').value);
  const stock = Number(document.getElementById('prod-stock').value);

  if (!id || !name || price <= 0 || stock < 0) {
    showToast('Por favor completa todos los campos correctamente');
    return;
  }

  if (products.some(p => p.id === id)) {
    showToast(`El ID "${id}" ya está en uso.`);
    return;
  }

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, name, description, price, stock })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al guardar el producto');
    }

    showToast('Producto creado con éxito');
    addProductForm.reset();
    
    await fetchCatalog();
  } catch (err) {
    showToast(err.message || 'Error al guardar el producto');
    console.error(err);
  }
}

// Global exposure for HTML click handlers
window.addToCart = addToCart;
window.decreaseCartQty = decreaseCartQty;
window.increaseCartQty = increaseCartQty;
window.deleteProduct = deleteProduct;
window.removeFromCart = removeFromCart;

// Init
fetchCatalog();
