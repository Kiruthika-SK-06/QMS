# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Centralized Web-Based Quality Management System (QMS) for C-DAC

**Project:** C-DAC WBL Internship Project  
**Prepared by:** Kiruthika  
**Original Date:** 09 September 2026  
**Updated Version:** 2.0 (November 2026 — Comprehensive Implementation Milestone)  
**Status:** Implemented, Tested, Built & Deployed on Vercel  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the formal functional and non-functional requirements for the Centralized Web-Based Quality Management System (QMS) developed for the Centre for Development of Advanced Computing (C-DAC). The application digitizes, automates, and centrally governs quality management processes in strict compliance with ISO 9001 standards, including Controlled Document Lifecycle Management, Multi-Stage Internal Quality Audits (IQA), 5-Step External Surveillance Audits, Management Review Meetings (MRM) with Minutes of Meeting (MoM) ratification, process ownership, employee task delegation, and executive governance.

### 1.2 Scope
The system provides a unified, role-governed enterprise web portal serving four primary institutional stakeholder groups and general employees. It eliminates fragmented manual email trails, unversioned file storage, and paper tracking by providing:
- Immutable document version control with historical revision comparison.
- Structured, sequential audit workflows with predecessor-dependency enforcement.
- Executive dashboards with live Hope UI KPI circular gauge indicators and interactive wave analytics.
- Real-time in-app notifications, system action triggers, and immutable audit trails.

### 1.3 Problem Statement
Prior to this system, C-DAC’s QMS activities operated across local drives, disparate cloud folders, and unstructured email chains:
- **Version Loss & File Overwrites:** When documents (Forms, Templates, Procedures) were revised, newer files often replaced older ones without preserving historical records, compromising ISO 9001 compliance audit trails.
- **Fragmented Review Loops:** Submissions, review comments, rejections, and approvals between Course Coordinators and the QM Group were conducted via email, causing bottlenecks and lost feedback history.
- **Audit Tracking Complexity:** Internal audit scheduling, non-conformance (NC) notices, auditee CAPA responses, and executive sign-offs lacked a single source of truth.
- **External Audit Delays:** Multi-stakeholder coordination (email notifications, paper NC scans, corrective closures, ISO certificate issuance) was difficult to monitor in real time.

### 1.4 Objectives
- **Centralized Quality Management:** Consolidate all QMS activities under a secure, single-sign-on capable web portal.
- **Zero Document Loss:** Enforce an immutable versioning rule where every document edit creates a distinct revision (`v1.0`, `v1.1`, `v2.0`) and preserves previous versions in history.
- **Digitized IQA & Surveillance Workflows:** Orchestrate multi-stage internal and external audit lifecycles with built-in digital forms and review stages.
- **Executive Governance:** Provide the Trust Head with high-level institutional quality index monitoring, MRM MoM ratification, and sign-off authority.
- **Accountability & Traceability:** Maintain tamper-evident activity timelines and role-specific notification queues.

### 1.5 Definitions, Acronyms, and Abbreviations
| Term | Meaning |
| :--- | :--- |
| **QMS** | Quality Management System |
| **C-DAC** | Centre for Development of Advanced Computing |
| **ISO 9001** | International Standard for Quality Management Systems |
| **QM Group / QMS Coordinator** | Quality management administrative team overseeing compliance and documentation |
| **Trust Head / Executive Head** | Institutional leader responsible for executive governance, ratification, and final sign-off |
| **Course Coordinator / Process Owner** | Academic or operational head accountable for specific departmental processes and documents |
| **Internal Auditor** | Certified internal officer performing formal quality compliance inspections |
| **Auditee** | Course Coordinator or department representative undergoing audit inspection |
| **IQA** | Internal Quality Audit |
| **NC** | Non-Conformance (deviation from specified ISO/QMS standards) |
| **CAPA** | Corrective and Preventive Action plan submitted by an Auditee to remediate NCs |
| **MRM** | Management Review Meeting conducted periodically to assess QMS effectiveness |
| **MoM** | Minutes of Meeting recorded and published following an MRM session |

