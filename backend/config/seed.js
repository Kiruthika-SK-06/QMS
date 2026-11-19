import mongoose from "mongoose";
import {
  User,
  Document,
  Task,
  Process,
  MRM,
  Audit,
  ExternalAudit,
  Notification,
  Employee,
  Activity
} from "../models/index.js";

import { dummyUsers } from "../data/users.js";
import { documentsData } from "../data/documents.js";
import { tasksData } from "../data/tasks.js";
import { processesData } from "../data/processes.js";
import { mrmData } from "../data/mrm.js";
import { auditData } from "../data/audits.js";
import { externalAuditData } from "../data/externalAudit.js";
import { notificationsData } from "../data/notifications.js";
import { employeesData } from "../data/employees.js";
import { activitiesData } from "../data/activities.js";

export const seedDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }

  try {
    // 1. Seed or Sync Users
    const userCount = await User.countDocuments();
    if (userCount === 0 && Array.isArray(dummyUsers)) {
      await User.insertMany(dummyUsers);
      console.log(`✅ Seeded ${dummyUsers.length} controlled users into MongoDB`);
    } else {
      const dbUsers = await User.find({}).lean();
      if (dbUsers.length > 0) {
        dummyUsers.length = 0;
        dummyUsers.push(...dbUsers);
      }
    }

    // 2. Seed or Sync Documents
    const docCount = await Document.countDocuments();
    if (docCount === 0 && Array.isArray(documentsData)) {
      await Document.insertMany(documentsData);
      console.log(`✅ Seeded ${documentsData.length} documents into MongoDB`);
    } else {
      const dbDocs = await Document.find({}).lean();
      if (dbDocs.length > 0) {
        documentsData.length = 0;
        documentsData.push(...dbDocs);
      }
    }

    // 3. Seed or Sync Tasks
    const taskCount = await Task.countDocuments();
    if (taskCount === 0 && Array.isArray(tasksData)) {
      await Task.insertMany(tasksData);
      console.log(`✅ Seeded ${tasksData.length} tasks into MongoDB`);
    } else {
      const dbTasks = await Task.find({}).lean();
      if (dbTasks.length > 0) {
        tasksData.length = 0;
        tasksData.push(...dbTasks);
      }
    }

    // 4. Seed or Sync Processes
    const procCount = await Process.countDocuments();
    if (procCount === 0 && Array.isArray(processesData)) {
      await Process.insertMany(processesData);
      console.log(`✅ Seeded ${processesData.length} processes into MongoDB`);
    } else {
      const dbProcs = await Process.find({}).lean();
      if (dbProcs.length > 0) {
        processesData.length = 0;
        processesData.push(...dbProcs);
      }
    }

    // 5. Seed or Sync MRMs
    const mrmCount = await MRM.countDocuments();
    if (mrmCount === 0 && Array.isArray(mrmData)) {
      await MRM.insertMany(mrmData);
      console.log(`✅ Seeded ${mrmData.length} MRM records into MongoDB`);
    } else {
      const dbMrms = await MRM.find({}).lean();
      if (dbMrms.length > 0) {
        mrmData.length = 0;
        mrmData.push(...dbMrms);
      }
    }

    // 6. Seed or Sync Internal Audits
    const auditCount = await Audit.countDocuments();
    if (auditCount === 0 && Array.isArray(auditData)) {
      await Audit.insertMany(auditData);
      console.log(`✅ Seeded ${auditData.length} internal audit records into MongoDB`);
    } else {
      const dbAudits = await Audit.find({}).lean();
      if (dbAudits.length > 0) {
        auditData.length = 0;
        auditData.push(...dbAudits);
      }
    }

    // 7. Seed or Sync External Audits
    const extCount = await ExternalAudit.countDocuments();
    if (extCount === 0 && Array.isArray(externalAuditData)) {
      await ExternalAudit.insertMany(externalAuditData);
      console.log(`✅ Seeded ${externalAuditData.length} external audit records into MongoDB`);
    } else {
      const dbExt = await ExternalAudit.find({}).lean();
      if (dbExt.length > 0) {
        externalAuditData.length = 0;
        externalAuditData.push(...dbExt);
      }
    }

    // 8. Seed or Sync Notifications
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0 && Array.isArray(notificationsData)) {
      await Notification.insertMany(notificationsData);
      console.log(`✅ Seeded ${notificationsData.length} notifications into MongoDB`);
    } else {
      const dbNotifs = await Notification.find({}).lean();
      if (dbNotifs.length > 0) {
        notificationsData.length = 0;
        notificationsData.push(...dbNotifs);
      }
    }

    // 9. Seed or Sync Employees
    const empCount = await Employee.countDocuments();
    if (empCount === 0 && Array.isArray(employeesData)) {
      await Employee.insertMany(employeesData);
      console.log(`✅ Seeded ${employeesData.length} employees into MongoDB`);
    } else {
      const dbEmps = await Employee.find({}).lean();
      if (dbEmps.length > 0) {
        employeesData.length = 0;
        employeesData.push(...dbEmps);
      }
    }

    // 10. Seed or Sync Activities
    const actCount = await Activity.countDocuments();
    if (actCount === 0 && Array.isArray(activitiesData)) {
      await Activity.insertMany(activitiesData);
      console.log(`✅ Seeded ${activitiesData.length} activities into MongoDB`);
    } else {
      const dbActs = await Activity.find({}).lean();
      if (dbActs.length > 0) {
        activitiesData.length = 0;
        activitiesData.push(...dbActs);
      }
    }

    return true;
  } catch (error) {
    console.error("Database seeding/sync notice:", error.message);
    return false;
  }
};
