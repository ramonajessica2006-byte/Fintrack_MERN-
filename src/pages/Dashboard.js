import React from "react";
import "./Pages.css";
import SummaryCard from "../components/SummaryCard";
import DonutChart, { COLORS } from "../components/DonutChart";
import TrendChart from "../components/TrendChart";
import BudgetProgress from "../components/BudgetProgress";
import AssistantCard from "../components/AssistantCard";
import TransactionList from "../components/TransactionList";
import { formatCurrency } from "../utils/calculations";
import translations from "../utils/translations";

export default function Dashboard({
  summary,
  breakdown = [],
  trend = [],
  budgetStatus = [],
  insights = [],
  recentTransactions = [],
  recentlyAccessed = [],
  language = "en",
}) {
  const t = translations[language] || translations.en;

  const pageNames = {
    dashboard: t.dashboard,
    transactions: t.transactions,
    budget: t.budget,
    savings: t.savings,
    insights: t.insights,
    assistant: t.financialAssistant,
    profile: t.profile,
    settings: t.settings,
    admin: t.adminDashboard,
  };

  return (
    <div className="page-body">
      {/* =========================
          SUMMARY CARDS
      ========================= */}
      <div className="summary-row">
        <SummaryCard
          label={t.totalIncome}
          value={summary.totalIncome}
          icon="⬆️"
          tone="income"
        />

        <SummaryCard
          label={t.totalExpenses}
          value={summary.totalExpenses}
          icon="⬇️"
          tone="expense"
        />

        <SummaryCard
          label={t.availableBalance}
          value={summary.balance}
          icon="💰"
          tone="indigo"
        />

        <SummaryCard
          label={t.savingsRate}
          value={summary.savingsRate}
          icon="📈"
          tone="savings"
          isPercent
        />
      </div>

      {/* =========================
          FINANCIAL ASSISTANT
      ========================= */}
      <AssistantCard
        insights={insights.slice(0, 4)}
        compact
        language={language}
      />

      {/* =========================
          INCOME VS EXPENSES
          + EXPENSE BREAKDOWN
      ========================= */}
      <div className="two-col">
        <div className="card section-card">
          <div className="section-card-head">
            <h3>{t.incomeVsExpenses}</h3>
          </div>

          <TrendChart data={trend} />
        </div>

        <div className="card section-card">
          <div className="section-card-head">
            <h3>{t.expenseBreakdown}</h3>
          </div>

          {breakdown.length === 0 ? (
            <p className="empty-state">{t.noExpenses}</p>
          ) : (
            <div className="donut-flex">
              <DonutChart
                data={breakdown}
                size={150}
                thickness={22}
              />

              <div className="donut-legend">
                {breakdown.slice(0, 6).map((b, i) => (
                  <div
                    className="donut-legend-row"
                    key={b.category}
                  >
                    <span className="donut-legend-left">
                      <span
                        className="donut-legend-dot"
                        style={{
                          background:
                            COLORS[i % COLORS.length],
                        }}
                      />
                      {t[`cat${b.category}`] || b.category}
                    </span>

                    <span className="donut-legend-value">
                      {formatCurrency(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================
          RECENT TRANSACTIONS
          + MONTHLY BUDGET
      ========================= */}
      <div className="two-col">
        {/* Recent Transactions */}
        <div className="card section-card">
          <div className="section-card-head">
            <h3>{t.recentTransactions}</h3>
          </div>

          <TransactionList
            transactions={recentTransactions.slice(0, 6)}
            compact
            language={language}
          />
        </div>

        {/* Monthly Budget */}
        <div className="card section-card">
          <div className="section-card-head">
            <h3>{t.monthlyBudget}</h3>
          </div>

          {budgetStatus.length === 0 ? (
            <p className="empty-state">{t.noBudgets}</p>
          ) : (
            budgetStatus.slice(0, 4).map((b) => (
              <BudgetProgress
                key={b.category}
                item={b}
                language={language}
              />
            ))
          )}
        </div>
      </div>

      {/* =========================
          RECENTLY ACCESSED
      ========================= */}
      <div className="card section-card">
        <div className="section-card-head">
          <h3>{t.recentlyAccessed}</h3>
        </div>

        {!recentlyAccessed || recentlyAccessed.length === 0 ? (
          <p className="empty-state">{t.noRecentActivity}</p>
        ) : (
          <div>
            {recentlyAccessed.map((item) => (
              <div
                key={`${item.page}-${item.accessedAt}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid #eef0f5",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#14213d",
                      fontSize: "14px",
                    }}
                  >
                    {pageNames[item.page] || item.name}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#8a92a3",
                      marginTop: "3px",
                    }}
                  >
                    {new Date(item.accessedAt).toLocaleString()}
                  </div>
                </div>

                <span style={{ fontSize: "18px" }}>→</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}