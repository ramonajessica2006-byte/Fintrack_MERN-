import React, { useState } from "react";
import "./TransactionModal.css";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "../utils/sampleData";
import translations from "../utils/translations";

const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
];

const emptyForm = (type = "expense") => ({
  type,
  title: "",
  amount: "",
  category:
    type === "income"
      ? INCOME_CATEGORIES[0]
      : EXPENSE_CATEGORIES[0],
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: PAYMENT_METHODS[0],
  description: "",
});

export default function TransactionModal({
  initial,
  onClose,
  onSave,
  language = "en",
}) {
  const t = translations[language] || translations.en;

  const [form, setForm] = useState(
    initial
      ? { ...initial }
      : emptyForm("expense")
  );

  const [error, setError] = useState("");

  const categories =
    form.type === "income"
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES;

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const switchType = (type) => {
    setForm(emptyForm(type));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError(t.pleaseEnterTitle);
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError(t.pleaseEnterAmount);
      return;
    }

    if (!form.date) {
      setError(t.pleasePickDate);
      return;
    }

    onSave({
      ...form,
      ...(initial?._id
        ? { _id: initial._id }
        : {}),
      amount: Number(form.amount),
    });
  };

  const getMethodLabel = (method) => {
    const key = `pm${method.replace(/\s+/g, "")}`;
    return t[key] || method;
  };

  return (
    <div
      className="transaction-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="transaction-modal-panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="transaction-modal-header">
          <h3>
            {initial
              ? t.editTransactionTitle
              : t.addTransactionTitle}
          </h3>

          <button
            type="button"
            className="transaction-modal-close"
            onClick={onClose}
            title={t.close}
          >
            ✕
          </button>
        </div>

        <div className="transaction-modal-body">
          <div className="type-toggle">
            <button
              type="button"
              className={`type-toggle-btn ${
                form.type === "expense"
                  ? "active-expense"
                  : ""
              }`}
              onClick={() => switchType("expense")}
            >
              {t.expense}
            </button>

            <button
              type="button"
              className={`type-toggle-btn ${
                form.type === "income"
                  ? "active-income"
                  : ""
              }`}
              onClick={() => switchType("income")}
            >
              {t.income}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>{t.title}</label>

              <input
                value={form.title}
                onChange={(e) =>
                  update("title", e.target.value)
                }
                placeholder={
                  form.type === "income"
                    ? language === "ta"
                      ? "உதா. மாதாந்திர சம்பளம்"
                      : "e.g. Monthly Salary"
                    : language === "ta"
                    ? "உதா. மளிகைப் பொருட்கள்"
                    : "e.g. Groceries"
                }
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>{t.amount} (₹)</label>

                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    update("amount", e.target.value)
                  }
                  placeholder="0"
                />
              </div>

              <div className="field">
                <label>{t.date}</label>

                <input
                  type="date"
                  value={form.date ? String(form.date).slice(0, 10) : ""}
                  onChange={(e) =>
                    update("date", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>{t.category}</label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    update("category", e.target.value)
                  }
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {t[`cat${category}`] || category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{t.paymentMethod}</label>

                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    update(
                      "paymentMethod",
                      e.target.value
                    )
                  }
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {getMethodLabel(method)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>{t.descriptionOptional}</label>

              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  update(
                    "description",
                    e.target.value
                  )
                }
                placeholder={t.addNotePlaceholder}
              />
            </div>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
            >
              {initial
                ? t.saveChanges
                : `${t.add} ${
                    form.type === "income"
                      ? t.income
                      : t.expense
                  }`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}