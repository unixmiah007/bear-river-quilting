import { useCallback, useEffect, useState } from 'react';
import { publicApi } from '../api.js';

function formatMessageWhen(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function senderLabel(direction) {
  return direction === 'customer_to_staff' ? 'You' : 'Bear River Quilting';
}

export default function OrderCorrespondencePanel({ email, orderNumber }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendBusy, setSendBusy] = useState(false);
  const [body, setBody] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewBusy, setViewBusy] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!email?.trim() || !orderNumber?.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const data = await publicApi.customerOrderMessages({
        email: email.trim(),
        orderNumber: orderNumber.trim(),
      });
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (e) {
      setFeedback({
        error:
          [e.body?.error, e.body?.hint].filter(Boolean).join(' — ') || e.message || 'Could not load messages.',
      });
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [email, orderNumber]);

  useEffect(() => {
    setBody('');
    setViewing(null);
    loadMessages();
  }, [loadMessages]);

  async function openMessage(messageId) {
    setViewBusy(true);
    try {
      const msg = await publicApi.customerOrderMessage({
        email: email.trim(),
        orderNumber: orderNumber.trim(),
        messageId,
      });
      setViewing(msg);
    } catch (e) {
      setFeedback({
        error: e.body?.error || e.message || 'Could not open message.',
      });
    } finally {
      setViewBusy(false);
    }
  }

  async function onReply(e) {
    e.preventDefault();
    setSendBusy(true);
    setFeedback(null);
    try {
      const result = await publicApi.customerOrderMessageReply({
        email: email.trim(),
        orderNumber: orderNumber.trim(),
        body,
      });
      setBody('');
      if (result.warning) {
        setFeedback({ warning: result.warning });
      } else if (result.emailSent) {
        setFeedback({ success: 'Your reply was sent to our team.' });
      } else {
        setFeedback({ success: 'Your reply was saved.' });
      }
      await loadMessages();
      if (result.message?.id) setViewing(result.message);
    } catch (err) {
      setFeedback({
        error:
          [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') ||
          err.message ||
          'Could not send reply.',
      });
    } finally {
      setSendBusy(false);
    }
  }

  return (
    <section className="order-correspondence" aria-labelledby="order-correspondence-heading">
      <h3 id="order-correspondence-heading" style={{ marginTop: '1.5rem', marginBottom: '0.35rem' }}>
        Messages
      </h3>
      <p className="muted" style={{ marginTop: 0 }}>
        View messages from our team about this order and send a reply. Correspondence is tied to your
        checkout email and order number.
      </p>

      {feedback?.error ? <p className="error">{feedback.error}</p> : null}
      {feedback?.warning ? (
        <p className="page-body" style={{ color: '#92400e' }}>
          {feedback.warning}
        </p>
      ) : null}
      {feedback?.success ? (
        <p className="page-body" style={{ color: '#065f46' }}>
          {feedback.success}
        </p>
      ) : null}

      <div className="order-correspondence__history">
        {loading ? (
          <p className="muted">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="muted">No messages yet. If we contact you about this order, it will appear here.</p>
        ) : (
          <ul className="admin-order-message-list">
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="admin-order-message-list__item"
                  onClick={() => openMessage(m.id)}
                  disabled={viewBusy}
                >
                  <span className="admin-order-message-list__subject">
                    {senderLabel(m.direction)}: {m.subject}
                  </span>
                  <span className="admin-order-message-list__meta muted">
                    {formatMessageWhen(m.sent_at || m.created_at)}
                    {m.direction === 'staff_to_customer' ? ' · From shop' : ' · Your reply'}
                    {m.body_preview ? ` · ${m.body_preview}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="form order-correspondence__form" onSubmit={onReply}>
        <div className="field">
          <label htmlFor="order-reply-body">Your reply</label>
          <textarea
            id="order-reply-body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            disabled={sendBusy}
            placeholder="Write a message to our team…"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={sendBusy}>
          {sendBusy ? 'Sending…' : 'Send reply'}
        </button>
      </form>

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
            aria-labelledby="order-message-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="order-message-dialog-title" className="confirm-dialog__title">
              {viewing.subject}
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {senderLabel(viewing.direction)} · {formatMessageWhen(viewing.sent_at || viewing.created_at)}
            </p>
            <div className="admin-order-message-dialog__body">
              {String(viewing.body_text ?? '')
                .split('\n')
                .map((line, i) => (
                  <p key={i}>{line || '\u00a0'}</p>
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
