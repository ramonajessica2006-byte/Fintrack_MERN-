import React from "react";

const COLORS = ["#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#16A34A", "#0EA5E9", "#EF4444", "#14B8A6", "#8B5CF6", "#F97316"];

// data: [{ category, amount, percent }]
export default function DonutChart({ data, size = 180, thickness = 26 }) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAccum = 0;

  if (total === 0) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>No expenses yet this month</p>
      </div>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef1f5" strokeWidth={thickness} />
        {data.map((d, i) => {
          const fraction = d.amount / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const circle = (
            <circle
              key={d.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offsetAccum}
              strokeLinecap="butt"
            />
          );
          offsetAccum += dash;
          return circle;
        })}
      </g>
      <text x="50%" y="46%" textAnchor="middle" fontFamily="Sora, sans-serif" fontSize="15" fontWeight="700" fill="var(--text-primary)">
        ₹{total.toLocaleString("en-IN")}
      </text>
      <text x="50%" y="60%" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" fill="var(--text-muted)">
        Total spent
      </text>
    </svg>
  );
}

export { COLORS };
