import React, { useState } from "react";
import "./Pages.css";
import translations from "../utils/translations";

export default function Settings({
  onResetData,
  language = "en",
  onLanguageChange,
}) {
  const [confirming, setConfirming] = useState(false);
  const t = translations[language] || translations.en;

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    if (onLanguageChange) {
      onLanguageChange(selectedLanguage);
    } else {
      localStorage.setItem("fintrack_language", selectedLanguage);
    }
  };

  return (
    <div className="page-body">
      <div
        className="card section-card"
        style={{ maxWidth: 520 }}
      >
        <div className="section-card-head">
          <h3>{t.settingsTitle}</h3>
        </div>

        {/* Language Selection */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            {t.language}
          </label>

          <select
            value={language}
            onChange={handleLanguageChange}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #dfe3eb",
              borderRadius: 8,
              fontSize: 14,
              background: "#fff",
            }}
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>
        </div>

        {/* Description */}
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 13.5,
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          {t.aboutFinTrack}
        </p>

        {/* Reset Data */}
        {!confirming ? (
          <button
            className="btn btn-danger"
            onClick={() => setConfirming(true)}
          >
            {t.resetAllData}
          </button>
        ) : (
          <div>
            <p
              style={{
                fontSize: 13.5,
                marginBottom: 12,
              }}
            >
              {t.resetConfirmPrompt}
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <button
                className="btn btn-danger"
                onClick={() => {
                  onResetData();
                  setConfirming(false);
                }}
              >
                {t.yesReset}
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => setConfirming(false)}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}