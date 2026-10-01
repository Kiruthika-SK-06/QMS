import React from "react";
import { Download } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatusBadge from "../components/common/StatusBadge";

export default function VersionHistoryPage() {
  const { documents, downloadDocument } = useApp();
  return (
    <>
      <PageIntro
        eyebrow="Controlled records"
        title="Version history"
        description="Every update creates a new version. Earlier versions are never overwritten."
      />
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Version</th>
                <th>Date</th>
                <th>Author</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.flatMap((doc) =>
                doc.versions.map((version) => (
                  <tr key={`${doc.id}-${version.version}`}>
                    <td>
                      <strong>{doc.name}</strong>
                      <small>{doc.id}</small>
                    </td>
                    <td>v{version.version}</td>
                    <td>{version.date}</td>
                    <td>{version.author}</td>
                    <td>
                      <StatusBadge status={version.status} />
                    </td>
                    <td>
                      <button
                        className="row-action"
                        onClick={() => downloadDocument(doc.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <Download size={15} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
