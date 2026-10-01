import React from "react";

export default function StatusBadge({ status }) {
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status status-${normalized}`}>{status}</span>;
}
