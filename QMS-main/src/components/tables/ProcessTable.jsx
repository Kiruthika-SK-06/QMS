import React from "react";
import StatusBadge from "../common/StatusBadge";

export default function ProcessTable({ items }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Process</th><th>Process owner</th><th>Employees</th><th>Active tasks</th><th>Completion</th><th>Documents</th><th>Status</th></tr></thead>
        <tbody>{items.map((item) => <tr key={item.name}><td><strong>{item.name}</strong></td><td>{item.owner}</td><td>{item.employees}</td><td>{item.active}</td><td><div className="progress"><span style={{ width: `${Math.min(item.completed * 1.7, 94)}%` }} /></div></td><td>{item.documents}</td><td><StatusBadge status={item.status} /></td></tr>)}</tbody>
      </table>
    </div>
  );
}
