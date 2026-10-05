import React, { useState } from "react";
import Modal from "./Modal";

export default function GoalModal({ initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [target, setTarget] = useState(initial?.target || "");
  const [saved, setSaved] = useState(initial?.saved || 0);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Please name your goal.");
    if (!target || Number(target) <= 0) return setError("Please enter a target amount.");

    onSave({
      id: initial?.id || `g${Date.now()}`,
      title: title.trim(),
      target: Number(target),
      saved: Number(saved) || 0,
    });
  };

  return (
    <Modal title={initial ? "Edit Goal" : "Add Savings Goal"} onClose={onClose} width={420}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Goal Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New Laptop" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Target Amount (₹)</label>
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
          </div>
          <div className="field">
            <label>Already Saved (₹)</label>
            <input type="number" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" />
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block">
          {initial ? "Save Changes" : "Create Goal"}
        </button>
      </form>
    </Modal>
  );
}
