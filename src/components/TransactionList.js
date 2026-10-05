import React from "react";
import "./TransactionList.css";
import { formatCurrency } from "../utils/calculations";

export default function TransactionList({ transactions, onEdit, onDelete, compact }) {
  if (transactions.length === 0) {
    return (
      <div className="tx-empty">
        <p>No transactions match your filters yet.</p>
      </div>
    );
  }

  return (
    <div className="tx-list">
      {!compact && (
        <div className="tx-row tx-head">
          <span>Title</span>
          <span>Category</span>
          <span>Date</span>
          <span>Method</span>
          <span className="tx-amount-col">Amount</span>
          {onEdit && <span></span>}
        </div>
      )}
      {transactions.map((t) => (
        <div className="tx-row" key={t.id}>
          <div className="tx-title-cell">
            <span className={`tx-dot ${t.type}`} />
            <div>
              <div className="tx-title">{t.title}</div>
              {compact && <div className="tx-meta">{t.category} · {t.date}</div>}
            </div>
          </div>
          {!compact && <span className="tx-category">{t.category}</span>}
          {!compact && <span className="tx-date">{t.date}</span>}
          {!compact && <span className="tx-method">{t.paymentMethod}</span>}
          <span className={`tx-amount tx-amount-col ${t.type}`}>
            {t.type === "income" ? "+" : "-"}
            {formatCurrency(t.amount)}
          </span>
          {onEdit && (
            <div className="tx-actions">
              <button className="icon-link" onClick={() => onEdit(t)}>✏️</button>
              <button className="icon-link" onClick={() => onDelete(t.id)}>🗑️</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
