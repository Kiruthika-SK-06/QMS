// Process and organizational services for QMS Backend API

export const processService = {
  /**
   * Fetch all processes
   */
  async fetchProcesses() {
    const res = await fetch("/api/processes");
    if (!res.ok) throw new Error("Failed to load processes");
    const data = await res.json();
    return data.processes || [];
  },

  /**
   * Fetch management overview, stats, and timeline for QM Head
   */
  async fetchHeadOverview() {
    const res = await fetch("/api/processes/head-overview");
    if (!res.ok) throw new Error("Failed to load management overview");
    return await res.json();
  },

  /**
   * Fetch employees directory
   */
  async fetchEmployees() {
    const res = await fetch("/api/employees");
    if (!res.ok) throw new Error("Failed to load employees");
    const data = await res.json();
    return data.employees || [];
  },

  /**
   * Fetch audit trail activity log
   */
  async fetchActivities(limit = 20) {
    const res = await fetch(`/api/activities?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to load activity log");
    const data = await res.json();
    return data.activities || [];
  }
};
