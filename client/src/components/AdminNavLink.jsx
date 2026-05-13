import { NavLink, useLocation } from 'react-router-dom';
import AdminIcon from './AdminIcon.jsx';

export default function AdminNavLink() {
  const { pathname } = useLocation();
  const active = pathname.startsWith('/admin') && pathname !== '/admin/login';

  return (
    <NavLink
      to="/admin/pages"
      className={() => `nav-link-admin${active ? ' nav-link-admin--active' : ''}`}
      aria-label="Admin — manage pages, products, and orders"
      title="Admin"
    >
      <span className="nav-link-admin__inner" aria-hidden="true">
        <span className="nav-link-admin__icon-wrap">
          <AdminIcon />
        </span>
        <span className="nav-link-admin__text">Admin</span>
      </span>
    </NavLink>
  );
}
