import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api.js';
import PageLoading from '../components/PageLoading.jsx';
import { labelForOrderStatus } from '../lib/orderStatuses.js';

function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function lastSenderLabel(direction) {
  return direction === 'customer_to_staff' ? 'Customer' : 'Shop';
}

export default function AdminCommunication() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminApi.communications();
      setThreads(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e.body?.error || e.message || 'Failed to load communications.');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 45_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return threads;
    return threads.filter((t) => {
      const hay = [
        t.order_number,
        t.customer_name,
        t.customer_email,
        t.status,
        t.last_subject,
        t.last_body_preview,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [threads, query]);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, t) => sum + (Number(t.unread_count) || 0), 0),
    [threads]
  );

  if (loading && threads.length === 0) {
    return <PageLoading active label="Loading communications…" />;
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Communication</h1>
      <p className="muted" style={{ maxWidth: '42rem' }}>
        Orders with customer correspondence. Open an order to view the full thread; you will be
        scrolled to the messaging section. Unread customer replies are highlighted until you open
        that order.
      </p>
      {unreadTotal > 0 ? (
        <p className="admin-communications-summary" role="status">
          <span className="admin-comm-unread-dot" aria-hidden="true" />
          {unreadTotal} unread customer message{unreadTotal === 1 ? '' : 's'} across{' '}
          {threads.filter((t) => t.has_unread).length} order
          {threads.filter((t) => t.has_unread).length === 1 ? '' : 's'}
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="field" style={{ maxWidth: '22rem', marginBottom: '1rem' }}>
        <label htmlFor="comm-search">Search</label>
        <input
          id="comm-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Order #, customer, subject…"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          {threads.length === 0
            ? 'No order messages yet. Messages appear here when you email a customer or they reply from their account.'
            : 'No orders match your search.'}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-communications-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Status</th>
                <th scope="col">Last message</th>
                <th scope="col">When</th>
                <th scope="col" className="admin-communications-table__count-col">
                  Msgs
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className={`admin-communications-row${t.has_unread ? ' admin-communications-row--unread' : ''}`}
                  role="link"
                  tabIndex={0}
                  onClick={() =>
                    navigate(
                      `/admin/orders?order=${encodeURIComponent(t.id)}&focus=messages`
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(
                        `/admin/orders?order=${encodeURIComponent(t.id)}&focus=messages`
                      );
                    }
                  }}
                >
                  <td>
                    <span className="admin-communications-row__link">
                      {t.has_unread ? (
                        <span className="admin-comm-unread-dot" aria-hidden="true" />
                      ) : null}
                      <strong>{t.order_number}</strong>
                      {t.has_unread ? (
                        <span className="admin-comm-unread-badge">New</span>
                      ) : null}
                    </span>
                  </td>
                  <td>
                    <div>{t.customer_name || '—'}</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {t.customer_email}
                    </div>
                  </td>
                  <td>{labelForOrderStatus(t.status)}</td>
                  <td>
                    <span className="admin-communications-row__preview">
                      <span className="muted">{lastSenderLabel(t.last_direction)}: </span>
                      {t.last_subject || '—'}
                      {t.last_body_preview ? (
                        <span className="muted admin-communications-row__snippet">
                          {' '}
                          — {t.last_body_preview}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="admin-communications-table__when">{formatWhen(t.last_message_at)}</td>
                  <td className="admin-communications-table__count-col">
                    {t.message_count}
                    {t.unread_count > 0 ? (
                      <span className="admin-comm-unread-count"> ({t.unread_count} new)</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
