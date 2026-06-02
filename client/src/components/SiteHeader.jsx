import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';
import CartNavLink from './CartNavLink.jsx';
import AccountNavLink from './AccountNavLink.jsx';
import AdminNavLink from './AdminNavLink.jsx';
import ProductsNavLink from './ProductsNavLink.jsx';
import SiteBreadcrumbs from './SiteBreadcrumbs.jsx';

export function SiteNav({
  className,
  categories = [],
  showLegalLinks = false,
  showUtilityLinks = true,
  onNavigate,
  'aria-label': ariaLabel,
}) {
  const linkProps = onNavigate ? { onClick: onNavigate } : {};

  return (
    <nav className={className} aria-label={ariaLabel}>
      <NavLink to="/" end {...linkProps}>
        Home
      </NavLink>
      <NavLink to="/about" {...linkProps}>
        About Us
      </NavLink>
      <ProductsNavLink
        categories={categories}
        onNavigate={onNavigate}
        variant={className?.includes('nav--mobile') ? 'mobile' : 'desktop'}
      />
      {showLegalLinks ? (
        <>
          <NavLink to="/privacy-policy" {...linkProps}>
            Privacy Policy
          </NavLink>
          <NavLink to="/return-policy" {...linkProps}>
            Return Policy
          </NavLink>
          <NavLink to="/types-of-quilting" {...linkProps}>
            Types of quilting
          </NavLink>
          <NavLink to="/customize" {...linkProps}>
            Customize
          </NavLink>
        </>
      ) : null}
      {showUtilityLinks ? (
        <>
          <CartNavLink onNavigate={onNavigate} />
          <AccountNavLink onNavigate={onNavigate} />
          <AdminNavLink onNavigate={onNavigate} />
        </>
      ) : null}
    </nav>
  );
}

/** Cart, account, and admin — footer bottom row only. */
export function SiteFooterUtilityNav({ onNavigate }) {
  return (
    <nav className="nav site-footer-utility-nav" aria-label="Account and cart">
      <CartNavLink onNavigate={onNavigate} />
      <AccountNavLink onNavigate={onNavigate} />
      <AdminNavLink onNavigate={onNavigate} />
    </nav>
  );
}

/** CMS collection pages — footer only, below main footer navigation. */
export function SiteFooterPageLinks({ pages, onNavigate }) {
  if (!pages?.length) return null;
  const linkProps = onNavigate ? { onClick: onNavigate } : {};

  return (
    <nav className="nav site-footer-page-links" aria-label="Collection pages">
      {pages.map((p) => (
        <NavLink key={p.id} to={`/p/${p.slug}`} {...linkProps}>
          {p.title}
        </NavLink>
      ))}
    </nav>
  );
}

function BurgerIcon({ open }) {
  return (
    <svg
      className={`nav-burger__icon${open ? ' nav-burger__icon--open' : ''}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        className="nav-burger__line nav-burger__line--top"
        d="M4 7h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        className="nav-burger__line nav-burger__line--mid"
        d="M4 12h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        className="nav-burger__line nav-burger__line--bot"
        d="M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SiteHeader({ categories = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <div className="brand">
          <NavLink to="/" className="brand-link" onClick={closeMenu} aria-label="Bear River Quilting home">
            <BrandLogo className="brand-logo" />
          </NavLink>
        </div>
        <button
          type="button"
          className="nav-burger"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <BurgerIcon open={menuOpen} />
          <span className="nav-burger__label">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
        <SiteNav
          className="nav nav--desktop"
          categories={categories}
          aria-label="Main navigation"
        />
      </div>

      <SiteBreadcrumbs categories={categories} />

      <div
        id="site-mobile-nav"
        className={`nav-mobile-panel${menuOpen ? ' nav-mobile-panel--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="nav-mobile-panel__backdrop"
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />
        <div className="nav-mobile-panel__sheet">
          <p className="nav-mobile-panel__title">Menu</p>
          <SiteNav
            className="nav nav--mobile"
            categories={categories}
            onNavigate={closeMenu}
            aria-label="Mobile navigation"
          />
        </div>
      </div>
    </header>
  );
}
