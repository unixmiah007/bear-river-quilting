import { useEffect, useMemo, useState } from 'react';

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
          src="https://picsum.photos/seed/bear-river-owner-studio/1200/900"
          alt="Bear River Quilting studio with handmade quilt materials"
          loading="lazy"
        />
      </section>

      <section className="owner-bio">
        <img
          src="https://picsum.photos/seed/bear-river-owner-portrait/900/1000"
          alt="Owner portrait in quilting workshop"
          loading="lazy"
        />
        <div>
          <h2>Meet the owner</h2>
          <h3 style={{ margin: '0 0 0.6rem' }}>Mara Jensen, Founder & Lead Quilter</h3>
          <p className="muted">
            Mara started Bear River Quilting after years of restoring vintage quilts passed down in
            her family. What began as weekend craft fairs became a dedicated studio where each
            quilt is cut, layered, stitched, and finished with a high standard of durability and
            softness.
          </p>
          <p className="muted">
            Her design approach is simple: make pieces that look timeless, feel luxurious, and hold
            up beautifully through everyday life.
          </p>
        </div>
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
