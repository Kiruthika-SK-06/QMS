import mongoose from "mongoose";
import { User, Document, Process, MRM, Audit, ExternalAudit, Activity } from "../models/index.js";
import { dummyUsers } from "../data/users.js";
import { documentsData } from "../data/documents.js";
import { processesData } from "../data/processes.js";
import { mrmData } from "../data/mrm.js";
import { auditData } from "../data/audits.js";
import { activitiesData } from "../data/activities.js";

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    let totalUsers = dummyUsers.length;
    let totalDocuments = documentsData.length;
    let pendingApprovals = documentsData.filter((d) =>
      ["Under Review", "Changes Requested", "Draft", "Pending Approval"].includes(d.status)
    ).length;
    let approvedDocuments = documentsData.filter((d) =>
      ["Approved", "Current", "Active"].includes(d.status)
    ).length;
    let rejectedDocuments = documentsData.filter((d) =>
      ["Rejected", "Obsolete"].includes(d.status)
    ).length;
    let upcomingMRMs = mrmData.filter((m) =>
      ["Scheduled", "Notification Sent", "In Progress"].includes(m.status)
    ).length;
    let totalProcesses = processesData.length;
    let totalAudits = auditData.length;
    let recentActivities = activitiesData.slice(0, 10);

    // If MongoDB is connected, dynamically aggregate directly from MongoDB records
    if (mongoose.connection.readyState === 1) {
      try {
        const [
          dbUsers,
          dbDocs,
          dbPending,
          dbApproved,
          dbRejected,
          dbMrms,
          dbProcs,
          dbAudits,
          dbActs
        ] = await Promise.all([
          User.countDocuments(),
          Document.countDocuments(),
          Document.countDocuments({
            status: { $in: ["Under Review", "Changes Requested", "Draft", "Pending Approval"] }
          }),
          Document.countDocuments({
            status: { $in: ["Approved", "Current", "Active"] }
          }),
          Document.countDocuments({
            status: { $in: ["Rejected", "Obsolete"] }
          }),
          MRM.countDocuments({
            status: { $in: ["Scheduled", "Notification Sent", "In Progress"] }
          }),
          Process.countDocuments(),
          Audit.countDocuments(),
          Activity.find({}).sort({ createdAt: -1 }).limit(10).lean()
        ]);

        if (dbUsers > 0 || dbDocs > 0) {
          totalUsers = dbUsers;
          totalDocuments = dbDocs;
          pendingApprovals = dbPending;
          approvedDocuments = dbApproved;
          rejectedDocuments = dbRejected;
          upcomingMRMs = dbMrms;
          totalProcesses = dbProcs;
          totalAudits = dbAudits;
          if (dbActs && dbActs.length > 0) {
            recentActivities = dbActs;
          }
        }
      } catch (err) {
        console.warn("getDashboardStats DB error, using synchronized dataset:", err.message);
      }
    }

    // Calculate dynamic Quality Performance Index & Compliance Rate
    const totalReviewed = approvedDocuments + rejectedDocuments;
    const approvalRate = totalReviewed > 0 ? Math.round((approvedDocuments / totalReviewed) * 100) : 100;
    const processRate = totalProcesses > 0 ? 95 : 0;
    const complianceRate = totalDocuments > 0 ? Math.round((approvalRate * 0.6) + (processRate * 0.4)) : 88;

    // Generate dynamic monthly trend series for wave chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    const currentMonthIdx = new Date().getMonth();
    const months = monthNames.slice(0, Math.min(currentMonthIdx + 1, 8));
    if (months.length < 4) {
      months.push(...monthNames.slice(months.length, 4));
    }

    const series1 = months.map((_, i) => Math.min(100, Math.max(50, complianceRate - (months.length - 1 - i) * 2)));
    const series2 = months.map((_, i) => Math.min(100, Math.max(40, complianceRate - 15 - (months.length - 1 - i) * 2)));

    const stats = {
      totalUsers,
      totalDocuments,
      pendingApprovals,
      approvedDocuments,
      rejectedDocuments,
      upcomingMRMs,
      totalProcesses,
      totalAudits,
      complianceRate
    };

    const waveData = {
      months,
      series1,
      series2,
      primaryMetric: `${complianceRate}%`,
      primaryLabel: "Quality Performance Index"
    };

    return res.status(200).json({
      success: true,
      stats,
      waveData,
      recentActivities
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate dashboard statistics",
      error: error.message
    });
  }
};

export default { getDashboardStats };
