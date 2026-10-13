import React, { useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import ProcessTable from "../components/tables/ProcessTable";

export default function Processes() {
  const { processes } = useApp();
  const [query, setQuery] = useState("");

  const filtered = (processes || []).filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.owner.toLowerCase().includes(query.toLowerCase()) ||
      (p.id && p.id.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <PageIntro
        eyebrow="Process register"
        title="Processes"
        description="Monitor course coordinator assignments, active tasks, documentation compliance, and operating performance."
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search processes by title, coordinator, or ID..."
          />
        </label>
      </div>
      <section className="panel">
        <ProcessTable items={filtered} />
      </section>
    </>
  );
}

