import React from "react";
import "./BudgetProgress.css";
import { formatCurrency } from "../utils/calculations";
import translations from "../utils/translations";

export default function BudgetProgress({ item, language = "en" }) {
  const t = translations[language] || translations.en;

  const displayCategory =
    item.category === "All Categories" || item.category === "அனைத்து வகைகளும்"
      ? t.allCategories
      : t[`cat${item.category}`] || item.category;

  const statusText =
    item.status === "exceeded"
      ? `🔴 ${t.exceededBy} ${formatCurrency(Math.abs(item.remaining))}`
      : item.status === "warning"
      ? `⚠️ ${t.closeToBudget}`
      : `${formatCurrency(item.remaining)} ${t.remaining}`;

  return (
    <div className="budget-progress">
      <div className="budget-progress-top">
        <span className="budget-progress-category">{displayCategory}</span>
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
        <span className="budget-progress-percent">{item.percent}% {t.used}</span>
      </div>
    </div>
  );
}
