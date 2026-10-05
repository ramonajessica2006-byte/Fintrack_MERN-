import React from "react";
import "./Sidebar.css";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "🏠" },
  { key: "transactions", label: "Transactions", icon: "💳" },
  { key: "budget", label: "Budget", icon: "📅" },
  { key: "savings", label: "Savings", icon: "🎯" },
  { key: "insights", label: "Financial Insights", icon: "📈" },
  { key: "profile", label: "Profile", icon: "👤" },
];

export default function Sidebar({ page, onNavigate, user, onLogout, mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={onCloseMobile} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">F</span>
          <span className="sidebar-brand-text">FinTrack</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${page === item.key ? "active" : ""}`}
              onClick={() => {
                onNavigate(item.key);
                onCloseMobile && onCloseMobile();
              }}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={() => onNavigate("settings")}>
            <span className="sidebar-nav-icon">⚙️</span>
            Settings
          </button>
          <button className="sidebar-nav-item sidebar-logout" onClick={onLogout}>
            <span className="sidebar-nav-icon">🚪</span>
            Logout
          </button>

          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{(user?.fullName || "U").charAt(0).toUpperCase()}</div>
            <div>
              <div className="sidebar-user-name">{user?.fullName || "User"}</div>
              <div className="sidebar-user-type">
                {user?.userType === "student" ? "🎓 Student" : user?.userType === "adult" ? "💼 Working Adult" : "👤 Member"}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
