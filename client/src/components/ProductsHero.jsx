import { Link } from 'react-router-dom';
import { PRODUCTS_HERO_IMAGES } from '../lib/quiltAssets.js';

export default function ProductsHero() {
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
        <div className="hero-mosaic hero-mosaic--four">
          {PRODUCTS_HERO_IMAGES.map((img, i) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={i === 0 ? 'high' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
