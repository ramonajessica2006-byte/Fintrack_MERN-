import React, { useMemo, useState } from "react";
import "./Pages.css";
import TransactionList from "../components/TransactionList";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "../utils/sampleData";
import translations from "../utils/translations";

const ALL_CATEGORIES = [
  ...new Set([
    ...EXPENSE_CATEGORIES,
    ...INCOME_CATEGORIES,
  ]),
];

export default function Transactions({
  transactions,
  onEdit,
  onDelete,
  onAdd,
  language = "en",
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const t = translations[language] || translations.en;

  const filtered = useMemo(() => {
    return transactions
      .filter((transaction) =>
        typeFilter === "all"
          ? true
          : transaction.type === typeFilter
      )
      .filter((transaction) =>
        categoryFilter === "all"
          ? true
          : transaction.category === categoryFilter
      )
      .filter((transaction) =>
        search.trim() === ""
          ? true
          : transaction.title
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            transaction.category
              .toLowerCase()
              .includes(search.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
  ]);

  return (
    <div className="page-body">

      {/* =========================
          TRANSACTION FILTERS
      ========================= */}
      <div className="page-toolbar">

        <div className="page-toolbar-filters">

          {/* Search */}
          <input
            placeholder={t.searchTransactions}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value)
            }
          >
            <option value="all">
              {t.allTypes}
            </option>

            <option value="income">
              {t.income}
            </option>

            <option value="expense">
              {t.expense}
            </option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
          >
            <option value="all">
              {t.allCategories}
            </option>

            {ALL_CATEGORIES.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* =========================
          TRANSACTION LIST
      ========================= */}
      <div className="card section-card">

        <TransactionList
          transactions={filtered}
          onEdit={onEdit}
          onDelete={onDelete}
          language={language}
        />

      </div>

    </div>
  );
}