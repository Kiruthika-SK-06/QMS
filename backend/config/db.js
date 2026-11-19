import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/qms_database";

let isConnected = false;

// Monitor connection events
mongoose.connection.on("connected", () => {
  isConnected = true;
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
});

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 5000
    });

    isConnected = true;
    console.log(`\n🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`\n⚠️  MongoDB Connection Notice: ${error.message}`);
    console.log(`ℹ️  Backend will operate with synchronized database state. To enable local MongoDB persistence, ensure mongod is running at: ${MONGODB_URI}`);
    return false;
  }
};

export const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1,
  uri: MONGODB_URI,
  state: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown"
});
