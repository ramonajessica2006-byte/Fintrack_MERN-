// The "brain" of FinTrack.
//
// Every function here takes raw data (transactions / budgets / goals / user)
// and derives numbers or insights from it. Nothing is hardcoded — change the
// transactions and every card in the app (Dashboard, Budget, Savings,
// Insights, the Financial Assistant) updates because it all reads from
// these same functions.

const FIXED_CATEGORIES = ["Rent", "EMI", "Bills", "Healthcare", "Subscription"];

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function daysRemainingInMonth() {
  const now = new Date();
  return daysInCurrentMonth() - now.getDate();
}

export function currentMonthTransactions(transactions) {
  const now = new Date();
  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

export function computeSummary(transactions) {
  const monthTx = currentMonthTransactions(transactions);
  const totalIncome = monthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = monthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  return { totalIncome, totalExpenses, balance, savingsRate };
}

export function computeCategoryBreakdown(transactions) {
  const monthTx = currentMonthTransactions(transactions).filter((t) => t.type === "expense");
  const map = {};
  monthTx.forEach((t) => {
    map[t.category] = (map[t.category] || 0) + Number(t.amount);
  });
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeMonthlyTrend(transactions, months = 6) {
  const now = new Date();
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const monthTx = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    result.push({ label, income, expenses, savings: income - expenses });
  }
  return result;
}

export function computeBudgetStatus(transactions, budgets) {
  const breakdown = computeCategoryBreakdown(transactions);
  const spentMap = {};
  breakdown.forEach((b) => (spentMap[b.category] = b.amount));

  return budgets.map((b) => {
    const spent = spentMap[b.category] || 0;
    const percent = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
    let status = "normal";
    if (percent >= 100) status = "exceeded";
    else if (percent >= 80) status = "warning";
    return {
      ...b,
      spent,
      remaining: b.limit - spent,
      percent: Math.min(percent, 999),
      status,
    };
  });
}

export function computeGoalsSummary(goals) {
  return goals.map((g) => ({
    ...g,
    percent: g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0,
  }));
}

export function computeHealthScore({ summary, budgetStatus, goalsSummary }) {
  // Budget management: fewer exceeded/warning categories = better
  const budgetPenalty = budgetStatus.reduce((acc, b) => {
    if (b.status === "exceeded") return acc + 12;
    if (b.status === "warning") return acc + 5;
    return acc;
  }, 0);
  const budgetScore = Math.max(0, 100 - budgetPenalty);

  // Savings rate: 20%+ is considered healthy for this prototype
  const savingsScore = Math.max(0, Math.min(100, Math.round((summary.savingsRate / 25) * 100)));

  // Spending control: balance shouldn't be negative
  const spendingScore = summary.totalIncome > 0
    ? Math.max(0, Math.min(100, Math.round((summary.balance / summary.totalIncome) * 100 + 60)))
    : 50;

  // Goal progress: average of goal completion percentages
  const goalScore = goalsSummary.length > 0
    ? Math.round(goalsSummary.reduce((s, g) => s + g.percent, 0) / goalsSummary.length)
    : 50;

  const overall = Math.round(
    budgetScore * 0.3 + savingsScore * 0.3 + spendingScore * 0.25 + goalScore * 0.15
  );

  let label = "Needs Attention";
  if (overall >= 80) label = "Excellent Financial Health";
  else if (overall >= 65) label = "Good Financial Health";
  else if (overall >= 45) label = "Fair Financial Health";

  return {
    overall: Math.max(0, Math.min(100, overall)),
    label,
    factors: [
      { name: "Budget Management", score: Math.round(budgetScore) },
      { name: "Savings Rate", score: Math.round(savingsScore) },
      { name: "Spending Control", score: Math.round(spendingScore) },
      { name: "Goal Progress", score: Math.round(goalScore) },
    ],
  };
}

// ---------------------------------------------------------------------
// Personalization engine: this is the core "financial assistant" logic.
// A student profile and an adult profile read the same underlying data
// but interpret it through different lenses (allowance/day-rate framing
// for students; fixed-expense/EMI/emergency-fund framing for adults).
// ---------------------------------------------------------------------

export function generateInsights({ user, transactions, budgets, goals, summary, breakdown }) {
  const isStudent = user?.userType === "student";
  const insights = [];
  const remainingDays = Math.max(1, daysRemainingInMonth());

  if (isStudent) {
    // 1. Daily spending limit based on remaining balance & remaining days
    const dailyLimit = Math.max(0, Math.round(summary.balance / remainingDays));
    insights.push({
      icon: "🎓",
      heading: "Student Financial Insight",
      message: `You have ${remainingDays} day${remainingDays === 1 ? "" : "s"} left this month and ₹${summary.balance.toLocaleString("en-IN")} available.`,
      recommendation: `Your recommended daily spending limit is ₹${dailyLimit.toLocaleString("en-IN")} to stay within budget for the rest of the month.`,
    });

    // 2. Food overspending vs budget
    const foodBudget = budgets.find((b) => b.category === "Food");
    const foodSpent = breakdown.find((b) => b.category === "Food")?.amount || 0;
    if (foodBudget && foodSpent > foodBudget.limit) {
      const over = foodSpent - foodBudget.limit;
      const perDay = Math.max(0, Math.round((foodBudget.limit - foodSpent + foodBudget.limit) / remainingDays));
      insights.push({
        icon: "🍔",
        heading: "Food Spending Alert",
        message: `You've spent ₹${foodSpent.toLocaleString("en-IN")} on food this month, which is ₹${over.toLocaleString("en-IN")} over your ₹${foodBudget.limit.toLocaleString("en-IN")} budget.`,
        recommendation: `Try limiting food spending to about ₹${Math.max(perDay, 100).toLocaleString("en-IN")}/day for the rest of the month.`,
      });
    } else if (foodBudget) {
      insights.push({
        icon: "🍔",
        heading: "Food Budget On Track",
        message: `You've used ₹${foodSpent.toLocaleString("en-IN")} of your ₹${foodBudget.limit.toLocaleString("en-IN")} food budget this month.`,
        recommendation: `Keep it up — you're pacing well within your food budget.`,
      });
    }

    // 3. Highest category callout
    if (breakdown.length > 0) {
      const top = breakdown[0];
      insights.push({
        icon: "📊",
        heading: "Biggest Expense Category",
        message: `${top.category} is your highest expense category this month at ₹${top.amount.toLocaleString("en-IN")} (${top.percent}% of spending).`,
        recommendation: top.category === "Entertainment" || top.category === "Shopping"
          ? `Trimming ${top.category.toLowerCase()} spending by even ₹500 could speed up your savings goals.`
          : `Keep an eye on ${top.category.toLowerCase()} — it's shaping most of your monthly outflow.`,
      });
    }

    // 4. Goal progress nudge
    const goalsSummary = computeGoalsSummary(goals);
    if (goalsSummary.length > 0) {
      const nearest = [...goalsSummary].sort((a, b) => b.percent - a.percent)[0];
      insights.push({
        icon: "🎯",
        heading: "Savings Goal Progress",
        message: `You're ${nearest.percent}% of the way to your "${nearest.title}" goal (₹${nearest.saved.toLocaleString("en-IN")} of ₹${nearest.target.toLocaleString("en-IN")}).`,
        recommendation: summary.savingsRate < 20
          ? `Setting aside even ₹200 extra this week would help this goal grow faster.`
          : `Great pace — stay consistent and you'll hit this goal on schedule.`,
      });
    }
  } else {
    // Working Adult framing
    const fixedTotal = breakdown
      .filter((b) => FIXED_CATEGORIES.includes(b.category))
      .reduce((s, b) => s + b.amount, 0);
    const fixedPercent = summary.totalIncome > 0 ? Math.round((fixedTotal / summary.totalIncome) * 100) : 0;

    insights.push({
      icon: "💼",
      heading: "Adult Financial Insight",
      message: fixedPercent >= 45
        ? `Your fixed expenses (rent, EMI, bills, insurance) account for ${fixedPercent}% of your monthly income — a large share.`
        : `Your fixed expenses (rent, EMI, bills, insurance) account for ${fixedPercent}% of your monthly income, which is reasonably healthy.`,
      recommendation: fixedPercent >= 45
        ? `Consider reviewing recurring costs like subscriptions or EMIs, and look for ways to free up cash flow.`
        : `You have healthy room to grow your savings and investments each month.`,
    });

    // EMI burden specifically
    const emiSpent = breakdown.find((b) => b.category === "EMI")?.amount || 0;
    if (emiSpent > 0) {
      const emiPercent = summary.totalIncome > 0 ? Math.round((emiSpent / summary.totalIncome) * 100) : 0;
      insights.push({
        icon: "🏦",
        heading: "EMI Burden",
        message: `Your EMI payments total ₹${emiSpent.toLocaleString("en-IN")}, which is ${emiPercent}% of this month's income.`,
        recommendation: emiPercent > 20
          ? `Try to keep EMI obligations under 20% of income where possible before taking on new loans.`
          : `Your EMI load is within a comfortable range.`,
      });
    }

    // Emergency fund goal
    const goalsSummary = computeGoalsSummary(goals);
    const emergencyGoal = goalsSummary.find((g) => /emergency/i.test(g.title));
    if (emergencyGoal) {
      const gap = emergencyGoal.target - emergencyGoal.saved;
      insights.push({
        icon: "🛡️",
        heading: "Emergency Fund",
        message: `Your emergency fund is at ${emergencyGoal.percent}% of target (₹${emergencyGoal.saved.toLocaleString("en-IN")} of ₹${emergencyGoal.target.toLocaleString("en-IN")}).`,
        recommendation: emergencyGoal.percent < 70
          ? `Consider allocating part of this month's ₹${Math.max(summary.balance, 0).toLocaleString("en-IN")} balance toward closing the ₹${gap.toLocaleString("en-IN")} gap.`
          : `You're well-covered — this is a strong safety net.`,
      });
    }

    // Savings rate advice
    insights.push({
      icon: "📈",
      heading: "Savings Rate",
      message: `You're currently saving ${summary.savingsRate}% of your income this month.`,
      recommendation: summary.savingsRate < 20
        ? `Increasing your monthly savings by around ₹2,000 could meaningfully improve your savings rate.`
        : `A savings rate above 20% is considered strong — keep this habit consistent.`,
    });
  }

  return insights;
}

export function generateImprovementTips({ user, summary, breakdown, budgetStatus, goals }) {
  const isStudent = user?.userType === "student";
  const tips = [];
  const remainingDays = Math.max(1, daysRemainingInMonth());

  if (isStudent) {
    const dailyLimit = Math.max(0, Math.round(summary.balance / remainingDays));
    tips.push(`🎓 You have ${remainingDays} days remaining and ₹${summary.balance.toLocaleString("en-IN")} available. Your recommended daily spending limit is ₹${dailyLimit.toLocaleString("en-IN")}.`);
    if (breakdown[0]) {
      tips.push(`🍔 ${breakdown[0].category} is your highest expense category this month.`);
    }
    const entertainment = breakdown.find((b) => b.category === "Entertainment");
    if (entertainment) {
      tips.push(`💰 Reducing entertainment expenses by ₹${Math.min(500, entertainment.amount).toLocaleString("en-IN")} could help you reach your savings goal faster.`);
    }
  } else {
    const fixedTotal = breakdown
      .filter((b) => FIXED_CATEGORIES.includes(b.category))
      .reduce((s, b) => s + b.amount, 0);
    const fixedPercent = summary.totalIncome > 0 ? Math.round((fixedTotal / summary.totalIncome) * 100) : 0;
    if (fixedPercent >= 40) {
      tips.push(`💼 Your fixed expenses are high compared with your income (${fixedPercent}% this month).`);
    }
    tips.push(`🏦 Increasing your monthly savings by ₹2,000 could improve your savings rate.`);
    const emergencyGoal = goals.find((g) => /emergency/i.test(g.title));
    if (emergencyGoal && emergencyGoal.saved < emergencyGoal.target) {
      tips.push(`🛡️ Your emergency fund is below target. Consider allocating part of your monthly balance toward it.`);
    }
  }

  const exceeded = budgetStatus.filter((b) => b.status === "exceeded");
  exceeded.forEach((b) => {
    tips.push(`🔴 You've exceeded your ${b.category} budget by ₹${Math.abs(b.remaining).toLocaleString("en-IN")}.`);
  });

  return tips;
}

export function generateNotifications({ budgetStatus, goals, summary }) {
  const notifications = [];
  budgetStatus.forEach((b) => {
    if (b.status === "exceeded") {
      notifications.push({ icon: "🔴", text: `${b.category} budget exceeded by ₹${Math.abs(b.remaining).toLocaleString("en-IN")}.` });
    } else if (b.status === "warning") {
      notifications.push({ icon: "⚠️", text: `${b.category} budget is ${b.percent}% used.` });
    }
  });
  const goalsSummary = computeGoalsSummary(goals);
  goalsSummary.forEach((g) => {
    if (g.percent >= 100) {
      notifications.push({ icon: "🎉", text: `You've reached your "${g.title}" goal!` });
    } else if (g.percent >= 75) {
      notifications.push({ icon: "🎯", text: `You're ${g.percent}% of the way to your "${g.title}" goal.` });
    }
  });
  if (summary.savingsRate >= 30) {
    notifications.push({ icon: "💰", text: `Your savings rate is a strong ${summary.savingsRate}% this month.` });
  }
  return notifications;
}

export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}
