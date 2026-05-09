import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/** Quilt / bedding photography (Unsplash), aligned with storefront product imagery. */
const HERO_PANELS = [
  {
    primary:
      'https://images.unsplash.com/photo-1616628182509-6f5b5c05463f?auto=format&fit=crop&w=1200&q=80',
    fallback:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Patchwork quilt in warm amber and cream tones',
  },
  {
    primary:
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
    fallback:
      'https://images.unsplash.com/photo-1616628182509-6f5b5c05463f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Hand-stitched quilt in soft sage and neutral layers',
  },
  {
    primary:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    fallback:
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
    alt: 'Quilt draped on a bed in a calm, modern bedroom',
  },
  {
    primary:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    fallback:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    alt: 'Sunlit bedroom with layered bedding and neutral tones',
  },
];

function CollageImage({ primary, fallback, alt, index }) {
  const [src, setSrc] = useState(primary);
  const swapped = useRef(false);

  return (
    <img
      className={`site-hero__photo site-hero__photo--${index + 1}`}
      src={src}
      alt=""
      title={alt}
      loading={index === 0 ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={index === 0 ? 'high' : undefined}
      onError={() => {
        if (!swapped.current && fallback && fallback !== primary) {
          swapped.current = true;
          setSrc(fallback);
        }
      }}
    />
  );
}

const STEPS = [
  {
    title: 'Layer & cut',
    text: 'Rotary-cut yardage and heritage templates so every patch lines up before a single seam is sewn.',
  },
  {
    title: 'Piece & quilt',
    text: 'Precision piecing, layered batting, and thoughtful machine or hand quilting for drape that lasts.',
  },
  {
    title: 'Bind & finish',
    text: 'Double-fold binding, final press, and inspection—ready to ship from our Bear River studio.',
  },
];

export default function SiteHeroBanner() {
  return (
    <section className="site-hero" aria-labelledby="site-hero-heading">
      <div className="site-hero__grid">
        <div className="site-hero__copy">
          <p className="site-hero__eyebrow">How it&apos;s made</p>
          <h2 id="site-hero-heading" className="site-hero__title">
            Thread, tension, and time
          </h2>
          <p className="site-hero__lead">
            Each quilt moves from bolt to bed through a small-batch process—measured cuts, careful
            seams, and finishing details you can feel under your hands.
          </p>
          <ol className="site-hero__steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="site-hero__step">
                <span className="site-hero__step-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <span className="site-hero__step-title">{s.title}</span>
                  <span className="site-hero__step-text">{s.text}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="site-hero__cta">
            <Link className="btn btn-primary site-hero__btn" to="/products">
              Shop quilts
            </Link>
            <Link className="btn site-hero__btn site-hero__btn--ghost" to="/about">
              Our story
            </Link>
          </div>
        </div>
        <div className="site-hero__visual" aria-hidden="true">
          <div className="site-hero__collage">
            {HERO_PANELS.map((panel, idx) => (
              <CollageImage
                key={panel.primary}
                primary={panel.primary}
                fallback={panel.fallback}
                alt={panel.alt}
                index={idx}
              />
            ))}
          </div>
          <div className="site-hero__shine" />
        </div>
      </div>
    </section>
  );
}
