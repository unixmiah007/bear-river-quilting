import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { publicApi } from '../api.js';
import SiteHeroBanner from '../components/SiteHeroBanner.jsx';
import SiteHeader, { SiteNav } from '../components/SiteHeader.jsx';
import SiteStickyBar from '../components/SiteStickyBar.jsx';
import { AdminSessionBanner } from '../components/AdminSessionIndicator.jsx';
import { HomeHeroBackgroundProvider } from '../context/HomeHeroBackgroundContext.jsx';

/** CMS pages that stay reachable via direct URL / in-page links but are hidden from header/footer nav. */
const EXCLUDED_MAIN_NAV_PAGE_SLUGS = new Set(['heritage-quilts', 'modern-loft-quilts']);

function pagesForMainNav(data) {
  const rows = Array.isArray(data) ? data : [];
  return rows.filter((p) => p?.slug && !EXCLUDED_MAIN_NAV_PAGE_SLUGS.has(p.slug));
}

export default function SiteLayout() {
  const [pages, setPages] = useState([]);
  const [err, setErr] = useState(null);
  const { pathname } = useLocation();
  const showHero = pathname === '/';
  const isHome = pathname === '/';

  const mainContent = (
    <>
      {showHero ? <SiteHeroBanner /> : null}
      <Outlet />
    </>
  );

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
    <div className="site-shell">
      <div className="layout">
        <SiteHeader pages={pages} />
        <AdminSessionBanner />
        {err && <p className="error">{err}</p>}
        {isHome ? (
          <HomeHeroBackgroundProvider>{mainContent}</HomeHeroBackgroundProvider>
        ) : (
          mainContent
        )}
        <footer className="site-footer">
          <SiteNav
            className="nav site-footer-nav"
            pages={pages}
            showLegalLinks
            aria-label="Footer navigation"
          />
        </footer>
      </div>
      <SiteStickyBar />
    </div>
  );
}
