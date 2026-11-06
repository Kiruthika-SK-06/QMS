import mongoose from "mongoose";

const processSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    owner: { type: String, required: true },
    department: { type: String, required: true },
    documentsCount: { type: Number, default: 0 },
    complianceScore: { type: Number, default: 100 },
    status: { type: String, enum: ["Active", "Under Review", "Archived"], default: "Active" },
    lastAuditDate: { type: String }
  },
  { timestamps: true }
);

export const Process = mongoose.models.Process || mongoose.model("Process", processSchema);
export default Process;
