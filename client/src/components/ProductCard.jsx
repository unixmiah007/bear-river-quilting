import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import { formatProductSizeLabel } from '../lib/productSizes.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function ProductCard({ product, onAddToCart, badge }) {
  const detailPath = `/products/${product.id}`;

  return (
    <article className="card featured-card featured-card--clickable">
      <Link className="featured-card__body" to={detailPath}>
        <ProductImage src={product.image_url} alt={product.name} />
        {badge}
        <h3>{product.name}</h3>
        {formatProductSizeLabel(product.product_size) ? (
          <p className="muted" style={{ margin: '0.2rem 0' }}>
            Size: {formatProductSizeLabel(product.product_size)}
          </p>
        ) : null}
        {product.description ? <p className="muted">{product.description}</p> : null}
        <div className="price">{formatPrice(product.price)}</div>
      </Link>
      <div className="row card-actions">
        <Link className="btn" to={detailPath}>
          View
        </Link>
        <button type="button" className="btn btn-primary" onClick={() => onAddToCart(product)}>
          Add to cart
        </button>
      </div>
    </article>
  );
}
