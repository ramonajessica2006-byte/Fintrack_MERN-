import React, { useState } from "react";
import "./Pages.css";
import BudgetProgress from "../components/BudgetProgress";
import Modal from "../components/Modal";
import { EXPENSE_CATEGORIES } from "../utils/sampleData";
import { formatCurrency } from "../utils/calculations";

export default function Budget({ budgetStatus, budgets, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const usedCategories = budgets.map((b) => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter((c) => !usedCategories.includes(c));

  const totalLimit = budgets.reduce((s, b) => s + Number(b.limit), 0);
  const totalSpent = budgetStatus.reduce((s, b) => s + b.spent, 0);
  const overallPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <div className="page-body">
      <div className="card section-card">
        <div className="section-card-head">
          <h3>Overall Monthly Budget</h3>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {formatCurrency(totalSpent)} / {formatCurrency(totalLimit)}
          </span>
        </div>
        <BudgetProgress
          item={{
            category: "All Categories",
            spent: totalSpent,
            limit: totalLimit,
            remaining: totalLimit - totalSpent,
            percent: overallPercent,
            status: overallPercent >= 100 ? "exceeded" : overallPercent >= 80 ? "warning" : "normal",
          }}
        />
      </div>

      <div className="card section-card">
        <div className="section-card-head">
          <h3>Budgets by Category</h3>
          <button
            className="link-btn"
            onClick={() => setEditing({ category: availableCategories[0] || "", limit: "" })}
            disabled={availableCategories.length === 0}
          >
            + Add Category Budget
          </button>
        </div>

        {budgetStatus.length === 0 ? (
          <p className="empty-state">No category budgets yet. Add one to get started.</p>
        ) : (
          budgetStatus.map((b) => (
            <div key={b.category} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <BudgetProgress item={b} />
              </div>
              <div style={{ display: "flex", gap: 4, paddingTop: 14 }}>
                <button className="icon-link" onClick={() => setEditing(budgets.find((x) => x.category === b.category))}>✏️</button>
                <button className="icon-link" onClick={() => onDelete(b.category)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <Modal title={budgets.find((b) => b.category === editing.category) ? "Edit Budget" : "New Category Budget"} onClose={() => setEditing(null)} width={400}>
          <BudgetForm
            initial={editing}
            availableCategories={availableCategories}
            isNew={!budgets.find((b) => b.category === editing.category)}
            onSave={(data) => {
              onSave(data);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function BudgetForm({ initial, availableCategories, isNew, onSave }) {
  const [category, setCategory] = useState(initial.category);
  const [limit, setLimit] = useState(initial.limit);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!limit || Number(limit) <= 0) return setError("Enter a valid budget amount.");
    onSave({ category, limit: Number(limit) });
  };

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label>Category</label>
        {isNew ? (
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {availableCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : (
          <input value={category} disabled />
        )}
      </div>
      <div className="field">
        <label>Monthly Limit (₹)</label>
        <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0" />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block">Save Budget</button>
    </form>
  );
}
