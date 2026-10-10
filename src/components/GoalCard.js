import React, { useState } from "react";
import "./GoalCard.css";
import { formatCurrency } from "../utils/calculations";
import translations from "../utils/translations";

export default function GoalCard({
  goal,
  onAddMoney,
  onEdit,
  onDelete,
  language = "en",
}) {
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const t = translations[language] || translations.en;

  const submit = () => {
    const val = Number(amount);
    if (val > 0) {
      onAddMoney(goal.id, val);
      setAmount("");
      setAdding(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(t.confirmDeleteGoal)) {
      onDelete(goal.id);
    }
  };

  return (
    <div className="card goal-card">
      <div className="goal-card-top">
        <h4>{goal.title}</h4>
        <div className="goal-card-menu">
          <button className="icon-link" onClick={() => onEdit(goal)} title={t.edit}>
            ✏️
          </button>
          <button className="icon-link" onClick={handleDelete} title={t.delete}>
            🗑️
          </button>
        </div>
      </div>

      <div className="goal-card-amounts">
        <span className="goal-saved">{formatCurrency(goal.saved)}</span>
        <span className="goal-target"> / {formatCurrency(goal.target)}</span>
      </div>

      <div className="goal-track">
        <div className="goal-fill" style={{ width: `${goal.percent}%` }} />
      </div>
      <div className="goal-percent">{goal.percent}% {t.complete}</div>

      {adding ? (
        <div className="goal-add-row">
          <input
            type="number"
            placeholder={t.amountPlaceholder}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          <button className="btn btn-primary" onClick={submit}>
            {t.add}
          </button>
          <button className="btn btn-ghost" onClick={() => setAdding(false)}>
            {t.cancel}
          </button>
        </div>
      ) : (
        <button className="btn btn-secondary btn-block" onClick={() => setAdding(true)}>
          {t.addMoney}
        </button>
      )}
    </div>
  );
}
