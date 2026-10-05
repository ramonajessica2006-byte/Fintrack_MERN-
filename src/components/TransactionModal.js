import React, { useState } from "react";
import Modal from "./Modal";
import "./TransactionModal.css";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../utils/sampleData";

const PAYMENT_METHODS = ["UPI", "Cash", "Debit Card", "Credit Card", "Bank Transfer"];

const emptyForm = (type) => ({
  type: type || "expense",
  title: "",
  amount: "",
  category: type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: PAYMENT_METHODS[0],
  description: "",
});

export default function TransactionModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ? { ...initial } : emptyForm());
  const [error, setError] = useState("");

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const switchType = (type) => {
    setForm(emptyForm(type));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Please enter a title.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Please enter a valid amount.");
    if (!form.date) return setError("Please pick a date.");

    onSave({
      ...form,
      id: initial?.id || `t${Date.now()}`,
      amount: Number(form.amount),
    });
  };

  return (
    <Modal title={initial ? "Edit Transaction" : "Add Transaction"} onClose={onClose}>
      <div className="type-toggle">
        <button
          type="button"
          className={`type-toggle-btn ${form.type === "expense" ? "active-expense" : ""}`}
          onClick={() => switchType("expense")}
        >
          Expense
        </button>
        <button
          type="button"
          className={`type-toggle-btn ${form.type === "income" ? "active-income" : ""}`}
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
            onChange={(e) => update("title", e.target.value)}
            placeholder={form.type === "income" ? "e.g. Monthly Salary" : "e.g. Groceries"}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Amount (₹)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Payment Method</label>
            <select value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Description (optional)</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Add a note..."
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block">
          {initial ? "Save Changes" : `Add ${form.type === "income" ? "Income" : "Expense"}`}
        </button>
      </form>
    </Modal>
  );
}
