import React, { useEffect, useRef, useState } from "react";
import { roles } from "../../data/mockData";

export default function RolePicker({ role, onChange }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  const selectedLabel = role ? roles[role] : "Select Role";

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSelect = (key) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <div className="role-picker" ref={pickerRef}>
      <label>Sign in as</label>

      <div className={`custom-role-select ${open ? "open" : ""}`}>
        <button
          type="button"
          className="role-select-trigger"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className={!role ? "placeholder" : ""}>
            {selectedLabel}
          </span>

          <span className="role-arrow">
            {open ? "": "^"}
          </span>
        </button>

        {open && (
          <div className="role-options">
            <button
              type="button"
              className={`role-option ${!role ? "selected" : ""}`}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <span>Select Role</span>
            </button>

            {Object.entries(roles).map(([key, label]) => (
              <button
                type="button"
                className={`role-option ${
                  role === key ? "selected" : ""
                }`}
                key={key}
                onClick={() => handleSelect(key)}
              >
                <span>{label}</span>

                {role === key && (
                  <span className="role-check">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}