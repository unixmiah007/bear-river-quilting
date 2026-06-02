import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { adminApi, authApi } from '../api.js';
import AdminLayoutNavLink from '../components/admin/AdminLayoutNavLink.jsx';
import PageLoading from '../components/PageLoading.jsx';
import {
  ADMIN_NAV_VISIT_KEYS,
  formatAdminNavBadge,
  getAdminLastVisited,
  setAdminLastVisited,
} from '../lib/adminNavVisit.js';

async function signOut() {
  await authApi.logout();
  window.location.href = '/admin/login';
}

function AdminNav({ badges, className = 'admin-nav', onNavigate }) {
  const closeMenu = onNavigate ?? undefined;

  return (
    <nav className={className}>
      <NavLink
        className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
        to="/admin/dashboard"
        onClick={closeMenu}
      >
        Dashboard
      </NavLink>
      <NavLink
        className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
        to="/admin/pages"
        onClick={closeMenu}
      >
        Pages
      </NavLink>
      <NavLink
        className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
        to="/admin/products"
        onClick={closeMenu}
      >
        Products
      </NavLink>
      <NavLink
        className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
        to="/admin/categories"
        onClick={closeMenu}
      >
        Product categories
      </NavLink>
      <AdminLayoutNavLink
        to="/admin/orders"
        badge={formatAdminNavBadge(badges.orders)}
        onClick={closeMenu}
      >
        Orders
      </AdminLayoutNavLink>
      <AdminLayoutNavLink
        to="/admin/customize-requests"
        badge={formatAdminNavBadge(badges.customizeRequests)}
        onClick={closeMenu}
      >
        Customize
      </AdminLayoutNavLink>
      <AdminLayoutNavLink
        to="/admin/communication"
        badge={formatAdminNavBadge(badges.communications)}
        onClick={closeMenu}
      >
        Communication
      </AdminLayoutNavLink>
      <NavLink
        className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
        to="/admin/custom-payment"
        onClick={closeMenu}
      >
        Custom payment
      </NavLink>
    </nav>
  );
}

export default function AdminLayout() {
  const [state, setState] = useState({ loading: true, ok: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [navBadges, setNavBadges] = useState({
    orders: 0,
    customizeRequests: 0,
    communications: 0,
  });
  const location = useLocation();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const refreshNavBadges = useCallback(async () => {
    try {
      const counts = await adminApi.adminNavBadgeCounts({
        ordersSince: getAdminLastVisited(ADMIN_NAV_VISIT_KEYS.orders),
        customizeSince: getAdminLastVisited(ADMIN_NAV_VISIT_KEYS.customizeRequests),
      });
      setNavBadges({
        orders: Number(counts.orders) || 0,
        customizeRequests: Number(counts.customizeRequests) || 0,
        communications: Number(counts.communications) || 0,
      });
    } catch {
      /* ignore — badges are non-critical */
    }
  }, []);

  useEffect(() => {
    authApi
      .me()
      .then((r) => setState({ loading: false, ok: r.authenticated }))
      .catch(() => setState({ loading: false, ok: false }));
  }, [location.pathname]);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function onKeyDown(e) {
      if (e.key === 'Escape') closeMenu();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!state.ok) return undefined;

    const path = location.pathname;
    if (path === '/admin/orders' || path.startsWith('/admin/orders/')) {
      setAdminLastVisited(ADMIN_NAV_VISIT_KEYS.orders);
      setNavBadges((b) => ({ ...b, orders: 0 }));
    } else if (
      path === '/admin/customize-requests' ||
      path.startsWith('/admin/customize-requests/')
    ) {
      setAdminLastVisited(ADMIN_NAV_VISIT_KEYS.customizeRequests);
      setNavBadges((b) => ({ ...b, customizeRequests: 0 }));
    }

    refreshNavBadges();
    const timer = window.setInterval(refreshNavBadges, 45_000);
    return () => window.clearInterval(timer);
  }, [state.ok, location.pathname, refreshNavBadges]);

  if (state.loading) {
    return (
      <div className="admin-shell">
        <PageLoading active label="Checking session…" />
      </div>
    );
  }

  if (!state.ok) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-top__bar">
          <div className="brand">
            <NavLink to="/">← Site</NavLink>
          </div>
          <div className="admin-top__bar-actions">
            <span className="admin-session-pill admin-top__session" role="status">
              <span className="admin-session-dot" aria-hidden="true" />
              Admin signed in
            </span>
            <button
              type="button"
              className={`admin-menu-toggle${menuOpen ? ' is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-nav"
              aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="admin-menu-toggle__bar" aria-hidden="true" />
              <span className="admin-menu-toggle__bar" aria-hidden="true" />
              <span className="admin-menu-toggle__bar" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="admin-top__desktop">
          <AdminNav badges={navBadges} className="admin-nav admin-nav--desktop" />
          <button type="button" className="btn admin-top__sign-out" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div
        id="admin-mobile-nav"
        className={`admin-mobile-nav${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="admin-mobile-nav__backdrop"
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />
        <div className="admin-mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="admin-mobile-nav__head">
            <span className="admin-mobile-nav__title">Menu</span>
            <button
              type="button"
              className="admin-mobile-nav__close btn"
              aria-label="Close menu"
              onClick={closeMenu}
            >
              Close
            </button>
          </div>
          <div className="admin-mobile-nav__body">
            <AdminNav
              badges={navBadges}
              className="admin-nav admin-nav--mobile"
              onNavigate={closeMenu}
            />
          </div>
          <div className="admin-mobile-nav__footer">
            <button type="button" className="btn admin-mobile-nav__sign-out" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
