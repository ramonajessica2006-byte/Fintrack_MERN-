import React from "react";
import "./HealthScoreCard.css";
import translations from "../utils/translations";

export default function HealthScoreCard({ health, language = "en" }) {
  const t = translations[language] || translations.en;

  const size = 132;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (health.overall / 100) * circumference;

  const color =
    health.overall >= 80
      ? "#16A34A"
      : health.overall >= 65
      ? "#4F46E5"
      : health.overall >= 45
      ? "#F59E0B"
      : "#EF4444";

  // Translate status label if needed
  const labelMap = {
    "Excellent Financial Health": t.excellentHealth,
    "Good Financial Health": t.goodHealth,
    "Fair Financial Health": t.fairHealth,
    "Needs Attention": t.needsAttention,
    "சிறந்த நிதி ஆரோக்கியம்": t.excellentHealth,
    "நல்ல நிதி ஆரோக்கியம்": t.goodHealth,
    "மிதமான நிதி ஆரோக்கியம்": t.fairHealth,
    "கவனம் தேவை": t.needsAttention,
  };

  const displayLabel = labelMap[health.label] || health.label;

  // Factor name map
  const factorMap = {
    "Budget Management": t.budgetManagement,
    "Savings Rate": t.savingsRate,
    "Spending Control": t.spendingControl,
    "Goal Progress": t.goalProgress,
    "பட்ஜெட் மேலாண்மை": t.budgetManagement,
    "சேமிப்பு விகிதம்": t.savingsRate,
    "செலவு கட்டுப்பாடு": t.spendingControl,
    "இலக்கு முன்னேற்றம்": t.goalProgress,
  };

  return (
    <div className="card health-card">
      <h3>{t.financialHealthScore}</h3>
      <div className="health-main">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#eef1f5"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
            />
          </g>
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            fontFamily="Sora, sans-serif"
            fontSize="28"
            fontWeight="800"
            fill="var(--text-primary)"
          >
            {health.overall}
          </text>
          <text
            x="50%"
            y="63%"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="11"
            fill="var(--text-muted)"
          >
            {t.outOf100}
          </text>
        </svg>
        <div className="health-label" style={{ color }}>
          {displayLabel}
        </div>
      </div>

      <div className="health-factors">
        {health.factors.map((f) => (
          <div className="health-factor" key={f.name}>
            <div className="health-factor-top">
              <span>{factorMap[f.name] || f.name}</span>
              <span>{f.score}</span>
            </div>
            <div className="health-factor-track">
              <div
                className="health-factor-fill"
                style={{ width: `${f.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
