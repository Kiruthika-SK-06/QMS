import React from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import SectionHeader from "../common/SectionHeader";

export default function ActivityCard() {
  const { activities } = useApp();

  return (
    <section className="panel">
      <SectionHeader
        title="Recent activity"
        action={<NavLink className="text-link" to="/activity">View timeline</NavLink>}
      />
      <div className="mini-activity">
        {activities.slice(0, 5).map((item) => (
          <div className="mini-activity-item" key={item.id || item.text}>
            <span className={`activity-dot ${item.tone}`} />
            <div>
              <strong>{item.text}</strong>
              <small>{item.time}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
