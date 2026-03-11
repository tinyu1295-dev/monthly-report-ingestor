// src/extractors/findPeriodColumns.js
const { cellToText } = require("../utils/cellValue");

const PERIOD_LABELS = [
    { key: "prior_month", jp: ["前月実績", "前月"] },
    { key: "current_month", jp: ["当月見込", "当月"] },
    { key: "next_month_forecast", jp: ["次月予測", "翌月", "次月"] },
];

/**
 * Scan the sheet to find which columns correspond to prior/current/next.
 * Returns { prior_month: col, current_month: col, next_month_forecast: col, headerRow }
 */
function findPeriodColumns(ws, opts = {}) {
    const maxRows = opts.maxRows ?? Math.min(ws.rowCount || 200, 80);
    const maxCols = opts.maxCols ?? Math.min(ws.columnCount || 50, 60);

    let best = { score: 0, headerRow: null, cols: {} };

    for (let r = 1; r <= maxRows; r++) {
        const cols = {};
        let score = 0;

        for (let c = 1; c <= maxCols; c++) {
            const t = cellToText(ws.getCell(r, c)).trim();
            if (!t) continue;

            for (const p of PERIOD_LABELS) {
                if (p.jp.some((x) => t.includes(x))) {
                    cols[p.key] = c;
                }
            }
        }

        for (const p of PERIOD_LABELS) {
            if (cols[p.key]) score += 1;
        }

        if (score > best.score) best = { score, headerRow: r, cols };
        if (best.score === 3) break; // perfect match
    }

    if (best.score < 2) {
        return { prior_month: null, current_month: null, next_month_forecast: null, headerRow: null };
    }

    return {
        prior_month: best.cols.prior_month ?? null,
        current_month: best.cols.current_month ?? null,
        next_month_forecast: best.cols.next_month_forecast ?? null,
        headerRow: best.headerRow,
    };
}

module.exports = { findPeriodColumns };