// src/builders/buildProcessedRawData.js

function toJapaneseMonth(yearMonth) {
    if (!yearMonth) return null;
    const m = String(yearMonth).match(/^(\d{4})-(\d{2})$/);
    if (!m) return null;
    return `${Number(m[2])}月`;
}

function toFiscalQuarter(yearMonth) {
    if (!yearMonth) return null;
    const m = String(yearMonth).match(/^(\d{4})-(\d{2})$/);
    if (!m) return null;

    const month = Number(m[2]);
    if (month >= 1 && month <= 3) return "Q1";
    if (month >= 4 && month <= 6) return "Q2";
    if (month >= 7 && month <= 9) return "Q3";
    return "Q4";
}

function toMonthInQuarter(yearMonth) {
    if (!yearMonth) return null;
    const m = String(yearMonth).match(/^(\d{4})-(\d{2})$/);
    if (!m) return null;

    const month = Number(m[2]);
    return ((month - 1) % 3) + 1;
}

function renameServiceBreakdown(serviceBreakdown) {
    if (!serviceBreakdown) return {
        proprietary: null,
        bp: null,
        security: null,
        other: null,
    };

    function mapOne(item, serviceNameJapanese) {
        if (!item) return null;

        return {
            service_name_japanese: serviceNameJapanese,
            revenue: item.sales ?? null,
            gross_profit: item.gross_profit ?? null,
            gross_margin: item.gross_margin ?? null,
            contract_count: item.contract_count ?? null,
            avg_unit_price: item.avg_unit_price ?? null,
            min_unit_price: item.min_unit_price ?? null,
            max_unit_price: item.max_unit_price ?? null,
            high_end_count: item.high_end_count ?? null,
            below_min_count: item.below_min_count ?? null,
        };
    }

    return {
        proprietary: mapOne(serviceBreakdown.proprietary, "システムアウトソーシング(プロパー)"),
        bp: mapOne(serviceBreakdown.bp, "システムアウトソーシング(BP)"),
        security: mapOne(serviceBreakdown.security, "セキュリティ"),
        other: mapOne(serviceBreakdown.other, "その他"),
    };
}

function renameIdleStaff(idleStaff) {
    if (!idleStaff) {
        return {
            total: null,
            exit_vacation: null,
            leave_of_absence: null,
            unassigned: null,
            total_negative_gross_profit: null,
        };
    }

    const totalCount = idleStaff.total?.contract_count ?? null;
    const exitVacation = idleStaff.retirement_paid_leave?.contract_count ?? null;
    const leaveOfAbsence = idleStaff.leave?.contract_count ?? null;

    let unassigned = null;
    if (totalCount != null || exitVacation != null || leaveOfAbsence != null) {
        unassigned = (totalCount || 0) - (exitVacation || 0) - (leaveOfAbsence || 0);
    }

    const totalNegativeGrossProfit =
        idleStaff.total?.gross_profit ??
        ((idleStaff.retirement_paid_leave?.gross_profit || 0) + (idleStaff.leave?.gross_profit || 0));

    return {
        total: totalCount,
        exit_vacation: exitVacation,
        leave_of_absence: leaveOfAbsence,
        unassigned: unassigned,
        total_negative_gross_profit: totalNegativeGrossProfit ?? null,
    };
}

function renameOperationalMetrics(metrics) {
    if (!metrics) {
        return {
            prior_month: {},
            current_month: {},
            next_month_forecast: {},
        };
    }

    function mapOne(item) {
        return {
            idle_trap_mode: item?.idle_trap_mode ?? null,
            strategic_reserve: item?.strategic_reserve_mode ?? null,
            idle_total: item?.idle_total ?? null,
            intermediary_count: item?.intermediary_count ?? null,
            intermediaries_per_contract: item?.intermediaries_per_contract ?? null,
            total_employees: item?.total_employees ?? null,
            on_leave_count: item?.on_leave_count ?? null,
            revenue_per_employee: item?.revenue_per_employee ?? null,
        };
    }

    return {
        prior_month: mapOne(metrics.prior_month),
        current_month: mapOne(metrics.current_month),
        next_month_forecast: mapOne(metrics.next_month_forecast),
    };
}

