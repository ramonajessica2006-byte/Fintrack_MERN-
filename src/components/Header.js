import React, { useState, useRef, useEffect } from "react";
import "./Header.css";
import translations from "../utils/translations";

function getGreeting(language = "en") {
  const hour = new Date().getHours();
  const t = translations[language] || translations.en;

  if (hour < 12) return t.goodMorning;
  if (hour < 17) return t.goodAfternoon;
  return t.goodEvening;
}

export default function Header({
  user,
  title,
  notifications = [],
  onAddTransaction,
  onMenuClick,
  language = "en",
  onLanguageChange,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const t = translations[language] || translations.en;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const firstName = (
    user?.fullName ||
    user?.name ||
    "there"
  ).split(" ")[0];

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label={t.openMenu}
        >
          ☰
        </button>

        <div>
          <h1 className="header-greeting">
            {title || `${getGreeting(language)}, ${firstName} 👋`}
          </h1>

          <p className="header-subtitle">{t.headerSubtitle}</p>
        </div>
      </div>

      <div className="app-header-right">
        {/* Search */}
        <div className="header-search">
          <span>🔍</span>
          <input placeholder={t.searchTransactions} />
        </div>

        {/* Language Switcher */}
        {onLanguageChange && (
          <button
            className="header-lang-btn"
            onClick={() => onLanguageChange(language === "en" ? "ta" : "en")}
            title={t.language}
          >
            <span>🌐</span>
            <span>{language === "en" ? "தமிழ்" : "English"}</span>
          </button>
        )}

        {/* Notifications */}
        <div className="header-notif-wrap" ref={ref}>
          <button
            className="header-icon-btn"
            onClick={() => setOpen((o) => !o)}
            aria-label={t.notifications}
          >
            🔔
            {notifications.length > 0 && (
              <span className="header-notif-dot">
                {notifications.length}
              </span>
            )}
          </button>

          {open && (
            <div className="header-notif-panel">
              <div className="header-notif-panel-title">
                {t.notifications}
              </div>

              {notifications.length === 0 && (
                <div className="header-notif-empty">
                  {t.allCaughtUp}
                </div>
              )}

              {notifications.map((n, i) => (
                <div key={i} className="header-notif-item">
                  <span>{n.icon}</span>
                  <span>{n.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Transaction */}
        {onAddTransaction && (
          <button className="btn btn-primary" onClick={onAddTransaction}>
            {t.addTransaction}
          </button>
        )}
      </div>
    </header>
  );
}