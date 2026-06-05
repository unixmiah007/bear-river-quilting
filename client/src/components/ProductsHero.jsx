import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import ScrollReveal from './ScrollReveal.jsx';
import PageLoading from './PageLoading.jsx';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function ProductsHero({ topProducts = [], loading = false }) {
  const tiles = topProducts.slice(0, 4);

  return (
    <section className="hero products-hero" aria-labelledby="products-hero-heading">
      <div className="hero-grid">
        <div>
          <p className="eyebrow">Full catalog</p>
          <h1 id="products-hero-heading">Shop handmade quilts</h1>
          <p className="page-body">
            Discover our published quilt catalog—from heritage patchwork to modern loft styles.
            Filter by price, compare sizes, and add your favorites to the cart.
          </p>
          <div className="row">
            <a className="btn btn-primary" href="#products-catalog">
              Browse quilts
            </a>
            <Link className="btn" to="/about">
              Our story
            </Link>
          </div>
        </div>
        <div className="hero-mosaic hero-mosaic--four hero-mosaic--products" aria-label="Top selling products">
          {loading ? (
            <PageLoading active label="Loading top sellers…" inline />
          ) : tiles.length > 0 ? (
            tiles.map((p, index) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="products-hero-tile"
              >
                <ScrollReveal index={index} className="products-hero-tile__media">
                  <ProductImage src={p.image_url} alt={p.name} />
                </ScrollReveal>
                <span className="products-hero-tile__meta">
                  <span className="products-hero-tile__name">{p.name}</span>
                  <span className="products-hero-tile__price">
                    {formatPrice(p.price)}
                    {p.units_sold != null && Number(p.units_sold) > 0 ? (
                      <span className="products-hero-tile__sold"> · {Number(p.units_sold)} sold</span>
                    ) : null}
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <p className="muted products-hero-tile products-hero-tile--empty">
              Top sellers will appear here once orders are recorded.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
