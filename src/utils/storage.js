// Centralized localStorage helpers for the FinTrack prototype.
// Everything is namespaced under "fintrack_" so it never collides with
// other data the browser might hold.

const KEYS = {
  USERS: "fintrack_users",
  SESSION: "fintrack_session",
  TRANSACTIONS: "fintrack_transactions",
  BUDGETS: "fintrack_budgets",
  GOALS: "fintrack_goals",
  SEEDED: "fintrack_seeded",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  KEYS,

  // ---- Accounts (very simple, frontend-only "auth") ----
  getUsers: () => read(KEYS.USERS, []),
  saveUsers: (users) => write(KEYS.USERS, users),

  getSession: () => read(KEYS.SESSION, null),
  setSession: (user) => write(KEYS.SESSION, user),
  clearSession: () => localStorage.removeItem(KEYS.SESSION),

  // ---- Transactions ----
  getTransactions: () => read(KEYS.TRANSACTIONS, []),
  saveTransactions: (list) => write(KEYS.TRANSACTIONS, list),

  // ---- Budgets ----
  getBudgets: () => read(KEYS.BUDGETS, []),
  saveBudgets: (list) => write(KEYS.BUDGETS, list),

  // ---- Goals ----
  getGoals: () => read(KEYS.GOALS, []),
  saveGoals: (list) => write(KEYS.GOALS, list),

  // ---- Seed flag ----
  isSeeded: () => read(KEYS.SEEDED, false),
  setSeeded: () => write(KEYS.SEEDED, true),
};
