import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, default: "Internal Quality Audit" },
    process: { type: String },
    processId: { type: String },
    stage: { type: Number, default: 1 },
    stageLabel: { type: String },
    status: { type: String, default: "Audit Planned & Scheduled" },
    auditDates: {
      startDate: { type: String },
      endDate: { type: String }
    },
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    venue: { type: String },
    scope: { type: String },
    leadAuditor: { type: mongoose.Schema.Types.Mixed },
    internalAuditor: { type: mongoose.Schema.Types.Mixed },
    internalAuditee: { type: mongoose.Schema.Types.Mixed },
    scheduledBy: { type: mongoose.Schema.Types.Mixed },
    scheduleShared: { type: mongoose.Schema.Types.Mixed },
    trustHeadConfirmation: { type: mongoose.Schema.Types.Mixed },
    noticingSheet: { type: mongoose.Schema.Types.Mixed },
    auditeeReply: { type: mongoose.Schema.Types.Mixed },
    verification: { type: mongoose.Schema.Types.Mixed },
    departments: [{ type: String }],
    checklist: [{ type: mongoose.Schema.Types.Mixed }],
    findings: [{ type: mongoose.Schema.Types.Mixed }],
    correctiveActions: [{ type: mongoose.Schema.Types.Mixed }],
    closedAt: { type: String },
    closedBy: { type: String },
    timeline: [{ type: mongoose.Schema.Types.Mixed }]
  },
  { timestamps: true }
);

export const Audit = mongoose.models.Audit || mongoose.model("Audit", auditSchema);
export default Audit;
