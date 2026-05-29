import { useEffect, useState } from 'react';

/** True only after `active` stays true for `delayMs` (avoids flash on fast loads). */
export function useDelayedLoading(active, delayMs = 280) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);

  return show;
}
