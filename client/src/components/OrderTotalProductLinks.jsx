import { Link } from 'react-router-dom';

/** Unique products for original vs current line-item snapshots. */
export function productsForOrderSnapshot(items, variant) {
  const seen = new Set();
  const out = [];
  for (const it of items || []) {
    const id =
      variant === 'original'
        ? Number(it.original_product_id ?? it.product_id)
        : Number(it.product_id);
    const name =
      variant === 'original'
        ? it.original_product_name ?? it.product_name
        : it.product_name;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: name || `Product #${id}` });
  }
  return out;
}

export default function OrderTotalProductLinks({ items, variant, className = '' }) {
  const products = productsForOrderSnapshot(items, variant);
  if (products.length === 0) return null;

  return (
    <span className={`order-total-product-links${className ? ` ${className}` : ''}`}>
      {' '}
      <span className="order-total-product-links__wrap">
        (
        {products.map((p, i) => (
          <span key={p.id}>
            {i > 0 ? ' · ' : null}
            <Link to={`/products/${p.id}`}>{p.name}</Link>
          </span>
        ))}
        )
      </span>
    </span>
  );
}
