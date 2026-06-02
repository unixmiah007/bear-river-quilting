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

const REFRESH_OPTIONS = [
  { value: '5s', label: 'Every 5 seconds', ms: 5_000 },
  { value: '10s', label: 'Every 10 seconds', ms: 10_000 },
  { value: '20s', label: 'Every 20 seconds', ms: 20_000 },
  { value: '1m', label: 'Every 1 minute', ms: 60_000 },
  { value: '5m', label: 'Every 5 minutes', ms: 5 * 60_000 },
  { value: '10m', label: 'Every 10 minutes', ms: 10 * 60_000 },
  { value: '15m', label: 'Every 15 minutes', ms: 15 * 60_000 },
  { value: '20m', label: 'Every 20 minutes', ms: 20 * 60_000 },
  { value: '30m', label: 'Every 30 minutes', ms: 30 * 60_000 },
];

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
  const [refreshInterval, setRefreshInterval] = useState('off');
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

  useEffect(() => {
    const stored = String(window.localStorage.getItem('adminAutoRefreshInterval') || 'off');
    if (REFRESH_OPTIONS.some((opt) => opt.value === stored)) {
      setRefreshInterval(stored);
    }
  }, []);

  useEffect(() => {
    if (refreshInterval === 'off' || !state.ok) return undefined;
    const selected = REFRESH_OPTIONS.find((opt) => opt.value === refreshInterval);
    if (!selected) return undefined;
    const timer = window.setInterval(() => {
      window.location.reload();
    }, selected.ms);
    return () => window.clearInterval(timer);
  }, [refreshInterval, state.ok]);

  function onRefreshIntervalChange(value) {
    const next = String(value || 'off');
    if (next !== 'off' && !REFRESH_OPTIONS.some((opt) => opt.value === next)) return;
    setRefreshInterval(next);
    if (next !== 'off') {
      window.localStorage.setItem('adminAutoRefreshInterval', next);
    } else {
      window.localStorage.removeItem('adminAutoRefreshInterval');
    }
  }

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
            <div className="admin-refresh-control">
              <button
                type="button"
                className="admin-refresh-link"
                onClick={() => window.location.reload()}
              >
                Refresh page
              </button>
              <label htmlFor="admin-refresh-interval" className="admin-refresh-control__label">
                Auto
              </label>
              <select
                id="admin-refresh-interval"
                className="admin-refresh-control__select"
                value={refreshInterval}
                onChange={(e) => onRefreshIntervalChange(e.target.value)}
                aria-label="Auto refresh interval"
              >
                <option value="off">Off</option>
                {REFRESH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
