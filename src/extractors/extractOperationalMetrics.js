const { cellToText, cellToNumber } = require("../utils/cellValue");

function extractOperationalMetrics(ws) {
    const result = {
        prior_month: {},
        current_month: {},
        next_month_forecast: {},
    };

    for (let r = 1; r <= (ws.rowCount || 200); r++) {
        const label = cellToText(ws.getCell(r, 3)).trim();

        if (!label) continue;

        if (label.includes("Idle Trap Mode")) {
            result.prior_month.idle_trap_mode = cellToNumber(ws.getCell(r, 4));
            result.current_month.idle_trap_mode = cellToNumber(ws.getCell(r, 5));
            result.next_month_forecast.idle_trap_mode = cellToNumber(ws.getCell(r, 6));
        }

        if (label.includes("Strategic Reserve Mode")) {
            result.prior_month.strategic_reserve_mode = cellToNumber(ws.getCell(r, 4));
            result.current_month.strategic_reserve_mode = cellToNumber(ws.getCell(r, 5));
            result.next_month_forecast.strategic_reserve_mode = cellToNumber(ws.getCell(r, 6));
        }

        if (label.includes("商流間業者数")) {
            result.prior_month.intermediary_count = cellToNumber(ws.getCell(r, 4));
            result.current_month.intermediary_count = cellToNumber(ws.getCell(r, 5));
            result.next_month_forecast.intermediary_count = cellToNumber(ws.getCell(r, 6));
        }

        if (label.includes("商流業者数 / 契約件数")) {
            result.prior_month.intermediaries_per_contract = cellToNumber(ws.getCell(r, 4));
            result.current_month.intermediaries_per_contract = cellToNumber(ws.getCell(r, 5));
            result.next_month_forecast.intermediaries_per_contract = cellToNumber(ws.getCell(r, 6));
        }

        if (label.includes("全社員数")) {
            result.prior_month.total_employees = cellToNumber(ws.getCell(r, 4));
            result.current_month.total_employees = cellToNumber(ws.getCell(r, 5));
            result.next_month_forecast.total_employees = cellToNumber(ws.getCell(r, 6));
        }

        if (label.includes("休職中")) {
            result.prior_month.on_leave_count = cellToNumber(ws.getCell(r, 4));
            result.current_month.on_leave_count = cellToNumber(ws.getCell(r, 5));
            result.next_month_forecast.on_leave_count = cellToNumber(ws.getCell(r, 6));
        }

        if (label.includes("P/H")) {
            result.prior_month.revenue_per_employee = cellToNumber(ws.getCell(r, 4));
            result.current_month.revenue_per_employee = cellToNumber(ws.getCell(r, 5));
            result.next_month_forecast.revenue_per_employee = cellToNumber(ws.getCell(r, 6));
        }
    }

    // derive idle_total if both components exist
    for (const key of ["prior_month", "current_month", "next_month_forecast"]) {
        const trap = result[key].idle_trap_mode;
        const reserve = result[key].strategic_reserve_mode;
        if (trap != null || reserve != null) {
            result[key].idle_total = (trap || 0) + (reserve || 0);
        }
    }

    return result;
}

module.exports = { extractOperationalMetrics };