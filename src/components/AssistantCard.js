import React from "react";
import "./AssistantCard.css";
import translations from "../utils/translations";

export default function AssistantCard({ insights = [], compact, language = "en" }) {
  const t = translations[language] || translations.en;

  return (
    <div className="card assistant-card">
      <div className="assistant-card-header">
        <div className="assistant-card-badge">🤖</div>
        <div>
          <h3>{t.financialAssistant}</h3>
          <p>{t.financialAssistantSubtitle}</p>
        </div>
      </div>

      <div className="assistant-pipeline">
        <span>{t.yourData}</span>
        <span className="pipeline-arrow">→</span>
        <span>{t.behaviorAnalysis}</span>
        <span className="pipeline-arrow">→</span>
        <span>{t.yourProfile}</span>
        <span className="pipeline-arrow">→</span>
        <span className="pipeline-final">{t.personalizedAdvice}</span>
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
              <span className="rec-label">💡 {t.recommendation}</span>
              <span>{insight.recommendation}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
