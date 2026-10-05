import React from "react";
import "./SummaryCard.css";
import { formatCurrency } from "../utils/calculations";

export default function SummaryCard({ label, value, tone, icon, isPercent }) {
  return (
    <div className="card summary-card">
      <div className="summary-card-top">
        <span className={`summary-card-icon tone-${tone}`}>{icon}</span>
      </div>
      <div className="summary-card-value">{isPercent ? `${value}%` : formatCurrency(value)}</div>
      <div className="summary-card-label">{label}</div>
    </div>
  );
}