---

## 2. Overall Description

### 2.1 Product Perspective
The QMS application serves as the core digital quality operating layer within C-DAC’s institutional IT infrastructure. It operates on modern web architecture (React.js frontend + Node.js/Express.js backend + MongoDB Atlas database) and connects process owners, auditors, quality managers, and executive leadership in one seamless loop.

### 2.2 Expanded User Classes and Characteristics
The system supports exactly five specialized roles configured with strict Role-Based Access Control (RBAC):

```
                   ┌──────────────────────────────────────────────┐
                   │             Trust Head / Executive           │
                   │  - Institutional Quality Governance          │
                   │  - Executive KPI Wave Analytics              │
                   │  - MRM MoM & Audit Ratification              │
                   └──────────────────────┬───────────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
│    QMS Coordinator    │   │      Internal Auditor     │   │   Course Coordinator  │
│  - Document Approval  │   │  - IQA Inspections        │   │  - Process Management │
│  - Audit Scheduling   │   │  - Noticing Sheets        │   │  - Document Authoring │
│  - MRM Administration │   │  - CAPA Verification      │   │  - CAPA Remediation   │
│  - User Management    │   │  - Audit Recommendation   │   │  - Task Delegation    │
└───────────────────────┘   └───────────────────────────┘   └───────────────────────┘
                                                                        │
                                                                        ▼
                                                            ┌───────────────────────┐
                                                            │    Employee / Staff   │
                                                            │  - Task Execution     │
                                                            │  - Template Access    │
                                                            └───────────────────────┘
```

1. **Trust Head (`head`):**
   - High-level executive monitoring of institutional quality performance.
   - Reviews and formally approves MRM Minutes of Meeting.
   - Grants final executive sign-off and ratification for concluded quality audits.
   - Dedicated Hope UI Executive Workspace with 3-Card circular gauge indicators and the Executive Wave Chart.
2. **QMS Coordinator (`qm`):**
   - Full institutional administration of controlled documents (Forms, Templates, Procedures).
   - Approves, requests revisions, or rejects document submissions with timestamped notes.
   - Schedules Internal Quality Audits and initiates ISO 9001 External Surveillance Audits.
   - Organizes Management Review Meetings, tracks participant attendance, and publishes official MoM.
   - Manages user accounts, active status, and departmental permissions.
3. **Internal Auditor (`auditor`):**
   - Reviews assigned internal quality audit appointments and accepts audit dates.
   - Conducts on-site inspections and submits digital **Noticing Sheets** documenting NCs and observations.
   - Reviews auditee CAPA submissions and verifies corrective evidence prior to recommending closure.
4. **Course Coordinator / Process Owner (`owner`):**
   - Authors, modifies, and submits controlled documents for their respective departmental processes.
   - Receives audit notifications, formulates root-cause analyses, and submits digital CAPA resolutions.
   - Assigns operational tasks to departmental employees and monitors completion milestones.
   - Downloads approved external audit NC documents and executes corrective closures.
5. **Employee / Staff Member (`employee`):**
   - Executes assigned process-related tasks and updates completion status.
   - Accesses approved departmental Forms, Templates, and Reference Procedures.

---

## 3. End-to-End System Workflows Implemented

### 3.1 Controlled Document Lifecycle & Versioning Workflow
```
[Process Owner / Author] ────────> Drafts / Updates Document (v1.0 -> v1.1)
                                                  │
                                                  ▼
                                       Submits for QM Review
                                                  │
                                                  ▼
                                         [QMS Coordinator]
                                                  │
                       ┌──────────────────────────┴──────────────────────────┐
                       ▼                                                     ▼
                  [ Approved ]                                      [ Changes Requested ]
                       │                                                     │
                       ▼                                                     ▼
         Published in Controlled Library                       Returned to Process Owner
         (Immutable Historical Version Retained)                (Author modifies & resubmits)
```
- **Versioning Rule:** Documents cannot be overwritten or deleted. Any revision produces a new version (`v1.0`, `v1.1`, `v2.0`). Prior versions remain indefinitely in the historical ledger.

