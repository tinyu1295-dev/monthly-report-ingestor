// src/utils/cellValue.js

function isValidDate(d) {
    return d instanceof Date && !Number.isNaN(d.getTime());
}

/**
 * Convert ExcelJS cell.value into a printable string for debugging / label scanning.
 */
function cellToText(cell) {
    const v = cell?.value;
    if (v == null) return "";

    // Plain primitives
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);

    // Dates
    if (v instanceof Date) {
        return isValidDate(v) ? v.toISOString() : "";
    }

    // ExcelJS object types
    if (typeof v === "object") {
        // Excel error: { error: '#REF!' } (or similar)
        if (typeof v.error === "string") return v.error;

        // Formula: { formula: '...', result: ... }
        if (Object.prototype.hasOwnProperty.call(v, "formula")) {
            const r = v.result;

            if (r == null) return "";
            if (typeof r === "number") return String(r);
            if (typeof r === "string") return r;
            if (r instanceof Date) return isValidDate(r) ? r.toISOString() : "";

            // Sometimes result is an Excel error object
            if (typeof r === "object" && r && typeof r.error === "string") return r.error;

            return "";
        }

        // Rich text: { richText: [{ text: '...' }, ...] }
        if (Array.isArray(v.richText)) {
            return v.richText.map((t) => t.text || "").join("");
        }

        // Hyperlink / text wrapper: { text: '...' }
        if (typeof v.text === "string") return v.text;

        // Fallback
        return "";
    }

    return String(v);
}

/**
 * Convert to number if possible (handles formula results, % etc.).
 * Returns null if not parseable.
 */
function cellToNumber(cell) {
    const v = cell?.value;
    if (v == null) return null;

    if (typeof v === "number") return v;

    if (v instanceof Date) return null;

    if (typeof v === "object") {
        if (typeof v.error === "string") return null;

        if (Object.prototype.hasOwnProperty.call(v, "formula")) {
            const r = v.result;
            if (typeof r === "number") return r;
            if (typeof r === "string") {
                const n = Number(r.replace(/,/g, "").trim());
                return Number.isFinite(n) ? n : null;
            }
            if (typeof r === "object" && r && typeof r.error === "string") return null;
            return null;
        }

        if (typeof v.text === "string") {
            const n = Number(v.text.replace(/,/g, "").trim());
            return Number.isFinite(n) ? n : null;
        }
    }

    if (typeof v === "string") {
        const n = Number(v.replace(/,/g, "").trim());
        return Number.isFinite(n) ? n : null;
    }

    return null;
}

module.exports = { cellToText, cellToNumber };