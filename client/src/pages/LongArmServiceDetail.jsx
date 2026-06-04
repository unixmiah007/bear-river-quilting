import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { publicApi } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import { getLongArmServiceDetailByPath } from '../lib/longArmServiceDetailContent.js';
import { longArmQuiltingRequestUrl } from '../lib/longArmServicePages.js';

export default function LongArmServiceDetail() {
  const { pathname } = useLocation();
  const detail = getLongArmServiceDetailByPath(pathname);
  const [cardImageUrl, setCardImageUrl] = useState(null);

  useEffect(() => {
    if (!detail?.slug) return undefined;
    let cancelled = false;
    publicApi
      .listLongArmServices()
      .then((rows) => {
        if (cancelled) return;
        const svc = (Array.isArray(rows) ? rows : []).find((s) => s.slug === detail.slug);
        setCardImageUrl(svc?.image_url ?? null);
      })
      .catch(() => {
        if (!cancelled) setCardImageUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [detail?.slug]);

  if (!detail) {
    return <Navigate to="/long-arm-quilting" replace />;
  }

  const heroSrc = cardImageUrl || detail.heroImage;
  const heroAlt = detail.heroImageAlt || detail.title;
  const requestUrl = longArmQuiltingRequestUrl(detail.slug);

  return (
    <article className="legal-page long-arm-service-detail">
      <header className="legal-page__header long-arm-service-detail__header">
        <p className="eyebrow">Long-arm quilting</p>
        <h1>{detail.title}</h1>
        <p className="page-body long-arm-service-detail__intro">{detail.intro}</p>
        <div className="row" style={{ marginTop: '1.25rem' }}>
          <Link className="btn btn-primary" to={requestUrl}>
            Request this service
          </Link>
          <Link className="btn" to="/long-arm-quilting">
            All long-arm services
          </Link>
        </div>
      </header>

      <figure className="long-arm-service-detail__hero">
        <ProductImage src={heroSrc} alt={heroAlt} />
      </figure>

      <div className="legal-page__body long-arm-service-detail__body">
        {detail.sections.map((section) => (
          <section key={section.id} id={section.id} className="long-arm-service-detail__section">
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="page-body">
                {paragraph}
              </p>
            ))}
            {section.list ? (
              <>
                {section.list.label ? <p className="page-body">{section.list.label}</p> : null}
                <ul>
                  {section.list.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {section.image ? (
              <figure className="long-arm-service-detail__figure">
                <img src={section.image} alt={section.imageAlt || ''} loading="lazy" />
              </figure>
            ) : null}
          </section>
        ))}

        <section className="long-arm-service-detail__cta card">
          <h2>Get started</h2>
          <p className="page-body">{detail.cta}</p>
          <Link className="btn btn-primary" to={requestUrl}>
            {detail.ctaButton}
          </Link>
        </section>
      </div>
    </article>
  );
}
