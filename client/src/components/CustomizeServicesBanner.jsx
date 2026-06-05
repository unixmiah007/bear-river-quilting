import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import ScrollReveal from './ScrollReveal.jsx';
import PageLoading from './PageLoading.jsx';
import { CUSTOM_STUDIO_BANNER_IMAGES } from '../lib/quiltAssets.js';
import { longArmServiceDetailPath } from '../lib/longArmServicePages.js';

function formatPrice(n) {
  if (n == null) return 'Custom quote';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function serviceTileImage(service, index) {
  const url = service?.image_url;
  if (url != null && String(url).trim() !== '') return String(url).trim();
  return CUSTOM_STUDIO_BANNER_IMAGES[index % CUSTOM_STUDIO_BANNER_IMAGES.length]?.src ?? null;
}

export default function CustomizeServicesBanner({ services = [], loading = false }) {
  const tiles = services.slice(0, 4);
  const backdrop = CUSTOM_STUDIO_BANNER_IMAGES[0];

  return (
    <section
      className="hero hero--quilt-bg products-hero customize-services-banner"
      aria-labelledby="customize-services-banner-heading"
    >
      {backdrop ? (
        <div className="hero__backdrop customize-services-banner__backdrop" aria-hidden="true">
          <img src={backdrop.src} alt="" loading="eager" fetchPriority="high" decoding="async" />
        </div>
      ) : null}
      <div className="hero__scrim customize-services-banner__scrim" aria-hidden="true" />
      <div className="hero-grid hero__content">
        <div className="customize-services-banner__copy">
          <p className="eyebrow">Quilt services</p>
          <h2 id="customize-services-banner-heading">
            Interested in quilt services? Discover how.
          </h2>
          <p className="page-body">
            From edge-to-edge pantographs to custom stitching, our long-arm studio finishes your
            quilt top with the same care we bring to every custom design. Explore our most popular
            services and request a quote when you are ready.
          </p>
          <div className="row">
            <Link className="btn btn-primary" to="/long-arm-quilting">
              Explore services
            </Link>
            <Link className="btn" to="/types-of-quilting">
              How it works
            </Link>
          </div>
        </div>

        <div
          className="customize-services-banner__mosaic-wrap"
          aria-label="Top long-arm quilting services"
        >
          {loading ? (
            <PageLoading active label="Loading services…" inline />
          ) : tiles.length > 0 ? (
            <div className="hero-mosaic hero-mosaic--four hero-mosaic--products customize-services-banner__mosaic">
              {tiles.map((svc, index) => {
                const detailPath = longArmServiceDetailPath(svc.slug);
                const imageSrc = serviceTileImage(svc, index);
                const rateLabel =
                  svc.hourly_rate != null ? `${formatPrice(svc.hourly_rate)}/hr` : 'Custom quote';

                const tile = (
                  <>
                    <ScrollReveal index={index} className="products-hero-tile__media">
                      {imageSrc ? (
                        <ProductImage src={imageSrc} alt="" />
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
              })}
            </div>
          ) : (
            <p className="muted customize-services-banner__empty">
              Long-arm services will appear here once published in Admin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
