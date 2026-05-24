import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    return {
      success: true,
      message: "RR Shoper DB Connected",
      connection: conn,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
};

export default connectDB;