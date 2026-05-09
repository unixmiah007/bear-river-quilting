import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api.js';

const emptyForm = { title: '', slug: '', body: '' };

export default function AdminPages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function refresh() {
    setError(null);
    const data = await adminApi.pages();
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
      await adminApi.createPage(form);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ title: p.title, slug: p.slug, body: p.body ?? '' });
  }

  async function onUpdate(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.updatePage(editingId, form);
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this page and its product links?')) return;
    setError(null);
    try {
      await adminApi.deletePage(id);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  if (loading) {
    return <p className="muted">Loading pages…</p>;
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Pages</h1>
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No pages yet.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>
                    <Link to={`/p/${p.slug}`}>{p.slug}</Link>
                  </td>
                  <td className="muted">{new Date(p.updated_at).toLocaleString()}</td>
                  <td>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <Link className="btn" to={`/admin/pages/${p.id}/products`}>
                        Products
                      </Link>
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

      <h2>{editingId ? 'Edit page' : 'New page'}</h2>
      <form className="form" onSubmit={editingId ? onUpdate : onCreate}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="slug">Slug (optional, derived from title if empty)</label>
          <input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="e.g. summer-sale"
          />
        </div>
        <div className="field">
          <label htmlFor="body">Body</label>
          <textarea
            id="body"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
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
              Create page
            </button>
          )}
        </div>
      </form>
    </>
  );
}
