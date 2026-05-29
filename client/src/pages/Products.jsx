import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import PageLoading from '../components/PageLoading.jsx';
import { stripRichHtml } from '../lib/richText.js';
import ProductsHero from '../components/ProductsHero.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Products() {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category')?.trim() || '';
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const { addItem } = useCart();
  const navigate = useNavigate();

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug]
  );

  useEffect(() => {
    let cancelled = false;
    publicApi.listProductCategories().then((rows) => {
      if (!cancelled) setCategories(Array.isArray(rows) ? rows : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      publicApi.listProducts(categorySlug || undefined),
      publicApi.featuredProducts(),
    ])
      .then(([rows, featured]) => {
        if (!cancelled) {
          setProducts(Array.isArray(rows) ? rows : []);
          setFeaturedProducts(Array.isArray(featured) ? featured : []);
        }
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
  }, [categorySlug]);

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const maxNum = Number(maxPrice);
    const priceCap =
      maxPrice === '' || maxPrice === null || Number.isNaN(maxNum) ? Infinity : maxNum;
    const filtered = products.filter((p) => {
      const inText =
        !term ||
        p.name.toLowerCase().includes(term) ||
        stripRichHtml(p.description).toLowerCase().includes(term);
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
      <ProductsHero featuredProducts={featuredProducts} />
      <section id="products-catalog" className="products-catalog" aria-label="Product catalog">
      {activeCategory ? (
        <h2 className="products-catalog__heading" style={{ marginTop: 0 }}>
          {activeCategory.name}
        </h2>
      ) : null}
      {activeCategory?.description ? (
        <p className="muted products-catalog__intro">{activeCategory.description}</p>
      ) : null}
      <PageLoading active={loading} label="Loading products…" />
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
        <div className="empty">
          {activeCategory
            ? `No published products in “${activeCategory.name}” yet.`
            : 'No published products yet.'}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="empty">No products match your filters.</div>
      ) : (
        <div className="card-grid">
          {visibleProducts.map((p) => (
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
      </>
      ) : null}
      </section>
    </>
  );
}
