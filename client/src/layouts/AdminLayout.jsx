import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { authApi } from '../api.js';

async function signOut() {
  await authApi.logout();
  window.location.href = '/admin/login';
}

export default function AdminLayout() {
  const [state, setState] = useState({ loading: true, ok: false });
  const location = useLocation();

  useEffect(() => {
    authApi
      .me()
      .then((r) => setState({ loading: false, ok: r.authenticated }))
      .catch(() => setState({ loading: false, ok: false }));
  }, [location.pathname]);

  if (state.loading) {
    return (
      <div className="admin-shell">
        <p className="muted">Checking session…</p>
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
            <NavLink
              className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
              to="/admin/orders"
            >
              Orders
            </NavLink>
            <NavLink
              className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
              to="/admin/customize-requests"
            >
              Customize
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
