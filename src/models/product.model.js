import { Schema, model } from "mongoose";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 }, // decimal in ERD
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 64,
      unique: true,
    },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
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

ProductSchema.index(
  { name: "text", description: "text" },
  { name: "ProductTextIndex" }
);
ProductSchema.index({ category: 1, isActive: 1 });

// Cascade-like cleanup: remove CartItems and Reviews referencing this product
ProductSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  const CartItem = model("CartItem");
  const Review = model("Review");
  await Promise.all([
    CartItem.deleteMany({ product: doc._id }),
    Review.deleteMany({ product: doc._id }),
  ]);
});

ProductSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function () {
    const CartItem = model("CartItem");
    const Review = model("Review");
    await Promise.all([
      CartItem.deleteMany({ product: this._id }),
      Review.deleteMany({ product: this._id }),
    ]);
  }
);

const Product = model("Product", ProductSchema);
export default Product;
