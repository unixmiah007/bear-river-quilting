import { NavLink } from 'react-router-dom';
import AccountIcon from './AccountIcon.jsx';

export default function AccountNavLink({ onNavigate }) {
  return (
    <NavLink
      to="/account"
      onClick={onNavigate}
      className={({ isActive }) =>
        `nav-link-account${isActive ? ' nav-link-account--active' : ''}`
      }
      aria-label="My account — orders and profile"
      title="My account"
    >
      <span className="nav-link-account__inner" aria-hidden="true">
        <span className="nav-link-account__icon-wrap">
          <AccountIcon />
        </span>
        <span className="nav-link-account__text">My account</span>
      </span>
    </NavLink>
  );
}
