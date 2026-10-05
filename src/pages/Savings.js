import React, { useState } from "react";
import "./Pages.css";
import SummaryCard from "../components/SummaryCard";
import GoalCard from "../components/GoalCard";
import GoalModal from "../components/GoalModal";

export default function Savings({ summary, goalsSummary, onAddMoney, onSaveGoal, onDeleteGoal }) {
  const [modalGoal, setModalGoal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const currentSavings = goalsSummary.reduce((s, g) => s + g.saved, 0);

  return (
    <div className="page-body">
      <div className="summary-row">
        <SummaryCard label="Current Savings" value={currentSavings} icon="🏦" tone="savings" />
        <SummaryCard label="Savings Rate" value={summary.savingsRate} icon="📈" tone="indigo" isPercent />
        <SummaryCard label="Available Balance" value={summary.balance} icon="💰" tone="income" />
      </div>

      <div className="card section-card">
        <div className="section-card-head">
          <h3>Savings Goals</h3>
          <button className="link-btn" onClick={() => { setModalGoal(null); setShowModal(true); }}>
            + Add Goal
          </button>
        </div>

        {goalsSummary.length === 0 ? (
          <p className="empty-state">No savings goals yet. Add one to start tracking progress.</p>
        ) : (
          <div className="goal-grid">
            {goalsSummary.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onAddMoney={onAddMoney}
                onEdit={(goal) => { setModalGoal(goal); setShowModal(true); }}
                onDelete={onDeleteGoal}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <GoalModal
          initial={modalGoal}
          onClose={() => setShowModal(false)}
          onSave={(goal) => {
            onSaveGoal(goal);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
