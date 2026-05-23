import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api.js';
import {
  BATTING_OPTIONS,
  COLOR_PALETTE_OPTIONS,
  CUSTOMIZE_SIZE_OPTIONS,
  estimateCustomQuiltPrice,
  getDesignById,
  labelForBatting,
  labelForColorPalette,
  labelForCustomizeSize,
  QUILT_DESIGN_PALETTE,
} from '../lib/quiltDesignPalette.js';

const STEPS = [
  { n: 1, label: 'Design' },
  { n: 2, label: 'Size & colors' },
  { n: 3, label: 'Your vision' },
  { n: 4, label: 'Contact' },
  { n: 5, label: 'Review' },
];

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function CustomizeChoiceGrid({ heading, options, value, onChange, name }) {
  return (
    <div className="customize-choices">
      <h3 className="customize-choices__heading">{heading}</h3>
      <div className="customize-choices__grid" role="listbox" aria-label={heading}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              name={name}
              className={`customize-choices__card${selected ? ' customize-choices__card--selected' : ''}`}
              onClick={() => onChange(option.value)}
            >
              <img src={option.image} alt="" loading="lazy" decoding="async" />
              <span className="customize-choices__label">{option.label}</span>
              {option.hint ? <span className="customize-choices__hint muted">{option.hint}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const initialForm = {
  designId: '',
  productSize: 'large',
  colorPalette: 'warm-neutrals',
  batting: 'cotton',
  quiltTitle: '',
  notes: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

export default function Customize() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const selectedDesign = useMemo(() => getDesignById(form.designId), [form.designId]);
  const estimatedPrice = useMemo(
    () => (form.designId && form.productSize ? estimateCustomQuiltPrice(form.designId, form.productSize) : null),
    [form.designId, form.productSize]
  );

  function nextStep() {
    setError(null);
    if (step === 1 && !form.designId) {
      setError('Choose a design from the palette to continue.');
      return;
    }
    if (step === 2 && (!form.productSize || !form.colorPalette)) {
      setError('Select a size and color palette.');
      return;
    }
    if (step === 4) {
      if (!form.contactName.trim() || !form.contactEmail.trim()) {
        setError('Enter your name and email so our designer can reach you.');
        return;
      }
    }
    setStep((s) => Math.min(5, s + 1));
  }

  async function submitRequest(e) {
    e.preventDefault();
    if (!selectedDesign) {
      setError('Select a design before submitting.');
      setStep(1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await publicApi.submitCustomQuiltRequest({
        designId: form.designId,
        designName: selectedDesign.name,
        productSize: form.productSize,
        colorPalette: form.colorPalette,
        batting: form.batting,
        quiltTitle: form.quiltTitle.trim() || null,
        notes: form.notes.trim() || null,
        estimatedPrice,
        customer: {
          name: form.contactName.trim(),
          email: form.contactEmail.trim(),
          phone: form.contactPhone.trim() || null,
        },
      });
      setSubmitted({
        requestNumber: result.requestNumber,
        email: form.contactEmail.trim(),
      });
      setForm(initialForm);
      setStep(1);
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <article className="customize-page">
        <h1>Request sent to our designer</h1>
        <p className="page-body">
          Thank you! Your custom quilt request <strong>{submitted.requestNumber}</strong> is in our
          studio queue. We will email <strong>{submitted.email}</strong> within 2–3 business days with
          next steps and a formal quote.
        </p>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => setSubmitted(null)}>
            Start another design
          </button>
          <Link className="btn" to="/products">
            Browse ready-made quilts
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="customize-page">
      <header className="customize-page__header">
        <p className="eyebrow">Custom studio</p>
        <h1>Customize your quilt</h1>
        <p className="page-body">
          Build your quilt step by step—choose a design from our palette, set size and colors, then
          send your request to our designer. No payment is collected here; we will follow up with a
          personalized quote.
        </p>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="wizard-progress customize-wizard__progress">
        {STEPS.map(({ n, label }) => (
          <span
            key={n}
            className={`wizard-step${step === n ? ' current' : ''}${step > n ? ' done' : ''}`}
          >
            {step > n ? `✓ ${label}` : `${n}. ${label}`}
          </span>
        ))}
      </div>

      <form className="form customize-form" onSubmit={step === 5 ? submitRequest : (e) => e.preventDefault()}>
        {step === 1 ? (
          <section className="customize-step">
            <h2>Choose a design palette</h2>
            <p className="muted">Select the pattern family that best matches your room and style.</p>
            <div className="design-palette" role="listbox" aria-label="Quilt design palette">
              {QUILT_DESIGN_PALETTE.map((design) => {
                const selected = form.designId === design.id;
                return (
                  <button
                    key={design.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`design-palette__card${selected ? ' design-palette__card--selected' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, designId: design.id }))}
                  >
                    <img src={design.image} alt="" loading="lazy" />
                    <span className="design-palette__name">{design.name}</span>
                    <span className="design-palette__desc muted">{design.description}</span>
                    <span className="design-palette__price">From {formatPrice(design.basePrice)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="customize-step">
            <h2>Size, colors &amp; batting</h2>
            {selectedDesign ? (
              <p className="muted">
                Based on <strong>{selectedDesign.name}</strong>
                {estimatedPrice != null ? (
                  <>
                    {' '}
                    — estimated starting at <strong>{formatPrice(estimatedPrice)}</strong>
                  </>
                ) : null}
              </p>
            ) : null}
            <CustomizeChoiceGrid
              heading="Quilt size"
              name="productSize"
              options={CUSTOMIZE_SIZE_OPTIONS}
              value={form.productSize}
              onChange={(productSize) => setForm((f) => ({ ...f, productSize }))}
            />
            <CustomizeChoiceGrid
              heading="Color palette"
              name="colorPalette"
              options={COLOR_PALETTE_OPTIONS}
              value={form.colorPalette}
              onChange={(colorPalette) => setForm((f) => ({ ...f, colorPalette }))}
            />
            <CustomizeChoiceGrid
              heading="Batting preference"
              name="batting"
              options={BATTING_OPTIONS}
              value={form.batting}
              onChange={(batting) => setForm((f) => ({ ...f, batting }))}
            />
          </section>
        ) : null}

        {step === 3 ? (
          <section className="customize-step">
            <h2>Tell our designer your vision</h2>
            <div className="field">
              <label htmlFor="quilt-title">Working title (optional)</label>
              <input
                id="quilt-title"
                value={form.quiltTitle}
                onChange={(e) => setForm((f) => ({ ...f, quiltTitle: e.target.value }))}
                placeholder="e.g. Guest room sunset quilt"
              />
            </div>
            <div className="field">
              <label htmlFor="designer-notes">Notes for the designer</label>
              <textarea
                id="designer-notes"
                rows={5}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Room colors, deadline, gift recipient, pattern tweaks, etc."
              />
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="customize-step">
            <h2>How can we reach you?</h2>
            <div className="field">
              <label htmlFor="custom-name">Full name</label>
              <input
                id="custom-name"
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="custom-email">Email</label>
              <input
                id="custom-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="custom-phone">Phone (optional)</label>
              <input
                id="custom-phone"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              />
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <section className="customize-step">
            <h2>Review &amp; submit to designer</h2>
            <div className="customize-review card">
              {selectedDesign ? (
                <div className="customize-review__design">
                  <img src={selectedDesign.image} alt="" />
                  <div>
                    <h3>{selectedDesign.name}</h3>
                    <p className="muted">{selectedDesign.description}</p>
                  </div>
                </div>
              ) : null}
              <dl className="customize-review__dl">
                <div>
                  <dt>Size</dt>
                  <dd>{labelForCustomizeSize(form.productSize)}</dd>
                </div>
                <div>
                  <dt>Color palette</dt>
                  <dd>{labelForColorPalette(form.colorPalette)}</dd>
                </div>
                <div>
                  <dt>Batting</dt>
                  <dd>{labelForBatting(form.batting)}</dd>
                </div>
                {form.quiltTitle ? (
                  <div>
                    <dt>Title</dt>
                    <dd>{form.quiltTitle}</dd>
                  </div>
                ) : null}
                {form.notes ? (
                  <div>
                    <dt>Notes</dt>
                    <dd>{form.notes}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {form.contactName}
                    <br />
                    {form.contactEmail}
                    {form.contactPhone ? (
                      <>
                        <br />
                        {form.contactPhone}
                      </>
                    ) : null}
                  </dd>
                </div>
                {estimatedPrice != null ? (
                  <div>
                    <dt>Estimated starting price</dt>
                    <dd>
                      <strong>{formatPrice(estimatedPrice)}</strong>
                      <span className="muted"> — final quote from designer</span>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <p className="muted customize-review__fine">
              By submitting, you agree that this is a design request only—not a confirmed order. Our
              designer will contact you before any work begins.
            </p>
          </section>
        ) : null}

        <div className="row customize-form__nav">
          <button
            type="button"
            className="btn"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || busy}
          >
            Back
          </button>
          {step < 5 ? (
            <button type="button" className="btn btn-primary" onClick={nextStep}>
              Continue
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Sending to designer…' : 'Submit request to designer'}
            </button>
          )}
        </div>
      </form>
    </article>
  );
}
