import React, { useMemo, useState } from "react";
import "./Pages.css";
import TransactionList from "../components/TransactionList";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../utils/sampleData";

const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

export default function Transactions({ transactions, onEdit, onDelete, onAdd }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) => (categoryFilter === "all" ? true : t.category === categoryFilter))
      .filter((t) =>
        search.trim() === ""
          ? true
          : t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, search, typeFilter, categoryFilter]);

  return (
    <div className="page-body">
      <div className="page-toolbar">
        <div className="page-toolbar-filters">
          <input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Transaction</button>
      </div>

      <div className="card section-card">
        <TransactionList transactions={filtered} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
