import PageLoading from './PageLoading.jsx';

/** Shown while a lazy-loaded route chunk is downloading. */
export default function RouteSuspenseFallback() {
  return <PageLoading active label="Loading page…" />;
}
