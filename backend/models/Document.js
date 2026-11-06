import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    version: { type: String, required: true },
    date: { type: String },
    uploadedBy: { type: String },
    fileUrl: { type: String },
    changeLog: { type: String },
    fileSize: { type: String }
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    code: { type: String, required: true },
    process: { type: String, required: true },
    type: { type: String, default: "SOP" },
    status: { type: String, default: "Draft" },
    owner: { type: String, required: true },
    currentVersion: { type: String, default: "1.0" },
    reviewCycle: { type: String, default: "Annual" },
    nextReview: { type: String },
    effectiveDate: { type: String },
    approvedBy: { type: String },
    versions: [versionSchema],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);
export default Document;

