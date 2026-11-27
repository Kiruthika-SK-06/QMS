import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/qms_database";

let isConnected = false;
let activeUri = MONGODB_URI;
let memoryServerInstance = null;

// Monitor connection events
mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log(`\n🍃 MongoDB Connection Established: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("⚠️  MongoDB Disconnected");
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
  console.error("❌ MongoDB Connection Error:", err.message);
});

export const connectDB = async (customUri = null) => {
  const uri = customUri || MONGODB_URI;

  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  // 1. First attempt: connect to standalone host or cloud MongoDB
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: process.env.VERCEL ? 5000 : 2500,
      connectTimeoutMS: 5000
    });

    isConnected = true;
    activeUri = uri;
    console.log(`\n🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not connect to MongoDB at ${uri} (${error.message}).`);

    // In Vercel serverless environment, embedded memory server cannot run
    if (process.env.VERCEL) {
      console.warn("⚠️  Running on Vercel: Please configure MONGODB_URI in Vercel Project Settings > Environment Variables (e.g. MongoDB Atlas connection string).");
      isConnected = false;
      return false;
    }

    // 2. Fallback: Automatically start an embedded MongoDB server instance (Local dev only)
    try {
      console.log("🍃 Starting embedded MongoDB instance for seamless local operation...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      if (!memoryServerInstance) {
        memoryServerInstance = await MongoMemoryServer.create();
      }
      activeUri = memoryServerInstance.getUri();
      const conn = await mongoose.connect(activeUri);
      isConnected = true;
      console.log(`\n🍃 Embedded MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      console.log(`🍃 Database instance running at: ${activeUri}`);
      return true;
    } catch (memErr) {
      isConnected = false;
      console.error(`❌ Failed to start embedded MongoDB instance: ${memErr.message}`);
      return false;
    }
  }
};

export const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1,
  uri: activeUri,
  state: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown",
  isEmbedded: !!memoryServerInstance
});

export default { connectDB, getDBStatus };
