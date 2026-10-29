// Internal Quality Audit (IQA) Controlled Database
export let auditData = [
  {
    id: "IA-2026-001",
    title: "Q4 Course Delivery & Curriculum Compliance Audit",
    process: "Course Management",
    processId: "PROC-01",
    auditDates: {
      startDate: "2026-11-05",
      endDate: "2026-11-05"
    },
    scheduledDate: "2026-11-05",
    internalAuditor: {
      id: "IA001",
      name: "Vikas Deshmukh",
      role: "Internal Auditor",
      email: "vikas.deshmukh@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC001",
      name: "Priya Sharma",
      role: "Course Coordinator",
      email: "priya.sharma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-24 10:00 AM"
    },
    scope: "Evaluation of course delivery milestones, syllabus progress tracking, laboratory sessions, and compliance with ISO 9001:2015 Clause 8.5.",
    venue: "Academic Block - Room 204 & QMS Portal",
    status: "Completed",
    stage: 7,
    stageLabel: "Completed / Closed",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-24 11:30 AM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-001.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "priya.sharma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Vikas Deshmukh", email: "vikas.deshmukh@cdac.in" }
      ]
    },

    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-25 02:15 PM",
      remarks: "Audit plan and schedule verified. Approved for execution across Academic Division."
    },

    noticingSheet: {
      submitted: true,
      sheetNo: "NS-2026-042",
      submittedBy: "Vikas Deshmukh (Internal Auditor)",
      submittedAt: "2026-11-06 04:30 PM",
      fileName: "Noticing_Sheet_IA-2026-001.pdf",
      summary: "Audit completed successfully. 1 Minor Non-Conformance observed regarding course logbook signatures for weeks 4 and 5.",
      findings: [
        {
          id: "NC-01",
          type: "Minor NC",
          clause: "ISO 9001:2015 Clause 8.5.1",
          description: "Weekly practical lab attendance and syllabus delivery logbook was not signed by the Course Coordinator for weeks 4 and 5.",
          targetDate: "2026-11-15"
        }
      ]
    },

    ncDocs: {
      shared: true,
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      sharedAt: "2026-11-07 10:15 AM",
      fileName: "NC_Formal_Notice_IA-2026-001.pdf",
      remarks: "Noticing sheet verified. Formal NC-01 issued. Auditee requested to submit Root Cause Analysis and Corrective Action Plan by 2026-11-15.",
      sharedWith: [
        { role: "Internal Auditor", name: "Vikas Deshmukh" },
        { role: "Internal Auditee", name: "Priya Sharma (Course Coordinator)" }
      ]
    },

    auditeeClosure: {
      closed: true,
      closedBy: "Priya Sharma (Course Coordinator)",
      closedAt: "2026-11-12 03:45 PM",
      rootCause: "Manual paper sign-off workflow was delayed due to mid-semester exams and faculty travel schedule.",
      correctiveAction: "All pending logbook entries for weeks 4 and 5 have been verified and signed off. Implemented weekly digital attendance sign-off reminder on ERP portal.",
      evidenceFileName: "Signed_Lab_Logbooks_Weeks4_5.pdf",
      remarks: "Corrective actions completed. Evidence verified and submitted for QMS closure."
    },

    qmsFinalClosure: {
      closed: true,
      closedBy: "Rahul Kumar (QMS Coordinator)",
      closedAt: "2026-11-14 11:00 AM",
      remarks: "Evidence reviewed and cross-verified with ERP logs. Corrective action is satisfactory. NC-01 officially closed. Audit process completed.",
      completedAt: "2026-11-14 11:00 AM"
    },

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-24 10:00 AM", details: "Audit scheduled for Course Management process" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-24 11:30 AM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" },
      { action: "Schedule Confirmed", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-25 02:15 PM", details: "Trust Head confirmed audit schedule" },
      { action: "Noticing Sheet Submitted", actor: "Vikas Deshmukh (Internal Auditor)", timestamp: "2026-11-06 04:30 PM", details: "Auditor uploaded noticing sheet with 1 Minor NC" },
      { action: "NC Docs Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-11-07 10:15 AM", details: "QMS Coordinator reviewed and shared NC docs to Auditor & Auditee" },
      { action: "Auditee Closure Submitted", actor: "Priya Sharma (Course Coordinator)", timestamp: "2026-11-12 03:45 PM", details: "Auditee submitted CAPA and evidence" },
      { action: "Final Audit Closed", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-11-14 11:00 AM", details: "QMS Coordinator verified corrective actions and closed entire audit process" }
    ]
  },
  {
    id: "IA-2026-002",
    title: "Admissions & Student Enrollment Verification Audit",
    process: "Admissions & Enrollment",
    processId: "PROC-02",
    auditDates: {
      startDate: "2026-11-18",
      endDate: "2026-11-18"
    },
    scheduledDate: "2026-11-18",
    internalAuditor: {
      id: "IA002",
      name: "Suresh Menon",
      role: "Internal Auditor",
      email: "suresh.menon@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC002",
      name: "Dr. Rajesh Verma",
      role: "Course Coordinator",
      email: "rajesh.verma@cdac.in",
      department: "AI & Advanced Computing"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-25 09:30 AM"
    },
    scope: "Review of student admission eligibility verification, fee receipts, registration registers, and ISO 9001:2015 Clause 8.2 conformity.",
    venue: "Admissions Center & Online ERP",
    status: "Pending QMS Sign-off",
    stage: 6,
    stageLabel: "Closed by Auditee (Pending QMS Final Sign-off)",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-25 10:15 AM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-002.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "suresh.menon@cdac.in" }
      ]
    },

    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-25 03:00 PM",
      remarks: "Audit dates ratified. Ensure all admission registers are made available."
    },

    noticingSheet: {
      submitted: true,
      sheetNo: "NS-2026-045",
      submittedBy: "Suresh Menon (Internal Auditor)",
      submittedAt: "2026-11-19 05:00 PM",
      fileName: "Noticing_Sheet_IA-2026-002.pdf",
      summary: "Verification completed for 120 student admissions. 1 Observation noted regarding archival of transfer certificates.",
      findings: [
        {
          id: "NC-02",
          type: "Minor NC",
          clause: "ISO 9001:2015 Clause 7.5.3",
          description: "Digital scanned copies of transfer certificates for 3 lateral entry candidates were pending upload in ERP repository.",
          targetDate: "2026-11-26"
        }
      ]
    },

    ncDocs: {
      shared: true,
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      sharedAt: "2026-11-20 11:00 AM",
      fileName: "NC_Formal_Notice_IA-2026-002.pdf",
      remarks: "NC-02 issued. Auditee requested to complete scanned uploads and submit closure.",
      sharedWith: [
        { role: "Internal Auditor", name: "Suresh Menon" },
        { role: "Internal Auditee", name: "Dr. Rajesh Verma (Course Coordinator)" }
      ]
    },

    auditeeClosure: {
      closed: true,
      closedBy: "Dr. Rajesh Verma (Course Coordinator)",
      closedAt: "2026-11-22 04:10 PM",
      rootCause: "Late document submission by candidates during spot counseling rounds.",
      correctiveAction: "All 3 transfer certificates scanned in high resolution, uploaded to student ERP profiles, and physically indexed in archive binder #12.",
      evidenceFileName: "Lateral_Entry_TC_Index_Receipts.pdf",
      remarks: "Documents verified and uploaded. Requesting final QMS sign-off."
    },

    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-25 09:30 AM", details: "Audit scheduled for Admissions & Enrollment" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-25 10:15 AM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" },
      { action: "Schedule Confirmed", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-25 03:00 PM", details: "Trust Head confirmed audit schedule" },
      { action: "Noticing Sheet Submitted", actor: "Suresh Menon (Internal Auditor)", timestamp: "2026-11-19 05:00 PM", details: "Auditor uploaded noticing sheet with 1 Minor NC" },
      { action: "NC Docs Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-11-20 11:00 AM", details: "QMS Coordinator shared NC docs to Auditor & Auditee" },
      { action: "Auditee Closure Submitted", actor: "Dr. Rajesh Verma (Course Coordinator)", timestamp: "2026-11-22 04:10 PM", details: "Auditee uploaded evidence and closed NC" }
    ]
  },
  {
    id: "IA-2026-003",
    title: "Semester Examination & Evaluation Quality Audit",
    process: "Examination & Evaluation",
    processId: "PROC-03",
    auditDates: {
      startDate: "2026-11-25",
      endDate: "2026-11-25"
    },
    scheduledDate: "2026-11-25",
    internalAuditor: {
      id: "IA001",
      name: "Vikas Deshmukh",
      role: "Internal Auditor",
      email: "vikas.deshmukh@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC001",
      name: "Priya Sharma",
      role: "Course Coordinator",
      email: "priya.sharma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-26 09:00 AM"
    },
    scope: "Verification of question paper moderation protocol, answer script double evaluation records, and marks tabulation security under ISO 9001:2015 Clause 9.1.",
    venue: "Confidential Examination Section",
    status: "NC Docs Shared",
    stage: 5,
    stageLabel: "NC Docs Shared (Action Required: Auditee CAPA)",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-26 09:30 AM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-003.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "priya.sharma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Vikas Deshmukh", email: "vikas.deshmukh@cdac.in" }
      ]
    },

    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-26 11:45 AM",
      remarks: "Confirmed. Ensure strict adherence to question paper confidentiality protocols."
    },

    noticingSheet: {
      submitted: true,
      sheetNo: "NS-2026-049",
      submittedBy: "Vikas Deshmukh (Internal Auditor)",
      submittedAt: "2026-11-26 04:00 PM",
      fileName: "Noticing_Sheet_IA-2026-003.pdf",
      summary: "Evaluation system inspected. Moderation logs require formal sign-off sheet attachment.",
      findings: [
        {
          id: "NC-03",
          type: "Minor NC",
          clause: "ISO 9001:2015 Clause 8.5.2",
          description: "Moderation committee minutes lacked external expert countersignature on Form EX-04.",
          targetDate: "2026-12-05"
        }
      ]
    },

    ncDocs: {
      shared: true,
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      sharedAt: "2026-11-27 10:30 AM",
      fileName: "NC_Formal_Notice_IA-2026-003.pdf",
      remarks: "Formal NC-03 communicated to Course Coordinator and Internal Auditor. Auditee closure due within 7 days.",
      sharedWith: [
        { role: "Internal Auditor", name: "Vikas Deshmukh" },
        { role: "Internal Auditee", name: "Priya Sharma (Course Coordinator)" }
      ]
    },

    auditeeClosure: null,
    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 09:00 AM", details: "Audit scheduled for Examination & Evaluation" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 09:30 AM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" },
      { action: "Schedule Confirmed", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-26 11:45 AM", details: "Trust Head confirmed audit schedule" },
      { action: "Noticing Sheet Submitted", actor: "Vikas Deshmukh (Internal Auditor)", timestamp: "2026-11-26 04:00 PM", details: "Auditor uploaded noticing sheet with 1 Minor NC" },
      { action: "NC Docs Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-11-27 10:30 AM", details: "QMS Coordinator reviewed and shared NC docs to Auditor & Auditee" }
    ]
  },
  {
    id: "IA-2026-004",
    title: "Curriculum Modernization & Lab Infrastructure Audit",
    process: "Curriculum Design & Review",
    processId: "PROC-04",
    auditDates: {
      startDate: "2026-12-02",
      endDate: "2026-12-02"
    },
    scheduledDate: "2026-12-02",
    internalAuditor: {
      id: "IA002",
      name: "Suresh Menon",
      role: "Internal Auditor",
      email: "suresh.menon@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC002",
      name: "Dr. Rajesh Verma",
      role: "Course Coordinator",
      email: "rajesh.verma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-26 02:00 PM"
    },
    scope: "Review of latest industry-aligned syllabus modules, GPU lab cluster availability, and software license records under ISO 9001 Clause 7.1.3.",
    venue: "High Performance Computing Lab",
    status: "Noticing Sheet Submitted",
    stage: 4,
    stageLabel: "Noticing Sheet Submitted (Under QMS Review)",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-26 02:30 PM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-004.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "suresh.menon@cdac.in" }
      ]
    },

    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-26 04:00 PM",
      remarks: "Schedule confirmed. Lab safety compliance must also be examined."
    },

    noticingSheet: {
      submitted: true,
      sheetNo: "NS-2026-052",
      submittedBy: "Suresh Menon (Internal Auditor)",
      submittedAt: "2026-12-03 04:30 PM",
      fileName: "Noticing_Sheet_IA-2026-004.pdf",
      summary: "Lab resources audited. GPU software updates recorded; identified missing periodic maintenance log for Server Node 04.",
      findings: [
        {
          id: "NC-04",
          type: "Minor NC",
          clause: "ISO 9001:2015 Clause 7.1.3",
          description: "Server Node 04 quarterly preventive maintenance log was not signed by system administrator.",
          targetDate: "2026-12-12"
        }
      ]
    },

    ncDocs: null,
    auditeeClosure: null,
    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 02:00 PM", details: "Audit scheduled for Curriculum Design & Review" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 02:30 PM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" },
      { action: "Schedule Confirmed", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-26 04:00 PM", details: "Trust Head confirmed audit schedule" },
      { action: "Noticing Sheet Submitted", actor: "Suresh Menon (Internal Auditor)", timestamp: "2026-12-03 04:30 PM", details: "Auditor shared noticing sheet to QMS Coordinator" }
    ]
  },
  {
    id: "IA-2026-005",
    title: "Student Feedback Analysis & Continual Improvement Audit",
    process: "Quality Management",
    processId: "PROC-05",
    auditDates: {
      startDate: "2026-12-10",
      endDate: "2026-12-10"
    },
    scheduledDate: "2026-12-10",
    internalAuditor: {
      id: "IA001",
      name: "Vikas Deshmukh",
      role: "Internal Auditor",
      email: "vikas.deshmukh@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC001",
      name: "Priya Sharma",
      role: "Course Coordinator",
      email: "priya.sharma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-26 03:30 PM"
    },
    scope: "Verification of student grievance redressal records, mid-term course feedback surveys, and corrective actions under ISO 9001 Clause 9.1.2.",
    venue: "Quality Management Group Office",
    status: "Awaiting Trust Head Approval",
    stage: 2,
    stageLabel: "Awaiting Trust Head Approval",

    scheduleShared: null,
    trustHeadConfirmation: null,
    noticingSheet: null,
    ncDocs: null,
    auditeeClosure: null,
    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 03:30 PM", details: "Audit scheduled and submitted to Trust Head for approval" }
    ]
  },
  {
    id: "IA-2026-006",
    title: "Faculty Qualifications & Competency Verification Audit",
    process: "Faculty Development",
    processId: "PROC-06",
    auditDates: {
      startDate: "2026-12-15",
      endDate: "2026-12-15"
    },
    scheduledDate: "2026-12-15",
    internalAuditor: {
      id: "IA002",
      name: "Suresh Menon",
      role: "Internal Auditor",
      email: "suresh.menon@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC002",
      name: "Dr. Rajesh Verma",
      role: "Course Coordinator",
      email: "rajesh.verma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-26 04:00 PM"
    },
    scope: "Review of faculty training records, certifications, peer evaluations, and compliance with ISO 9001:2015 Clause 7.2.",
    venue: "Academic Dean's Conference Room",
    status: "Approved by Trust Head",
    stage: 2.5,
    stageLabel: "Approved by Trust Head (Pending QMS Distribution)",

    scheduleShared: null,
    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-26 04:30 PM",
      remarks: "Audit dates verified and approved. QMS Coordinator may distribute schedule."
    },
    noticingSheet: null,
    ncDocs: null,
    auditeeClosure: null,
    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 04:00 PM", details: "Audit scheduled for Faculty Development & Competency" },
      { action: "Schedule Approved by Trust Head", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-26 04:30 PM", details: "Trust Head approved audit schedule. Ready for QMS distribution." }
    ]
  }
];
