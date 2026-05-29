import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api.js';
import RichTextEditor from '../components/RichTextEditor.jsx';
import { normalizeRichHtml } from '../lib/richText.js';

const emptyForm = { title: '', slug: '', body: '' };
const PRODUCT_DRAG_TYPE = 'application/x-brq-product-id';
const REORDER_DRAG_TYPE = 'application/x-brq-page-product-index';

function moveItem(list, fromIndex, toIndex) {
  if (fromIndex === toIndex) return list;
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function AdminPages() {
  const [rows, setRows] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [builderTitle, setBuilderTitle] = useState('');
  const [builderSlug, setBuilderSlug] = useState('');
  const [builderBody, setBuilderBody] = useState('');
  const [draftProductIds, setDraftProductIds] = useState([]);
  const [builderBusy, setBuilderBusy] = useState(false);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [productFilter, setProductFilter] = useState('');

  const refresh = useCallback(async () => {
    setError(null);
    const data = await adminApi.pages();
    setRows(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pages, products] = await Promise.all([adminApi.pages(), adminApi.products()]);
        if (cancelled) return;
        setRows(Array.isArray(pages) ? pages : []);
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

  const productById = useMemo(() => {
    const map = new Map();
    for (const p of allProducts) map.set(p.id, p);
    return map;
  }, [allProducts]);

  const filteredPalette = useMemo(() => {
    const term = productFilter.trim().toLowerCase();
    if (!term) return allProducts;
    return allProducts.filter((p) => {
      const hay = [p.name, p.sku, p.description].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [allProducts, productFilter]);

  function readDraggedProductId(e) {
    const raw = e.dataTransfer.getData(PRODUCT_DRAG_TYPE);
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function addProductToDraft(productId) {
    setDraftProductIds((ids) => (ids.includes(productId) ? ids : [...ids, productId]));
  }

  function onPaletteDragStart(e, productId) {
    e.dataTransfer.setData(PRODUCT_DRAG_TYPE, String(productId));
    e.dataTransfer.effectAllowed = 'copyMove';
  }

  function onDropZoneDragOver(e) {
    if (e.dataTransfer.types.includes(PRODUCT_DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDropZoneActive(true);
    }
  }

  function onDropZoneDragLeave() {
    setDropZoneActive(false);
  }

  function onDropZoneDrop(e) {
    e.preventDefault();
    setDropZoneActive(false);
    const productId = readDraggedProductId(e);
    if (productId) addProductToDraft(productId);
  }

  function onChipDragStart(e, index) {
    e.dataTransfer.setData(REORDER_DRAG_TYPE, String(index));
    e.dataTransfer.effectAllowed = 'move';
  }

  function onChipDragOver(e) {
    if (e.dataTransfer.types.includes(REORDER_DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function onChipDrop(e, toIndex) {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData(REORDER_DRAG_TYPE);
    if (raw === '') return;
    const fromIndex = Number(raw);
    if (!Number.isFinite(fromIndex)) return;
    setDraftProductIds((ids) => moveItem(ids, fromIndex, toIndex));
  }

  async function onCreateFromBuilder(e) {
    e.preventDefault();
    if (!builderTitle.trim()) {
      setError('Page title is required.');
      return;
    }
    if (draftProductIds.length === 0) {
      setError('Drag at least one product into the page area.');
      return;
    }
    setBuilderBusy(true);
    setError(null);
    try {
      const created = await adminApi.createPage({
        title: builderTitle.trim(),
        slug: builderSlug.trim() || undefined,
        body: normalizeRichHtml(builderBody) || undefined,
      });
      await adminApi.setPageProducts(created.id, draftProductIds);
      setBuilderTitle('');
      setBuilderSlug('');
      setBuilderBody('');
      setDraftProductIds([]);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setBuilderBusy(false);
    }
  }

  async function onCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.createPage({
        ...form,
        body: normalizeRichHtml(form.body) || undefined,
      });
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
      await adminApi.updatePage(editingId, {
        ...form,
        body: normalizeRichHtml(form.body) || undefined,
      });
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

      <section className="card admin-page-builder" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>Build a page from products</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Drag products into the page area, set a title, then create. The title becomes a link in
          the site footer <strong>below</strong> the main footer navigation (not in the header).
        </p>

        <div className="admin-two-col admin-page-builder__cols">
          <div>
            <h3 className="admin-page-builder__subhead">Products</h3>
            <div className="field" style={{ marginBottom: '0.65rem' }}>
              <label htmlFor="palette-filter">Filter</label>
              <input
                id="palette-filter"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                placeholder="Name or SKU"
              />
            </div>
            <div className="admin-dnd-palette pick-list" role="list">
              {filteredPalette.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  No products match.
                </p>
              ) : (
                filteredPalette.map((p) => (
                  <div
                    key={p.id}
                    role="listitem"
                    className="admin-dnd-palette__item"
                    draggable
                    onDragStart={(e) => onPaletteDragStart(e, p.id)}
                  >
                    <span className="admin-dnd-palette__grip" aria-hidden="true">
                      ⋮⋮
                    </span>
                    <span className="admin-dnd-palette__label">
                      {p.name}
                      {p.sku ? (
                        <span className="muted" style={{ marginLeft: '0.35rem' }}>
                          ({p.sku})
                        </span>
                      ) : null}
                      {!p.is_published ? (
                        <span className="badge badge-off" style={{ marginLeft: '0.35rem' }}>
                          draft
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => addProductToDraft(p.id)}
                      disabled={draftProductIds.includes(p.id)}
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="admin-page-builder__subhead">Page</h3>
            <div
              className={`admin-dnd-dropzone${dropZoneActive ? ' admin-dnd-dropzone--active' : ''}`}
              onDragOver={onDropZoneDragOver}
              onDragLeave={onDropZoneDragLeave}
              onDrop={onDropZoneDrop}
            >
              {draftProductIds.length === 0 ? (
                <p className="muted admin-dnd-dropzone__hint">
                  Drop products here to include them on this page.
                </p>
              ) : (
                <ul className="admin-dnd-chips">
                  {draftProductIds.map((pid, index) => {
                    const pr = productById.get(pid);
                    return (
                      <li
                        key={`${pid}-${index}`}
                        className="admin-dnd-chip"
                        draggable
                        onDragStart={(e) => onChipDragStart(e, index)}
                        onDragOver={onChipDragOver}
                        onDrop={(e) => onChipDrop(e, index)}
                      >
                        <span className="admin-dnd-palette__grip" aria-hidden="true">
                          ⋮⋮
                        </span>
                        <span>{pr?.name ?? `Product #${pid}`}</span>
                        <button
                          type="button"
                          className="btn btn-danger"
                          aria-label="Remove from page"
                          onClick={() =>
                            setDraftProductIds((ids) => ids.filter((_, i) => i !== index))
                          }
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <form className="form admin-page-builder__form" onSubmit={onCreateFromBuilder} style={{ marginTop: '1rem' }}>
              <div className="field">
                <label htmlFor="builder-title">Title (footer link label)</label>
                <input
                  id="builder-title"
                  value={builderTitle}
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  placeholder="e.g. Summer collection"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="builder-slug">Slug (optional)</label>
                <input
                  id="builder-slug"
                  value={builderSlug}
                  onChange={(e) => setBuilderSlug(e.target.value)}
                  placeholder="Derived from title if empty"
                />
              </div>
              <div className="field">
                <label htmlFor="builder-body">Intro text (optional)</label>
                <RichTextEditor
                  id="builder-body"
                  value={builderBody}
                  onChange={setBuilderBody}
                  placeholder="Intro copy shown above products on the public page"
                  disabled={builderBusy}
                  minHeight={120}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={builderBusy}>
                {builderBusy ? 'Creating…' : 'Create page'}
              </button>
            </form>
          </div>
        </div>
      </section>

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

      <h2>{editingId ? 'Edit page' : 'New page (text only)'}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Use the builder above to attach products. This form creates or edits page copy only.
      </p>
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
          <label htmlFor="body">Intro / body text</label>
          <RichTextEditor
            id="body"
            value={form.body}
            onChange={(html) => setForm((f) => ({ ...f, body: html }))}
            placeholder="Formatted intro shown on the public page"
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
