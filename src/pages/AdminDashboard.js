import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import translations from "../utils/translations";

export default function AdminDashboard({ language = "en" }) {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t = translations[language] || translations.en;

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("fintrack_token");

        const response = await fetch(
          "http://localhost:5000/api/auth/admin",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || (language === "ta" ? "நிர்வாகத் தரவை ஏற்ற முடியவில்லை" : "Unable to load admin data")
          );
        }

        setUsers(data.users || []);
        setTotalUsers(data.totalUsers || 0);
      } catch (err) {
        console.error("Admin dashboard error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [language]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>{t.loadingAdminPanel}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          <div className="admin-error-icon">⚠️</div>
          <h2>{t.unableToLoadDashboard}</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const regularUsers = users.filter((user) => user.role === "user").length;
  const studentCount = users.filter((user) => user.userType === "student").length;
  const adultCount = users.filter((user) => user.userType === "adult").length;

  return (
    <div className="admin-page">
      {/* PAGE HEADER */}
      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <div className="admin-title-icon">⚙️</div>
            <div>
              <h1>{t.adminDashboard}</h1>
              <p>{t.manageUsersPlatform}</p>
            </div>
          </div>
        </div>

        <div className="admin-badge">
          <span className="admin-badge-dot"></span>
          {t.administratorBadge}
        </div>
      </div>

      {/* STATISTICS */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">👥</div>
          <div className="admin-stat-content">
            <span>{t.totalUsers}</span>
            <strong>{totalUsers}</strong>
            <small>{t.registeredAccounts}</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">👤</div>
          <div className="admin-stat-content">
            <span>{t.regularUsers}</span>
            <strong>{regularUsers}</strong>
            <small>{t.activeUserAccounts}</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon green">🎓</div>
          <div className="admin-stat-content">
            <span>{t.students}</span>
            <strong>{studentCount}</strong>
            <small>{t.studentAccounts}</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">💼</div>
          <div className="admin-stat-content">
            <span>{t.workingAdults}</span>
            <strong>{adultCount}</strong>
            <small>{t.adultAccounts}</small>
          </div>
        </div>
      </div>

      {/* USER MANAGEMENT */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>{t.registeredUsers}</h2>
            <p>{t.viewAccountsPlatform}</p>
          </div>

          <div className="user-count">
            {totalUsers} {totalUsers === 1 ? t.userLabel : t.usersLabel}
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.userLabel}</th>
                <th>{t.email}</th>
                <th>{t.accountType}</th>
                <th>{t.userRole}</th>
                <th>{t.lastLogin}</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const initials = u.name
                  ? u.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U";

                return (
                  <tr key={u._id}>
                    {/* USER */}
                    <td>
                      <div className="admin-user">
                        <div className="admin-avatar">{initials}</div>
                        <div>
                          <strong>{u.name}</strong>
                          <span>ID: {u._id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td>
                      <span className="admin-email">{u.email}</span>
                    </td>

                    {/* TYPE */}
                    <td>
                      {u.userType === "student" ? (
                        <span className="type-badge student">
                          🎓 {t.student}
                        </span>
                      ) : (
                        <span className="type-badge adult">
                          💼 {t.adult}
                        </span>
                      )}
                    </td>

                    {/* ROLE */}
                    <td>
                      {u.role === "admin" ? (
                        <span className="role-badge admin">
                          🛡 {t.administratorBadge}
                        </span>
                      ) : (
                        <span className="role-badge user">
                          {t.userLabel}
                        </span>
                      )}
                    </td>

                    {/* LAST LOGIN */}
                    <td>
                      <div className="last-login">
                        <span className="login-dot"></span>
                        <span>
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleString()
                            : t.never}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="empty-users">
              <div>👥</div>
              <h3>{t.noUsersFound}</h3>
              <p>{t.registeredUsersAppear}</p>
            </div>
          )}
        </div>
      </div>

      {/* ADMIN SUMMARY */}
      <div className="admin-bottom-grid">
        <div className="admin-info-card">
          <div className="info-icon">🛡️</div>
          <div>
            <h3>{t.administratorAccess}</h3>
            <p>{t.adminAccessDesc}</p>
          </div>
        </div>

        <div className="admin-info-card">
          <div className="info-icon">🔐</div>
          <div>
            <h3>{t.securityStatus}</h3>
            <p>{t.securityDesc}</p>
            <div className="security-status">
              <span></span>
              {t.secureBadge}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}