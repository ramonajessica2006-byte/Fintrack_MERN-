import React, { useState, useRef, useEffect } from "react";
import "./Header.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Header({ user, title, notifications, onAddTransaction, onMenuClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const firstName = (user?.fullName || "there").split(" ")[0];

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button className="header-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          ☰
        </button>
        <div>
          <h1 className="header-greeting">
            {title || `${getGreeting()}, ${firstName} 👋`}
          </h1>
          <p className="header-subtitle">Here's what's happening with your money.</p>
        </div>
      </div>

      <div className="app-header-right">
        <div className="header-search">
          <span>🔍</span>
          <input placeholder="Search transactions..." />
        </div>

        <div className="header-notif-wrap" ref={ref}>
          <button className="header-icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
            🔔
            {notifications.length > 0 && <span className="header-notif-dot">{notifications.length}</span>}
          </button>
          {open && (
            <div className="header-notif-panel">
              <div className="header-notif-panel-title">Notifications</div>
              {notifications.length === 0 && (
                <div className="header-notif-empty">You're all caught up 🎉</div>
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

        {onAddTransaction && (
          <button className="btn btn-primary" onClick={onAddTransaction}>
            + Add Transaction
          </button>
        )}
      </div>
    </header>
  );
}
