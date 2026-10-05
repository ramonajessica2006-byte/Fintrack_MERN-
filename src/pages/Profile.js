import React, { useState } from "react";
import "./Pages.css";

const USER_TYPES = [
  { key: "student", icon: "🎓", label: "Student" },
  { key: "adult", icon: "💼", label: "Working Adult" },
  { key: "other", icon: "👤", label: "Other" },
];

export default function Profile({ user, onSave }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [userType, setUserType] = useState(user.userType);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ ...user, fullName, userType });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const typeInfo = USER_TYPES.find((t) => t.key === user.userType) || USER_TYPES[2];

  return (
    <div className="page-body">
      <div className="card section-card" style={{ maxWidth: 520 }}>
        <div className="section-card-head">
          <h3>Profile</h3>
          {!editing && (
            <button className="link-btn" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        {saved && <div className="auth-form-success">Profile updated.</div>}

        {editing ? (
          <>
            <div className="field">
              <label>Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={user.email} disabled />
            </div>
            <div className="field">
              <label>User Type</label>
              <div className="auth-usertype-grid">
                {USER_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    className={`usertype-option ${userType === t.key ? "selected" : ""}`}
                    onClick={() => setUserType(t.key)}
                  >
                    <span className="usertype-option-icon">{t.icon}</span>
                    <span className="usertype-option-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="usertype-hint">
              Changing your user type will change how the Financial Assistant interprets your data.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              <button className="btn btn-ghost" onClick={() => { setEditing(false); setFullName(user.fullName); setUserType(user.userType); }}>Cancel</button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ProfileRow label="Name" value={user.fullName} />
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Account Type" value={`${typeInfo.icon} ${typeInfo.label}`} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
