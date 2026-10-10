import React, { useState, useEffect, useCallback } from "react";
import "./SavingsChallenges.css";
import { formatCurrency, formatDayString } from "../utils/calculations";
import translations from "../utils/translations";
import Modal from "./Modal";

export default function SavingsChallenges({
  language = "en",
  goalsSummary = [],
  onGoalAddMoney,
}) {
  const t = translations[language] || translations.en;
  const isTa = language === "ta";

  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({
    currentStreak: 0,
    bestStreak: 0,
    activeToday: false,
    lastContributedDate: null,
    uniqueDaysCount: 0,
  });
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [expiredChallenges, setExpiredChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [totalContributionsCount, setTotalContributionsCount] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeTargetChallengeId, setContributeTargetChallengeId] = useState(null);

  // Form states
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeTarget, setChallengeTarget] = useState("");
  const [startDate, setStartDate] = useState(() => formatDayString(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDayString(d);
  });

  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [contribGoalId, setContribGoalId] = useState("");

  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch all challenge data from authenticated backend
  const loadChallengeData = useCallback(async () => {
    const token = localStorage.getItem("fintrack_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/challenges", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load challenges");
      }

      const data = await response.json();
      setStreak(
        data.streak || {
          currentStreak: 0,
          bestStreak: 0,
          activeToday: false,
          lastContributedDate: null,
          uniqueDaysCount: 0,
        }
      );
      setActiveChallenge(data.activeChallenge || null);
      setCompletedChallenges(data.completedChallenges || []);
      setExpiredChallenges(data.expiredChallenges || []);
      setAchievements(data.achievements || []);
      setTotalContributionsCount(data.totalContributionsCount || 0);

      // Cache for offline/local FinBot queries
      if (data.streak) {
        localStorage.setItem(
          "fintrack_streak_cache",
          JSON.stringify(data.streak)
        );
      }
      if (data.activeChallenge) {
        localStorage.setItem(
          "fintrack_active_challenge",
          JSON.stringify(data.activeChallenge)
        );
      } else {
        localStorage.removeItem("fintrack_active_challenge");
      }
    } catch (err) {
      console.warn("Error loading challenge data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChallengeData();
  }, [loadChallengeData]);

  // Handle Challenge Creation
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const targetVal = Number(challengeTarget);
    if (!targetVal || targetVal <= 0) {
      setErrorMessage(t.validationEnterAmount);
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage(t.validationEnterDates);
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setErrorMessage(t.validationEndDateAfter);
      return;
    }

    const token = localStorage.getItem("fintrack_token");
    if (!token) {
      setErrorMessage("Please login to create savings challenges");
      return;
    }

    try {
      const title =
        challengeTitle.trim() ||
        (isTa ? "7-நாள் சேமிப்பு சவால்" : "7-Day Sprint Saver");

      const response = await fetch("http://localhost:5000/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          targetAmount: targetVal,
          startDate,
          endDate,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to create challenge");
      }

      setStatusMessage(t.challengeCreatedSuccess);
      setShowCreateModal(false);
      setChallengeTitle("");
      setChallengeTarget("");
      loadChallengeData();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Handle Recording Confirmed Savings Contribution
  const handleRecordContribution = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const amountVal = Number(contribAmount);
    if (!amountVal || amountVal <= 0) {
      setErrorMessage(t.validationEnterAmount);
      return;
    }

    const token = localStorage.getItem("fintrack_token");
    if (!token) {
      setErrorMessage("Please login to record savings contributions");
      return;
    }

    try {
      const payload = {
        amount: amountVal,
        note: contribNote.trim(),
        goalId: contribGoalId || undefined,
        challengeId: contributeTargetChallengeId || undefined,
      };

      const response = await fetch(
        "http://localhost:5000/api/challenges/contribute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to record contribution");
      }

      // If tied to an existing goal, update goal in parent
      if (contribGoalId && onGoalAddMoney) {
        onGoalAddMoney(contribGoalId, amountVal);
      }

      setStatusMessage(t.contributionSuccess);
      setShowContributeModal(false);
      setContribAmount("");
      setContribNote("");
      setContribGoalId("");
      setContributeTargetChallengeId(null);
      loadChallengeData();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Handle Challenge Deletion
  const handleDeleteChallenge = async (id) => {
    if (!window.confirm(t.confirmDeleteChallenge)) return;

    const token = localStorage.getItem("fintrack_token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/challenges/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to delete challenge");
      }

      loadChallengeData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Calculate days left for active challenge
  const getDaysLeft = (end) => {
    if (!end) return 0;
    const now = new Date();
    const target = new Date(end);
    target.setHours(23, 59, 59, 999);
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Achievements definition
  const allBadges = [
    {
      key: "first_saver",
      icon: "🌟",
      title: t.badgeFirstSaver,
      desc: t.badgeFirstSaverDesc,
    },
    {
      key: "three_day_streak",
      icon: "🔥",
      title: t.badgeThreeDayStreak,
      desc: t.badgeThreeDayStreakDesc,
    },
    {
      key: "seven_day_streak",
      icon: "⚡",
      title: t.badgeSevenDayStreak,
      desc: t.badgeSevenDayStreakDesc,
    },
    {
      key: "goal_achiever",
      icon: "🎯",
      title: t.badgeGoalAchiever,
      desc: t.badgeGoalAchieverDesc,
    },
    {
      key: "challenge_champion",
      icon: "🏆",
      title: t.badgeChallengeChampion,
      desc: t.badgeChallengeChampionDesc,
    },
  ];

  const unlockedMap = new Map();
  achievements.forEach((a) => {
    unlockedMap.set(a.key, a);
  });

  return (
    <div className="savings-challenges-container">
      {/* SECTION HEADER & QUICK ACTION */}
      <div className="challenges-section-header">
        <div>
          <h2 className="challenges-section-title">
            🏆 {t.savingsStreakAndChallenges}
          </h2>
          <p className="challenges-section-subtitle">
            {t.challengeModeSubtitle}
            {loading ? " •··" : ""}
          </p>
        </div>

        <div className="challenges-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setContributeTargetChallengeId(activeChallenge?._id || null);
              setShowContributeModal(true);
            }}
          >
            {t.contributeSavings}
          </button>
          {!activeChallenge && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(true)}
            >
              {t.createChallenge}
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {statusMessage && (
        <div className="alert-banner alert-success">
          <span>✓ {statusMessage}</span>
          <button onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="alert-banner alert-error">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      {/* ROW 1: STREAK CARD & ACTIVE WEEKLY CHALLENGE */}
      <div className="challenges-main-grid">
        {/* STREAK CARD */}
        <div className="card challenge-box streak-highlight-card">
          <div className="streak-card-top">
            <span className="streak-flame-icon">🔥</span>
            <div>
              <span className="streak-card-label">{t.currentStreak}</span>
              <div className="streak-count-display">
                <span className="streak-number">{streak.currentStreak}</span>
                <span className="streak-days-text">
                  {streak.currentStreak === 1 ? t.day : t.days}
                </span>
              </div>
            </div>
          </div>

          <div className="streak-status-pill-row">
            {streak.activeToday ? (
              <span className="status-pill status-active-today">
                {t.streakActiveToday}
              </span>
            ) : streak.currentStreak > 0 ? (
              <span className="status-pill status-pending-today">
                {t.streakPendingToday}
              </span>
            ) : (
              <span className="status-pill status-no-streak">
                {t.noStreakYet}
              </span>
            )}
          </div>

          <div className="streak-meta-row">
            <div className="streak-meta-item">
              <span className="meta-label">{t.bestStreak}:</span>
              <span className="meta-value">
                {streak.bestStreak} {t.days}
              </span>
            </div>
            <div className="streak-meta-item">
              <span className="meta-label">{t.contributed}:</span>
              <span className="meta-value">
                {totalContributionsCount}{" "}
                {isTa ? "பங்களிப்புகள்" : "contributions"}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE WEEKLY CHALLENGE CARD */}
        <div className="card challenge-box active-challenge-card">
          {activeChallenge ? (
            (() => {
              const target = Number(activeChallenge.targetAmount) || 0;
              const contributed = Number(activeChallenge.totalContributed) || 0;
              const remaining = Math.max(0, target - contributed);
              const percent =
                target > 0
                  ? Math.min(100, Math.round((contributed / target) * 100))
                  : 0;
              const daysLeft = getDaysLeft(activeChallenge.endDate);

              return (
                <div className="active-challenge-content">
                  <div className="active-challenge-header">
                    <div>
                      <span className="challenge-tag-badge">
                        🎯 {t.activeChallenge}
                      </span>
                      <h3 className="active-challenge-title">
                        {activeChallenge.title}
                      </h3>
                    </div>
                    <button
                      className="icon-link"
                      onClick={() => handleDeleteChallenge(activeChallenge._id)}
                      title={t.delete}
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="challenge-progress-stats">
                    <div className="progress-stat-col">
                      <span className="stat-label">{t.contributed}</span>
                      <span className="stat-val stat-saved">
                        {formatCurrency(contributed)}
                      </span>
                    </div>
                    <div className="progress-stat-col">
                      <span className="stat-label">{t.target}</span>
                      <span className="stat-val stat-target">
                        {formatCurrency(target)}
                      </span>
                    </div>
                    <div className="progress-stat-col">
                      <span className="stat-label">{t.remainingToSave}</span>
                      <span className="stat-val stat-remaining">
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  <div className="challenge-progress-bar-wrap">
                    <div className="challenge-progress-track">
                      <div
                        className="challenge-progress-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="challenge-progress-labels">
                      <span className="progress-pct-text">
                        {percent}% {t.complete}
                      </span>
                      <span className="days-left-badge">
                        📅 {daysLeft === 0 ? t.lastDay : `${daysLeft} ${t.daysLeft}`}
                      </span>
                    </div>
                  </div>

                  {percent >= 100 ? (
                    <div className="challenge-complete-notice">
                      {t.congratulationsChallengeCompleted}
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => {
                        setContributeTargetChallengeId(activeChallenge._id);
                        setShowContributeModal(true);
                      }}
                    >
                      + {t.contributeToChallenge}
                    </button>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="empty-challenge-state">
              <div className="empty-icon-bubble">🎯</div>
              <h4>{t.weeklyChallenge}</h4>
              <p>{t.noActiveChallenge}</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                {t.startAChallenge}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: ACHIEVEMENTS & BADGES */}
      <div className="card challenge-box achievements-section-card">
        <div className="section-card-head">
          <div>
            <h3>🏅 {t.achievementsTitle}</h3>
            <span className="achievements-subtext">
              {t.achievementsSubtitle}
            </span>
          </div>
          <span className="unlocked-counter-badge">
            {achievements.length} / {allBadges.length} {t.unlocked}
          </span>
        </div>

        <div className="badges-grid">
          {allBadges.map((badge) => {
            const unlockedDoc = unlockedMap.get(badge.key);
            const isUnlocked = !!unlockedDoc;

            return (
              <div
                key={badge.key}
                className={`badge-card ${
                  isUnlocked ? "badge-card-unlocked" : "badge-card-locked"
                }`}
              >
                <div className="badge-card-icon-area">
                  <span className="badge-emoji">{badge.icon}</span>
                  <span
                    className={`badge-status-tag ${
                      isUnlocked ? "tag-unlocked" : "tag-locked"
                    }`}
                  >
                    {isUnlocked ? `✓ ${t.unlocked}` : `🔒 ${t.locked}`}
                  </span>
                </div>

                <h4 className="badge-title">{badge.title}</h4>
                <p className="badge-desc">{badge.desc}</p>

                {isUnlocked && unlockedDoc.unlockedAt && (
                  <span className="badge-unlocked-date">
                    {t.unlockedOn}{" "}
                    {new Date(unlockedDoc.unlockedAt).toLocaleDateString(
                      isTa ? "ta-IN" : "en-IN"
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 3: COMPLETED & EXPIRED CHALLENGES HISTORY */}
      {(completedChallenges.length > 0 || expiredChallenges.length > 0) && (
        <div className="card challenge-box history-section-card">
          <div className="section-card-head">
            <h3>📜 {t.challengeHistory}</h3>
          </div>

          <div className="history-table-wrapper">
            <table className="challenge-history-table">
              <thead>
                <tr>
                  <th>{t.title}</th>
                  <th>{t.target}</th>
                  <th>{t.contributed}</th>
                  <th>{t.progress}</th>
                  <th>{t.endDate}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {[...completedChallenges, ...expiredChallenges].map((c) => {
                  const target = Number(c.targetAmount) || 0;
                  const contributed = Number(c.totalContributed) || 0;
                  const percent =
                    target > 0
                      ? Math.min(100, Math.round((contributed / target) * 100))
                      : 0;
                  const isComp = c.status === "completed" || contributed >= target;

                  return (
                    <tr key={c._id}>
                      <td className="history-title-cell">
                        <strong>{c.title}</strong>
                      </td>
                      <td>{formatCurrency(target)}</td>
                      <td>{formatCurrency(contributed)}</td>
                      <td>
                        <div className="mini-progress-track">
                          <div
                            className={`mini-progress-fill ${
                              isComp ? "fill-success" : "fill-neutral"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="mini-pct">{percent}%</span>
                      </td>
                      <td>
                        {new Date(c.endDate).toLocaleDateString(
                          isTa ? "ta-IN" : "en-IN"
                        )}
                      </td>
                      <td>
                        <span
                          className={`history-status-badge ${
                            isComp ? "status-comp" : "status-exp"
                          }`}
                        >
                          {isComp ? `✓ ${t.completed}` : t.expired}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE WEEKLY CHALLENGE */}
      {showCreateModal && (
        <Modal
          title={`🎯 ${t.createChallengeTitle}`}
          onClose={() => setShowCreateModal(false)}
          width={500}
        >
          <form onSubmit={handleCreateChallenge} className="challenge-form">
            <div className="field">
              <label htmlFor="challenge-title-input">{t.challengeTitleLabel}</label>
              <input
                id="challenge-title-input"
                type="text"
                placeholder={t.challengeTitlePlaceholder}
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="challenge-target-input">{t.challengeTargetLabel} *</label>
              <input
                id="challenge-target-input"
                type="number"
                placeholder="2000"
                min="1"
                required
                value={challengeTarget}
                onChange={(e) => setChallengeTarget(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="challenge-start-date">{t.startDate} *</label>
                <input
                  id="challenge-start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="challenge-end-date">{t.endDate} *</label>
                <input
                  id="challenge-end-date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                {t.cancel || "Cancel"}
              </button>
              <button type="submit" className="btn btn-primary">
                {isTa ? "சவாலை உருவாக்கு" : (t.createChallengeTitle || "Create Challenge")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: RECORD CONFIRMED SAVINGS CONTRIBUTION */}
      {showContributeModal && (
        <Modal
          title={`💰 ${t.contributionModalTitle}`}
          onClose={() => {
            setShowContributeModal(false);
            setContributeTargetChallengeId(null);
          }}
          width={500}
        >
          <form onSubmit={handleRecordContribution} className="challenge-form">
            <div className="field">
              <label htmlFor="contrib-amount-input">{t.contributionAmount} *</label>
              <input
                id="contrib-amount-input"
                type="number"
                placeholder="500"
                min="1"
                required
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="contrib-note-input">{t.contributionNote}</label>
              <input
                id="contrib-note-input"
                type="text"
                placeholder="e.g. Set aside from salary / food budget"
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
              />
            </div>

            {goalsSummary.length > 0 && (
              <div className="field">
                <label htmlFor="contrib-goal-select">{t.linkToGoal}</label>
                <select
                  id="contrib-goal-select"
                  value={contribGoalId}
                  onChange={(e) => setContribGoalId(e.target.value)}
                >
                  <option value="">{t.selectGoal}</option>
                  {goalsSummary.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({formatCurrency(g.saved)} /{" "}
                      {formatCurrency(g.target)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="modal-form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowContributeModal(false);
                  setContributeTargetChallengeId(null);
                }}
              >
                {t.cancel || "Cancel"}
              </button>
              <button type="submit" className="btn btn-primary">
                {t.recordContribution}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
