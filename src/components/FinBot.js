import React, { useState, useRef, useEffect } from "react";
import "./FinBot.css";
import translations from "../utils/translations";
import { generateFinBotResponse } from "../utils/finBotEngine";

export default function FinBot({
  user,
  transactions = [],
  budgets = [],
  goals = [],
  language = "en",
}) {
  const t = translations[language] || translations.en;
  const isTa = language === "ta";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      sender: "bot",
      text: t.finBotWelcome || t.chatAssistantGreeting,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  // Update initial welcome message if user changes language and no other messages sent
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [
          {
            id: "welcome",
            sender: "bot",
            text: t.finBotWelcome || t.chatAssistantGreeting,
            time: prev[0].time,
          },
        ];
      }
      return prev;
    });
  }, [language, t]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let botReply = null;

      // 1. First attempt backend intelligence API endpoint
      const token = localStorage.getItem("fintrack_token");
      if (token) {
        try {
          const response = await fetch("http://localhost:5000/api/assistant/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: query,
              budgets,
              goals,
              language,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.reply) {
              botReply = data.reply;
            }
          }
        } catch (fetchErr) {
          // Backend unreachable or network blip; will fallback to local engine
          console.warn("Backend chat endpoint fallback to local engine:", fetchErr);
        }
      }

      // 2. If no backend reply, generate reply using local FinBot intelligence engine
      if (!botReply) {
        botReply = generateFinBotResponse({
          message: query,
          transactions,
          budgets,
          goals,
          user,
          language,
        });
      }

      const botMsg = {
        id: `b_${Date.now()}`,
        sender: "bot",
        text: botReply,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("FinBot error:", err);
      const errMsg = {
        id: `err_${Date.now()}`,
        sender: "bot",
        text: isTa
          ? `மன்னிக்கவும், பிழை ஏற்பட்டது: ${err.message}`
          : `Sorry, an error occurred: ${err.message}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Suggested prompt quick chips
  const quickChips = [
    { label: t.promptStreak, query: t.promptStreak },
    { label: t.promptChallenge, query: t.promptChallenge },
    { label: t.promptAchievements, query: t.promptAchievements },
    { label: t.promptHowMuchSpent, query: t.promptHowMuchSpent },
    { label: t.promptHighestCategory, query: t.promptHighestCategory },
    { label: t.promptExceedingBudget, query: t.promptExceedingBudget },
    { label: t.promptHowMuchCanISave, query: t.promptHowMuchCanISave },
    { label: t.promptGoalProgress, query: t.promptGoalProgress },
    { label: t.promptImproveSavings, query: t.promptImproveSavings },
    { label: t.promptAvailableBalance, query: t.promptAvailableBalance },
    { label: t.promptSpendingChange, query: t.promptSpendingChange },
    { label: t.promptEmergencyStatus, query: t.promptEmergencyStatus },
  ];

  // Markdown-like formatting helper for bold and bullets
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
      // Split on **bold**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <React.Fragment key={lIdx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          {lIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* =========================================
          OPEN STATE: FLOATING CHAT PANEL
      ========================================= */}
      {isOpen && (
        <div
          className="finbot-panel"
          role="dialog"
          aria-label={t.finBot || "FinBot"}
        >
          {/* HEADER */}
          <div className="finbot-header">
            <div className="finbot-header-left">
              <div className="finbot-avatar-circle">🤖</div>
              <div className="finbot-title-area">
                <h3>
                  {t.finBot || "FinBot"}
                  <span className="finbot-live-pill">
                    <span className="finbot-live-pill-dot" />
                    {isTa ? "நேரடித் தரவு" : "Live"}
                  </span>
                </h3>
                <p>{t.finBotSubtitle || "Your Personal Financial Assistant"}</p>
              </div>
            </div>

            <div className="finbot-header-controls">
              <button
                className="finbot-btn-icon"
                onClick={() => setIsOpen(false)}
                title={t.finBotMinimize || "Minimize"}
                aria-label={t.finBotMinimize || "Minimize"}
              >
                —
              </button>
              <button
                className="finbot-btn-icon"
                onClick={() => setIsOpen(false)}
                title={t.finBotClose || "Close"}
                aria-label={t.finBotClose || "Close"}
              >
                ✕
              </button>
            </div>
          </div>

          {/* MESSAGES AREA */}
          <div className="finbot-messages-container">
            {/* WELCOME BANNER */}
            <div className="finbot-welcome-card">
              <div className="finbot-welcome-icon">💡</div>
              <div className="finbot-welcome-text">
                <h4>
                  {isTa
                    ? `வணக்கம் ${user?.fullName || user?.name || ""}!`
                    : `Hi ${user?.fullName || user?.name || "there"}!`}
                </h4>
                <p>
                  {isTa
                    ? "உங்கள் உண்மையான பரிவர்த்தனைகள், பட்ஜெட் மற்றும் சேமிப்பு இலக்குகளின் அடிப்படையில் பதிலளிக்க நான் தயாராக உள்ளேன்."
                    : "I'm ready to answer any questions about your actual spending, budgets, savings goals, and money tips."}
                </p>
              </div>
            </div>

            {/* MESSAGE BUBBLES */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`finbot-msg-row ${msg.sender}`}
              >
                {msg.sender === "bot" && (
                  <div className="finbot-msg-avatar">🤖</div>
                )}
                <div
                  className="finbot-msg-bubble"
                  style={
                    msg.isError
                      ? {
                          borderColor: "var(--danger, #dc2626)",
                          color: "var(--danger, #dc2626)",
                        }
                      : {}
                  }
                >
                  <div>{renderFormattedText(msg.text)}</div>
                  <div className="finbot-msg-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {/* TYPING LOADER */}
            {loading && (
              <div className="finbot-msg-row bot">
                <div className="finbot-msg-avatar">🤖</div>
                <div className="finbot-typing-row">
                  <span>
                    {t.finBotThinking ||
                      (isTa
                        ? "FinBot பகுப்பாய்வு செய்கிறது..."
                        : "FinBot is analyzing your finances...")}
                  </span>
                  <div className="finbot-typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div className="finbot-chips-bar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                className="finbot-chip"
                onClick={() => handleSend(chip.query)}
                disabled={loading}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* INPUT BAR */}
          <div className="finbot-input-bar">
            <input
              ref={inputRef}
              className="finbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                t.finBotAskPlaceholder ||
                t.chatPlaceholder ||
                "Ask about spending, budget, goals, balance..."
              }
              disabled={loading}
            />
            <button
              className="finbot-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              title={t.send || "Send"}
              aria-label={t.send || "Send"}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          CLOSED STATE: FLOATING CIRCULAR LAUNCHER
      ========================================= */}
      <button
        className="finbot-launcher"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          isOpen
            ? t.finBotClose || "Close FinBot"
            : t.finBotLauncherTooltip || "Chat with FinBot"
        }
        title={t.finBotLauncherTooltip || "Chat with FinBot"}
      >
        <span className="finbot-status-dot-pulse" />
        <span className="finbot-launcher-icon">
          {isOpen ? "✕" : "🤖"}
        </span>
        {!isOpen && (
          <span className="finbot-tooltip">
            {t.finBotLauncherTooltip || "Chat with FinBot"}
          </span>
        )}
      </button>
    </>
  );
}
