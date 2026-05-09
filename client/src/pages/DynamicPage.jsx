import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../api.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function DynamicPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);
    publicApi
      .pageBySlug(slug)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.status === 404 ? 'Page not found.' : 'Failed to load page.');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return <p className="error">{error}</p>;
  }
  if (!data) {
    return <p className="muted">Loading…</p>;
  }

  const { page, products } = data;

  return (
    <>
      <h1>{page.title}</h1>
      {page.body ? <div className="page-body">{page.body}</div> : null}
      <h2>Products on this page</h2>
      {products.length === 0 ? (
        <div className="empty">No published products linked to this page yet.</div>
      ) : (
        <div className="card-grid">
          {products.map((p) => (
            <article key={p.id} className="card">
              {p.image_url ? (
                <img src={p.image_url} alt="" loading="lazy" />
              ) : (
                <div
                  className="muted"
                  style={{ aspectRatio: '4/3', display: 'grid', placeItems: 'center' }}
                >
                  No image
                </div>
              )}
              <h3>{p.name}</h3>
              {p.description ? <p className="muted">{p.description}</p> : null}
              <div className="price">{formatPrice(p.price)}</div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
