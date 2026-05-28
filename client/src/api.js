const jsonHeaders = { 'Content-Type': 'application/json' };

export async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...jsonHeaders,
      ...options.headers,
    },
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/** Safe for list endpoints that must always be arrays in the UI. */
async function apiJsonArray(path) {
  const data = await api(path);
  return Array.isArray(data) ? data : [];
}

export const publicApi = {
  listPages: () => apiJsonArray('/api/pages'),
  pageBySlug: (slug) => api(`/api/pages/by-slug/${encodeURIComponent(slug)}`),
  listProducts: (categorySlug) => {
    const q = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
    return apiJsonArray(`/api/products${q}`);
  },
  listProductCategories: () => apiJsonArray('/api/product-categories'),
  featuredProducts: () => apiJsonArray('/api/products/featured'),
  bestSellers: () => apiJsonArray('/api/products/best-sellers'),
  productById: (id) => api(`/api/products/${encodeURIComponent(id)}`),
  stripeConfig: () => api('/api/config/stripe'),
  createStripeCheckoutSession: (body) =>
    api('/api/checkout/stripe-session', { method: 'POST', body: JSON.stringify(body) }),
  confirmStripeCheckout: (sessionId) =>
    api(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`),
  customerOrdersLookup: (body) =>
    api('/api/customer/orders', { method: 'POST', body: JSON.stringify(body) }),
  customerOrderMessages: (body) =>
    api('/api/customer/orders/messages', { method: 'POST', body: JSON.stringify(body) }),
  customerOrderMessage: (body) =>
    api('/api/customer/orders/messages/view', { method: 'POST', body: JSON.stringify(body) }),
  customerOrderMessageReply: (body) =>
    api('/api/customer/orders/messages/reply', { method: 'POST', body: JSON.stringify(body) }),
  submitCustomQuiltRequest: (body) =>
    api('/api/custom-quilt-requests', { method: 'POST', body: JSON.stringify(body) }),
};

export const authApi = {
  me: () => api('/api/auth/me'),
  login: (password) =>
    api('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => api('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) }),
};

export const adminApi = {
  pages: () => apiJsonArray('/api/admin/pages'),
  createPage: (body) =>
    api('/api/admin/pages', { method: 'POST', body: JSON.stringify(body) }),
  updatePage: (id, body) =>
    api(`/api/admin/pages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePage: (id) => api(`/api/admin/pages/${id}`, { method: 'DELETE' }),

  products: () => apiJsonArray('/api/admin/products'),
  product: (id) => api(`/api/admin/products/by-id/${encodeURIComponent(id)}`),
  uploadProductImages: async (id, files) => {
    const fd = new FormData();
    for (const f of files) {
      fd.append('images', f);
    }
    const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}/images`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }
    if (!res.ok) {
      const err = new Error(data?.error || res.statusText || 'Upload failed');
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  },
  deleteProductImage: (productId, imageId) =>
    api(
      `/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
      { method: 'DELETE', body: JSON.stringify({}) }
    ),
  addProductImagesFromLibrary: (productId, mediaIds) =>
    api(`/api/admin/products/${encodeURIComponent(productId)}/images/from-library`, {
      method: 'POST',
      body: JSON.stringify({ mediaIds }),
    }),
  mediaLibrary: () => apiJsonArray('/api/admin/media'),
  uploadMediaLibrary: async (files) => {
    const fd = new FormData();
    for (const f of files) {
      fd.append('images', f);
    }
    const res = await fetch('/api/admin/media', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }
    if (!res.ok) {
      const err = new Error(data?.error || res.statusText || 'Upload failed');
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  },
  scanMediaLibrary: () =>
    api('/api/admin/media/scan', { method: 'POST', body: JSON.stringify({}) }),
  deleteMediaLibraryItem: (id) =>
    api(`/api/admin/media/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({}) }),
  seedExampleProducts: () =>
    api('/api/admin/products/seed-examples', { method: 'POST', body: JSON.stringify({}) }),
  importProductsCsv: (csv) =>
    api('/api/admin/products/import', { method: 'POST', body: JSON.stringify({ csv }) }),
  createProduct: (body) =>
    api('/api/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    api(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => api(`/api/admin/products/${id}`, { method: 'DELETE' }),
  productCategoriesForProduct: (productId) =>
    apiJsonArray(`/api/admin/products/${encodeURIComponent(productId)}/categories`),
  setProductCategories: (productId, categoryIds) =>
    api(`/api/admin/products/${encodeURIComponent(productId)}/categories`, {
      method: 'PUT',
      body: JSON.stringify({ categoryIds }),
    }),

  productCategories: () => apiJsonArray('/api/admin/product-categories'),
  createProductCategory: (body) =>
    api('/api/admin/product-categories', { method: 'POST', body: JSON.stringify(body) }),
  updateProductCategory: (id, body) =>
    api(`/api/admin/product-categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProductCategory: (id) => api(`/api/admin/product-categories/${id}`, { method: 'DELETE' }),
  categoryProducts: (categoryId) =>
    apiJsonArray(`/api/admin/product-categories/${categoryId}/products`),
  setCategoryProducts: (categoryId, productIds) =>
    api(`/api/admin/product-categories/${categoryId}/products`, {
      method: 'PUT',
      body: JSON.stringify({ productIds }),
    }),

  pageProducts: (pageId) => apiJsonArray(`/api/admin/pages/${pageId}/products`),
  setPageProducts: (pageId, productIds) =>
    api(`/api/admin/pages/${pageId}/products`, {
      method: 'PUT',
      body: JSON.stringify({ productIds }),
    }),
  orders: () => apiJsonArray('/api/admin/orders'),
  orderById: (id) => api(`/api/admin/orders/${id}`),
  downloadOrderInvoicePdf: async (orderId, orderNumber) => {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/invoice.pdf`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      const err = new Error(data?.error || res.statusText || 'Failed to download invoice');
      err.status = res.status;
      err.body = data;
      throw err;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${String(orderNumber ?? orderId).replace(/[^a-zA-Z0-9-_]+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  updateOrderStatus: (id, status) =>
    api(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  sendOrderTracking: (id, body) =>
    api(`/api/admin/orders/${id}/tracking`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  orderMessages: (orderId) =>
    apiJsonArray(`/api/admin/orders/${encodeURIComponent(orderId)}/messages`),
  orderMessage: (orderId, messageId) =>
    api(
      `/api/admin/orders/${encodeURIComponent(orderId)}/messages/${encodeURIComponent(messageId)}`
    ),
  sendOrderMessage: (orderId, body) =>
    api(`/api/admin/orders/${encodeURIComponent(orderId)}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  orderShippingLabel: (id) => api(`/api/admin/orders/${encodeURIComponent(id)}/shipping-label`),
  updateOrderShippingLabel: (id, body) =>
    api(`/api/admin/orders/${encodeURIComponent(id)}/shipping-label`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  customQuiltRequests: () => apiJsonArray('/api/admin/custom-quilt-requests'),
  setCustomQuiltRequestAcknowledged: (id, acknowledged) =>
    api(`/api/admin/custom-quilt-requests/${encodeURIComponent(id)}/acknowledged`, {
      method: 'PUT',
      body: JSON.stringify({ acknowledged }),
    }),
};
