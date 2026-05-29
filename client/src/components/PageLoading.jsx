import { useDelayedLoading } from '../hooks/useDelayedLoading.js';
import PageLoader from './PageLoader.jsx';

/** Shows {@link PageLoader} only if `active` remains true past a short delay. */
export default function PageLoading({ active, label = 'Loading…', inline = false }) {
  const show = useDelayedLoading(active);
  if (!show) return null;
  return <PageLoader label={label} inline={inline} />;
}
