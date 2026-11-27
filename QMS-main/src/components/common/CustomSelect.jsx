import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect - Reusable, accessible, beautifully styled dropdown component
 * matching the application design system (#0C1979 theme, rounded corners, clean hover/active states).
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  children,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  name = "",
  id = "",
  className = "",
  style = {}
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  // Normalize options from either options prop or children (<option>)
  const parsedOptions = React.useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map((opt) => {
        if (typeof opt === "string") {
          return { value: opt, label: opt };
        }
        if (opt && typeof opt === "object") {
          return {
            value: opt.value !== undefined ? opt.value : opt.name || opt.id || "",
            label: opt.label || opt.name || opt.title || String(opt.value || "")
          };
        }
        return { value: String(opt), label: String(opt) };
      });
    }

    if (children) {
      return React.Children.toArray(children)
        .filter((child) => React.isValidElement(child) && child.type === "option")
        .map((child) => ({
          value: child.props.value !== undefined ? child.props.value : child.props.children,
          label: child.props.children
        }));
    }

    return [];
  }, [options, children]);

  const selectedOption = parsedOptions.find((opt) => String(opt.value) === String(value));

  const toggleDropdown = () => {
    if (disabled) return;
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 220);
    }
    setOpen((prev) => !prev);
  };

  const handleSelect = (opt) => {
    if (disabled) return;
    if (onChange) {
      // Create synthetic event for compatibility with standard form handlers e.target.value
      const syntheticEvent = {
        target: { value: opt.value, name: name || id || "" }
      };
      onChange(syntheticEvent, opt.value);
    }
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (!open) return;
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev < parsedOptions.length - 1 ? prev + 1 : 0));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : parsedOptions.length - 1));
      } else if (event.key === "Enter" && focusedIndex >= 0 && focusedIndex < parsedOptions.length) {
        event.preventDefault();
        handleSelect(parsedOptions[focusedIndex]);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, focusedIndex, parsedOptions]);

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${open ? "is-open" : ""} ${className}`}
      style={{
        position: "relative",
        width: "100%",
        ...style
      }}
    >
      {/* Hidden native input for form validation support if required */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: "absolute", pointerEvents: "none" }}
          value={value || ""}
          required={required}
          onChange={() => {}}
        />
      )}

      {/* Dropdown Control Trigger */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggleDropdown}
        className={`custom-select-trigger ${open ? "active" : ""}`}
        style={{
          width: "100%",
          minHeight: "40px",
          height: "40px",
          padding: "0 14px",
          borderRadius: "8px",
          background: "#ffffff",
          border: open ? "1.5px solid #0C1979" : "1px solid #DCE2F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "13px",
          fontWeight: "500",
          color: selectedOption ? "#050B3B" : "#64748b",
          boxShadow: open ? "0 0 0 2px rgba(12, 25, 121, 0.20)" : "none",
          outline: "none",
          transition: "all 0.18s ease"
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "left"
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: open ? "#0C1979" : "#64748b",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0
          }}
        />
      </button>

      {/* Expanded Options Menu */}
      {open && (
        <div
          role="listbox"
          className="custom-select-menu"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            [openUpward ? "bottom" : "top"]: "calc(100% + 6px)",
            background: "#ffffff",
            border: "1px solid #DCE2F5",
            borderRadius: "8px",
            padding: "5px",
            boxShadow: "0 10px 25px rgba(5, 11, 59, 0.15)",
            zIndex: 1050,
            maxHeight: "230px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "2px"
          }}
        >
          {parsedOptions.length === 0 ? (
            <div style={{ padding: "10px 12px", color: "#64748b", fontSize: "12px", textAlign: "center" }}>
              No options available
            </div>
          ) : (
            parsedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isFocused = idx === focusedIndex;

              return (
                <button
                  type="button"
                  key={`${opt.value}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`custom-select-option ${isSelected ? "selected" : ""}`}
                  style={{
                    width: "100%",
                    minHeight: "36px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    border: "none",
                    borderRadius: "6px",
                    background: isSelected
                      ? "#0C1979"
                      : isFocused
                      ? "#EBEDFE"
                      : "transparent",
                    color: isSelected ? "#ffffff" : isFocused ? "#0C1979" : "#050B3B",
                    fontSize: "13px",
                    fontWeight: isSelected ? "600" : "500",
                    textAlign: "left",
                    cursor: "pointer",
                    outline: "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {opt.label}
                  </span>
                  {isSelected && <Check size={14} color="#ffffff" style={{ flexShrink: 0 }} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
