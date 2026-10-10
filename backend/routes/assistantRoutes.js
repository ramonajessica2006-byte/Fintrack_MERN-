const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/user");
const Challenge = require("../models/Challenge");
const SavingsContribution = require("../models/SavingsContribution");
const Achievement = require("../models/Achievement");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function formatINR(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDay(d) {
  const dateObj = new Date(d);
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function calculateStreak(contributions = []) {
  if (!contributions || contributions.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastContributedDate: null,
      activeToday: false,
      uniqueDaysCount: 0,
    };
  }

  const uniqueDays = Array.from(
    new Set(contributions.map((c) => formatDay(c.date)))
  ).sort().reverse();

  if (uniqueDays.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastContributedDate: null,
      activeToday: false,
      uniqueDaysCount: 0,
    };
  }

  const today = formatDay(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDay(yesterdayDate);

  const datesSet = new Set(uniqueDays);
  const activeToday = datesSet.has(today);

  let currentStreak = 0;
  if (activeToday || datesSet.has(yesterday)) {
    let checkDate = new Date(activeToday ? new Date() : yesterdayDate);
    while (datesSet.has(formatDay(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  const sortedAsc = [...uniqueDays].sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dayStr of sortedAsc) {
    const curr = new Date(dayStr);
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

function getCategoryLabel(category, language = "en") {
  const dict = CATEGORY_NAMES[language] || CATEGORY_NAMES.en;
  return dict[category] || category;
}

function matchesAny(text, patterns) {
  const lower = (text || "").toLowerCase();
  return patterns.some((p) => {
    if (p instanceof RegExp) return p.test(lower);
    return lower.includes(p.toLowerCase());
  });
}

// Generate data-driven responses based on authentic records
function generateLocalAnalyticsReply({
  message = "",
  user,
  transactions = [],
  budgets = [],
  goals = [],
  language = "en",
  streak = { currentStreak: 0, bestStreak: 0, activeToday: false },
  challenges = [],
  activeChallenge = null,
  achievements = [],
}) {
  const isTa = language === "ta";
  const rawQuery = (message || "").trim();
  const q = rawQuery.toLowerCase();
  const isStudent = user?.userType === "student";

  // --- SAVINGS STREAK & CHALLENGE MODE INTENTS (Answerable even with 0 general transactions) ---
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
    const cStreak = streak?.currentStreak || 0;
    const bStreak = streak?.bestStreak || 0;
    const isActToday = !!streak?.activeToday;

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
    if (activeChallenge) {
      const target = Number(activeChallenge.targetAmount || 0);
      const contributed = Number(activeChallenge.totalContributed || 0);
      const remaining = Math.max(0, target - contributed);
      const percent = target > 0 ? Math.min(100, Math.round((contributed / target) * 100)) : 0;
      const endD = new Date(activeChallenge.endDate);
      const nowMs = new Date().getTime();
      const daysLeft = Math.max(0, Math.ceil((endD.getTime() - nowMs) / (1000 * 60 * 60 * 24)));

      if (isTa) {
        return (
          `🎯 **வாராந்திர சேமிப்பு சவால்: '${activeChallenge.title}'**\n\n` +
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
        `🎯 **Weekly Savings Challenge: '${activeChallenge.title}'**\n\n` +
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

  // 0. Zero Transactions Check
  if (!transactions || transactions.length === 0) {
    if (isTa) {
      return (
        "👋 **வணக்கம்!** உங்கள் கணக்கில் இதுவரை எந்த பரிவர்த்தனைகளும் பதிவு செய்யப்படவில்லை.\n\n" +
        "துல்லியமான நிதி ஆலோசனைகள் மற்றும் பகுப்பாய்வைப் பெற, உங்கள் முதல் வருமானம் அல்லது செலவை **'பரிவர்த்தனைகள்' (Transactions)** பக்கத்தில் சேர்க்கவும்.\n\n" +
        (isStudent
          ? "🎓 மாணவராக, உங்கள் பாக்கெட் மணி மற்றும் கல்லூரி செலவுகளைப் பதிவு செய்தால் தினசரி செலவு வரம்பு கணக்கிடப்படும்."
          : "💼 பணிபுரியும் நபராக, உங்கள் சம்பளம் மற்றும் செலவுகளைப் பதிவு செய்தால் பட்ஜெட் மற்றும் அவசரகால நிதி இலக்குகள் கணக்கிடப்படும்.")
      );
    }
    return (
      "👋 **Hello!** You don't have any recorded transactions in your account yet.\n\n" +
      "To provide accurate financial analytics, please record your first income or expense on the **Transactions** page.\n\n" +
      (isStudent
        ? "🎓 As a student, logging your pocket allowance and college expenses will automatically calculate your daily spending limit."
        : "💼 As a working professional, logging your salary and monthly bills will calculate your expense breakdown and emergency fund recommendations.")
    );
  }

  // 1. Total Income
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
        `• **மொத்த வருமானம்**: **${formatINR(currentIncome)}**\n` +
        (currentIncome > 0
          ? `• **நடப்பு செலவுகள்**: ${formatINR(currentExpenses)}\n` +
            `• **கிடைக்கும் இருப்பு**: ${formatINR(balance)} (சேமிப்பு விகிதம்: ${savingsRate}%)\n\n` +
            (balance > 0
              ? `💡 இந்த இருப்பிலிருந்து சேமிப்பு இலக்குகளுக்கு அல்லது அவசரகால நிதிக்கு பணத்தை ஒதுக்கலாம்.`
              : `⚠️ உங்கள் செலவுகள் வருமானத்தை விட அதிகமாக உள்ளன.`)
          : `⚠️ இந்த மாதத்தில் வருமானப் பரிவர்த்தனைகள் எதுவும் பதிவு செய்யப்படவில்லை.`)
      );
    }
    return (
      `💰 **Income Summary for This Month:**\n\n` +
      `• **Total Income**: **${formatINR(currentIncome)}**\n` +
      (currentIncome > 0
        ? `• **Current Expenses**: ${formatINR(currentExpenses)}\n` +
          `• **Available Balance**: ${formatINR(balance)} (Savings Rate: ${savingsRate}%)\n\n` +
          (balance > 0
            ? `💡 With a positive balance, consider allocating some funds toward your active savings goals.`
            : `⚠️ Your expenses currently exceed your recorded income for this month.`)
        : `⚠️ No income transactions recorded for the current month yet.`)
    );
  }

  // 2. Total Expenses
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
        `• **மொத்த செலவுகள்**: **${formatINR(currentExpenses)}**\n` +
        `• **வருமானம்**: ${formatINR(currentIncome)}\n` +
        `• **மீதமுள்ள இருப்பு**: ${formatINR(balance)}\n\n` +
        (topCategory
          ? `📌 அதிகபட்சமாக **${getCategoryLabel(
              topCategory.category,
              "ta"
            )}** வகையில் ${formatINR(topCategory.amount)} (${
              topCategory.percent
            }%) செலவிடப்பட்டுள்ளது.`
          : "")
      );
    }
    return (
      `💸 **Expense Summary for This Month:**\n\n` +
      `• **Total Expenses**: **${formatINR(currentExpenses)}**\n` +
      `• **Income**: ${formatINR(currentIncome)}\n` +
      `• **Remaining Balance**: ${formatINR(balance)}\n\n` +
      (topCategory
        ? `📌 Your largest expense category is **${getCategoryLabel(
            topCategory.category,
            "en"
          )}** at ${formatINR(topCategory.amount)} (${
            topCategory.percent
          }% of total expenses).`
        : "")
    );
  }

  // 3. Available Balance
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
        `• **கிடைக்கும் இருப்பு**: **${formatINR(balance)}**\n` +
        `• **இந்த மாத வருமானம்**: ${formatINR(currentIncome)}\n` +
        `• **இந்த மாத செலவுகள்**: ${formatINR(currentExpenses)}\n` +
        `• **சேமிப்பு விகிதம்**: ${savingsRate}%\n` +
        `• **பரிந்துரைக்கப்பட்ட தினசரி வரம்பு**: ${formatINR(
          dailySpendingLimit
        )} (${remainingDays} நாட்கள் மீதமுள்ளன)\n\n` +
        (balance > 0
          ? `✅ உங்களிடம் நேர்மறை இருப்பு உள்ளது!`
          : `⚠️ உங்கள் இருப்பு பற்றாக்குறையில் உள்ளது.`)
      );
    }
    return (
      `💳 **Your Available Balance:**\n\n` +
      `• **Available Balance**: **${formatINR(balance)}**\n` +
      `• **This Month's Income**: ${formatINR(currentIncome)}\n` +
      `• **This Month's Expenses**: ${formatINR(currentExpenses)}\n` +
      `• **Savings Rate**: ${savingsRate}%\n` +
      `• **Safe Daily Spending Limit**: ${formatINR(
        dailySpendingLimit
      )}/day (${remainingDays} days remaining)\n\n` +
      (balance > 0
        ? `✅ You have a positive cash flow this month.`
        : `⚠️ You are currently running a deficit.`)
    );
  }

  // 4. Highest-Spending Category
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
    if (!topCategory || currentExpenses === 0) {
      return isTa
        ? "இந்த மாதத்தில் செலவுகள் எதுவும் பதிவு செய்யப்படவில்லை."
        : "No expenses recorded for this month yet.";
    }

    const catName = getCategoryLabel(topCategory.category, isTa ? "ta" : "en");
    if (isTa) {
      return (
        `🏆 **அதிகபட்ச செலவு வகை:**\n\n` +
        `• **வகை**: **${catName}**\n` +
        `• **செலவான தொகை**: **${formatINR(topCategory.amount)}**\n` +
        `• **மொத்த செலவில் பங்கு**: **${topCategory.percent}%**\n`
      );
    }
    return (
      `🏆 **Highest-Spending Category:**\n\n` +
      `• **Category**: **${catName}**\n` +
      `• **Amount Spent**: **${formatINR(topCategory.amount)}**\n` +
      `• **Share of Total Expenses**: **${topCategory.percent}%**\n`
    );
  }

  // 5. Specific Category Lookup
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
      breakdown.find((b) => b.category === matchedCat.key)?.amount || 0;
    const catPct =
      currentExpenses > 0
        ? Math.round((catSpent / currentExpenses) * 100)
        : 0;
    const budget = budgets.find((b) => b.category === matchedCat.key);
    const catLabel = getCategoryLabel(matchedCat.key, isTa ? "ta" : "en");

    if (isTa) {
      return (
        `📊 **${catLabel} செலவு விவரம்:**\n\n` +
        `• **இந்த மாதம் செலவானது**: **${formatINR(catSpent)}** (${catPct}%)\n` +
        (budget
          ? `• **பட்ஜெட் வரம்பு**: ${formatINR(budget.limit)} (மீதம்: ${formatINR(
              budget.limit - catSpent
            )})\n`
          : `• இந்த வகைக்கு பட்ஜெட் அமைக்கப்படவில்லை.\n`)
      );
    }
    return (
      `📊 **${catLabel} Spending Details:**\n\n` +
      `• **Spent This Month**: **${formatINR(catSpent)}** (${catPct}%)\n` +
      (budget
        ? `• **Category Budget Limit**: ${formatINR(budget.limit)} (Remaining: ${formatINR(
            budget.limit - catSpent
          )})\n`
        : `• No specific budget limit configured for this category.\n`)
    );
  }

  // 6. Category Breakdown (General)
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
    if (breakdown.length === 0) {
      return isTa
        ? "இந்த மாதத்தில் செலவுகள் எதுவும் பதிவு செய்யப்படவில்லை."
        : "No expenses recorded this month yet.";
    }

    if (isTa) {
      let reply = `📊 **இந்த மாத வகை வாரியான செலவுகள் (மொத்தம்: ${formatINR(
        currentExpenses
      )}):**\n\n`;
      breakdown.slice(0, 5).forEach((b) => {
        reply += `• **${getCategoryLabel(b.category, "ta")}**: ${formatINR(
          b.amount
        )} (${b.percent}%)\n`;
      });
      return reply;
    }

    let reply = `📊 **This Month's Spending by Category (Total: ${formatINR(
      currentExpenses
    )}):**\n\n`;
    breakdown.slice(0, 5).forEach((b) => {
      reply += `• **${getCategoryLabel(b.category, "en")}**: ${formatINR(
        b.amount
      )} (${b.percent}%)\n`;
    });
    return reply;
  }

  // 7. Spending Changes Between Months (MoM Trend)
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
    if (!hasPrevData) {
      return isTa
        ? `📅 **மாதாந்திர செலவு ஒப்பீடு:**\n\n` +
            `கடந்த மாதத்திற்கான பரிவர்த்தனை தரவு எதுவும் கிடைக்கவில்லை (நடப்பு மாத செலவு: ${formatINR(
              currentExpenses
            )}).\n` +
            `அடுத்த மாதத்தில் போதுமான வரலாறு சேரும்போது துல்லியமான மாதாந்திர ஒப்பீடு காட்டப்படும்.`
        : `📅 **Month-over-Month Spending Comparison:**\n\n` +
            `There is no transaction history recorded for the previous month (Current Month: ${formatINR(
              currentExpenses
            )}).\n` +
            `Once you have transactions across multiple months, FinBot will automatically compute spending trends.`;
    }

    const sign = expenseDiff >= 0 ? "+" : "";
    if (isTa) {
      return (
        `📈 **கடந்த மாதத்துடன் செலவு ஒப்பீடு:**\n\n` +
        `• **கடந்த மாத செலவு**: ${formatINR(prevExpenses)}\n` +
        `• **இந்த மாத செலவு**: ${formatINR(currentExpenses)}\n` +
        `• **செலவு மாற்றம்**: **${sign}${expensePctChange}%** (${sign}${formatINR(
          expenseDiff
        )})\n`
      );
    }
    return (
      `📈 **Spending Comparison vs Last Month:**\n\n` +
      `• **Last Month's Expenses**: ${formatINR(prevExpenses)}\n` +
      `• **This Month's Expenses**: ${formatINR(currentExpenses)}\n` +
      `• **Net Change**: **${sign}${expensePctChange}%** (${sign}${formatINR(
        expenseDiff
      )})\n`
    );
  }

  // 8. Budget Exceeded / Approaching
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
    if (budgets.length === 0) {
      return isTa
        ? "நீங்கள் இதுவரை எந்த வகை பட்ஜெட்டுகளையும் அமைக்கவில்லை. 'பட்ஜெட்' பக்கத்திற்குச் சென்று வரம்புகளை அமைக்கவும்."
        : "You haven't set any category budgets yet. Head over to the Budget page to configure monthly spending limits.";
    }

    if (isTa) {
      if (exceededBudgets.length > 0) {
        let reply = `🔴 **ஆம், நீங்கள் பட்ஜெட் வரம்பை மீறியுள்ளீர்கள்!**\n\n`;
        exceededBudgets.forEach((b) => {
          reply += `• **${getCategoryLabel(b.category, "ta")}**: செலவானது ${formatINR(
            b.spent
          )} / வரம்பு ${formatINR(b.limit)} (மீறிய தொகை: +${formatINR(
            Math.abs(b.remaining)
          )})\n`;
        });
        return reply;
      }
      return `✅ **இல்லை! உங்கள் அனைத்து பட்ஜெட்டுகளும் பாதுகாப்பான வரம்பிற்குள் உள்ளன.** (${budgets.length} வகைகள்)`;
    }

    if (exceededBudgets.length > 0) {
      let reply = `🔴 **Yes, you have exceeded your budget limits!**\n\n`;
      exceededBudgets.forEach((b) => {
        reply += `• **${getCategoryLabel(b.category, "en")}**: Spent ${formatINR(
          b.spent
        )} of ${formatINR(b.limit)} (Over by +${formatINR(
          Math.abs(b.remaining)
        )})\n`;
      });
      return reply;
    }
    return `✅ **No! All your budgets are well under control.** (${budgets.length} configured)`;
  }

  // 9. General Budget Status
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
    if (budgets.length === 0) {
      return isTa
        ? "நீங்கள் இதுவரை எந்த வகை பட்ஜெட்டையும் அமைக்கவில்லை. 'பட்ஜெட்' பக்கத்திற்குச் சென்று வரம்புகளை அமைக்கவும்."
        : "You don't have any category budgets configured. Visit the Budget page to establish limits.";
    }

    if (isTa) {
      let reply = `📊 **பட்ஜெட் நிலை அறிக்கை (மொத்தம்: ${budgets.length} வகைகள்):**\n\n`;
      budgetStatus.forEach((b) => {
        reply += `• **${getCategoryLabel(b.category, "ta")}**: ${formatINR(
          b.spent
        )} / ${formatINR(b.limit)} (மீதம்: ${formatINR(b.remaining)})\n`;
      });
      return reply;
    }

    let reply = `📊 **Budget Status Report (${budgets.length} configured):**\n\n`;
    budgetStatus.forEach((b) => {
      reply += `• **${getCategoryLabel(b.category, "en")}**: Spent ${formatINR(
        b.spent
      )} of ${formatINR(b.limit)} (Remaining: ${formatINR(b.remaining)})\n`;
    });
    return reply;
  }

  // 10. Savings Goals Progress
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
    if (goals.length === 0) {
      return isTa
        ? "தற்போது உங்களிடம் செயலில் உள்ள சேமிப்பு இலக்குகள் எதுவும் இல்லை. 'சேமிப்பு & இலக்குகள்' பக்கத்திற்குச் சென்று இலக்குகளை அமைக்கவும்."
        : "You haven't set up any savings goals yet. Navigate to the Savings & Goals page to define targets.";
    }

    if (isTa) {
      let reply = `🎯 **சேமிப்பு இலக்குகள் முன்னேற்ற அறிக்கை:**\n\n`;
      goalsSummary.forEach((g) => {
        reply += `• **${g.title}**: **${g.percent}%** நிறைவு (${formatINR(
          g.saved
        )} / ${formatINR(g.target)})\n`;
      });
      return reply;
    }

    let reply = `🎯 **Savings Goals Progress Report:**\n\n`;
    goalsSummary.forEach((g) => {
      reply += `• **${g.title}**: **${g.percent}%** completed (${formatINR(
        g.saved
      )} of ${formatINR(g.target)})\n`;
    });
    return reply;
  }

  // 11. Emergency Fund
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
    if (emergencyGoal) {
      if (isTa) {
        return (
          `🛡️ **அவசரகால நிதி நிலை அறிக்கை:**\n\n` +
          `• **இலக்கு**: **${emergencyGoal.title}**\n` +
          `• **முன்னேற்றம்**: **${emergencyGoal.percent}%** (${formatINR(
            emergencyGoal.saved
          )} / ${formatINR(emergencyGoal.target)})\n` +
          `• **மீதமுள்ள தேவை**: ${formatINR(emergencyGoal.gap)}`
        );
      }
      return (
        `🛡️ **Emergency Fund Status:**\n\n` +
        `• **Goal**: **${emergencyGoal.title}**\n` +
        `• **Progress**: **${emergencyGoal.percent}%** (${formatINR(
          emergencyGoal.saved
        )} of ${formatINR(emergencyGoal.target)})\n` +
        `• **Remaining Gap**: ${formatINR(emergencyGoal.gap)}`
      );
    }

    if (isTa) {
      return (
        `🛡️ **அவசரகால நிதி வழிகாட்டுதல்:**\n\n` +
        `உங்களிடம் தற்போது ஒரு பிரத்யேக 'Emergency Fund' இலக்கு அமைக்கப்படவில்லை.\n` +
        `குறைந்தபட்சம் 3 மாத சராசரி செலவுகளுக்கு இணையான (**~${formatINR(
          recommendedEmergency
        )}**) அவசரகால நிதியை வைத்திருப்பது பரிந்துரைக்கப்படுகிறது.`
      );
    }
    return (
      `🛡️ **Emergency Fund Guidance:**\n\n` +
      `You do not currently have a dedicated "Emergency Fund" goal configured.\n` +
      `Financial best practice suggests keeping at least 3 months of expenses (**~${formatINR(
        recommendedEmergency
      )}**) in reserve.`
    );
  }

  // 12. How much money can I save?
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
    const potentialSaving = Math.max(0, balance);
    if (isTa) {
      return (
        `💡 **நீங்கள் எவ்வளவு சேமிக்க முடியும்?**\n\n` +
        `• **தற்போதைய கிடைக்கும் இருப்பு**: **${formatINR(potentialSaving)}**\n` +
        `• **பரிந்துரைக்கப்பட்ட தினசரி வரம்பு**: **${formatINR(
          dailySpendingLimit
        )}/நாள்** (${remainingDays} நாட்கள் மீதமுள்ளன)`
      );
    }
    return (
      `💡 **How Much Money Can You Save?**\n\n` +
      `• **Current Available Surplus**: **${formatINR(potentialSaving)}**\n` +
      `• **Safe Daily Spending Cap**: **${formatINR(
        dailySpendingLimit
      )}/day** (${remainingDays} days remaining)`
    );
  }

  // 13. Personalized Tips & Improvement
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
      if (isStudent) {
        reply += `1. **தினசரி செலவு வரம்பு**: இந்த மாதத்தில் மீதமுள்ள ${remainingDays} நாட்களுக்கு உங்கள் தினசரி செலவை **${formatINR(
          dailySpendingLimit
        )}**க்குள் வைத்திருக்க முயற்சி செய்யுங்கள்.\n`;
        const food = breakdown.find((b) => b.category === "Food");
        if (food && food.amount > 0) {
          reply += `2. **உணவு செலவு மேலாண்மை**: வெளிப்புற உணவகங்களை விட கல்லூரி மெஸ் உணவைத் தேர்ந்தெடுப்பது மாதம் சுமார் **${formatINR(
            Math.round(food.amount * 0.2)
          )}** வரை சேமிக்க உதவும்.\n`;
        }
      } else {
        const fixedCats = ["Rent", "EMI", "Bills", "Healthcare", "Subscription"];
        const fixedSpent = breakdown
          .filter((b) => fixedCats.includes(b.category))
          .reduce((s, b) => s + b.amount, 0);
        const fixedPct =
          currentIncome > 0
            ? Math.round((fixedSpent / currentIncome) * 100)
            : 0;

        reply += `1. **நிலையான செலவுகள்**: உங்கள் நிலையான கட்டணங்கள் வருமானத்தில் **${fixedPct}%** ஆக உள்ளது (இதை 50%க்குள் பராமரிக்க வேண்டும்).\n`;
        reply += `2. **முதல் முன்னுரிமை சேமிப்பு**: சம்பளம் வந்தவுடன் 15-20% தொகையை சேமிப்புக்கு மாற்றுங்கள்.\n`;
      }
      return reply;
    }

    let reply = `💡 **Personalized Tips to Improve Savings & Manage Spending:**\n\n`;
    if (isStudent) {
      reply += `1. **Stick to Your Daily Cap**: Cap your spending at **${formatINR(
        dailySpendingLimit
      )}/day** for the remaining ${remainingDays} days.\n`;
      const food = breakdown.find((b) => b.category === "Food");
      if (food && food.amount > 0) {
        reply += `2. **Campus Food Strategy**: Choosing mess meals over external deliveries can save ~**${formatINR(
          Math.round(food.amount * 0.2)
        )}** monthly.\n`;
      }
    } else {
      const fixedCats = ["Rent", "EMI", "Bills", "Healthcare", "Subscription"];
      const fixedSpent = breakdown
        .filter((b) => fixedCats.includes(b.category))
        .reduce((s, b) => s + b.amount, 0);
      const fixedPct =
        currentIncome > 0
          ? Math.round((fixedSpent / currentIncome) * 100)
          : 0;

      reply += `1. **Fixed Overhead Ratio**: Your essential recurring costs stand at **${fixedPct}%** of income (target: under 50%).\n`;
      reply += `2. **Pay Yourself First**: Automate a transfer of at least 15-20% into savings on payday.\n`;
    }
    return reply;
  }

  // 14. Fallback / Clarification
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

