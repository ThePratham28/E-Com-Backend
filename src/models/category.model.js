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

const Category = model("Category", CategorySchema);
export default Category;
