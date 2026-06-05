import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import ScrollReveal from './ScrollReveal.jsx';
import { longArmServiceDetailPath } from '../lib/longArmServicePages.js';
import { LONG_ARM_HERO_BACKGROUND_IMAGE } from '../lib/quiltAssets.js';

function formatPrice(n) {
  if (n == null) return null;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

export default function LongArmQuiltingHero({ services = [], depositUsd = 30, onStartRequest }) {
  const tiles = services.slice(0, 4);

  return (
    <section
      className="hero hero--quilt-bg products-hero long-arm-hero"
      aria-labelledby="long-arm-hero-heading"
    >
      <div className="hero__backdrop long-arm-hero__backdrop" aria-hidden="true">
        <img
          src={LONG_ARM_HERO_BACKGROUND_IMAGE}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className="hero__scrim long-arm-hero__scrim" aria-hidden="true" />
      <div className="hero-grid hero__content">
        <div>
          <p className="eyebrow">Professional finishing</p>
          <h1 id="long-arm-hero-heading">Long-arm quilting services</h1>
          <p className="page-body">
            Send us your quilt top and we will finish it on our long-arm machine with the care and
            craftsmanship Bear River Quilting is known for. Browse our most popular services, then
            request a quote and pay a {formatPrice(depositUsd)} deposit to get started.
          </p>
          <div className="row">
            <a className="btn btn-primary" href="#long-arm-services">
              Browse services
            </a>
            {onStartRequest ? (
              <button type="button" className="btn" onClick={onStartRequest}>
                Request a service
              </button>
            ) : null}
          </div>
        </div>
        <div
          className="hero-mosaic hero-mosaic--four hero-mosaic--products"
          aria-label="Featured long-arm services"
        >
          {tiles.length > 0 ? (
            tiles.map((svc, index) => {
              const detailPath = longArmServiceDetailPath(svc.slug);
              const rateLabel =
                svc.hourly_rate != null ? `${formatPrice(svc.hourly_rate)}/hr` : 'Custom quote';

              const tile = (
                <>
                  <ScrollReveal index={index} className="products-hero-tile__media">
                    {svc.image_url ? (
                      <ProductImage src={svc.image_url} alt="" />
                    ) : (
                      <div className="featured-no-image products-hero-tile__media">No image</div>
                    )}
                  </ScrollReveal>
                  <span className="products-hero-tile__meta">
                    <span className="products-hero-tile__name">{svc.name}</span>
                    <span className="products-hero-tile__price">{rateLabel}</span>
                  </span>
                </>
              );

              return detailPath ? (
                <Link key={svc.id} to={detailPath} className="products-hero-tile">
                  {tile}
                </Link>
              ) : (
                <div key={svc.id} className="products-hero-tile">
                  {tile}
                </div>
              );
            })
          ) : (
            <p className="muted products-hero-tile products-hero-tile--empty">
              Long-arm services will appear here once published in Admin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
