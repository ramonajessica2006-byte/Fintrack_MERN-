import React from "react";
import "./Pages.css";
import HealthScoreCard from "../components/HealthScoreCard";
import { formatCurrency } from "../utils/calculations";
import translations from "../utils/translations";

export default function Insights({
  summary,
  breakdown = [],
  budgetStatus = [],
  goalsSummary = [],
  health,
  insights = [],
  improvementTips = [],
  trend = [],
  language = "en",
}) {
  const t = translations[language] || translations.en;

  const highest = breakdown[0];
  const lowest = breakdown[breakdown.length - 1];

  const prevMonth = trend[trend.length - 2];
  const thisMonth = trend[trend.length - 1];

  const spendChange =
    prevMonth && prevMonth.expenses > 0 && thisMonth
      ? Math.round(
          ((thisMonth.expenses - prevMonth.expenses) /
            prevMonth.expenses) *
            100
        )
      : 0;

  const exceededCount = budgetStatus.filter(
    (b) => b.status === "exceeded"
  ).length;

  const warningCount = budgetStatus.filter(
    (b) => b.status === "warning"
  ).length;

  const totalBudgetUsedPercent =
    budgetStatus.length > 0
      ? Math.round(
          budgetStatus.reduce(
            (s, b) => s + Math.min(b.percent, 100),
            0
          ) / budgetStatus.length
        )
      : 0;

  const getCategoryName = (cat) => {
    if (!cat) return "—";
    return t[`cat${cat}`] || cat;
  };

  return (
    <div className="page-body">
      <div className="two-col">
        {/* LEFT SIDE */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* SPENDING ANALYSIS */}
          <div className="card section-card">
            <div className="section-card-head">
              <h3>{t.spendingAnalysis}</h3>
            </div>

            <div className="insight-stat-grid">
              <Stat
                label={t.highestCategory}
                value={highest ? getCategoryName(highest.category) : "—"}
              />

              <Stat
                label={t.lowestCategory}
                value={lowest ? getCategoryName(lowest.category) : "—"}
              />

              <Stat
                label={t.spendingChange}
                value={`${spendChange >= 0 ? "+" : ""}${spendChange}% ${
                  t.vsLastMonth
                }`}
              />

              <Stat
                label={t.incomeVsExpense}
                value={`${formatCurrency(
                  summary.totalIncome
                )} / ${formatCurrency(summary.totalExpenses)}`}
              />
            </div>
          </div>

          {/* BUDGET ANALYSIS */}
          <div className="card section-card">
            <div className="section-card-head">
              <h3>{t.budgetAnalysis}</h3>
            </div>

            <div className="insight-stat-grid">
              <Stat
                label={t.avgBudgetUsed}
                value={`${totalBudgetUsedPercent}%`}
              />

              <Stat
                label={t.categoriesExceeded}
                value={exceededCount}
                tone={exceededCount > 0 ? "danger" : "normal"}
              />

              <Stat
                label={t.categoriesNearLimit}
                value={warningCount}
                tone={warningCount > 0 ? "warning" : "normal"}
              />

              <Stat
                label={t.totalBudgeted}
                value={formatCurrency(
                  budgetStatus.reduce(
                    (s, b) => s + b.limit,
                    0
                  )
                )}
              />
            </div>
          </div>

          {/* SAVINGS ANALYSIS */}
          <div className="card section-card">
            <div className="section-card-head">
              <h3>{t.savingsAnalysis}</h3>
            </div>

            <div className="insight-stat-grid">
              <Stat
                label={t.currentSavings}
                value={formatCurrency(
                  goalsSummary.reduce(
                    (s, g) => s + g.saved,
                    0
                  )
                )}
              />

              <Stat
                label={t.savingsRate}
                value={`${summary.savingsRate}%`}
              />

              <Stat
                label={t.activeGoals}
                value={goalsSummary.length}
              />

              <Stat
                label={t.avgGoalProgress}
                value={`${
                  goalsSummary.length > 0
                    ? Math.round(
                        goalsSummary.reduce(
                          (s, g) => s + g.percent,
                          0
                        ) / goalsSummary.length
                      )
                    : 0
                }%`}
              />
            </div>
          </div>

          {/* WHAT YOU CAN IMPROVE */}
          <div className="card section-card">
            <div className="section-card-head">
              <h3>{t.whatYouCanImprove}</h3>
            </div>

            <div className="improve-list">
              {improvementTips.length === 0 ? (
                <div className="empty-state">
                  {language === "ta"
                    ? "மேம்படுத்துவதற்கான ஆலோசனைகள் எதுவும் தற்போது இல்லை."
                    : "No improvement tips at this time."}
                </div>
              ) : (
                improvementTips.map((tip, i) => (
                  <div className="improve-item" key={i}>
                    {tip}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FINANCIAL HEALTH */}
        <HealthScoreCard
          health={health}
          language={language}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="insight-stat">
      <div className="insight-stat-label">{label}</div>

      <div
        className="insight-stat-value"
        style={
          tone === "danger"
            ? { color: "var(--danger)" }
            : tone === "warning"
            ? { color: "#92640a" }
            : undefined
        }
      >
        {value}
      </div>
    </div>
  );
}