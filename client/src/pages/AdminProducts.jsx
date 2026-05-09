import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';

const emptyForm = {
  name: '',
  description: '',
  price: '0',
  image_url: '',
  is_published: false,
};

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function refresh() {
    setError(null);
    const data = await adminApi.products();
    setRows(data);
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.body?.error || e.message))
      .finally(() => setLoading(false));
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.createProduct({
        ...form,
        price: form.price,
        is_published: !!form.is_published,
      });
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      image_url: p.image_url ?? '',
      is_published: !!p.is_published,
    });
  }

  async function onUpdate(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.updateProduct(editingId, {
        ...form,
        price: form.price,
        is_published: !!form.is_published,
      });
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    setError(null);
    try {
      await adminApi.deleteProduct(id);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  if (loading) {
    return <p className="muted">Loading products…</p>;
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Products</h1>
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Published</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No products yet.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>
                    <span className={p.is_published ? 'badge badge-on' : 'badge badge-off'}>
                      {p.is_published ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="btn" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => onDelete(p.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2>{editingId ? 'Edit product' : 'New product'}</h2>
      <form className="form" onSubmit={editingId ? onUpdate : onCreate}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="price">Price (USD)</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="image_url">Image URL</label>
          <input
            id="image_url"
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            placeholder="https://…"
          />
        </div>
        <div className="field row">
          <input
            id="pub"
            type="checkbox"
            checked={!!form.is_published}
            onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
          />
          <label htmlFor="pub" style={{ margin: 0, textTransform: 'none', letterSpacing: 'normal' }}>
            Published (visible on public pages when linked)
          </label>
        </div>
        <div className="row">
          {editingId ? (
            <>
              <button type="submit" className="btn btn-primary">
                Save changes
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button type="submit" className="btn btn-primary">
              Create product
            </button>
          )}
        </div>
      </form>
    </>
  );
}
