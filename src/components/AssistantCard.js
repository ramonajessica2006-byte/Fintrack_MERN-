import React from "react";
import "./AssistantCard.css";

export default function AssistantCard({ insights, compact }) {
  return (
    <div className="card assistant-card">
      <div className="assistant-card-header">
        <div className="assistant-card-badge">🤖</div>
        <div>
          <h3>Your Financial Assistant</h3>
          <p>Personalized insights based on your profile and spending behavior</p>
        </div>
      </div>

      <div className="assistant-pipeline">
        <span>Your data</span>
        <span className="pipeline-arrow">→</span>
        <span>Behavior analysis</span>
        <span className="pipeline-arrow">→</span>
        <span>Your profile</span>
        <span className="pipeline-arrow">→</span>
        <span className="pipeline-final">Personalized advice</span>
      </div>

      <div className={`assistant-insights ${compact ? "compact" : ""}`}>
        {insights.map((insight, i) => (
          <div className="assistant-insight" key={i}>
            <div className="assistant-insight-head">
              <span className="assistant-insight-icon">{insight.icon}</span>
              <span className="assistant-insight-heading">{insight.heading}</span>
            </div>
            <p className="assistant-insight-message">{insight.message}</p>
            <div className="assistant-insight-recommendation">
              <span className="rec-label">💡 Recommendation</span>
              <span>{insight.recommendation}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
