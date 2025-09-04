import mongoose, { connect } from "mongoose";
import config, { isDev } from "./config.js";

export default async function connectToDB() {
  try {
    mongoose.set("strictQuery", true);
    if (isDev) mongoose.set("debug", true);

    await connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // family: 4, // uncomment if DNS resolution issues
    });
    console.log("Mongoose connected");
  } catch (error) {
    console.error("Mongoose connection error", error);
    throw error;
  }
}

export async function closeDB() {
  await mongoose.connection.close(false);
}
