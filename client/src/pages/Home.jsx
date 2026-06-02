import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../api.js';
import {
  IMPROV_QUILT_BASTING_IMAGE,
  IMPROV_QUILTING_010_IMAGE,
  IMPROV_QUILTING_IMAGE,
  QUILT_CRAFT_DETAIL_IMAGE,
  SEWING_MACHINE_IMAGE,
} from '../lib/quiltAssets.js';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { HOME_TESTIMONIALS } from '../lib/homeTestimonials.js';
import HomeHeroBackdrop from '../components/HomeHeroBackdrop.jsx';
import CustomizePromoBanner from '../components/CustomizePromoBanner.jsx';
import PageLoading from '../components/PageLoading.jsx';

export default function Home() {
  const [carouselProducts, setCarouselProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [bestSellers, setBestSellers] = useState([]);
  const [loadingBest, setLoadingBest] = useState(true);
  const [bestStartIndex, setBestStartIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
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
    let cancelled = false;
    async function loadBest() {
      try {
        const rows = await publicApi.bestSellers();
        if (!cancelled) setBestSellers(Array.isArray(rows) ? rows.slice(0, 10) : []);
      } catch {
        if (!cancelled) setBestSellers([]);
      } finally {
        if (!cancelled) setLoadingBest(false);
      }
    }
    loadBest();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (bestSellers.length <= 3) return undefined;
    const timer = setInterval(() => {
      setBestStartIndex((i) => (i + 1) % bestSellers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bestSellers]);

  const visibleBestSellers = useMemo(() => {
    if (bestSellers.length === 0) return [];
    const count = Math.min(3, bestSellers.length);
    return Array.from({ length: count }, (_, idx) => {
      return bestSellers[(bestStartIndex + idx) % bestSellers.length];
    });
  }, [bestSellers, bestStartIndex]);

  const hasBestSellers = visibleBestSellers.length > 0;

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % HOME_TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const activeTestimonial = HOME_TESTIMONIALS[testimonialIndex];

  return (
    <>
      <CustomizePromoBanner />

      <section className="hero hero--quilt-bg">
        <HomeHeroBackdrop variant="home" />
        <div className="hero-grid hero__content">
          <div>
            <p className="eyebrow">New Season Drop</p>
            <h1>Quilts that feel handcrafted and modern</h1>
            <p className="page-body">
              Explore curated quilt collections built for comfort, character, and clean bedroom
              styling. Each page has a unique look and product mix that you can edit in{' '}
              <Link to="/admin/dashboard">Admin</Link>.
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
              src={IMPROV_QUILTING_IMAGE}
              alt="Handmade quilt folded in soft warm tones"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <img
              src={IMPROV_QUILT_BASTING_IMAGE}
              alt="Quilted bed styling in modern neutral palette"
              loading="lazy"
              decoding="async"
            />
            <img
              src={IMPROV_QUILTING_010_IMAGE}
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
            src={SEWING_MACHINE_IMAGE}
            alt="Vintage sewing machine used for quilt craftsmanship"
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
            src={QUILT_CRAFT_DETAIL_IMAGE}
            alt="Handcrafted quilt detail showing stitch and fabric work"
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

      <section className="featured best-sellers">
        <div className="featured-head">
          <h2>Best sellers</h2>
          <Link to="/p/heritage-quilts">See collections</Link>
        </div>
        {loadingBest ? (
          <PageLoading active label="Loading best sellers…" inline />
        ) : hasBestSellers ? (
          <>
            <div className="card-grid featured-carousel-grid">
              {visibleBestSellers.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  showFavorite
                  onAddToCart={(item) => {
                    addItem(item, 1);
                    navigate('/cart');
                  }}
                  badge={
                    p.units_sold != null && Number(p.units_sold) > 0 ? (
                      <p className="eyebrow" style={{ margin: '0 0 0.35rem' }}>
                        {Number(p.units_sold)} sold
                      </p>
                    ) : null
                  }
                />
              ))}
            </div>
            <p className="muted" style={{ marginTop: '0.65rem' }}>
              Top {bestSellers.length} by units sold—showing 3 at a time, rotating through the list
              {bestSellers.length > 3 ? ' every 4 seconds' : ''}.
            </p>
          </>
        ) : (
          <p className="muted">No published products yet.</p>
        )}
      </section>

      <section className="featured">
        <div className="featured-head">
          <h2>Featured products carousel</h2>
          <Link to="/p/heritage-quilts">See all collections</Link>
        </div>
        {loadingFeatured ? (
          <PageLoading active label="Loading featured pieces…" inline />
        ) : hasFeatured ? (
          <>
            <div className="card-grid featured-carousel-grid">
              {visibleFeatured.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  showFavorite
                  onAddToCart={(item) => {
                    addItem(item, 1);
                    navigate('/cart');
                  }}
                />
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

      <section className="testimonial" aria-live="polite" aria-atomic="true">
        <p className="eyebrow">Customer Love</p>
        <blockquote key={testimonialIndex} className="testimonial__quote">
          “{activeTestimonial.quote}”
        </blockquote>
        <p className="muted testimonial__author">— {activeTestimonial.author}</p>
      </section>
    </>
  );
}