function buildProcessedRawData({
    reportId,
    companyCode,
    companyName,
    companyNameJp,
    fileName,
    gsPath,
    storagePath,
    submissionTimestamp,
    reportMetadata,
    financialTables,
    operationalMetrics,
    narrativeSections,
    extractionMetadata,
    periods,
}) {
    // const finalFinancialTables = {
    //     prior_month: {
    //         ...(financialTables?.prior_month || {}),
    //         period: periods?.priorMonth || financialTables?.prior_month?.period || null,
    //     },
    //     current_month: {
    //         ...(financialTables?.current_month || {}),
    //         period: periods?.currentMonth || financialTables?.current_month?.period || null,
    //     },
    //     next_month_forecast: {
    //         ...(financialTables?.next_month_forecast || {}),
    //         period: periods?.nextMonth || financialTables?.next_month_forecast?.period || null,
    //     },
    // };

    const finalFinancialTables = {
        prior_month: {
            ...(financialTables?.prior_month || {}),
            period: periods?.priorMonth || financialTables?.prior_month?.period || null,
            service_breakdown: renameServiceBreakdown(financialTables?.prior_month?.service_breakdown),
            idle_staff: renameIdleStaff(financialTables?.prior_month?.idle_staff),
        },
        current_month: {
            ...(financialTables?.current_month || {}),
            period: periods?.currentMonth || financialTables?.current_month?.period || null,
            service_breakdown: renameServiceBreakdown(financialTables?.current_month?.service_breakdown),
            idle_staff: renameIdleStaff(financialTables?.current_month?.idle_staff),
        },
        next_month_forecast: {
            ...(financialTables?.next_month_forecast || {}),
            period: periods?.nextMonth || financialTables?.next_month_forecast?.period || null,
            service_breakdown: renameServiceBreakdown(financialTables?.next_month_forecast?.service_breakdown),
            idle_staff: renameIdleStaff(financialTables?.next_month_forecast?.idle_staff),
        },
    };

    const currentReportPeriod = periods?.currentMonth || reportMetadata?.reportingMonth || null;

    const finalReportMetadata = {
        responsible_person: reportMetadata?.responsiblePerson || null,
        report_period: currentReportPeriod,
        report_month_japanese: toJapaneseMonth(currentReportPeriod),
        fiscal_year: currentReportPeriod ? currentReportPeriod.slice(0, 4) : null,
        fiscal_quarter: toFiscalQuarter(currentReportPeriod),
        month_in_quarter: toMonthInQuarter(currentReportPeriod),
    };

    const finalOperationalMetrics = renameOperationalMetrics(operationalMetrics);
    return {
        report_id: reportId,
        companyCode,
        companyName: companyName || companyNameJp || companyCode,
        companyName_jp: companyNameJp || companyName || companyCode,
        documentType: "monthly_report",
        fileName: fileName || null,
        gsPath: gsPath || null,
        storagePath: storagePath || null,
        status: "processed",
        submissionTimestamp: submissionTimestamp || null,
        processedAt: new Date().toISOString(),

        // report_metadata: {
        //     ...(reportMetadata || {}),
        //     reportingMonth: periods?.currentMonth || reportMetadata?.reportingMonth || "",
        // },

        report_metadata: finalReportMetadata,


        // financial_tables: financialTables || {
        //     prior_month: {},
        //     current_month: {},
        //     next_month_forecast: {},
        // },
        financial_tables: finalFinancialTables,

        // operational_metrics: operationalMetrics || {
        //     prior_month: {},
        //     current_month: {},
        //     next_month_forecast: {},
        // },

        operational_metrics: finalOperationalMetrics,

        narrative_sections: {
            pl_highlights: narrativeSections?.pl_highlights || "",
            customer_trends: narrativeSections?.customer_trends || "",
            management_status: narrativeSections?.management_status || "",
            internal_status: narrativeSections?.internal_status || "",
        },

        extraction_metadata: extractionMetadata || {
            extracted_at: new Date().toISOString(),
            method: "exceljs_parser_v1",
            confidence: 0.8,
            warnings: [],
        },
    };
}

module.exports = { buildProcessedRawData };