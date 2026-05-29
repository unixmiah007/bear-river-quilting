import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../api.js';
import PageLoading from '../components/PageLoading.jsx';

export default function AdminPageProducts() {
  const { id } = useParams();
  const pageId = Number(id);
  const [pageTitle, setPageTitle] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [orderedIds, setOrderedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const pages = await adminApi.pages();
        const p = pages.find((x) => x.id === pageId);
        if (!p) {
          setError('Page not found.');
          return;
        }
        if (!cancelled) setPageTitle(p.title);
        const [products, assigned] = await Promise.all([
          adminApi.products(),
          adminApi.pageProducts(pageId),
        ]);
        if (cancelled) return;
        setAllProducts(products);
        setOrderedIds(assigned.map((a) => a.id));
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const assignedSet = new Set(orderedIds);
  const available = allProducts.filter((p) => !assignedSet.has(p.id));

  function addProduct(productId) {
    setOrderedIds((ids) => [...ids, productId]);
    setSaved(false);
  }

  function removeAt(index) {
    setOrderedIds((ids) => ids.filter((_, i) => i !== index));
    setSaved(false);
  }

  function move(index, delta) {
    setOrderedIds((ids) => {
      const next = [...ids];
      const j = index + delta;
      if (j < 0 || j >= next.length) return ids;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
    setSaved(false);
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await adminApi.setPageProducts(pageId, orderedIds);
      setSaved(true);
    } catch (e) {
      setError(e.body?.error || e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoading active label="Loading page products…" />;
  }

  if (error && !pageTitle) {
    return (
      <>
        <p className="error">{error}</p>
        <Link className="btn" to="/admin/pages">
          Back to pages
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1 style={{ margin: '0 0 0.25rem' }}>Products on page</h1>
          <p className="muted" style={{ margin: 0 }}>
            {pageTitle} — only <strong>published</strong> items show on the public site.
          </p>
        </div>
        <Link className="btn" to="/admin/pages">
          Back
        </Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {saved ? <p className="muted">Saved.</p> : null}

      <div className="admin-two-col">
        <div>
          <h2>On this page (order)</h2>
          {orderedIds.length === 0 ? (
            <div className="empty">No products linked yet. Add from the right.</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {orderedIds.map((pid, index) => {
                const pr = allProducts.find((p) => p.id === pid);
                const label = pr ? pr.name : `#${pid}`;
                return (
                  <li
                    key={`${pid}-${index}`}
                    className="card"
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>
                      {index + 1}. {label}
                      {pr && !pr.is_published ? (
                        <span className="badge badge-off" style={{ marginLeft: '0.5rem' }}>
                          draft
                        </span>
                      ) : null}
                    </span>
                    <div className="row">
                      <button type="button" className="btn" onClick={() => move(index, -1)} disabled={index === 0}>
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
          <h2>Available products</h2>
          {available.length === 0 ? (
            <div className="empty">All products are already on this page.</div>
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

      <div className="row" style={{ marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save assignments'}
        </button>
      </div>
    </>
  );
}
