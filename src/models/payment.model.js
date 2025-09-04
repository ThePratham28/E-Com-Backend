import { Schema, model } from "mongoose";

const PAYMENT_METHODS = ["card", "cod", "wallet", "upi", "bank_transfer"];
const PAYMENT_STATUS = ["pending", "succeeded", "failed", "refunded"];

const PaymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    }, // one payment per order
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    status: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending",
      index: true,
    },
    transactionId: { type: String, trim: true, unique: true, sparse: true },
    paidAt: { type: Date },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_d, r) => {
        r.id = r._id.toString();
        delete r._id;
        return r;
      },
    },
  }
);

PaymentSchema.index({ status: 1, createdAt: -1 });

const Payment = model("Payment", PaymentSchema);
export default Payment;
