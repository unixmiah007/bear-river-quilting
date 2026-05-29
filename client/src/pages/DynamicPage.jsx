import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatProductSizeLabel } from '../lib/productSizes.js';
import { stripRichHtml } from '../lib/richText.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function DynamicPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { addItem } = useCart();
  const navigate = useNavigate();

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
      {page.body ? (
        <div
          className="page-body cms-rich-content"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      ) : null}
      <h2>Products on this page</h2>
      {products.length === 0 ? (
        <div className="empty">No published products linked to this page yet.</div>
      ) : (
        <div className="card-grid">
          {products.map((p) => (
            <article key={p.id} className="card">
              <ProductImage src={p.image_url} alt={p.name} />
              <h3>{p.name}</h3>
              {formatProductSizeLabel(p.product_size) ? (
                <p className="muted" style={{ margin: '0.2rem 0' }}>
                  Size: {formatProductSizeLabel(p.product_size)}
                </p>
              ) : null}
              {p.description ? <p className="muted">{stripRichHtml(p.description)}</p> : null}
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
      )}
    </>
  );
}
