const { cellToText, cellToNumber } = require("../utils/cellValue");
const { KPI_LABEL_TO_KEY } = require("../config/jpMetricMap");

/**
 * Extract top KPI rows under 【実績データ集計】 using the detected period columns.
 */
function extractTopKpis(ws, periodCols, opts = {}) {
    const warnings = [];
    const mappings = [];

    if (!periodCols?.headerRow || !periodCols.prior_month || !periodCols.current_month || !periodCols.next_month_forecast) {
        return {
            prior_month: {},
            current_month: {},
            next_month_forecast: {},
            mappings,
            warnings: [{ code: "PERIOD_COLS_MISSING", message: "Period columns not detected." }],
        };
    }

    // Anchor search to rows below the header row, and columns around the KPI label column.
    const startRow = opts.startRow ?? (periodCols.headerRow + 1);
    // const endRow = opts.endRow ?? Math.min(startRow + 40, ws.rowCount || startRow + 40);
    const endRow = opts.endRow ?? Math.min(startRow + 15, ws.rowCount || startRow + 15);

    // In your sheet KPI labels are at col 14 (N). We'll scan a band around it.
    const labelColMin = opts.labelColMin ?? 10;
    const labelColMax = opts.labelColMax ?? 18;

    const result = {
        prior_month: {},
        current_month: {},
        next_month_forecast: {},
        mappings,
        warnings,
    };

    function readValue(r, col) {
        if (!col) return null;
        return cellToNumber(ws.getCell(r, col));
    }

    let matched = 0;

    for (let r = startRow; r <= endRow; r++) {
        for (let c = labelColMin; c <= labelColMax; c++) {
            const label = cellToText(ws.getCell(r, c)).trim();
            if (!label) continue;

            const key = KPI_LABEL_TO_KEY[label];
            if (!key) continue;

            const vPrior = readValue(r, periodCols.prior_month);
            const vCurrent = readValue(r, periodCols.current_month);
            const vNext = readValue(r, periodCols.next_month_forecast);

            // Only accept if at least one period has a numeric value
            if (vPrior == null && vCurrent == null && vNext == null) continue;

            matched += 1;
            if (vPrior != null) result.prior_month[key] = vPrior;
            if (vCurrent != null) result.current_month[key] = vCurrent;
            if (vNext != null) result.next_month_forecast[key] = vNext;

            mappings.push({
                label_jp: label,
                metric_key: key,
                row: r,
                labelCol: c,
                colByPeriod: {
                    prior_month: periodCols.prior_month,
                    current_month: periodCols.current_month,
                    next_month_forecast: periodCols.next_month_forecast,
                },
            });
        }
    }

    if (matched === 0) {
        warnings.push({
            code: "TOP_KPI_NOT_FOUND_IN_ANCHORED_RANGE",
            message: `No KPIs found in rows ${startRow}-${endRow}, cols ${labelColMin}-${labelColMax}.`,
        });
    }

    return result;
}

module.exports = { extractTopKpis };