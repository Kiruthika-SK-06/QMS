import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Task } from "../models/Task.js";
import { Process } from "../models/Process.js";
import { MRM } from "../models/MRM.js";
import { Audit } from "../models/Audit.js";
import { ExternalAudit } from "../models/ExternalAudit.js";
import { Notification } from "../models/Notification.js";
import { Employee } from "../models/Employee.js";

import { dummyUsers } from "../data/users.js";
import { documentsData } from "../data/documents.js";
import { tasksData } from "../data/tasks.js";
import { processesData } from "../data/processes.js";
import { mrmData } from "../data/mrm.js";
import { auditData } from "../data/audits.js";
import { externalAuditData } from "../data/externalAudit.js";
import { notificationsData } from "../data/notifications.js";
import { employeesData } from "../data/employees.js";

export const seedDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }

  try {
    // 1. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0 && Array.isArray(dummyUsers)) {
      await User.insertMany(dummyUsers);
      console.log(`✅ Seeded ${dummyUsers.length} controlled users into MongoDB`);
    }

    // 2. Seed Documents
    const docCount = await Document.countDocuments();
    if (docCount === 0 && Array.isArray(documentsData)) {
      await Document.insertMany(documentsData);
      console.log(`✅ Seeded ${documentsData.length} documents into MongoDB`);
    }

    // 3. Seed Tasks
    const taskCount = await Task.countDocuments();
    if (taskCount === 0 && Array.isArray(tasksData)) {
      await Task.insertMany(tasksData);
      console.log(`✅ Seeded ${tasksData.length} tasks into MongoDB`);
    }

    // 4. Seed Processes
    const procCount = await Process.countDocuments();
    if (procCount === 0 && Array.isArray(processesData)) {
      await Process.insertMany(processesData);
      console.log(`✅ Seeded ${processesData.length} processes into MongoDB`);
    }

    // 5. Seed MRMs
    const mrmCount = await MRM.countDocuments();
    if (mrmCount === 0 && Array.isArray(mrmData)) {
      await MRM.insertMany(mrmData);
      console.log(`✅ Seeded ${mrmData.length} MRM records into MongoDB`);
    }

    // 6. Seed Internal Audits
    const auditCount = await Audit.countDocuments();
    if (auditCount === 0 && Array.isArray(auditData)) {
      await Audit.insertMany(auditData);
      console.log(`✅ Seeded ${auditData.length} internal audit records into MongoDB`);
    }

    // 7. Seed External Audits
    const extCount = await ExternalAudit.countDocuments();
    if (extCount === 0 && Array.isArray(externalAuditData)) {
      await ExternalAudit.insertMany(externalAuditData);
      console.log(`✅ Seeded ${externalAuditData.length} external audit records into MongoDB`);
    }

    // 8. Seed Notifications
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0 && Array.isArray(notificationsData)) {
      await Notification.insertMany(notificationsData);
      console.log(`✅ Seeded ${notificationsData.length} notifications into MongoDB`);
    }

    // 9. Seed Employees
    const empCount = await Employee.countDocuments();
    if (empCount === 0 && Array.isArray(employeesData)) {
      await Employee.insertMany(employeesData);
      console.log(`✅ Seeded ${employeesData.length} employees into MongoDB`);
    }

    return true;
  } catch (error) {
    console.error("Database seeding notice:", error.message);
    return false;
  }
};
