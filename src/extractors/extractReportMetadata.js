// src/extractors/extractReportMetadata.js
const { findLabelValue } = require("../utils/findLabelValue");
const { cellToText } = require("../utils/cellValue");

/**
 * Extracts report metadata from a JP monthly report sheet.
 * Returns { report_metadata, warnings }
 */
function extractReportMetadata(ws) {
    const warnings = [];

    const company = findLabelValue(ws, { label: "会社名", match: "equals", valueOffset: [0, 1] });
    const responsible = findLabelValue(ws, { label: "責任者", match: "equals", valueOffset: [0, 1] });
    const reportMonth = findLabelValue(ws, { label: "報告月", match: "equals", valueOffset: [0, 1] });

    const companyName = company.found ? company.valueText : "";
    const responsiblePerson = responsible.found ? responsible.valueText : "";

    // 報告月 can be a date, a string, or an Excel error like #REF!
    let reportMonthText = "";
    if (reportMonth.found) {
        reportMonthText = reportMonth.valueText;
        if (!reportMonthText || reportMonthText === "#REF!") {
            warnings.push({
                code: "REPORT_MONTH_MISSING_OR_ERROR",
                message: `報告月 is missing or error (${reportMonthText || "blank"})`,
                labelCell: reportMonth.labelCell
            });
            reportMonthText = ""; // keep blank for now; later we can infer from filename or submission date
        }
    } else {
        warnings.push({
            code: "REPORT_MONTH_LABEL_NOT_FOUND",
            message: "Could not find 報告月 label in sheet"
        });
    }

    if (!companyName) {
        warnings.push({ code: "COMPANY_NAME_MISSING", message: "会社名 not found or blank" });
    }
    if (!responsiblePerson) {
        warnings.push({ code: "RESPONSIBLE_MISSING", message: "責任者 not found or blank" });
    }

    // Keep structure simple for now; we’ll map to the PDF contract keys later.
    const report_metadata = {
        companyName_jp: companyName,
        responsiblePerson: responsiblePerson,
        reportingMonth: reportMonthText
    };

    return { report_metadata, warnings };
}

module.exports = { extractReportMetadata };