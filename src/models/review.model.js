import { Schema, model } from "mongoose";

const ReviewSchema = new Schema(
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
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 5000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review = model("Review", ReviewSchema);
export default Review;
