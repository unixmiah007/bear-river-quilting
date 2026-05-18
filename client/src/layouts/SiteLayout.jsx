import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { publicApi } from '../api.js';
import SiteHeroBanner from '../components/SiteHeroBanner.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import CartNavLink from '../components/CartNavLink.jsx';
import AccountNavLink from '../components/AccountNavLink.jsx';
import AdminNavLink from '../components/AdminNavLink.jsx';
import SiteStickyBar from '../components/SiteStickyBar.jsx';
import { AdminSessionBanner } from '../components/AdminSessionIndicator.jsx';

/** CMS pages that stay reachable via direct URL / in-page links but are hidden from header/footer nav. */
const EXCLUDED_MAIN_NAV_PAGE_SLUGS = new Set(['heritage-quilts', 'modern-loft-quilts']);

function pagesForMainNav(data) {
  const rows = Array.isArray(data) ? data : [];
  return rows.filter((p) => p?.slug && !EXCLUDED_MAIN_NAV_PAGE_SLUGS.has(p.slug));
}

function SiteNav({ className, pages, showLegalLinks = false, 'aria-label': ariaLabel }) {
  return (
    <nav className={className} aria-label={ariaLabel}>
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/about">About Us</NavLink>
      <NavLink to="/products">Products</NavLink>
      {showLegalLinks ? (
        <>
          <NavLink to="/privacy-policy">Privacy Policy</NavLink>
          <NavLink to="/return-policy">Return Policy</NavLink>
        </>
      ) : null}
      <CartNavLink />
      <AccountNavLink />
      {pages.map((p) => (
        <NavLink key={p.id} to={`/p/${p.slug}`}>
          {p.title}
        </NavLink>
      ))}
      <AdminNavLink />
    </nav>
  );
}

export default function SiteLayout() {
  const [pages, setPages] = useState([]);
  const [err, setErr] = useState(null);
  const { pathname } = useLocation();
  const showHero = pathname === '/';

  useEffect(() => {
    publicApi
      .listPages()
      .then((data) => setPages(pagesForMainNav(data)))
      .catch((e) => {
        const detail =
          [e?.body?.error, e?.body?.hint].filter(Boolean).join(' — ') || null;
        const proxyOrDown =
          e?.status === 502 ||
          e?.status === 503 ||
          e?.status === 504 ||
          (typeof e?.message === 'string' &&
            (e.message === 'Failed to fetch' ||
              /networkerror|load failed|fetch/i.test(e.message)));
        setErr(
          proxyOrDown
            ? detail ||
                `${e?.message || 'Could not reach the API.'} If you use Vite, start the backend on port 4000 (for example: npm run dev -w server).`
            : detail || e?.message || 'Could not load navigation.'
        );
      });
  }, []);

  return (
    <div className="layout layout--with-sticky-bar">
      <header className="site-header">
        <div className="brand">
          <NavLink to="/" className="brand-link">
            <BrandLogo className="brand-logo" />
            <span>Bear River Quilting</span>
          </NavLink>
        </div>
        <SiteNav
          className="nav"
          pages={pages}
          aria-label="Main navigation"
        />
      </header>
      <AdminSessionBanner />
      {err && <p className="error">{err}</p>}
      {showHero ? <SiteHeroBanner /> : null}
      <Outlet />
      <footer className="site-footer">
        <SiteNav
          className="nav site-footer-nav"
          pages={pages}
          showLegalLinks
          aria-label="Footer navigation"
        />
      </footer>
      <SiteStickyBar />
    </div>
  );
}
