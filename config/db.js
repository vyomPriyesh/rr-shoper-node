import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsCAFile: path.join(process.cwd(), "global-bundle.pem"),
      tlsAllowInvalidHostnames: true,
    });

    return {
      success: true,
      message: "DocumentDB Connected",
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