---

### 3.2 Internal Quality Audit (IQA) 7-Stage Workflow
The application implements an end-to-end 7-stage quality audit protocol:
1. **Stage 1 (Scheduling):** QMS Coordinator selects the target institutional process, sets the inspection date, and assigns an Internal Auditor and Course Coordinator Auditee.
2. **Stage 2 (Schedule Confirmation):** Internal Auditor and Auditee review notifications and confirm acceptance of the audit timetable.
3. **Stage 3 (Audit Conduct):** Auditor conducts process inspection, reviewing files, staff records, and compliance artifacts.
4. **Stage 4 (Noticing Sheet Submission):** Auditor completes the in-system Noticing Sheet, categorizing findings into Non-Conformance (Major/Minor), Observation, or Commendation.
5. **Stage 5 (Auditee Root Cause Notification):** The Auditee receives the Noticing Sheet and initiates investigation.
6. **Stage 6 (CAPA Submission):** Auditee submits digital Corrective and Preventive Action (CAPA), including immediate correction, root-cause analysis, target completion date, and supporting documents.
7. **Stage 7 (Verification & Ratification):** Internal Auditor verifies evidence; QMS Coordinator and Trust Head review the audit report for final executive ratification and formal closure.

---

### 3.3 External Quality Audit (ISO 9001 Surveillance) 5-Step Workflow
Strict sequential enforcement ensures no stage can be accessed until predecessor requirements are fulfilled:
- **Step 1 (Schedule Logging):** External Auditor communicates meeting dates via email; QMS Coordinator logs details into the system.
- **Step 2 (Institutional Broadcast):** QMS Coordinator dispatches automated schedule notices to Trust Head, Course Coordinators, and Internal Auditors.
- **Step 3 (Paper NC Upload):** Following on-site inspection, QMS Coordinator scans and uploads paper NC documentation (shared strictly with affected Course Coordinators).
- **Step 4 (Auditee NC Resolution):** Course Coordinator downloads scanned NC, executes root-cause actions, uploads proof, and marks the NC resolved.
- **Step 5 (ISO Certification & Closure):** External Auditor communicates formal approval; QMS Coordinator closes the cycle and publishes the official ISO 9001 Certificate for all C-DAC stakeholders.

---

### 3.4 Management Review Meeting (MRM) Workflow
1. **Meeting Initiation:** QMS Coordinator creates an MRM session with agenda, scheduled date, venue, and invited leadership.
2. **Review Execution:** Agenda items (audit outcomes, customer feedback, process efficiency) are deliberated.
3. **Minutes of Meeting (MoM) Publishing:** Coordinator drafts MoM and records attendance.
4. **Executive Ratification:** Trust Head reviews published MoM and signs off electronically.
5. **Action Delegation:** Action items with accountable owners and deadlines are created and monitored.

---

## 4. Functional Requirements Matrix

