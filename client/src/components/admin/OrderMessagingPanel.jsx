import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api.js';
import AdminSectionTitle from './AdminSectionTitle.jsx';
import { CustomerMessagingIcon } from './AdminSectionIcons.jsx';

function formatMessageWhen(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function senderLabel(direction) {
  return direction === 'customer_to_staff' ? 'Customer' : 'Shop';
}

export default function OrderMessagingPanel({
  orderId,
  orderNumber,
  customerEmail,
  customerName,
  onFeedback,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendBusy, setSendBusy] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '' });
  const [viewing, setViewing] = useState(null);
  const [viewBusy, setViewBusy] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const rows = await adminApi.orderMessages(orderId);
      setMessages(Array.isArray(rows) ? rows : []);
    } catch (e) {
      onFeedback?.({ error: e.body?.error || e.message });
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [orderId, onFeedback]);

  useEffect(() => {
    setForm({
      subject: orderNumber ? `Message about your order ${orderNumber}` : '',
      body: '',
    });
    setViewing(null);
    loadMessages();
  }, [orderId, orderNumber, loadMessages]);

  async function openMessage(messageId) {
    setViewBusy(true);
    onFeedback?.(null);
    try {
      const msg = await adminApi.orderMessage(orderId, messageId);
      setViewing(msg);
      if (msg?.direction === 'customer_to_staff') {
        await loadMessages();
      }
    } catch (e) {
      onFeedback?.({ error: e.body?.error || e.message });
    } finally {
      setViewBusy(false);
    }
  }

  async function onSend(e) {
    e.preventDefault();
    setSendBusy(true);
    onFeedback?.(null);
    try {
      const result = await adminApi.sendOrderMessage(orderId, {
        subject: form.subject,
        body: form.body,
      });
      setForm((f) => ({ ...f, body: '' }));
      if (result.warning) {
        onFeedback?.({ warning: result.warning });
      } else if (result.emailSent) {
        onFeedback?.({
          success: `Email sent to ${customerEmail}.`,
        });
      }
      await loadMessages();
      if (result.message?.id) {
        setViewing(result.message);
      }
    } catch (err) {
      onFeedback?.({ error: err.body?.error || err.message });
    } finally {
      setSendBusy(false);
    }
  }

  return (
    <section
      id="admin-order-messaging"
      className="admin-order-messaging"
      aria-labelledby="admin-order-messaging-heading"
    >
      <AdminSectionTitle
        id="admin-order-messaging-heading"
        icon={CustomerMessagingIcon}
        className="admin-order-messaging__title"
      >
        Customer messaging
      </AdminSectionTitle>
      <p className="muted admin-order-messaging__hint">
        Send an email to <strong>{customerEmail}</strong>
        {customerName ? ` (${customerName})` : ''}. Messages are saved below for correspondence
        history.
      </p>

      <form className="form admin-order-messaging__form" onSubmit={onSend}>
        <div className="field">
          <label htmlFor="order-message-subject">Subject</label>
          <input
            id="order-message-subject"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            required
            maxLength={255}
            disabled={sendBusy}
          />
        </div>
        <div className="field">
          <label htmlFor="order-message-body">Message</label>
          <textarea
            id="order-message-body"
            rows={5}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            required
            disabled={sendBusy}
            placeholder="Write your message to the customer…"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={sendBusy}>
          {sendBusy ? 'Sending…' : 'Send email to customer'}
        </button>
      </form>

      <div className="admin-order-messaging__history">
        <h5 className="admin-order-messaging__history-title">Correspondence history</h5>
        {loading ? (
          <p className="muted">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="muted">No messages yet for this order.</p>
        ) : (
          <ul className="admin-order-message-list">
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`admin-order-message-list__item${m.is_unread ? ' admin-order-message-list__item--unread' : ''}`}
                  onClick={() => openMessage(m.id)}
                  disabled={viewBusy}
                >
                  <span className="admin-order-message-list__subject">
                    {m.is_unread ? (
                      <span className="admin-comm-unread-badge admin-comm-unread-badge--inline">
                        New
                      </span>
                    ) : null}
                    {senderLabel(m.direction)}: {m.subject}
                  </span>
                  <span className="admin-order-message-list__meta muted">
                    {formatMessageWhen(m.sent_at || m.created_at)}
                    {m.direction === 'customer_to_staff'
                      ? m.email_sent
                        ? ' · Customer reply (staff notified)'
                        : ' · Customer reply (not emailed)'
                      : m.email_sent
                        ? ' · Emailed to customer'
                        : ' · Not emailed'}
                    {m.body_preview ? ` · ${m.body_preview}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {viewing ? (
        <div
          className="confirm-dialog-backdrop"
          role="presentation"
          onClick={() => setViewing(null)}
        >
          <div
            className="confirm-dialog admin-order-message-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-order-message-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-order-message-dialog-title" className="confirm-dialog__title">
              {viewing.subject}
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {senderLabel(viewing.direction)}
              {viewing.direction === 'customer_to_staff' && viewing.from_email
                ? ` · ${viewing.from_email}`
                : ` · To ${viewing.to_email}`}{' '}
              · {formatMessageWhen(viewing.sent_at || viewing.created_at)}
              {viewing.email_sent ? ' · Delivered via email' : ' · Saved only (email not sent)'}
            </p>
            <div className="admin-order-message-dialog__body">
              {String(viewing.body_text ?? '')
                .split('\n')
                .map((line, i) => (
                  <p key={i} style={{ margin: i === 0 ? '0 0 0.5rem' : '0 0 0.5rem' }}>
                    {line || '\u00a0'}
                  </p>
                ))}
            </div>
            <div className="confirm-dialog__actions">
              <button type="button" className="btn btn-primary" onClick={() => setViewing(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
