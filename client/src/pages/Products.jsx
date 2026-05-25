import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductsHero from '../components/ProductsHero.jsx';
import { useCart } from '../context/CartContext.jsx';

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
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={(item) => {
                addItem(item, 1);
                navigate('/cart');
              }}
            />
          ))}
        </div>
      )}
      </>
      ) : null}
      </section>
    </>
  );
}
