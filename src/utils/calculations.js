// The "brain" of FinTrack: Personal Financial Intelligence Engine.
// Every function here takes raw user data (transactions, budgets, goals, user profile)
// and derives personalized calculations, trends, scores, and actionable recommendations.
// No financial results or recommendations are hardcoded.

const FIXED_CATEGORIES = ["Rent", "EMI", "Bills", "Healthcare", "Subscription"];

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function daysRemainingInMonth() {
  const now = new Date();
  return Math.max(1, daysInCurrentMonth() - now.getDate());
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
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((balance / totalIncome) * 100)) : 0;

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
    percent:
      g.target > 0
        ? Math.min(100, Math.round((g.saved / g.target) * 100))
        : g.percent || 0,
  }));
}

export function computeHealthScore({ summary, budgetStatus, goalsSummary, language = "en" }) {
  const isTa = language === "ta";

  // Budget management factor (fewer exceeded/warning categories = better)
  const budgetPenalty = budgetStatus.reduce((acc, b) => {
    if (b.status === "exceeded") return acc + 15;
    if (b.status === "warning") return acc + 7;
    return acc;
  }, 0);
  const budgetScore = Math.max(0, 100 - budgetPenalty);

  // Savings rate factor
  const savingsScore = Math.max(0, Math.min(100, Math.round((summary.savingsRate / 25) * 100)));

  // Spending control factor
  const spendingScore =
    summary.totalIncome > 0
      ? Math.max(0, Math.min(100, Math.round((summary.balance / summary.totalIncome) * 100 + 50)))
      : summary.totalExpenses === 0
      ? 50
      : 30;

  // Goal progress factor
  const goalScore =
    goalsSummary.length > 0
      ? Math.round(goalsSummary.reduce((s, g) => s + g.percent, 0) / goalsSummary.length)
      : 50;

  const overall = Math.round(
    budgetScore * 0.3 + savingsScore * 0.3 + spendingScore * 0.25 + goalScore * 0.15
  );

  let label = isTa ? "கவனம் தேவை" : "Needs Attention";
  if (overall >= 80) {
    label = isTa ? "சிறந்த நிதி ஆரோக்கியம்" : "Excellent Financial Health";
  } else if (overall >= 65) {
    label = isTa ? "நல்ல நிதி ஆரோக்கியம்" : "Good Financial Health";
  } else if (overall >= 45) {
    label = isTa ? "மிதமான நிதி ஆரோக்கியம்" : "Fair Financial Health";
  }

  return {
    overall: Math.max(0, Math.min(100, overall)),
    label,
    factors: [
      {
        name: isTa ? "பட்ஜெட் மேலாண்மை" : "Budget Management",
        score: Math.round(budgetScore),
      },
      {
        name: isTa ? "சேமிப்பு விகிதம்" : "Savings Rate",
        score: Math.round(savingsScore),
      },
      {
        name: isTa ? "செலவு கட்டுப்பாடு" : "Spending Control",
        score: Math.round(spendingScore),
      },
      {
        name: isTa ? "இலக்கு முன்னேற்றம்" : "Goal Progress",
        score: Math.round(goalScore),
      },
    ],
  };
}

// ---------------------------------------------------------------------
// Personalization engine: core Financial Assistant logic.
// Evaluates real user data for Students vs Working Adults.
// All savings amounts, emergency fund targets, and daily budgets are calculated
// dynamically from actual financial metrics.
// ---------------------------------------------------------------------

