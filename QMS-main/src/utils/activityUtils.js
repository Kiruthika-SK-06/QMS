/**
 * Extracts clean Title and essential Details from activity items,
 * preventing verbose or run-on sentences in dashboard and activity views.
 */
export function getActivitySummary(item) {
  if (!item) {
    return { title: "Activity Updated", detail: "" };
  }

  // If already structured
  if (item.title && item.detail) {
    return { title: item.title, detail: item.detail };
  }

  const raw = String(item.text || item.title || "").trim();
  if (!raw) {
    return { title: "Activity", detail: "" };
  }

  // 1. MRM Approval by Team Head / Trust Head
  if (/approved by team head/i.test(raw)) {
    const match = raw.match(/"([^"]+)"/);
    return {
      title: "MRM Approved",
      detail: match ? match[1] : "Approved by Team Head"
    };
  }
  if (/approved by trust head/i.test(raw) || /mrm mom approved/i.test(raw)) {
    const match = raw.match(/"([^"]+)"/);
    return {
      title: "MRM Approved",
      detail: match ? match[1] : "Trust Head Sign-off"
    };
  }

  // 2. MRM Notification Email
  if (/notification email/i.test(raw) || /email dispatch/i.test(raw)) {
    const match = raw.match(/"([^"]+)"/);
    return {
      title: "MRM Notification Sent",
      detail: match ? match[1] : "Notification sent to team"
    };
  }

  // 3. MRM MoM Upload
  if (/mom.*upload/i.test(raw) || /minutes.*upload/i.test(raw)) {
    const match = raw.match(/"([^"]+)"/);
    return {
      title: "MoM Uploaded",
      detail: match ? match[1] : "Meeting minutes file"
    };
  }

  // 4. MRM Planning / Scheduling
  if (/scheduled new mrm/i.test(raw) || /mrm scheduled/i.test(raw) || /mrm planned/i.test(raw)) {
    const match = raw.match(/"([^"]+)"/);
    return {
      title: "MRM Scheduled",
      detail: match ? match[1] : "Review meeting scheduled"
    };
  }

  // 5. Document Submitted
  if (/document submitted/i.test(raw) || /submitted for.*review/i.test(raw)) {
    const parts = raw.split(":");
    return {
      title: "Document Submitted",
      detail: parts[1] ? parts[1].trim() : "Submitted for review"
    };
  }

  // 6. Document Approved
  if (/document approved/i.test(raw)) {
    const parts = raw.split(":");
    return {
      title: "Document Approved",
      detail: parts[1] ? parts[1].trim() : "Approved"
    };
  }

  // 7. Version Created
  if (/version\s+([0-9.]+)\s+created for\s+(.+)$/i.test(raw)) {
    const match = raw.match(/version\s+([0-9.]+)\s+created for\s+(.+)$/i);
    return {
      title: "New Version Created",
      detail: `${match[2].trim()} (v${match[1]})`
    };
  }

  // 8. Changes Requested
  if (/requested changes/i.test(raw) || /changes requested/i.test(raw)) {
    const match = raw.match(/for\s+(.+)$/i);
    return {
      title: "Changes Requested",
      detail: match ? match[1].trim() : ""
    };
  }

  // 9. Task Assigned
  if (/task assigned to\s+([^:]+):\s*(.+)$/i.test(raw)) {
    const match = raw.match(/task assigned to\s+([^:]+):\s*(.+)$/i);
    return {
      title: "Task Assigned",
      detail: `${match[2].trim()} (${match[1].trim()})`
    };
  }
  if (/task assigned/i.test(raw)) {
    const parts = raw.split(":");
    return {
      title: "Task Assigned",
      detail: parts[1] ? parts[1].trim() : ""
    };
  }

  // 10. Task Completed
  if (/completed task/i.test(raw) || /task completed/i.test(raw)) {
    const parts = raw.split(":");
    return {
      title: "Task Completed",
      detail: parts[1] ? parts[1].trim() : ""
    };
  }

  // 11. User Management
  if (/new user account created/i.test(raw) || /user created/i.test(raw)) {
    const match = raw.match(/created:\s*([^.(]+)/i);
    return {
      title: "User Created",
      detail: match ? match[1].trim() : ""
    };
  }
  if (/user.*updated/i.test(raw)) {
    const match = raw.match(/for\s+([^:]+)/i);
    return {
      title: "User Updated",
      detail: match ? match[1].trim() : ""
    };
  }

  // 12. Document Review
  if (/reviewed\s+(.+)$/i.test(raw)) {
    const match = raw.match(/reviewed\s+(.+)$/i);
    return {
      title: "Document Reviewed",
      detail: match ? match[1].trim() : ""
    };
  }

  // Fallback: If colon exists, split into Title and Detail
  if (raw.includes(":")) {
    const [t, ...rest] = raw.split(":");
    return { title: t.trim(), detail: rest.join(":").trim() };
  }

  // Clean quote extraction
  const quoteMatch = raw.match(/"([^"]+)"/);
  if (quoteMatch) {
    const cleanTitle = raw.replace(/"[^"]+"/, "").trim().replace(/\s+/g, " ");
    return { title: cleanTitle || "Activity", detail: quoteMatch[1] };
  }

  return { title: raw, detail: "" };
}
