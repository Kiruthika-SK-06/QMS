import mongoose from "mongoose";

const authAuditSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "LOGOUT",
        "ACCOUNT_INVITED",
        "OTP_SENT",
        "OTP_VERIFIED",
        "ACCOUNT_ACTIVATED",
        "PASSWORD_RESET_REQUEST",
        "PASSWORD_RESET_SUCCESS",
        "PASSWORD_CHANGED",
        "STATUS_TOGGLED",
        "BOOTSTRAP_ADMIN_CREATED"
      ],
      index: true
    },
    actor: { type: String, default: "System" },
    targetEmail: { type: String, index: true },
    targetRole: { type: String },
    ipAddress: { type: String, default: "127.0.0.1" },
    userAgent: { type: String, default: "Unknown" },
    details: { type: String },
    status: { type: String, default: "SUCCESS", enum: ["SUCCESS", "FAILURE", "BLOCKED"] },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const AuthAudit = mongoose.models.AuthAudit || mongoose.model("AuthAudit", authAuditSchema);
export default AuthAudit;
