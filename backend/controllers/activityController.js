import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";

// GET /api/activities
export const getAllActivities = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: 0, activities: [] });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const activities = await Activity.find({}).sort({ createdAt: -1, timestamp: -1 }).limit(limit).lean();

    res.json({
      success: true,
      count: activities.length,
      activities
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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const newActivity = await Activity.create({
      id: `ACT-${Date.now()}`,
      title: title || "System Activity",
      text: text.trim(),
      detail: detail || "",
      actor: actor || req.user?.name || "System",
      time: "Just now",
      tone: tone || "blue",
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ success: true, activity: newActivity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllActivities,
  addActivity
};
