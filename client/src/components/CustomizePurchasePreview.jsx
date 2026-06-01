import ProductImage from './ProductImage.jsx';
import { isOwnDesignId } from '../lib/customizeProductDesign.js';
import {
  labelForBattingOption,
  labelForColorOption,
  labelForSizeOption,
} from '../lib/customizeWizardHelpers.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

export default function CustomizePurchasePreview({
  design,
  config,
  productSize,
  colorPalette,
  batting,
  estimatedPrice,
  ownDesignImageUrl,
  heading = "What you're ordering",
}) {
  if (!design) return null;

  const ownDesign = isOwnDesignId(design.id);
  const thumbSrc = ownDesign ? ownDesignImageUrl || design.image : design.image;

  return (
    <aside className="customize-purchase-preview card" aria-label={heading}>
      <h3 className="customize-purchase-preview__heading">{heading}</h3>

      <div className="customize-purchase-preview__product">
        <div className="customize-purchase-preview__thumb">
          {thumbSrc ? (
            <img src={thumbSrc} alt={design.name} />
          ) : (
            <ProductImage src={design.image} alt={design.name} />
          )}
        </div>
        <div className="customize-purchase-preview__product-copy">
          <p className="customize-purchase-preview__name">{design.name}</p>
          {estimatedPrice != null ? (
            <p className="customize-purchase-preview__price muted">
              {ownDesign ? (
                <>
                  Design deposit today: <strong>{formatPrice(estimatedPrice)}</strong>
                </>
              ) : (
                <>
                  Estimated starting at <strong>{formatPrice(estimatedPrice)}</strong>
                </>
              )}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="customize-purchase-preview__dl">
        <div>
          <dt>Size</dt>
          <dd>{labelForSizeOption(config, productSize)}</dd>
        </div>
        <div>
          <dt>Color palette</dt>
          <dd>{labelForColorOption(config, colorPalette)}</dd>
        </div>
        <div>
          <dt>Batting</dt>
          <dd>{labelForBattingOption(config, batting)}</dd>
        </div>
      </dl>

      {ownDesignImageUrl && !ownDesign ? (
        <div className="customize-purchase-preview__own-design">
          <p className="customize-purchase-preview__own-label">Your design reference</p>
          <img src={ownDesignImageUrl} alt="Your uploaded design reference" />
        </div>
      ) : null}
    </aside>
  );
}
