import QuiltTypeImage from '../components/QuiltTypeImage.jsx';
import {
  QUILT_TYPES_CLOSING,
  QUILT_TYPES_INTRO,
  QUILT_TYPE_SECTIONS,
} from '../lib/quiltTypesContent.js';

function QuiltTypeList({ list }) {
  if (!list?.items?.length) return null;
  return (
    <>
      {list.label ? <p className="page-body quilt-types__list-label">{list.label}</p> : null}
      <ul>
        {list.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}

function QuiltTypeGallery({ images, sectionTitle }) {
  if (!images?.length) return null;
  return (
    <div className="quilt-types__gallery">
      {images.map((src, index) => (
        <QuiltTypeImage
          key={`${sectionTitle}-${index}`}
          src={src}
          alt={`${sectionTitle} quilt example ${index + 1}`}
          index={index}
        />
      ))}
    </div>
  );
}

export default function TypesOfQuilting() {
  return (
    <article className="legal-page quilt-types-page">
      <header className="legal-page__header">
        <p className="eyebrow">Bear River Quilting</p>
        <h1>Types of quilting</h1>
        <p className="page-body quilt-types__intro">{QUILT_TYPES_INTRO}</p>
      </header>

      <div className="legal-page__body quilt-types__body">
        {QUILT_TYPE_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="quilt-types__section">
            <h2>{section.title}</h2>
            {section.paragraphs?.map((text) => (
              <p key={text} className="page-body">
                {text}
              </p>
            ))}
            {section.lists?.map((list) => (
              <QuiltTypeList key={list.label ?? list.items[0]} list={list} />
            ))}
            {section.subsections?.map((sub) => (
              <div key={sub.title} className="quilt-types__subsection">
                <h3>{sub.title}</h3>
                {sub.paragraphs?.map((text) => (
                  <p key={text} className="page-body">
                    {text}
                  </p>
                ))}
                {sub.lists?.map((list) => (
                  <QuiltTypeList key={list.label ?? sub.title} list={list} />
                ))}
              </div>
            ))}
            <QuiltTypeGallery images={section.images} sectionTitle={section.title} />
          </section>
        ))}

        <section className="quilt-types__section quilt-types__closing">
          <p className="page-body">{QUILT_TYPES_CLOSING.lead}</p>
          <ul>
            {QUILT_TYPES_CLOSING.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
