import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ProductImage from './ProductImage.jsx';
import { publicApi } from '../api.js';
import { stripRichHtml } from '../lib/richText.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

function briefDescription(html) {
  const text = stripRichHtml(html);
  if (!text) return 'Handmade quilt from Bear River Quilting.';
  if (text.length <= 220) return text;
  return `${text.slice(0, 219).trim()}…`;
}

export default function ProductShareDialog({ product, imageSrc, onClose }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await publicApi.shareProduct(product.id, {
        recipientEmail: recipientEmail.trim(),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        message: message.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.body?.error || err.message || 'Could not send email.');
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="confirm-dialog-backdrop" role="presentation" onClick={busy ? undefined : onClose}>
      <div
        className="confirm-dialog product-share-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-share-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="product-share-title" className="confirm-dialog__title">
          Share this product
        </h2>
        <p className="muted product-share-dialog__intro">
          Forward this quilt to a friend or relative by email. They can open the product page on our
          website to learn more.
        </p>

        <div className="product-share-dialog__preview card">
          {imageSrc ? (
            <div className="product-share-dialog__thumb">
              <ProductImage src={imageSrc} alt={product.name} />
            </div>
          ) : null}
          <div className="product-share-dialog__preview-body">
            <h3>{product.name}</h3>
            <p className="muted">{briefDescription(product.description)}</p>
            <p className="product-share-dialog__price">From {formatPrice(product.price)}</p>
          </div>
        </div>

        {success ? (
          <>
            <p className="page-body" style={{ color: '#065f46', marginBottom: '1.25rem' }}>
              Your email was sent to <strong>{recipientEmail.trim()}</strong>.
            </p>
            <div className="confirm-dialog__actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <form className="form product-share-dialog__form" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="share-recipient">Recipient email</label>
              <input
                id="share-recipient"
                type="email"
                autoComplete="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="share-sender-name">Your name (optional)</label>
              <input
                id="share-sender-name"
                type="text"
                autoComplete="name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="share-sender-email">Your email (optional)</label>
              <input
                id="share-sender-email"
                type="email"
                autoComplete="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="Used as reply-to if they write back"
              />
            </div>
            <div className="field">
              <label htmlFor="share-message">Personal message (optional)</label>
              <textarea
                id="share-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a short note to include in the email"
              />
            </div>
            {error ? <p className="error">{error}</p> : null}
            <div className="confirm-dialog__actions">
              <button type="button" className="btn" disabled={busy} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy || !recipientEmail.trim()}>
                {busy ? 'Sending…' : 'Send email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
