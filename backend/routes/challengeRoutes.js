const express = require("express");
const Challenge = require("../models/Challenge");
const SavingsContribution = require("../models/SavingsContribution");
const Achievement = require("../models/Achievement");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Helper to format date to YYYY-MM-DD
function formatDay(d) {
  const dateObj = new Date(d);
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Calculate streak strictly from authentic qualifying contributions
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

  // De-duplicate contributions on the same calendar day
  const uniqueDays = Array.from(
    new Set(contributions.map((c) => formatDay(c.date)))
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

  // Best streak
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

// Check and award achievements if conditions are satisfied
async function syncAchievements(userId, contributions, streakInfo, challenges = []) {
  const completedChallenges = challenges.filter((c) => c.status === "completed");
  const earnedKeys = [];

  if (contributions.length >= 1) {
    earnedKeys.push("first_saver");
  }
  if (streakInfo.bestStreak >= 3 || streakInfo.currentStreak >= 3) {
    earnedKeys.push("three_day_streak");
  }
  if (streakInfo.bestStreak >= 7 || streakInfo.currentStreak >= 7) {
    earnedKeys.push("seven_day_streak");
  }
  if (completedChallenges.length >= 1) {
    earnedKeys.push("challenge_champion");
    earnedKeys.push("goal_achiever");
  }

  for (const key of earnedKeys) {
    try {
      await Achievement.findOneAndUpdate(
        { userId, key },
        { $setOnInsert: { userId, key, unlockedAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (e) {
      // Ignore duplicate key race conditions
    }
  }

  const allUnlocked = await Achievement.find({ userId });
  return allUnlocked;
}

/*
  GET /api/challenges
  Retrieves user's challenges, streak, and achievements.
*/
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Load challenges
    const challenges = await Challenge.find({ userId }).sort({ createdAt: -1 });

    // Sync expiry/completion status
    const now = new Date();
    for (const c of challenges) {
      let changed = false;
      if (c.totalContributed >= c.targetAmount && c.status !== "completed") {
        c.status = "completed";
        changed = true;
      } else if (new Date(c.endDate) < now && c.status === "active") {
        c.status = "expired";
        changed = true;
      }
      if (changed) {
        await c.save();
      }
    }

    // Load all qualifying contributions
    const contributions = await SavingsContribution.find({ userId }).sort({
      date: -1,
    });

    // Calculate streak
    const streak = calculateStreak(contributions);

    // Sync achievements
    const achievements = await syncAchievements(
      userId,
      contributions,
      streak,
      challenges
    );

    const activeChallenge = challenges.find((c) => c.status === "active") || null;
    const completedChallenges = challenges.filter((c) => c.status === "completed");
    const expiredChallenges = challenges.filter((c) => c.status === "expired");

    res.status(200).json({
      challenges,
      activeChallenge,
      completedChallenges,
      expiredChallenges,
      streak,
      achievements,
      totalContributionsCount: contributions.length,
      contributions: contributions.slice(0, 50),
    });
  } catch (error) {
    console.error("Error loading challenges:", error);
    res.status(500).json({ message: "Server error loading savings challenges" });
  }
});

/*
  POST /api/challenges
  Creates a new weekly savings challenge.
*/
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, targetAmount, startDate, endDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Challenge title is required" });
    }

    const target = Number(targetAmount);
    if (!target || target <= 0) {
      return res
        .status(400)
        .json({ message: "Target amount must be greater than zero" });
    }

    const start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : null;

    if (!end || isNaN(end.getTime())) {
      // Default to 7 days from start
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    }

    if (end <= start) {
      return res
        .status(400)
        .json({ message: "End date must be after the start date" });
    }

    const challenge = new Challenge({
      userId,
      title: title.trim(),
      targetAmount: target,
      startDate: start,
      endDate: end,
      status: "active",
      totalContributed: 0,
      contributions: [],
    });

    await challenge.save();

    res.status(201).json({
      message: "Challenge created successfully",
      challenge,
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ message: "Server error creating challenge" });
  }
});

