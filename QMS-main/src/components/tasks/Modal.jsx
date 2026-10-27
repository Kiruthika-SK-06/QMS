import React from "react";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
