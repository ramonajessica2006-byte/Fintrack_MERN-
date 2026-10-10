import translations from "./translations";
import {
  computeSummary,
  computeCategoryBreakdown,
  computeHealthScore,
  generateInsights,
  generateImprovementTips,
  generateNotifications,
  computeSavingsStreak,
  computeChallengeProgress,
} from "./calculations";

describe("FinTrack Translations & Intelligence Test Suite", () => {
  test("English and Tamil translation dictionaries are complete and symmetrical", () => {
    expect(translations.en).toBeDefined();
    expect(translations.ta).toBeDefined();

    const enKeys = Object.keys(translations.en);
    const taKeys = Object.keys(translations.ta);

    expect(enKeys.length).toBeGreaterThan(150);
    expect(taKeys.length).toBe(enKeys.length);

    enKeys.forEach((key) => {
      expect(translations.ta[key]).toBeDefined();
      expect(typeof translations.ta[key]).toBe("string");
    });
  });

  test("Financial calculations handle empty transaction lists safely", () => {
    const summary = computeSummary([]);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.balance).toBe(0);
    expect(summary.savingsRate).toBe(0);

    const breakdown = computeCategoryBreakdown([]);
    expect(breakdown).toEqual([]);

    const health = computeHealthScore({
      summary,
      budgetStatus: [],
      goalsSummary: [],
      language: "en",
    });
    expect(health.overall).toBeGreaterThanOrEqual(0);
    expect(health.factors.length).toBe(4);
  });

  test("Personalized intelligence generates dynamic recommendations for students", () => {
    const tx = [
      { type: "income", amount: 15000, category: "Allowance", date: new Date().toISOString() },
      { type: "expense", amount: 4000, category: "Food", date: new Date().toISOString() },
    ];
    const summary = computeSummary(tx);
    const breakdown = computeCategoryBreakdown(tx);

    const insightsEn = generateInsights({
      user: { userType: "student" },
      transactions: tx,
      budgets: [{ category: "Food", limit: 3500 }],
      goals: [{ id: "g1", title: "New Laptop", target: 50000, saved: 15000 }],
      summary,
      breakdown,
      language: "en",
    });

    expect(insightsEn.length).toBeGreaterThan(0);
    expect(insightsEn[0].heading).toContain("Student Financial");
    expect(insightsEn[0].recommendation).not.toContain("₹2,000");

    const insightsTa = generateInsights({
      user: { userType: "student" },
      transactions: tx,
      budgets: [{ category: "Food", limit: 3500 }],
      goals: [{ id: "g1", title: "New Laptop", target: 50000, saved: 15000 }],
      summary,
      breakdown,
      language: "ta",
    });

    expect(insightsTa.length).toBeGreaterThan(0);
    expect(insightsTa[0].heading).toContain("மாணவருக்கான");
  });

  test("Personalized intelligence generates dynamic recommendations for working adults", () => {
    const tx = [
      { type: "income", amount: 60000, category: "Salary", date: new Date().toISOString() },
      { type: "expense", amount: 18000, category: "Rent", date: new Date().toISOString() },
      { type: "expense", amount: 5000, category: "Food", date: new Date().toISOString() },
    ];
    const summary = computeSummary(tx);
    const breakdown = computeCategoryBreakdown(tx);

    const insights = generateInsights({
      user: { userType: "adult" },
      transactions: tx,
      budgets: [],
      goals: [{ id: "g1", title: "Emergency Fund", target: 180000, saved: 45000 }],
      summary,
      breakdown,
      language: "en",
    });

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].heading).toContain("Adult Financial");
    // Ensure no hardcoded ₹2,000 for all users
    const hasHardcodedSavings = insights.some((i) =>
      i.recommendation.includes("Increasing your monthly savings by around ₹2,000")
    );
    expect(hasHardcodedSavings).toBe(false);
  });

  test("Notifications generate properly in English and Tamil", () => {
    const notifsEn = generateNotifications({
      budgetStatus: [{ category: "Food", status: "exceeded", remaining: -500, percent: 120 }],
      goals: [{ title: "Laptop", percent: 80 }],
      summary: { savingsRate: 35 },
      language: "en",
    });
    expect(notifsEn.length).toBe(3);

    const notifsTa = generateNotifications({
      budgetStatus: [{ category: "Food", status: "exceeded", remaining: -500, percent: 120 }],
      goals: [{ title: "Laptop", percent: 80 }],
      summary: { savingsRate: 35 },
      language: "ta",
    });
    expect(notifsTa.length).toBe(3);
    expect(notifsTa[0].text).toContain("பட்ஜெட்");
  });

  test("FinBot conversational engine answers all financial questions in English", () => {
    const { generateFinBotResponse } = require("./finBotEngine");

    const now = new Date();
    const tx = [
      { type: "income", amount: 50000, category: "Salary", date: now.toISOString() },
      { type: "expense", amount: 12000, category: "Food", date: now.toISOString() },
      { type: "expense", amount: 8000, category: "Shopping", date: now.toISOString() },
    ];
    const budgets = [
      { category: "Food", limit: 10000 },
      { category: "Shopping", limit: 15000 },
    ];
    const goals = [
      { id: "g1", title: "Emergency Fund", target: 60000, saved: 20000 },
      { id: "g2", title: "New Laptop", target: 40000, saved: 30000 },
    ];
    const user = { userType: "student" };

    // 1. Expense query
    const resExpense = generateFinBotResponse({
      message: "How much did I spend this month?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resExpense).toContain("₹20,000");

    // 2. Highest spending category
    const resHighest = generateFinBotResponse({
      message: "Which category has the highest spending?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resHighest).toContain("Food");
    expect(resHighest).toContain("₹12,000");

    // 3. Exceeding budget
    const resBudget = generateFinBotResponse({
      message: "Am I exceeding my budget?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resBudget).toContain("exceeded");
    expect(resBudget).toContain("Food");

    // 4. Available balance
    const resBalance = generateFinBotResponse({
      message: "What is my available balance?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resBalance).toContain("₹30,000");

    // 5. Savings goals
    const resGoals = generateFinBotResponse({
      message: "Show my savings goal progress",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resGoals).toContain("New Laptop");
    expect(resGoals).toContain("75%");

    // 6. Emergency fund
    const resEmergency = generateFinBotResponse({
      message: "What is my emergency fund status?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resEmergency).toContain("Emergency Fund");
    expect(resEmergency).toContain("₹20,000");
  });

  test("FinBot conversational engine answers questions in Tamil and Tanglish", () => {
    const { generateFinBotResponse } = require("./finBotEngine");

    const now = new Date();
    const tx = [
      { type: "income", amount: 40000, category: "Salary", date: now.toISOString() },
      { type: "expense", amount: 15000, category: "Food", date: now.toISOString() },
      { type: "expense", amount: 5000, category: "Travel", date: now.toISOString() },
    ];
    const budgets = [{ category: "Food", limit: 12000 }];
    const goals = [{ id: "g1", title: "Bike", target: 50000, saved: 25000 }];
    const user = { userType: "adult" };

    // Tamil Script query 1: Spending
    const resTa1 = generateFinBotResponse({
      message: "இந்த மாதம் நான் எவ்வளவு செலவு செய்திருக்கிறேன்?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "ta",
    });
    expect(resTa1).toContain("₹20,000");
    expect(resTa1).toContain("செலவு");

    // Tamil Script query 2: Highest spending category
    const resTa2 = generateFinBotResponse({
      message: "எந்த வகையில் அதிகமாக செலவு செய்திருக்கிறேன்?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "ta",
    });
    expect(resTa2).toContain("உணவு");
    expect(resTa2).toContain("₹15,000");

    // Tamil Script query 3: Budget exceed
    const resTa3 = generateFinBotResponse({
      message: "என்னுடைய பட்ஜெட்டை மீறிவிட்டேனா?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "ta",
    });
    expect(resTa3).toContain("மீறியுள்ளீர்கள்");

    // Tanglish Query 1: "Indha maasam evlo spend pannirukken?"
    const resTanglish1 = generateFinBotResponse({
      message: "Indha maasam evlo spend pannirukken?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resTanglish1).toContain("₹20,000");

    // Tanglish Query 2: "Savings eppadi increase pannalam?"
    const resTanglish2 = generateFinBotResponse({
      message: "Savings eppadi increase pannalam?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resTanglish2).toContain("Overhead");

    // Tanglish Query 3: "En budget exceed aagiducha?"
    const resTanglish3 = generateFinBotResponse({
      message: "En budget exceed aagiducha?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resTanglish3).toContain("exceeded");

    // Tanglish Query 4: "Enakku highest spending category enna?"
    const resTanglish4 = generateFinBotResponse({
      message: "Enakku highest spending category enna?",
      transactions: tx,
      budgets,
      goals,
      user,
      language: "en",
    });
    expect(resTanglish4).toContain("Food");
    expect(resTanglish4).toContain("₹15,000");
  });

  test("Savings streak calculations correctly handle consecutive days, gaps, and duplicate same-day contributions", () => {
    // 1. Empty contributions -> 0 streak
    const emptyStreak = computeSavingsStreak([]);
    expect(emptyStreak.currentStreak).toBe(0);
    expect(emptyStreak.bestStreak).toBe(0);
    expect(emptyStreak.activeToday).toBe(false);

    // 2. Single contribution today
    const now = new Date();
    const todayStr = now.toISOString();
    const singleStreak = computeSavingsStreak([{ date: todayStr, amount: 500 }], now);
    expect(singleStreak.currentStreak).toBe(1);
    expect(singleStreak.bestStreak).toBe(1);
    expect(singleStreak.activeToday).toBe(true);
    expect(singleStreak.uniqueDaysCount).toBe(1);

    // 3. Duplicate same-day contributions (Multiple contributions on the same calendar day)
    // Must NOT inflate streak count; should remain 1 day
    const duplicateContributions = [
      { date: todayStr, amount: 500 },
      { date: todayStr, amount: 300 },
      { date: todayStr, amount: 1200 },
    ];
    const dupStreak = computeSavingsStreak(duplicateContributions, now);
    expect(dupStreak.currentStreak).toBe(1);
    expect(dupStreak.bestStreak).toBe(1);
    expect(dupStreak.uniqueDaysCount).toBe(1);

    // 4. Consecutive calendar days (Today, Yesterday, Day before yesterday -> 3 days streak)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const consecutiveContribs = [
      { date: todayStr, amount: 500 },
      { date: yesterday.toISOString(), amount: 400 },
      { date: twoDaysAgo.toISOString(), amount: 600 },
    ];
    const streak3Days = computeSavingsStreak(consecutiveContribs, now);
    expect(streak3Days.currentStreak).toBe(3);
    expect(streak3Days.bestStreak).toBe(3);
    expect(streak3Days.uniqueDaysCount).toBe(3);

    // 5. Gap of more than 1 day resets current streak, but preserves best streak
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const brokenStreakContribs = [
      { date: fiveDaysAgo.toISOString(), amount: 200 },
      { date: sixDaysAgo.toISOString(), amount: 300 },
      { date: sevenDaysAgo.toISOString(), amount: 400 },
    ];
    const gapStreak = computeSavingsStreak(brokenStreakContribs, now);
    expect(gapStreak.currentStreak).toBe(0);
    expect(gapStreak.bestStreak).toBe(3);
    expect(gapStreak.activeToday).toBe(false);
  });

  test("Weekly savings challenge progress calculation accurately derives remaining amount, percent, and completion", () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7);

    const challenge = {
      title: "Sprint Saver",
      targetAmount: 5000,
      totalContributed: 2000,
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      status: "active",
    };

    const progress = computeChallengeProgress(challenge);
    expect(progress.target).toBe(5000);
    expect(progress.contributed).toBe(2000);
    expect(progress.remaining).toBe(3000);
    expect(progress.percent).toBe(40);
    expect(progress.isCompleted).toBe(false);
    expect(progress.daysLeft).toBeGreaterThanOrEqual(6);

    // Completed challenge
    const completedChallenge = {
      ...challenge,
      totalContributed: 5000,
      status: "completed",
    };
    const completedProg = computeChallengeProgress(completedChallenge);
    expect(completedProg.remaining).toBe(0);
    expect(completedProg.percent).toBe(100);
    expect(completedProg.isCompleted).toBe(true);
  });

  test("FinBot conversational engine answers savings streak, challenge, and achievement queries in English, Tamil, and Tanglish", () => {
    const { generateFinBotResponse } = require("./finBotEngine");

    const streakData = {
      currentStreak: 3,
      bestStreak: 5,
      activeToday: true,
    };
    const challengeData = {
      title: "Sprint Saver",
      targetAmount: 2000,
      totalContributed: 1500,
      endDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    };
    const achievementsData = [
      { key: "first_saver" },
      { key: "three_day_streak" },
    ];

    // English streak query
    const resStreakEn = generateFinBotResponse({
      message: "What is my current savings streak?",
      streak: streakData,
      language: "en",
    });
    expect(resStreakEn).toContain("3 day(s)");
    expect(resStreakEn).toContain("Best streak: **5 day(s)**");

    // Tamil streak query
    const resStreakTa = generateFinBotResponse({
      message: "எனது சேமிப்பு ஸ்ட்ரீக் என்ன?",
      streak: streakData,
      language: "ta",
    });
    expect(resStreakTa).toContain("3 நாட்கள்");
    expect(resStreakTa).toContain("5 நாட்கள்");

    // Tanglish streak query
    const resStreakTanglish = generateFinBotResponse({
      message: "En streak evlo?",
      streak: streakData,
      language: "en",
    });
    expect(resStreakTanglish).toContain("3 day(s)");

    // English challenge query
    const resChallengeEn = generateFinBotResponse({
      message: "What is my weekly savings challenge progress?",
      activeChallenge: challengeData,
      language: "en",
    });
    expect(resChallengeEn).toContain("Sprint Saver");
    expect(resChallengeEn).toContain("₹2,000");
    expect(resChallengeEn).toContain("₹1,500");

    // Tamil challenge query
    const resChallengeTa = generateFinBotResponse({
      message: "வாராந்திர சவால் முன்னேற்றம் என்ன?",
      activeChallenge: challengeData,
      language: "ta",
    });
    expect(resChallengeTa).toContain("Sprint Saver");
    expect(resChallengeTa).toContain("₹2,000");

    // English achievements query
    const resBadgesEn = generateFinBotResponse({
      message: "What achievements and badges have I unlocked?",
      achievements: achievementsData,
      language: "en",
    });
    expect(resBadgesEn).toContain("First Saver");
    expect(resBadgesEn).toContain("Unlocked");
    expect(resBadgesEn).toContain("Locked");

    // Tamil achievements query
    const resBadgesTa = generateFinBotResponse({
      message: "நான் என்னென்ன சாதனைகள் மற்றும் பேட்ஜ்களை அடைந்துள்ளேன்?",
      achievements: achievementsData,
      language: "ta",
    });
    expect(resBadgesTa).toContain("முதல் சேமிப்பாளர்");
    expect(resBadgesTa).toContain("திறக்கப்பட்டது");
  });
});

