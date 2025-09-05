import { model, Schema } from "mongoose";
import argon2 from "argon2";

const roles = Object.freeze({
  ADMIN: "admin",
  USER: "user",
});

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      minLength: [3, "Username must be at least 3 characters long"],
      maxLength: [50, "Username must be at most 50 characters long"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(roles),
      default: roles.USER,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password; // never send password
        return ret;
      },
    },
  }
);

UserSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Cascade-like cleanup: remove CartItems and Reviews created by this user on delete
UserSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  const CartItem = model("CartItem");
  const Review = model("Review");
  await Promise.all([
    CartItem.deleteMany({ user: doc._id }),
    Review.deleteMany({ user: doc._id }),
  ]);
});

UserSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function () {
    const CartItem = model("CartItem");
    const Review = model("Review");
    await Promise.all([
      CartItem.deleteMany({ user: this._id }),
      Review.deleteMany({ user: this._id }),
    ]);
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 5,
      parallelism: 1,
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    return await argon2.verify(this.password, enteredPassword);
  } catch (error) {
    return false;
  }
};

const User = model("User", UserSchema);

export default User;
