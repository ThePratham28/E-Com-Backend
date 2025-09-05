import { Schema, model } from "mongoose";

const SessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    deviceId: { type: String, index: true, required: true },
    jti: { type: String, index: true, required: true },
    hashedToken: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, index: true, required: true },
    revokedAt: { type: Date },
    reuseDetectedAt: { type: Date },
  },
  { timestamps: true }
);

SessionSchema.index({ user: 1, deviceId: 1 });
SessionSchema.index({ jti: 1 }, { unique: true });

export default model("Session", SessionSchema);
