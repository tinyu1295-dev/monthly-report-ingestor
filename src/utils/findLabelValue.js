// src/utils/findLabelValue.js
const { cellToText } = require("./cellValue");

/**
 * Find a label in the sheet and return the value from a nearby cell (default: right cell).
 *
 * Options:
 * - maxRows / maxCols: scan limits
 * - label: string to match (exact or includes)
 * - match: "equals" | "includes"
 * - valueOffset: [rowOffset, colOffset] from label cell (default [0, 1])
 */
function findLabelValue(ws, {
    label,
    match = "equals",
    valueOffset = [0, 1],
    maxRows = 80,
    maxCols = 30
}) {
    const target = String(label).trim();

    for (let r = 1; r <= Math.min(ws.rowCount || maxRows, maxRows); r++) {
        for (let c = 1; c <= Math.min(ws.columnCount || maxCols, maxCols); c++) {
            const t = cellToText(ws.getCell(r, c)).trim();
            if (!t) continue;

            const hit =
                match === "includes" ? t.includes(target) : t === target;

            if (!hit) continue;

            const rr = r + valueOffset[0];
            const cc = c + valueOffset[1];
            const v = cellToText(ws.getCell(rr, cc)).trim();
            return {
                found: true,
                labelCell: { r, c },
                valueCell: { r: rr, c: cc },
                valueText: v
            };
        }
    }

    return { found: false, valueText: "" };
}

module.exports = { findLabelValue };