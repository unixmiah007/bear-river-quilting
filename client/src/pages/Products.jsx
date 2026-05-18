import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import ProductsHero from '../components/ProductsHero.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatProductSizeLabel } from '../lib/productSizes.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    publicApi
      .listProducts()
      .then((rows) => {
        if (!cancelled) setProducts(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => {
        if (!cancelled) {
          const detail = [e.body?.error, e.body?.hint].filter(Boolean).join(' — ');
          const proxyOrDown =
            e?.status === 502 ||
            e?.status === 503 ||
            e?.status === 504 ||
            (typeof e?.message === 'string' &&
              (e.message === 'Failed to fetch' ||
                /networkerror|load failed|fetch/i.test(e.message)));
          setError(
            proxyOrDown
              ? detail ||
                  `${e?.message || 'Could not reach the API.'} Start the backend on port 4000 (e.g. npm run dev -w server).`
              : detail || e?.message || 'Failed to load products.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const maxNum = Number(maxPrice);
    const priceCap =
      maxPrice === '' || maxPrice === null || Number.isNaN(maxNum) ? Infinity : maxNum;
    const filtered = products.filter((p) => {
      const inText =
        !term ||
        p.name.toLowerCase().includes(term) ||
        String(p.description ?? '')
          .toLowerCase()
          .includes(term);
      const inPrice = Number(p.price) <= priceCap;
      return inText && inPrice;
    });
    return filtered.sort((a, b) => {
      if (sort === 'price-asc') return Number(a.price) - Number(b.price);
      if (sort === 'price-desc') return Number(b.price) - Number(a.price);
      return Number(b.id) - Number(a.id);
    });
  }, [products, query, maxPrice, sort]);

  return (
    <>
      <ProductsHero />
      <section id="products-catalog" className="products-catalog" aria-label="Product catalog">
      {loading ? <p className="muted">Loading products…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error ? (
      <>
      <div className="row" style={{ marginBottom: '1rem', gap: '1rem' }}>
        <div className="field" style={{ minWidth: '220px', flex: '1 1 220px' }}>
          <label htmlFor="q">Search</label>
          <input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or description"
          />
        </div>
        <div className="field" style={{ minWidth: '160px' }}>
          <label htmlFor="maxp">Max price</label>
          <input
            id="maxp"
            type="number"
            min="0"
            step="0.01"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="No limit"
          />
        </div>
        <div className="field" style={{ minWidth: '180px' }}>
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="empty">No published products yet.</div>
      ) : visibleProducts.length === 0 ? (
        <div className="empty">No products match your filters.</div>
      ) : (
        <div className="card-grid">
          {visibleProducts.map((p) => (
            <article key={p.id} className="card featured-card">
              <ProductImage src={p.image_url} alt={p.name} />
              <h3>{p.name}</h3>
              {formatProductSizeLabel(p.product_size) ? (
                <p className="muted" style={{ margin: '0.2rem 0' }}>
                  Size: {formatProductSizeLabel(p.product_size)}
                </p>
              ) : null}
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
      )}
      </>
      ) : null}
      </section>
    </>
  );
}
