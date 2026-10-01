import React from "react";
import { Download } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export default function VersionHistory({ versions }) {
  return <div className="version-list">{versions.map((version) => <div className="version-row" key={version.version}><div className="version-number">v{version.version}</div><div><strong>Version {version.version}</strong><small>{version.date} · {version.author}</small></div><StatusBadge status={version.status} /><button className="row-action"><Download size={15} /> View</button></div>)}</div>;
}
