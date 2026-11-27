import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

// Import seed datasets
import { dummyUsers } from "../data/users.js";
import { documentsData } from "../data/documents.js";
import { tasksData } from "../data/tasks.js";
import { processesData } from "../data/processes.js";
import { mrmData } from "../data/mrm.js";
import { auditData } from "../data/audits.js";
import { externalAuditData } from "../data/externalAudit.js";
import { activitiesData } from "../data/activities.js";
import { notificationsData } from "../data/notifications.js";
import { employeesData } from "../data/employees.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, "..", "database");

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch {
  // Ignore in read-only lambda environments
}

const COLLECTIONS = {
  users: { file: "users.json", defaultData: dummyUsers },
  documents: { file: "documents.json", defaultData: documentsData },
  tasks: { file: "tasks.json", defaultData: tasksData },
  processes: { file: "processes.json", defaultData: processesData },
  mrm: { file: "mrm.json", defaultData: mrmData },
  audits: { file: "audits.json", defaultData: auditData },
  externalAudits: { file: "externalAudits.json", defaultData: externalAuditData },
  activities: { file: "activities.json", defaultData: activitiesData },
  notifications: { file: "notifications.json", defaultData: notificationsData },
  employees: { file: "employees.json", defaultData: employeesData }
};

// Initialize persistent storage files on disk and load into memory
export const initPersistentStore = () => {
  try {
    for (const [key, config] of Object.entries(COLLECTIONS)) {
      const filePath = path.join(DB_DIR, config.file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(config.defaultData, null, 2), "utf-8");
      } else {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            config.defaultData.length = 0;
            config.defaultData.push(...parsed);
          }
        } catch (e) {
          console.warn(`Failed reading persistent store ${config.file}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error("Storage engine initialization error:", err.message);
  }
};

// Save a collection to disk
export const saveCollectionToDisk = (collectionName) => {
  try {
    const config = COLLECTIONS[collectionName];
    if (config) {
      const filePath = path.join(DB_DIR, config.file);
      fs.writeFileSync(filePath, JSON.stringify(config.defaultData, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn(`Error persisting collection ${collectionName} to disk:`, err.message);
  }
};

// Save / insert item in both MongoDB (if connected) and persistent store
export const saveItem = async (collectionName, item, MongooseModel = null) => {
  const config = COLLECTIONS[collectionName];
  if (!config || !item) return item;

  // 1. Insert into in-memory array & persist to disk
  const existingIdx = config.defaultData.findIndex((i) => i.id === item.id || (item._id && i._id === item._id));
  if (existingIdx >= 0) {
    config.defaultData[existingIdx] = { ...config.defaultData[existingIdx], ...item };
  } else {
    config.defaultData.unshift(item);
  }
  saveCollectionToDisk(collectionName);

  // 2. Persist to MongoDB if connected
  if (mongoose.connection.readyState === 1 && MongooseModel) {
    try {
      const query = item.id ? { id: item.id } : item._id ? { _id: item._id } : null;
      if (query) {
        await MongooseModel.findOneAndUpdate(query, item, { upsert: true, new: true });
      } else {
        await MongooseModel.create(item);
      }
    } catch (err) {
      console.warn(`MongoDB write warning for ${collectionName}:`, err.message);
    }
  }

  return item;
};

// Update item in both MongoDB and persistent store
export const updateItem = async (collectionName, idKey, idVal, updates, MongooseModel = null) => {
  const config = COLLECTIONS[collectionName];
  if (!config) return null;

  // 1. Update in-memory and persist to disk
  const item = config.defaultData.find((i) => String(i[idKey]) === String(idVal));
  if (item) {
    Object.assign(item, updates);
    saveCollectionToDisk(collectionName);
  }

  // 2. Update in MongoDB if connected
  if (mongoose.connection.readyState === 1 && MongooseModel) {
    try {
      await MongooseModel.findOneAndUpdate({ [idKey]: idVal }, { $set: updates });
    } catch (err) {
      console.warn(`MongoDB update warning for ${collectionName}:`, err.message);
    }
  }

  return item;
};

// Delete item in both MongoDB and persistent store
export const deleteItem = async (collectionName, idKey, idVal, MongooseModel = null) => {
  const config = COLLECTIONS[collectionName];
  if (!config) return false;

  const idx = config.defaultData.findIndex((i) => String(i[idKey]) === String(idVal));
  let deleted = null;
  if (idx >= 0) {
    deleted = config.defaultData.splice(idx, 1)[0];
    saveCollectionToDisk(collectionName);
  }

  if (mongoose.connection.readyState === 1 && MongooseModel) {
    try {
      await MongooseModel.findOneAndDelete({ [idKey]: idVal });
    } catch (err) {
      console.warn(`MongoDB delete warning for ${collectionName}:`, err.message);
    }
  }

  return deleted;
};

// Centralized activity and audit trail recorder
export const recordActivity = async (entry) => {
  const activityData = {
    id: entry.id || `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: entry.title || "User Action",
    text: entry.text || entry.action || "System Function Performed",
    detail: entry.detail || entry.details || "",
    actor: entry.actor || "User",
    role: entry.role || "user",
    tone: entry.tone || "blue",
    time: "Just now",
    timestamp: entry.timestamp || new Date().toISOString()
  };

  activitiesData.unshift(activityData);
  saveCollectionToDisk("activities");

  if (mongoose.connection.readyState === 1) {
    try {
      const ActivityModel = mongoose.models.Activity;
      if (ActivityModel) {
        await ActivityModel.create(activityData);
      }
    } catch (err) {
      console.warn("Failed recording activity to MongoDB:", err.message);
    }
  }

  broadcastRealtimeEvent("ACTIVITY_LOGGED", activityData);
  return activityData;
};

// Synchronize all collections to MongoDB when connection establishes
export const syncAllToMongoDB = async (models) => {
  if (mongoose.connection.readyState !== 1) return;

  try {
    for (const [key, config] of Object.entries(COLLECTIONS)) {
      const Model = models[key];
      if (Model && Array.isArray(config.defaultData)) {
        for (const item of config.defaultData) {
          if (item && (item.id || item.username || item.email)) {
            const filter = item.id ? { id: item.id } : item.username ? { username: item.username } : { email: item.email };
            await Model.findOneAndUpdate(filter, item, { upsert: true }).catch(() => {});
          }
        }
      }
    }
    console.log("✅ All persistent store records synchronized to MongoDB collections.");
  } catch (err) {
    console.warn("Error syncing persistent store to MongoDB:", err.message);
  }
};

// Initialize on load
initPersistentStore();
