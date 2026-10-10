import React from "react";
import "./Sidebar.css";
import translations from "../utils/translations";

const NAV_ITEMS = [
  { key: "dashboard", icon: "🏠" },
  { key: "transactions", icon: "💳" },
  { key: "budget", icon: "📅" },
  { key: "savings", icon: "🎯" },
  { key: "insights", icon: "📈" },
  { key: "profile", icon: "👤" },
];

export default function Sidebar({
  page,
  onNavigate,
  user,
  onLogout,
  mobileOpen,
  onCloseMobile,
  language = "en",
}) {
  const t = translations[language] || translations.en;

  const navList = [
    ...NAV_ITEMS,
    ...(user?.role === "admin"
      ? [{ key: "admin", icon: "🛡️" }]
      : []),
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-scrim"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">F</span>
          <span className="sidebar-brand-text">FinTrack</span>
        </div>

        <nav className="sidebar-nav">
          {navList.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${
                page === item.key ? "active" : ""
              }`}
              onClick={() => {
                onNavigate(item.key);
                onCloseMobile && onCloseMobile();
              }}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {t[item.key] || item.key}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`sidebar-nav-item ${
              page === "settings" ? "active" : ""
            }`}
            onClick={() => {
              onNavigate("settings");
              onCloseMobile && onCloseMobile();
            }}
          >
            <span className="sidebar-nav-icon">⚙️</span>
            {t.settings}
          </button>

          <button
            className="sidebar-nav-item sidebar-logout"
            onClick={onLogout}
          >
            <span className="sidebar-nav-icon">🚪</span>
            {t.logout}
          </button>

          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {(user?.fullName || user?.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <div className="sidebar-user-name">
                {user?.fullName || user?.name || "User"}
              </div>

              <div className="sidebar-user-type">
                {user?.userType === "student"
                  ? `🎓 ${t.student}`
                  : user?.userType === "adult"
                  ? `💼 ${t.adult}`
                  : `👤 ${t.member}`}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}