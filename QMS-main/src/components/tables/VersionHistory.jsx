import React from "react";
import { Download } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";

export default function VersionHistory({ versions = [], docId }) {
  const { downloadDocument } = useApp();

  return (
    <div className="version-list">
      {(versions || []).map((version) => (
        <div className="version-row" key={version.version}>
          <div className="version-number">v{version.version}</div>
          <div>
            <strong>Version {version.version}</strong>
            <small>
              {version.date} · {version.author}
              {version.notes ? ` — ${version.notes}` : ""}
            </small>
          </div>
          <StatusBadge status={version.status} />
          {docId && (
            <button
              type="button"
              className="row-action"
              onClick={() => downloadDocument(docId)}
              style={{ cursor: "pointer" }}
            >
              <Download size={15} /> View
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

