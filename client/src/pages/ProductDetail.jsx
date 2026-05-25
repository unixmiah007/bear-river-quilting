import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import { useAdminSession } from '../hooks/useAdminSession.js';
import ProductImage from '../components/ProductImage.jsx';
import CartIcon from '../components/CartIcon.jsx';
import { useCart } from '../context/CartContext.jsx';
import { CUSTOMER_SIZE_OPTIONS, priceForProductSize } from '../lib/productSizes.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const { isAdmin: adminSession } = useAdminSession();
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setProduct(null);
    publicApi
      .productById(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.status === 404 ? 'Product not found.' : 'Failed to load product.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const galleryUrls = useMemo(() => {
    if (!product) return [];
    const toUploadUrl = (rawPath) => {
      if (!rawPath) return null;
      const filename = rawPath.split('/').pop();
      if (!filename) return null;
      return `/uploads/products/${product.id}/${filename}`;
    };
    const fromGallery = (product.images || [])
      .map((i) => toUploadUrl(i.url))
      .filter(Boolean);
    if (fromGallery.length) return fromGallery;
    const fallback = toUploadUrl(product.image_url);
    return fallback ? [fallback] : [];
  }, [product]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    setActiveIdx(0);
  }, [id, galleryUrls.join('|')]);

  useEffect(() => {
    if (!product) {
      setSelectedSize('');
      return;
    }
    const preset = product.product_size ? String(product.product_size).trim().toLowerCase() : '';
    const valid = CUSTOMER_SIZE_OPTIONS.some((o) => o.value === preset);
    setSelectedSize(valid ? preset : '');
  }, [product?.id, product?.product_size]);

  useEffect(() => {
    if (activeIdx >= galleryUrls.length) setActiveIdx(0);
  }, [galleryUrls.length, activeIdx]);

  if (error) {
    return (
      <>
        <p className="error">{error}</p>
        <Link className="btn" to="/products">
          Back to products
        </Link>
      </>
    );
  }
  if (!product) {
    return <p className="muted">Loading…</p>;
  }

  const mainSrc = galleryUrls[activeIdx] ?? galleryUrls[0];
  const sizeReady = CUSTOMER_SIZE_OPTIONS.some((o) => o.value === selectedSize);
  const displayPrice = product
    ? priceForProductSize(product.price, sizeReady ? selectedSize : 'small')
    : 0;

  return (
    <>
      <div
        className="row"
        style={{
          marginBottom: '0.75rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <p className="muted" style={{ margin: 0 }}>
          <Link to="/products">← All products</Link>
        </p>
        {adminSession ? (
          <Link className="btn" to={`/admin/products?edit=${encodeURIComponent(product.id)}`}>
            Edit product
          </Link>
        ) : null}
      </div>
      <section className="product-detail">
        <div className="product-detail-media">
          {mainSrc ? (
            <a
              href={mainSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="product-gallery-main product-gallery-main--open"
              aria-label={`Open full size image for ${product.name} in a new tab`}
            >
              <ProductImage key={mainSrc} src={mainSrc} alt={product.name} />
            </a>
          ) : (
            <div className="product-gallery-main">
              <ProductImage key="none" src={mainSrc} alt={product.name} />
            </div>
          )}
          {galleryUrls.length > 1 ? (
            <div className="product-gallery-thumbs" role="list">
              {galleryUrls.map((u, i) => (
                <button
                  key={`${u}-${i}`}
                  type="button"
                  role="listitem"
                  className={i === activeIdx ? 'selected' : ''}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === activeIdx ? 'true' : undefined}
                >
                  <img src={u} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <h1>{product.name}</h1>
          <div className="field product-detail-size" style={{ marginBottom: '1rem' }}>
            <label htmlFor="product-size">Size</label>
            <select
              id="product-size"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              required
              aria-required="true"
            >
              <option value="">Select a size</option>
              {CUSTOMER_SIZE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} — {formatPrice(priceForProductSize(product.price, o.value))}
                </option>
              ))}
            </select>
            {!sizeReady ? (
              <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
                Choose a size before adding to cart. Prices start at {formatPrice(product.price)}{' '}
                (Small) and increase by $30 for each larger size.
              </p>
            ) : null}
          </div>
          <div className="price" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
            {formatPrice(displayPrice)}
          </div>
          {product.description ? (
            <p className="page-body" style={{ whiteSpace: 'normal' }}>
              {product.description}
            </p>
          ) : (
            <p className="muted">Handmade quilt from Bear River Quilting.</p>
          )}
          <div className="row" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!sizeReady}
              onClick={() => {
                if (!sizeReady) return;
                addItem(
                  {
                    ...product,
                    product_size: selectedSize,
                    price: priceForProductSize(product.price, selectedSize),
                  },
                  1
                );
                navigate('/cart');
              }}
            >
              Add to cart
            </button>
            <Link className="btn cart-inline-link" to="/cart">
              <CartIcon /> View cart
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
