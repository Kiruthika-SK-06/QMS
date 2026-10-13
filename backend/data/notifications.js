// Controlled QMS Notifications Database
export let notificationsData = [
  {
    id: 1,
    title: "New MRM ready for distribution",
    text: "Q3 Academic Review Meeting was approved by Trust Head. QMS Coordinator can now distribute to Course Coordinators.",
    time: "15 minutes ago",
    targetRole: "qm",
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: "Course Management Procedure updated to Version 3.0",
    text: "The latest approved version is available in the controlled library.",
    time: "2 hours ago",
    targetRole: "all",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    title: "Document submitted for QMS review",
    text: "Course Delivery Template (DOC-003) is awaiting QMS Coordinator review.",
    time: "Yesterday",
    targetRole: "qm",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    title: "Feedback on Course Syllabus Form",
    text: "Please review notes regarding industry project requirements.",
    time: "Yesterday",
    targetRole: "owner",
    read: true,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    title: "Document approved",
    text: "Course Curriculum Procedure (DOC-004) was approved by QMS Coordinator.",
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
