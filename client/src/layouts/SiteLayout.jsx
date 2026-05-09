import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { publicApi } from '../api.js';

export default function SiteLayout() {
  const [pages, setPages] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    publicApi
      .listPages()
      .then(setPages)
      .catch(() => setErr('Could not load navigation.'));
  }, []);

  return (
    <div className="layout">
      <header className="site-header">
        <div className="brand">
          <NavLink to="/">CMS Store</NavLink>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          {pages.map((p) => (
            <NavLink key={p.id} to={`/p/${p.slug}`}>
              {p.title}
            </NavLink>
          ))}
          <NavLink to="/admin/pages">Admin</NavLink>
        </nav>
      </header>
      {err && <p className="error">{err}</p>}
      <Outlet />
    </div>
  );
}
