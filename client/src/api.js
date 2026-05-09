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

export const publicApi = {
  listPages: () => api('/api/pages'),
  pageBySlug: (slug) => api(`/api/pages/by-slug/${encodeURIComponent(slug)}`),
};

export const authApi = {
  me: () => api('/api/auth/me'),
  login: (password) =>
    api('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => api('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) }),
};

export const adminApi = {
  pages: () => api('/api/admin/pages'),
  createPage: (body) =>
    api('/api/admin/pages', { method: 'POST', body: JSON.stringify(body) }),
  updatePage: (id, body) =>
    api(`/api/admin/pages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePage: (id) => api(`/api/admin/pages/${id}`, { method: 'DELETE' }),

  products: () => api('/api/admin/products'),
  createProduct: (body) =>
    api('/api/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    api(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => api(`/api/admin/products/${id}`, { method: 'DELETE' }),

  pageProducts: (pageId) => api(`/api/admin/pages/${pageId}/products`),
  setPageProducts: (pageId, productIds) =>
    api(`/api/admin/pages/${pageId}/products`, {
      method: 'PUT',
      body: JSON.stringify({ productIds }),
    }),
};
