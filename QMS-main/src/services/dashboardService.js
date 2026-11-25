export const dashboardService = {
  async getStats() {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return await res.json();
    } catch (err) {
      console.warn("Failed to load dashboard stats from backend:", err.message);
      return null;
    }
  }
};

export default dashboardService;
