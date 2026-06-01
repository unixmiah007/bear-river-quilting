import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import CartIcon from '../components/CartIcon.jsx';
import OrderTrackingDisplay from '../components/OrderTrackingDisplay.jsx';
import OrderCorrespondencePanel from '../components/OrderCorrespondencePanel.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { publicApi } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { buildTrackingUrl, labelForCarrier } from '../lib/shippingCarriers.js';
import { labelForOrderStatus } from '../lib/orderStatuses.js';
import AccountVisitHistory from '../components/AccountVisitHistory.jsx';
import AccountCustomQuiltLookup from '../components/AccountCustomQuiltLookup.jsx';
import AccountOrderItems, { orderListShowsAdjustment } from '../components/AccountOrderItems.jsx';
import PageLoading from '../components/PageLoading.jsx';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

function TrackingListCell({ carrier, trackingNumber }) {
  const num = String(trackingNumber ?? '').trim();
  if (!num) return <span className="muted">—</span>;
  const url = buildTrackingUrl(carrier, num);
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        Track
      </a>
    );
  }
  return (
    <span className="muted" title={num}>
      {labelForCarrier(carrier)}
    </span>
  );
}

function statusLabel(s) {
  return labelForOrderStatus(s);
}

function readOrderDeepLink(locationState, searchParams) {
  const qEmail = searchParams.get('email')?.trim();
  const qOrder =
    searchParams.get('order')?.trim() || searchParams.get('orderNumber')?.trim() || '';
  const email = locationState?.email?.trim() || qEmail || '';
  const orderNumber = locationState?.orderNumber?.trim() || qOrder || '';
  const placed = Boolean(locationState?.placed);
  return { email, orderNumber, placed, hasDeepLink: Boolean(email && orderNumber) };
}

