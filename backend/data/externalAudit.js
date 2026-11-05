// External Quality Audit (ISO 9001:2015) Controlled Database
// Constraint: External Auditor has no system login or dashboard.
// External Auditor communicates strictly via email with the QMS Coordinator.
// QMS Coordinator initiates, shares, uploads NC docs to course coordinators only, and closes the process upon external approval.

export let externalAuditData = [
  {
    id: "EA-2026-001",
    title: "ISO 9001:2015 Annual Surveillance Audit - Academic Programs & Quality Operations",
    scope: "Annual surveillance evaluation of academic syllabus coverage, student feedback mechanisms, laboratory safety protocols, and institutional quality governance under ISO 9001:2015 Clauses 4 through 10.",
    externalAgency: "TÜV SÜD South Asia Certification Body",
    leadAuditor: {
      name: "Dr. Robert Vance",
      title: "Lead External Auditor (ISO 9001:2015)",
      agency: "TÜV SÜD South Asia",
      email: "robert.vance@tuvsud.com",
      phone: "+91 98230 45678"
    },
    targetPeriod: "November 2026",
    scheduledDate: "2026-11-28",
    scheduledTime: "09:30 AM",
    venue: "Main Boardroom (Executive Council) & TÜV SÜD Virtual Conference Bridge",
    department: "Quality Assurance & Academic Governance",
    process: "All Processes (Comprehensive Academic Quality Review)",
    stage: 2,
    status: "Schedule Shared to All Stakeholders",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,

    // Step 1: External Auditor scheduled and sent email to QMS Coordinator
    incomingScheduleEmail: {
      received: true,
      receivedAt: "2026-11-01 10:15 AM",
      from: "Dr. Robert Vance <robert.vance@tuvsud.com>",
      to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
      subject: "Official Notice: ISO 9001:2015 Surveillance Audit Plan & Schedule - C-DAC",
      bodyHtml: "<p>Dear Mr. Rahul Kumar (Lead QMS Coordinator),</p><p>This is to confirm that the annual <strong>ISO 9001:2015 Surveillance Audit</strong> for C-DAC Academic Quality Programs is scheduled for <strong>2026-11-28 starting at 09:30 AM</strong>.</p><p>The audit will encompass Opening Meeting, evaluation of Course Curriculum & Lab Delivery, Faculty Competency Records, and Closing Discussions. Please find the attached audit plan and notify your division coordinators, Trust Head, and internal audit cell.</p><p>Sincerely,<br/><strong>Dr. Robert Vance</strong><br/>Lead Auditor, TÜV SÜD Certification Body</p>",
      attachments: [
        {
          fileName: "TUV_ISO9001_Surveillance_Audit_Plan_2026.pdf",
          fileSize: "1.9 MB",
          fileType: "application/pdf"
        }
      ]
    },

    // Step 2: QMS Coordinator shared received email & schedule details to all Course Coordinators, Trust Head, and Internal Auditor
    shareWithStakeholders: {
      shared: true,
      sharedAt: "2026-11-01 02:45 PM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      noticeSubject: "Announcement: ISO 9001:2015 External Surveillance Audit Scheduled on 28-Nov-2026",
      noticeMessage: "All Course Coordinators, Trust Head, and Internal Auditor: Please take note of the upcoming External Audit scheduled by TÜV SÜD South Asia. Kindly prepare required academic folders, lab manuals, and course logs.",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Course Coordinator", name: "Sunita Patil", email: "sunita.patil@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ]
    },

    // Step 3: Pending audit completion and NC documents (to be uploaded by QMS Coordinator when received from auditor)
    ncDocument: null,

    // Step 4: External Auditor approval & final closure
    externalAuditorApproval: null,
    qmsClosure: null,

    timeline: [
      {
        action: "Audit Schedule Received via Email",
        actor: "Dr. Robert Vance (Lead External Auditor - TÜV SÜD)",
        timestamp: "2026-11-01 10:15 AM",
        details: "External audit schedule and official audit plan received via email by QMS Coordinator Rahul Kumar."
      },
      {
        action: "Schedule & Meeting Details Shared to All Stakeholders",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-11-01 02:45 PM",
        details: "Meeting schedule and received email dispatched to all Course Coordinators, Trust Head Anita Rao, and Internal Auditor Suresh Menon."
      }
    ]
  },
  {
    id: "EA-2026-002",
    title: "ISO 9001:2015 Recertification Audit - Advanced Computing & Cyber Security Curriculum",
    scope: "Evaluation of post-graduate curriculum delivery, practical cloud computing laboratory records, assessment transparency, and student grievance records.",
    externalAgency: "BSI Quality & Compliance Assurance",
    leadAuditor: {
      name: "Dr. Katherine Price",
      title: "Principal External Auditor",
      agency: "BSI Group International",
      email: "katherine.price@bsigroup.com",
      phone: "+91 99887 65432"
    },
    targetPeriod: "October 2026",
    scheduledDate: "2026-10-18",
    scheduledTime: "10:00 AM",
    venue: "Division Conference Room & Webex Remote Stream",
    department: "Academic Quality & Compliance",
    process: "Curriculum Design & Review",
    stage: 3,
    status: "NC Docs Shared with Course Coordinators",
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,

    incomingScheduleEmail: {
      received: true,
      receivedAt: "2026-10-05 09:00 AM",
      from: "Dr. Katherine Price <katherine.price@bsigroup.com>",
      to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
      subject: "BSI ISO 9001:2015 Recertification Audit Schedule Notice",
      bodyHtml: "<p>Dear Rahul Kumar,</p><p>Please find attached the schedule for the ISO 9001:2015 Recertification Audit planned on 2026-10-18. Please coordinate with academic department heads and course leads.</p><p>Regards,<br/>Dr. Katherine Price</p>",
      attachments: [
        {
          fileName: "BSI_Audit_Notification_Oct2026.pdf",
          fileSize: "1.4 MB",
          fileType: "application/pdf"
        }
      ]
    },

    shareWithStakeholders: {
      shared: true,
      sharedAt: "2026-10-05 11:30 AM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      noticeSubject: "External Audit Notice: BSI Recertification Scheduled on 18-Oct-2026",
      noticeMessage: "External audit schedule received and shared to all Course Coordinators, Trust Head, and Internal Auditor.",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ]
    },

    // Step 3: External Auditor conducted audit and emailed NC doc to QMS Coord; QMS Coord uploaded and shared to Course Coordinators ONLY
    ncDocument: {
      receivedFromExternalAuditor: true,
      receivedAt: "2026-10-19 04:30 PM",
      uploadedAt: "2026-10-20 11:00 AM",
      uploadedBy: "Rahul Kumar (QMS Coordinator)",
      sharedWithCourseCoordinatorsOnly: true,
      fileName: "BSI_ISO9001_External_Audit_NC_Report.pdf",
      fileSize: "2.3 MB",
      fileType: "application/pdf",
      summary: "Two minor non-conformances identified regarding practical exercise verification logs and version labelling on supplementary cyber lab manuals.",
      targetClosureDate: "2026-11-20",
      findings: [
        {
          id: "NC-EXT-01",
          type: "Minor Non-Conformance",
          clause: "ISO 9001:2015 Clause 8.5.1",
          description: "Lab log verification timestamps for week 6 experiments were not counter-signed by assigned instructors.",
          assignedTo: "Priya Sharma (Course Coordinator)",
          deadline: "2026-11-15",
          status: "In Progress"
        },
        {
          id: "NC-EXT-02",
          type: "Minor Non-Conformance",
          clause: "ISO 9001:2015 Clause 7.5.3",
          description: "Version stamp missing on practical module appendix documents in student repository.",
          assignedTo: "Dr. Rajesh Verma (Course Coordinator - AI)",
          deadline: "2026-11-18",
          status: "In Progress"
        }
      ]
    },

    externalAuditorApproval: null,
    qmsClosure: null,

    timeline: [
      {
        action: "Audit Schedule Received via Email",
        actor: "Dr. Katherine Price (Lead External Auditor - BSI)",
        timestamp: "2026-10-05 09:00 AM",
        details: "Audit schedule and plan received via email from BSI Lead Auditor."
      },
      {
        action: "Schedule & Meeting Details Shared to All Stakeholders",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-05 11:30 AM",
        details: "Schedule details shared with all Course Coordinators, Trust Head, and Internal Auditor."
      },
      {
        action: "External Audit Conducted by Auditor",
        actor: "Dr. Katherine Price (Lead External Auditor)",
        timestamp: "2026-10-18 05:00 PM",
        details: "External audit sessions conducted across academic divisions. NC findings compiled."
      },
      {
        action: "NC Documents Received & Shared to Course Coordinators Only",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-20 11:00 AM",
        details: "NC Document received from External Auditor via email. Uploaded as official document (BSI_ISO9001_External_Audit_NC_Report.pdf) and shared exclusively to Course Coordinators for corrective action."
      }
    ]
  },
  {
    id: "EA-2026-003",
    title: "ISO 9001:2015 Quality Management Governance & Strategic System Certification",
    scope: "Triennial ISO 9001:2015 system re-certification assessing academic administration, continuous improvement framework, customer satisfaction benchmarks, and trust leadership alignment.",
    externalAgency: "Bureau Veritas Certification Services",
    leadAuditor: {
      name: "Arthur Pendelton",
      title: "Senior Lead External Auditor",
      agency: "Bureau Veritas Certification",
      email: "arthur.pendelton@bureauveritas.com",
      phone: "+91 97654 32109"
    },
    targetPeriod: "May 2026",
    scheduledDate: "2026-05-15",
    scheduledTime: "09:30 AM",
    venue: "Executive Council Boardroom",
    department: "Quality Assurance & Compliance",
    process: "Quality Review & MRM",
    stage: 4,
    status: "Completed & Closed (ISO 9001 Certified)",
    createdAt: Date.now() - 170 * 24 * 60 * 60 * 1000,

    incomingScheduleEmail: {
      received: true,
      receivedAt: "2026-05-02 11:00 AM",
      from: "Arthur Pendelton <arthur.pendelton@bureauveritas.com>",
      to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
      subject: "Bureau Veritas ISO 9001:2015 Recertification Plan",
      bodyHtml: "<p>Dear QMS Coordinator,</p><p>Please find enclosed the confirmed schedule for the triennial ISO 9001:2015 system re-certification audit on 2026-05-15.</p>",
      attachments: [{ fileName: "BV_Recertification_Audit_Schedule.pdf", fileSize: "2.1 MB" }]
    },

    shareWithStakeholders: {
      shared: true,
      sharedAt: "2026-05-02 03:00 PM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      noticeSubject: "Bureau Veritas Triennial Recertification Audit Schedule",
      noticeMessage: "Shared to all Course Coordinators, Trust Head, and Internal Auditor.",
      recipients: [
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ]
    },

    ncDocument: {
      receivedFromExternalAuditor: true,
      receivedAt: "2026-05-16 02:00 PM",
      uploadedAt: "2026-05-17 10:30 AM",
      uploadedBy: "Rahul Kumar (QMS Coordinator)",
      sharedWithCourseCoordinatorsOnly: true,
      fileName: "BV_ISO9001_External_Audit_NC_Report_Signed.pdf",
      fileSize: "1.8 MB",
      summary: "1 minor observation regarding documentation retention period in student grievance registry.",
      targetClosureDate: "2026-05-30",
      findings: [
        {
          id: "NC-EXT-01",
          type: "Opportunity for Improvement",
          clause: "ISO 9001:2015 Clause 9.1.2",
          description: "Archive retention policy for student satisfaction feedback standardized to 5 years.",
          assignedTo: "Priya Sharma (Course Coordinator)",
          deadline: "2026-05-28",
          status: "Resolved"
        }
      ]
    },

    // Step 4: Approved by External Auditor & Closed by QMS Coordinator
    externalAuditorApproval: {
      approved: true,
      approvedAt: "2026-05-29 03:30 PM",
      decision: "Certified & Conformance Endorsed",
      certificateNumber: "ISO9001-BV-2026-9810",
      recommendation: "Unconditional recommendation for issuance and renewal of ISO 9001:2015 Quality Management Certificate.",
      remarks: "All corrective actions verified and accepted. Quality Management System demonstrates commendable rigor.",
      externalLetterFileName: "BV_Certificate_Issuance_Recommendation.pdf"
    },

    qmsClosure: {
      closed: true,
      closedAt: "2026-05-30 11:00 AM",
      closedBy: "Rahul Kumar (QMS Coordinator)",
      remarks: "ISO 9001:2015 re-certification audit successfully completed and closed with full compliance certification."
    },

    timeline: [
      {
        action: "Audit Schedule Received via Email",
        actor: "Arthur Pendelton (Senior External Auditor - Bureau Veritas)",
        timestamp: "2026-05-02 11:00 AM",
        details: "Audit schedule received via email by QMS Coordinator."
      },
      {
        action: "Schedule & Details Shared to All Stakeholders",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-05-02 03:00 PM",
        details: "Dispatched to all Course Coordinators, Trust Head, and Internal Auditor."
      },
      {
        action: "External Audit Conducted",
        actor: "Arthur Pendelton (Lead External Auditor)",
        timestamp: "2026-05-15 05:00 PM",
        details: "Full triennial ISO 9001 audit successfully executed."
      },
      {
        action: "NC Document Uploaded & Shared to Course Coordinators Only",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-05-17 10:30 AM",
        details: "Minor observation report shared exclusively to Course Coordinators for resolution."
      },
      {
        action: "Audit Approved by External Auditor",
        actor: "Arthur Pendelton (Lead External Auditor)",
        timestamp: "2026-05-29 03:30 PM",
        details: "External Auditor approved resolution and endorsed ISO 9001:2015 Certificate (ISO9001-BV-2026-9810)."
      },
      {
        action: "External Audit Process Officially Closed",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-05-30 11:00 AM",
        details: "Full process closed by QMS Coordinator. ISO 9001:2015 certification cycle successfully renewed."
      }
    ]
  }
];
