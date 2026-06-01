export function AdminSectionLegend({ icon: Icon, children, className = '' }) {
  return (
    <legend className={`admin-section-title admin-section-legend${className ? ` ${className}` : ''}`}>
      {Icon ? <Icon className="admin-section-title__icon" /> : null}
      <span>{children}</span>
    </legend>
  );
}

export default function AdminSectionTitle({
  as: Tag = 'h4',
  icon: Icon,
  children,
  id,
  className = '',
  style,
}) {
  return (
    <Tag
      id={id}
      className={`admin-section-title${className ? ` ${className}` : ''}`}
      style={style}
    >
      {Icon ? <Icon className="admin-section-title__icon" /> : null}
      <span>{children}</span>
    </Tag>
  );
}
