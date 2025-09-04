import { Schema, model } from "mongoose";

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const AddressSchema = new Schema(
  {
    fullName: { type: String, trim: true, maxlength: 120 },
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 120 },
    state: { type: String, trim: true, maxlength: 120 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30 },
  },
  { _id: false }
);

const OrderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      validate: [(v) => v.length > 0, "At least one order item is required"],
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: { type: AddressSchema, required: false },
    billingAddress: { type: AddressSchema, required: false },
    // Optional backlink to Payment (not required since Payment has unique order ref)
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: false,
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

// Calculate totals and item totals before validation
OrderSchema.pre("validate", function (next) {
  if (!this.items || this.items.length === 0)
    return next(new Error("Order must have at least one item"));
  this.items = this.items.map((it) => ({
    ...(it.toObject?.() ?? it),
    totalPrice: Number(it.quantity) * Number(it.unitPrice),
  }));
  this.totalAmount = this.items.reduce(
    (sum, it) => sum + Number(it.totalPrice),
    0
  );
  next();
});

OrderSchema.index({ user: 1, createdAt: -1 });

const Order = model("Order", OrderSchema);
export default Order;
