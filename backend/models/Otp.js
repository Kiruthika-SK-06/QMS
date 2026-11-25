import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Automatic MongoDB TTL deletion when current time passes expiresAt
    }
  },
  {
    timestamps: true
  }
);

export const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
