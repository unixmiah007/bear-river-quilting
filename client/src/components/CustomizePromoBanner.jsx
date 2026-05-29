import { Link } from 'react-router-dom';
import { QUILT_STUDIO_IMAGE } from '../lib/quiltAssets.js';
import { QUILT_DESIGN_PALETTE } from '../lib/quiltDesignPalette.js';

const PREVIEW_DESIGNS = QUILT_DESIGN_PALETTE.slice(0, 4);

export default function CustomizePromoBanner() {
  return (
    <section className="customize-promo" aria-labelledby="customize-promo-heading">
      <div className="customize-promo__inner">
        <div className="customize-promo__copy">
          <p className="customize-promo__eyebrow">Custom studio</p>
          <h2 id="customize-promo-heading" className="customize-promo__title">
            Design a quilt that&apos;s yours alone
          </h2>
          <p className="customize-promo__lead">
            Walk through our five-step wizard—pick a pattern, size, colors, and batting—then pay
            securely with Stripe. Our designer follows up within a few business days to refine your
            vision.
          </p>
          <ul className="customize-promo__highlights">
            <li>
              <span className="customize-promo__highlight-icon" aria-hidden="true">
                1
              </span>
              <span>
                <strong>Choose your palette</strong>
                <span className="customize-promo__highlight-detail">
                  Eight heirloom-inspired design families
                </span>
              </span>
            </li>
            <li>
              <span className="customize-promo__highlight-icon" aria-hidden="true">
                2
              </span>
              <span>
                <strong>Size &amp; finish</strong>
                <span className="customize-promo__highlight-detail">
                  From throw to king—cotton, wool, or bamboo batting
                </span>
              </span>
            </li>
            <li>
              <span className="customize-promo__highlight-icon" aria-hidden="true">
                3
              </span>
              <span>
                <strong>Secure checkout</strong>
                <span className="customize-promo__highlight-detail">
                  Confirm your request with Stripe in minutes
                </span>
              </span>
            </li>
          </ul>
          <div className="customize-promo__cta">
            <Link className="btn btn-primary customize-promo__btn" to="/customize">
              Start customizing
            </Link>
            <Link className="btn customize-promo__btn customize-promo__btn--ghost" to="/types-of-quilting">
              Learn our process
            </Link>
          </div>
        </div>

        <Link
          className="customize-promo__visual"
          to="/customize"
          aria-label="Open the custom quilt design wizard"
        >
          <div className="customize-promo__photo-wrap">
            <img
              className="customize-promo__photo"
              src={QUILT_STUDIO_IMAGE}
              alt="Quilt fabrics and tools laid out in the Bear River studio"
              loading="lazy"
              decoding="async"
            />
            <span className="customize-promo__badge">New</span>
          </div>
          <div className="customize-promo__swatches" aria-hidden="true">
            {PREVIEW_DESIGNS.map((design, index) => (
              <img
                key={design.id}
                className={`customize-promo__swatch customize-promo__swatch--${index + 1}`}
                src={design.image}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </Link>
      </div>
    </section>
  );
}
