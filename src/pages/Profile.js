import React, { useState } from "react";
import "./Pages.css";
import translations from "../utils/translations";

const USER_TYPES = [
  { key: "student", icon: "🎓" },
  { key: "adult", icon: "💼" },
  { key: "other", icon: "👤" },
];

export default function Profile({
  user,
  onSave,
  language = "en",
}) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || user.name || "");
  const [userType, setUserType] = useState(user.userType || "adult");
  const [saved, setSaved] = useState(false);

  const t = translations[language] || translations.en;

  const userTypeLabels = {
    student: t.student,
    adult: t.adult,
    other: t.other,
  };

  const handleSave = () => {
    onSave({
      ...user,
      fullName,
      userType,
    });

    setEditing(false);
    setSaved(true);

    setTimeout(() => setSaved(false), 2500);
  };

  const typeInfo =
    USER_TYPES.find((type) => type.key === user.userType) || USER_TYPES[1];

  return (
    <div className="page-body">
      <div
        className="card section-card"
        style={{ maxWidth: 520 }}
      >
        <div className="section-card-head">
          <h3>{t.profileTitle}</h3>

          {!editing && (
            <button
              className="link-btn"
              onClick={() => setEditing(true)}
            >
              {t.editProfile}
            </button>
          )}
        </div>

        {saved && (
          <div className="auth-form-success">
            {t.profileUpdated}
          </div>
        )}

        {editing ? (
          <>
            {/* Name */}
            <div className="field">
              <label>{t.name}</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="field">
              <label>{t.email}</label>
              <input value={user.email} disabled />
            </div>

            {/* User Type */}
            <div className="field">
              <label>{t.userType}</label>
              <div className="auth-usertype-grid">
                {USER_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type.key}
                    className={`usertype-option ${
                      userType === type.key ? "selected" : ""
                    }`}
                    onClick={() => setUserType(type.key)}
                  >
                    <span className="usertype-option-icon">
                      {type.icon}
                    </span>
                    <span className="usertype-option-label">
                      {userTypeLabels[type.key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hint */}
            <div className="usertype-hint">
              {t.userTypeChangeHint}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={handleSave}
              >
                {t.saveChanges}
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditing(false);
                  setFullName(user.fullName || user.name);
                  setUserType(user.userType);
                }}
              >
                {t.cancel}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <ProfileRow
              label={t.name}
              value={user.fullName || user.name}
            />

            <ProfileRow
              label={t.email}
              value={user.email}
            />

            <ProfileRow
              label={t.accountType}
              value={`${typeInfo.icon} ${
                userTypeLabels[typeInfo.key] || t.other
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: 3,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}