import React from "react";
import "./TransactionList.css";
import { formatCurrency } from "../utils/calculations";
import translations from "../utils/translations";

export default function TransactionList({
  transactions = [],
  onEdit,
  onDelete,
  compact,
  language = "en",
}) {
  const t = translations[language] || translations.en;

  if (transactions.length === 0) {
    return (
      <div className="tx-empty">
        <p>{t.noTransactionsMatch}</p>
      </div>
    );
  }

  const getCategoryLabel = (cat) => t[`cat${cat}`] || cat;
  const getMethodLabel = (method) => {
    if (!method) return "";
    const key = `pm${method.replace(/\s+/g, "")}`;
    return t[key] || method;
  };

  return (
    <div className="tx-list">
      {!compact && (
        <div className="tx-row tx-head">
          <span>{t.title}</span>
          <span>{t.category}</span>
          <span>{t.date}</span>
          <span>{t.method}</span>
          <span className="tx-amount-col">{t.amount}</span>
          {onEdit && <span></span>}
        </div>
      )}

      {transactions.map((transaction, idx) => {
        const txId = transaction._id || transaction.id || `tx_${idx}`;
        const displayDate = transaction.date
          ? String(transaction.date).slice(0, 10)
          : "";

        return (
          <div className="tx-row" key={txId}>
            <div className="tx-title-cell">
              <span className={`tx-dot ${transaction.type}`} />
              <div>
                <div className="tx-title">{transaction.title}</div>
                {compact && (
                  <div className="tx-meta">
                    {getCategoryLabel(transaction.category)} · {displayDate}
                  </div>
                )}
              </div>
            </div>

            {!compact && (
              <span className="tx-category">
                {getCategoryLabel(transaction.category)}
              </span>
            )}

            {!compact && (
              <span className="tx-date">{displayDate}</span>
            )}

            {!compact && (
              <span className="tx-method">
                {getMethodLabel(transaction.paymentMethod)}
              </span>
            )}

            <span className={`tx-amount tx-amount-col ${transaction.type}`}>
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </span>

            {onEdit && (
              <div className="tx-actions">
                <button
                  className="icon-link"
                  onClick={() => onEdit(transaction)}
                  title={t.edit}
                >
                  ✏️
                </button>

                <button
                  className="icon-link"
                  onClick={() => {
                    if (window.confirm(t.confirmDeleteTx)) {
                      onDelete(txId);
                    }
                  }}
                  title={t.delete}
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}