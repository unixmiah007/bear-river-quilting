import { NavLink, useLocation } from 'react-router-dom';
import { useAdminSession } from '../hooks/useAdminSession.js';
import AdminIcon from './AdminIcon.jsx';

export default function AdminNavLink({ onNavigate }) {
  const { pathname } = useLocation();
  const { isAdmin } = useAdminSession();
  const active = pathname.startsWith('/admin') && pathname !== '/admin/login';

  return (
    <NavLink
      to="/admin/pages"
      onClick={onNavigate}
      className={() =>
        `nav-link-admin${active ? ' nav-link-admin--active' : ''}${isAdmin ? ' nav-link-admin--signed-in' : ''}`
      }
      aria-label={
        isAdmin
          ? 'Admin — signed in. Open dashboard'
          : 'Admin — manage pages, products, and orders'
      }
      title={isAdmin ? 'Signed in to admin' : 'Admin'}
    >
      <span className="nav-link-admin__inner" aria-hidden="true">
        <span className="nav-link-admin__icon-wrap">
          <AdminIcon />
          {isAdmin ? <span className="admin-session-dot nav-link-admin__dot" aria-hidden="true" /> : null}
        </span>
        <span className="nav-link-admin__text">Admin</span>
      </span>
    </NavLink>
  );
}
