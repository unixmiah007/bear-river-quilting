import { useState } from 'react';
import { IMPROV_QUILTING_IMAGE } from '../lib/quiltAssets.js';

export default function QuiltTypeImage({ src, alt, index }) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <figure className="quilt-types__figure">
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (imgSrc !== IMPROV_QUILTING_IMAGE) setImgSrc(IMPROV_QUILTING_IMAGE);
        }}
      />
      {index != null ? (
        <figcaption className="quilt-types__figcaption muted">Example {index + 1}</figcaption>
      ) : null}
    </figure>
  );
}
