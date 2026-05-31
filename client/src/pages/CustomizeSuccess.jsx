import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import PageLoading from '../components/PageLoading.jsx';

export default function CustomizeSuccess() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({
    loading: true,
    error: null,
    requestNumber: null,
    email: null,
  });

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setState({
        loading: false,
        error: 'Missing payment session.',
        requestNumber: null,
        email: null,
      });
      return;
    }
    let cancelled = false;
    publicApi
      .confirmStripeCheckout(sessionId)
      .then((data) => {
        if (cancelled) return;
        if (data.checkoutType === 'custom_quilt' && data.requestNumber) {
          setState({
            loading: false,
            error: null,
            requestNumber: data.requestNumber,
            email: data.customerEmail,
          });
          return;
        }
        setState({
          loading: false,
          error: 'This payment session is not for a custom quilt request.',
          requestNumber: null,
          email: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: err.body?.error || err.message || 'Could not confirm payment.',
          requestNumber: null,
          email: null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (state.loading) {
    return <PageLoading active label="Confirming your payment…" />;
  }

  if (state.error) {
    return (
      <article className="customize-page">
        <h1>Payment confirmation</h1>
        <p className="error">{state.error}</p>
        <p className="muted">
          If you were charged, check your email or contact the studio with the email you used at
          checkout.
        </p>
        <Link className="btn" to="/customize">
          Return to customize
        </Link>
      </article>
    );
  }

  return (
    <article className="customize-page">
      <h1>Payment received — thank you!</h1>
      <p className="page-body">
        Your custom quilt request <strong>{state.requestNumber}</strong> is confirmed and paid.
        {state.email ? (
          <>
            {' '}
            We sent a confirmation to <strong>{state.email}</strong>. Our designer will follow up
            within 2–3 business days with next steps.
          </>
        ) : (
          <> Our designer will follow up within 2–3 business days with next steps.</>
        )}
      </p>
      <div className="row">
        {state.requestNumber && state.email ? (
          <Link
            className="btn btn-primary"
            to={`/account?email=${encodeURIComponent(state.email)}&customRequest=${encodeURIComponent(state.requestNumber)}`}
          >
            View request status
          </Link>
        ) : null}
        <Link className="btn" to="/customize">
          Start another design
        </Link>
        <Link className="btn" to="/products">
          Browse ready-made quilts
        </Link>
      </div>
    </article>
  );
}
