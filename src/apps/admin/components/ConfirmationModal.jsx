function ConfirmationModal({
  open,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal-panel admin-modal-panel-sm">
        <div className="admin-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="admin-modal-body">
          <p style={{ color: "var(--jz-text-muted)", lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="admin-modal-footer">
          <button type="button" className="button-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={variant === "danger" ? "button-danger" : "button-primary"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
