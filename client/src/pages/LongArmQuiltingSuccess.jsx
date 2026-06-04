import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import PageLoading from '../components/PageLoading.jsx';

export default function LongArmQuiltingSuccess() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({
    loading: true,
    error: null,
    requestNumber: null,
    email: null,
    isFinalPayment: false,
  });

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setState({
        loading: false,
        error: 'Missing payment session.',
        requestNumber: null,
        email: null,
        isFinalPayment: false,
      });
      return;
    }
    let cancelled = false;
    publicApi
      .confirmStripeCheckout(sessionId)
      .then((data) => {
        if (cancelled) return;
        if (data.checkoutType === 'long_arm_quilting' && data.requestNumber) {
          setState({
            loading: false,
            error: null,
            requestNumber: data.requestNumber,
            email: data.customerEmail,
            isFinalPayment: !!data.finalPayment,
          });
          return;
        }
        setState({
          loading: false,
          error: 'This payment session is not for a long-arm quilting request.',
          requestNumber: null,
          email: null,
          isFinalPayment: false,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: err.body?.error || err.message || 'Could not confirm payment.',
          requestNumber: null,
          email: null,
          isFinalPayment: false,
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
      <article className="long-arm-page">
        <h1>Payment confirmation</h1>
        <p className="error">{state.error}</p>
        <p className="muted">
          If you were charged, contact the studio with the email you used at checkout.
        </p>
        <Link className="btn" to="/long-arm-quilting">
          Return to long-arm services
        </Link>
      </article>
    );
  }

  if (state.isFinalPayment) {
    return (
      <article className="long-arm-page">
        <h1>Final payment received — thank you!</h1>
        <p className="page-body">
          Your final payment for request <strong>{state.requestNumber}</strong> is confirmed.
          {state.email ? (
            <>
              {' '}
              A receipt was sent to <strong>{state.email}</strong>.
            </>
          ) : null}
        </p>
        <Link className="btn btn-primary" to="/long-arm-quilting">
          Back to long-arm services
        </Link>
      </article>
    );
  }

  return (
    <article className="long-arm-page">
      <h1>Deposit received — thank you!</h1>
      <p className="page-body">
        You&apos;ve paid! Someone will contact you shortly from Bear River Quilting.
        {state.requestNumber ? (
          <>
            {' '}
            Your request reference is <strong>{state.requestNumber}</strong>.
          </>
        ) : null}
        {state.email ? (
          <>
            {' '}
            A confirmation was sent to <strong>{state.email}</strong>.
          </>
        ) : null}
      </p>
      <Link className="btn btn-primary" to="/long-arm-quilting">
        Back to long-arm services
      </Link>
    </article>
  );
}
