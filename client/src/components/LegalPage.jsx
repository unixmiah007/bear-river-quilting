export default function LegalPage({ title, children, updated = 'May 18, 2026' }) {
  return (
    <article className="legal-page">
      <header className="legal-page__header">
        <p className="eyebrow">Bear River Quilting</p>
        <h1>{title}</h1>
        <p className="muted legal-page__updated">Last updated: {updated}</p>
      </header>
      <div className="legal-page__body">{children}</div>
    </article>
  );
}
