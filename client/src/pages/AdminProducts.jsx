import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api.js';
import { IMAGE_UPLOAD_ACCEPT } from '../lib/prepareUploadImages.js';
import ProductImage from '../components/ProductImage.jsx';
import ProductMediaLibrary from '../components/ProductMediaLibrary.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';
import AdminCustomizeWizardPanel from '../components/AdminCustomizeWizardPanel.jsx';
import PageLoading from '../components/PageLoading.jsx';
import { normalizeRichHtml } from '../lib/richText.js';
import {
  CUSTOMER_SIZE_OPTIONS,
  PRODUCT_SIZE_OPTIONS,
  emptySizePriceForm,
  formatProductPriceRange,
  sizePricesFormToPayload,
  sizePricesFromProduct,
} from '../lib/productSizes.js';

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  size_prices: emptySizePriceForm('0'),
  stock_quantity: '0',
  product_size: '',
  image_url: '',
  is_published: true,
  is_featured: false,
};

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 30, 'all'];

const SORTABLE_COLUMNS = ['sku', 'name', 'size', 'price', 'stock', 'published', 'created_at'];

function getSortValue(product, key) {
  switch (key) {
    case 'sku':
      return (product.sku ?? '').toLowerCase();
    case 'name':
      return (product.name ?? '').toLowerCase();
    case 'size':
      return (product.product_size ?? '').toLowerCase();
    case 'price':
      return Number(product.price) || 0;
    case 'stock':
      return Number(product.stock_quantity) || 0;
    case 'published':
      return product.is_published ? 1 : 0;
    case 'created_at':
      return product.created_at ? new Date(product.created_at).getTime() : 0;
    default:
      return '';
  }
}

function compareProducts(a, b, key, dir) {
  const va = getSortValue(a, key);
  const vb = getSortValue(b, key);
  let cmp = 0;
  if (typeof va === 'number' && typeof vb === 'number') {
    cmp = va - vb;
  } else {
    cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
  }
  if (cmp === 0) cmp = Number(a.id) - Number(b.id);
  return dir === 'asc' ? cmp : -cmp;
}

