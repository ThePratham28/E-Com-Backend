import { Schema, model } from "mongoose";

const CartItemSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: true },
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

CartItemSchema.index({ user: 1, product: 1 }, { unique: true });

const CartItem = model("CartItem", CartItemSchema);
export default CartItem;
