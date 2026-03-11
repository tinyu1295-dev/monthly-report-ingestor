// src/config/jpMetricMap.js

// JP label (as seen in the sheet) -> key used in the IDEAL PDF schema
const KPI_LABEL_TO_KEY = {
    "売上総額": "revenue_total",
    "粗利益": "gross_profit_total",
    "粗利益率（％）": "gross_margin_total",
    "粗利益率(％)": "gross_margin_total",
    "契約件数": "contract_count",
    "平均単価": "avg_unit_price",
    "MIN単価": "min_unit_price",
    "Max単価": "max_unit_price",
    "MAX単価": "max_unit_price",
    "高単価件数": "high_end_count",
    "最低単価未満件数": "below_min_count",
};

module.exports = { KPI_LABEL_TO_KEY };