| ID | Module / Category | Requirement Description | Implementation Status |
| :--- | :--- | :--- | :--- |
| **FR-01** | Authentication | Secure user login via email/username and role selector with session persistence (`localStorage` + JWT support). | ✅ Implemented |
| **FR-02** | Role-Based Access Control | Support exactly 5 distinct roles: Trust Head, QMS Coordinator, Course Coordinator, Internal Auditor, and Employee. | ✅ Implemented |
| **FR-03** | Executive Workspace | Dedicated Trust Head dashboard featuring Hope UI 3-Card circular gauges and Executive Wave Chart. | ✅ Implemented |
| **FR-04** | QMS Coordinator Workspace | Central dashboard displaying MRM counts, process registers, audit schedules, and controlled document counts. | ✅ Implemented |
| **FR-05** | Course Coordinator Workspace | Departmental dashboard with assigned processes, task trackers, MRM notifications, and document repositories. | ✅ Implemented |
| **FR-06** | Internal Auditor Workspace | Dedicated interface displaying scheduled audits, pending Noticing Sheets, and MoM downloads. | ✅ Implemented |
| **FR-07** | Controlled Document Repository | Centralized listing of all institutional documents with filtering by type (Forms, Templates, Procedures) and status. | ✅ Implemented |
| **FR-08** | Document Versioning Engine | Automatic semantic version incrementation (`v1.0` $\rightarrow$ `v1.1` $\rightarrow$ `v2.0`); immutable archival of older versions. | ✅ Implemented |
| **FR-09** | Document Review Workflow | QMS Coordinator can approve documents or request revisions with timestamped feedback comments. | ✅ Implemented |
| **FR-10** | Document In-App Preview | Built-in viewer for controlled documents with full metadata display (author, approver, dates, version). | ✅ Implemented |
| **FR-11** | Internal Audit Scheduling | QMS Coordinator can schedule audits specifying process, date, auditor, and auditee. | ✅ Implemented |
| **FR-12** | IQA Noticing Sheets | Auditor submits digital Noticing Sheets recording NC details, category, and remarks. | ✅ Implemented |
| **FR-13** | Auditee CAPA Submission | Course Coordinators submit corrective action plans and remediation evidence for noted audit findings. | ✅ Implemented |
| **FR-14** | Audit Closure & Ratification | Multi-tier sign-off by Auditor verification, Coordinator review, and Trust Head executive ratification. | ✅ Implemented |
| **FR-15** | External Audit Step 1 (Log) | Logging incoming external surveillance schedule and inspection agenda. | ✅ Implemented |
| **FR-16** | External Audit Step 2 (Share) | System-wide dispatch of audit timetable to Trust Head, Internal Auditors, and Course Coordinators. | ✅ Implemented |
| **FR-17** | External Audit Step 3 (Paper NC)| Secure upload of scanned paper NC documents restricted strictly to affected Course Coordinators. | ✅ Implemented |
| **FR-18** | External Audit Step 4 (Closure)| Course Coordinator downloads NC, uploads corrective resolution evidence, and submits closure. | ✅ Implemented |
| **FR-19** | External Audit Step 5 (Cert) | Process completion and public availability of downloadable ISO 9001 Certificate. | ✅ Implemented |
| **FR-20** | MRM Scheduling & Agenda | Scheduling review meetings with structured quality agenda and participant notifications. | ✅ Implemented |
| **FR-21** | MRM MoM Publication | Drafting, attendance recording, and official publication of Minutes of Meeting. | ✅ Implemented |
| **FR-22** | Trust Head MRM Ratification | Executive review and one-click ratification of published MoM. | ✅ Implemented |
| **FR-23** | MRM Action Item Tracking | Tracking actionable decisions resulting from MRMs with assignees and due dates. | ✅ Implemented |
| **FR-24** | Process Register | Cataloging organizational processes with assigned owners, status, and associated documents. | ✅ Implemented |
| **FR-25** | Employee Task Assignment | Process Owners assign departmental tasks with due dates, priorities, and descriptions. | ✅ Implemented |
| **FR-26** | User Account Administration | QMS Coordinator interface to view user profiles, departments, active statuses, and roles. | ✅ Implemented |
| **FR-27** | Real-Time Notification System | Notification badge with unread counters and automated notifications for all workflow milestones. | ✅ Implemented |
| **FR-28** | Immutable Audit Trail | Global activity timeline recording actor, action type, affected resource, and ISO timestamps. | ✅ Implemented |
| **FR-29** | Unified Card Typography | Standardized `13px` font size across all KPI cards, matching sidebar navigation scale. | ✅ Implemented |
| **FR-30** | Motion & Reveal Animation | Smooth entrance animations (`pageFadeInSlow`, `cardFloatSlow`, `modalRevealSlow`) with cascade delays. | ✅ Implemented |

