/**
 * Independent Reproduction Script for DEF-002 (FR-36, FR-37, FR-38: External Audit CAPA, Decision, Closure)
 * Tests progression through Stage 1 -> Stage 2 -> Stage 3 -> Stage 4
 * Captures the exact HTTP 400 rejection and server state.
 */

const BASE_URL = "http://localhost:5000";

async function reproduceDEF002() {
  console.log("=================================================");
  console.log("🔍 REPRODUCING DEF-002: External Audit NC Closure (FR-36)");
  console.log("=================================================\n");

  // Step 1: Login as QMS Coordinator
  console.log("Step 1: Authenticating as QMS Coordinator (qm@cdac.in)...");
  const loginQm = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "qm@cdac.in", password: "1234", role: "qm" })
  });
  const qmData = await loginQm.json();
  const qmToken = qmData.token;

  // Step 2: Login as Course Coordinator
  console.log("Step 2: Authenticating as Course Coordinator (coordinator@cdac.in)...");
  const loginCc = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "coordinator@cdac.in", password: "1234", role: "owner" })
  });
  const ccData = await loginCc.json();
  const ccToken = ccData.token;

  // Step 3: Create External Audit (Stage 1)
  console.log("\nStep 3: Creating External Audit (Stage 1)...");
  const createRes = await fetch(`${BASE_URL}/api/external-audit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${qmToken}`
    },
    body: JSON.stringify({
      title: `DEF-002 External Audit ${Date.now()}`,
      scheduledDate: "2026-12-28",
      externalAgency: "TÜV SÜD South Asia"
    })
  });
  const createData = await createRes.json();
  const auditId = createData.data?.id;
  console.log(`External Audit created: ${auditId}, Stage: ${createData.data?.stage}`);

  // Step 4: Share Schedule with Stakeholders (Stage 1 -> Stage 2)
  console.log(`\nStep 4: Sharing schedule for ${auditId} (Stage 1 -> 2)...`);
  const shareRes = await fetch(`${BASE_URL}/api/external-audit/${auditId}/share-schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${qmToken}`
    },
    body: JSON.stringify({ noticeSubject: "Official Notice" })
  });
  const shareData = await shareRes.json();
  console.log(`Share Status: ${shareRes.status}, Stage: ${shareData.data?.stage}`);

  // Step 5: Upload Scanned NC Document (Stage 2 -> Stage 3)
  console.log(`\nStep 5: Uploading Scanned NC Document for ${auditId} (Stage 2 -> 3)...`);
  const ncRes = await fetch(`${BASE_URL}/api/external-audit/${auditId}/upload-nc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${qmToken}`
    },
    body: JSON.stringify({
      fileName: "Scanned_Physical_Paper_NC_Report.pdf",
      summary: "Minor documentation gaps identified during physical campus audit."
    })
  });
  const ncData = await ncRes.json();
  console.log(`Upload NC Status: ${ncRes.status}, Stage: ${ncData.data?.stage}, ncDocument populated: ${!!ncData.data?.ncDocument}`);

  // Step 6: Course Coordinator attempts to close NC (Stage 3 -> Stage 4)
  console.log(`\nStep 6: Course Coordinator calls POST /api/external-audit/${auditId}/close-nc (Stage 3 -> 4)...`);
  const closeRes = await fetch(`${BASE_URL}/api/external-audit/${auditId}/close-nc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ccToken}`
    },
    body: JSON.stringify({
      remarks: "Counter-signature procedures implemented.",
      actionPlan: "Standard operating checklist deployed across division."
    })
  });

  const status = closeRes.status;
  const body = await closeRes.json();

  console.log("\n-------------------------------------------------");
  console.log("📊 REPRODUCTION RESULT FOR DEF-002:");
  console.log(`HTTP Status Code: ${status}`);
  console.log("Response Body:", JSON.stringify(body, null, 2));
  console.log("-------------------------------------------------");

  if (status === 400 && body.message?.includes("Scanned NC document must be uploaded")) {
    console.log("❌ CONFIRMED DEFECT: DEF-002 successfully reproduced! Returned HTTP 400 with premature predecessor stage error.");
  } else if (status === 200) {
    console.log("✓ UNEXPECTED PASS: DEF-002 did not trigger HTTP 400.");
  } else {
    console.log(`⚠️  UNEXPECTED CODE: Returned HTTP ${status}.`);
  }
}

reproduceDEF002().catch(console.error);