export default function Account() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { favoriteIds, removeFavorite } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [placedBanner, setPlacedBanner] = useState(false);
  const [mode, setMode] = useState(null);
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);

  const favoriteIdsKey = favoriteIds.join(',');

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setFavoriteProducts([]);
      setFavoritesLoading(false);
      return undefined;
    }
    let cancelled = false;
    setFavoritesLoading(true);
    publicApi
      .listProducts()
      .then((rows) => {
        if (cancelled) return;
        const byId = new Map((Array.isArray(rows) ? rows : []).map((p) => [Number(p.id), p]));
        const ordered = favoriteIds.map((id) => byId.get(id)).filter(Boolean);
        setFavoriteProducts(ordered);
      })
      .catch(() => {
        if (!cancelled) setFavoriteProducts([]);
      })
      .finally(() => {
        if (!cancelled) setFavoritesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [favoriteIdsKey]);

  const favoritesEmpty = favoriteIds.length === 0;

  useEffect(() => {
    const { email: linkEmail, orderNumber: linkOrder, placed, hasDeepLink } = readOrderDeepLink(
      location.state,
      searchParams
    );
    if (!hasDeepLink) return undefined;

    setEmail(linkEmail);
    setOrderNumber(linkOrder);
    if (placed) setPlacedBanner(true);

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDetail(null);
      setList([]);
      setMode(null);
      try {
        const data = await publicApi.customerOrdersLookup({
          email: linkEmail,
          orderNumber: linkOrder,
        });
        if (cancelled) return;
        setMode('detail');
        setDetail({ order: data.order, items: Array.isArray(data.items) ? data.items : [] });
      } catch (err) {
        if (!cancelled) {
          setError(
            [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') ||
              err.message ||
              'Request failed.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.state, searchParams]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setDetail(null);
    setMode(null);
    setList([]);
    setLoading(true);
    try {
      const body = { email: email.trim() };
      const on = orderNumber.trim();
      if (on) body.orderNumber = on;
      const data = await publicApi.customerOrdersLookup(body);
      setMode(data.mode);
      if (data.mode === 'list') {
        setList(Array.isArray(data.orders) ? data.orders : []);
      } else {
        setDetail({ order: data.order, items: Array.isArray(data.items) ? data.items : [] });
      }
    } catch (err) {
      setError(
        [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') || err.message || 'Request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function openOrder(no) {
    setOrderNumber(no);
    setError(null);
    setLoading(true);
    try {
      const data = await publicApi.customerOrdersLookup({
        email: email.trim(),
        orderNumber: no,
      });
      setMode('detail');
      setDetail({ order: data.order, items: Array.isArray(data.items) ? data.items : [] });
    } catch (err) {
      setError(
        [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') || err.message || 'Request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  function backToList() {
    setDetail(null);
    setOrderNumber('');
    setMode('list');
  }

  const order = detail?.order;

  return (
    <>
      <h1>My account</h1>
      <p className="page-body">
        View shop order status, shipping and billing details, and custom quilt requests from our
        customize studio. Enter the <strong>same email you used at checkout</strong> or on your
        custom request. Use an <strong>order number</strong> (starts with Q) or{' '}
        <strong>custom request number</strong> (starts with CQ) to open one item directly.
      </p>
      <p className="muted" style={{ marginTop: '-0.5rem' }}>
        This page does not use a separate password. Anyone who knows your checkout email can request
        this list—use a private inbox for order confirmations in production.
      </p>

      {placedBanner ? (
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Thanks—your order was placed. Details below when available.
        </p>
      ) : null}

      <section className="card account-favorites" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Saved favorites</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Products you mark as favorites on their detail page are saved in this browser (local
          storage) so you can find them here when you return.
        </p>
        {favoritesEmpty ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            No favorites yet.{' '}
            <Link to="/products">Browse products</Link> and use <strong>Add to favorites</strong> on
            any item.
          </p>
        ) : favoritesLoading ? (
          <PageLoading active label="Loading favorites…" inline />
        ) : favoriteProducts.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            Your saved items are no longer available.{' '}
            <Link to="/products">Browse products</Link> to add new favorites.
          </p>
        ) : (
          <div className="card-grid account-favorites-grid">
            {favoriteProducts.map((p) => (
              <div key={p.id} className="account-favorite-item">
                <ProductCard
                  product={p}
                  onAddToCart={(item) => {
                    addItem(item, 1);
                    navigate('/cart');
                  }}
                />
                <button
                  type="button"
                  className="btn account-favorite-remove"
                  onClick={() => removeFavorite(p.id)}
                >
                  Remove from favorites
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <AccountVisitHistory />

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Look up orders</h2>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="acct-email">Checkout email</label>
            <input
              id="acct-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="acct-order">Order number (optional)</label>
            <input
              id="acct-order"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. Q1A2B3C4D567"
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading…' : orderNumber.trim() ? 'View this order' : 'Show all my orders'}
          </button>
        </form>
      </section>

      {mode === 'list' && !detail ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Order history</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Newest orders first. If we updated an order after checkout, you will see the current total
            and any refunds on the order details page.
          </p>
          {list.length === 0 ? (
            <p className="muted">No orders found for that email yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Placed</th>
                    <th>Card</th>
                    <th>Tracking</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.order_number}</strong>
                      </td>
                      <td>
                        {statusLabel(o.status)}
                        {orderListShowsAdjustment(o) ? (
                          <span className="account-order-list-badge">Updated</span>
                        ) : null}
                      </td>
                      <td>
                        {orderListShowsAdjustment(o) ? (
                          <>
                            <span className="muted" style={{ textDecoration: 'line-through' }}>
                              {formatPrice(o.original_total)}
                            </span>
                            <br />
                            <strong>{formatPrice(o.total)}</strong>
                          </>
                        ) : (
                          formatPrice(o.total)
                        )}
                      </td>
                      <td className="muted">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="muted">····{o.card_last4}</td>
                      <td>
                        <TrackingListCell
                          carrier={o.tracking_carrier}
                          trackingNumber={o.tracking_number}
                        />
                      </td>
                      <td>
                        <button type="button" className="btn" onClick={() => openOrder(o.order_number)}>
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <AccountCustomQuiltLookup
        email={email}
        onEmailChange={setEmail}
        searchParams={searchParams}
      />

      {mode === 'detail' && order ? (
        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Order {order.order_number}</h2>
            {list.length > 0 ? (
              <button type="button" className="btn" onClick={backToList}>
                Back to list
              </button>
            ) : null}
          </div>
          <p className="muted" style={{ marginTop: '0.35rem' }}>
            <strong>Status:</strong> {statusLabel(order.status)} · Placed{' '}
            {new Date(order.created_at).toLocaleString()}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Contact</h3>
          <p className="muted" style={{ margin: 0 }}>
            {order.customer_name} · {order.customer_email}
            {order.customer_phone ? ` · ${order.customer_phone}` : ''}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Payment</h3>
          <p className="muted" style={{ margin: 0 }}>
            Card ending in <strong>{order.card_last4}</strong> (full card number is not stored.)
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Shipping</h3>
          <p className="muted" style={{ margin: 0 }}>
            {order.shipping_method} · {formatPrice(order.shipping_cost)}
          </p>
          <p className="muted" style={{ margin: '0.35rem 0 0' }}>
            {order.shipping_address1}
            {order.shipping_address2 ? `, ${order.shipping_address2}` : ''}
            <br />
            {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
            <br />
            {order.shipping_country}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Shipment tracking</h3>
          {order.tracking_number ? (
            <OrderTrackingDisplay
              carrier={order.tracking_carrier}
              trackingNumber={order.tracking_number}
              notifiedAt={order.tracking_notified_at}
            />
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              {['cancelled', 'refunded', 'return'].includes(String(order.status || '').toLowerCase())
                ? 'This order is not being shipped.'
                : ['paid', 'processing', 'preparing_for_shipment', 'fulfilled', 'shipped', 'complete'].includes(
                      String(order.status || '').toLowerCase()
                    )
                  ? 'Tracking has not been added yet. Check back soon or contact customer care.'
                  : 'Tracking will appear here once your order ships.'}
            </p>
          )}

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Billing</h3>
          <p className="muted" style={{ margin: 0 }}>
            {order.billing_name}
            <br />
            {order.billing_address1}
            {order.billing_address2 ? `, ${order.billing_address2}` : ''}
            <br />
            {order.billing_city}, {order.billing_state} {order.billing_postal_code}
            <br />
            {order.billing_country}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Items</h3>
          <AccountOrderItems order={order} items={detail.items || []} />

          <OrderCorrespondencePanel email={email} orderNumber={order.order_number} />
        </section>
      ) : null}

      <p className="muted" style={{ marginTop: '2rem' }}>
        <Link className="cart-inline-link" to="/cart">
          <CartIcon /> Return to cart
        </Link>{' '}
        · <Link to="/products">Continue shopping</Link>
      </p>
    </>
  );
}
