import React, { useState } from "react";
import "./TransactionModal.css";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "../utils/sampleData";

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
}) {
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
      setError("Please enter a title.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!form.date) {
      setError("Please pick a date.");
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
              ? "Edit Transaction"
              : "Add Transaction"}
          </h3>

          <button
            type="button"
            className="transaction-modal-close"
            onClick={onClose}
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
              Expense
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
              Income
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="field">
              <label>Title</label>

              <input
                value={form.title}
                onChange={(e) =>
                  update("title", e.target.value)
                }
                placeholder={
                  form.type === "income"
                    ? "e.g. Monthly Salary"
                    : "e.g. Groceries"
                }
              />
            </div>

            <div className="field-row">

              <div className="field">
                <label>Amount (₹)</label>

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
                <label>Date</label>

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    update("date", e.target.value)
                  }
                />
              </div>

            </div>

            <div className="field-row">

              <div className="field">
                <label>Category</label>

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
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Payment Method</label>

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
                      {method}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="field">
              <label>Description (optional)</label>

              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  update(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Add a note..."
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
                ? "Save Changes"
                : `Add ${
                    form.type === "income"
                      ? "Income"
                      : "Expense"
                  }`}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}