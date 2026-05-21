import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [state, setState] = useState({ loading: true, error: null, orderNumber: null, email: null });

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setState({ loading: false, error: 'Missing payment session.', orderNumber: null, email: null });
      return;
    }
    let cancelled = false;
    publicApi
      .confirmStripeCheckout(sessionId)
      .then((data) => {
        if (cancelled) return;
        clearCart();
        setState({
          loading: false,
          error: null,
          orderNumber: data.orderNumber,
          email: data.customerEmail,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: err.body?.error || err.message || 'Could not confirm payment.',
          orderNumber: null,
          email: null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams, clearCart]);

  if (state.loading) {
    return <p className="muted">Confirming your payment…</p>;
  }

  if (state.error) {
    return (
      <>
        <h1>Payment confirmation</h1>
        <p className="error">{state.error}</p>
        <p className="muted">
          If you were charged, check your email or{' '}
          <Link to="/account">look up your order</Link> with the same email you used at checkout.
        </p>
        <Link className="btn" to="/cart">
          Return to cart
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>Thank you for your order</h1>
      <p className="page-body">
        Payment received. Your order <strong>{state.orderNumber}</strong> is confirmed.
        {state.email ? (
          <>
            {' '}
            A confirmation email was sent to <strong>{state.email}</strong>.
          </>
        ) : null}
      </p>
      <div className="row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            navigate('/account', {
              replace: true,
              state: { placed: true, email: state.email, orderNumber: state.orderNumber },
            })
          }
        >
          View order details
        </button>
        <Link className="btn" to="/products">
          Continue shopping
        </Link>
      </div>
    </>
  );
}
