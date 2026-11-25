import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";
import { activitiesData } from "../data/activities.js";

// GET /api/activities
export const getAllActivities = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

    if (mongoose.connection.readyState === 1) {
      try {
        const activities = await Activity.find({}).sort({ createdAt: -1, timestamp: -1 }).limit(limit).lean();
        if (activities && activities.length > 0) {
          return res.json({
            success: true,
            count: activities.length,
            activities
          });
        }
      } catch (err) {
        console.warn("getAllActivities DB error, using synchronized dataset:", err.message);
      }
    }

    res.json({
      success: true,
      count: Math.min(activitiesData.length, limit),
      activities: activitiesData.slice(0, limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/activities
export const addActivity = async (req, res) => {
  try {
    const { text, actor, tone, title, detail } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Activity text is required" });
    }

    const newActivityData = {
      id: `ACT-${Date.now()}`,
      title: title || "System Activity",
      text: text.trim(),
      detail: detail || "",
      actor: actor || req.user?.name || "System",
      time: "Just now",
      tone: tone || "blue",
      timestamp: new Date().toISOString()
    };

    let newActivity = newActivityData;
    if (mongoose.connection.readyState === 1) {
      try {
        newActivity = await Activity.create(newActivityData);
      } catch (err) {
        console.warn("addActivity DB error:", err.message);
      }
    }
    activitiesData.unshift(newActivityData);

    res.status(201).json({ success: true, activity: newActivity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllActivities,
  addActivity
};