/*
  POST /api/challenges/:id/contribute
  Adds a qualifying savings contribution to a specific challenge.
*/
router.post("/:id/contribute", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount, note = "", goalId = null, goalTitle = "" } = req.body;

    const contribAmount = Number(amount);
    if (!contribAmount || contribAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Contribution amount must be greater than 0" });
    }

    const challenge = await Challenge.findOne({ _id: id, userId });
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (challenge.status === "expired") {
      return res.status(400).json({
        message: "This challenge has expired and cannot accept contributions",
      });
    }

    const now = new Date();

    // 1. Add to challenge contributions
    challenge.contributions.push({
      amount: contribAmount,
      date: now,
      note: note.trim(),
      goalId,
      goalTitle,
    });
    challenge.totalContributed += contribAmount;

    // Check completion
    if (challenge.totalContributed >= challenge.targetAmount) {
      challenge.status = "completed";
    }

    await challenge.save();

    // 2. Record qualifying SavingsContribution document
    const contributionDoc = new SavingsContribution({
      userId,
      amount: contribAmount,
      date: now,
      challengeId: challenge._id,
      goalId,
      goalTitle,
      note: note.trim(),
    });
    await contributionDoc.save();

    // 3. Recalculate streak
    const allContribs = await SavingsContribution.find({ userId });
    const streak = calculateStreak(allContribs);

    // 4. Check achievements
    const allChallenges = await Challenge.find({ userId });
    const achievements = await syncAchievements(
      userId,
      allContribs,
      streak,
      allChallenges
    );

    res.status(200).json({
      message: "Contribution recorded successfully",
      challenge,
      contribution: contributionDoc,
      streak,
      achievements,
    });
  } catch (error) {
    console.error("Error contributing to challenge:", error);
    res.status(500).json({ message: "Server error recording contribution" });
  }
});

/*
  POST /api/challenges/contribute
  General qualifying savings contribution (e.g. from GoalCard "Add Money").
  Automatically applies to active challenge if one exists.
*/
router.post("/contribute", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, note = "", goalId = null, goalTitle = "" } = req.body;

    const contribAmount = Number(amount);
    if (!contribAmount || contribAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Contribution amount must be greater than 0" });
    }

    const now = new Date();

    // Find any currently active challenge
    const activeChallenge = await Challenge.findOne({
      userId,
      status: "active",
      endDate: { $gte: now },
    });

    let challengeId = null;
    if (activeChallenge) {
      challengeId = activeChallenge._id;
      activeChallenge.contributions.push({
        amount: contribAmount,
        date: now,
        note: note.trim(),
        goalId,
        goalTitle,
      });
      activeChallenge.totalContributed += contribAmount;
      if (activeChallenge.totalContributed >= activeChallenge.targetAmount) {
        activeChallenge.status = "completed";
      }
      await activeChallenge.save();
    }

    // Record qualifying contribution
    const contributionDoc = new SavingsContribution({
      userId,
      amount: contribAmount,
      date: now,
      challengeId,
      goalId,
      goalTitle,
      note: note.trim(),
    });
    await contributionDoc.save();

    // Recalculate streak
    const allContribs = await SavingsContribution.find({ userId });
    const streak = calculateStreak(allContribs);

    // Sync achievements
    const allChallenges = await Challenge.find({ userId });
    const achievements = await syncAchievements(
      userId,
      allContribs,
      streak,
      allChallenges
    );

    res.status(200).json({
      message: "Qualifying savings contribution confirmed",
      activeChallenge,
      contribution: contributionDoc,
      streak,
      achievements,
    });
  } catch (error) {
    console.error("Error recording savings contribution:", error);
    res.status(500).json({ message: "Server error recording savings contribution" });
  }
});

/*
  DELETE /api/challenges/:id
  Deletes a challenge owned by the user.
*/
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const challenge = await Challenge.findOneAndDelete({ _id: id, userId });
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({ message: "Server error deleting challenge" });
  }
});

module.exports = router;
