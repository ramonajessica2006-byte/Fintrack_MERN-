import React from "react";
import "./BudgetProgress.css";
import { formatCurrency } from "../utils/calculations";

export default function BudgetProgress({ item }) {
  const statusText =
    item.status === "exceeded"
      ? `🔴 Exceeded by ${formatCurrency(Math.abs(item.remaining))}`
      : item.status === "warning"
      ? `⚠️ Close to your ${item.category} budget`
      : `${formatCurrency(item.remaining)} remaining`;

  return (
    <div className="budget-progress">
      <div className="budget-progress-top">
        <span className="budget-progress-category">{item.category}</span>
        <span className="budget-progress-amounts">
          {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
        </span>
      </div>
      <div className="budget-progress-track">
        <div
          className={`budget-progress-fill status-${item.status}`}
          style={{ width: `${Math.min(item.percent, 100)}%` }}
        />
      </div>
      <div className="budget-progress-bottom">
        <span className={`budget-progress-status status-text-${item.status}`}>{statusText}</span>
        <span className="budget-progress-percent">{item.percent}% used</span>
      </div>
    </div>
  );
}
