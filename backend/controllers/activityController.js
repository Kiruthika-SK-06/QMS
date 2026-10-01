import { activitiesData } from "../data/activities.js";

// GET /api/activities
export const getAllActivities = (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const items = activitiesData.slice(0, limit);
    res.json({
      success: true,
      count: items.length,
      activities: items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/activities
export const addActivity = (req, res) => {
  try {
    const { text, actor, tone } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Activity text is required" });
    }

    const newActivity = {
      id: `ACT-${Date.now()}`,
      text: text.trim(),
      actor: actor || req.user?.name || "System",
      time: "Just now",
      tone: tone || "blue",
      timestamp: new Date().toISOString()
    };

    activitiesData.unshift(newActivity);
    res.status(201).json({ success: true, activity: newActivity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
