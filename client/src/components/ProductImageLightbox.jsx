import { useEffect } from 'react';

/**
 * Full-size product image lightbox (dark overlay, natural image dimensions up to viewport).
 */
export default function ProductImageLightbox({ src, alt, onClose, onPrev, onNext, hasPrev, hasNext }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!src) return null;

  return (
    <div
      className="product-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Enlarged view: ${alt}` : 'Enlarged product image'}
      onClick={onClose}
    >
      <button
        type="button"
        className="product-lightbox__close"
        aria-label="Close image"
        onClick={onClose}
      >
        ×
      </button>
      {hasPrev && onPrev ? (
        <button
          type="button"
          className="product-lightbox__nav product-lightbox__nav--prev"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          ‹
        </button>
      ) : null}
      {hasNext && onNext ? (
        <button
          type="button"
          className="product-lightbox__nav product-lightbox__nav--next"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          ›
        </button>
      ) : null}
      <div className="product-lightbox__frame" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt || 'Product image'} className="product-lightbox__img" />
      </div>
    </div>
  );
}
