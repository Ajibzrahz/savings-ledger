import mongoose from "mongoose";
import env from "./env";

const MONGO_URI = env.mongoUri;

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log(`Database Connected`);
  } catch (error) {
    console.error("❌ MongoDB connection failed");

    console.error(error);

    process.exit(1);
  }
};

export default connectDB;
