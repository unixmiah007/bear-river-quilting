import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { QUILT_STUDIO_IMAGE, ABOUT_OWNER_IMAGE } from '../lib/quiltAssets.js';
import PageLoading from '../components/PageLoading.jsx';

const TESTIMONIALS = [
  {
    quote:
      'The stitching is gorgeous up close. It instantly made our guest room feel like a boutique stay.',
    author: 'L. Carter, Denver',
  },
  {
    quote: 'We bought one quilt, then came back for two more. They wash well and still look brand new.',
    author: 'R. Patel, Seattle',
  },
  {
    quote: 'Beautiful craftsmanship and incredible texture. You can tell these are made with care.',
    author: 'A. Moore, Austin',
  },
  {
    quote: 'I wanted a handmade look without feeling old-fashioned, and this hit the mark perfectly.',
    author: 'S. Kim, Portland',
  },
  {
    quote: 'The color tones are rich and calming. It changed the whole mood of our bedroom.',
    author: 'J. Reynolds, Nashville',
  },
  {
    quote: 'Shipping was fast and the quilt felt premium from the second we opened the box.',
    author: 'M. Ortiz, Phoenix',
  },
  {
    quote: 'Our kids fight over this quilt on movie nights. It is cozy but not heavy.',
    author: 'D. Harper, Chicago',
  },
  {
    quote: 'I appreciate the detail in every seam. It truly feels artisan-made.',
    author: 'T. Nguyen, San Diego',
  },
  {
    quote: 'After six months of use and washes, it still looks fresh and structured.',
    author: 'B. Ellis, Raleigh',
  },
  {
    quote: 'It looks designer-level in photos but even better in person.',
    author: 'K. Brooks, Minneapolis',
  },
];

export default function About() {
  const [startIndex, setStartIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(null);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    publicApi
      .featuredProducts()
      .then((rows) => {
        if (!cancelled) setFeaturedProducts(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setFeaturedError(e?.body?.error || e?.message || 'Failed to load featured products.');
        }
      })
      .finally(() => {
        if (!cancelled) setFeaturedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStartIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const visibleTestimonials = useMemo(() => {
    return Array.from({ length: 3 }, (_, idx) => {
      return TESTIMONIALS[(startIndex + idx) % TESTIMONIALS.length];
    });
  }, [startIndex]);

  return (
    <>
      <section className="about-hero">
        <div>
          <p className="eyebrow">About Bear River Quilting</p>
          <h1>Handmade quilts rooted in comfort, craft, and family tradition</h1>
          <p className="page-body">
            We are a small studio focused on heirloom-quality quilts designed for real homes. Every
            collection balances artisan stitch detail with modern color palettes so your bedroom
            feels personal, warm, and elevated.
          </p>
        </div>
        <img
          src={QUILT_STUDIO_IMAGE}
          alt="Handmade quilt displayed in a cozy studio setting"
          loading="lazy"
        />
      </section>

      <section className="owner-bio">
        <img
          src={ABOUT_OWNER_IMAGE}
          alt="Tracy Alto, founder and lead quilter at Bear River Quilting"
          loading="lazy"
        />
        <div>
          <h2>Meet the owner</h2>
          <h3 style={{ margin: '0 0 0.6rem' }}>Tracy Alto, Founder & Lead Quilter</h3>
          <p className="muted">
            Tracy started Bear River Quilting after years of restoring vintage quilts passed down in
            her family. What began as weekend craft fairs became a dedicated studio where each
            quilt is cut, layered, stitched, and finished with a high standard of durability and
            softness.
          </p>
          <p className="muted">
            Her design approach is simple: make pieces that look timeless, feel luxurious, and hold
            up beautifully through everyday life.
          </p>
          <section
            className="testimonial owner-bio__testimonial"
            aria-live="polite"
            aria-atomic="true"
            aria-label="Customer testimonials"
          >
            <p className="eyebrow">What buyers say</p>
            <blockquote key={startIndex} className="testimonial__quote">
              &ldquo;{TESTIMONIALS[startIndex].quote}&rdquo;
            </blockquote>
            <p className="muted testimonial__author">&mdash; {TESTIMONIALS[startIndex].author}</p>
          </section>
        </div>
      </section>

      <section className="featured about-featured">
        <div className="featured-head">
          <h2>Featured quilts</h2>
          <Link to="/products">Shop all products</Link>
        </div>
        {featuredLoading ? (
          <PageLoading active label="Loading featured quilts…" inline />
        ) : featuredError ? (
          <p className="error">{featuredError}</p>
        ) : featuredProducts.length === 0 ? (
          <p className="muted">No featured products yet. Mark items as featured in Admin.</p>
        ) : (
          <div className="card-grid">
            {featuredProducts.map((p) => (
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
        )}
      </section>

      <section className="about-testimonials">
        <div className="featured-head">
          <h2>What quilt buyers say</h2>
        </div>
        <div className="card-grid featured-carousel-grid">
          {visibleTestimonials.map((item) => (
            <article className="card" key={item.author}>
              <p className="muted">“{item.quote}”</p>
              <strong>— {item.author}</strong>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
