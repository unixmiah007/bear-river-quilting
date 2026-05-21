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
  listProducts: () => apiJsonArray('/api/products'),
  bestSellers: () => apiJsonArray('/api/products/best-sellers'),
  productById: (id) => api(`/api/products/${encodeURIComponent(id)}`),
  stripeConfig: () => api('/api/config/stripe'),
  createStripeCheckoutSession: (body) =>
    api('/api/checkout/stripe-session', { method: 'POST', body: JSON.stringify(body) }),
  confirmStripeCheckout: (sessionId) =>
    api(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`),
  customerOrdersLookup: (body) =>
    api('/api/customer/orders', { method: 'POST', body: JSON.stringify(body) }),
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
  seedExampleProducts: () =>
    api('/api/admin/products/seed-examples', { method: 'POST', body: JSON.stringify({}) }),
  importProductsCsv: (csv) =>
    api('/api/admin/products/import', { method: 'POST', body: JSON.stringify({ csv }) }),
  createProduct: (body) =>
    api('/api/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    api(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => api(`/api/admin/products/${id}`, { method: 'DELETE' }),

  pageProducts: (pageId) => apiJsonArray(`/api/admin/pages/${pageId}/products`),
  setPageProducts: (pageId, productIds) =>
    api(`/api/admin/pages/${pageId}/products`, {
      method: 'PUT',
      body: JSON.stringify({ productIds }),
    }),
  orders: () => apiJsonArray('/api/admin/orders'),
  orderById: (id) => api(`/api/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    api(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};
