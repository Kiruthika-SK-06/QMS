import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    password: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["owner", "qm", "Head", "auditor", "coordinator", "head", "admin"],
      index: true
    },
    roleTitle: { type: String, required: true },
    initials: { type: String },
    department: { type: String, default: "Quality Management" },
    process: { type: String, default: "All Processes" },
    designation: { type: String },
    status: {
      type: String,
      default: "Pending Verification",
      enum: ["Pending Verification", "Active", "Inactive", "Suspended"],
      index: true
    },
    emailVerified: { type: Boolean, default: false },
    invitedBy: { type: String, default: "System" },
    invitedAt: { type: Date, default: Date.now },
    activatedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    joinDate: { type: String },
    aliases: [{ type: String }],
    privileges: [{ type: String }]
  },
  { timestamps: true }
);

// Helpful virtual for checking if account is currently locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
