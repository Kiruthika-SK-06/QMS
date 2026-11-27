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
    purpose: {
      type: String,
      required: true,
      enum: ["ACCOUNT_ACTIVATION", "PASSWORD_RESET"],
      index: true
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
    lastResentAt: {
      type: Date,
      default: Date.now
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

// Compound index to quickly find an active OTP for an email and purpose
otpSchema.index({ email: 1, purpose: 1 });

export const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
