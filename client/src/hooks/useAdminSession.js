import { useCallback, useEffect, useState } from 'react';
import { authApi } from '../api.js';

export function useAdminSession({ refreshKey } = {}) {
  const [state, setState] = useState({ loading: true, isAdmin: false });

  const refresh = useCallback(() => {
    return authApi
      .me()
      .then((r) => {
        setState({ loading: false, isAdmin: !!r?.authenticated });
        return !!r?.authenticated;
      })
      .catch(() => {
        setState({ loading: false, isAdmin: false });
        return false;
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((r) => {
        if (!cancelled) setState({ loading: false, isAdmin: !!r?.authenticated });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, isAdmin: false });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const signOut = useCallback(async () => {
    await authApi.logout();
    setState({ loading: false, isAdmin: false });
  }, []);

  return { ...state, refresh, signOut };
}
