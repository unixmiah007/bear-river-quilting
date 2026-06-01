import { useState } from 'react';
import ShareIcon from './ShareIcon.jsx';
import ProductShareDialog from './ProductShareDialog.jsx';

export default function ProductShareButton({ product, imageSrc, className = '', compact = false }) {
  const [open, setOpen] = useState(false);
  const thumb = imageSrc ?? product?.image_url ?? null;

  return (
    <>
      <button
        type="button"
        className={[
          'btn',
          'product-share-btn',
          compact ? 'product-share-btn--compact' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {compact ? null : <ShareIcon className="product-share-btn__icon" />}
        Share
      </button>
      {open && product ? (
        <ProductShareDialog product={product} imageSrc={thumb} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
