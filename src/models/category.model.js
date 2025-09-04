import { Schema, model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
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

// Prevent duplicate names within the same parent category
CategorySchema.index(
  { name: 1, parentCategory: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Cascade-like behavior on delete: if parentCategory exists, reassign products to the parent; otherwise block deletion when products exist
CategorySchema.pre("findOneAndDelete", async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  if (!doc) return next();
  const Product = model("Product");
  if (doc.parentCategory) {
    await Product.updateMany(
      { category: doc._id },
      { $set: { category: doc.parentCategory } }
    );
    return next();
  }
  const count = await Product.countDocuments({ category: doc._id });
  if (count > 0)
    return next(
      new Error(
        "Cannot delete a root category that still has products. Move or reassign products first."
      )
    );
  next();
});

CategorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const Product = model("Product");
    if (this.parentCategory) {
      await Product.updateMany(
        { category: this._id },
        { $set: { category: this.parentCategory } }
      );
      return next();
    }
    const count = await Product.countDocuments({ category: this._id });
    if (count > 0)
      return next(
        new Error(
          "Cannot delete a root category that still has products. Move or reassign products first."
        )
      );
    next();
  }
);

const Category = model("Category", CategorySchema);
export default Category;
