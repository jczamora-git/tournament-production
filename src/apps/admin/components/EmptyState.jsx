function EmptyState({ icon = "∅", title, description, children }) {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-icon">{icon}</div>
      {title && <div className="admin-empty-title">{title}</div>}
      {description && <div className="admin-empty-desc">{description}</div>}
      {children}
    </div>
  );
}

export default EmptyState;