export function generateInsights({
  user,
  transactions = [],
  budgets = [],
  goals = [],
  summary,
  breakdown = [],
  trend = [],
  language = "en",
}) {
  const isTa = language === "ta";
  const isStudent = user?.userType === "student";
  const insights = [];
  const remainingDays = daysRemainingInMonth();

  // If user has zero transactions
  if (!transactions || transactions.length === 0) {
    if (isStudent) {
      insights.push({
        icon: "🎓",
        heading: isTa ? "மாணவருக்கான நிதி வழிகாட்டல்" : "Student Financial Guidance",
        message: isTa
          ? "இதுவரை பரிவர்த்தனைகள் எதுவும் பதிவு செய்யப்படவில்லை. உங்கள் மாதாந்திர பாக்கெட் மணி மற்றும் தினசரி செலவுகளை பதிவு செய்யத் தொடங்குங்கள்."
          : "No transactions recorded yet. Start logging your pocket money or allowance and campus expenses.",
        recommendation: isTa
          ? "உங்கள் வருமானம் மற்றும் செலவுகளை பதிவு செய்தால், உங்கள் தினசரி செலவு வரம்பு தானாக கணக்கிடப்படும்."
          : "Add your allowance and campus expenses to unlock your personalized daily spending limit.",
      });
    } else {
      insights.push({
        icon: "💼",
        heading: isTa ? "பணிபுரியும் பெரியவருக்கான நிதி வழிகாட்டல்" : "Adult Financial Guidance",
        message: isTa
          ? "இதுவரை பரிவர்த்தனைகள் எதுவும் பதிவு செய்யப்படவில்லை. உங்கள் சம்பளம் மற்றும் மாதாந்திர செலவுகளை உள்ளிடவும்."
          : "No transactions recorded yet. Start logging your monthly salary and recurring expenses.",
        recommendation: isTa
          ? "உங்கள் உண்மையான நிதித் தரவுகளின் அடிப்படையில் நிலையான செலவு விகிதம் மற்றும் அவசரகால நிதி பரிந்துரைகள் இங்கே உருவாக்கப்படும்."
          : "Add your monthly income and bills to generate your fixed expense ratio, debt burden, and emergency fund targets.",
      });
    }
    return insights;
  }

  // Calculate dynamic savings target based on actual income
  const dynamicSavingsTarget =
    summary.totalIncome > 0
      ? Math.max(300, Math.round((summary.totalIncome * 0.05) / 100) * 100)
      : Math.max(300, Math.round((summary.totalExpenses * 0.1) / 100) * 100);

  if (isStudent) {
    // 1. Daily spending limit based on remaining balance & remaining days
    const dailyLimit = Math.max(0, Math.round(summary.balance / remainingDays));
    insights.push({
      icon: "🎓",
      heading: isTa ? "மாணவருக்கான நிதி தகவல்" : "Student Financial Insight",
      message: isTa
        ? `இந்த மாதத்தில் இன்னும் ${remainingDays} நாட்கள் மீதமுள்ளன, உங்களிடம் கிடைக்கும் இருப்பு ${formatCurrency(summary.balance)}.`
        : `You have ${remainingDays} day${remainingDays === 1 ? "" : "s"} left this month and ${formatCurrency(summary.balance)} available balance.`,
      recommendation:
        summary.balance <= 0
          ? isTa
            ? "உங்கள் மாதாந்திர இருப்பு தீர்ந்துவிட்டது. அத்தியாவசியமற்ற செலவுகளைத் தவிர்த்து சேமிக்க முயற்சி செய்யுங்கள்."
            : "Your balance is fully used. Try to pause non-essential purchases for the rest of the month."
          : isTa
          ? `மீதமுள்ள நாட்களில் பட்ஜெட்டுக்குள் இருக்க உங்கள் பரிந்துரைக்கப்பட்ட தினசரி செலவு வரம்பு ${formatCurrency(dailyLimit)} ஆகும்.`
          : `Your recommended daily spending limit is ${formatCurrency(dailyLimit)} to stay comfortably within budget.`,
    });

    // 2. Food / Mess overspending vs budget
    const foodBudget = budgets.find((b) => b.category === "Food");
    const foodSpent = breakdown.find((b) => b.category === "Food")?.amount || 0;
    if (foodBudget && foodSpent > foodBudget.limit) {
      const over = foodSpent - foodBudget.limit;
      const safeDailyFood = Math.max(50, Math.round((foodBudget.limit) / daysInCurrentMonth()));
      insights.push({
        icon: "🍔",
        heading: isTa ? "உணவு செலவு எச்சரிக்கை" : "Food Spending Alert",
        message: isTa
          ? `இந்த மாதம் உணவிற்காக ${formatCurrency(foodSpent)} செலவிட்டுள்ளீர்கள், இது உங்கள் பட்ஜெட்டை விட ${formatCurrency(over)} அதிகமாகும்.`
          : `You've spent ${formatCurrency(foodSpent)} on food this month, which is ${formatCurrency(over)} over your ${formatCurrency(foodBudget.limit)} budget.`,
        recommendation: isTa
          ? `மீதமுள்ள நாட்களில் வெளிப்புற உணவைக் குறைத்து தினசரி உணவுச் செலவை சுமார் ${formatCurrency(safeDailyFood)} வரம்பிற்குள் வைத்திருக்க முயலுங்கள்.`
          : `Try limiting outside dining to about ${formatCurrency(safeDailyFood)}/day for the remaining days.`,
      });
    } else if (foodBudget) {
      insights.push({
        icon: "🍔",
        heading: isTa ? "உணவு பட்ஜெட் சரியான பாதையில் உள்ளது" : "Food Budget On Track",
        message: isTa
          ? `உங்கள் ${formatCurrency(foodBudget.limit)} உணவு பட்ஜெட்டில் ${formatCurrency(foodSpent)} பயன்படுத்தப்பட்டுள்ளது.`
          : `You've used ${formatCurrency(foodSpent)} of your ${formatCurrency(foodBudget.limit)} food budget this month.`,
        recommendation: isTa
          ? "சிறந்த திட்டமிடல் — உங்கள் உணவுச் செலவு பட்ஜெட் வரம்பிற்குள் உள்ளது."
          : "Keep it up — your food expenses are pacing well within budget limits.",
      });
    }

    // 3. Highest category callout
    if (breakdown.length > 0) {
      const top = breakdown[0];
      const trimAmount = Math.max(100, Math.round(top.amount * 0.15));
      insights.push({
        icon: "📊",
        heading: isTa ? "மிகப்பெரிய செலவு வகை" : "Biggest Expense Category",
        message: isTa
          ? `${top.category} உங்கள் அதிகபட்ச செலவு வகை (${formatCurrency(top.amount)}, செலவில் ${top.percent}%).`
          : `${top.category} is your highest expense category this month at ${formatCurrency(top.amount)} (${top.percent}% of total spending).`,
        recommendation: isTa
          ? `${top.category} செலவை சுமார் ${formatCurrency(trimAmount)} குறைப்பது உங்கள் சேமிப்பை அதிகரிக்க உதவும்.`
          : `Trimming ${top.category.toLowerCase()} spending by even ${formatCurrency(trimAmount)} could accelerate your savings.`,
      });
    }

    // 4. Student Goal Progress
    const goalsSummary = computeGoalsSummary(goals);
    if (goalsSummary.length > 0) {
      const nearest = [...goalsSummary].sort((a, b) => b.percent - a.percent)[0];
      const goalRemaining = nearest.target - nearest.saved;
      const suggestedContribution = Math.min(goalRemaining, Math.max(100, Math.round(summary.balance * 0.2)));
      insights.push({
        icon: "🎯",
        heading: isTa ? "சேமிப்பு இலக்கு முன்னேற்றம்" : "Savings Goal Progress",
        message: isTa
          ? `உங்கள் "${nearest.title}" இலக்கில் ${nearest.percent}% நிறைவடைந்துள்ளது (${formatCurrency(nearest.saved)} / ${formatCurrency(nearest.target)}).`
          : `You're ${nearest.percent}% of the way to your "${nearest.title}" goal (${formatCurrency(nearest.saved)} of ${formatCurrency(nearest.target)}).`,
        recommendation: isTa
          ? summary.balance > 0
            ? `உங்கள் இருப்பிலிருந்து ${formatCurrency(suggestedContribution)} தொகையை இந்த இலக்கிற்கு ஒதுக்குவது விரைவாக அடைய உதவும்.`
            : "தொடர்ந்து சீராக சேமித்து வந்தால் உங்கள் இலக்கை சரியான நேரத்தில் அடையலாம்."
          : summary.balance > 0
          ? `Allocating ${formatCurrency(suggestedContribution)} from your available balance will bring you closer to completion.`
          : "Consistent small contributions will help you reach this goal on time.",
      });
    }
  } else {
    // Working Adult Framing
    const fixedTotal = breakdown
      .filter((b) => FIXED_CATEGORIES.includes(b.category))
      .reduce((s, b) => s + b.amount, 0);
    const fixedPercent = summary.totalIncome > 0 ? Math.round((fixedTotal / summary.totalIncome) * 100) : 0;

    insights.push({
      icon: "💼",
      heading: isTa ? "பணிபுரியும் பெரியவருக்கான நிதி தகவல்" : "Adult Financial Insight",
      message: isTa
        ? fixedPercent >= 50
          ? `உங்கள் நிலையான செலவுகள் (வாடகை, EMI, பில்கள், காப்பீடு) உங்கள் மாத வருமானத்தில் ${fixedPercent}% ஆக உள்ளது — இது மிக அதிகமாகும்.`
          : `உங்கள் நிலையான செலவுகள் (வாடகை, EMI, பில்கள், காப்பீடு) உங்கள் மாத வருமானத்தில் ${fixedPercent}% ஆக உள்ளது, இது ஆரோக்கியமானது.`
        : fixedPercent >= 50
        ? `Your fixed expenses (rent, EMI, bills, insurance) account for ${fixedPercent}% of your monthly income — higher than the recommended 50% benchmark.`
        : `Your fixed expenses (rent, EMI, bills, insurance) account for ${fixedPercent}% of your monthly income, which is within a healthy range.`,
      recommendation: isTa
        ? fixedPercent >= 50
          ? "சந்தாக்கள் அல்லது தேவையற்ற நிலையான கட்டணங்களை மறுபரிசீலனை செய்து பணப்புழக்கத்தை அதிகரிக்க முயலுங்கள்."
          : "ஒவ்வொரு மாதமும் உங்கள் சேமிப்பு மற்றும் முதலீடுகளை அதிகரிக்க உங்களுக்கு போதுமான நிதி இடைவெளி உள்ளது."
        : fixedPercent >= 50
        ? "Consider reviewing recurring subscriptions or negotiating utility rates to free up cash flow."
        : "You have healthy financial room to grow your monthly savings and investments.",
    });

    // EMI Burden Specifically
    const emiSpent = breakdown.find((b) => b.category === "EMI")?.amount || 0;
    if (emiSpent > 0) {
      const emiPercent = summary.totalIncome > 0 ? Math.round((emiSpent / summary.totalIncome) * 100) : 0;
      insights.push({
        icon: "🏦",
        heading: isTa ? "இ.எம்.ஐ சுமை" : "EMI Burden",
        message: isTa
          ? `உங்கள் மாதாந்திர EMI செலுத்துதல் ${formatCurrency(emiSpent)} ஆகும் (${emiPercent}% வருமானம்).`
          : `Your EMI obligations total ${formatCurrency(emiSpent)}, representing ${emiPercent}% of your monthly income.`,
        recommendation: isTa
          ? emiPercent > 20
            ? "புதிய கடன்களை எடுப்பதற்கு முன் EMI சுமையை வருமானத்தில் 20%க்குக் கீழ் வைத்திருக்க முயலுங்கள்."
            : "உங்கள் கடன் சுமை வசதியான வரம்பிற்குள் உள்ளது."
          : emiPercent > 20
          ? "Try to keep total loan EMIs under 20% of your net income before taking on additional financing."
          : "Your current debt load is well-controlled and within sustainable limits.",
      });
    }

    // Emergency Fund Goal & Gap
    const goalsSummary = computeGoalsSummary(goals);
    const emergencyGoal = goalsSummary.find((g) => /emergency/i.test(g.title));
    const targetFund = summary.totalExpenses > 0 ? summary.totalExpenses * 3 : 50000;

    if (emergencyGoal) {
      const gap = Math.max(0, emergencyGoal.target - emergencyGoal.saved);
      const allocable = summary.balance > 0 ? Math.min(gap, Math.max(500, Math.round(summary.balance * 0.25))) : 0;
      insights.push({
        icon: "🛡️",
        heading: isTa ? "அவசரகால நிதி" : "Emergency Fund",
        message: isTa
          ? `உங்கள் அவசரகால நிதி இலக்கில் ${emergencyGoal.percent}% உள்ளது (${formatCurrency(emergencyGoal.saved)} / ${formatCurrency(emergencyGoal.target)}).`
          : `Your emergency fund is at ${emergencyGoal.percent}% of target (${formatCurrency(emergencyGoal.saved)} of ${formatCurrency(emergencyGoal.target)}).`,
        recommendation: isTa
          ? emergencyGoal.percent < 70 && allocable > 0
            ? `இந்த மாத மீதமுள்ள இருப்பிலிருந்து ${formatCurrency(allocable)} தொகையை ஒதுக்கி அவசரகால நிதி இடைவெளியைக் குறைக்கலாம்.`
            : "உங்கள் அவசரகால சேமிப்பு வலுவான பாதுகாப்பை வழங்குகிறது."
          : emergencyGoal.percent < 70 && allocable > 0
          ? `Consider allocating ${formatCurrency(allocable)} from your current balance toward closing the ${formatCurrency(gap)} gap.`
          : "You maintain a solid financial buffer against unexpected expenses.",
      });
    } else {
      insights.push({
        icon: "🛡️",
        heading: isTa ? "அவசரகால நிதி பரிந்துரை" : "Emergency Fund Recommendation",
        message: isTa
          ? `குறைந்தது 3 மாத செலவுகளுக்கு சமமான அவசரகால நிதியை வைத்திருப்பது பரிந்துரைக்கப்படுகிறது (${formatCurrency(targetFund)}).`
          : `It is recommended to maintain an emergency reserve covering at least 3 months of expenses (~${formatCurrency(targetFund)}).`,
        recommendation: isTa
          ? `சேமிப்பு பகுதியில் ஒரு அவசரகால நிதி இலக்கை உருவாக்கி மாதம் ${formatCurrency(dynamicSavingsTarget)} சேமிக்கத் தொடங்குங்கள்.`
          : `Create an emergency fund goal in Savings and start contributing ~${formatCurrency(dynamicSavingsTarget)} each month.`,
      });
    }

    // Savings Rate Advice (Calculated dynamically, not hardcoded ₹2,000!)
    insights.push({
      icon: "📈",
      heading: isTa ? "சேமிப்பு விகிதம்" : "Savings Rate",
      message: isTa
        ? `இந்த மாதம் உங்கள் வருமானத்தில் ${summary.savingsRate}% சேமித்துள்ளீர்கள்.`
        : `You are currently saving ${summary.savingsRate}% of your monthly income.`,
      recommendation:
        summary.savingsRate < 20
          ? isTa
            ? `உங்கள் மாதாந்திர சேமிப்பை சுமார் ${formatCurrency(dynamicSavingsTarget)} அதிகரிப்பது உங்கள் சேமிப்பு விகிதத்தை அர்த்தமுள்ளதாக உயர்த்தும்.`
            : `Increasing your monthly savings by approximately ${formatCurrency(dynamicSavingsTarget)} would meaningfully strengthen your savings rate.`
          : isTa
          ? "20%க்கு மேல் சேமிப்பது மிகச் சிறந்த நிதிப் பழக்கம் — இதைத் தொடர்ந்து பராமரியுங்கள்."
          : "A savings rate of 20% or higher demonstrates strong financial discipline — keep this consistency.",
    });
  }

  // 5. Month-over-month trend comparison if trend data exists
  if (trend && trend.length >= 2) {
    const prevMonth = trend[trend.length - 2];
    const thisMonth = trend[trend.length - 1];
    if (prevMonth && prevMonth.expenses > 0 && thisMonth.expenses > 0) {
      const diff = thisMonth.expenses - prevMonth.expenses;
      const pct = Math.round((diff / prevMonth.expenses) * 100);
      if (pct > 15) {
        insights.push({
          icon: "⚠️",
          heading: isTa ? "செலவு அதிகரிப்பு எச்சரிக்கை" : "Spending Increase Notice",
          message: isTa
            ? `கடந்த மாதத்துடன் ஒப்பிடுகையில் உங்கள் செலவுகள் ${pct}% (${formatCurrency(diff)}) அதிகரித்துள்ளது.`
            : `Your expenses increased by ${pct}% (${formatCurrency(diff)}) compared to last month.`,
          recommendation: isTa
            ? "உங்கள் சமீபத்திய பெரிய செலவுகளை பரிசீலித்து அத்தியாவசியமற்றவற்றை கட்டுப்படுத்தவும்."
            : "Review your recent high-value transactions to ensure outflows remain aligned with your goals.",
        });
      }
    }
  }

  return insights;
}

