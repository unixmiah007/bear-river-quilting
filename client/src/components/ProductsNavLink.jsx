import { NavLink, useLocation, useSearchParams } from 'react-router-dom';

function isProductsPathActive(pathname, searchParams, categorySlug) {
  if (pathname !== '/products') return false;
  const current = searchParams.get('category')?.trim() || '';
  if (categorySlug == null) return !current;
  return current === categorySlug;
}

export default function ProductsNavLink({ categories = [], onNavigate, variant = 'desktop' }) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const linkProps = onNavigate ? { onClick: onNavigate } : {};
  const hasCategories = categories.length > 0;

  if (variant === 'mobile') {
    return (
      <div className="nav-products nav-products--mobile">
        <NavLink
          to="/products"
          end
          className={({ isActive }) =>
            isActive && !searchParams.get('category') ? 'active' : undefined
          }
          {...linkProps}
        >
          Products
        </NavLink>
        {hasCategories ? (
          <ul className="nav-products__sub">
            {categories.map((c) => (
              <li key={c.id}>
                <NavLink
                  to={`/products?category=${encodeURIComponent(c.slug)}`}
                  className={() =>
                    isProductsPathActive(pathname, searchParams, c.slug) ? 'active' : undefined
                  }
                  {...linkProps}
                >
                  {c.name}
                </NavLink>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`nav-products nav-products--${variant}`}>
      <NavLink
        to="/products"
        className={() => (pathname === '/products' ? 'active' : undefined)}
        {...linkProps}
      >
        Products
        {hasCategories ? (
          <span className="nav-products__caret" aria-hidden="true">
            ▾
          </span>
        ) : null}
      </NavLink>
      {hasCategories ? (
        <ul className="nav-products__menu" role="menu">
          <li role="none">
            <NavLink
              to="/products"
              end
              role="menuitem"
              className={() =>
                isProductsPathActive(pathname, searchParams, null) ? 'active' : undefined
              }
              {...linkProps}
            >
              All products
            </NavLink>
          </li>
          {categories.map((c) => (
            <li key={c.id} role="none">
              <NavLink
                to={`/products?category=${encodeURIComponent(c.slug)}`}
                role="menuitem"
                className={() =>
                  isProductsPathActive(pathname, searchParams, c.slug) ? 'active' : undefined
                }
                {...linkProps}
              >
                {c.name}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
