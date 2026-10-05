import React, { useState } from "react";
import "./Auth.css";
import { storage } from "../utils/storage";

export default function Login({ onLoggedIn, onGoToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const users = storage.getUsers();
    const match = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!match) {
      return setError("Incorrect email or password. Try again or create an account.");
    }
    storage.setSession({ fullName: match.fullName, email: match.email, userType: match.userType });
    onLoggedIn(match);
  };

  const handleForgot = (e) => {
    e.preventDefault();
    const users = storage.getUsers();
    const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (match) {
      setForgotMsg(`A password reset link has been sent to ${email} (demo only — prototype has no email backend).`);
    } else {
      setForgotMsg("We couldn't find an account with that email.");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-brand">
          <div className="auth-visual-mark">F</div>
          <div className="auth-visual-brandtext">FinTrack</div>
        </div>
        <h2>Your money, understood — not just tracked.</h2>
        <p>
          Beyond just logging transactions, FinTrack studies your spending patterns and turns them
          into a recommendation you can actually act on today.
        </p>
        <div className="auth-visual-stats">
          <div>
            <div className="auth-visual-stat-num">₹</div>
            <div className="auth-visual-stat-label">INR-first, built for India</div>
          </div>
          <div>
            <div className="auth-visual-stat-num">Live</div>
            <div className="auth-visual-stat-label">Insights update automatically</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          {forgotMode ? (
            <>
              <h1>Reset your password</h1>
              <p>Enter your account email and we'll send you a reset link.</p>
              {forgotMsg && <div className="auth-form-success">{forgotMsg}</div>}
              <form onSubmit={handleForgot}>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <button type="submit" className="btn btn-primary btn-block">Send Reset Link</button>
              </form>
              <div className="auth-footer-link">
                <button onClick={() => { setForgotMode(false); setForgotMsg(""); }}>Back to Sign In</button>
              </div>
            </>
          ) : (
            <>
              <h1>Welcome back</h1>
              <p>Sign in to see today's financial insights.</p>

              {error && <div className="auth-form-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>

                <div className="auth-forgot">
                  <button type="button" onClick={() => setForgotMode(true)}>Forgot Password?</button>
                </div>

                <button type="submit" className="btn btn-primary btn-block">Sign In</button>
              </form>

              <div className="auth-footer-link">
                New to FinTrack? <button onClick={onGoToSignUp}>Create Account</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
