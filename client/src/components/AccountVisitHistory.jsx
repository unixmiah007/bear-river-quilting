import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useProductVisitHistory } from '../context/ProductVisitHistoryContext.jsx';
import { LIST_PAGE_SIZE_OPTIONS, paginateList } from '../lib/listPagination.js';
import PageLoading from './PageLoading.jsx';
import ProductCard from './ProductCard.jsx';

function formatVisitedAt(at) {
  try {
    return new Date(at).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

export default function AccountVisitHistory() {
  const { entries } = useProductVisitHistory();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [productsById, setProductsById] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const entriesKey = entries.map((e) => `${e.id}:${e.at}`).join('|');

  useEffect(() => {
    if (entries.length === 0) {
      setProductsById(new Map());
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    publicApi
      .listProducts()
      .then((rows) => {
        if (cancelled) return;
        const map = new Map((Array.isArray(rows) ? rows : []).map((p) => [Number(p.id), p]));
        setProductsById(map);
      })
      .catch(() => {
        if (!cancelled) setProductsById(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entriesKey]);

  const visitedProducts = useMemo(
    () =>
      entries
        .map((entry) => {
          const product = productsById.get(entry.id);
          if (!product) return null;
          return { product, visitedAt: entry.at };
        })
        .filter(Boolean),
    [entries, productsById]
  );

  const { pageItems, totalPages, range } = useMemo(
    () => paginateList(visitedProducts, page, pageSize),
    [visitedProducts, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize, entriesKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (entries.length === 0) {
    return (
      <section className="card account-visit-history" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Recently viewed products</h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          Products you open on their detail page are saved in this browser.{' '}
          <Link to="/products">Browse products</Link> to start building your history.
        </p>
      </section>
    );
  }

  return (
    <section className="card account-visit-history" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ marginTop: 0 }}>Recently viewed products</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Products you open on their detail page, newest first (saved in this browser).
      </p>

      {visitedProducts.length > 0 ? (
        <div className="admin-pagination account-visit-history__pagination">
          <div className="admin-pagination__size">
            <label htmlFor="account-visit-page-size">Show</label>
            <select
              id="account-visit-page-size"
              value={String(pageSize)}
              onChange={(e) => {
                const v = e.target.value;
                setPageSize(v === 'all' ? 'all' : Number(v));
              }}
            >
              {LIST_PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={String(n)}>
                  {n === 'all' ? 'All' : n}
                </option>
              ))}
            </select>
            <span className="muted">
              {pageSize === 'all'
                ? `All ${visitedProducts.length} shown`
                : `Showing ${range.start}–${range.end} of ${visitedProducts.length}`}
            </span>
          </div>
          {pageSize !== 'all' && totalPages > 1 ? (
            <div className="admin-pagination__nav row">
              <button
                type="button"
                className="btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="muted admin-pagination__status">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <PageLoading active label="Loading visit history…" inline />
      ) : visitedProducts.length === 0 ? (
        <p className="muted" style={{ marginBottom: 0 }}>
          Your visit history no longer matches published products.{' '}
          <Link to="/products">Browse products</Link> to view new items.
        </p>
      ) : (
        <div className="card-grid account-visit-history-grid">
          {pageItems.map(({ product, visitedAt }) => (
            <div key={`${product.id}-${visitedAt}`} className="account-visit-history-item">
              <ProductCard
                product={product}
                onAddToCart={(item) => {
                  addItem(item, 1);
                  navigate('/cart');
                }}
              />
              <p className="muted account-visit-history-item__when">
                Viewed {formatVisitedAt(visitedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
