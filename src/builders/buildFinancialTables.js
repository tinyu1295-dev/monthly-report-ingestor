// src/builders/buildFinancialTables.js

function mergePeriod(detail = {}, top = {}) {
    return {
        period: null,
        period_japanese: detail.period_japanese || null,

        // totals from top are useful
        revenue_total: top.revenue_total ?? detail.revenue_total ?? null,
        gross_profit_total: top.gross_profit_total ?? detail.gross_profit_total ?? null,
        gross_margin_total: top.gross_margin_total ?? detail.gross_margin_total ?? null,
        contract_count: top.contract_count ?? detail.contract_count ?? null,
        avg_unit_price: top.avg_unit_price ?? detail.avg_unit_price ?? null,
        min_unit_price: top.min_unit_price ?? detail.min_unit_price ?? null,

        // prefer detailed block here
        max_unit_price: detail.max_unit_price ?? top.max_unit_price ?? null,
        high_end_count: detail.high_end_count ?? top.high_end_count ?? null,
        below_min_count: detail.below_min_count ?? top.below_min_count ?? null,

        service_breakdown: detail.service_breakdown || {
            proprietary: null,
            bp: null,
            security: null,
            other: null,
        },

        idle_staff: detail.idle_staff || {
            total: null,
            retirement_paid_leave: null,
            leave: null,
        },
    };
}

function buildFinancialTables(topKpis, detailedBlocks) {
    return {
        prior_month: mergePeriod(detailedBlocks.prior_month, topKpis.prior_month),
        current_month: mergePeriod(detailedBlocks.current_month, topKpis.current_month),
        next_month_forecast: mergePeriod(detailedBlocks.next_month_forecast, topKpis.next_month_forecast),
    };
}

module.exports = { buildFinancialTables };