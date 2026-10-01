// Controlled QMS Notifications Database
export let notificationsData = [
  {
    id: 1,
    title: "New task assigned to you",
    text: "Complete joining documentation before 22 Sep 2026.",
    time: "15 minutes ago",
    targetRole: "employee",
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: "Feedback Form updated to Version 3.0",
    text: "The latest approved version is available in the controlled library.",
    time: "2 hours ago",
    targetRole: "all",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    title: "Document submitted for QM review",
    text: "Training Feedback Template (DOC-003) is awaiting QM Group review.",
    time: "Yesterday",
    targetRole: "qm",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    title: "Changes requested for Joining Form",
    text: "Please review QM comments regarding emergency contacts section.",
    time: "Yesterday",
    targetRole: "owner",
    read: true,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    title: "Document approved",
    text: "Employee Induction Procedure (DOC-004) was approved by QM Group.",
    time: "2 days ago",
    targetRole: "all",
    read: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 6,
    title: "Internal Audit Checklist published",
    text: "Version 3.1 is now active for internal quality audit preparations.",
    time: "3 days ago",
    targetRole: "all",
    read: true,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  }
];
