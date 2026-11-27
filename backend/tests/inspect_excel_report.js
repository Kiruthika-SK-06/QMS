import ExcelJS from "exceljs";

async function inspectWorkbook() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("CDAC_QMS_Testing_Report_FR01_to_FR44.xlsx");

  console.log("Workbook Worksheets Count:", workbook.worksheets.length);
  workbook.worksheets.forEach((ws, idx) => {
    console.log(`Sheet ${idx + 1}: "${ws.name}" - Rows: ${ws.rowCount}, Columns: ${ws.columnCount}`);
  });

  // Check Summary sheet
  const wsSum = workbook.getWorksheet("Test Execution Summary");
  console.log("\nSummary Sheet Content:");
  wsSum.eachRow((row, rowNumber) => {
    console.log(`  Row ${rowNumber}: ${row.getCell(1).value} -> ${row.getCell(2).value}`);
  });

  // Check Defect sheet
  const wsDef = workbook.getWorksheet("Defect Report");
  console.log("\nDefect Sheet Content:");
  wsDef.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      console.log(`  Defect: ${row.getCell(1).value} | FR: ${row.getCell(2).value} | TC: ${row.getCell(4).value} | Expected: ${row.getCell(6).value} | Actual: ${row.getCell(7).value}`);
    }
  });

  // Check RTM sheet
  const wsRTM = workbook.getWorksheet("Requirement Traceability Matrix");
  let compliantCount = 0;
  let nonCompliantCount = 0;
  wsRTM.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const status = row.getCell(8).value;
      if (status === "COMPLIANT") compliantCount++;
      else nonCompliantCount++;
    }
  });
  console.log(`\nRTM Coverage: Compliant FRs: ${compliantCount}, Non-Compliant FRs: ${nonCompliantCount}, Total: ${compliantCount + nonCompliantCount}`);
}

inspectWorkbook().catch(console.error);
