import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import { useAdminSession } from '../hooks/useAdminSession.js';
import ProductImage from '../components/ProductImage.jsx';
import ProductImageLightbox from '../components/ProductImageLightbox.jsx';
import CartIcon from '../components/CartIcon.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatProductSizeLabel } from '../lib/productSizes.js';

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
    const fromGallery = (product.images || []).map((i) => i.url).filter(Boolean);
    if (fromGallery.length) return fromGallery;
    return product.image_url ? [product.image_url] : [];
  }, [product]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveIdx(0);
  }, [id, galleryUrls.join('|')]);

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
  const canOpenLightbox = Boolean(mainSrc);

  function openLightbox() {
    if (canOpenLightbox) setLightboxOpen(true);
  }

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
          <button
            type="button"
            className="product-gallery-main product-gallery-main--zoomable"
            onClick={openLightbox}
            disabled={!canOpenLightbox}
            aria-label={canOpenLightbox ? `View full size image for ${product.name}` : undefined}
          >
            <ProductImage key={mainSrc || 'none'} src={mainSrc} alt={product.name} />
          </button>
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
          {formatProductSizeLabel(product.product_size) ? (
            <p className="muted" style={{ marginBottom: '0.35rem' }}>
              Size: <strong>{formatProductSizeLabel(product.product_size)}</strong>
            </p>
          ) : null}
          <div className="price" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
            {formatPrice(product.price)}
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
              onClick={() => {
                addItem(product, 1);
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
      {lightboxOpen && mainSrc ? (
        <ProductImageLightbox
          src={mainSrc}
          alt={product.name}
          onClose={() => setLightboxOpen(false)}
          hasPrev={activeIdx > 0}
          hasNext={activeIdx < galleryUrls.length - 1}
          onPrev={() => setActiveIdx((i) => Math.max(0, i - 1))}
          onNext={() => setActiveIdx((i) => Math.min(galleryUrls.length - 1, i + 1))}
        />
      ) : null}
    </>
  );
}
