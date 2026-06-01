import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminSectionTitle from './AdminSectionTitle.jsx';
import { EmailBlastIcon } from './AdminSectionIcons.jsx';
import ProductImage from '../ProductImage.jsx';
import { formatProductPriceRange } from '../../lib/productSizes.js';
import { stripRichHtml } from '../../lib/richText.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

function formatBlastTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function AdminProductEmailBlast({ products, editingId }) {
  const [productId, setProductId] = useState('');
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [products]
  );

  const selectedProduct = useMemo(
    () => sortedProducts.find((p) => String(p.id) === String(productId)),
    [sortedProducts, productId]
  );

  useEffect(() => {
    if (editingId) {
      setProductId(String(editingId));
    }
  }, [editingId]);

  const loadHistory = useCallback(async (id) => {
    if (!id) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const rows = await adminApi.productEmailBlasts(id);
      setHistory(Array.isArray(rows) ? rows : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(productId);
  }, [productId, loadHistory]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const id = Number(productId);
    if (!Number.isFinite(id) || id <= 0) {
      setError('Choose a product to email.');
      return;
    }
    if (!recipients.trim()) {
      setError('Add at least one recipient email (one per line).');
      return;
    }
    setBusy(true);
    try {
      const data = await adminApi.sendProductEmailBlast(id, {
        recipients,
        message: message.trim(),
        subject: subject.trim(),
      });
      setResult(data);
      await loadHistory(id);
    } catch (err) {
      setError(err.body?.error || err.message || 'Email blast failed.');
    } finally {
      setBusy(false);
    }
  }

  const recipientPreviewCount = recipients
    .split(/\r?\n/)
    .flatMap((line) => line.split(/[,;]+/))
    .map((s) => s.trim())
    .filter(Boolean).length;

  return (
    <section className="admin-product-email-blast card" aria-labelledby="admin-email-blast-heading">
      <AdminSectionTitle
        as="h2"
        id="admin-email-blast-heading"
        icon={EmailBlastIcon}
        className="admin-section-title--h2"
        style={{ marginTop: 0 }}
      >
        Email blast
      </AdminSectionTitle>
      <p className="muted admin-product-email-blast__intro">
        Email a product link with thumbnail and details to a list of recipients. Paste one email
        address per line (commas and semicolons also work). Each message links to the product page
        on the storefront, for example{' '}
        <code>/products/{productId || '3009'}</code>.
      </p>

      <form className="form admin-product-email-blast__form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="blast-product">Product</label>
          <select
            id="blast-product"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setResult(null);
              setError(null);
            }}
            required
          >
            <option value="">Select a product…</option>
            {sortedProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (#{p.id}
                {p.is_published ? '' : ', draft'})
              </option>
            ))}
          </select>
        </div>

        {selectedProduct ? (
          <div className="admin-product-email-blast__preview card">
            <div className="admin-product-email-blast__thumb">
              <ProductImage src={selectedProduct.image_url} alt={selectedProduct.name} />
            </div>
            <div>
              <h3 className="admin-product-email-blast__preview-name">{selectedProduct.name}</h3>
              {selectedProduct.description ? (
                <p className="muted admin-product-email-blast__preview-desc">
                  {stripRichHtml(selectedProduct.description).slice(0, 180)}
                  {stripRichHtml(selectedProduct.description).length > 180 ? '…' : ''}
                </p>
              ) : null}
              <p className="admin-product-email-blast__preview-price">
                {formatProductPriceRange(selectedProduct, formatPrice)}
              </p>
              <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.88rem' }}>
                Link in email:{' '}
                <Link to={`/products/${selectedProduct.id}`} target="_blank" rel="noopener noreferrer">
                  /products/{selectedProduct.id}
                </Link>
              </p>
            </div>
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="blast-recipients">
            Recipients <span className="field-required">(one email per line)</span>
          </label>
          <textarea
            id="blast-recipients"
            rows={8}
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder={'friend@example.com\ncolleague@example.com'}
            spellCheck={false}
            required
          />
          <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.82rem' }}>
            {recipientPreviewCount > 0
              ? `${recipientPreviewCount} line(s) entered — invalid addresses are skipped when sending.`
              : 'Paste your mailing list here.'}{' '}
            Maximum 500 recipients per blast.
          </p>
        </div>

        <div className="field">
          <label htmlFor="blast-subject">Email subject (optional)</label>
          <input
            id="blast-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={selectedProduct ? `${selectedProduct.name} — Bear River Quilting` : ''}
            maxLength={255}
          />
        </div>

        <div className="field">
          <label htmlFor="blast-message">Message (optional)</label>
          <textarea
            id="blast-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Short note included above the product preview in the email"
          />
        </div>

        {error ? <p className="error">{error}</p> : null}
        {result ? (
          <p className="admin-product-email-blast__result" style={{ color: '#065f46' }}>
            Sent {result.sentCount} of {result.recipientCount} email(s).
            {result.failedCount > 0 ? ` ${result.failedCount} failed.` : ''}
            {result.invalidCount > 0 ? ` ${result.invalidCount} invalid address(es) skipped.` : ''}
            {result.truncated ? ' List was limited to 500 recipients.' : ''}
          </p>
        ) : null}

        <div className="row" style={{ marginTop: '0.25rem' }}>
          <button type="submit" className="btn btn-primary" disabled={busy || !productId}>
            {busy ? 'Sending…' : 'Send email blast'}
          </button>
        </div>
      </form>

      {productId ? (
        <div className="admin-product-email-blast__history">
          <h3 className="admin-product-email-blast__history-title">Recent blasts</h3>
          {historyLoading ? (
            <p className="muted">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="muted">No blasts recorded for this product yet.</p>
          ) : (
            <ul className="admin-product-email-blast__history-list">
              {history.map((b) => (
                <li key={b.id}>
                  <strong>{formatBlastTime(b.created_at)}</strong>
                  {' — '}
                  {b.sent_count}/{b.recipient_count} sent
                  {b.failed_count > 0 ? `, ${b.failed_count} failed` : ''}
                  {b.subject ? (
                    <span className="muted"> · {b.subject}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
