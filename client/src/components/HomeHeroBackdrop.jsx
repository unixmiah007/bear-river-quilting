import { useState } from 'react';
import { useHomeHeroBackground } from '../context/HomeHeroBackgroundContext.jsx';
import { HOME_HERO_BACKGROUNDS } from '../lib/homeHeroBackgrounds.js';

/**
 * @param {{ variant?: 'site' | 'home' }} props
 * variant: `site` = top banner classes, `home` = “New Season Drop” block
 */
export default function HomeHeroBackdrop({ variant = 'site' }) {
  const primary = useHomeHeroBackground();
  const [src, setSrc] = useState(primary);
  const base = variant === 'site' ? 'site-hero' : 'hero';

  return (
    <>
      <div className={`${base}__backdrop`} aria-hidden="true">
        <img
          src={src}
          alt=""
          loading="eager"
          fetchPriority={variant === 'site' ? 'high' : undefined}
          decoding="async"
          onError={() => {
            const fallback = HOME_HERO_BACKGROUNDS.find((url) => url !== src);
            if (fallback) setSrc(fallback);
          }}
        />
      </div>
      <div className={`${base}__scrim`} aria-hidden="true" />
    </>
  );
}
