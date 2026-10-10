// FinBot Personal Financial Intelligence & Conversational Engine
// Grounded strictly in authentic user transactions, budgets, goals, and profile.
// Full English, Tamil, and Tanglish query understanding.

export function formatINR(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

// Category name translations
const CATEGORY_NAMES = {
  en: {
    Food: "Food",
    Rent: "Rent",
    Travel: "Travel",
    Education: "Education",
    Shopping: "Shopping",
    Bills: "Bills",
    Healthcare: "Healthcare",
    Entertainment: "Entertainment",
    Recharge: "Recharge",
    EMI: "EMI",
    Subscription: "Subscription",
    Salary: "Salary",
    Freelance: "Freelance",
    Business: "Business",
    Interest: "Interest",
    Gift: "Gift",
    Allowance: "Allowance",
    Other: "Other",
  },
  ta: {
    Food: "உணவு (Food)",
    Rent: "வாடகை (Rent)",
    Travel: "பயணம் (Travel)",
    Education: "கல்வி (Education)",
    Shopping: "ஷாப்பிங் (Shopping)",
    Bills: "பில்கள் (Bills)",
    Healthcare: "மருத்துவம் (Healthcare)",
    Entertainment: "பொழுதுபோக்கு (Entertainment)",
    Recharge: "ரீசார்ஜ் (Recharge)",
    EMI: "இ.எம்.ஐ (EMI)",
    Subscription: "சந்தா (Subscription)",
    Salary: "சம்பளம் (Salary)",
    Freelance: "சுயதொழில் (Freelance)",
    Business: "வணிகம் (Business)",
    Interest: "வட்டி (Interest)",
    Gift: "பரிசு (Gift)",
    Allowance: "பாக்கெட் மணி (Allowance)",
    Other: "மற்றவை (Other)",
  },
};

export function getCategoryLabel(category, language = "en") {
  const dict = CATEGORY_NAMES[language] || CATEGORY_NAMES.en;
  return dict[category] || category;
}

// Helper to inspect if text matches any pattern in a list
function matchesAny(text, patterns) {
  const lower = text.toLowerCase();
  return patterns.some((p) => {
    if (p instanceof RegExp) return p.test(lower);
    return lower.includes(p.toLowerCase());
  });
}

// Core Analytics Engine
export function analyzeFinances({
  transactions = [],
  budgets = [],
  goals = [],
  user = {},
}) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current month transactions
  const currentMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Previous month transactions
  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === prevDate.getMonth() &&
      d.getFullYear() === prevDate.getFullYear()
    );
  });

  // Income & Expenses
  const currentIncome = currentMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const currentExpenses = currentMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const prevExpenses = prevMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const prevIncome = prevMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const balance = currentIncome - currentExpenses;
  const savingsRate =
    currentIncome > 0
      ? Math.max(0, Math.round((balance / currentIncome) * 100))
      : 0;

  // Category breakdown for current month
  const catMap = {};
  currentMonthTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount || 0);
    });

  const breakdown = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percent:
        currentExpenses > 0
          ? Math.round((amount / currentExpenses) * 100)
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = breakdown[0] || null;

  // Days calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - now.getDate());
  const dailySpendingLimit = Math.max(
    0,
    Math.floor(balance / remainingDays)
  );

  // Month-over-month trend comparison
  const hasPrevData = prevExpenses > 0;
  const expenseDiff = currentExpenses - prevExpenses;
  const expensePctChange = hasPrevData
    ? Math.round((expenseDiff / prevExpenses) * 100)
    : 0;

  // Budget status
  const budgetStatus = budgets.map((b) => {
    const spent = catMap[b.category] || 0;
    const limit = Number(b.limit || 0);
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return {
      category: b.category,
      limit,
      spent,
      remaining: limit - spent,
      percent,
      exceeded: spent > limit,
      warning: percent >= 80 && percent < 100,
    };
  });

  const exceededBudgets = budgetStatus.filter((b) => b.exceeded);
  const warningBudgets = budgetStatus.filter((b) => b.warning);

  // Savings goals
  const goalsSummary = goals.map((g) => {
    const target = Number(g.target || 0);
    const saved = Number(g.saved || 0);
    const percent =
      target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    return {
      title: g.title,
      target,
      saved,
      percent,
      gap: Math.max(0, target - saved),
      completed: saved >= target && target > 0,
    };
  });

  // Emergency Fund Goal
  const emergencyGoal = goalsSummary.find((g) =>
    /emergency|அவசரகால/i.test(g.title)
  );
  const recommendedEmergency =
    currentExpenses > 0 ? currentExpenses * 3 : 50000;

  return {
    transactions,
    currentMonthTx,
    prevMonthTx,
    currentIncome,
    currentExpenses,
    prevIncome,
    prevExpenses,
    balance,
    savingsRate,
    breakdown,
    topCategory,
    remainingDays,
    dailySpendingLimit,
    hasPrevData,
    expenseDiff,
    expensePctChange,
    budgets,
    budgetStatus,
    exceededBudgets,
    warningBudgets,
    goals,
    goalsSummary,
    emergencyGoal,
    recommendedEmergency,
    user,
    isStudent: user?.userType === "student",
  };
}

