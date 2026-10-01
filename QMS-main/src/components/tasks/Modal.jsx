import React from "react";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><h2>{title}</h2><button onClick={onClose}><X size={19} /></button></div>{children}</div></div>;
}
