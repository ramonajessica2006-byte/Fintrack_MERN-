import React, { useState } from "react";
import Modal from "./Modal";
import translations from "../utils/translations";

export default function GoalModal({ initial, onClose, onSave, language = "en" }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [target, setTarget] = useState(initial?.target || "");
  const [saved, setSaved] = useState(initial?.saved || 0);
  const [error, setError] = useState("");

  const t = translations[language] || translations.en;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError(t.pleaseNameGoal);
    if (!target || Number(target) <= 0) return setError(t.pleaseEnterTarget);

    onSave({
      id: initial?.id || `g${Date.now()}`,
      title: title.trim(),
      target: Number(target),
      saved: Number(saved) || 0,
    });
  };

  return (
    <Modal title={initial ? t.editGoal : t.createGoal} onClose={onClose} width={420}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t.goalName}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.goalNamePlaceholder}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t.targetAmount}</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label>{t.alreadySaved}</label>
            <input
              type="number"
              value={saved}
              onChange={(e) => setSaved(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block">
          {initial ? t.saveChanges : t.createGoal}
        </button>
      </form>
    </Modal>
  );
}
