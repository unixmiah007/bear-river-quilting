import { useScrollReveal } from '../hooks/useScrollReveal.js';

/**
 * Wraps images (or placeholder content) for scroll-into-view fade/slide animation.
 */
export default function ScrollReveal({
  index = 0,
  className = '',
  content = false,
  children,
  style,
  ...rest
}) {
  const [ref, visible] = useScrollReveal();
  const fromSide = index % 2 === 0 ? 'left' : 'right';
  const classes = [
    'scroll-reveal',
    `scroll-reveal--${fromSide}`,
    content ? 'scroll-reveal--content' : '',
    visible ? 'is-visible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={classes}
      style={{ '--reveal-delay': `${Math.min(index, 6) * 90}ms`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
