import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, User, Briefcase, Users, Award, Shield } from "lucide-react";

const ROLES_LIST = [
  { key: "owner", label: "Course Coordinator", icon: Briefcase },
  { key: "qm", label: "QMS Coordinator", icon: Users },
  { key: "Head", label: "Trust Head", icon: Award }
];

export default function RolePicker({ role, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const pickerRef = useRef(null);

  const selectedRole = ROLES_LIST.find((r) => r.key === role);
  const SelectedIcon = selectedRole ? selectedRole.icon : Shield;

  const toggleDropdown = () => {
    if (disabled) return;
    if (!open && pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 170px available below, flip to open upwards so it never goes off-screen
      setOpenUpward(spaceBelow < 170);
    }
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (key) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <div className="role-picker-container" ref={pickerRef}>
      <label className="role-field-label" id="role-select-label">
        Select Role
      </label>

      <div className={`custom-role-dropdown ${open ? "is-open" : ""}`}>
        <button
          type="button"
          id="role-picker-button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby="role-select-label role-picker-button"
          className={`role-dropdown-trigger ${role ? "has-value" : ""} ${open ? "active-focus" : ""}`}
          onClick={toggleDropdown}
          disabled={disabled}
        >
          <div className="role-trigger-inner">
            <span className="role-trigger-icon-badge">
              <SelectedIcon size={16} />
            </span>
            <span className={`role-trigger-text ${!role ? "is-placeholder" : ""}`}>
              {selectedRole ? selectedRole.label : "Select Role"}
            </span>
          </div>

          <ChevronDown
            size={16}
            className={`role-trigger-chevron ${open ? "rotated" : ""}`}
          />
        </button>

        {open && (
          <div
            className={`role-options-panel ${openUpward ? "open-upward" : "open-downward"}`}
            role="listbox"
            aria-labelledby="role-select-label"
          >
            {ROLES_LIST.map((item) => {
              const IconComp = item.icon;
              const isSelected = role === item.key;

              return (
                <button
                  type="button"
                  key={item.key}
                  role="option"
                  aria-selected={isSelected}
                  className={`role-option-button ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(item.key)}
                >
                  <div className="role-option-main">
                    <span className="role-option-icon-box">
                      <IconComp size={15} />
                    </span>
                    <span className="role-option-title">{item.label}</span>
                  </div>

                  {isSelected && (
                    <span className="role-option-checkmark">
                      <Check size={15} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}