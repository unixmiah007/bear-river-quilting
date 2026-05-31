import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';

const STATIC_ROUTE_LABELS = {
  '/about': 'About Us',
  '/products': 'Products',
  '/cart': 'Cart',
  '/account': 'My account',
  '/customize': 'Customize',
  '/customize/success': 'Confirmation',
  '/checkout/success': 'Order confirmation',
  '/privacy-policy': 'Privacy Policy',
  '/return-policy': 'Return Policy',
  '/types-of-quilting': 'Types of quilting',
};

function buildBreadcrumbs(pathname, searchParams, params, labels) {
  if (pathname === '/') return [];

  const crumbs = [{ label: 'Home', to: '/' }];

  if (pathname.startsWith('/products/') && params.id) {
    crumbs.push({ label: 'Products', to: '/products' });
    crumbs.push({
      label: labels.productName || 'Product',
      to: pathname,
    });
    return crumbs;
  }

  if (pathname === '/products') {
    crumbs.push({ label: 'Products', to: '/products' });
    const categorySlug = searchParams.get('category')?.trim();
    if (categorySlug && labels.categoryName) {
      crumbs.push({
        label: labels.categoryName,
        to: `/products?category=${encodeURIComponent(categorySlug)}`,
      });
    }
    return crumbs;
  }

  if (pathname.startsWith('/p/') && params.slug) {
    crumbs.push({
      label: labels.pageTitle || params.slug,
      to: pathname,
    });
    return crumbs;
  }

  if (pathname === '/customize/success') {
    crumbs.push({ label: 'Customize', to: '/customize' });
    crumbs.push({ label: STATIC_ROUTE_LABELS[pathname], to: pathname });
    return crumbs;
  }

  const staticLabel = STATIC_ROUTE_LABELS[pathname];
  if (staticLabel) {
    crumbs.push({ label: staticLabel, to: pathname });
    return crumbs;
  }

  const fallback = pathname.split('/').filter(Boolean).pop();
  if (fallback) {
    crumbs.push({ label: fallback, to: pathname });
  }

  return crumbs;
}

export default function SiteBreadcrumbs({ categories = [] }) {
  const { pathname } = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [labels, setLabels] = useState({
    productName: null,
    pageTitle: null,
  });

  const categorySlug = searchParams.get('category')?.trim() || '';
  const categoryName = useMemo(() => {
    if (!categorySlug) return null;
    return categories.find((c) => c.slug === categorySlug)?.name || categorySlug;
  }, [categories, categorySlug]);

  useEffect(() => {
    let cancelled = false;

    if (pathname.startsWith('/products/') && params.id) {
      setLabels((current) => ({ ...current, productName: null }));
      publicApi
        .productById(params.id)
        .then((product) => {
          if (!cancelled && product?.name) {
            setLabels((current) => ({ ...current, productName: product.name }));
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    if (pathname.startsWith('/p/') && params.slug) {
      setLabels((current) => ({ ...current, pageTitle: null }));
      publicApi
        .pageBySlug(params.slug)
        .then((data) => {
          if (!cancelled && data?.page?.title) {
            setLabels((current) => ({ ...current, pageTitle: data.page.title }));
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    return undefined;
  }, [pathname, params.id, params.slug]);

  const crumbs = buildBreadcrumbs(pathname, searchParams, params, {
    productName: labels.productName,
    pageTitle: labels.pageTitle,
    categoryName,
  });

  if (crumbs.length === 0) return null;

  return (
    <nav className="site-breadcrumbs" aria-label="Breadcrumb">
      <ol className="site-breadcrumbs__list">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.to}-${index}`} className="site-breadcrumbs__item">
              {isLast ? (
                <span className="site-breadcrumbs__current" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link className="site-breadcrumbs__link" to={crumb.to}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
