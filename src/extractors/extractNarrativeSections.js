const { cellToText } = require("../utils/cellValue");

const HEADER_MAP = [
    {
        key: "pl_highlights",
        patterns: ["PLハイライト"]
    },
    {
        key: "customer_trends",
        patterns: ["顧客の動向", "顧客動向"]
    },
    {
        key: "management_status",
        patterns: ["経営状況", "稼働状態", "商流情報"]
    },
    {
        key: "internal_status",
        patterns: ["社内の状況", "社内状況", "社員情報"]
    },
];

function normalizeLine(s) {
    return String(s || "").replace(/\s+$/g, "").trim();
}

function findHeaders(ws, maxRows, maxCols) {
    const hits = [];

    for (let r = 1; r <= maxRows; r++) {
        for (let c = 1; c <= maxCols; c++) {
            const text = cellToText(ws.getCell(r, c)).trim();
            if (!text) continue;

            for (const h of HEADER_MAP) {
                if (h.patterns.some((p) => text.includes(p))) {
                    hits.push({
                        key: h.key,
                        row: r,
                        col: c,
                        text,
                    });
                    break;
                }
            }
        }
    }

    // keep first occurrence per row/key pair
    hits.sort((a, b) => a.row - b.row || a.col - b.col);

    const deduped = [];
    const seen = new Set();
    for (const h of hits) {
        const sig = `${h.key}:${h.row}`;
        if (seen.has(sig)) continue;
        seen.add(sig);
        deduped.push(h);
    }

    return deduped;
}

function extractSectionText(ws, startRow, endRow, maxCols) {
    const lines = [];

    for (let r = startRow; r <= endRow; r++) {
        const rowTexts = [];

        for (let c = 1; c <= maxCols; c++) {
            const t = cellToText(ws.getCell(r, c)).trim();
            if (t) rowTexts.push(t);
        }

        const joined = normalizeLine(rowTexts.join(" "));
        if (joined) lines.push(joined);
    }

    return lines.join("\n").trim();
}

function extractNarrativeSections(ws, opts = {}) {
    const maxRows = opts.maxRows ?? Math.min(ws.rowCount || 200, 200);
    const maxCols = opts.maxCols ?? 12;

    const headers = findHeaders(ws, maxRows, maxCols);

    const result = {
        pl_highlights: "",
        customer_trends: "",
        management_status: "",
        internal_status: "",
        warnings: [],
    };

    // Prefer the main headers if present
    const mainHeaders = headers.filter((h) =>
        ["pl_highlights", "customer_trends", "management_status", "internal_status"].includes(h.key)
    );

    for (let i = 0; i < mainHeaders.length; i++) {
        const current = mainHeaders[i];
        const next = mainHeaders[i + 1];

        const startRow = current.row + 1;
        const endRow = next ? next.row - 1 : maxRows;

        result[current.key] = extractSectionText(ws, startRow, endRow, maxCols);
    }

    for (const expected of ["pl_highlights", "customer_trends", "management_status", "internal_status"]) {
        if (!mainHeaders.some((h) => h.key === expected)) {
            result.warnings.push({
                code: "NARRATIVE_HEADER_NOT_FOUND",
                key: expected,
                message: `Header not found for ${expected}`,
            });
        }
    }

    return result;
}

module.exports = { extractNarrativeSections };