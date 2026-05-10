import { NavLink } from 'react-router-dom';
import CartIcon from './CartIcon.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function CartNavLink() {
  const { itemCount } = useCart();

  return (
    <NavLink
      to="/cart"
      className={({ isActive }) => `nav-link-cart${isActive ? ' nav-link-cart--active' : ''}`}
      aria-label={itemCount === 0 ? 'Shopping cart, empty' : `Shopping cart, ${itemCount} items`}
      title="Cart"
    >
      <span className="nav-link-cart__inner" aria-hidden="true">
        <span className="nav-link-cart__icon-wrap">
          <CartIcon />
          {itemCount > 0 ? (
            <span className="cart-badge">{itemCount > 99 ? '99+' : itemCount}</span>
          ) : null}
        </span>
        <span className="nav-link-cart__text">Cart</span>
      </span>
    </NavLink>
  );
}
