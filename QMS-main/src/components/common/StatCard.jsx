import React from "react";

export default function StatCard({ label, value, icon: Icon, tone = "blue", trend }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {trend && <small>{trend}</small>}
      </div>
    </div>
  );
}
