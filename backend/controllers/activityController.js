import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";
import { activitiesData } from "../data/activities.js";

// GET /api/activities
export const getAllActivities = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    let items = activitiesData;

    if (mongoose.connection.readyState === 1) {
      try {
        const dbActs = await Activity.find({}).sort({ timestamp: -1 }).limit(limit).lean();
        if (dbActs && dbActs.length > 0) {
          items = dbActs;
          activitiesData.length = 0;
          activitiesData.push(...dbActs);
        }
      } catch (err) {
        console.warn("MongoDB read error in getAllActivities:", err.message);
      }
    }

    const result = items.slice(0, limit);
    res.json({
      success: true,
      count: result.length,
      activities: result
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

    const newActivity = {
      id: `ACT-${Date.now()}`,
      title: title || "System Activity",
      detail: detail || text.trim(),
      text: text.trim(),
      actor: actor || req.user?.name || "System",
      time: "Just now",
      tone: tone || "blue",
      timestamp: new Date().toISOString()
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await Activity.create(newActivity);
      } catch (err) {
        console.warn("MongoDB create activity error:", err.message);
      }
    }

    activitiesData.unshift(newActivity);
    res.status(201).json({ success: true, activity: newActivity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
