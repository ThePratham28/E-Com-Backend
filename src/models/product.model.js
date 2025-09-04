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

const Product = model("Product", ProductSchema);
export default Product;
