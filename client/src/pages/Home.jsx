import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function Home() {
  const [carouselProducts, setCarouselProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function loadFeatured() {
      try {
        const products = await publicApi.listProducts();
        const shuffled = [...products].sort(() => Math.random() - 0.5);
        if (!cancelled) setCarouselProducts(shuffled.slice(0, 20));
      } catch {
        if (!cancelled) setCarouselProducts([]);
      } finally {
        if (!cancelled) setLoadingFeatured(false);
      }
    }
    loadFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (carouselProducts.length <= 3) return undefined;
    const timer = setInterval(() => {
      setStartIndex((i) => (i + 1) % carouselProducts.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [carouselProducts]);

  const visibleFeatured = useMemo(() => {
    if (carouselProducts.length === 0) return [];
    const count = Math.min(3, carouselProducts.length);
    return Array.from({ length: count }, (_, idx) => {
      return carouselProducts[(startIndex + idx) % carouselProducts.length];
    });
  }, [carouselProducts, startIndex]);

  const hasFeatured = visibleFeatured.length > 0;

  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">New Season Drop</p>
            <h1>Quilts that feel handcrafted and modern</h1>
            <p className="page-body">
              Explore curated quilt collections built for comfort, character, and clean bedroom
              styling. Each page has a unique look and product mix that you can edit in{' '}
              <Link to="/admin/login">Admin</Link>.
            </p>
            <div className="row">
              <Link className="btn btn-primary" to="/p/heritage-quilts">
                Shop Heritage Quilts
              </Link>
              <Link className="btn" to="/p/modern-loft-quilts">
                Explore Modern Loft
              </Link>
            </div>
          </div>
          <div className="hero-mosaic">
            <img
              src="https://images.unsplash.com/photo-1616628182509-6f5b5c05463f?auto=format&fit=crop&w=1200&q=80"
              alt="Handmade quilt folded in soft warm tones"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <img
              src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80"
              alt="Quilted bed styling in modern neutral palette"
              loading="lazy"
              decoding="async"
            />
            <img
              src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
              alt="Close-up texture of handcrafted quilt stitching"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="story-grid">
        <article className="story-card">
          <img
            src="https://picsum.photos/seed/bear-river-story-1/1400/900"
            alt="Layered heritage quilts in warm tones"
            loading="lazy"
          />
          <div>
            <h3>Designed for everyday luxury</h3>
            <p className="muted">
              We build each collection around touch, drape, and color harmony so your bedroom
              feels elevated without losing comfort.
            </p>
          </div>
        </article>
        <article className="story-card">
          <img
            src="https://picsum.photos/seed/bear-river-story-2/1400/900"
            alt="Neutral modern quilt set on a styled bed"
            loading="lazy"
          />
          <div>
            <h3>Craft details you can see up close</h3>
            <p className="muted">
              From subtle stitch geometry to breathable cotton layers, every quilt is made to look
              clean by day and feel cozy at night.
            </p>
          </div>
        </article>
      </section>

      <section className="featured">
        <div className="featured-head">
          <h2>Featured products carousel</h2>
          <Link to="/p/heritage-quilts">See all collections</Link>
        </div>
        {loadingFeatured ? (
          <p className="muted">Loading featured pieces...</p>
        ) : hasFeatured ? (
          <>
            <div className="card-grid featured-carousel-grid">
            {visibleFeatured.map((p) => (
              <article key={p.id} className="card featured-card">
                <ProductImage src={p.image_url} alt={p.name} />
                <h3>{p.name}</h3>
                {p.description ? <p className="muted">{p.description}</p> : null}
                <div className="price">{formatPrice(p.price)}</div>
                <div className="row card-actions">
                  <Link className="btn" to={`/products/${p.id}`}>
                    View
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      addItem(p, 1);
                      navigate('/cart');
                    }}
                  >
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
            </div>
            <p className="muted" style={{ marginTop: '0.65rem' }}>
              Showing 3 at a time from a rotating set of up to 20 products.
            </p>
          </>
        ) : (
          <p className="muted">Add published products in Admin to show featured items here.</p>
        )}
      </section>

      <section className="trust-strip">
        <article>
          <span className="trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h11v9H3z" />
              <path d="M14 9h4l3 3v3h-7z" />
              <circle cx="8" cy="17" r="1.8" />
              <circle cx="18" cy="17" r="1.8" />
            </svg>
          </span>
          <p className="eyebrow">Free Shipping</p>
          <p className="muted">On U.S. orders over $120 with quick dispatch from our studio.</p>
        </article>
        <article>
          <span className="trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 17L17 4" />
              <path d="M14 4h3v3" />
              <path d="M7 20l-3-3 3-3 3 3z" />
              <path d="M14 10l4 4" />
            </svg>
          </span>
          <p className="eyebrow">Hand-Finished Quality</p>
          <p className="muted">Layered cotton quilting with detail-focused stitch work and drape.</p>
        </article>
        <article>
          <span className="trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 12a8 8 0 1 0 2.3-5.7" />
              <path d="M4 5v4h4" />
              <path d="M12 8v4l2.5 1.5" />
            </svg>
          </span>
          <p className="eyebrow">30-Day Returns</p>
          <p className="muted">Try it at home. If it is not perfect, exchange or return with ease.</p>
        </article>
      </section>

      <section className="testimonial">
        <p className="eyebrow">Customer Love</p>
        <blockquote>
          “Our bedroom finally looks finished. The quilt feels luxe, breathable, and somehow even
          better after every wash.”
        </blockquote>
        <p className="muted">— Maya R., verified buyer</p>
      </section>
    </>
  );
}
