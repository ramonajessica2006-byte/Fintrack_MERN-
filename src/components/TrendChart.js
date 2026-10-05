import React from "react";

// data: [{ label, income, expenses, savings }]
export default function TrendChart({ data, height = 220 }) {
  const width = Math.max(360, data.length * 90);
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expenses]));
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = (width - padding.left - padding.right) / data.length;
  const barWidth = 14;

  const scaleY = (v) => (v / max) * chartHeight;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((d, i) => {
          const cx = padding.left + groupWidth * i + groupWidth / 2;
          const incomeH = scaleY(d.income);
          const expenseH = scaleY(d.expenses);
          return (
            <g key={d.label}>
              <rect
                x={cx - barWidth - 3}
                y={padding.top + chartHeight - incomeH}
                width={barWidth}
                height={incomeH}
                rx={4}
                fill="#16A34A"
              />
              <rect
                x={cx + 3}
                y={padding.top + chartHeight - expenseH}
                width={barWidth}
                height={expenseH}
                rx={4}
                fill="#EF4444"
              />
              <text
                x={cx}
                y={height - 8}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="12"
                fill="var(--text-secondary)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight}
          stroke="#e6e9ef"
        />
      </svg>
      <div style={{ display: "flex", gap: 18, justifyContent: "center", marginTop: 6 }}>
        <Legend color="#16A34A" label="Income" />
        <Legend color="#EF4444" label="Expenses" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}
