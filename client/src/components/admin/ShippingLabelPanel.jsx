import { useEffect, useId, useState } from 'react';
import { adminApi } from '../../api.js';
import { emptyLabelAddress, formatLabelBlock } from '../../lib/shippingLabel.js';
import { SITE_LOGO_ALT, SITE_LOGO_URL } from '../../lib/siteBrand.js';

function AddressFields({ title, value, onChange }) {
  const id = useId();
  const setKey = (key, val) => onChange({ ...value, [key]: val });
  const field = (key, label, opts = {}) => (
    <div className="field" key={key}>
      <label htmlFor={`${id}-${key}`}>{label}</label>
      <input
        id={`${id}-${key}`}
        value={value[key]}
        onChange={(e) => setKey(key, e.target.value)}
        required={opts.required}
        autoComplete={opts.autoComplete}
      />
    </div>
  );

  return (
    <fieldset className="shipping-label-address">
      <legend>{title}</legend>
      {field('name', 'Name', { required: true, autoComplete: 'name' })}
      {field('address1', 'Address line 1', { required: true, autoComplete: 'address-line1' })}
      {field('address2', 'Address line 2', { autoComplete: 'address-line2' })}
      <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '2 1 140px' }}>
          <label htmlFor={`${id}-city`}>City</label>
          <input
            id={`${id}-city`}
            value={value.city}
            onChange={(e) => setKey('city', e.target.value)}
            required
            autoComplete="address-level2"
          />
        </div>
        <div className="field" style={{ flex: '1 1 80px' }}>
          <label htmlFor={`${id}-state`}>State</label>
          <input
            id={`${id}-state`}
            value={value.state}
            onChange={(e) => setKey('state', e.target.value)}
            required
            autoComplete="address-level1"
          />
        </div>
        <div className="field" style={{ flex: '1 1 100px' }}>
          <label htmlFor={`${id}-postal`}>Postal code</label>
          <input
            id={`${id}-postal`}
            value={value.postalCode}
            onChange={(e) => setKey('postalCode', e.target.value)}
            required
            autoComplete="postal-code"
          />
        </div>
      </div>
      {field('country', 'Country', { required: true, autoComplete: 'country-name' })}
      {field('phone', 'Phone', { autoComplete: 'tel' })}
    </fieldset>
  );
}

function LabelPreview({ orderNumber, from, to, tracking }) {
  return (
    <div className="shipping-label-sheet" aria-label="Shipping label preview">
      <div className="shipping-label-sheet__inner">
        <img
          className="shipping-label-sheet__logo"
          src={SITE_LOGO_URL}
          alt={SITE_LOGO_ALT}
          width={858}
          height={703}
          decoding="sync"
          loading="eager"
        />
        <p className="shipping-label-sheet__order">Order {orderNumber}</p>
        {tracking?.number ? (
          <p className="shipping-label-sheet__tracking">
            {tracking.carrierLabel}: {tracking.number}
          </p>
        ) : null}
        <div className="shipping-label-sheet__from">
          <p className="shipping-label-sheet__label">From</p>
          {formatLabelBlock(from).map((line) => (
            <p key={`from-${line}`}>{line}</p>
          ))}
        </div>
        <div className="shipping-label-sheet__to">
          <p className="shipping-label-sheet__label">Ship to</p>
          {formatLabelBlock(to).map((line) => (
            <p key={`to-${line}`}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShippingLabelPanel({ orderId, orderNumber, tracking, onSaved }) {
  const [from, setFrom] = useState(emptyLabelAddress);
  const [to, setTo] = useState(emptyLabelAddress);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .orderShippingLabel(orderId)
      .then((data) => {
        if (cancelled) return;
        setFrom(data.from ?? emptyLabelAddress);
        setTo(data.to ?? emptyLabelAddress);
      })
      .catch((e) => {
        if (!cancelled) setError(e.body?.error || e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function saveAddresses() {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await adminApi.updateOrderShippingLabel(orderId, { from, to });
      setInfo('Addresses saved.');
      onSaved?.();
    } catch (e) {
      setError(e.body?.error || e.message);
    } finally {
      setSaving(false);
    }
  }

  function printLabel() {
    document.body.classList.add('printing-shipping-label');
    const cleanup = () => document.body.classList.remove('printing-shipping-label');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  }

  if (loading) {
    return <p className="muted">Loading shipping label…</p>;
  }

  return (
    <section className="admin-shipping-label card" style={{ marginTop: '1.25rem' }}>
      <h4 style={{ marginTop: 0 }}>Shipping label</h4>
      <p className="muted" style={{ marginTop: 0 }}>
        Adjust the return address and ship-to address, save, then print a 4×6-style label for packing.
      </p>
      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="muted">{info}</p> : null}

      <div className="admin-two-col admin-shipping-label__edit">
        <AddressFields title="From (return address)" value={from} onChange={setFrom} />
        <AddressFields title="To (recipient)" value={to} onChange={setTo} />
      </div>

      <div className="row" style={{ marginTop: '1rem', gap: '0.65rem' }}>
        <button type="button" className="btn btn-primary" onClick={saveAddresses} disabled={saving}>
          {saving ? 'Saving…' : 'Save addresses'}
        </button>
        <button type="button" className="btn" onClick={printLabel}>
          Print shipping label
        </button>
      </div>

      <LabelPreview
        orderNumber={orderNumber}
        from={from}
        to={to}
        tracking={tracking}
      />
    </section>
  );
}
