import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { authApi } from '../api.js';

function resolveAdminRedirect(fromState) {
  if (!fromState?.pathname) return '/admin/dashboard';
  const path = `${fromState.pathname}${fromState.search || ''}`;
  if (path === '/admin/login' || path === '/admin' || path === '/admin/') {
    return '/admin/dashboard';
  }
  return path;
}

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState({ loading: true, authenticated: false });
  const navigate = useNavigate();
  const location = useLocation();
  const from = resolveAdminRedirect(location.state?.from);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((r) => {
        if (!cancelled) setSession({ loading: false, authenticated: !!r?.authenticated });
      })
      .catch(() => {
        if (!cancelled) setSession({ loading: false, authenticated: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.login(password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  if (session.loading) {
    return null;
  }

  if (session.authenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="login-box">
      <h1>Admin sign in</h1>
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input
            id="pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
