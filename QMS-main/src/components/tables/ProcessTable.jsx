import React from "react";
import StatusBadge from "../common/StatusBadge";

export default function ProcessTable({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
        <p>No processes found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Process</th>
            <th>Course coordinator</th>
            <th>Coordinators / Staff</th>
            <th>Active tasks</th>
            <th>Completion</th>
            <th>Documents</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id || item.name}>
              <td>
                <strong>{item.name}</strong>
                {item.id && <small>{item.id}</small>}
              </td>
              <td>{item.owner}</td>
              <td>{item.employees}</td>
              <td>{item.active}</td>
              <td>
                <div className="progress">
                  <span
                    style={{
                      width: `${item.progress !== undefined ? item.progress : Math.min(item.completed * 1.7, 94)}%`
                    }}
                  />
                </div>
              </td>
              <td>{item.documents}</td>
              <td>
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
