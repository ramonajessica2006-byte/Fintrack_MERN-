import React from "react";
import "./HealthScoreCard.css";

export default function HealthScoreCard({ health }) {
  const size = 132;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (health.overall / 100) * circumference;

  const color = health.overall >= 80 ? "#16A34A" : health.overall >= 65 ? "#4F46E5" : health.overall >= 45 ? "#F59E0B" : "#EF4444";

  return (
    <div className="card health-card">
      <h3>Financial Health Score</h3>
      <div className="health-main">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef1f5" strokeWidth={stroke} />
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
          <text x="50%" y="47%" textAnchor="middle" fontFamily="Sora, sans-serif" fontSize="28" fontWeight="800" fill="var(--text-primary)">
            {health.overall}
          </text>
          <text x="50%" y="63%" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" fill="var(--text-muted)">
            out of 100
          </text>
        </svg>
        <div className="health-label" style={{ color }}>
          {health.label}
        </div>
      </div>

      <div className="health-factors">
        {health.factors.map((f) => (
          <div className="health-factor" key={f.name}>
            <div className="health-factor-top">
              <span>{f.name}</span>
              <span>{f.score}</span>
            </div>
            <div className="health-factor-track">
              <div className="health-factor-fill" style={{ width: `${f.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
