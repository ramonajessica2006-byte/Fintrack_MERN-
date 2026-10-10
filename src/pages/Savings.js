import React, { useState } from "react";
import "./Pages.css";
import SummaryCard from "../components/SummaryCard";
import GoalCard from "../components/GoalCard";
import GoalModal from "../components/GoalModal";
import SavingsChallenges from "../components/SavingsChallenges";
import translations from "../utils/translations";

export default function Savings({
  summary,
  goalsSummary = [],
  onAddMoney,
  onSaveGoal,
  onDeleteGoal,
  language = "en",
}) {
  const [modalGoal, setModalGoal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const t = translations[language] || translations.en;

  const currentSavings = goalsSummary.reduce((s, g) => s + g.saved, 0);

  // Wrapper for onAddMoney so that adding money to an existing goal
  // also registers as an authentic confirmed savings contribution for streaks & challenges
  const handleGoalAddMoney = async (goalId, amount) => {
    if (onAddMoney) {
      onAddMoney(goalId, amount);
    }

    const token = localStorage.getItem("fintrack_token");
    if (token) {
      try {
        const goal = goalsSummary.find((g) => g.id === goalId);
        await fetch("http://localhost:5000/api/challenges/contribute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            goalId,
            note: goal ? `Goal deposit: ${goal.title}` : "Goal deposit",
          }),
        });
        setRefreshKey((k) => k + 1);
      } catch (err) {
        console.warn("Could not sync goal contribution with challenges:", err);
      }
    }
  };

  return (
    <div className="page-body">
      {/* TOP SUMMARY METRICS */}
      <div className="summary-row">
        <SummaryCard
          label={t.currentSavings}
          value={currentSavings}
          icon="🏦"
          tone="savings"
        />
        <SummaryCard
          label={t.savingsRate}
          value={summary.savingsRate}
          icon="📈"
          tone="indigo"
          isPercent
        />
        <SummaryCard
          label={t.availableBalance}
          value={summary.balance}
          icon="💰"
          tone="income"
        />
      </div>

      {/* SAVINGS STREAK & CHALLENGE MODE SECTION */}
      <SavingsChallenges
        key={refreshKey}
        language={language}
        goalsSummary={goalsSummary}
        onGoalAddMoney={handleGoalAddMoney}
      />

      {/* PRESERVED SAVINGS GOALS SECTION */}
      <div className="card section-card savings-goals-section">
        <div className="section-card-head">
          <div className="section-card-title-wrap">
            <h3>🎯 {t.savingsGoals}</h3>
            {goalsSummary.length > 0 && (
              <span className="section-card-count">
                {goalsSummary.length}
              </span>
            )}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setModalGoal(null);
              setShowModal(true);
            }}
          >
            + {t.addGoal}
          </button>
        </div>

        {goalsSummary.length === 0 ? (
          <div className="empty-goals-card">
            <span className="empty-goals-icon">🎯</span>
            <h4>{t.noSavingsGoals}</h4>
            <p className="empty-goals-sub">
              {language === "ta"
                ? "விடுமுறை, அவசரகால நிதி அல்லது பெரிய வாங்குதல்களுக்கான குறிப்பிட்ட சேமிப்பு இலக்குகளை அமைக்கவும்."
                : "Create dedicated savings targets for an emergency fund, travel, education, or big milestones."}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setModalGoal(null);
                setShowModal(true);
              }}
            >
              + {t.addGoal}
            </button>
          </div>
        ) : (
          <div className="goal-grid">
            {goalsSummary.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onAddMoney={handleGoalAddMoney}
                onEdit={(goal) => {
                  setModalGoal(goal);
                  setShowModal(true);
                }}
                onDelete={onDeleteGoal}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      {/* EDIT / CREATE GOAL MODAL */}
      {showModal && (
        <GoalModal
          initial={modalGoal}
          onClose={() => setShowModal(false)}
          onSave={(goal) => {
            onSaveGoal(goal);
            setShowModal(false);
          }}
          language={language}
        />
      )}
    </div>
  );
}
