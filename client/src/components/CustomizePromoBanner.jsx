import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api.js';
import { CUSTOM_STUDIO_BANNER_IMAGES } from '../lib/quiltAssets.js';

function pickCustomStudioBannerImage() {
  const images = CUSTOM_STUDIO_BANNER_IMAGES;
  if (!images.length) return null;
  return images[Math.floor(Math.random() * images.length)];
}

export default function CustomizePromoBanner() {
  const [bannerImage] = useState(pickCustomStudioBannerImage);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await publicApi.featuredProducts();
        if (!cancelled) setFeaturedProducts(Array.isArray(rows) ? rows.slice(0, 3) : []);
      } catch {
        if (!cancelled) setFeaturedProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
            {bannerImage ? (
              <img
                className="customize-promo__photo"
                src={bannerImage.src}
                alt={bannerImage.alt}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : null}
            <span className="customize-promo__badge">New</span>
            {featuredProducts.length > 0 ? (
              <div className="customize-promo__featured" aria-label="Featured products">
                <p className="customize-promo__featured-title">Featured products</p>
                <ul className="customize-promo__featured-list">
                  {featuredProducts.map((product) => (
                    <li key={product.id}>
                      <Link
                        to={`/products/${encodeURIComponent(product.id)}`}
                        className="customize-promo__featured-item"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`View ${product.name}`}
                      >
                        <span className="customize-promo__featured-main">
                          {product.image_url ? (
                            <img
                              className="customize-promo__featured-thumb"
                              src={product.image_url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          <span className="customize-promo__featured-name">{product.name}</span>
                        </span>
                        <span className="customize-promo__featured-price">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(Number(product.price) || 0)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Link>
      </div>
    </section>
  );
}
