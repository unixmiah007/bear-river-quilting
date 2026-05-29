import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api.js';
import PageLoading from '../components/PageLoading.jsx';

const emptyForm = { name: '', slug: '', description: '', sort_order: '0' };

export default function AdminCategories() {
  const [rows, setRows] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [assignId, setAssignId] = useState(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [orderedIds, setOrderedIds] = useState([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignSaved, setAssignSaved] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    const data = await adminApi.productCategories();
    setRows(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [categories, products] = await Promise.all([
          adminApi.productCategories(),
          adminApi.products(),
        ]);
        if (cancelled) return;
        setRows(Array.isArray(categories) ? categories : []);
        setAllProducts(Array.isArray(products) ? products : []);
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openAssign(cat) {
    setAssignId(cat.id);
    setAssignTitle(cat.name);
    setAssignSaved(false);
    setError(null);
    try {
      const assigned = await adminApi.categoryProducts(cat.id);
      setOrderedIds(assigned.map((a) => a.id));
    } catch (e) {
      setError(e.body?.error || e.message);
      setOrderedIds([]);
    }
  }

  function closeAssign() {
    setAssignId(null);
    setAssignTitle('');
    setOrderedIds([]);
    setAssignSaved(false);
  }

  const assignedSet = new Set(orderedIds);
  const available = allProducts.filter((p) => !assignedSet.has(p.id));

  function addProduct(productId) {
    setOrderedIds((ids) => [...ids, productId]);
    setAssignSaved(false);
  }

  function removeAt(index) {
    setOrderedIds((ids) => ids.filter((_, i) => i !== index));
    setAssignSaved(false);
  }

  function move(index, delta) {
    setOrderedIds((ids) => {
      const next = [...ids];
      const j = index + delta;
      if (j < 0 || j >= next.length) return ids;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
    setAssignSaved(false);
  }

  async function saveAssign() {
    if (!assignId) return;
    setAssignSaving(true);
    setError(null);
    setAssignSaved(false);
    try {
      await adminApi.setCategoryProducts(assignId, orderedIds);
      setAssignSaved(true);
    } catch (e) {
      setError(e.body?.error || e.message);
    } finally {
      setAssignSaving(false);
    }
  }

  async function onCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.createProductCategory({
        ...form,
        sort_order: Number(form.sort_order) || 0,
      });
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      sort_order: String(c.sort_order ?? 0),
    });
    closeAssign();
  }

  async function onUpdate(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.updateProductCategory(editingId, {
        ...form,
        sort_order: Number(form.sort_order) || 0,
      });
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this category and remove all product links?')) return;
    setError(null);
    try {
      await adminApi.deleteProductCategory(id);
      if (assignId === id) closeAssign();
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  if (loading) {
    return <PageLoading active label="Loading categories…" />;
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Product categories</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Categories appear in the <strong>Products</strong> navigation dropdown. Assign published
        products so shoppers see them when a category is selected.
      </p>
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Sort</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No categories yet.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <Link to={`/products?category=${encodeURIComponent(c.slug)}`}>{c.slug}</Link>
                  </td>
                  <td className="muted">{c.sort_order}</td>
                  <td>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="btn" onClick={() => openAssign(c)}>
                        Products
                      </button>
                      <button type="button" className="btn" onClick={() => startEdit(c)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => onDelete(c.id)}>
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

      {assignId ? (
        <section className="card" style={{ marginBottom: '2rem' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Products in “{assignTitle}”</h2>
            <button type="button" className="btn" onClick={closeAssign}>
              Close
            </button>
          </div>
          {assignSaved ? <p className="muted">Saved.</p> : null}
          <div className="admin-two-col" style={{ marginTop: '1rem' }}>
            <div>
              <h3 style={{ marginTop: 0 }}>In this category</h3>
              {orderedIds.length === 0 ? (
                <div className="empty">No products assigned. Add from the right.</div>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {orderedIds.map((pid, index) => {
                    const pr = allProducts.find((p) => p.id === pid);
                    return (
                      <li
                        key={`${pid}-${index}`}
                        className="card"
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>
                          {index + 1}. {pr?.name ?? `#${pid}`}
                          {pr && !pr.is_published ? (
                            <span className="badge badge-off" style={{ marginLeft: '0.5rem' }}>
                              draft
                            </span>
                          ) : null}
                        </span>
                        <div className="row">
                          <button
                            type="button"
                            className="btn"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => move(index, 1)}
                            disabled={index === orderedIds.length - 1}
                          >
                            ↓
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => removeAt(index)}>
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <h3 style={{ marginTop: 0 }}>Available products</h3>
              {available.length === 0 ? (
                <div className="empty">All products are in this category.</div>
              ) : (
                <div className="pick-list">
                  {available.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        padding: '0.35rem 0.25rem',
                      }}
                    >
                      <span>
                        {p.name}
                        {!p.is_published ? (
                          <span className="badge badge-off" style={{ marginLeft: '0.35rem' }}>
                            draft
                          </span>
                        ) : null}
                      </span>
                      <button type="button" className="btn btn-primary" onClick={() => addProduct(p.id)}>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="row" style={{ marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-primary" onClick={saveAssign} disabled={assignSaving}>
              {assignSaving ? 'Saving…' : 'Save product assignments'}
            </button>
          </div>
        </section>
      ) : null}

      <h2>{editingId ? 'Edit category' : 'New category'}</h2>
      <form className="form" onSubmit={editingId ? onUpdate : onCreate}>
        <div className="field">
          <label htmlFor="cat-name">Name</label>
          <input
            id="cat-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="cat-slug">Slug (optional)</label>
          <input
            id="cat-slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="Derived from name if empty"
          />
        </div>
        <div className="field">
          <label htmlFor="cat-desc">Description (optional)</label>
          <textarea
            id="cat-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
        </div>
        <div className="field">
          <label htmlFor="cat-sort">Sort order (lower first in nav)</label>
          <input
            id="cat-sort"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
          />
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
              Create category
            </button>
          )}
        </div>
      </form>
    </>
  );
}
