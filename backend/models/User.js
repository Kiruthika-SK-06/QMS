import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ["owner", "qm", "Head", "auditor"] },
    roleTitle: { type: String, required: true },
    initials: { type: String },
    department: { type: String, default: "Quality Management" },
    process: { type: String, default: "All Processes" },
    designation: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    joinDate: { type: String },
    aliases: [{ type: String }],
    privileges: [{ type: String }]
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

