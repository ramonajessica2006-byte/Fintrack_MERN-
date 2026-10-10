import React, { useEffect, useRef, useState } from "react";
import "./Auth.css";

// Your Google OAuth Client ID
const GOOGLE_CLIENT_ID =
  "354337898529-fhqt2si0bf27i7dvkh7jmebq1pln6n21.apps.googleusercontent.com";

export default function Login({ onLoggedIn, onGoToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleButtonRef = useRef(null);

  // =========================
  // GOOGLE SIGN-IN
  // =========================
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        initializeGoogle();
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

      if (existingScript) {
        existingScript.addEventListener(
          "load",
          initializeGoogle
        );
        return;
      }

      const script = document.createElement("script");

      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = initializeGoogle;

      document.head.appendChild(script);
    };

    const initializeGoogle = () => {
      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id ||
        !googleButtonRef.current
      ) {
        return;
      }

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,

        callback: handleGoogleResponse,

        auto_select: false,
      });

      const btnWidth = Math.min(
        360,
        Math.max(260, window.innerWidth - 64)
      );

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: "outline",
          size: "large",
          width: btnWidth,
          text: "continue_with",
          shape: "rectangular",
        }
      );
    };

    loadGoogleScript();

    return () => {
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

      if (script) {
        script.removeEventListener(
          "load",
          initializeGoogle
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // GOOGLE RESPONSE
  // =========================
  const handleGoogleResponse = async (response) => {
    setError("");
    setGoogleLoading(true);

    try {
      if (!response.credential) {
        setError("Google Sign-In did not return a credential.");
        setGoogleLoading(false);
        return;
      }

      const serverResponse = await fetch(
        "http://localhost:5000/api/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: response.credential,

            // New Google accounts will start as adult.
            // Existing accounts keep their existing userType.
            userType: "adult",
          }),
        }
      );

      const data = await serverResponse.json();

      if (!serverResponse.ok) {
        setError(
          data.message ||
            "Google Sign-In failed. Please try again."
        );

        setGoogleLoading(false);
        return;
      }

      // Save FinTrack JWT
      localStorage.setItem(
        "fintrack_token",
        data.token
      );

      // Save logged-in user
      localStorage.setItem(
        "fintrack_user",
        JSON.stringify(data.user)
      );

      // Send user information to App.js
      onLoggedIn(data.user);
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    }

    setGoogleLoading(false);
  };

  // =========================
  // EMAIL/PASSWORD LOGIN
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
        setError(
          data.message ||
            "Incorrect email or password."
        );

        setLoading(false);
        return;
      }

      // Save JWT token
      localStorage.setItem(
        "fintrack_token",
        data.token
      );

      // Save logged-in user
      localStorage.setItem(
        "fintrack_user",
        JSON.stringify(data.user)
      );

      // Send user information to App.js
      onLoggedIn(data.user);
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
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
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">F</div>
          <span className="login-brand-text">FinTrack</span>
        </div>

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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* OR DIVIDER */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span>OR</span>
              <div className="auth-divider-line" />
            </div>

            {/* GOOGLE SIGN-IN */}
            <div
              className="auth-google-wrap"
              style={{
                opacity: googleLoading ? 0.6 : 1,
              }}
            >
              <div ref={googleButtonRef}></div>
            </div>

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
  );
}