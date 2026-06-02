import { NavLink } from 'react-router-dom';

export default function AdminLayoutNavLink({ to, children, badge, onClick }) {
  return (
    <NavLink
      className={({ isActive }) => `pill admin-layout-nav-link${isActive ? ' active' : ''}`}
      to={to}
      onClick={onClick}
    >
      <span className="admin-layout-nav-link__label">{children}</span>
      {badge ? (
        <span className="admin-nav-badge" aria-label={`${badge} new since your last visit`}>
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}
