function pad2(n) {
    return String(n).padStart(2, "0");
}

function formatYearMonth(date) {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

function addMonthsUtc(date, delta) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

function parseYearMonth(value) {
    if (!value) return null;

    const s = String(value).trim();

    // 2026-02 / 2026/02 / 2026.02
    let m = s.match(/^(\d{4})[-/.](\d{1,2})$/);
    if (m) {
        const year = Number(m[1]);
        const month = Number(m[2]);
        if (month >= 1 && month <= 12) {
            return `${year}-${pad2(month)}`;
        }
    }

    // 2026年2月
    m = s.match(/^(\d{4})年(\d{1,2})月$/);
    if (m) {
        const year = Number(m[1]);
        const month = Number(m[2]);
        if (month >= 1 && month <= 12) {
            return `${year}-${pad2(month)}`;
        }
    }

    // 2月 -> year unknown, reject here
    return null;
}

function parseYearMonthFromFilename(fileName) {
    if (!fileName) return null;

    const s = String(fileName);

    // CURRENT-2026_02.xlsx / AGL_2026_02.xlsx / 2026-02-report.xlsx
    let m = s.match(/(20\d{2})[_-](\d{1,2})/);
    if (m) {
        const year = Number(m[1]);
        const month = Number(m[2]);
        if (month >= 1 && month <= 12) {
            return `${year}-${pad2(month)}`;
        }
    }

    return null;
}

function deriveReportPeriods({ reportingMonth, fileName, submissionTimestamp }) {
    let currentMonth = parseYearMonth(reportingMonth);

    if (!currentMonth) {
        currentMonth = parseYearMonthFromFilename(fileName);
    }

    if (!currentMonth) {
        const base = submissionTimestamp ? new Date(submissionTimestamp) : new Date();
        currentMonth = formatYearMonth(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1)));
    }

    const [yearStr, monthStr] = currentMonth.split("-");
    const baseDate = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));

    return {
        reportingMonth: currentMonth,
        priorMonth: formatYearMonth(addMonthsUtc(baseDate, -1)),
        currentMonth,
        nextMonth: formatYearMonth(addMonthsUtc(baseDate, 1)),
    };
}

module.exports = { deriveReportPeriods };