function SortableTh({ label, column, sortKey, sortDir, onSort }) {
  const active = sortKey === column;
  return (
    <th scope="col">
      <button
        type="button"
        className={`admin-table-sort${active ? ' admin-table-sort--active' : ''}`}
        onClick={() => onSort(column)}
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <span>{label}</span>
        <span className="admin-table-sort__icon" aria-hidden="true">
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

function formatCreatedAt(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

function productSearchText(product) {
  const sizeLabel = product.product_size
    ? PRODUCT_SIZE_OPTIONS.find((o) => o.value === product.product_size)?.label ??
      product.product_size
    : '';
  const published = product.is_published
    ? 'live published yes 1 true'
    : 'draft unpublished no 0 false';
  const featured = product.is_featured ? 'featured spotlight hero yes 1' : 'not featured';
  const parts = [
    product.sku,
    product.name,
    sizeLabel,
    product.product_size,
    String(product.price ?? ''),
    formatPrice(product.price),
    published,
    featured,
  ];
  return parts
    .filter((p) => p != null && String(p).trim() !== '')
    .join(' ')
    .toLowerCase();
}

function productMatchesSearch(product, term) {
  if (!term) return true;
  return productSearchText(product).includes(term);
}

function isInteractiveRowTarget(target) {
  if (!(target instanceof Element)) return false;
  return !!target.closest('a, button, input, select, textarea, label');
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [exportCsvBusy, setExportCsvBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [seedBusy, setSeedBusy] = useState(false);
  const [info, setInfo] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  /** Bumps when gallery is updated locally so stale product GETs cannot overwrite. */
  const gallerySyncGeneration = useRef(0);
  const editSectionRef = useRef(null);
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [formCategoryIds, setFormCategoryIds] = useState([]);

  const filteredRows = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((p) => productMatchesSearch(p, term));
  }, [rows, searchQuery]);

  const sortedRows = useMemo(() => {
    if (!SORTABLE_COLUMNS.includes(sortKey)) return filteredRows;
    return [...filteredRows].sort((a, b) => compareProducts(a, b, sortKey, sortDir));
  }, [filteredRows, sortKey, sortDir]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all' || sortedRows.length === 0) return 1;
    return Math.max(1, Math.ceil(sortedRows.length / pageSize));
  }, [sortedRows.length, pageSize]);

  const paginatedRows = useMemo(() => {
    if (sortedRows.length === 0) return [];
    if (pageSize === 'all') return sortedRows;
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  function handleSort(column) {
    setPage(1);
    if (sortKey === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column);
      setSortDir('asc');
    }
  }

  const listRange = useMemo(() => {
    if (sortedRows.length === 0) return { start: 0, end: 0 };
    if (pageSize === 'all') return { start: 1, end: sortedRows.length };
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, sortedRows.length);
    return { start, end };
  }, [sortedRows.length, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, sortKey, sortDir, searchQuery]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

  const loadNextSku = useCallback(async () => {
    try {
      const data = await adminApi.nextProductSku();
      if (data?.sku) {
        setForm((f) => ({ ...f, sku: data.sku }));
      }
    } catch {
      /* keep current SKU field value */
    }
  }, []);

  async function resetNewProductForm() {
    setEditingId(null);
    setFormCategoryIds([]);
    setGalleryImages([]);
    setForm({ ...emptyForm });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
        const categories = await adminApi.productCategories().catch(() => []);
        if (!cancelled) setAllCategories(Array.isArray(categories) ? categories : []);
      } catch (e) {
        if (!cancelled) {
          setError([e.body?.error, e.body?.hint].filter(Boolean).join(' ') || e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || editingId) return;
    loadNextSku();
  }, [loading, editingId, loadNextSku]);

  useEffect(() => {
    if (!editingId) {
      setFormCategoryIds([]);
      return undefined;
    }
    let cancelled = false;
    adminApi
      .productCategoriesForProduct(editingId)
      .then((rows) => {
        if (!cancelled) {
          setFormCategoryIds((Array.isArray(rows) ? rows : []).map((c) => c.id));
        }
      })
      .catch(() => {
        if (!cancelled) setFormCategoryIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  function toggleCategory(categoryId) {
    setFormCategoryIds((ids) =>
      ids.includes(categoryId) ? ids.filter((id) => id !== categoryId) : [...ids, categoryId]
    );
  }

  async function saveProductCategories(productId) {
    await adminApi.setProductCategories(productId, formCategoryIds);
  }

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
      const pricePayload = sizePricesFormToPayload(form.size_prices);
      const { id } = await adminApi.createProduct({
        ...form,
        ...pricePayload,
        description: normalizeRichHtml(form.description) || null,
        stock_quantity: form.stock_quantity,
        is_published: !!form.is_published,
        is_featured: !!form.is_featured,
      });
      await saveProductCategories(id);
      setEditingId(id);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  const startEdit = useCallback((p) => {
    setEditingId(p.id);
    const prices = sizePricesFromProduct(p);
    setForm({
      sku: p.sku ?? '',
      name: p.name,
      description: p.description ?? '',
      size_prices: Object.fromEntries(
        CUSTOMER_SIZE_OPTIONS.map((o) => [o.value, String(prices[o.value] ?? p.price ?? 0)])
      ),
      stock_quantity: String(p.stock_quantity ?? 0),
      product_size: p.product_size ?? '',
      image_url: p.image_url ?? '',
      is_published: !!p.is_published,
      is_featured: !!p.is_featured,
    });
  }, []);

  useEffect(() => {
    if (!editingId) return undefined;
    const frame = requestAnimationFrame(() => {
      editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [editingId]);

  useEffect(() => {
    if (loading) return;
    const raw = searchParams.get('edit');
    if (raw == null || String(raw).trim() === '') return;
    const editId = Number(raw);
    if (!Number.isFinite(editId) || editId <= 0) {
      setSearchParams(
        (sp) => {
          const n = new URLSearchParams(sp);
          n.delete('edit');
          return n;
        },
        { replace: true }
      );
      return;
    }

    setSearchParams(
      (sp) => {
        const n = new URLSearchParams(sp);
        n.delete('edit');
        return n;
      },
      { replace: true }
    );

    let cancelled = false;
    (async () => {
      try {
        const fromList = rows.find((r) => Number(r.id) === editId);
        const p = fromList ?? (await adminApi.product(editId));
        if (cancelled) return;
        startEdit(p);
      } catch (e) {
        if (cancelled) return;
        setError(
          [e.body?.error, e.body?.hint].filter(Boolean).join(' ') ||
            e.message ||
            'Failed to open product for editing.'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, searchParams, rows, startEdit, setSearchParams]);

  async function onUpdate(e) {
    e.preventDefault();
    setError(null);
    try {
      const pricePayload = sizePricesFormToPayload(form.size_prices);
      await adminApi.updateProduct(editingId, {
        ...form,
        ...pricePayload,
        description: normalizeRichHtml(form.description) || null,
        stock_quantity: form.stock_quantity,
        is_published: !!form.is_published,
        is_featured: !!form.is_featured,
      });
      await saveProductCategories(editingId);
      resetNewProductForm();
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

  function openDeleteConfirm(product) {
    setDeleteTarget({ id: product.id, name: product.name });
  }

  function goToProductDetail(productId, e) {
    if (e && isInteractiveRowTarget(e.target)) return;
    navigate(`/products/${productId}`);
  }

  function closeDeleteConfirm() {
    if (deleteBusy) return;
    setDeleteTarget(null);
  }

  useEffect(() => {
    if (!deleteTarget) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape' && !deleteBusy) setDeleteTarget(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTarget, deleteBusy]);

  async function confirmDeleteProduct() {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      if (editingId === deleteTarget.id) {
        resetNewProductForm();
      }
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function downloadCsvAttachment(url, filename, busyLabel) {
    setError(null);
    setExportCsvBusy(true);
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed?.error || msg;
        } catch {
          /* plain text */
        }
        throw new Error(msg || res.statusText);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.rel = 'noopener';
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err.message || busyLabel);
    } finally {
      setExportCsvBusy(false);
    }
  }

  function downloadCsvTemplate() {
    return downloadCsvAttachment(
      '/api/admin/products/csv-template',
      'products-import-template.csv',
      'Could not download template'
    );
  }

  function downloadProductsCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    return downloadCsvAttachment(
      '/api/admin/products/export.csv',
      `products-export-${stamp}.csv`,
      'Could not download products CSV'
    );
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
    return <PageLoading active label="Loading products…" />;
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Products</h1>
      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="muted">{info}</p> : null}

      <AdminCustomizeWizardPanel />

      <section
        ref={editSectionRef}
        id="admin-product-edit"
        className="admin-product-edit-section"
        aria-labelledby="admin-product-edit-heading"
      >
      <h2 id="admin-product-edit-heading" style={{ marginTop: 0 }}>
        {editingId ? 'Edit product' : 'New product'}
      </h2>
      <form className="form admin-product-form" onSubmit={editingId ? onUpdate : onCreate}>
        <div className="field">
          <label htmlFor="sku">SKU</label>
          <input
            id="sku"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            placeholder={editingId ? 'Unique product code' : 'Auto-generated from database'}
            maxLength={64}
          />
          {!editingId ? (
            <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.82rem' }}>
              Suggested SKU loaded automatically; you can edit it before saving.
            </p>
          ) : null}
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
          <RichTextEditor
            id="description"
            value={form.description}
            onChange={(html) => setForm((f) => ({ ...f, description: html }))}
            placeholder="Product description shown on the storefront"
            minHeight={160}
          />
        </div>
        <fieldset className="admin-size-prices">
          <legend>Prices by size (USD)</legend>
          <p className="muted admin-size-prices__hint">
            Stored in the database per product. Small is also saved as the base catalog price.
          </p>
          <div className="admin-size-prices__grid">
            {CUSTOMER_SIZE_OPTIONS.map((o) => (
              <div className="field" key={o.value}>
                <label htmlFor={`size-price-${o.value}`}>{o.label}</label>
                <input
                  id={`size-price-${o.value}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.size_prices[o.value] ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      size_prices: { ...f.size_prices, [o.value]: e.target.value },
                    }))
                  }
                  required
                />
              </div>
            ))}
          </div>
        </fieldset>
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
          <label htmlFor="product_size">Product size</label>
          <select
            id="product_size"
            value={form.product_size}
            onChange={(e) => setForm((f) => ({ ...f, product_size: e.target.value }))}
          >
            {PRODUCT_SIZE_OPTIONS.map((o) => (
              <option key={o.value || 'none'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
        <div className="field row">
          <input
            id="featured"
            type="checkbox"
            checked={!!form.is_featured}
            onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
          />
          <label
            htmlFor="featured"
            style={{ margin: 0, textTransform: 'none', letterSpacing: 'normal' }}
          >
            Featured (shown in the /products catalog hero — up to 4, published only)
          </label>
        </div>
        <fieldset className="field admin-category-field">
          <legend>Product categories</legend>
          <p className="muted" style={{ margin: '0 0 0.65rem', fontSize: '0.88rem' }}>
            Checked categories include this product in the storefront{' '}
            <strong>Products</strong> menu dropdown and on{' '}
            <code>/products?category=…</code> when published.
          </p>
          {allCategories.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No categories yet.{' '}
              <Link to="/admin/categories">Create product categories</Link>
            </p>
          ) : (
            <div className="admin-category-checks">
              {allCategories.map((c) => (
                <label key={c.id} className="admin-category-check">
                  <input
                    type="checkbox"
                    checked={formCategoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                  />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
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
                  resetNewProductForm();
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

      <section className="card admin-gallery-section" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Product images</h3>
        {editingId ? (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Uploaded images appear on the public product page as a gallery. The first image in the
              list is used as the thumbnail in product listings. You can upload directly, or pick
              from the media gallery below (files are copied into this product&apos;s folder).
            </p>
            <div className="row" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <label className="btn" style={{ cursor: uploadBusy ? 'wait' : 'pointer' }}>
                {uploadBusy ? 'Uploading…' : 'Browse images'}
                <input
                  type="file"
                  accept={IMAGE_UPLOAD_ACCEPT}
                  multiple
                  disabled={uploadBusy}
                  onChange={onGalleryFiles}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {galleryImages.length === 0 ? (
              <p className="muted">
                No images yet. Choose one or more files (JPEG, PNG, WebP, GIF, or iPhone HEIC — saved as
                PNG).
              </p>
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
            Save a new product once (or click Edit on an existing row), then upload images or add them
            from the media gallery below.
          </p>
        )}
        <ProductMediaLibrary
          productId={editingId}
          disabled={uploadBusy}
          onImagesAdded={(images) => {
            gallerySyncGeneration.current += 1;
            setGalleryImages(Array.isArray(images) ? images : []);
            refresh();
          }}
          onError={(msg) => {
            if (msg) setError(msg);
          }}
        />
      </section>
      </section>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Import from CSV</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Download all products as CSV, edit in a spreadsheet, then upload. Required column on import:{' '}
          <strong>name</strong> (or <strong>title</strong>). Use <strong>id</strong> or <strong>sku</strong>{' '}
          to update existing rows; omit <strong>id</strong> for new products. Columns: id, sku, name,
          description, price, stock_quantity, product_size (small, large, x-large, xx-large,
          xxx-large), image_url, is_published (1/0), is_featured (1/0).
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <label className="btn" style={{ cursor: importBusy ? 'wait' : 'pointer' }}>
            {importBusy ? 'Importing…' : 'Choose CSV file'}
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={importBusy || exportCsvBusy}
              onChange={onCsvFile}
              style={{ display: 'none' }}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={downloadProductsCsv}
            disabled={importBusy || exportCsvBusy || rows.length === 0}
          >
            {exportCsvBusy ? 'Preparing…' : 'Download CSV'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={downloadCsvTemplate}
            disabled={importBusy || exportCsvBusy}
          >
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

      {rows.length > 0 ? (
        <div className="field admin-products-search" style={{ marginBottom: '1rem', maxWidth: '32rem' }}>
          <label htmlFor="admin-products-search">Search products</label>
          <input
            id="admin-products-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SKU, name, size, price, published…"
            autoComplete="off"
          />
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="admin-pagination">
          <div className="admin-pagination__size">
            <label htmlFor="admin-products-page-size">Show</label>
            <select
              id="admin-products-page-size"
              value={String(pageSize)}
              onChange={(e) => {
                const v = e.target.value;
                setPageSize(v === 'all' ? 'all' : Number(v));
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={String(n)}>
                  {n === 'all' ? 'All' : n}
                </option>
              ))}
            </select>
            <span className="muted">
              {searchQuery.trim() && filteredRows.length !== rows.length
                ? `${filteredRows.length} of ${rows.length} product${rows.length === 1 ? '' : 's'} match`
                : null}
              {searchQuery.trim() && filteredRows.length !== rows.length ? ' · ' : null}
              {pageSize === 'all'
                ? sortedRows.length === 0
                  ? 'No matching products'
                  : `All ${sortedRows.length} shown`
                : sortedRows.length === 0
                  ? 'No matching products'
                  : `Showing ${listRange.start}–${listRange.end} of ${sortedRows.length}`}
            </span>
          </div>
          {pageSize !== 'all' && totalPages > 1 ? (
            <div className="admin-pagination__nav row">
              <button
                type="button"
                className="btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="muted admin-pagination__status">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="table-wrap admin-products-table" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th scope="col">Image</th>
              <SortableTh
                label="SKU"
                column="sku"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Name"
                column="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Size"
                column="size"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Price"
                column="price"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Stock"
                column="stock"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Published"
                column="published"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Created At"
                column="created_at"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
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
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="muted">
                  No products match your search.
                </td>
              </tr>
            ) : (
              paginatedRows.map((p) => (
                <tr
                  key={p.id}
                  className="admin-product-row--clickable"
                  tabIndex={0}
                  aria-label={`View product: ${p.name}`}
                  onClick={(e) => goToProductDetail(p.id, e)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    goToProductDetail(p.id, e);
                  }}
                >
                  <td>
                    <div className="admin-product-list-thumb">
                      <ProductImage src={p.image_url} alt={p.name} />
                    </div>
                  </td>
                  <td className="muted">{p.sku || '—'}</td>
                  <td>{p.name}</td>
                  <td className="muted">
                    {p.product_size
                      ? PRODUCT_SIZE_OPTIONS.find((o) => o.value === p.product_size)?.label ??
                        p.product_size
                      : '—'}
                  </td>
                  <td>{formatProductPriceRange(p, formatPrice)}</td>
                  <td>{Number(p.stock_quantity ?? 0)}</td>
                  <td>
                    <div className="admin-product-badges">
                      <span className={p.is_published ? 'badge badge-on' : 'badge badge-off'}>
                        {p.is_published ? 'Live' : 'Draft'}
                      </span>
                      {p.is_featured ? (
                        <span className="badge badge-on" style={{ marginLeft: '0.35rem' }}>
                          Featured
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {formatCreatedAt(p.created_at)}
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
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => openDeleteConfirm(p)}
                      >
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

      {deleteTarget ? (
        <div
          className="confirm-dialog-backdrop"
          role="presentation"
          onClick={closeDeleteConfirm}
        >
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            aria-describedby="delete-product-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-product-title" className="confirm-dialog__title">
              Delete product?
            </h2>
            <p id="delete-product-desc" className="muted confirm-dialog__body">
              <strong>{deleteTarget.name}</strong> will be removed permanently. This cannot be
              undone.
            </p>
            <div className="row confirm-dialog__actions">
              <button
                type="button"
                className="btn"
                onClick={closeDeleteConfirm}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteProduct}
                disabled={deleteBusy}
              >
                {deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
