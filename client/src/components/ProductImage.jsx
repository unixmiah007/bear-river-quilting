import { useState } from 'react';

export default function ProductImage({ src, alt }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return <div className="featured-no-image">No image</div>;
  }

  return (
    <img
      src={src}
      alt={alt || 'Product image'}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