export function generateImprovementTips({
  user,
  summary,
  breakdown = [],
  budgetStatus = [],
  goals = [],
  language = "en",
}) {
  const isTa = language === "ta";
  const isStudent = user?.userType === "student";
  const tips = [];
  const remainingDays = daysRemainingInMonth();

  // Dynamic savings step based on user income
  const dynamicSavingsStep =
    summary.totalIncome > 0
      ? Math.max(300, Math.round((summary.totalIncome * 0.05) / 100) * 100)
      : 500;

  if (summary.totalIncome === 0 && summary.totalExpenses === 0) {
    tips.push(
      isTa
        ? "💡 உங்கள் நிதித் தகவல்களை துல்லியமாகப் பெற முதல் வருமானம் அல்லது செலவைப் பதிவு செய்யவும்."
        : "💡 Log your first transaction to unlock customized spending and savings advice."
    );
    return tips;
  }

  if (isStudent) {
    const dailyLimit = Math.max(0, Math.round(summary.balance / remainingDays));
    tips.push(
      isTa
        ? `🎓 இந்த மாதத்தில் இன்னும் ${remainingDays} நாட்கள் மற்றும் ${formatCurrency(summary.balance)} இருப்பு உள்ளது. தினசரி செலவு வரம்பு: ${formatCurrency(dailyLimit)}.`
        : `🎓 You have ${remainingDays} days remaining and ${formatCurrency(summary.balance)} available. Recommended daily spending limit: ${formatCurrency(dailyLimit)}.`
    );

    if (breakdown[0]) {
      tips.push(
        isTa
          ? `📊 ${breakdown[0].category} இந்த மாதத்தில் உங்கள் அதிகபட்ச செலவு வகையாகும் (${formatCurrency(breakdown[0].amount)}).`
          : `📊 ${breakdown[0].category} is your highest expense category this month (${formatCurrency(breakdown[0].amount)}).`
      );
    }

    const entertainment = breakdown.find((b) => b.category === "Entertainment" || b.category === "Shopping");
    if (entertainment && entertainment.amount > 0) {
      const cut = Math.min(Math.round(entertainment.amount * 0.2), dynamicSavingsStep);
      tips.push(
        isTa
          ? `💰 ${entertainment.category} செலவை ${formatCurrency(cut)} குறைப்பது உங்கள் சேமிப்பு இலக்கை விரைவாக அடைய உதவும்.`
          : `💰 Reducing ${entertainment.category.toLowerCase()} spending by ${formatCurrency(cut)} could help you reach savings goals faster.`
      );
    }
  } else {
    const fixedTotal = breakdown
      .filter((b) => FIXED_CATEGORIES.includes(b.category))
      .reduce((s, b) => s + b.amount, 0);
    const fixedPercent = summary.totalIncome > 0 ? Math.round((fixedTotal / summary.totalIncome) * 100) : 0;

    if (fixedPercent >= 45) {
      tips.push(
        isTa
          ? `💼 உங்கள் நிலையான செலவுகள் வருமானத்தில் ${fixedPercent}% ஆக உள்ளது (50%க்குள் இருப்பது சிறந்தது).`
          : `💼 Your fixed expenses represent ${fixedPercent}% of monthly income (aim to keep under 50%).`
      );
    }

    if (summary.savingsRate < 20) {
      tips.push(
        isTa
          ? `🏦 உங்கள் மாதாந்திர சேமிப்பை சுமார் ${formatCurrency(dynamicSavingsStep)} அதிகரிப்பது உங்கள் சேமிப்பு விகிதத்தை உயர்த்தும்.`
          : `🏦 Increasing monthly savings by ~${formatCurrency(dynamicSavingsStep)} will raise your savings rate closer to healthy targets.`
      );
    }

    const emergencyGoal = goals.find((g) => /emergency/i.test(g.title));
    if (emergencyGoal && emergencyGoal.saved < emergencyGoal.target) {
      tips.push(
        isTa
          ? `🛡️ அவசரகால நிதி இலக்கு முழுமையடையவில்லை. மாதாந்திர இருப்பின் ஒரு பகுதியை இதற்கு ஒதுக்கவும்.`
          : `🛡️ Your emergency fund is below target. Allocate part of this month's balance to build security.`
      );
    }
  }

  // Budget warnings
  const exceeded = budgetStatus.filter((b) => b.status === "exceeded");
  exceeded.forEach((b) => {
    tips.push(
      isTa
        ? `🔴 ${b.category} பட்ஜெட் வரம்பு ${formatCurrency(Math.abs(b.remaining))} அதிகமாக மீறப்பட்டுள்ளது.`
        : `🔴 You've exceeded your ${b.category} budget by ${formatCurrency(Math.abs(b.remaining))}.`
    );
  });

  const warnings = budgetStatus.filter((b) => b.status === "warning");
  warnings.forEach((b) => {
    tips.push(
      isTa
        ? `⚠️ ${b.category} பட்ஜெட் வரம்பில் ${b.percent}% பயன்படுத்தப்பட்டுள்ளது.`
        : `⚠️ ${b.category} budget is ${b.percent}% used and approaching limit.`
    );
  });

  return tips;
}

