import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
    title: { type: String, required: true },
    text: { type: String },
    message: { type: String },
    time: { type: String },
    targetRole: { type: String, default: "all" },
    role: { type: String, default: "all" },
    read: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    timestamp: { type: String, default: () => new Date().toISOString() },
    type: { type: String, default: "info" }
  },
  { timestamps: true }
);

notificationSchema.pre("save", function (next) {
  if (!this.text && this.message) this.text = this.message;
  if (!this.message && this.text) this.message = this.text;
  if (!this.targetRole && this.role) this.targetRole = this.role;
  if (!this.role && this.targetRole) this.role = this.targetRole;
  next();
});

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;
