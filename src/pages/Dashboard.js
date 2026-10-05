import React from "react";
import "./Pages.css";
import SummaryCard from "../components/SummaryCard";
import DonutChart, { COLORS } from "../components/DonutChart";
import TrendChart from "../components/TrendChart";
import BudgetProgress from "../components/BudgetProgress";
import AssistantCard from "../components/AssistantCard";
import TransactionList from "../components/TransactionList";
import { formatCurrency } from "../utils/calculations";

export default function Dashboard({ summary, breakdown, trend, budgetStatus, insights, recentTransactions }) {
  return (
    <div className="page-body">
      <div className="summary-row">
        <SummaryCard label="Total Income" value={summary.totalIncome} icon="⬆️" tone="income" />
        <SummaryCard label="Total Expenses" value={summary.totalExpenses} icon="⬇️" tone="expense" />
        <SummaryCard label="Available Balance" value={summary.balance} icon="💰" tone="indigo" />
        <SummaryCard label="Savings Rate" value={summary.savingsRate} icon="📈" tone="savings" isPercent />
      </div>

      <AssistantCard insights={insights.slice(0, 4)} />

      <div className="two-col">
        <div className="card section-card">
          <div className="section-card-head">
            <h3>Income vs Expenses</h3>
          </div>
          <TrendChart data={trend} />
        </div>

        <div className="card section-card">
          <div className="section-card-head">
            <h3>Expense Breakdown</h3>
          </div>
          {breakdown.length === 0 ? (
            <p className="empty-state">No expenses recorded this month yet.</p>
          ) : (
            <div className="donut-flex">
              <DonutChart data={breakdown} size={150} thickness={22} />
              <div className="donut-legend">
                {breakdown.slice(0, 6).map((b, i) => (
                  <div className="donut-legend-row" key={b.category}>
                    <span className="donut-legend-left">
                      <span className="donut-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                      {b.category}
                    </span>
                    <span className="donut-legend-value">{formatCurrency(b.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="two-col">
        <div className="card section-card">
          <div className="section-card-head">
            <h3>Recent Transactions</h3>
          </div>
          <TransactionList transactions={recentTransactions.slice(0, 6)} compact />
        </div>

        <div className="card section-card">
          <div className="section-card-head">
            <h3>Monthly Budget</h3>
          </div>
          {budgetStatus.length === 0 ? (
            <p className="empty-state">No budgets set yet.</p>
          ) : (
            budgetStatus.slice(0, 4).map((b) => <BudgetProgress key={b.category} item={b} />)
          )}
        </div>
      </div>
    </div>
  );
}
