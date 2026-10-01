import React from "react";
import { NavLink } from "react-router-dom";
import  StatusBadge  from "../common/StatusBadge";

export default function DocumentTable({ items, review = false }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Document</th><th>Type</th><th>Process</th><th>Version</th><th>Last updated</th><th>Status</th><th /></tr></thead>
        <tbody>
          {items.map((document) => (
            <tr key={document.id}>
              <td><NavLink className="table-link" to={`/documents/${document.id}`}><strong>{document.name}</strong><small>{document.id}</small></NavLink></td>
              <td>{document.type}</td><td>{document.process}</td><td><b>v{document.version}</b></td><td>{document.updated}</td>
              <td><StatusBadge status={document.status} /></td>
              <td><NavLink className="row-action" to={review ? `/reviews?document=${document.id}` : `/documents/${document.id}`}>{review ? "Review" : "View"}</NavLink></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
