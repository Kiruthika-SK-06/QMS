import mongoose from "mongoose";

const mrmSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    version: { type: String, default: "1.0" },
    versionHistory: [{ type: mongoose.Schema.Types.Mixed }],
    status: { type: String, default: "Scheduled" },
    stage: { type: Number, default: 1 },
    process: { type: String },
    targetMonth: { type: String },
    scheduledDate: { type: String, required: true },
    scheduledTime: { type: String, required: true },
    venue: { type: String, default: "Executive Boardroom & Virtual Conference" },
    plannedBy: { type: String, default: "QMS Coordinator" },
    plannedByRole: { type: String, default: "QMS Coordinator" },
    department: { type: String, default: "Quality Assurance & Compliance" },
    chairperson: { type: String, default: "Trust Head" },
    coordinator: { type: String, default: "QMS Coordinator" },
    approvalStatus: { type: String, default: "Pending" },
    agenda: [{ type: String }],
    attendees: [{ type: mongoose.Schema.Types.Mixed }],
    approvals: { type: mongoose.Schema.Types.Mixed },
    emailNotification: { type: mongoose.Schema.Types.Mixed },
    mom: { type: mongoose.Schema.Types.Mixed, default: null },
    momFile: { type: mongoose.Schema.Types.Mixed, default: null },
    momFileUrl: { type: String, default: "" },
    momFileName: { type: String, default: "" },
    momFileSize: { type: String, default: "" },
    timeline: [{ type: mongoose.Schema.Types.Mixed }]
  },
  { timestamps: true }
);

export const MRM = mongoose.models.MRM || mongoose.model("MRM", mrmSchema);
export default MRM;
