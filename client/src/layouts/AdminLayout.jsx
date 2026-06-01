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

export default function AdminLayout() {
  const [state, setState] = useState({ loading: true, ok: false });
  const [navBadges, setNavBadges] = useState({
    orders: 0,
    customizeRequests: 0,
    communications: 0,
  });
  const location = useLocation();

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
      <div className="admin-top">
        <div className="brand">
          <NavLink to="/">← Site</NavLink>
        </div>
        <div className="row" style={{ gap: '0.75rem', alignItems: 'center' }}>
          <span className="admin-session-pill" role="status">
            <span className="admin-session-dot" aria-hidden="true" />
            Admin signed in
          </span>
          <nav className="admin-nav">
            <NavLink
              className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
              to="/admin/pages"
            >
              Pages
            </NavLink>
            <NavLink
              className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
              to="/admin/products"
            >
              Products
            </NavLink>
            <NavLink
              className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
              to="/admin/categories"
            >
              Product categories
            </NavLink>
            <AdminLayoutNavLink to="/admin/orders" badge={formatAdminNavBadge(navBadges.orders)}>
              Orders
            </AdminLayoutNavLink>
            <AdminLayoutNavLink
              to="/admin/customize-requests"
              badge={formatAdminNavBadge(navBadges.customizeRequests)}
            >
              Customize
            </AdminLayoutNavLink>
            <AdminLayoutNavLink
              to="/admin/communication"
              badge={formatAdminNavBadge(navBadges.communications)}
            >
              Communication
            </AdminLayoutNavLink>
            <NavLink
              className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
              to="/admin/custom-payment"
            >
              Custom payment
            </NavLink>
          </nav>
          <button type="button" className="btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
