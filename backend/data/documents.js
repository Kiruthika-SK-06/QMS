// Controlled QMS Documents Database
export let documentsData = [
  {
    id: "DOC-001",
    name: "Feedback Form",
    type: "Forms",
    process: "Training & Development",
    owner: "Priya Sharma",
    version: "3.0",
    updated: "18 Sep 2026",
    updatedBy: "Priya Sharma",
    status: "Approved",
    submittedBy: "Priya Sharma",
    description: "Standard training feedback questionnaire collected after completion of technical and soft skills workshops.",
    versions: [
      { version: "3.0", date: "18 Sep 2026", author: "Priya Sharma", status: "Current", notes: "Updated ISO 9001:2026 compliance questions" },
      { version: "2.0", date: "10 Sep 2026", author: "Priya Sharma", status: "Archived", notes: "Added digital signature confirmation fields" },
      { version: "1.0", date: "02 Sep 2026", author: "Priya Sharma", status: "Archived", notes: "Initial release" }
    ]
  },
  {
    id: "DOC-002",
    name: "Joining Form",
    type: "Forms",
    process: "Employee Onboarding",
    owner: "Priya Sharma",
    version: "2.0",
    updated: "15 Sep 2026",
    updatedBy: "Arun Kumar",
    status: "Changes Requested",
    submittedBy: "Priya Sharma",
    reviewComments: "Please update section 4 to include emergency contacts and verify the compliance disclaimer.",
    description: "Onboarding form for newly joined personnel detailing statutory information and hardware requests.",
    versions: [
      { version: "2.0", date: "15 Sep 2026", author: "Arun Kumar", status: "Current", notes: "Revised employee tax verification checklist" },
      { version: "1.0", date: "04 Sep 2026", author: "Priya Sharma", status: "Archived", notes: "Initial release" }
    ]
  },
  {
    id: "DOC-003",
    name: "Training Feedback Template",
    type: "Templates",
    process: "Training & Development",
    owner: "Priya Sharma",
    version: "1.0",
    updated: "11 Sep 2026",
    updatedBy: "Priya Sharma",
    status: "Under Review",
    submittedBy: "Priya Sharma",
    description: "Structured evaluation template used by training instructors to compile course effectiveness metrics.",
    versions: [
      { version: "1.0", date: "11 Sep 2026", author: "Priya Sharma", status: "Current", notes: "Initial submission for QM group evaluation" }
    ]
  },
  {
    id: "DOC-004",
    name: "Employee Induction Procedure",
    type: "Procedures",
    process: "Employee Onboarding",
    owner: "Priya Sharma",
    version: "4.0",
    updated: "08 Sep 2026",
    updatedBy: "Priya Sharma",
    status: "Approved",
    submittedBy: "Priya Sharma",
    description: "Official procedure governing the step-by-step induction program for all personnel joining the organization.",
    versions: [
      { version: "4.0", date: "08 Sep 2026", author: "Priya Sharma", status: "Current", notes: "Integrated information security briefing module" },
      { version: "3.0", date: "02 Sep 2026", author: "Priya Sharma", status: "Archived", notes: "Revised departmental rotation schedules" },
      { version: "2.0", date: "26 Aug 2026", author: "Priya Sharma", status: "Archived", notes: "Updated mentor assignment criteria" },
      { version: "1.0", date: "18 Aug 2026", author: "Priya Sharma", status: "Archived", notes: "Initial baseline induction SOP" }
    ]
  },
  {
    id: "DOC-005",
    name: "Course Management Procedure",
    type: "Procedures",
    process: "Training & Development",
    owner: "Rohan Desai",
    version: "2.0",
    updated: "06 Sep 2026",
    updatedBy: "Rohan Desai",
    status: "Approved",
    submittedBy: "Rohan Desai",
    description: "Procedure outlining curriculum approval, instructor assignment, and attendance recording.",
    versions: [
      { version: "2.0", date: "06 Sep 2026", author: "Rohan Desai", status: "Current", notes: "Automated LMS integration workflow" },
      { version: "1.0", date: "25 Aug 2026", author: "Rohan Desai", status: "Archived", notes: "Initial document release" }
    ]
  },
  {
    id: "DOC-006",
    name: "IT Security Incident Report",
    type: "Forms",
    process: "IT Support Management",
    owner: "Karthik Verma",
    version: "1.0",
    updated: "22 Sep 2026",
    updatedBy: "Karthik Verma",
    status: "Under Review",
    submittedBy: "Karthik Verma",
    description: "Standard reporting format for physical and cyber incident disclosure in compliance with QMS policies.",
    versions: [
      { version: "1.0", date: "22 Sep 2026", author: "Karthik Verma", status: "Current", notes: "Standardized severity classification matrix" }
    ]
  },
  {
    id: "DOC-007",
    name: "Internal Audit Checklist",
    type: "Templates",
    process: "Quality Management",
    owner: "Rahul Kumar",
    version: "3.1",
    updated: "20 Sep 2026",
    updatedBy: "Anita Rao",
    status: "Approved",
    submittedBy: "Rahul Kumar",
    description: "Comprehensive questionnaire template used during biannual internal quality audits.",
    versions: [
      { version: "3.1", date: "20 Sep 2026", author: "Anita Rao", status: "Current", notes: "Minor corrections to ISO clause mapping" },
      { version: "3.0", date: "14 Sep 2026", author: "Rahul Kumar", status: "Archived", notes: "Updated annual quality criteria" }
    ]
  },
  {
    id: "DOC-008",
    name: "Travel Requisition & Reimbursement",
    type: "Forms",
    process: "Finance Management",
    owner: "Meera Shah",
    version: "1.2",
    updated: "12 Sep 2026",
    updatedBy: "Meera Shah",
    status: "Approved",
    submittedBy: "Meera Shah",
    description: "Finance verification form required prior to domestic and international project deployments.",
    versions: [
      { version: "1.2", date: "12 Sep 2026", author: "Meera Shah", status: "Current", notes: "Per diem rates updated for 2026-2027 fiscal year" },
      { version: "1.0", date: "01 Jul 2026", author: "Meera Shah", status: "Archived", notes: "Original release" }
    ]
  }
];
