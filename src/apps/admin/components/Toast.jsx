import { useEffect } from "react";
import { createPortal } from "react-dom";

function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose?.(), 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return createPortal(
    <div className={`admin-toast admin-toast-${type}`} role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose}>✕</button>
    </div>,
    document.body
  );
}

export default Toast;
