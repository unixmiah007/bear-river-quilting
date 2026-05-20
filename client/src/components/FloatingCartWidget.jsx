import { Link, useLocation } from 'react-router-dom';
import CartIcon from './CartIcon.jsx';
import { useCart } from '../context/CartContext.jsx';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function FloatingCartWidget() {
  const { pathname } = useLocation();
  const { itemCount, total } = useCart();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const onCartPage = pathname === '/cart';
  const label =
    itemCount === 0
      ? 'Shopping cart, empty'
      : `Shopping cart, ${itemCount} item${itemCount === 1 ? '' : 's'}, ${formatPrice(total)}`;

  return (
    <Link
      to="/cart"
      className={`floating-cart${onCartPage ? ' floating-cart--current' : ''}${
        itemCount > 0 ? ' floating-cart--has-items' : ''
      }`}
      aria-label={label}
      title={itemCount > 0 ? `View cart · ${formatPrice(total)}` : 'View cart'}
    >
      <span className="floating-cart__icon-wrap" aria-hidden="true">
        <CartIcon className="floating-cart__icon" />
        {itemCount > 0 ? (
          <span className="floating-cart__badge">{itemCount > 99 ? '99+' : itemCount}</span>
        ) : null}
      </span>
      <span className="floating-cart__text">
        <span className="floating-cart__label">Cart</span>
        {itemCount > 0 ? (
          <span className="floating-cart__total">{formatPrice(total)}</span>
        ) : null}
      </span>
    </Link>
  );
}