export function generateNotifications({ budgetStatus = [], goals = [], summary, language = "en" }) {
  const isTa = language === "ta";
  const notifications = [];

  budgetStatus.forEach((b) => {
    if (b.status === "exceeded") {
      notifications.push({
        icon: "🔴",
        text: isTa
          ? `${b.category} பட்ஜெட் ${formatCurrency(Math.abs(b.remaining))} தாண்டியுள்ளது.`
          : `${b.category} budget exceeded by ${formatCurrency(Math.abs(b.remaining))}.`,
      });
    } else if (b.status === "warning") {
      notifications.push({
        icon: "⚠️",
        text: isTa
          ? `${b.category} பட்ஜெட் ${b.percent}% பயன்படுத்தப்பட்டுள்ளது.`
          : `${b.category} budget is ${b.percent}% used.`,
      });
    }
  });

  const goalsSummary = computeGoalsSummary(goals);
  goalsSummary.forEach((g) => {
    if (g.percent >= 100) {
      notifications.push({
        icon: "🎉",
        text: isTa
          ? `"${g.title}" இலக்கை நீங்கள் அடைந்துவிட்டீர்கள்!`
          : `You've reached your "${g.title}" goal!`,
      });
    } else if (g.percent >= 75) {
      notifications.push({
        icon: "🎯",
        text: isTa
          ? `"${g.title}" இலக்கில் ${g.percent}% நிறைவடைந்துள்ளது.`
          : `You're ${g.percent}% of the way to your "${g.title}" goal.`,
      });
    }
  });

  if (summary && summary.savingsRate >= 30) {
    notifications.push({
      icon: "💰",
      text: isTa
        ? `இந்த மாதம் உங்கள் சேமிப்பு விகிதம் மிகச் சிறப்பான ${summary.savingsRate}% ஆக உள்ளது.`
        : `Your savings rate is a strong ${summary.savingsRate}% this month.`,
    });
  }

  return notifications;
}

