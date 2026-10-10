import React, { useState } from "react";
import "./Pages.css";
import BudgetProgress from "../components/BudgetProgress";
import Modal from "../components/Modal";
import { EXPENSE_CATEGORIES } from "../utils/sampleData";
import { formatCurrency } from "../utils/calculations";
import translations from "../utils/translations";

export default function Budget({
  budgetStatus = [],
  budgets = [],
  onSave,
  onDelete,
  language = "en",
}) {
  const [editing, setEditing] = useState(null);
  const t = translations[language] || translations.en;

  const usedCategories = budgets.map((b) => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !usedCategories.includes(c)
  );

  const totalLimit = budgets.reduce(
    (sum, b) => sum + Number(b.limit),
    0
  );

  const totalSpent = budgetStatus.reduce(
    (sum, b) => sum + b.spent,
    0
  );

  const overallPercent =
    totalLimit > 0
      ? Math.round((totalSpent / totalLimit) * 100)
      : 0;

  const handleDeleteBudget = (category) => {
    if (window.confirm(t.confirmDeleteBudget)) {
      onDelete(category);
    }
  };

  return (
    <div className="page-body">
      {/* =========================
          OVERALL MONTHLY BUDGET
      ========================= */}
      <div className="card section-card">
        <div className="section-card-head">
          <h3>{t.overallMonthlyBudget}</h3>
          <span
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            {formatCurrency(totalSpent)} / {formatCurrency(totalLimit)}
          </span>
        </div>

        <BudgetProgress
          item={{
            category: t.allCategories,
            spent: totalSpent,
            limit: totalLimit,
            remaining: totalLimit - totalSpent,
            percent: overallPercent,
            status:
              overallPercent >= 100
                ? "exceeded"
                : overallPercent >= 80
                ? "warning"
                : "normal",
          }}
          language={language}
        />
      </div>

      {/* =========================
          BUDGETS BY CATEGORY
      ========================= */}
      <div className="card section-card">
        <div className="section-card-head">
          <h3>{t.budgetsByCategory}</h3>
          <button
            className="link-btn"
            onClick={() =>
              setEditing({
                category: availableCategories[0] || "",
                limit: "",
              })
            }
            disabled={availableCategories.length === 0}
          >
            {t.addCategoryBudget}
          </button>
        </div>

        {budgetStatus.length === 0 ? (
          <p className="empty-state">{t.noCategoryBudgets}</p>
        ) : (
          budgetStatus.map((b) => (
            <div
              key={b.category}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <BudgetProgress item={b} language={language} />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 4,
                  paddingTop: 14,
                }}
              >
                <button
                  className="icon-link"
                  onClick={() =>
                    setEditing(
                      budgets.find((x) => x.category === b.category)
                    )
                  }
                  title={t.edit}
                >
                  ✏️
                </button>

                <button
                  className="icon-link"
                  onClick={() => handleDeleteBudget(b.category)}
                  title={t.delete}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================
          BUDGET MODAL
      ========================= */}
      {editing && (
        <Modal
          title={
            budgets.find((b) => b.category === editing.category)
              ? t.editBudget
              : t.newCategoryBudget
          }
          onClose={() => setEditing(null)}
          width={400}
        >
          <BudgetForm
            initial={editing}
            availableCategories={availableCategories}
            isNew={
              !budgets.find((b) => b.category === editing.category)
            }
            onSave={(data) => {
              onSave(data);
              setEditing(null);
            }}
            language={language}
          />
        </Modal>
      )}
    </div>
  );
}

function BudgetForm({
  initial,
  availableCategories,
  isNew,
  onSave,
  language = "en",
}) {
  const [category, setCategory] = useState(initial.category);
  const [limit, setLimit] = useState(initial.limit);
  const [error, setError] = useState("");
  const t = translations[language] || translations.en;

  const submit = (e) => {
    e.preventDefault();

    if (!limit || Number(limit) <= 0) {
      return setError(t.enterValidBudget);
    }

    onSave({
      category,
      limit: Number(limit),
    });
  };

  return (
    <form onSubmit={submit}>
      {/* Category */}
      <div className="field">
        <label>{t.category}</label>

        {isNew ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {t[`cat${c}`] || c}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={t[`cat${category}`] || category}
            disabled
          />
        )}
      </div>

      {/* Monthly Limit */}
      <div className="field">
        <label>{t.monthlyLimit}</label>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="0"
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block">
        {t.saveBudget}
      </button>
    </form>
  );
}