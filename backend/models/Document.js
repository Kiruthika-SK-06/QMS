import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    version: { type: String, required: true },
    date: { type: String },
    author: { type: String },
    uploadedBy: { type: String },
    status: { type: String, default: "Current" },
    notes: { type: String },
    changeLog: { type: String },
    fileUrl: { type: String },
    fileSize: { type: String }
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String },
    code: { type: String },
    type: { type: String, required: true, default: "Procedures" },
    process: { type: String, required: true },
    owner: { type: String, required: true, default: "Course Coordinator" },
    version: { type: String, default: "1.0" },
    currentVersion: { type: String },
    updated: { type: String },
    updatedBy: { type: String },
    status: { type: String, default: "Under Review" },
    submittedBy: { type: String },
    reviewComments: { type: String },
    description: { type: String },
    content: { type: String },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    originalName: { type: String, default: "" },
    fileSize: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    storagePath: { type: String, default: "" },
    versions: [versionSchema],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Pre-save synchronization hook
documentSchema.pre("save", function (next) {
  if (!this.title && this.name) this.title = this.name;
  if (!this.name && this.title) this.name = this.title;
  if (!this.currentVersion && this.version) this.currentVersion = this.version;
  if (!this.version && this.currentVersion) this.version = this.currentVersion;
  next();
});

export const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);
export default Document;
