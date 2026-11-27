/**
 * Secure One-Time Bootstrap Script for C-DAC QMS Digitalization
 * Creates the initial QMS Coordinator account in MongoDB.
 *
 * Rules:
 * - No hardcoded administrator credentials.
 * - Fails if an active QMS Coordinator already exists in MongoDB.
 * - Hashes password using bcrypt before saving.
 *
 * Usage:
 *   node backend/scripts/bootstrapAdmin.js --name="Dr. Jane Smith" --email="qms@cdac.in" --employeeId="CDAC-QMS-01" --password="SecurePassword123!"
 * Or pass via environment variables:
 *   BOOTSTRAP_NAME, BOOTSTRAP_EMAIL, BOOTSTRAP_EMPLOYEE_ID, BOOTSTRAP_PASSWORD
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/User.js";
import { AuthAudit } from "../models/AuthAudit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/qms_database";

// Parse CLI flags
const parseArgs = () => {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, ...vals] = arg.slice(2).split("=");
      args[key] = vals.join("=");
    }
  });
  return args;
};

async function runBootstrap() {
  console.log("\n========================================================");
  console.log("🛡️  C-DAC QMS - Initial QMS Coordinator Bootstrap Utility");
  console.log("========================================================\n");

  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI} ...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("🍃 MongoDB Connected successfully.\n");

    // 1. Verify if ANY QMS Coordinator or Administrator already exists in database
    const existingCoordinator = await User.findOne({
      role: { $in: ["qm", "coordinator", "admin"] }
    });

    if (existingCoordinator) {
      console.error("❌ BOOTSTRAP DISABLED: An active QMS Coordinator account already exists in MongoDB:");
      console.error(`   Name:        ${existingCoordinator.name}`);
      console.error(`   Email:       ${existingCoordinator.email}`);
      console.error(`   Employee ID: ${existingCoordinator.employeeId}`);
      console.error(`   Role:        ${existingCoordinator.roleTitle || existingCoordinator.role}`);
      console.error("\nTo manage accounts, please sign in as the existing QMS Coordinator or use the User Management module.\n");
      await mongoose.disconnect();
      process.exit(1);
    }

    // 2. Gather credentials from CLI arguments or environment variables
    const args = parseArgs();
    const name = (args.name || process.env.BOOTSTRAP_NAME || "").trim();
    const email = (args.email || process.env.BOOTSTRAP_EMAIL || "").trim().toLowerCase();
    const employeeId = (args.employeeId || process.env.BOOTSTRAP_EMPLOYEE_ID || "").trim().toUpperCase();
    const password = (args.password || process.env.BOOTSTRAP_PASSWORD || "").trim();

    if (!name || !email || !employeeId || !password) {
      console.error("❌ Error: Missing required bootstrap parameters.");
      console.error("\nPlease provide all of the following parameters:");
      console.error("  --name=\"Full Legal Name\"");
      console.error("  --email=\"official.email@cdac.in\"");
      console.error("  --employeeId=\"CDAC-EMP-ID\"");
      console.error("  --password=\"SecurePassword123!\"");
      console.error("\nOr configure BOOTSTRAP_NAME, BOOTSTRAP_EMAIL, BOOTSTRAP_EMPLOYEE_ID, BOOTSTRAP_PASSWORD in your .env file.\n");
      await mongoose.disconnect();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error("❌ Error: Password must be at least 6 characters long.");
      await mongoose.disconnect();
      process.exit(1);
    }

    if (!email.includes("@")) {
      console.error("❌ Error: Invalid email format.");
      await mongoose.disconnect();
      process.exit(1);
    }

    // 3. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = email.split("@")[0].toLowerCase();
    const userId = `USR-BOOTSTRAP-${Date.now().toString().slice(-4)}`;

    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // 4. Create the first QMS Coordinator record in MongoDB
    const newAdmin = await User.create({
      id: userId,
      username,
      email,
      employeeId,
      name,
      password: hashedPassword,
      role: "qm",
      roleTitle: "QMS Coordinator",
      initials,
      department: "Quality Assurance & Compliance",
      process: "Quality Management & MRM",
      designation: "QMS Coordinator",
      status: "Active",
      emailVerified: true,
      invitedBy: "Bootstrap Procedure",
      activatedAt: new Date(),
      privileges: [
        "Manage Documents",
        "Review Documents",
        "Plan & Schedule MRM",
        "Share MRM with Coordinators",
        "User Management",
        "Assign & Supervise Tasks",
        "View Audit Logs & Reports"
      ],
      joinDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    });

    // 5. Record authentication audit event
    await AuthAudit.create({
      id: `AUDIT-BOOTSTRAP-${Date.now()}`,
      action: "BOOTSTRAP_ADMIN_CREATED",
      actor: name,
      targetEmail: email,
      targetRole: "qm",
      details: `First QMS Coordinator initialized via bootstrap script (Emp ID: ${employeeId})`,
      status: "SUCCESS"
    });

    console.log("========================================================");
    console.log("✅ SUCCESS: First QMS Coordinator account created in MongoDB!");
    console.log("========================================================");
    console.log(`   User ID:     ${newAdmin.id}`);
    console.log(`   Name:        ${newAdmin.name}`);
    console.log(`   Email:       ${newAdmin.email}`);
    console.log(`   Username:    ${newAdmin.username}`);
    console.log(`   Employee ID: ${newAdmin.employeeId}`);
    console.log(`   Role:        ${newAdmin.roleTitle} (${newAdmin.role})`);
    console.log(`   Status:      ${newAdmin.status}`);
    console.log("\nYou may now log in to the QMS portal at http://localhost:5173/login");
    console.log("Future bootstrap operations are now automatically disabled.\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Bootstrap failed with exception:", error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runBootstrap();
