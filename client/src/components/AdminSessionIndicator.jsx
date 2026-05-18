import { Link } from 'react-router-dom';
import { useAdminSession } from '../hooks/useAdminSession.js';

export function AdminSessionBanner() {
  const { loading, isAdmin, signOut } = useAdminSession();

  if (loading || !isAdmin) return null;

  return (
    <div className="admin-session-banner" role="status" aria-live="polite">
      <span className="admin-session-banner__status">
        <span className="admin-session-dot" aria-hidden="true" />
        Signed in as site admin
      </span>
      <span className="admin-session-banner__actions">
        <Link className="btn btn-primary admin-session-banner__btn" to="/admin/pages">
          Admin dashboard
        </Link>
        <button type="button" className="btn admin-session-banner__btn" onClick={() => signOut()}>
          Sign out
        </button>
      </span>
    </div>
  );
}

export function AdminSessionNavBadge() {
  const { loading, isAdmin } = useAdminSession();

  if (loading || !isAdmin) return null;

  return (
    <span className="admin-session-nav-badge" title="You are signed in to the admin">
      <span className="admin-session-dot" aria-hidden="true" />
      Admin on
    </span>
  );
}
