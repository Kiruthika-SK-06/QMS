import mongoose from "mongoose";

const processSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String },
    owner: { type: String, required: true },
    department: { type: String },
    employees: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    documents: { type: Number, default: 0 },
    documentsCount: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    progress: { type: Number, default: 0 },
    complianceScore: { type: Number, default: 100 },
    target: { type: String },
    description: { type: String },
    lastAuditDate: { type: String }
  },
  { timestamps: true }
);

export const Process = mongoose.models.Process || mongoose.model("Process", processSchema);
export default Process;