/*
  POST /api/assistant/chat
  Handles user questions about their financial status.
*/
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message, budgets = [], goals = [], language = "en" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message query is required",
      });
    }

    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const [transactions, challenges, contributions, achievements] =
      await Promise.all([
        Transaction.find({ userId: req.user.userId }).sort({ date: -1 }),
        Challenge.find({ userId: req.user.userId }).sort({ createdAt: -1 }),
        SavingsContribution.find({ userId: req.user.userId }).sort({ date: -1 }),
        Achievement.find({ userId: req.user.userId }),
      ]);

    const streak = calculateStreak(contributions);
    const activeChallenge =
      challenges.find((c) => c.status === "active") || null;

    const reply = generateLocalAnalyticsReply({
      message,
      user,
      transactions,
      budgets,
      goals,
      language,
      streak,
      challenges,
      activeChallenge,
      achievements,
    });

    res.status(200).json({
      reply,
      mode: "local_analytics",
      modeNotice:
        language === "ta"
          ? "உங்கள் நேரடி கணக்குத் தரவைப் பயன்படுத்தி இயங்கும் உள்ளூர் நிதி பகுப்பாய்வு முறை."
          : "Operating in data-driven local intelligence mode using your actual account data.",
    });
  } catch (error) {
    console.error("Assistant chat error:", error);
    res.status(500).json({
      message: "Server error while processing financial assistant query",
    });
  }
});

module.exports = router;
