import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import CustomizeOwnDesignUpload from '../components/CustomizeOwnDesignUpload.jsx';
import CustomizePurchasePreview from '../components/CustomizePurchasePreview.jsx';
import CustomizeServicesBanner from '../components/CustomizeServicesBanner.jsx';
import PageLoading from '../components/PageLoading.jsx';
import {
  OWN_DESIGN_DEPOSIT_USD,
  OWN_DESIGN_ID,
  buildOwnDesignSelection,
  estimateCustomizePrice,
  findCustomizeDesign,
  isOwnDesignId,
  productDesignId,
  productToCustomizeDesign,
  truncateCustomizeDescription,
} from '../lib/customizeProductDesign.js';
import { getClientFallbackCustomizeConfig } from '../lib/customizeWizardFallback.js';
import {
  activeBattingOptions,
  activeColorOptions,
  activeSizeOptions,
  getEnabledWizardSteps,
  getWizardStep,
  interpolate,
  isWizardStepEnabled,
  labelForBattingOption,
  labelForColorOption,
  labelForSizeOption,
  nextWizardStep,
  prevWizardStep,
} from '../lib/customizeWizardHelpers.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function CustomizeChoiceGrid({ heading, options, value, onChange, name, variant = 'image' }) {
  const useLetters = variant === 'letter';
  const useSwatches = variant === 'swatch';

  return (
    <div className="customize-choices">
      <h3 className="customize-choices__heading">{heading}</h3>
      <div className="customize-choices__grid" role="listbox" aria-label={heading}>
        {options.map((option) => {
          const selected = value === option.value;
          const letter = option.code ?? '';
          const longLetter = letter.length > 2;
          const swatches = Array.isArray(option.colors) ? option.colors : [];
          const showLetterTile = Boolean(letter && (useLetters || !option.image));
          const ariaLabel =
            showLetterTile && letter
              ? `${option.label}, ${letter}`
              : useSwatches && option.hint
                ? `${option.label}, ${option.hint}`
                : option.label;

          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={ariaLabel}
              name={name}
              className={`customize-choices__card${selected ? ' customize-choices__card--selected' : ''}${showLetterTile ? ' customize-choices__card--letter' : ''}${useSwatches ? ' customize-choices__card--swatch' : ''}`}
              onClick={() => onChange(option.value)}
            >
              {showLetterTile ? (
                <span
                  className={`customize-choices__letter-tile${longLetter ? ' customize-choices__letter-tile--long' : ''}${letter === '?' ? ' customize-choices__letter-tile--symbol' : ''}`}
                  aria-hidden="true"
                >
                  {letter}
                </span>
              ) : useSwatches && swatches.length > 0 ? (
                <span
                  className={`customize-choices__color-tile${option.swatchLayout === 'stripes' ? ' customize-choices__color-tile--stripes' : ''}`}
                  aria-hidden="true"
                >
                  {swatches.map((color, index) => (
                    <span
                      key={`${option.value}-${index}`}
                      className="customize-choices__color-swatch"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
              ) : (
                <img src={option.image} alt="" loading="lazy" decoding="async" />
              )}
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
  ownDesignImageUrl: '',
  quiltTitle: '',
  notes: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

export default function Customize() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [payCountdown, setPayCountdown] = useState(0);
  const [wizardConfig, setWizardConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [longArmServices, setLongArmServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [designPath, setDesignPath] = useState('catalog');
  const [ownDesignPreviewUrl, setOwnDesignPreviewUrl] = useState('');
  const [ownDesignUploading, setOwnDesignUploading] = useState(false);
  const [ownDesignUploadError, setOwnDesignUploadError] = useState(null);
  const ownDesignBlobRef = useRef(null);

  const config = wizardConfig ?? getClientFallbackCustomizeConfig();
  const payPauseSeconds = Math.min(30, Math.max(0, Number(config.pay?.pauseSeconds ?? 4) || 0));
  const enabledSteps = getEnabledWizardSteps(config);
  const maxStep = enabledSteps.length ? enabledSteps[enabledSteps.length - 1].n : 5;

  useEffect(() => {
    let cancelled = false;
    async function loadConfig() {
      try {
        const data = await publicApi.customizeConfig();
        if (!cancelled) setWizardConfig(data);
      } catch {
        if (!cancelled) setWizardConfig(null);
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    }
    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!config.defaults) return;
    setForm((f) => ({
      ...f,
      productSize: f.productSize || config.defaults.productSize || 'large',
      colorPalette: f.colorPalette || config.defaults.colorPalette || 'warm-neutrals',
      batting: f.batting || config.defaults.batting || 'cotton',
    }));
  }, [config.defaults?.productSize, config.defaults?.colorPalette, config.defaults?.batting]);

  useEffect(() => {
    let cancelled = false;
    async function loadServices() {
      try {
        const rows = await publicApi.listLongArmServices();
        if (!cancelled) setLongArmServices(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setLongArmServices([]);
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    }
    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      try {
        const rows = await publicApi.listProducts();
        if (!cancelled) setProducts(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const pre = searchParams.get('product');
    if (!pre || products.length === 0) return;
    const id = Number(pre);
    if (!Number.isFinite(id)) return;
    const match = products.find((p) => Number(p.id) === id);
    if (match) {
      setDesignPath('catalog');
      setForm((f) => ({ ...f, designId: productDesignId(match.id) }));
    }
  }, [products, searchParams]);

  useEffect(() => {
    if (step !== 5) {
      setPayCountdown(0);
      return undefined;
    }
    setPayCountdown(payPauseSeconds);
    if (payPauseSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setPayCountdown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, payPauseSeconds]);

  useEffect(() => {
    return () => {
      if (ownDesignBlobRef.current) {
        URL.revokeObjectURL(ownDesignBlobRef.current);
        ownDesignBlobRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('checkout') === 'cancelled') {
      setError(config.messages?.checkoutCancelled ?? 'Payment was cancelled.');
      setStep(isWizardStepEnabled(config, 5) ? 5 : maxStep);
      const next = new URLSearchParams(searchParams);
      next.delete('checkout');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, config, maxStep]);

  const selectedDesign = useMemo(() => {
    if (isOwnDesignId(form.designId) || designPath === 'own-design') {
      return buildOwnDesignSelection(ownDesignPreviewUrl || form.ownDesignImageUrl);
    }
    return findCustomizeDesign(form.designId, products);
  }, [form.designId, form.ownDesignImageUrl, designPath, products, ownDesignPreviewUrl]);
  const estimatedPrice = useMemo(() => {
    if (!form.designId) return null;
    if (isOwnDesignId(form.designId)) {
      return estimateCustomizePrice(form.designId, form.productSize, products);
    }
    if (!form.productSize) return null;
    return estimateCustomizePrice(form.designId, form.productSize, products);
  }, [form.designId, form.productSize, products]);

  function revokeOwnDesignBlob() {
    if (ownDesignBlobRef.current) {
      URL.revokeObjectURL(ownDesignBlobRef.current);
      ownDesignBlobRef.current = null;
    }
  }

  async function handleOwnDesignFile(file) {
    setOwnDesignUploadError(null);
    revokeOwnDesignBlob();
    const blobUrl = URL.createObjectURL(file);
    ownDesignBlobRef.current = blobUrl;
    setOwnDesignPreviewUrl(blobUrl);
    setOwnDesignUploading(true);
    try {
      const result = await publicApi.uploadCustomizeOwnDesign(file);
      const url = result?.url ?? '';
      setForm((f) => ({ ...f, ownDesignImageUrl: url }));
      setOwnDesignPreviewUrl(url);
      revokeOwnDesignBlob();
    } catch (err) {
      setOwnDesignUploadError(err.body?.error || err.message);
      setForm((f) => ({ ...f, ownDesignImageUrl: '' }));
    } finally {
      setOwnDesignUploading(false);
    }
  }

  function clearOwnDesign() {
    revokeOwnDesignBlob();
    setOwnDesignPreviewUrl('');
    setOwnDesignUploadError(null);
    setForm((f) => ({ ...f, ownDesignImageUrl: '' }));
  }

  function selectCatalogPath() {
    setDesignPath('catalog');
    setError(null);
    setForm((f) => ({ ...f, designId: isOwnDesignId(f.designId) ? '' : f.designId }));
    if (isOwnDesignId(form.designId)) {
      clearOwnDesign();
    }
  }

  function selectOwnDesignPath() {
    setDesignPath('own-design');
    setError(null);
    setForm((f) => ({ ...f, designId: OWN_DESIGN_ID }));
  }

  const ownDesignDisplayUrl = ownDesignPreviewUrl || form.ownDesignImageUrl || '';
  const isOwnDesignFlow = designPath === 'own-design' || isOwnDesignId(form.designId);

  function nextStep() {
    setError(null);
    if (step === 1) {
      if (designPath === 'catalog') {
        if (!form.designId || isOwnDesignId(form.designId)) {
          setError(config.messages?.chooseProduct ?? 'Choose a product from the catalog to continue.');
          return;
        }
      } else {
        if (ownDesignUploading) {
          setError('Please wait for your design image to finish uploading.');
          return;
        }
        if (!form.ownDesignImageUrl.trim()) {
          setError(
            config.messages?.ownDesignRequired ??
              'Upload your design image to continue with your own design.'
          );
          return;
        }
        setForm((f) => ({ ...f, designId: OWN_DESIGN_ID }));
      }
    }
    if (step === 2) {
      if (ownDesignUploading) {
        setError('Please wait for your design image to finish uploading.');
        return;
      }
      if (!form.productSize || !form.colorPalette) {
        setError(config.messages?.selectSizeColor ?? 'Select a size and color palette.');
        return;
      }
    }
    if (step === 4) {
      if (!form.contactName.trim() || !form.contactEmail.trim()) {
        setError(config.messages?.contactRequired ?? 'Enter your name and email.');
        return;
      }
    }
    setStep((s) => nextWizardStep(config, s));
  }

  async function payWithStripe(e) {
    e.preventDefault();
    if (!selectedDesign) {
      setError(config.messages?.selectDesignPay ?? 'Select a design before paying.');
      setStep(1);
      return;
    }
    if (estimatedPrice == null || estimatedPrice <= 0) {
      setError(config.messages?.priceError ?? 'Could not calculate price for this design and size.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await publicApi.createCustomQuiltStripeCheckoutSession({
        designId: form.designId,
        designName: selectedDesign.name,
        productSize: form.productSize,
        colorPalette: form.colorPalette,
        batting: form.batting,
        quiltTitle: form.quiltTitle.trim() || null,
        notes: form.notes.trim() || null,
        ownDesignImageUrl: form.ownDesignImageUrl.trim() || null,
        estimatedPrice,
        customer: {
          name: form.contactName.trim(),
          email: form.contactEmail.trim(),
          phone: form.contactPhone.trim() || null,
        },
      });
      if (!result?.url) {
        throw new Error('Stripe checkout URL was not returned');
      }
      window.location.assign(result.url);
    } catch (err) {
      setError(err.body?.error || err.message);
      setBusy(false);
    }
  }

  if (loadingConfig) {
    return <PageLoading active label="Loading customize studio…" />;
  }

  if (config.enabled === false) {
    return (
      <article className="customize-page">
        <CustomizeServicesBanner services={longArmServices} loading={loadingServices} />
        <h1>{config.page?.title ?? 'Customize your quilt'}</h1>
        <p className="page-body">
          {config.messages?.wizardDisabled ??
            'Custom quilt orders are temporarily unavailable. Please check back soon.'}
        </p>
        <Link className="btn" to="/products">
          Browse products
        </Link>
      </article>
    );
  }

  const step1 = getWizardStep(config, 1);
  const step2 = getWizardStep(config, 2);
  const step3 = getWizardStep(config, 3);
  const step4 = getWizardStep(config, 4);
  const step5 = getWizardStep(config, 5);
  const payStepActive = step === 5 && isWizardStepEnabled(config, 5);

  return (
    <article className="customize-page">
      <CustomizeServicesBanner services={longArmServices} loading={loadingServices} />
      <header className="customize-page__header">
        <p className="eyebrow">{config.page?.eyebrow ?? 'Custom studio'}</p>
        <h1>{config.page?.title ?? 'Customize your quilt'}</h1>
        <p className="page-body">{config.page?.intro ?? ''}</p>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="wizard-progress customize-wizard__progress">
        {enabledSteps.map(({ n, label }) => (
          <span
            key={n}
            className={`wizard-step${step === n ? ' current' : ''}${step > n ? ' done' : ''}`}
          >
            {step > n ? `✓ ${label}` : `${n}. ${label}`}
          </span>
        ))}
      </div>

      <form
        className="form customize-form"
        onSubmit={payStepActive ? payWithStripe : (e) => e.preventDefault()}
      >
        {step === 1 && isWizardStepEnabled(config, 1) ? (
          <section className="customize-step">
            <h2>{step1?.title ?? 'Choose a quilt to customize'}</h2>
            <p className="muted">{step1?.description ?? ''}</p>

            <div
              className="customize-path-chooser"
              role="tablist"
              aria-label="How to start your custom quilt"
            >
              <button
                type="button"
                role="tab"
                aria-selected={designPath === 'catalog'}
                className={`customize-path-chooser__option${designPath === 'catalog' ? ' customize-path-chooser__option--active' : ''}`}
                onClick={selectCatalogPath}
              >
                <span className="customize-path-chooser__title">Shop product</span>
                <span className="muted customize-path-chooser__hint">
                  Pick a quilt from our catalog and pay the estimated price at checkout.
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={designPath === 'own-design'}
                className={`customize-path-chooser__option${designPath === 'own-design' ? ' customize-path-chooser__option--active' : ''}`}
                onClick={selectOwnDesignPath}
              >
                <span className="customize-path-chooser__title">Your own design</span>
                <span className="muted customize-path-chooser__hint">
                  Upload your design and pay a {formatPrice(OWN_DESIGN_DEPOSIT_USD)} deposit today.
                </span>
              </button>
            </div>

            {designPath === 'catalog' ? (
              loadingProducts ? (
                <PageLoading active label={config.messages?.loadingProducts ?? 'Loading products…'} inline />
              ) : products.length === 0 ? (
                <p className="muted">
                  {step1?.emptyProductsMessage ?? 'No published products are available yet.'}{' '}
                  <Link to="/products">Browse the shop</Link>
                </p>
              ) : (
                <div className="design-palette" role="group" aria-label="Products to customize">
                  {products.map((product) => {
                    const design = productToCustomizeDesign(product);
                    const selected = form.designId === design.id;
                    const detailPath = `/products/${product.id}`;
                    return (
                      <article
                        key={product.id}
                        className={`design-palette__card${selected ? ' design-palette__card--selected' : ''}`}
                      >
                        <Link className="design-palette__link" to={detailPath}>
                          <span className="design-palette__media">
                            <ProductImage src={design.image} alt={design.name} />
                          </span>
                          <span className="design-palette__name">{design.name}</span>
                          {design.description ? (
                            <span className="design-palette__desc muted">
                              {truncateCustomizeDescription(design.description)}
                            </span>
                          ) : null}
                          <span className="design-palette__price">
                            From {formatPrice(design.basePrice)} <span className="muted">(Small)</span>
                          </span>
                        </Link>
                        <button
                          type="button"
                          className={`btn design-palette__select${selected ? ' design-palette__select--selected' : ''}`}
                          aria-pressed={selected}
                          onClick={() => {
                            setDesignPath('catalog');
                            setForm((f) => ({ ...f, designId: design.id }));
                          }}
                        >
                          {selected ? 'Selected' : 'Select'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )
            ) : (
              <CustomizeOwnDesignUpload
                required
                depositAmount={OWN_DESIGN_DEPOSIT_USD}
                previewUrl={ownDesignDisplayUrl}
                uploading={ownDesignUploading}
                uploadError={ownDesignUploadError}
                onPickFile={handleOwnDesignFile}
                onClear={clearOwnDesign}
              />
            )}
          </section>
        ) : null}

        {step === 2 && isWizardStepEnabled(config, 2) ? (
          <section className="customize-step">
            <h2>{step2?.title ?? 'Size, colors & batting'}</h2>
            {step2?.description ? <p className="muted">{step2.description}</p> : null}
            {selectedDesign && step2?.showSelectedProduct !== false ? (
              <div className="customize-selected-product card">
                <div className="customize-selected-product__thumb">
                  {isOwnDesignFlow && ownDesignDisplayUrl ? (
                    <img src={ownDesignDisplayUrl} alt="" />
                  ) : (
                    <ProductImage src={selectedDesign.image} alt={selectedDesign.name} />
                  )}
                </div>
                <p className="customize-selected-product__summary muted">
                  {isOwnDesignFlow ? (
                    <>
                      <strong>{selectedDesign.name}</strong>
                      {estimatedPrice != null ? (
                        <>
                          {' '}
                          — design deposit <strong>{formatPrice(estimatedPrice)}</strong>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {step2?.basedOnPrefix ?? 'Based on'} <strong>{selectedDesign.name}</strong>
                      {estimatedPrice != null ? (
                        <>
                          {' '}
                          {step2?.estimatedPrefix ?? '— estimated starting at'}{' '}
                          <strong>{formatPrice(estimatedPrice)}</strong>
                        </>
                      ) : null}
                    </>
                  )}
                </p>
              </div>
            ) : null}
            {config.sections?.sizes?.enabled !== false ? (
              <CustomizeChoiceGrid
                heading={config.sections?.sizes?.heading ?? 'Quilt size'}
                name="productSize"
                variant="letter"
                options={activeSizeOptions(config)}
                value={form.productSize}
                onChange={(productSize) => setForm((f) => ({ ...f, productSize }))}
              />
            ) : null}
            {config.sections?.colors?.enabled !== false ? (
              <CustomizeChoiceGrid
                heading={config.sections?.colors?.heading ?? 'Color palette'}
                name="colorPalette"
                variant="swatch"
                options={activeColorOptions(config)}
                value={form.colorPalette}
                onChange={(colorPalette) => setForm((f) => ({ ...f, colorPalette }))}
              />
            ) : null}
            {config.sections?.batting?.enabled !== false ? (
              <CustomizeChoiceGrid
                heading={config.sections?.batting?.heading ?? 'Batting preference'}
                name="batting"
                options={activeBattingOptions(config)}
                value={form.batting}
                onChange={(batting) => setForm((f) => ({ ...f, batting }))}
              />
            ) : null}
            {!isOwnDesignFlow ? (
              <CustomizeOwnDesignUpload
                previewUrl={ownDesignDisplayUrl}
                uploading={ownDesignUploading}
                uploadError={ownDesignUploadError}
                onPickFile={handleOwnDesignFile}
                onClear={clearOwnDesign}
              />
            ) : null}
          </section>
        ) : null}

        {step === 3 && isWizardStepEnabled(config, 3) ? (
          <section className="customize-step">
            <h2>{step3?.title ?? 'Tell our designer your vision'}</h2>
            <CustomizePurchasePreview
              design={selectedDesign}
              config={config}
              productSize={form.productSize}
              colorPalette={form.colorPalette}
              batting={form.batting}
              estimatedPrice={estimatedPrice}
              ownDesignImageUrl={ownDesignDisplayUrl || null}
            />
            <div className="field">
              <label htmlFor="quilt-title">
                {step3?.quiltTitleLabel ?? 'Working title (optional)'}
              </label>
              <input
                id="quilt-title"
                value={form.quiltTitle}
                onChange={(e) => setForm((f) => ({ ...f, quiltTitle: e.target.value }))}
                placeholder={step3?.quiltTitlePlaceholder ?? ''}
              />
            </div>
            <div className="field">
              <label htmlFor="designer-notes">
                {step3?.notesLabel ?? 'Notes for the designer'}
              </label>
              <textarea
                id="designer-notes"
                rows={5}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder={step3?.notesPlaceholder ?? ''}
              />
            </div>
          </section>
        ) : null}

        {step === 4 && isWizardStepEnabled(config, 4) ? (
          <section className="customize-step">
            <h2>{step4?.title ?? 'How can we reach you?'}</h2>
            <CustomizePurchasePreview
              design={selectedDesign}
              config={config}
              productSize={form.productSize}
              colorPalette={form.colorPalette}
              batting={form.batting}
              estimatedPrice={estimatedPrice}
              ownDesignImageUrl={ownDesignDisplayUrl || null}
            />
            <div className="field">
              <label htmlFor="custom-name">{step4?.nameLabel ?? 'Full name'}</label>
              <input
                id="custom-name"
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="custom-email">{step4?.emailLabel ?? 'Email'}</label>
              <input
                id="custom-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="custom-phone">{step4?.phoneLabel ?? 'Phone (optional)'}</label>
              <input
                id="custom-phone"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              />
            </div>
          </section>
        ) : null}

        {payStepActive ? (
          <section className="customize-step">
            <h2>{step5?.title ?? 'Review & pay'}</h2>
            <div className="customize-review card">
              {selectedDesign ? (
                <div className="customize-review__design">
                  {isOwnDesignFlow && ownDesignDisplayUrl ? (
                    <img src={ownDesignDisplayUrl} alt="Your uploaded design" />
                  ) : selectedDesign.image ? (
                    <img src={selectedDesign.image} alt="" />
                  ) : (
                    <div className="featured-no-image customize-review__no-image">No image</div>
                  )}
                  <div>
                    <h3>{selectedDesign.name}</h3>
                    {selectedDesign.description ? (
                      <p className="muted">{selectedDesign.description}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <dl className="customize-review__dl">
                <div>
                  <dt>Size</dt>
                  <dd>{labelForSizeOption(config, form.productSize)}</dd>
                </div>
                <div>
                  <dt>Color palette</dt>
                  <dd>{labelForColorOption(config, form.colorPalette)}</dd>
                </div>
                <div>
                  <dt>Batting</dt>
                  <dd>{labelForBattingOption(config, form.batting)}</dd>
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
                {ownDesignDisplayUrl && !isOwnDesignFlow ? (
                  <div>
                    <dt>Your design reference</dt>
                    <dd>
                      <img
                        className="customize-review__own-design"
                        src={ownDesignDisplayUrl}
                        alt="Uploaded design reference"
                      />
                    </dd>
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
                    <dt>{isOwnDesignFlow ? 'Design deposit due today' : 'Amount due today'}</dt>
                    <dd>
                      <strong>{formatPrice(estimatedPrice)}</strong>
                      {isOwnDesignFlow ? (
                        <span className="muted"> — final quilt price confirmed by our designer</span>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
            {estimatedPrice != null && step5?.stripeIntro ? (
              <p className="page-body">
                {interpolate(step5.stripeIntro, { amount: formatPrice(estimatedPrice) })}
              </p>
            ) : null}
            {step5?.finePrint ? (
              <p className="muted customize-review__fine">{step5.finePrint}</p>
            ) : null}
            {payCountdown > 0 && step5?.countdownMessage ? (
              <p className="customize-pay-countdown" role="status" aria-live="polite">
                {interpolate(step5.countdownMessage, {
                  seconds: `${payCountdown} second${payCountdown === 1 ? '' : 's'}`,
                })}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="row customize-form__nav">
          <button
            type="button"
            className="btn"
            onClick={() => setStep((s) => prevWizardStep(config, s))}
            disabled={step <= (enabledSteps[0]?.n ?? 1) || busy}
          >
            Back
          </button>
          {nextWizardStep(config, step) > step ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={nextStep}
              disabled={
                (step === 1 &&
                  designPath === 'catalog' &&
                  (loadingProducts || products.length === 0)) ||
                (step === 1 && designPath === 'own-design' && ownDesignUploading) ||
                (step === 2 && ownDesignUploading)
              }
            >
              Continue
            </button>
          ) : payStepActive ? (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || estimatedPrice == null || payCountdown > 0 || ownDesignUploading}
            >
              {busy
                ? (step5?.payButtonBusyLabel ?? 'Redirecting to Stripe…')
                : payCountdown > 0
                  ? interpolate(step5?.payButtonWaitingLabel ?? 'Pay in {seconds}s…', {
                      seconds: payCountdown,
                    })
                  : (step5?.payButtonLabel ?? 'Pay with Stripe')}
            </button>
          ) : null}
        </div>
      </form>
    </article>
  );
}
