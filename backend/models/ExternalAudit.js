import mongoose from "mongoose";

const externalAuditSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, default: "ISO 9001:2015 External Surveillance Audit" },
    stage: { type: Number, default: 1 },
    status: { type: String, default: "Step 1: Schedule Received via Email" },
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    venue: { type: String },
    scope: { type: String },
    externalAgency: { type: String, default: "TÜV SÜD South Asia Certification Body" },
    leadAuditor: { type: mongoose.Schema.Types.Mixed },
    scheduleShared: { type: mongoose.Schema.Types.Mixed, default: null },
    ncPackage: { type: mongoose.Schema.Types.Mixed, default: null },
    coordinatorResolution: { type: mongoose.Schema.Types.Mixed, default: null },
    externalAuditorApproval: { type: mongoose.Schema.Types.Mixed, default: null },
    qmsClosure: { type: mongoose.Schema.Types.Mixed, default: null },
    timeline: [{ type: mongoose.Schema.Types.Mixed }]
  },
  { timestamps: true }
);

export const ExternalAudit = mongoose.models.ExternalAudit || mongoose.model("ExternalAudit", externalAuditSchema);
export default ExternalAudit;

