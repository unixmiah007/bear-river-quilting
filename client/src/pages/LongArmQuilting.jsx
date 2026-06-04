import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import PageLoading from '../components/PageLoading.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';

const DEPOSIT_USD = 30;
const DEPOSIT_PAUSE_SECONDS = 4;

const QUILT_SOURCE_OPTIONS = [
  {
    value: 'send_yours',
    title: 'Send us your quilt(s)',
    hint: 'You ship your quilt top (and backing/batting if ready) to our studio for long-arm finishing.',
  },
  {
    value: 'use_ours',
    title: 'Use our quilt(s)',
    hint: 'Start from a quilt top or kit from Bear River Quilting — we finish it on the long-arm for you.',
  },
];

function quiltSourceLabel(value) {
  return QUILT_SOURCE_OPTIONS.find((o) => o.value === value)?.title ?? '—';
}

function formatPrice(n) {
  if (n == null) return null;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function LongArmServiceImage({ index, src, placeholder }) {
  if (placeholder) {
    return (
      <ScrollReveal
        index={index}
        content
        className="long-arm-service-card__image long-arm-service-card__image--placeholder muted"
      >
        No image
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal index={index} className="long-arm-service-card__image">
      <ProductImage src={src} alt="" />
    </ScrollReveal>
  );
}

const initialForm = {
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  shippingAddress1: '',
  shippingAddress2: '',
  shippingCity: '',
  shippingState: '',
  shippingPostalCode: '',
  shippingCountry: 'USA',
  billingName: '',
  billingAddress1: '',
  billingAddress2: '',
  billingCity: '',
  billingState: '',
  billingPostalCode: '',
  billingCountry: 'USA',
  notes: '',
};

export default function LongArmQuilting() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [quiltSource, setQuiltSource] = useState('');
  const [form, setForm] = useState(initialForm);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [busy, setBusy] = useState(false);
  const [depositCountdown, setDepositCountdown] = useState(0);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [paidBanner, setPaidBanner] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await publicApi.listLongArmServices();
        if (!cancelled) setServices(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return;

    let cancelled = false;
    setConfirmingPayment(true);
    setError(null);
    publicApi
      .confirmStripeCheckout(sessionId)
      .then((data) => {
        if (cancelled) return;
        if (data.checkoutType === 'long_arm_quilting' && data.requestNumber && !data.finalPayment) {
          setPaidBanner(true);
          setWizardOpen(false);
          setStep(1);
          setShowStripeModal(false);
          setDepositCountdown(0);
        } else if (!data.finalPayment) {
          setError('This payment session is not for a long-arm quilting deposit.');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.body?.error || err.message || 'Could not confirm payment.');
        }
      })
      .finally(() => {
        if (!cancelled) setConfirmingPayment(false);
      });

    const next = new URLSearchParams(searchParams);
    next.delete('session_id');
    setSearchParams(next, { replace: true });

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('checkout') !== 'cancelled') return;
    setError('Payment was cancelled. Your information was not saved — you can try again when ready.');
    setWizardOpen(true);
    setStep(5);
    const next = new URLSearchParams(searchParams);
    next.delete('checkout');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (step !== 5) {
      setDepositCountdown(0);
      setShowStripeModal(false);
      return undefined;
    }
    setShowStripeModal(false);
    setDepositCountdown(DEPOSIT_PAUSE_SECONDS);
    if (DEPOSIT_PAUSE_SECONDS <= 0) {
      setShowStripeModal(true);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setDepositCountdown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== 5 || depositCountdown > 0) return;
    setShowStripeModal(true);
  }, [step, depositCountdown]);

  useEffect(() => {
    if (!billingSameAsShipping) return;
    setForm((f) => ({
      ...f,
      billingName: f.contactName || f.billingName,
      billingAddress1: f.shippingAddress1,
      billingAddress2: f.shippingAddress2,
      billingCity: f.shippingCity,
      billingState: f.shippingState,
      billingPostalCode: f.shippingPostalCode,
      billingCountry: f.shippingCountry,
    }));
  }, [
    billingSameAsShipping,
    form.contactName,
    form.shippingAddress1,
    form.shippingAddress2,
    form.shippingCity,
    form.shippingState,
    form.shippingPostalCode,
    form.shippingCountry,
  ]);

  function toggleService(id) {
    setSelectedIds((ids) => {
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      if (next.length === 0) setQuiltSource('');
      return next;
    });
  }

  function startRequest() {
    setError(null);
    setQuiltSource('');
    setWizardOpen(true);
    setStep(1);
  }

  function nextStep() {
    setError(null);
    if (step === 1 && selectedIds.length === 0) {
      setError('Select at least one service to continue.');
      return;
    }
    if (step === 1 && !quiltSource) {
      setError('Choose whether you are sending your quilt or using ours.');
      return;
    }
    if (step === 2 && (!form.contactName || !form.contactEmail)) {
      setError('Please complete your contact details.');
      return;
    }
    if (
      step === 3 &&
      (!form.shippingAddress1 ||
        !form.shippingCity ||
        !form.shippingState ||
        !form.shippingPostalCode ||
        !form.shippingCountry)
    ) {
      setError('Please complete your shipping address.');
      return;
    }
    if (
      step === 4 &&
      (!form.billingName ||
        !form.billingAddress1 ||
        !form.billingCity ||
        !form.billingState ||
        !form.billingPostalCode ||
        !form.billingCountry)
    ) {
      setError('Please complete your billing address.');
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  }

  function toggleBillingSameAsShipping(checked) {
    setBillingSameAsShipping(checked);
    if (checked) {
      setForm((f) => ({
        ...f,
        billingName: f.contactName || f.billingName,
        billingAddress1: f.shippingAddress1,
        billingAddress2: f.shippingAddress2,
        billingCity: f.shippingCity,
        billingState: f.shippingState,
        billingPostalCode: f.shippingPostalCode,
        billingCountry: f.shippingCountry,
      }));
    }
  }

  function cancelStripeModal() {
    setShowStripeModal(false);
    setWizardOpen(false);
    setStep(1);
    setDepositCountdown(0);
    setError(null);
    navigate('/long-arm-quilting', { replace: true });
  }

  async function payDeposit() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        serviceIds: selectedIds,
        quiltSource,
        notes: form.notes,
        customer: {
          name: form.contactName,
          email: form.contactEmail,
          phone: form.contactPhone,
        },
        shipping: {
          address1: form.shippingAddress1,
          address2: form.shippingAddress2,
          city: form.shippingCity,
          state: form.shippingState,
          postalCode: form.shippingPostalCode,
          country: form.shippingCountry,
        },
        billing: {
          name: form.billingName,
          address1: form.billingAddress1,
          address2: form.billingAddress2,
          city: form.billingCity,
          state: form.billingState,
          postalCode: form.billingPostalCode,
          country: form.billingCountry,
        },
      };
      const result = await publicApi.createLongArmQuiltingStripeCheckoutSession(payload);
      if (!result?.url) {
        throw new Error('Stripe checkout URL was not returned');
      }
      window.location.assign(result.url);
    } catch (err) {
      setError(err.body?.error || err.message);
      setBusy(false);
    }
  }

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));

  if (loading || confirmingPayment) {
    return (
      <PageLoading
        active
        label={confirmingPayment ? 'Confirming your payment…' : 'Loading long-arm quilting services…'}
      />
    );
  }

  return (
    <article className="long-arm-page">
      {paidBanner ? (
        <div className="long-arm-paid-banner" role="status">
          <strong>You&apos;ve paid!</strong> Someone will contact you shortly from Bear River Quilting.
        </div>
      ) : null}

      <header className="long-arm-page__header">
        <p className="eyebrow">Professional finishing</p>
        <h1>Long-Arm Quilting Services</h1>
        <p className="page-body">
          Send us your quilt top and we will finish it on our long-arm machine with the care and
          craftsmanship Bear River Quilting is known for. Browse our services below, then request a
          quote and pay a {formatPrice(DEPOSIT_USD)} deposit to get started.
        </p>
      </header>

      {error && !wizardOpen ? <p className="error">{error}</p> : null}

      <section className="long-arm-services">
        <div className="long-arm-services__grid">
          {services.length === 0 ? (
            <p className="muted">Services will be listed here soon.</p>
          ) : (
            services.map((svc, index) => (
              <article key={svc.id} className="long-arm-service-card card">
                <LongArmServiceImage
                  index={index}
                  src={svc.image_url}
                  placeholder={!svc.image_url}
                />
                <div className="long-arm-service-card__body">
                  <h2>{svc.name}</h2>
                  {svc.hourly_rate != null ? (
                    <p className="long-arm-service-card__rate">
                      <strong>{formatPrice(svc.hourly_rate)}</strong>
                      <span className="muted"> / hour</span>
                    </p>
                  ) : null}
                  {svc.description ? <p className="muted">{svc.description}</p> : null}
                </div>
              </article>
            ))
          )}
        </div>
        {services.length > 0 ? (
          <div className="row" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={startRequest}>
              Request a service
            </button>
          </div>
        ) : null}
      </section>

      {wizardOpen ? (
        <section className="long-arm-wizard card" style={{ marginTop: '2rem' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Service request</h2>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setWizardOpen(false);
                setStep(1);
                setQuiltSource('');
                setError(null);
              }}
            >
              Close
            </button>
          </div>

          <div className="wizard-progress" style={{ marginTop: '1rem' }}>
            {[
              { n: 1, label: 'Services' },
              { n: 2, label: 'Contact' },
              { n: 3, label: 'Shipping' },
              { n: 4, label: 'Billing' },
              { n: 5, label: 'Deposit' },
            ].map(({ n, label }) => (
              <span
                key={n}
                className={`wizard-step${step === n ? ' current' : ''}${step > n ? ' done' : ''}`}
              >
                {step > n ? `✓ ${label}` : `${n}. ${label}`}
              </span>
            ))}
          </div>

          {error ? <p className="error">{error}</p> : null}

          <form className="form" onSubmit={(e) => e.preventDefault()}>
            {step === 1 ? (
              <div className="long-arm-wizard__services">
                <p className="muted">Select one or more services you are interested in.</p>
                <div className="long-arm-wizard__service-list">
                  {services.map((svc) => {
                    const checked = selectedIds.includes(svc.id);
                    return (
                      <label key={svc.id} className={`long-arm-wizard__service-option${checked ? ' long-arm-wizard__service-option--selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(svc.id)}
                        />
                        <span>
                          <strong>{svc.name}</strong>
                          {svc.hourly_rate != null ? (
                            <span className="muted"> — {formatPrice(svc.hourly_rate)}/hr</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {selectedIds.length > 0 ? (
                  <div className="long-arm-wizard__quilt-source">
                    <h3 className="long-arm-wizard__quilt-source-heading">How will we work with your quilt?</h3>
                    <p className="muted">Select one option to continue to contact details.</p>
                    <div className="customize-path-chooser" role="radiogroup" aria-label="Quilt source">
                      {QUILT_SOURCE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={quiltSource === option.value}
                          className={`customize-path-chooser__option${quiltSource === option.value ? ' customize-path-chooser__option--active' : ''}`}
                          onClick={() => setQuiltSource(option.value)}
                        >
                          <span className="customize-path-chooser__title">{option.title}</span>
                          <span className="customize-path-chooser__hint muted">{option.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <>
                <div className="field">
                  <label htmlFor="la-cname">Full name</label>
                  <input
                    id="la-cname"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="la-cemail">Email</label>
                  <input
                    id="la-cemail"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="la-cphone">Phone</label>
                  <input
                    id="la-cphone"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="la-notes">Project notes (optional)</label>
                  <textarea
                    id="la-notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Quilt size, timeline, special instructions…"
                  />
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="field">
                  <label htmlFor="la-sa1">Shipping address line 1</label>
                  <input
                    id="la-sa1"
                    value={form.shippingAddress1}
                    onChange={(e) => setForm({ ...form, shippingAddress1: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="la-sa2">Shipping address line 2</label>
                  <input
                    id="la-sa2"
                    value={form.shippingAddress2}
                    onChange={(e) => setForm({ ...form, shippingAddress2: e.target.value })}
                  />
                </div>
                <div className="row">
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="la-scity">City</label>
                    <input
                      id="la-scity"
                      value={form.shippingCity}
                      onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="la-sstate">State</label>
                    <input
                      id="la-sstate"
                      value={form.shippingState}
                      onChange={(e) => setForm({ ...form, shippingState: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="la-spostal">Postal code</label>
                    <input
                      id="la-spostal"
                      value={form.shippingPostalCode}
                      onChange={(e) => setForm({ ...form, shippingPostalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="la-scountry">Country</label>
                  <input
                    id="la-scountry"
                    value={form.shippingCountry}
                    onChange={(e) => setForm({ ...form, shippingCountry: e.target.value })}
                    required
                  />
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <div className="field row">
                  <input
                    id="la-same-billing"
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => toggleBillingSameAsShipping(e.target.checked)}
                  />
                  <label
                    htmlFor="la-same-billing"
                    style={{ margin: 0, textTransform: 'none', letterSpacing: 'normal' }}
                  >
                    Billing address same as shipping
                  </label>
                </div>
                <div className="field">
                  <label htmlFor="la-bname">Billing full name</label>
                  <input
                    id="la-bname"
                    value={form.billingName}
                    onChange={(e) => setForm({ ...form, billingName: e.target.value })}
                    disabled={billingSameAsShipping}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="la-ba1">Billing address line 1</label>
                  <input
                    id="la-ba1"
                    value={form.billingAddress1}
                    onChange={(e) => setForm({ ...form, billingAddress1: e.target.value })}
                    disabled={billingSameAsShipping}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="la-ba2">Billing address line 2</label>
                  <input
                    id="la-ba2"
                    value={form.billingAddress2}
                    onChange={(e) => setForm({ ...form, billingAddress2: e.target.value })}
                    disabled={billingSameAsShipping}
                  />
                </div>
                <div className="row">
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="la-bcity">City</label>
                    <input
                      id="la-bcity"
                      value={form.billingCity}
                      onChange={(e) => setForm({ ...form, billingCity: e.target.value })}
                      disabled={billingSameAsShipping}
                      required
                    />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="la-bstate">State</label>
                    <input
                      id="la-bstate"
                      value={form.billingState}
                      onChange={(e) => setForm({ ...form, billingState: e.target.value })}
                      disabled={billingSameAsShipping}
                      required
                    />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="la-bpostal">Postal code</label>
                    <input
                      id="la-bpostal"
                      value={form.billingPostalCode}
                      onChange={(e) => setForm({ ...form, billingPostalCode: e.target.value })}
                      disabled={billingSameAsShipping}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="la-bcountry">Country</label>
                  <input
                    id="la-bcountry"
                    value={form.billingCountry}
                    onChange={(e) => setForm({ ...form, billingCountry: e.target.value })}
                    disabled={billingSameAsShipping}
                    required
                  />
                </div>
              </>
            ) : null}

            {step === 5 ? (
              <div className="long-arm-wizard__review">
                <h3>Review &amp; pay deposit</h3>
                <p className="muted">Selected services:</p>
                <ul>
                  {selectedServices.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
                <p>
                  <strong>Quilt source:</strong> {quiltSourceLabel(quiltSource)}
                </p>
                <p>
                  <strong>Deposit due today:</strong> {formatPrice(DEPOSIT_USD)}
                </p>
                <p className="muted">
                  After your quilt is finished, we will email you a secure link for the final payment
                  based on the actual work completed.
                </p>
                {depositCountdown > 0 ? (
                  <p className="long-arm-deposit-countdown muted" role="status" aria-live="polite">
                    Preparing secure checkout in {depositCountdown} second{depositCountdown === 1 ? '' : 's'}…
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="row" style={{ marginTop: '1.25rem' }}>
              {step > 1 ? (
                <button type="button" className="btn" onClick={() => setStep((s) => s - 1)} disabled={busy}>
                  Back
                </button>
              ) : null}
              {step < 5 ? (
                <button type="button" className="btn btn-primary" onClick={nextStep}>
                  Continue
                </button>
              ) : null}
            </div>
          </form>

          {showStripeModal ? (
            <div className="site-dialog" role="dialog" aria-modal="true" aria-labelledby="la-stripe-dialog-title">
              <button
                type="button"
                className="site-dialog__backdrop"
                aria-label="Close"
                onClick={cancelStripeModal}
              />
              <div className="site-dialog__panel card">
                <h3 id="la-stripe-dialog-title" style={{ marginTop: 0 }}>
                  Proceed to secure payment
                </h3>
                <p className="page-body">
                  You&apos;re being directed to Stripe to pay your {formatPrice(DEPOSIT_USD)} deposit.
                  Someone from Bear River Quilting will contact you shortly after payment.
                </p>
                <div className="row" style={{ marginTop: '1.25rem' }}>
                  <button type="button" className="btn btn-primary" onClick={payDeposit} disabled={busy}>
                    {busy ? 'Redirecting to Stripe…' : 'Proceed'}
                  </button>
                  <button type="button" className="btn" onClick={cancelStripeModal} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
