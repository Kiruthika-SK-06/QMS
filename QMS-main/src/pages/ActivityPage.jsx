import React from "react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";

export default function ActivityPage() {
  const { activities } = useApp();

  return (
    <>
      <PageIntro
        eyebrow="Audit trail"
        title="Activity"
        description="Chronological activity across documents, tasks and review workflows."
      />
      <section className="panel">
        <div className="timeline">
          {activities.map((item) => (
            <div className="timeline-item" key={item.id || item.text}>
              <span className={`timeline-dot ${item.tone}`} />
              <div>
                <strong>{item.text}</strong>
                <p>{item.actor}</p>
                <small>{item.time}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
