import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            data.message || "Unable to load admin data"
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
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Loading administration panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          <div className="admin-error-icon">⚠️</div>
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const regularUsers = users.filter(
    (user) => user.role === "user"
  ).length;

  const studentCount = users.filter(
    (user) => user.userType === "student"
  ).length;

  const adultCount = users.filter(
    (user) => user.userType === "adult"
  ).length;

  return (
    <div className="admin-page">

      {/* PAGE HEADER */}
      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <div className="admin-title-icon">⚙️</div>

            <div>
              <h1>Admin Dashboard</h1>
              <p>
                Manage users and monitor the FinTrack platform.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-badge">
          <span className="admin-badge-dot"></span>
          Administrator
        </div>
      </div>

      {/* STATISTICS */}
      <div className="admin-stats-grid">

        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">
            👥
          </div>

          <div className="admin-stat-content">
            <span>Total Users</span>
            <strong>{totalUsers}</strong>
            <small>Registered accounts</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">
            👤
          </div>

          <div className="admin-stat-content">
            <span>Regular Users</span>
            <strong>{regularUsers}</strong>
            <small>Active user accounts</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon green">
            🎓
          </div>

          <div className="admin-stat-content">
            <span>Students</span>
            <strong>{studentCount}</strong>
            <small>Student accounts</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">
            💼
          </div>

          <div className="admin-stat-content">
            <span>Working Adults</span>
            <strong>{adultCount}</strong>
            <small>Adult accounts</small>
          </div>
        </div>

      </div>

      {/* USER MANAGEMENT */}
      <div className="admin-section">

        <div className="admin-section-header">
          <div>
            <h2>Registered Users</h2>
            <p>
              View accounts registered on the FinTrack platform.
            </p>
          </div>

          <div className="user-count">
            {totalUsers} {totalUsers === 1 ? "User" : "Users"}
          </div>
        </div>

        <div className="admin-table-wrapper">

          <table className="admin-table">

            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Account Type</th>
                <th>Role</th>
                <th>Last Login</th>
              </tr>
            </thead>

            <tbody>

              {users.map((user) => {

                const initials = user.name
                  ? user.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U";

                return (
                  <tr key={user._id}>

                    {/* USER */}
                    <td>
                      <div className="admin-user">

                        <div className="admin-avatar">
                          {initials}
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <span>User ID: {user._id.slice(-6)}</span>
                        </div>

                      </div>
                    </td>

                    {/* EMAIL */}
                    <td>
                      <span className="admin-email">
                        {user.email}
                      </span>
                    </td>

                    {/* TYPE */}
                    <td>
                      {user.userType === "student" ? (
                        <span className="type-badge student">
                          🎓 Student
                        </span>
                      ) : (
                        <span className="type-badge adult">
                          💼 Working Adult
                        </span>
                      )}
                    </td>

                    {/* ROLE */}
                    <td>
                      {user.role === "admin" ? (
                        <span className="role-badge admin">
                          🛡 Admin
                        </span>
                      ) : (
                        <span className="role-badge user">
                          User
                        </span>
                      )}
                    </td>

                    {/* LAST LOGIN */}
                    <td>
                      <div className="last-login">

                        <span className="login-dot"></span>

                        <span>
                          {user.lastLogin
                            ? new Date(
                                user.lastLogin
                              ).toLocaleString()
                            : "Never"}
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
              <h3>No users found</h3>
              <p>
                Registered users will appear here.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* ADMIN SUMMARY */}
      <div className="admin-bottom-grid">

        <div className="admin-info-card">

          <div className="info-icon">
            🛡️
          </div>

          <div>
            <h3>Administrator Access</h3>

            <p>
              You are currently signed in with administrator
              privileges. Admin-only features and user information
              are protected using JWT authentication.
            </p>
          </div>

        </div>

        <div className="admin-info-card">

          <div className="info-icon">
            🔐
          </div>

          <div>
            <h3>Security Status</h3>

            <p>
              Authentication is protected using JWT tokens and
              role-based access control.
            </p>

            <div className="security-status">
              <span></span>
              Secure
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}