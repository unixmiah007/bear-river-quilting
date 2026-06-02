import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { formatProductSizeLabel } from '../lib/productSizes.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function Cart() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, updateQty, removeItem, total, getDiscountedUnitPrice } = useCart();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [form, setForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    name: '',
    email: '',
    phone: '',
    shippingAddress1: '',
    shippingAddress2: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: 'USA',
    shippingMethod: 'standard',
    billingName: '',
    billingAddress1: '',
    billingAddress2: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'USA',
  });

  const shippingCosts = { standard: 9.99, express: 19.99, pickup: 0 };
  const shippingCost = shippingCosts[form.shippingMethod] ?? 9.99;
  const taxAmount = Number((total * 0.0825).toFixed(2));
  const grandTotal = Number((total + shippingCost + taxAmount).toFixed(2));

  function lineOriginalTotal(item) {
    return Number(item.price) * item.quantity;
  }

  function hasDiscount(item) {
    return Math.max(0, Math.min(100, Math.floor(Number(item.discount_percent) || 0)) ) > 0;
  }

  useEffect(() => {
    if (searchParams.get('checkout') !== 'cancelled') return;
    setError('Payment was cancelled. Your cart is unchanged — you can try again when ready.');
    setStep(4);
    const next = new URLSearchParams(searchParams);
    next.delete('checkout');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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

  function nextStep() {
    setError(null);
    if (step === 1 && (!form.contactName || !form.contactEmail)) {
      setError('Please complete your contact details.');
      return;
    }
    if (
      step === 2 &&
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
      step === 3 &&
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
    setStep((s) => Math.min(4, s + 1));
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

  async function payWithStripe(e) {
    e.preventDefault();
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
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
          method: form.shippingMethod,
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
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          productSize: it.product_size ?? undefined,
        })),
      };
      const result = await publicApi.createStripeCheckoutSession(payload);
      if (!result?.url) {
        throw new Error('Stripe checkout URL was not returned');
      }
      window.location.assign(result.url);
    } catch (err) {
      setError(err.body?.error || err.message);
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Your Cart</h1>
      {error ? <p className="error">{error}</p> : null}
      {items.length === 0 ? (
        <div className="empty">Your cart is empty.</div>
      ) : (
        <>
          <div className="table-wrap cart-table-wrap">
            <table className="cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Size</th>
                  <th scope="col">Price</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Total</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.key}>
                    <td>
                      <div className="cart-product-cell">
                        <Link
                          to={`/products/${it.productId}`}
                          className="cart-product-link"
                        >
                          <div className="cart-thumb-wrap">
                            <ProductImage src={it.image_url} alt="" />
                          </div>
                          <span className="cart-product-name">{it.name}</span>
                        </Link>
                      </div>
                    </td>
                    <td className="cart-table-size">
                      {formatProductSizeLabel(it.product_size) ?? (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="cart-table-num">
                      {hasDiscount(it) ? (
                        <div className="cart-price-stack">
                          <span className="cart-price-stack__now">
                            {formatPrice(getDiscountedUnitPrice(it))}
                          </span>
                          <span className="cart-price-stack__original">{formatPrice(it.price)}</span>
                        </div>
                      ) : (
                        formatPrice(it.price)
                      )}
                    </td>
                    <td>
                      <input
                        id={`qty-${it.key}`}
                        type="number"
                        min="1"
                        max="99"
                        value={it.quantity}
                        onChange={(e) => updateQty(it.key, e.target.value)}
                        className="cart-qty-input"
                        aria-label={`Quantity for ${it.name}`}
                      />
                    </td>
                    <td className="cart-table-num cart-line-total">
                      {hasDiscount(it) ? (
                        <div className="cart-price-stack">
                          <span className="cart-price-stack__now">
                            {formatPrice(getDiscountedUnitPrice(it) * it.quantity)}
                          </span>
                          <span className="cart-price-stack__original">
                            {formatPrice(lineOriginalTotal(it))}
                          </span>
                        </div>
                      ) : (
                        formatPrice(Number(it.price) * it.quantity)
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeItem(it.key)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cart-summary card">
            <h2 className="cart-summary-title">Order summary</h2>
            <div className="cart-summary-rows">
              <div className="row cart-summary-line">
                <span className="muted">Subtotal</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <div className="row cart-summary-line">
                <span className="muted">Tax (8.25%)</span>
                <strong>{formatPrice(taxAmount)}</strong>
              </div>
              <div className="row cart-summary-line">
                <span className="muted">Shipping</span>
                <strong>{formatPrice(shippingCost)}</strong>
              </div>
              <div className="row cart-summary-line cart-summary-total">
                <span>Total</span>
                <strong>{formatPrice(grandTotal)}</strong>
              </div>
            </div>
          </div>
        </>
      )}

      <h2>Checkout</h2>
      <div className="wizard-progress">
        {[
          { n: 1, label: 'Address' },
          { n: 2, label: 'Shipping' },
          { n: 3, label: 'Billing' },
          { n: 4, label: 'Payment' },
        ].map(({ n, label }) => (
          <span
            key={n}
            className={`wizard-step${step === n ? ' current' : ''}${step > n ? ' done' : ''}`}
          >
            {step > n ? `✓ ${label}` : `${n}. ${label}`}
          </span>
        ))}
      </div>
      <form className="form" onSubmit={payWithStripe}>
        {step === 1 ? (
          <>
            <div className="field">
              <label htmlFor="cname">Contact full name</label>
              <input
                id="cname"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="cemail">Contact email</label>
              <input
                id="cemail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="cphone">Contact phone</label>
              <input
                id="cphone"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <div className="field">
              <label htmlFor="sa1">Shipping address line 1</label>
              <input
                id="sa1"
                value={form.shippingAddress1}
                onChange={(e) => setForm({ ...form, shippingAddress1: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="sa2">Shipping address line 2</label>
              <input
                id="sa2"
                value={form.shippingAddress2}
                onChange={(e) => setForm({ ...form, shippingAddress2: e.target.value })}
              />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="scity">City</label>
                <input
                  id="scity"
                  value={form.shippingCity}
                  onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                  required
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="sstate">State</label>
                <input
                  id="sstate"
                  value={form.shippingState}
                  onChange={(e) => setForm({ ...form, shippingState: e.target.value })}
                  required
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="spostal">Postal code</label>
                <input
                  id="spostal"
                  value={form.shippingPostalCode}
                  onChange={(e) => setForm({ ...form, shippingPostalCode: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="scountry">Country</label>
              <input
                id="scountry"
                value={form.shippingCountry}
                onChange={(e) => setForm({ ...form, shippingCountry: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="shipopt">Shipping option</label>
              <select
                id="shipopt"
                value={form.shippingMethod}
                onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })}
              >
                <option value="standard">Standard (3-5 days) - {formatPrice(9.99)}</option>
                <option value="express">Express (1-2 days) - {formatPrice(19.99)}</option>
                <option value="pickup">Store pickup - {formatPrice(0)}</option>
              </select>
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <div className="field row">
              <input
                id="same-as-shipping"
                type="checkbox"
                checked={billingSameAsShipping}
                onChange={(e) => toggleBillingSameAsShipping(e.target.checked)}
              />
              <label
                htmlFor="same-as-shipping"
                style={{ margin: 0, textTransform: 'none', letterSpacing: 'normal' }}
              >
                Billing address same as shipping
              </label>
            </div>
            <div className="field">
              <label htmlFor="bname">Billing full name</label>
              <input
                id="bname"
                value={form.billingName}
                onChange={(e) => setForm({ ...form, billingName: e.target.value })}
                disabled={billingSameAsShipping}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="ba1">Billing address line 1</label>
              <input
                id="ba1"
                value={form.billingAddress1}
                onChange={(e) => setForm({ ...form, billingAddress1: e.target.value })}
                disabled={billingSameAsShipping}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="ba2">Billing address line 2</label>
              <input
                id="ba2"
                value={form.billingAddress2}
                onChange={(e) => setForm({ ...form, billingAddress2: e.target.value })}
                disabled={billingSameAsShipping}
              />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="bcity">City</label>
                <input
                  id="bcity"
                  value={form.billingCity}
                  onChange={(e) => setForm({ ...form, billingCity: e.target.value })}
                  disabled={billingSameAsShipping}
                  required
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="bstate">State</label>
                <input
                  id="bstate"
                  value={form.billingState}
                  onChange={(e) => setForm({ ...form, billingState: e.target.value })}
                  disabled={billingSameAsShipping}
                  required
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="bpostal">Postal code</label>
                <input
                  id="bpostal"
                  value={form.billingPostalCode}
                  onChange={(e) => setForm({ ...form, billingPostalCode: e.target.value })}
                  disabled={billingSameAsShipping}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="bcountry">Country</label>
              <input
                id="bcountry"
                value={form.billingCountry}
                onChange={(e) => setForm({ ...form, billingCountry: e.target.value })}
                disabled={billingSameAsShipping}
                required
              />
            </div>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <p className="page-body">
              You will be redirected to Stripe&apos;s secure checkout to pay{' '}
              <strong>{formatPrice(grandTotal)}</strong>. Test cards work in sandbox mode (for example{' '}
              <code>4242 4242 4242 4242</code>).
            </p>
          </>
        ) : null}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            Back
          </button>
          {step < 4 ? (
            <button type="button" className="btn btn-primary" onClick={nextStep}>
              Continue
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={busy || items.length === 0}>
              {busy ? 'Redirecting to Stripe…' : 'Pay with Stripe'}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