export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatDayString(dateInput) {
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) return "";
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeSavingsStreak(contributions = [], referenceDate = new Date()) {
  if (!contributions || contributions.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastContributedDate: null,
      activeToday: false,
      uniqueDaysCount: 0,
    };
  }

  // De-duplicate same-day contributions by grouping on YYYY-MM-DD
  const uniqueDays = Array.from(
    new Set(
      contributions
        .map((c) => formatDayString(c.date || c.createdAt || c))
        .filter(Boolean)
    )
  ).sort().reverse(); // Newest first

  if (uniqueDays.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastContributedDate: null,
      activeToday: false,
      uniqueDaysCount: 0,
    };
  }

  const todayStr = formatDayString(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDayString(yesterday);

  const datesSet = new Set(uniqueDays);
  const activeToday = datesSet.has(todayStr);

  let currentStreak = 0;
  if (activeToday || datesSet.has(yesterdayStr)) {
    let checkDate = new Date(activeToday ? referenceDate : yesterday);
    while (datesSet.has(formatDayString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Best streak calculation across all unique days
  const sortedAsc = [...uniqueDays].sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dayStr of sortedAsc) {
    const parts = dayStr.split("-").map(Number);
    const curr = new Date(parts[0], parts[1] - 1, parts[2]);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curr.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    prevDate = curr;
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    lastContributedDate: uniqueDays[0],
    activeToday,
    uniqueDaysCount: uniqueDays.length,
  };
}

export function computeChallengeProgress(challenge) {
  if (!challenge) return null;
  const target = Number(challenge.targetAmount) || 0;
  const contributed = Number(challenge.totalContributed) || 0;
  const remaining = Math.max(0, target - contributed);
  const percent = target > 0 ? Math.min(100, Math.round((contributed / target) * 100)) : 0;
  const now = new Date();
  const endDate = new Date(challenge.endDate);
  const diffMs = endDate.setHours(23, 59, 59, 999) - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isCompleted = contributed >= target || challenge.status === "completed";
  const isExpired = !isCompleted && (now > new Date(challenge.endDate) || challenge.status === "expired");

  return {
    ...challenge,
    target,
    contributed,
    remaining,
    percent,
    daysLeft,
    isCompleted,
    isExpired,
  };
}

