/**
 * Independent Reproduction Script for DEF-001 (FR-24: MRM Publication)
 * Attempts to publish/share an MRM meeting via POST /api/mrm/:id/share-email
 * Captures the exact HTTP response code, response body, and server behavior.
 */

const BASE_URL = "http://localhost:5000";

async function reproduceDEF001() {
  console.log("=================================================");
  console.log("🔍 REPRODUCING DEF-001: MRM Publication (FR-24)");
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
  console.log(`QMS Coordinator Token acquired: ${!!qmToken}`);

  // Step 2: Login as Trust Head
  console.log("Step 2: Authenticating as Trust Head (head@cdac.in)...");
  const loginHead = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "head@cdac.in", password: "1234", role: "Head" })
  });
  const headData = await loginHead.json();
  const headToken = headData.token;
  console.log(`Trust Head Token acquired: ${!!headToken}`);

  // Step 3: QMS Coordinator creates a new MRM meeting
  const mrmTitle = `DEF-001 Reproduction MRM - ${Date.now()}`;
  console.log(`\nStep 3: Creating MRM '${mrmTitle}'...`);
  const createRes = await fetch(`${BASE_URL}/api/mrm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${qmToken}`
    },
    body: JSON.stringify({
      title: mrmTitle,
      scheduledDate: "2026-12-10",
      venue: "Boardroom A",
      agenda: ["Review quality performance", "Internal audit overview"]
    })
  });
  const createData = await createRes.json();
  const mrmId = createData.data?.id;
  console.log(`MRM created with ID: ${mrmId}, HTTP Status: ${createRes.status}`);

  // Step 4: Trust Head approves the MRM meeting
  console.log(`\nStep 4: Trust Head approves MRM ${mrmId}...`);
  const approveRes = await fetch(`${BASE_URL}/api/mrm/${mrmId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${headToken}`
    },
    body: JSON.stringify({
      comments: "Approved by Trust Head for scheduling."
    })
  });
  const approveData = await approveRes.json();
  console.log(`Approval Status: ${approveRes.status}, MRM Status: ${approveData.data?.status}`);

  // Step 5: QMS Coordinator attempts to dispatch/share meeting notice via email
  console.log(`\nStep 5: QMS Coordinator calling POST /api/mrm/${mrmId}/share-email...`);
  const shareRes = await fetch(`${BASE_URL}/api/mrm/${mrmId}/share-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${qmToken}`
    },
    body: JSON.stringify({
      recipients: ["coordinator@cdac.in", "head@cdac.in"]
    })
  });

  const status = shareRes.status;
  let body;
  try {
    body = await shareRes.json();
  } catch (e) {
    body = await shareRes.text();
  }

  console.log("\n-------------------------------------------------");
  console.log("📊 REPRODUCTION RESULT FOR DEF-001:");
  console.log(`HTTP Status Code: ${status}`);
  console.log("Response Body:", JSON.stringify(body, null, 2));
  console.log("-------------------------------------------------");

  if (status === 500) {
    console.log("❌ CONFIRMED DEFECT: DEF-001 successfully reproduced! Returned HTTP 500 Internal Server Error.");
  } else if (status === 200) {
    console.log("✓ UNEXPECTED PASS: DEF-001 did not trigger HTTP 500.");
  } else {
    console.log(`⚠️  UNEXPECTED CODE: Returned HTTP ${status}.`);
  }
}

reproduceDEF001().catch(console.error);
