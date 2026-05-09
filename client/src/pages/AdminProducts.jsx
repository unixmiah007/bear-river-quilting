import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api.js';

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  price: '0',
  stock_quantity: '0',
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
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [seedBusy, setSeedBusy] = useState(false);
  const [info, setInfo] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  /** Bumps when gallery is updated locally so stale product GETs cannot overwrite. */
  const gallerySyncGeneration = useRef(0);

  useEffect(() => {
    if (!editingId) {
      setGalleryImages([]);
      return undefined;
    }
    gallerySyncGeneration.current += 1;
    const generation = gallerySyncGeneration.current;
    let cancelled = false;
    adminApi
      .product(editingId)
      .then((data) => {
        if (cancelled || generation !== gallerySyncGeneration.current) return;
        setGalleryImages(Array.isArray(data.images) ? data.images : []);
      })
      .catch(() => {
        if (cancelled || generation !== gallerySyncGeneration.current) return;
        setGalleryImages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  async function refresh() {
    setError(null);
    const data = await adminApi.products();
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    refresh()
      .catch((e) =>
        setError([e.body?.error, e.body?.hint].filter(Boolean).join(' ') || e.message)
      )
      .finally(() => setLoading(false));
  }, []);

  async function loadExamples() {
    setError(null);
    setInfo(null);
    setSeedBusy(true);
    try {
      const r = await adminApi.seedExampleProducts();
      setInfo(`Database now has ${r.productCount} product row(s).`);
      await refresh();
    } catch (e) {
      setError([e.body?.error, e.body?.hint].filter(Boolean).join(' ') || e.message);
    } finally {
      setSeedBusy(false);
    }
  }

  async function onCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const { id } = await adminApi.createProduct({
        ...form,
        price: form.price,
        stock_quantity: form.stock_quantity,
        is_published: !!form.is_published,
      });
      setEditingId(id);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      sku: p.sku ?? '',
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      stock_quantity: String(p.stock_quantity ?? 0),
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
        stock_quantity: form.stock_quantity,
        is_published: !!form.is_published,
      });
      setEditingId(null);
      setForm(emptyForm);
      setGalleryImages([]);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onGalleryFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !editingId) return;
    setError(null);
    setUploadBusy(true);
    try {
      const data = await adminApi.uploadProductImages(editingId, files);
      gallerySyncGeneration.current += 1;
      setGalleryImages(Array.isArray(data.images) ? data.images : []);
      await refresh();
    } catch (err) {
      setError(
        [err.body?.error, err.body?.hint, err.body?.detail].filter(Boolean).join(' — ') ||
          err.message
      );
    } finally {
      setUploadBusy(false);
    }
  }

  async function removeGalleryImage(imageId) {
    if (!editingId) return;
    setError(null);
    try {
      await adminApi.deleteProductImage(editingId, imageId);
      gallerySyncGeneration.current += 1;
      setGalleryImages((imgs) => imgs.filter((i) => i.id !== imageId));
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

  async function downloadCsvTemplate() {
    setError(null);
    try {
      const res = await fetch('/api/admin/products/csv-template', { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-import-template.csv';
      a.rel = 'noopener';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Could not download template');
    }
  }

  async function onCsvFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setImportResult(null);
    setImportBusy(true);
    try {
      const csv = await file.text();
      const result = await adminApi.importProductsCsv(csv);
      setImportResult(result);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setImportBusy(false);
    }
  }

  if (loading) {
    return <p className="muted">Loading products…</p>;
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Products</h1>
      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="muted">{info}</p> : null}

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Import from CSV</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Upload a spreadsheet exported as CSV. Required column: <strong>name</strong> (or{' '}
          <strong>title</strong>). Use <strong>sku</strong> to create new rows or update existing
          products with the same SKU. Use numeric <strong>id</strong> to update a specific product.
          Optional: description, price, stock_quantity (or stock / quantity / available), image_url
          (or image), is_published (1/0, yes/no).
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <label className="btn" style={{ cursor: importBusy ? 'wait' : 'pointer' }}>
            {importBusy ? 'Importing…' : 'Choose CSV file'}
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={importBusy}
              onChange={onCsvFile}
              style={{ display: 'none' }}
            />
          </label>
          <button type="button" className="btn" onClick={downloadCsvTemplate} disabled={importBusy}>
            Download template
          </button>
        </div>
        {importResult ? (
          <div style={{ marginTop: '1rem' }}>
            <p>
              <strong>{importResult.created}</strong> created,{' '}
              <strong>{importResult.updated}</strong> updated.
            </p>
            {importResult.errors?.length > 0 ? (
              <div className="table-wrap" style={{ marginTop: '0.5rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>SKU</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.errors.map((err, i) => (
                      <tr key={i}>
                        <td>{err.line}</td>
                        <td>{err.sku ?? '—'}</td>
                        <td>{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Published</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <p className="muted" style={{ marginBottom: '0.75rem' }}>
                    No products in the database yet. Use the button below to add the demo quilt
                    catalog (50 handmade placeholders, published), or run{' '}
                    <code style={{ fontSize: '0.85em' }}>npm run db:bootstrap-products -w server</code>{' '}
                    from the project root.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={seedBusy}
                    onClick={loadExamples}
                  >
                    {seedBusy ? 'Loading…' : 'Load example products'}
                  </button>
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td className="muted">{p.sku || '—'}</td>
                  <td>{p.name}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{Number(p.stock_quantity ?? 0)}</td>
                  <td>
                    <span className={p.is_published ? 'badge badge-on' : 'badge badge-off'}>
                      {p.is_published ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <Link
                        className="btn"
                        to={`/products/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={
                          p.is_published
                            ? 'Open public product page in a new tab'
                            : 'Draft: public page may not load until the product is published'
                        }
                      >
                        View product
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

      <h2>{editingId ? 'Edit product' : 'New product'}</h2>
      <form className="form" onSubmit={editingId ? onUpdate : onCreate}>
        <div className="field">
          <label htmlFor="sku">SKU</label>
          <input
            id="sku"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            placeholder="Optional, unique"
            maxLength={64}
          />
        </div>
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
          <label htmlFor="stock_quantity">Stock (available)</label>
          <input
            id="stock_quantity"
            type="number"
            min="0"
            step="1"
            value={form.stock_quantity}
            onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="image_url">Image URL (optional)</label>
          <input
            id="image_url"
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            placeholder="External https://… or leave empty if you use uploads"
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
                  setGalleryImages([]);
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

      <section className="card admin-gallery-section" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Product images</h3>
        {editingId ? (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Uploaded images appear on the public product page as a gallery. The first image in the
              list is used as the thumbnail in product listings.
            </p>
            <div className="row" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <label className="btn" style={{ cursor: uploadBusy ? 'wait' : 'pointer' }}>
                {uploadBusy ? 'Uploading…' : 'Browse images'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadBusy}
                  onChange={onGalleryFiles}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {galleryImages.length === 0 ? (
              <p className="muted">No images yet. Choose one or more files (JPEG, PNG, WebP, GIF).</p>
            ) : (
              <div className="admin-gallery-strip">
                {galleryImages.map((img) => (
                  <div key={img.id} className="admin-gallery-thumb">
                    <img src={img.url} alt="" />
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeGalleryImage(img.id)}
                      disabled={uploadBusy}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="muted" style={{ marginTop: 0 }}>
            Save a new product once (or click Edit on an existing row), then use Browse images to
            add photos stored on the server and linked in the database.
          </p>
        )}
      </section>
    </>
  );
}
