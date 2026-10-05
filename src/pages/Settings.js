import React, { useState } from "react";
import "./Pages.css";

export default function Settings({ onResetData }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="page-body">
      <div className="card section-card" style={{ maxWidth: 520 }}>
        <div className="section-card-head"><h3>Settings</h3></div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>
          FinTrack is a frontend prototype. All your data (transactions, budgets, goals) is stored
          only in this browser's localStorage — nothing is sent to a server.
        </p>

        {!confirming ? (
          <button className="btn btn-danger" onClick={() => setConfirming(true)}>
            Reset All Demo Data
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 13.5, marginBottom: 12 }}>
              This will clear your transactions, budgets, and goals. This can't be undone. Continue?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-danger" onClick={onResetData}>Yes, Reset</button>
              <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
