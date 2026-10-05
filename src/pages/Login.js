import React, { useState } from "react";
import "./Auth.css";

export default function Login({ onLoggedIn, onGoToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // LOGIN
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Incorrect email or password.");
        setLoading(false);
        return;
      }

      // Save JWT token
      localStorage.setItem("fintrack_token", data.token);

      // Save logged-in user
      localStorage.setItem(
        "fintrack_user",
        JSON.stringify(data.user)
      );

      // Send user information to App.js
      onLoggedIn(data.user);

    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please make sure the FinTrack backend is running."
      );
    }

    setLoading(false);
  };

  // =========================
  // FORGOT PASSWORD
  // =========================
  const handleForgot = (e) => {
    e.preventDefault();

    setForgotMsg(
      "Password reset functionality will be available soon."
    );
  };

  return (
    <div className="auth-shell">

      <div className="auth-visual">

        <div className="auth-visual-brand">
          <div className="auth-visual-mark">F</div>
          <div className="auth-visual-brandtext">FinTrack</div>
        </div>

        <h2>
          Your money, understood — not just tracked.
        </h2>

        <p>
          Beyond just logging transactions, FinTrack studies your
          spending patterns and turns them into a recommendation
          you can actually act on today.
        </p>

        <div className="auth-visual-stats">

          <div>
            <div className="auth-visual-stat-num">₹</div>
            <div className="auth-visual-stat-label">
              INR-first, built for India
            </div>
          </div>

          <div>
            <div className="auth-visual-stat-num">Live</div>
            <div className="auth-visual-stat-label">
              Insights update automatically
            </div>
          </div>

        </div>

      </div>

      <div className="auth-form-side">

        <div className="auth-form-card">

          {forgotMode ? (

            <>
              <h1>Reset your password</h1>

              <p>
                Enter your account email and we'll send you a reset link.
              </p>

              {forgotMsg && (
                <div className="auth-form-success">
                  {forgotMsg}
                </div>
              )}

              <form onSubmit={handleForgot}>

                <div className="field">

                  <label>Email</label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                >
                  Send Reset Link
                </button>

              </form>

              <div className="auth-footer-link">

                <button
                  onClick={() => {
                    setForgotMode(false);
                    setForgotMsg("");
                  }}
                >
                  Back to Sign In
                </button>

              </div>
            </>

          ) : (

            <>
              <h1>Welcome back</h1>

              <p>
                Sign in to see today's financial insights.
              </p>

              {error && (
                <div className="auth-form-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                <div className="field">

                  <label>Email</label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    required
                  />

                </div>

                <div className="field">

                  <label>Password</label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    required
                  />

                </div>

                <div className="auth-forgot">

                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                  >
                    Forgot Password?
                  </button>

                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>

              </form>

              <div className="auth-footer-link">

                New to FinTrack?{" "}

                <button onClick={onGoToSignUp}>
                  Create Account
                </button>

              </div>

            </>

          )}

        </div>

      </div>

    </div>
  );
}