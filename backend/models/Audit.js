import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, default: "Internal Quality Audit" },
    stage: { type: Number, default: 1 },
    status: { type: String, default: "Audit Planned & Scheduled" },
    leadAuditor: { type: mongoose.Schema.Types.Mixed },
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    venue: { type: String },
    scope: { type: String },
    departments: [{ type: String }],
    checklist: [{ type: mongoose.Schema.Types.Mixed }],
    findings: [{ type: mongoose.Schema.Types.Mixed }],
    correctiveActions: [{ type: mongoose.Schema.Types.Mixed }],
    timeline: [{ type: mongoose.Schema.Types.Mixed }]
  },
  { timestamps: true }
);

export const Audit = mongoose.models.Audit || mongoose.model("Audit", auditSchema);
export default Audit;