---

## 5. UI/UX Design System & Interface Specifications

### 5.1 Design Architecture & Color Palette
The interface adopts the **Hope UI Enterprise Design Standard** paired with the **Pure Premium Stay Blue** organizational theme:
- **Navy Primary / Ink (`#050B3B`):** All headings, primary metrics, card titles, and active nav states.
- **Deep Slate / Royal Blue (`#0C1979`, `#384FB8`):** Buttons, active icons, progress gauges, and chart lines.
- **Pale Blue Soft Canvas (`#F6F7FF`, `#EBEDFE`):** App shell background, gauge tracks, and hover pills.
- **Dividers & Subtle Borders (`#DCE2F5`, `#E9EDF7`):** Card borders, modal outlines, and form fields.
- **Universal Zero-Border Button Aesthetic:** Seamless interactive buttons with clean background tokens and zero border lines.

### 5.2 3-Card KPI Gauge Indicator System
- All workspace dashboards utilize a standardized 3-card grid (`stats-grid three-col`).
- Each card incorporates an animated circular SVG gauge (`38px` diameter) with an inner diagonal status arrow (`ArrowUpRight` or `ArrowDownRight`) and a radial sweep filling from 0% to the target metric over `1.2s`.
- Metrics, labels, and hints are unified to a crisp, high-density **`13px`** font size matching the sidebar navigation.

### 5.3 Executive Wave Chart Component
- Smooth cubic-bezier spline SVG chart rendering multi-series performance curves (Process Completion vs. Audit Compliance).
- Interactive mouse hover inspection with dynamic floating tooltips.
- Timeframe filter dropdown (This Year, This Quarter, This Month) updating dataset arrays smoothly.

### 5.4 Motion & Reveal System
- **Page Entrance (`pageFadeInSlow`):** `0.65s` smooth fade-in and slide-up (`translateY(18px)` $\rightarrow$ `0`) on every route change.
- **Staggered Card Cascades (`cardFloatSlow`):** Progressive micro-delays (`50ms`, `130ms`, `210ms`) for a luxurious waterfall entrance.
- **Modal Pop & Backdrop Fade (`modalRevealSlow`):** Background gently blurs with `backdrop-filter: blur(6px)` while dialog expands smoothly (`scale(0.92)` $\rightarrow$ `scale(1)` with `translateY(24px)` $\rightarrow$ `0`).
- **Accessibility:** Full `@media (prefers-reduced-motion: reduce)` support for users with motion sensitivity.

---

## 6. Software Architecture & Database Schema

### 6.1 Technology Stack
- **Frontend:** React 18, Vite 8, React Router v6, Lucide React Icons, Pure CSS3 Design System.
- **Backend:** Node.js, Express.js REST API with modular controllers, routes, and services.
- **Database:** MongoDB Atlas with Mongoose ODM schemas.
- **Hosting & CI/CD:** Live deployment on **Vercel** with GitHub continuous deployment (`origin/main`).

### 6.2 Data Models & Entities (Mongoose Collections)

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│              User               │           │             Process             │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ _id: ObjectId                   │           │ _id: ObjectId                   │
│ name: String                    │ 1       * │ name: String                    │
│ email: String                   ├──────────>│ code: String                    │
│ role: Enum (head, qm, etc.)     │           │ owner: Ref(User)                │
│ department: String              │           │ status: Enum (Active, Review)   │
│ active: Boolean                 │           └────────────────┬────────────────┘
└────────────────┬────────────────┘                            │
                 │                                             │ 1
                 │ 1                                           │
                 │                                             │ *
                 ▼ *                                           ▼
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│            Document             │           │         DocumentVersion         │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ _id: ObjectId                   │ 1       * │ _id: ObjectId                   │
│ title: String                   ├──────────>│ documentId: Ref(Document)       │
│ type: Enum (Form, Template,...) │           │ versionNumber: String           │
│ processId: Ref(Process)         │           │ content: String / fileUrl       │
│ currentVersion: String          │           │ author: Ref(User)               │
│ status: Enum (Draft, Approved)  │           │ approvedBy: Ref(User)           │
└─────────────────────────────────┘           │ changeNotes: String             │
                                              └─────────────────────────────────┘

┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│          Audit (IQA)            │           │          ExternalAudit          │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ _id: ObjectId                   │           │ _id: ObjectId                   │
│ auditNumber: String             │           │ cycleTitle: String              │
│ processId: Ref(Process)         │           │ agencyName: String              │
│ auditorId: Ref(User)            │           │ currentStep: Number (1 - 5)     │
│ auditeeId: Ref(User)            │           │ scheduledDate: Date             │
│ scheduleDate: Date              │           │ scannedNCDocUrl: String         │
│ stage: Number (1 - 7)           │           │ ncResolutionProof: String       │
│ noticingSheet: Object           │           │ certificateUrl: String          │
│ capa: Object                    │           │ status: Enum (Active, Closed)   │
│ executiveRatified: Boolean      │           └─────────────────────────────────┘
└─────────────────────────────────┘
```

1. **User Collection:** Identity, email, credentials, assigned role (`head`, `qm`, `owner`, `auditor`, `employee`), and department.
2. **Process Collection:** Registered institutional processes, process codes, and assigned Course Coordinator owners.
3. **Document & DocumentVersion Collections:** Document master record paired with an immutable array of historical versions containing file URLs, authors, timestamps, and review decisions.
4. **Audit (IQA) Collection:** Tracks 7-stage internal audit instances, dates, scheduled auditor/auditee, Noticing Sheet remarks, CAPA submission artifacts, and ratification sign-offs.
5. **ExternalAudit Collection:** Manages 5-step ISO 9001 surveillance cycles, email schedule records, scanned NC file attachments, auditee CAPA resolutions, and certificate links.
6. **MRM Collection:** Meeting schedules, agendas, recorded attendees, uploaded/drafted Minutes of Meeting, Trust Head approvals, and assigned action deliverables.
7. **Task Collection:** Operational tasks linked to processes, assignees, priorities, due dates, and completion status flags.
8. **Notification Collection:** Real-time user alert records with unread states, direct route links, and event categories.

---

## 7. Non-Functional Requirements (NFR)

- **NFR-01 Security & Access Isolation:** Protected routes verify user role tokens; Course Coordinators can only modify their own processes; Trust Head alone can ratify MRMs and audits.
- **NFR-02 Data Immutability & Audit Integrity:** No document version or audit report can be destructively edited; all state changes generate timestamped log entries.
- **NFR-03 Usability & High-Density UI:** Clean, modern interface with zero visual clutter; uniform 13px typography avoids awkward line-wrapping on tablet and laptop screens.
- **NFR-04 Performance & Responsiveness:** Production build bundles minified to `<650KB` gzip; instant client-side transitions under `50ms`; lightweight SVG wave charts render at 60 FPS without external chart library overhead.
- **NFR-05 Reliability & Offline Resilience:** Resilient local storage session fallback ensures the portal continues uninterrupted during transient network disconnects.

---

## 8. Verification & Deployment Status

- **Code Repository:** Public GitHub Repository at [https://github.com/Kiruthika-SK-06/QMS.git](https://github.com/Kiruthika-SK-06/QMS.git)
- **Production Build:** Verified cleanly with zero Vite build warnings or syntax errors.
- **Live Deployment:** Continuously deployed and accessible on **Vercel**.
- **Current Milestone:** All 30+ functional requirements, 5 role workflows, 3-card gauge KPI dashboards, executive wave chart, and slow reveal animations are fully completed and tested.
