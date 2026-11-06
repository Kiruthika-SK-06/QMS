import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    role: { type: String, default: "all" },
    read: { type: Boolean, default: false },
    timestamp: { type: String, default: () => new Date().toISOString() },
    type: { type: String, default: "info" }
  },
  { timestamps: true }
);

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;