// Generate FinBot response based on actual data
export function generateFinBotResponse({
  message = "",
  transactions = [],
  budgets = [],
  goals = [],
  user = {},
  language = "en",
  streak = null,
  activeChallenge = null,
  achievements = [],
}) {
  const isTa = language === "ta";
  const rawQuery = (message || "").trim();
  const q = rawQuery.toLowerCase();

  const data = analyzeFinances({ transactions, budgets, goals, user });

  // Read cached streak & challenge if available in client storage
  let effectiveStreak = streak;
  if (!effectiveStreak) {
    try {
      const cached = localStorage.getItem("fintrack_streak_cache");
      if (cached) effectiveStreak = JSON.parse(cached);
    } catch (e) {}
  }
  let effectiveChallenge = activeChallenge;
  if (!effectiveChallenge) {
    try {
      const cached = localStorage.getItem("fintrack_active_challenge");
      if (cached) effectiveChallenge = JSON.parse(cached);
    } catch (e) {}
  }

  // --- SAVINGS STREAK & CHALLENGE MODE INTENTS (Always accessible) ---
  // Streak query
  if (
    matchesAny(q, [
      "streak",
      "savings streak",
      "current streak",
      "what is my streak",
      "streak status",
      "how many days streak",
      "ஸ்ட்ரீக்",
      "சேமிப்பு ஸ்ட்ரீக்",
      "தொடர் சேமிப்பு",
      "streak evlo",
      "en streak enna",
      "streak pathi sollunga",
      "savings streak status",
    ])
  ) {
    const cStreak = effectiveStreak?.currentStreak || 0;
    const bStreak = effectiveStreak?.bestStreak || 0;
    const isActToday = !!effectiveStreak?.activeToday;

    if (isTa) {
      if (cStreak > 0) {
        return (
          `🔥 **உங்கள் சேமிப்பு ஸ்ட்ரீக்:** **${cStreak} நாட்கள்!** (சிறந்த ஸ்ட்ரீக்: **${bStreak} நாட்கள்**)\n\n` +
          (isActToday
            ? `✅ இன்று நீங்கள் சேமிப்பு பங்களிப்பைச் செய்துள்ளீர்கள்! ஸ்ட்ரீக் ஜோதி தொடர்ந்து எரிகிறது!`
            : `⚡ இன்று நீங்கள் இன்னும் சேமிப்பு பங்களிப்பு செய்யவில்லை. ஸ்ட்ரீக்கைத் தக்கவைக்க இன்றே பங்களிக்கவும்!`) +
          `\n\n💡 சேமிப்பு சவால்களில் அல்லது சேமிப்பு இலக்குகளில் ஒவ்வொரு நாளும் பணத்தை ஒதுக்குவதன் மூலம் உங்கள் ஸ்ட்ரீக்கை வளர்க்கலாம்.`
        );
      }
      return (
        `🔥 **உங்கள் சேமிப்பு ஸ்ட்ரீக்:** தற்போது உங்களிடம் தொடர் ஸ்ட்ரீக் எதுவும் இல்லை${bStreak > 0 ? ` (உங்கள் முந்தைய சிறந்த ஸ்ட்ரீக்: **${bStreak} நாட்கள்**)` : ""}.\n\n` +
        `சேமிப்பு பழக்கத்தை உருவாக்க இன்றே ஒரு சேமிப்பு பங்களிப்பைப் பதிவுசெய்து உங்கள் ஸ்ட்ரீக்கைத் தொடங்குங்கள்!`
      );
    }

    if (cStreak > 0) {
      return (
        `🔥 **Your Savings Streak:** **${cStreak} day(s)!** (Best streak: **${bStreak} day(s)**)\n\n` +
        (isActToday
          ? `✅ You've already made a qualifying contribution today! Flame is burning bright!`
          : `⚡ You haven't made a savings contribution today yet. Save today to keep your streak going!`) +
        `\n\n💡 Keep contributing daily to your weekly challenge or savings goals to build long-term financial discipline.`
      );
    }
    return (
      `🔥 **Your Savings Streak:** You currently don't have an active streak${bStreak > 0 ? ` (Your best historical streak: **${bStreak} day(s)**)` : ""}.\n\n` +
      `Start your streak today by recording a qualifying savings contribution on the **Savings & Goals** page!`
    );
  }

  // Weekly challenge query
  if (
    matchesAny(q, [
      "challenge",
      "weekly challenge",
      "savings challenge",
      "challenge progress",
      "how is my challenge",
      "challenge status",
      "சவால்",
      "வாராந்திர சவால்",
      "சவால் முன்னேற்றம்",
      "challenge evlo",
      "challenge mudinjidha",
      "challenge target",
      "weekly savings challenge",
    ])
  ) {
    if (effectiveChallenge) {
      const target = Number(effectiveChallenge.targetAmount || 0);
      const contributed = Number(effectiveChallenge.totalContributed || 0);
      const remaining = Math.max(0, target - contributed);
      const percent = target > 0 ? Math.min(100, Math.round((contributed / target) * 100)) : 0;
      const endD = new Date(effectiveChallenge.endDate);
      const nowMs = new Date().getTime();
      const daysLeft = Math.max(0, Math.ceil((endD.getTime() - nowMs) / (1000 * 60 * 60 * 24)));

      if (isTa) {
        return (
          `🎯 **வாராந்திர சேமிப்பு சவால்: '${effectiveChallenge.title}'**\n\n` +
          `• **இலக்கு தொகை**: **${formatINR(target)}**\n` +
          `• **இதுவரை சேமித்தது**: **${formatINR(contributed)}** (${percent}% முடிந்தது)\n` +
          `• **மீதமுள்ள தொகை**: **${formatINR(remaining)}**\n` +
          `• **காலக்கெடு**: ${endD.toLocaleDateString("ta-IN")} (${daysLeft} நாட்கள் மீதமுள்ளன)\n\n` +
          (percent >= 100
            ? `🎉 வாழ்த்துகள்! இந்த சவாலின் 100% இலக்கை நீங்கள் அடைந்துவிட்டீர்கள்!`
            : `💪 இந்த வார இலக்கை அடைய தினமும் சிறிது சேமியுங்கள்!`)
        );
      }

      return (
        `🎯 **Weekly Savings Challenge: '${effectiveChallenge.title}'**\n\n` +
        `• **Target Amount**: **${formatINR(target)}**\n` +
        `• **Total Saved**: **${formatINR(contributed)}** (${percent}% complete)\n` +
        `• **Remaining Amount**: **${formatINR(remaining)}**\n` +
        `• **Deadline**: ${endD.toLocaleDateString("en-IN")} (${daysLeft} day(s) left)\n\n` +
        (percent >= 100
          ? `🎉 Congratulations! You have achieved 100% of this challenge target!`
          : `💪 Keep contributing daily to hit your target before the deadline!`)
      );
    }

    if (isTa) {
      return (
        `🎯 **வாராந்திர சேமிப்பு சவால்:** தற்போது உங்களிடம் செயலில் சவால் எதுவும் இல்லை.\n\n` +
        `**சேமிப்பு & இலக்குகள்** பக்கத்தில் **+ புதிய சவால்** என்பதைத் தேர்வுசெய்து 7-நாள் சேமிப்பு சவாலைத் தொடங்குங்கள்!`
      );
    }
    return (
      `🎯 **Weekly Savings Challenge:** You do not have an active weekly challenge right now.\n\n` +
      `Head over to **Savings & Goals** and click **+ New Challenge** to set a 7-day savings goal and accelerate your progress!`
    );
  }

  // Achievements & Badges query
  if (
    matchesAny(q, [
      "achievement",
      "achievements",
      "badge",
      "badges",
      "what badges do i have",
      "my achievements",
      "சாதனைகள்",
      "பேட்ஜ்கள்",
      "விருதுகள்",
      "badges enna",
      "achievements evlo",
      "achievements status",
      "badge status",
    ])
  ) {
    const unlockedMap = new Set(achievements.map((a) => a.key));
    const allBadges = [
      { key: "first_saver", nameEn: "First Saver", nameTa: "முதல் சேமிப்பாளர்", descEn: "Recorded first confirmed savings contribution", descTa: "முதல் சேமிப்பு பங்களிப்பைப் பதிவு செய்தல்" },
      { key: "three_day_streak", nameEn: "3-Day Streak", nameTa: "3-நாள் ஸ்ட்ரீக்", descEn: "Saved 3 consecutive calendar days", descTa: "தொடர்ந்து 3 நாட்கள் சேமித்தல்" },
      { key: "seven_day_streak", nameEn: "7-Day Streak", nameTa: "7-நாள் ஸ்ட்ரீக்", descEn: "Saved 7 consecutive calendar days", descTa: "தொடர்ந்து 7 நாட்கள் சேமித்தல்" },
      { key: "goal_achiever", nameEn: "Goal Achiever", nameTa: "இலக்கை அடைந்தவர்", descEn: "Achieved 100% of a savings challenge", descTa: "சவாலின் 100% இலக்கை எட்டியவர்" },
      { key: "challenge_champion", nameEn: "Challenge Champion", nameTa: "சவால் சாம்பியன்", descEn: "Completed a full weekly challenge", descTa: "முழு வாராந்திர சவாலை முடித்தவர்" },
    ];

    if (isTa) {
      const items = allBadges
        .map((b) => `${unlockedMap.has(b.key) ? "🏆" : "🔒"} **${b.nameTa}**: ${b.descTa} (${unlockedMap.has(b.key) ? "திறக்கப்பட்டது" : "பூட்டப்பட்டது"})`)
        .join("\n");
      return (
        `🎖️ **உங்கள் சேமிப்பு சாதனைகள் மற்றும் பேட்ஜ்கள்:**\n\n${items}\n\n` +
        `💡 தொடர்ந்து சேமித்து புதிய பேட்ஜ்களைத் திறக்கவும்!`
      );
    }

    const items = allBadges
      .map((b) => `${unlockedMap.has(b.key) ? "🏆" : "🔒"} **${b.nameEn}**: ${b.descEn} (${unlockedMap.has(b.key) ? "Unlocked" : "Locked"})`)
      .join("\n");
    return (
      `🎖️ **Your Savings Badges & Achievements:**\n\n${items}\n\n` +
      `💡 Maintain your daily streak and complete weekly challenges to unlock all badges!`
    );
  }

  // 0. Handle Zero Transactions
  if (!transactions || transactions.length === 0) {
    if (isTa) {
      return (
        "👋 **வணக்கம்!** உங்கள் கணக்கில் இதுவரை எந்த பரிவர்த்தனைகளும் பதிவு செய்யப்படவில்லை.\n\n" +
        "துல்லியமான நிதி ஆலோசனைகள் மற்றும் பகுப்பாய்வைப் பெற, உங்கள் முதல் வருமானம் அல்லது செலவை **'பரிவர்த்தனைகள்' (Transactions)** பக்கத்தில் சேர்க்கவும்.\n\n" +
        (data.isStudent
          ? "🎓 மாணவராக, உங்கள் பாக்கெட் மணி மற்றும் கல்லூரி செலவுகளைப் பதிவு செய்தால் தினசரி செலவு வரம்பு கணக்கிடப்படும்."
          : "💼 பணிபுரியும் நபராக, உங்கள் சம்பளம் மற்றும் செலவுகளைப் பதிவு செய்தால் பட்ஜெட் மற்றும் அவசரகால நிதி இலக்குகள் கணக்கிடப்படும்.")
      );
    }
    return (
      "👋 **Hello!** You don't have any recorded transactions in your account yet.\n\n" +
      "To provide accurate financial analytics, please record your first income or expense on the **Transactions** page.\n\n" +
      (data.isStudent
        ? "🎓 As a student, logging your pocket allowance and college expenses will automatically calculate your daily spending limit."
        : "💼 As a working professional, logging your salary and monthly bills will calculate your expense breakdown and emergency fund recommendations.")
    );
  }

  // 1. Total Income
  // Matches: "income", "how much did i earn", "வருமானம்", "evlo earn", "en income", "sambadhichen"
  if (
    matchesAny(q, [
      "how much did i earn",
      "total income",
      "my income",
      "what is my income",
      "income this month",
      "வருமானம் எவ்வளவு",
      "மொத்த வருமானம்",
      "நான் எவ்வளவு சம்பாதித்தேன்",
      "வருமானம்",
      "en income evlo",
      "income evlo",
      "total income evlo",
      "evlo sambadhichen",
      "evlo earn pannen",
      "income enna",
    ]) &&
    !matchesAny(q, ["expense", "spend", "செலவு"])
  ) {
    if (isTa) {
      return (
        `💰 **இந்த மாத வருமான விவரம்:**\n\n` +
        `• **மொத்த வருமானம்**: **${formatINR(data.currentIncome)}**\n` +
        (data.currentIncome > 0
          ? `• **நடப்பு செலவுகள்**: ${formatINR(data.currentExpenses)}\n` +
            `• **கிடைக்கும் இருப்பு**: ${formatINR(data.balance)} (சேமிப்பு விகிதம்: ${data.savingsRate}%)\n\n` +
            (data.balance > 0
              ? `💡 இந்த இருப்பிலிருந்து சேமிப்பு இலக்குகளுக்கு அல்லது அவசரகால நிதிக்கு பணத்தை ஒதுக்கலாம்.`
              : `⚠️ உங்கள் செலவுகள் வருமானத்தை விட அதிகமாக உள்ளன. செலவைக் கட்டுப்படுத்த ஆலோசனைகள் தேவைப்பட்டால் கேளுங்கள்.`)
          : `⚠️ இந்த மாதத்தில் வருமானப் பரிவர்த்தனைகள் எதுவும் பதிவு செய்யப்படவில்லை. 'பரிவர்த்தனைகள்' பக்கத்தில் புதிய வருமானத்தை சேர்க்கவும்.`)
      );
    }
    return (
      `💰 **Income Summary for This Month:**\n\n` +
      `• **Total Income**: **${formatINR(data.currentIncome)}**\n` +
      (data.currentIncome > 0
        ? `• **Current Expenses**: ${formatINR(data.currentExpenses)}\n` +
          `• **Available Balance**: ${formatINR(data.balance)} (Savings Rate: ${data.savingsRate}%)\n\n` +
          (data.balance > 0
            ? `💡 With a positive balance, consider allocating some funds toward your active savings goals.`
            : `⚠️ Your expenses currently exceed your recorded income for this month. Ask for tips to cut expenses if needed.`)
        : `⚠️ No income transactions recorded for the current month yet. You can log one on the Transactions page.`)
    );
  }

  // 2. Total Expenses
  // Matches: "how much did i spend", "total expenses", "செலவு செய்திருக்கிறேன்", "evlo spend pannirukken", "selavu aachu"
  if (
    matchesAny(q, [
      "how much did i spend",
      "how much have i spent",
      "total expenses",
      "total expense",
      "my expenses",
      "what are my expenses",
      "spend this month",
      "செலவு செய்திருக்கிறேன்",
      "மொத்த செலவுகள்",
      "செலவு எவ்வளவு",
      "செலவுகள் என்ன",
      "evlo spend pannirukken",
      "evlo spend pannen",
      "total expense evlo",
      "selavu evlo",
      "selavu aachu",
      "evlo selavu",
      "spend evlo",
    ]) &&
    !matchesAny(q, ["highest", "அதிகமாக", "adhigama", "category", "வகை"])
  ) {
    if (isTa) {
      return (
        `💸 **இந்த மாத செலவு விவரம்:**\n\n` +
        `• **மொத்த செலவுகள்**: **${formatINR(data.currentExpenses)}**\n` +
        `• **பதிவு செய்யப்பட்ட செலவு பரிவர்த்தனைகள்**: ${
          data.currentMonthTx.filter((t) => t.type === "expense").length
        }\n` +
        `• **வருமானம்**: ${formatINR(data.currentIncome)}\n` +
        `• **மீதமுள்ள இருப்பு**: ${formatINR(data.balance)}\n\n` +
        (data.topCategory
          ? `📌 அதிகபட்சமாக **${getCategoryLabel(
              data.topCategory.category,
              "ta"
            )}** வகையில் ${formatINR(data.topCategory.amount)} (${
              data.topCategory.percent
            }%) செலவிடப்பட்டுள்ளது.\n\n`
          : "") +
        `வகை வாரியான விவரங்களை அறிய "எந்த வகையில் அதிக செலவு?" என்று கேட்கலாம்.`
      );
    }
    return (
      `💸 **Expense Summary for This Month:**\n\n` +
      `• **Total Expenses**: **${formatINR(data.currentExpenses)}**\n` +
      `• **Recorded Expense Transactions**: ${
        data.currentMonthTx.filter((t) => t.type === "expense").length
      }\n` +
      `• **Income**: ${formatINR(data.currentIncome)}\n` +
      `• **Remaining Balance**: ${formatINR(data.balance)}\n\n` +
      (data.topCategory
        ? `📌 Your largest expense category is **${getCategoryLabel(
            data.topCategory.category,
            "en"
          )}** at ${formatINR(data.topCategory.amount)} (${
            data.topCategory.percent
          }% of total expenses).\n\n`
        : "") +
      `You can also ask: "Which category has the highest spending?" or "Am I exceeding my budget?".`
    );
  }

  // 3. Available Balance
  // Matches: "available balance", "balance", "money left", "இருப்பு", "en balance evlo", "balance evlo"
  if (
    matchesAny(q, [
      "available balance",
      "current balance",
      "what is my balance",
      "how much balance",
      "money do i have left",
      "how much is left",
      "கிடைக்கும் இருப்பு",
      "மீதமுள்ள பணம்",
      "இருப்பு தொகை",
      "இருப்பு எவ்வளவு",
      "available balance evlo",
      "en balance evlo",
      "balance evlo irukku",
      "balance evlo",
      "balance enna",
      "meedhi evlo irukku",
    ])
  ) {
    if (isTa) {
      return (
        `💳 **உங்கள் தற்போதைய நிதி இருப்பு:**\n\n` +
        `• **கிடைக்கும் இருப்பு**: **${formatINR(data.balance)}**\n` +
        `• **இந்த மாத வருமானம்**: ${formatINR(data.currentIncome)}\n` +
        `• **இந்த மாத செலவுகள்**: ${formatINR(data.currentExpenses)}\n` +
        `• **சேமிப்பு விகிதம்**: ${data.savingsRate}%\n` +
        `• **பரிந்துரைக்கப்பட்ட தினசரி வரம்பு**: ${formatINR(
          data.dailySpendingLimit
        )} (மீதமுள்ள ${data.remainingDays} நாட்களுக்கு)\n\n` +
        (data.balance > 0
          ? `✅ உங்களிடம் நேர்மறை இருப்பு உள்ளது! இதில் ஒரு பகுதியை சேமிப்பு இலக்குகளுக்கு ஒதுக்கலாம்.`
          : `⚠️ உங்கள் இருப்பு பற்றாக்குறையில் உள்ளது (செலவு வருமானத்தை விட அதிகம்). அத்தியாவசியமற்ற செலவுகளைக் குறைப்பது நல்லது.`)
      );
    }
    return (
      `💳 **Your Available Balance:**\n\n` +
      `• **Available Balance**: **${formatINR(data.balance)}**\n` +
      `• **This Month's Income**: ${formatINR(data.currentIncome)}\n` +
      `• **This Month's Expenses**: ${formatINR(data.currentExpenses)}\n` +
      `• **Savings Rate**: ${data.savingsRate}%\n` +
      `• **Safe Daily Spending Limit**: ${formatINR(
        data.dailySpendingLimit
      )}/day (for the next ${data.remainingDays} days)\n\n` +
      (data.balance > 0
        ? `✅ You have a healthy positive cash flow this month. Consider depositing part of it into your savings goals.`
        : `⚠️ You are currently running a deficit (spending is higher than recorded income). Review discretionary purchases.`)
    );
  }

  // 4. Highest-Spending Category
  // Matches: "highest spending", "top expense", "அதிகமாக செலவு", "highest spending category", "adhigama spend"
  if (
    matchesAny(q, [
      "highest spending",
      "top spending",
      "top expense",
      "highest category",
      "where am i spending the most",
      "most expensive",
      "அதிகமாக செலவு",
      "அதிகபட்ச செலவு",
      "எந்த வகையில் அதிகம்",
      "highest spending category",
      "top expense category",
      "adhigama spend",
      "adhigama selavu",
      "highest spend",
      "top category enna",
    ])
  ) {
    if (!data.topCategory || data.currentExpenses === 0) {
      return isTa
        ? "இந்த மாதத்தில் செலவுகள் எதுவும் பதிவு செய்யப்படவில்லை."
        : "No expenses recorded for this month yet.";
    }

    const catName = getCategoryLabel(
      data.topCategory.category,
      isTa ? "ta" : "en"
    );
    const budgetForTop = data.budgets.find(
      (b) => b.category === data.topCategory.category
    );

    if (isTa) {
      return (
        `🏆 **அதிகபட்ச செலவு வகை:**\n\n` +
        `• **வகை**: **${catName}**\n` +
        `• **செலவான தொகை**: **${formatINR(data.topCategory.amount)}**\n` +
        `• **மொத்த செலவில் பங்கு**: **${data.topCategory.percent}%**\n` +
        (budgetForTop
          ? `• **பட்ஜெட் வரம்பு**: ${formatINR(budgetForTop.limit)} (${
              data.topCategory.amount > budgetForTop.limit
                ? `🔴 வரம்பு மீறியுள்ளது!`
                : `✅ வரம்பிற்குள் உள்ளது`
            })\n\n`
          : `\n\n`) +
        (data.breakdown.length > 1
          ? `அடுத்த முக்கிய செலவு: **${getCategoryLabel(
              data.breakdown[1].category,
              "ta"
            )}** (${formatINR(data.breakdown[1].amount)}, ${
              data.breakdown[1].percent
            }%).`
          : "")
      );
    }
    return (
      `🏆 **Highest-Spending Category:**\n\n` +
      `• **Category**: **${catName}**\n` +
      `• **Amount Spent**: **${formatINR(data.topCategory.amount)}**\n` +
      `• **Share of Total Expenses**: **${data.topCategory.percent}%**\n` +
      (budgetForTop
        ? `• **Assigned Budget Limit**: ${formatINR(budgetForTop.limit)} (${
            data.topCategory.amount > budgetForTop.limit
              ? `🔴 Exceeded!`
              : `✅ Within Limit`
          })\n\n`
        : `\n\n`) +
      (data.breakdown.length > 1
        ? `Runner up: **${getCategoryLabel(
            data.breakdown[1].category,
            "en"
          )}** with ${formatINR(data.breakdown[1].amount)} (${
            data.breakdown[1].percent
          }%).`
        : "")
    );
  }

  // 5. Specific Category Lookup (e.g., "How much did I spend on Food?", "சாப்பாட்டுக்கு எவ்வளவு?", "travel ku evlo")
  const knownCategories = [
    { key: "Food", terms: ["food", "உணவு", "சாப்பாடு", "restaurant", "hotel", "canteen", "mess", "dining"] },
    { key: "Rent", terms: ["rent", "வாடகை", "house rent", "room rent"] },
    { key: "Travel", terms: ["travel", "பயணம்", "transport", "bus", "train", "fuel", "petrol", "cab", "uber", "auto"] },
    { key: "Shopping", terms: ["shopping", "ஷாப்பிங்", "dress", "clothes", "amazon", "flipkart"] },
    { key: "Education", terms: ["education", "கல்வி", "books", "course", "fees", "college", "tuition"] },
    { key: "Bills", terms: ["bill", "பில்", "eb", "electricity", "water", "wifi"] },
    { key: "Healthcare", terms: ["health", "மருத்துவம்", "doctor", "hospital", "medicine", "pharmacy"] },
    { key: "Entertainment", terms: ["entertainment", "பொழுதுபோக்கு", "movie", "cinema", "game"] },
    { key: "Recharge", terms: ["recharge", "ரீசார்ஜ்", "mobile recharge", "dth"] },
    { key: "EMI", terms: ["emi", "இ.எம்.ஐ", "loan"] },
    { key: "Subscription", terms: ["subscription", "சந்தா", "netflix", "prime", "spotify"] },
  ];

  const matchedCat = knownCategories.find((kc) =>
    kc.terms.some((term) => q.includes(term))
  );

  if (
    matchedCat &&
    (matchesAny(q, ["how much", "spend", "spent", "எவ்வளவு", "செலவு", "evlo", "selavu", "kaatu", "status"]) ||
      q.includes("on " + matchedCat.key.toLowerCase()))
  ) {
    const catSpent =
      data.breakdown.find((b) => b.category === matchedCat.key)?.amount || 0;
    const catPct =
      data.currentExpenses > 0
        ? Math.round((catSpent / data.currentExpenses) * 100)
        : 0;
    const budget = data.budgets.find((b) => b.category === matchedCat.key);
    const catLabel = getCategoryLabel(matchedCat.key, isTa ? "ta" : "en");

    if (isTa) {
      return (
        `📊 **${catLabel} செலவு விவரம்:**\n\n` +
        `• **இந்த மாதம் செலவானது**: **${formatINR(catSpent)}**\n` +
        `• **மொத்த செலவில் பங்கு**: ${catPct}%\n` +
        (budget
          ? `• **பட்ஜெட் வரம்பு**: ${formatINR(budget.limit)}\n` +
            `• **மீதமுள்ள பட்ஜெட்**: ${formatINR(budget.limit - catSpent)} (${
              catSpent > budget.limit ? "🔴 வரம்பை மீறிவிட்டது!" : "✅ பாதுகாப்பானது"
            })\n`
          : `• இந்த வகைக்கு இன்னும் பட்ஜெட் அமைக்கப்படவில்லை.\n`) +
        `\nமொத்த செலவு: ${formatINR(data.currentExpenses)}.`
      );
    }
    return (
      `📊 **${catLabel} Spending Details:**\n\n` +
      `• **Spent This Month**: **${formatINR(catSpent)}**\n` +
      `• **Share of Total Expenses**: ${catPct}%\n` +
      (budget
        ? `• **Category Budget Limit**: ${formatINR(budget.limit)}\n` +
          `• **Remaining Budget**: ${formatINR(budget.limit - catSpent)} (${
            catSpent > budget.limit ? "🔴 Exceeded Limit!" : "✅ Within Budget"
          })\n`
        : `• No specific budget limit configured for this category.\n`) +
      `\nTotal Monthly Expenses: ${formatINR(data.currentExpenses)}.`
    );
  }

  // 6. Category Breakdown (General)
  // Matches: "spending by category", "category breakdown", "வகை வாரியான", "category wise"
  if (
    matchesAny(q, [
      "spending by category",
      "expense breakdown",
      "category breakdown",
      "categories",
      "where did i spend",
      "where does my money go",
      "வகை வாரியான செலவு",
      "எந்தெந்த வகையில்",
      "செலவு விவரங்கள்",
      "category wise spend",
      "category wise",
      "category breakdown kaatu",
      "enga selavu pannen",
      "category selavu",
    ])
  ) {
    if (data.breakdown.length === 0) {
      return isTa
        ? "இந்த மாதத்தில் செலவுகள் எதுவும் பதிவு செய்யப்படவில்லை."
        : "No expenses recorded this month yet.";
    }

    if (isTa) {
      let reply = `📊 **இந்த மாத வகை வாரியான செலவுகள் (மொத்தம்: ${formatINR(
        data.currentExpenses
      )}):**\n\n`;
      data.breakdown.slice(0, 6).forEach((b) => {
        reply += `• **${getCategoryLabel(b.category, "ta")}**: ${formatINR(
          b.amount
        )} (${b.percent}%)\n`;
      });
      if (data.topCategory) {
        reply += `\n📌 அதிகபட்ச செலவு வகை: **${getCategoryLabel(
          data.topCategory.category,
          "ta"
        )}** (${data.topCategory.percent}%).`;
      }
      return reply;
    }

    let reply = `📊 **This Month's Spending by Category (Total: ${formatINR(
      data.currentExpenses
    )}):**\n\n`;
    data.breakdown.slice(0, 6).forEach((b) => {
      reply += `• **${getCategoryLabel(b.category, "en")}**: ${formatINR(
        b.amount
      )} (${b.percent}%)\n`;
    });
    if (data.topCategory) {
      reply += `\n📌 Largest expense category: **${getCategoryLabel(
        data.topCategory.category,
        "en"
      )}** (${data.topCategory.percent}%).`;
    }
    return reply;
  }

  // 7. Spending Changes Between Months (MoM Trend / Comparison)
  // Matches: "spending change", "vs last month", "compared to last month", "கடந்த மாதம்", "last month compare", "pona maasam"
  if (
    matchesAny(q, [
      "spending change",
      "vs last month",
      "compared to last month",
      "change in spending",
      "spending increased",
      "spending decreased",
      "more than last month",
      "கடந்த மாதத்துடன் ஒப்பிடும்போது",
      "செலவு மாற்றம்",
      "செலவு அதிகரித்துள்ளதா",
      "செலவு குறைந்துள்ளதா",
      "last month compare",
      "pona maasatha vida",
      "last month spend evlo",
      "spending change vs last month",
      "compare last month",
    ])
  ) {
    if (!data.hasPrevData) {
      return isTa
        ? `📅 **மாதாந்திர செலவு ஒப்பீடு:**\n\n` +
            `கடந்த மாதத்திற்கான பரிவர்த்தனை தரவு எதுவும் கிடைக்கவில்லை (நடப்பு மாத செலவு: ${formatINR(
              data.currentExpenses
            )}).\n` +
            `அடுத்த மாதத்தில் போதுமான வரலாறு சேரும்போது துல்லியமான மாதாந்திர ஒப்பீடு மற்றும் மாற்ற விகிதங்கள் தானாகவே காட்டப்படும்.`
        : `📅 **Month-over-Month Spending Comparison:**\n\n` +
            `There is no transaction history recorded for the previous month (Current Month: ${formatINR(
              data.currentExpenses
            )}).\n` +
            `Once you have transactions across multiple months, FinBot will automatically compute spending trends and percentage changes.`;
    }

    const sign = data.expenseDiff >= 0 ? "+" : "";
    const trendWordTa =
      data.expenseDiff > 0
        ? "அதிகரித்துள்ளது (Increased)"
        : data.expenseDiff < 0
        ? "குறைந்துள்ளது (Decreased)"
        : "மாற்றமின்றி உள்ளது (Unchanged)";
    const trendWordEn =
      data.expenseDiff > 0
        ? "increased"
        : data.expenseDiff < 0
        ? "decreased"
        : "remained unchanged";

    if (isTa) {
      return (
        `📈 **கடந்த மாதத்துடன் செலவு ஒப்பீடு:**\n\n` +
        `• **கடந்த மாத செலவு**: ${formatINR(data.prevExpenses)}\n` +
        `• **இந்த மாத செலவு**: ${formatINR(data.currentExpenses)}\n` +
        `• **செலவு மாற்றம்**: **${sign}${data.expensePctChange}%** (${sign}${formatINR(
          data.expenseDiff
        )})\n` +
        `• **நிலை**: உங்கள் செலவுகள் கடந்த மாதத்தை விட **${trendWordTa}**.\n\n` +
        (data.expenseDiff > 0
          ? `💡 செலவுகள் அதிகரித்துள்ளதால், அத்தியாவசியமற்ற வகைகளை ஆராய்ந்து பட்ஜெட்டை ஒழுங்குபடுத்துங்கள்.`
          : `🎉 நன்று! உங்கள் செலவுகள் கட்டுப்பாட்டுக்குள் உள்ளன.`)
      );
    }
    return (
      `📈 **Spending Comparison vs Last Month:**\n\n` +
      `• **Last Month's Expenses**: ${formatINR(data.prevExpenses)}\n` +
      `• **This Month's Expenses**: ${formatINR(data.currentExpenses)}\n` +
      `• **Net Change**: **${sign}${data.expensePctChange}%** (${sign}${formatINR(
        data.expenseDiff
      )})\n` +
      `• **Trend**: Your spending has **${trendWordEn}** compared to last month.\n\n` +
      (data.expenseDiff > 0
        ? `💡 Since expenses increased, consider auditing high-spending categories like dining or shopping.`
        : `🎉 Great job! You are keeping expenses well disciplined compared to the previous month.`)
    );
  }

  // 8. Budget Exceeded / Approaching Query
  // Matches: "am i exceeding my budget", "over budget", "மீறிவிட்டேனா", "en budget exceed aagiducha", "budget over aacha"
  if (
    matchesAny(q, [
      "exceeding my budget",
      "over budget",
      "budget exceeded",
      "exceeded budget",
      "approaching budget",
      "budget warning",
      "மீறிவிட்டேனா",
      "வரம்பு மீறியுள்ளதா",
      "பட்ஜெட் எச்சரிக்கை",
      "budget exceed aagiducha",
      "budget over aacha",
      "budget exceed",
      "warning category",
      "budget exceed aana",
    ])
  ) {
    if (data.budgets.length === 0) {
      return isTa
        ? "நீங்கள் இதுவரை எந்த வகை பட்ஜெட்டுகளையும் அமைக்கவில்லை. 'பட்ஜெட்' பக்கத்திற்குச் சென்று உணவு, ஷாப்பிங் போன்ற முக்கிய வகைகளுக்கு வரம்புகளை அமைக்கவும்."
        : "You haven't set any category budgets yet. Head over to the Budget page to configure monthly spending limits for key categories.";
    }

    if (isTa) {
      if (data.exceededBudgets.length > 0) {
        let reply = `🔴 **ஆம், நீங்கள் பட்ஜெட் வரம்பை மீறியுள்ளீர்கள்!**\n\n`;
        reply += `**வரம்பு மீறிய வகைகள் (${data.exceededBudgets.length}):**\n`;
        data.exceededBudgets.forEach((b) => {
          reply += `• **${getCategoryLabel(b.category, "ta")}**: செலவானது ${formatINR(
            b.spent
          )} / வரம்பு ${formatINR(b.limit)} (மீறிய தொகை: **+${formatINR(
            Math.abs(b.remaining)
          )}**, ${b.percent}%)\n`;
        });
        if (data.warningBudgets.length > 0) {
          reply += `\n⚠️ **வரம்பை நெருங்கிய வகைகள் (${data.warningBudgets.length}):**\n`;
          data.warningBudgets.forEach((b) => {
            reply += `• ${getCategoryLabel(b.category, "ta")}: ${b.percent}% பயன்படுத்தப்பட்டது (${formatINR(
              b.spent
            )} / ${formatINR(b.limit)})\n`;
          });
        }
        reply += `\n💡 பரிந்துரை: இந்த வகைகளில் மீதமுள்ள நாட்களுக்கு செலவுகளை உடனடியாக கட்டுப்படுத்துங்கள்.`;
        return reply;
      }

      if (data.warningBudgets.length > 0) {
        let reply = `⚠️ **நீங்கள் இன்னும் பட்ஜெட்டை மீறவில்லை, ஆனால் சில வகைகள் வரம்பை நெருங்கியுள்ளன:**\n\n`;
        data.warningBudgets.forEach((b) => {
          reply += `• **${getCategoryLabel(b.category, "ta")}**: ${b.percent}% பயன்படுத்தப்பட்டது (${formatINR(
            b.spent
          )} / ${formatINR(b.limit)}, மீதம் ${formatINR(b.remaining)})\n`;
        });
        return reply;
      }

      return (
        `✅ **இல்லை! உங்கள் அனைத்து பட்ஜெட்டுகளும் பாதுகாப்பான வரம்பிற்குள் உள்ளன.**\n\n` +
        `மொத்தம் ${data.budgets.length} வகை பட்ஜெட்டுகளும் வரம்பிற்குள் சிறப்பாக பராமரிக்கப்படுகின்றன.`
      );
    }

    // English
    if (data.exceededBudgets.length > 0) {
      let reply = `🔴 **Yes, you have exceeded your budget limits!**\n\n`;
      reply += `**Exceeded Categories (${data.exceededBudgets.length}):**\n`;
      data.exceededBudgets.forEach((b) => {
        reply += `• **${getCategoryLabel(b.category, "en")}**: Spent ${formatINR(
          b.spent
        )} of ${formatINR(b.limit)} (Over by **+${formatINR(
          Math.abs(b.remaining)
        )}**, ${b.percent}%)\n`;
      });
      if (data.warningBudgets.length > 0) {
        reply += `\n⚠️ **Approaching Limit (${data.warningBudgets.length}):**\n`;
        data.warningBudgets.forEach((b) => {
          reply += `• ${getCategoryLabel(b.category, "en")}: ${b.percent}% used (${formatINR(
            b.spent
          )} of ${formatINR(b.limit)})\n`;
        });
      }
      reply += `\n💡 Tip: Freeze discretionary purchases in these categories for the rest of the month.`;
      return reply;
    }

    if (data.warningBudgets.length > 0) {
      let reply = `⚠️ **You haven't exceeded any limits yet, but some categories are close:**\n\n`;
      data.warningBudgets.forEach((b) => {
        reply += `• **${getCategoryLabel(b.category, "en")}**: ${b.percent}% consumed (${formatINR(
          b.spent
        )} of ${formatINR(b.limit)}, Remaining: ${formatINR(b.remaining)})\n`;
      });
      return reply;
    }

    return (
      `✅ **No! All your budgets are well under control.**\n\n` +
      `All ${data.budgets.length} configured category budget(s) are strictly within safe limits.`
    );
  }

  // 9. General Budget Status, Limits, and Remaining Amounts
  // Matches: "budget limits", "budget status", "பட்ஜெட்", "budget remaining", "en budget limits"
  if (
    matchesAny(q, [
      "budget limits",
      "budget status",
      "how much budget is left",
      "budget remaining",
      "show budgets",
      "my budgets",
      "budget",
      "பட்ஜெட் விவரங்கள்",
      "பட்ஜெட் வரம்பு",
      "பட்ஜெட் நிலை",
      "பட்ஜெட்",
      "budget status sollu",
      "budget remaining evlo",
      "en budget",
      "budget evlo",
    ])
  ) {
    if (data.budgets.length === 0) {
      return isTa
        ? "நீங்கள் இதுவரை எந்த வகை பட்ஜெட்டையும் அமைக்கவில்லை. 'பட்ஜெட்' பக்கத்திற்குச் சென்று உணவு, ஷாப்பிங் அல்லது பயணத்திற்கு மாதாந்திர வரம்புகளை அமைக்கவும்."
        : "You don't have any category budgets configured. Visit the Budget page to establish limits for key expenses.";
    }

    if (isTa) {
      let reply = `📊 **பட்ஜெட் நிலை அறிக்கை (மொத்தம்: ${data.budgets.length} வகைகள்):**\n\n`;
      data.budgetStatus.forEach((b) => {
        const icon = b.exceeded ? "🔴" : b.warning ? "⚠️" : "🟢";
        reply += `${icon} **${getCategoryLabel(b.category, "ta")}**: ${formatINR(
          b.spent
        )} / ${formatINR(b.limit)} (${b.percent}%)\n`;
        reply += `   மீதமுள்ள தொகை: **${formatINR(b.remaining)}**\n`;
      });
      return reply;
    }

    let reply = `📊 **Budget Status Report (${data.budgets.length} configured):**\n\n`;
    data.budgetStatus.forEach((b) => {
      const icon = b.exceeded ? "🔴" : b.warning ? "⚠️" : "🟢";
      reply += `${icon} **${getCategoryLabel(b.category, "en")}**: Spent ${formatINR(
        b.spent
      )} of ${formatINR(b.limit)} (${b.percent}%)\n`;
      reply += `   Remaining: **${formatINR(b.remaining)}**\n`;
    });
    return reply;
  }

  // 10. Savings Goals Progress & Target Amounts
  // Matches: "savings goal progress", "show my savings goal", "இலக்கின் முன்னேற்றம்", "en savings goal progress", "goal progress"
  if (
    matchesAny(q, [
      "savings goal progress",
      "savings goals",
      "goal progress",
      "show my savings goal",
      "how close am i to my goal",
      "how much have i saved",
      "my goals",
      "சேமிப்பு இலக்கின் முன்னேற்றம்",
      "சேமிப்பு இலக்குகள்",
      "இலக்கு நிலை",
      "இலக்கு முன்னேற்றம்",
      "இலக்கு",
      "en savings goal progress",
      "goal progress kaatu",
      "goals progress",
      "en goals",
      "goal reach panna",
    ]) &&
    !matchesAny(q, ["increase", "improve", "அதிகரிக்க", "tips", "ஆலோசனை"])
  ) {
    if (data.goals.length === 0) {
      return isTa
        ? "தற்போது உங்களிடம் செயலில் உள்ள சேமிப்பு இலக்குகள் எதுவும் இல்லை. 'சேமிப்பு & இலக்குகள்' பக்கத்திற்குச் சென்று புதிய லேப்டாப், சுற்றுலா அல்லது அவசரகால நிதி போன்ற இலக்குகளை அமைக்கவும்."
        : "You haven't set up any savings goals yet. Navigate to the Savings & Goals page to define targets like a New Laptop, Emergency Fund, or Higher Education.";
    }

    if (isTa) {
      let reply = `🎯 **சேமிப்பு இலக்குகள் முன்னேற்ற அறிக்கை:**\n\n`;
      data.goalsSummary.forEach((g) => {
        reply += `• **${g.title}**: **${g.percent}%** நிறைவு\n`;
        reply += `  சேமிக்கப்பட்டது: ${formatINR(g.saved)} / இலக்கு: ${formatINR(
          g.target
        )}\n`;
        if (g.completed) {
          reply += `  🎉 இந்த இலக்கு வெற்றிகரமாக எட்டப்பட்டுவிட்டது!\n`;
        } else {
          reply += `  மீதமுள்ள தேவை: **${formatINR(g.gap)}**\n`;
        }
      });
      if (data.balance > 0) {
        const suggested = Math.round(data.balance * 0.25);
        reply += `\n💡 பரிந்துரை: இந்த மாத உபரி இருப்பிலிருந்து ~${formatINR(
          suggested
        )} தொகையை உங்கள் இலக்குகளுக்கு ஒதுக்கலாம்.`;
      }
      return reply;
    }

    let reply = `🎯 **Savings Goals Progress Report:**\n\n`;
    data.goalsSummary.forEach((g) => {
      reply += `• **${g.title}**: **${g.percent}%** completed\n`;
      reply += `  Saved: ${formatINR(g.saved)} of ${formatINR(g.target)}\n`;
      if (g.completed) {
        reply += `  🎉 Target successfully achieved!\n`;
      } else {
        reply += `  Remaining gap: **${formatINR(g.gap)}**\n`;
      }
    });
    if (data.balance > 0) {
      const suggested = Math.round(data.balance * 0.25);
      reply += `\n💡 Recommendation: You can safely allocate ~${formatINR(
        suggested
      )} from this month's surplus balance toward your goals.`;
    }
    return reply;
  }

  // 11. Emergency Fund Progress & Safety Net
  // Matches: "emergency fund", "safety net", "அவசரகால நிதி", "emergency fund status enna"
  if (
    matchesAny(q, [
      "emergency fund",
      "safety net",
      "emergency savings",
      "அவசரகால நிதி",
      "அவசரகால சேமிப்பு",
      "emergency fund status",
      "emergency fund irukka",
      "emergency ku evlo theva",
      "safety net evlo",
    ])
  ) {
    if (data.emergencyGoal) {
      const g = data.emergencyGoal;
      if (isTa) {
        return (
          `🛡️ **அவசரகால நிதி நிலை அறிக்கை:**\n\n` +
          `• **இலக்கின் பெயர்**: **${g.title}**\n` +
          `• **முன்னேற்றம்**: **${g.percent}%** (${formatINR(
            g.saved
          )} / ${formatINR(g.target)})\n` +
          (g.completed
            ? `🎉 உங்கள் அவசரகால நிதி முழுமையாக பூர்த்தியாகி வலுவான நிதிப் பாதுகாப்பை வழங்குகிறது!`
            : `• **இலக்கை அடைய மீதமுள்ள தொகை**: **${formatINR(
                g.gap
              )}**\n\n💡 ${
                data.balance > 0
                  ? `இந்த மாத இருப்பிலிருந்து ${formatINR(
                      Math.min(g.gap, Math.round(data.balance * 0.3))
                    )} தொகையை இதில் சேர்க்கலாம்.`
                  : "செலவுகளைக் கட்டுப்படுத்தி அவசரகால நிதியை விரைவாக நிரப்பவும்."
              }`)
        );
      }
      return (
        `🛡️ **Emergency Fund Status:**\n\n` +
        `• **Goal**: **${g.title}**\n` +
        `• **Progress**: **${g.percent}%** (${formatINR(
          g.saved
        )} of ${formatINR(g.target)})\n` +
        (g.completed
          ? `🎉 Your emergency fund is fully funded, giving you strong financial resilience!`
          : `• **Remaining Gap**: **${formatINR(g.gap)}**\n\n💡 ${
              data.balance > 0
                ? `You can allocate ${formatINR(
                    Math.min(g.gap, Math.round(data.balance * 0.3))
                  )} from this month's balance to boost your safety buffer.`
                : "Focus on curbing discretionary spending to fund this safety net."
            }`)
      );
    }

    // Recommendation when no dedicated emergency goal exists
    if (isTa) {
      return (
        `🛡️ **அவசரகால நிதி வழிகாட்டுதல்:**\n\n` +
        `உங்களிடம் தற்போது ஒரு பிரத்யேக 'Emergency Fund' இலக்கு அமைக்கப்படவில்லை.\n\n` +
        `நிதி வல்லுநர்களின் கூற்றுப்படி, எதிர்பாராத அவசரச் செலவுகளை சமாளிக்க குறைந்தபட்சம் 3 மாத சராசரி செலவுகளுக்கு இணையான (**~${formatINR(
          data.recommendedEmergency
        )}**) அவசரகால நிதியை வைத்திருக்க வேண்டும்.\n\n` +
        `📌 'சேமிப்பு & இலக்குகள்' பக்கத்தில் 'Emergency Fund' என்ற பெயரில் புதிய இலக்கை உருவாக்க பரிந்துரைக்கிறேன்.`
      );
    }
    return (
      `🛡️ **Emergency Fund Guidance:**\n\n` +
      `You do not currently have a dedicated "Emergency Fund" goal configured.\n\n` +
      `Financial best practice suggests keeping a safety reserve equal to at least 3 months of expenses (**~${formatINR(
        data.recommendedEmergency
      )}**) in liquid savings.\n\n` +
      `📌 Head to the Savings & Goals page to set up an "Emergency Fund" target.`
    );
  }

  // 12. How much money can I save?
  // Matches: "how much money can i save", "how much can i save", "எவ்வளவு பணம் சேமிக்க முடியும்", "evlo save panna mudiyum"
  if (
    matchesAny(q, [
      "how much money can i save",
      "how much can i save",
      "how much should i save",
      "எவ்வளவு பணம் சேமிக்க முடியும்",
      "நான் எவ்வளவு சேமிக்கலாம்",
      "evlo save panna mudiyum",
      "evlo save panradhu",
      "how much save",
    ])
  ) {
    const potentialSaving = Math.max(0, data.balance);
    const recommended20Pct = Math.round(data.currentIncome * 0.2);

    if (isTa) {
      return (
        `💡 **நீங்கள் எவ்வளவு சேமிக்க முடியும்?**\n\n` +
        `• **தற்போதைய கிடைக்கும் இருப்பு**: **${formatINR(
          potentialSaving
        )}**\n` +
        `• **பரிந்துரைக்கப்பட்ட 20% சேமிப்பு இலக்கு**: **${formatINR(
          recommended20Pct
        )}** (50/30/20 விதிப்படி)\n` +
        `• **மீதமுள்ள நாட்களுக்கான தினசரி செலவு வரம்பு**: **${formatINR(
          data.dailySpendingLimit
        )}/நாள்** (${data.remainingDays} நாட்கள் மீதமுள்ளன)\n\n` +
        (potentialSaving > 0
          ? `இந்த மாதத்தில் உங்கள் முழு இருப்பான ${formatINR(
              potentialSaving
            )}-ஐ சேமிப்பு இலக்குகளுக்கு மாற்றி சேமிப்பை அதிகப்படுத்தலாம்.`
          : `தற்போது வருமானத்தை விட செலவுகள் அதிகமாக இருப்பதால், அத்தியாவசியமற்ற செலவுகளைக் குறைத்தால் சேமிக்க முடியும்.`)
      );
    }
    return (
      `💡 **How Much Money Can You Save?**\n\n` +
      `• **Current Available Surplus**: **${formatINR(potentialSaving)}**\n` +
      `• **Recommended 20% Savings Target**: **${formatINR(
        recommended20Pct
      )}** (50/30/20 Rule)\n` +
      `• **Safe Daily Spending Cap**: **${formatINR(
        data.dailySpendingLimit
      )}/day** (${data.remainingDays} days remaining)\n\n` +
      (potentialSaving > 0
        ? `You can comfortably transfer up to ${formatINR(
            potentialSaving
          )} into your savings goals or emergency fund this month.`
        : `Your current spending exceeds income. Trimming top expenses will unlock room for savings.`)
    );
  }

  // 13. Personalized Ways to Improve Savings and Manage Spending (Tips & Advice)
  // Matches: "how can i improve my savings", "how to improve savings", "tips to cut", "advice", "சேமிப்பை எப்படி அதிகரிக்கலாம்", "savings eppadi increase pannalam"
  if (
    matchesAny(q, [
      "improve my savings",
      "improve savings",
      "how can i improve",
      "tips to cut",
      "tips to save",
      "cut expenses",
      "save money",
      "financial advice",
      "spending advice",
      "சேமிப்பை எப்படி அதிகரிக்கலாம்",
      "செலவை குறைக்க",
      "செலவு குறைக்கும் ஆலோசனைகள்",
      "சேமிப்பு ஆலோசனைகள்",
      "ஆலோசனை",
      "savings eppadi increase pannalam",
      "savings eppadi",
      "selava eppadi koraikkaradhu",
      "selavu koraikka",
      "tips kudunga",
      "eppadi save panradhu",
    ])
  ) {
    if (isTa) {
      let reply = `💡 **தனிப்பயனாக்கப்பட்ட சேமிப்பு & செலவு மேலாண்மை ஆலோசனைகள்:**\n\n`;
      if (data.isStudent) {
        reply += `1. **தினசரி செலவு வரம்பு**: இந்த மாதத்தில் மீதமுள்ள ${data.remainingDays} நாட்களுக்கு உங்கள் தினசரி செலவை **${formatINR(
          data.dailySpendingLimit
        )}**க்குள் வைத்திருக்க முயற்சி செய்யுங்கள்.\n`;
        const food = data.breakdown.find((b) => b.category === "Food");
        if (food && food.amount > 0) {
          reply += `2. **உணவு செலவு மேலாண்மை**: வெளிப்புற உணவகங்களை விட கல்லூரி மெஸ்/வீட்டு உணவைத் தேர்ந்தெடுப்பது மாதம் சுமார் **${formatINR(
            Math.round(food.amount * 0.2)
          )}** வரை சேமிக்க உதவும்.\n`;
        }
        const shopping = data.breakdown.find(
          (b) => b.category === "Shopping" || b.category === "Entertainment"
        );
        if (shopping) {
          reply += `3. **விருப்பச் செலவுகள்**: ${getCategoryLabel(
            shopping.category,
            "ta"
          )} செலவை 15-20% குறைத்தால் உங்கள் இலக்குகளுக்கு வேகமாக சேமிக்க முடியும்.\n`;
        }
      } else {
        const fixedCats = ["Rent", "EMI", "Bills", "Healthcare", "Subscription"];
        const fixedSpent = data.breakdown
          .filter((b) => fixedCats.includes(b.category))
          .reduce((s, b) => s + b.amount, 0);
        const fixedPct =
          data.currentIncome > 0
            ? Math.round((fixedSpent / data.currentIncome) * 100)
            : 0;

        reply += `1. **நிலையான செலவுகள்**: உங்கள் நிலையான கட்டணங்கள் (வாடகை, EMI, பில்கள்) வருமானத்தில் **${fixedPct}%** ஆக உள்ளது (இதை 50%க்குள் பராமரிக்க வேண்டும்).\n`;
        const sub = data.breakdown.find((b) => b.category === "Subscription");
        if (sub) {
          reply += `2. **சந்தாக்கள் தணிக்கை**: பயன்படுத்தப்படாத ஸ்ட்ரீமிங் அல்லது சேவைகளை ரத்து செய்வது உடனடியாக பணத்தை மிச்சப்படுத்தும்.\n`;
        }
        reply += `3. **முதல் முன்னுரிமை சேமிப்பு**: சம்பளம் வந்தவுடன் செலவழிப்பதற்கு முன் 15-20% தொகையை சேமிப்பு அல்லது முதலீட்டுக்கு மாற்றுங்கள்.\n`;
      }
      return reply;
    }

    // English
    let reply = `💡 **Personalized Tips to Improve Savings & Manage Spending:**\n\n`;
    if (data.isStudent) {
      reply += `1. **Stick to Your Daily Cap**: To finish the month strong, cap your spending at **${formatINR(
        data.dailySpendingLimit
      )}/day** for the remaining ${data.remainingDays} days.\n`;
      const food = data.breakdown.find((b) => b.category === "Food");
      if (food && food.amount > 0) {
        reply += `2. **Campus Food Strategy**: Choosing canteen/mess meals over external deliveries can save ~**${formatINR(
          Math.round(food.amount * 0.2)
        )}** monthly.\n`;
      }
      const shopping = data.breakdown.find(
        (b) => b.category === "Shopping" || b.category === "Entertainment"
      );
      if (shopping) {
        reply += `3. **Discretionary Spending**: Trimming ${getCategoryLabel(
          shopping.category,
          "en"
        )} by even 15% will directly accelerate your savings goal.\n`;
      }
    } else {
      const fixedCats = ["Rent", "EMI", "Bills", "Healthcare", "Subscription"];
      const fixedSpent = data.breakdown
        .filter((b) => fixedCats.includes(b.category))
        .reduce((s, b) => s + b.amount, 0);
      const fixedPct =
        data.currentIncome > 0
          ? Math.round((fixedSpent / data.currentIncome) * 100)
          : 0;

      reply += `1. **Fixed Overhead Ratio**: Your essential recurring costs stand at **${fixedPct}%** of income (target: under 50% in 50/30/20 rule).\n`;
      const sub = data.breakdown.find((b) => b.category === "Subscription");
      if (sub) {
        reply += `2. **Subscription Audit**: Cancel underutilized subscriptions to unlock immediate monthly cash flow.\n`;
      }
      reply += `3. **Pay Yourself First**: Automate a transfer of at least 15-20% of net income into savings on payday before spending.\n`;
    }
    return reply;
  }

  // 14. Fallback / Clarifying Question for ambiguous queries
  if (isTa) {
    return (
      `🤔 உங்கள் கேள்வியை தெளிவாக புரிந்துகொள்ள உதவ முடியுமா? நான் பின்வரும் நிதி விவரங்களுக்கு பதிலளிக்க முடியும்:\n\n` +
      `• **வருமானம் & செலவுகள்** ("இந்த மாதம் நான் எவ்வளவு செலவு செய்திருக்கிறேன்?")\n` +
      `• **அதிக செலவான வகை** ("எந்த வகையில் அதிகமாக செலவு செய்திருக்கிறேன்?")\n` +
      `• **பட்ஜெட் நிலை** ("என்னுடைய பட்ஜெட்டை மீறிவிட்டேனா?")\n` +
      `• **கிடைக்கும் இருப்பு** ("கிடைக்கும் இருப்பு எவ்வளவு?")\n` +
      `• **சேமிப்பு இலக்குகள்** ("என்னுடைய சேமிப்பு இலக்கின் முன்னேற்றம் என்ன?")\n` +
      `• **ஆலோசனைகள்** ("என்னுடைய சேமிப்பை எப்படி அதிகரிக்கலாம்?")`
    );
  }

  return (
    `🤔 I'd like to help you with that! Could you clarify what financial data you're looking for? Here are some questions you can ask me:\n\n` +
    `• **Income & Expenses**: "How much did I spend this month?"\n` +
    `• **Top Category**: "Which category has the highest spending?"\n` +
    `• **Budget Status**: "Am I exceeding my budget?"\n` +
    `• **Available Balance**: "What is my available balance?"\n` +
    `• **Savings Goals**: "Show my savings goal progress."\n` +
    `• **Personalized Advice**: "How can I improve my savings?"`
  );
}
