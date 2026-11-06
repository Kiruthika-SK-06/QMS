import mongoose from "mongoose";

const mrmSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    scheduledDate: { type: String, required: true },
    scheduledTime: { type: String, required: true },
    venue: { type: String, default: "Executive Boardroom & Virtual Conference" },
    status: { type: String, default: "Scheduled" },
    approvalStatus: { type: String, default: "Pending" },
    chairperson: { type: String, default: "Trust Head" },
    coordinator: { type: String, default: "Rahul Kumar (QMS Coordinator)" },
    agenda: [{ type: String }],
    attendees: [{ type: mongoose.Schema.Types.Mixed }],
    mom: { type: mongoose.Schema.Types.Mixed, default: null },
    timeline: [{ type: mongoose.Schema.Types.Mixed }]
  },
  { timestamps: true }
);

export const MRM = mongoose.models.MRM || mongoose.model("MRM", mrmSchema);
export default MRM;

