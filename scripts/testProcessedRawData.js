const path = require("path");
const ExcelJS = require("exceljs");

const { extractReportMetadata } = require("../src/extractors/extractReportMetadata");
const { findPeriodColumns } = require("../src/extractors/findPeriodColumns");
const { extractTopKpis } = require("../src/extractors/extractTopKpis");
const { extractDetailedPeriodBlocks } = require("../src/extractors/extractDetailedPeriodBlocks");
const { extractNarrativeSections } = require("../src/extractors/extractNarrativeSections");

const { buildFinancialTables } = require("../src/builders/buildFinancialTables");
const { buildProcessedRawData } = require("../src/builders/buildProcessedRawData");
const { extractOperationalMetrics } = require("../src/extractors/extractOperationalMetrics");
const { deriveReportPeriods } = require("../src/utils/deriveReportPeriods");

// const { db } = require("../scripts/config/firebase");

const { bucket, db } = require("../scripts/config/firebase");


function normalizeCompanyId(sheetName) {
    return String(sheetName || "")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[\/\\#?%*:|"<>]/g, "_")
        .slice(0, 120);
}

function buildReportId(companyCode, submissionTimestampIso) {
    const ts = String(submissionTimestampIso).replace(/[:.]/g, "-");
    return `${companyCode}_${ts}_monthly_report`;
}

async function main() {
    const file = process.argv[2];
    if (!file) {
        console.error("Usage: node scripts/testProcessedRawData.js <xlsx-path>");
        process.exit(1);
    }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);

    const submissionTimestamp = new Date().toISOString();
    const fileName = path.basename(file);

    for (const ws of wb.worksheets) {
        // const companyCode = normalizeCompanyId(ws.name);
        // const reportId = buildReportId(companyCode, submissionTimestamp);

        // const metadataOut = extractReportMetadata(ws);
        // const reportMetadata = metadataOut.report_metadata;

        const metadataOut = extractReportMetadata(ws);
        const reportMetadata = metadataOut.report_metadata;

        const extractedCompanyName = reportMetadata.companyName_jp || ws.name;
        const companyCode = normalizeCompanyId(extractedCompanyName);
        const reportId = buildReportId(companyCode, submissionTimestamp);



        const periodCols = findPeriodColumns(ws);
        const topKpis = extractTopKpis(ws, periodCols, { endRow: periodCols.headerRow + 15 });
        const detailedBlocks = extractDetailedPeriodBlocks(ws);
        const financialTables = buildFinancialTables(topKpis, detailedBlocks);

        const narrativeOut = extractNarrativeSections(ws);

        const warnings = [
            ...(metadataOut.warnings || []),
            ...(topKpis.warnings || []),
            ...(detailedBlocks.warnings || []),
            ...(narrativeOut.warnings || []),
        ];

        const operationalMetrics = extractOperationalMetrics(ws);
        // console.dir(operationalMetrics, { depth: null });

        const periods = deriveReportPeriods({
            reportingMonth: reportMetadata.reportingMonth,
            fileName,
            submissionTimestamp,
        });
        const processedRawData = buildProcessedRawData({
            reportId,
            companyCode,
            companyName: reportMetadata.companyName_jp,
            companyNameJp: reportMetadata.companyName_jp,
            fileName,
            gsPath: null,
            storagePath: null,
            submissionTimestamp,
            reportMetadata,
            financialTables,
            operationalMetrics,
            narrativeSections: narrativeOut,
            extractionMetadata: {
                extracted_at: new Date().toISOString(),
                method: "exceljs_parser_v1",
                confidence: warnings.length ? 0.7 : 0.9,
                warnings,
                sheetName: ws.name,
            },
            periods
        });

        console.log("==================================================");
        console.log(`Sheet: ${ws.name}`);
        console.dir(processedRawData, { depth: null });

        await db
            .collection("processed_raw_data")
            .doc(processedRawData.report_id)
            .set(processedRawData);

        console.log("Uploaded report:", processedRawData.report_id);
    }

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const timestamp = Date.now();

    const destination =
        `monthly_reports/${year}/${month}/${timestamp}_${fileName}`;

    console.log("Uploading to:", destination);

    await bucket.upload(file, {
        destination,
        metadata: {
            contentType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });

    console.log("Upload complete :", destination);

    return destination;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});