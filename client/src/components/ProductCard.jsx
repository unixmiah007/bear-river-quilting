import { Link } from 'react-router-dom';
import FavoriteProductButton from './FavoriteProductButton.jsx';
import ProductShareButton from './ProductShareButton.jsx';
import ProductImage from './ProductImage.jsx';
import { formatProductSizeLabel } from '../lib/productSizes.js';
import { stripRichHtml } from '../lib/richText.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function ProductCard({
  product,
  onAddToCart,
  badge,
  showFavorite = false,
  showCustomize = false,
  showShare = false,
}) {
  const detailPath = `/products/${product.id}`;
  const customizePath = `/customize?product=${encodeURIComponent(product.id)}`;
  const tripleActions = showShare && showCustomize;
  const discountPercent = Math.max(0, Math.min(100, Math.floor(Number(product.discount_percent) || 0)));
  const basePrice = Number(product.price) || 0;
  const discountedPrice = basePrice * (1 - discountPercent / 100);

  return (
    <article
      className={`card featured-card featured-card--clickable${showFavorite ? ' featured-card--has-favorite' : ''}`}
    >
      {showFavorite ? (
        <FavoriteProductButton
          variant="icon"
          productId={product.id}
          productName={product.name}
          className="featured-card__favorite"
        />
      ) : null}
      <Link className="featured-card__body" to={detailPath} style={{ position: 'relative' }}>
        <ProductImage src={product.image_url} alt={product.name} />
        {discountPercent > 0 ? (
          <span className="product-card-discount-badge" aria-label={`${discountPercent}% off`}>
            {discountPercent}% OFF
          </span>
        ) : null}
        {badge}
        <h3>{product.name}</h3>
        {formatProductSizeLabel(product.product_size) ? (
          <p className="muted" style={{ margin: '0.2rem 0' }}>
            Size: {formatProductSizeLabel(product.product_size)}
          </p>
        ) : null}
        {product.description ? (
          <p className="muted product-card__description">{stripRichHtml(product.description)}</p>
        ) : null}
        {discountPercent > 0 ? (
          <div className="product-card-price">
            <span className="product-card-price__now">{formatPrice(discountedPrice)}</span>
            <span className="product-card-price__original">{formatPrice(basePrice)}</span>
          </div>
        ) : (
          <div className="price">{formatPrice(product.price)}</div>
        )}
      </Link>
      <div
        className={`row card-actions${tripleActions ? ' card-actions--triple' : ''}`}
      >
        <button type="button" className="btn btn-primary" onClick={() => onAddToCart(product)}>
          Add to cart
        </button>
        {showShare ? <ProductShareButton product={product} compact={tripleActions} /> : null}
        {showCustomize ? (
          <Link className="btn" to={customizePath}>
            Customize
          </Link>
        ) : null}
      </div>
    </article>
  );
}
