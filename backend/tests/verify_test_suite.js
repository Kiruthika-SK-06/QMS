import fs from "fs";

const content = fs.readFileSync("backend/tests/run_all_44_fr_tests.js", "utf8");

const tcRegex = /testCaseId:\s*["']([^"']+)["'],\s*frId:\s*["']([^"']+)["'],\s*frName:\s*["']([^"']+)["']/g;
const matches = [];
let match;
while ((match = tcRegex.exec(content)) !== null) {
  matches.push({
    testCaseId: match[1],
    frId: match[2],
    frName: match[3]
  });
}

console.log("Total Test Cases in run_all_44_fr_tests.js:", matches.length);

const frMap = {};
for (let i = 1; i <= 44; i++) {
  const frKey = `FR-${String(i).padStart(2, "0")}`;
  frMap[frKey] = [];
}

matches.forEach((m) => {
  if (frMap[m.frId]) {
    frMap[m.frId].push(m.testCaseId);
  } else {
    frMap[m.frId] = [m.testCaseId];
  }
});

let missingFRs = [];
let coveredFRs = 0;
for (const [fr, tests] of Object.entries(frMap)) {
  if (tests.length === 0) {
    missingFRs.push(fr);
  } else {
    coveredFRs++;
  }
}

console.log(`Covered FRs: ${coveredFRs} / 44`);
console.log(`Missing FRs:`, missingFRs);

// Inspect method calls (fetch / request)
const fetchCalls = [...content.matchAll(/request\(\s*["']([^"']+)["']/g)].map((m) => m[1]);
console.log(`Total API 'request' calls in test script:`, fetchCalls.length);

// Print sample mapping
console.log("\nSample Mapping (First 10 FRs):");
Object.entries(frMap).slice(0, 10).forEach(([fr, tests]) => {
  console.log(`  ${fr}: ${tests.join(", ")}`);
});
