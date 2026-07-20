const { cellToText, cellToNumber } = require("../utils/cellValue");

const PERIOD_START_LABELS = {
    "前月実績": "prior_month",
    "当月見込": "current_month",
    "次月予測": "next_month_forecast",
};

const ROW_LABELS = {
    "総額": "total",
    "ｼｽﾃﾑｱｳﾄｿｰｼﾝｸﾞ(ﾌﾟﾛﾊﾟｰ)": "proprietary",
    "ｼｽﾃﾑｱｳﾄｿｰｼﾝｸﾞ(BP)": "bp",
    "セキュリティ": "security",
    "その他": "other",
    "未稼働": "idle_total",
    "未稼働（退職有休消化）": "idle_retirement_paid_leave",
    "未稼働（休職）": "idle_leave",
};

function findPeriodBlocks(ws, maxRows = 80) {
    const blocks = [];

    for (let r = 1; r <= Math.min(ws.rowCount || maxRows, maxRows); r++) {
        const label = cellToText(ws.getCell(r, 3)).trim();
        const periodKey = PERIOD_START_LABELS[label];
        if (periodKey) {
            blocks.push({
                periodKey,
                startRow: r,
                totalRow: r + 1,
                firstDetailRow: r + 2,
                lastRow: r + 8,
            });
        }
    }

    return blocks;
}

function readMetricsFromRow(ws, rowNumber) {
    return {
        sales: cellToNumber(ws.getCell(rowNumber, 4)),
        gross_profit: cellToNumber(ws.getCell(rowNumber, 5)),
        gross_margin: cellToNumber(ws.getCell(rowNumber, 6)),
        contract_count: cellToNumber(ws.getCell(rowNumber, 7)),
        avg_unit_price: cellToNumber(ws.getCell(rowNumber, 8)),
        min_unit_price: cellToNumber(ws.getCell(rowNumber, 9)),
        max_unit_price: cellToNumber(ws.getCell(rowNumber, 10)),
        high_end_count: cellToNumber(ws.getCell(rowNumber, 11)),
        below_min_count: cellToNumber(ws.getCell(rowNumber, 12)),
    };
}

function extractDetailedPeriodBlocks(ws) {
    const warnings = [];
    const blocks = findPeriodBlocks(ws);

    const result = {
        prior_month: null,
        current_month: null,
        next_month_forecast: null,
        warnings,
    };

    for (const block of blocks) {
        const total = readMetricsFromRow(ws, block.totalRow);

        const details = {
            proprietary: null,
            bp: null,
            security: null,
            other: null,
            idle_total: null,
            idle_retirement_paid_leave: null,
            idle_leave: null,
        };

        for (let r = block.firstDetailRow; r <= block.lastRow; r++) {
            const label = cellToText(ws.getCell(r, 3)).trim();
            const key = ROW_LABELS[label];
            if (!key) continue;

            details[key] = readMetricsFromRow(ws, r);
        }

        result[block.periodKey] = {
            period_japanese:
                block.periodKey === "prior_month" ? "前月実績" :
                    block.periodKey === "current_month" ? "当月見込" :
                        "次月予測",

            revenue_total: total.sales,
            gross_profit_total: total.gross_profit,
            gross_margin_total: total.gross_margin,
            contract_count: total.contract_count,
            avg_unit_price: total.avg_unit_price,
            min_unit_price: total.min_unit_price,
            max_unit_price: total.max_unit_price,
            high_end_count: total.high_end_count,
            below_min_count: total.below_min_count,

            service_breakdown: {
                proprietary: details.proprietary,
                bp: details.bp,
                security: details.security,
                other: details.other,
            },

            idle_staff: {
                total: details.idle_total,
                retirement_paid_leave: details.idle_retirement_paid_leave,
                leave: details.idle_leave,
            },
        };
    }

    for (const key of ["prior_month", "current_month", "next_month_forecast"]) {
        if (!result[key]) {
            warnings.push({
                code: "PERIOD_BLOCK_MISSING",
                message: `Missing detailed block for ${key}`,
            });
        }
    }

    return result;
}

module.exports = { extractDetailedPeriodBlocks };