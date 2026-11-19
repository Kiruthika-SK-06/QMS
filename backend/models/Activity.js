import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String },
    detail: { type: String },
    text: { type: String, required: true },
    actor: { type: String, default: "System" },
    time: { type: String },
    tone: { type: String, default: "blue" },
    timestamp: { type: String, default: () => new Date().toISOString() }
  },
  { timestamps: true }
);

export const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);
export default Activity;
