import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import ScrollReveal from './ScrollReveal.jsx';
import PageLoading from './PageLoading.jsx';
import { MEET_DESIGNER_IMAGE } from '../lib/quiltAssets.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

export default function MeetDesignerBanner({ topProducts = [], loading = false }) {
  const tiles = topProducts.slice(0, 4);

  return (
    <section className="hero meet-designer-banner" aria-labelledby="meet-designer-heading">
      <div className="meet-designer-banner__grid">
        <div className="meet-designer-banner__lead">
          <div className="meet-designer-banner__portrait-wrap">
            <ScrollReveal index={0} className="meet-designer-banner__portrait">
              <img
                src={MEET_DESIGNER_IMAGE}
                alt="Tracy Alto, founder and lead quilter at Bear River Quilting"
                loading="lazy"
                decoding="async"
              />
            </ScrollReveal>
          </div>
          <div className="meet-designer-banner__copy">
            <p className="eyebrow">Bear River Quilting</p>
            <h2 id="meet-designer-heading">Meet the designer</h2>
            <p className="page-body">
              Tracy Alto founded Bear River Quilting after years of restoring family heirloom quilts.
              Every piece in our studio is cut, layered, stitched, and finished for durability,
              softness, and timeless style.
            </p>
            <div className="row meet-designer-banner__actions">
              <Link className="btn btn-primary" to="/about">
                Read her story
              </Link>
              <Link className="btn" to="/products">
                Shop quilts
              </Link>
            </div>
          </div>
        </div>

        <div
          className="meet-designer-banner__products"
          aria-label="Top selling quilts from the designer"
        >
          <p className="meet-designer-banner__products-label">Customer favorites</p>
          {loading ? (
            <PageLoading active label="Loading top sellers…" inline />
          ) : tiles.length > 0 ? (
            <div className="hero-mosaic hero-mosaic--four hero-mosaic--products meet-designer-banner__mosaic">
              {tiles.map((p, index) => (
                <Link key={p.id} to={`/products/${p.id}`} className="products-hero-tile">
                  <ScrollReveal index={index + 1} className="products-hero-tile__media">
                    <ProductImage src={p.image_url} alt={p.name} />
                  </ScrollReveal>
                  <span className="products-hero-tile__meta">
                    <span className="products-hero-tile__name">{p.name}</span>
                    <span className="products-hero-tile__price">
                      {formatPrice(p.price)}
                      {p.units_sold != null && Number(p.units_sold) > 0 ? (
                        <span className="meet-designer-banner__sold"> · {Number(p.units_sold)} sold</span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted meet-designer-banner__empty">
              Top sellers will appear here once orders are recorded.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
