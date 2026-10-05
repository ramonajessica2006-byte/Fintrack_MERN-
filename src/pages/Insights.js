import React from "react";
import "./Pages.css";
import HealthScoreCard from "../components/HealthScoreCard";
import AssistantCard from "../components/AssistantCard";
import { formatCurrency } from "../utils/calculations";

export default function Insights({ summary, breakdown, budgetStatus, goalsSummary, health, insights, improvementTips, trend }) {
  const highest = breakdown[0];
  const lowest = breakdown[breakdown.length - 1];
  const prevMonth = trend[trend.length - 2];
  const thisMonth = trend[trend.length - 1];
  const spendChange = prevMonth && prevMonth.expenses > 0
    ? Math.round(((thisMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100)
    : 0;

  const exceededCount = budgetStatus.filter((b) => b.status === "exceeded").length;
  const warningCount = budgetStatus.filter((b) => b.status === "warning").length;
  const totalBudgetUsedPercent = budgetStatus.length > 0
    ? Math.round(budgetStatus.reduce((s, b) => s + Math.min(b.percent, 100), 0) / budgetStatus.length)
    : 0;

  return (
    <div className="page-body">
      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card section-card">
            <div className="section-card-head"><h3>Spending Analysis</h3></div>
            <div className="insight-stat-grid">
              <Stat label="Highest Category" value={highest ? highest.category : "—"} />
              <Stat label="Lowest Category" value={lowest ? lowest.category : "—"} />
              <Stat label="Spending Change" value={`${spendChange >= 0 ? "+" : ""}${spendChange}% vs last month`} />
              <Stat label="Income vs Expense" value={`${formatCurrency(summary.totalIncome)} / ${formatCurrency(summary.totalExpenses)}`} />
            </div>
          </div>

          <div className="card section-card">
            <div className="section-card-head"><h3>Budget Analysis</h3></div>
            <div className="insight-stat-grid">
              <Stat label="Avg. Budget Used" value={`${totalBudgetUsedPercent}%`} />
              <Stat label="Categories Exceeded" value={exceededCount} tone={exceededCount > 0 ? "danger" : "normal"} />
              <Stat label="Categories Near Limit" value={warningCount} tone={warningCount > 0 ? "warning" : "normal"} />
              <Stat label="Total Budgeted" value={formatCurrency(budgetStatus.reduce((s, b) => s + b.limit, 0))} />
            </div>
          </div>

          <div className="card section-card">
            <div className="section-card-head"><h3>Savings Analysis</h3></div>
            <div className="insight-stat-grid">
              <Stat label="Current Savings" value={formatCurrency(goalsSummary.reduce((s, g) => s + g.saved, 0))} />
              <Stat label="Savings Rate" value={`${summary.savingsRate}%`} />
              <Stat label="Active Goals" value={goalsSummary.length} />
              <Stat label="Avg. Goal Progress" value={`${goalsSummary.length > 0 ? Math.round(goalsSummary.reduce((s, g) => s + g.percent, 0) / goalsSummary.length) : 0}%`} />
            </div>
          </div>

          <div className="card section-card">
            <div className="section-card-head"><h3>What You Can Improve</h3></div>
            <div className="improve-list">
              {improvementTips.map((tip, i) => (
                <div className="improve-item" key={i}>{tip}</div>
              ))}
            </div>
          </div>
        </div>

        <HealthScoreCard health={health} />
      </div>

      <AssistantCard insights={insights} />
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="insight-stat">
      <div className="insight-stat-label">{label}</div>
      <div className="insight-stat-value" style={tone === "danger" ? { color: "var(--danger)" } : tone === "warning" ? { color: "#92640a" } : undefined}>
        {value}
      </div>
    </div>
  );
}
