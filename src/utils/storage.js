// Centralized localStorage helpers for FinTrack.
// Financial data is stored separately for each logged-in user.

const KEYS = {
  USERS: "fintrack_users",
  SESSION: "fintrack_session",

  // Base names for user-specific financial data
  TRANSACTIONS: "fintrack_transactions",
  BUDGETS: "fintrack_budgets",
  GOALS: "fintrack_goals",

  SEEDED: "fintrack_seeded",
  CURRENT_USER: "fintrack_user",
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

/*
  Get the currently logged-in user.

  Login.js already stores the backend user here:
  fintrack_user
*/
function getCurrentUser() {
  const user = read(KEYS.CURRENT_USER, null);

  if (user) {
    return user;
  }

  // Fallback for older sessions
  return read(KEYS.SESSION, null);
}

/*
  Create a unique identifier for the current user.

  Prefer MongoDB user ID.
  Fall back to email if necessary.
*/
function getUserIdentifier() {
  const user = getCurrentUser();

  if (!user) {
    return "guest";
  }

  return (
    user.id ||
    user._id ||
    user.email ||
    "guest"
  );
}

/*
  Generate a user-specific storage key.
*/
function userKey(baseKey) {
  const userId = getUserIdentifier();

  return `${baseKey}_${userId}`;
}

export const storage = {
  KEYS,

  // =========================================
  // ACCOUNTS
  // =========================================

  getUsers: () => read(KEYS.USERS, []),

  saveUsers: (users) =>
    write(KEYS.USERS, users),

  getSession: () =>
    read(KEYS.SESSION, null),

  setSession: (user) =>
    write(KEYS.SESSION, user),

  clearSession: () =>
    localStorage.removeItem(KEYS.SESSION),

  // =========================================
  // CURRENT USER
  // =========================================

  getCurrentUser: () =>
    getCurrentUser(),

  getUserIdentifier: () =>
    getUserIdentifier(),

  // =========================================
  // TRANSACTIONS
  // =========================================

  getTransactions: () =>
    read(
      userKey(KEYS.TRANSACTIONS),
      []
    ),

  saveTransactions: (list) =>
    write(
      userKey(KEYS.TRANSACTIONS),
      list
    ),

  // =========================================
  // BUDGETS
  // =========================================

  getBudgets: () =>
    read(
      userKey(KEYS.BUDGETS),
      []
    ),

  saveBudgets: (list) =>
    write(
      userKey(KEYS.BUDGETS),
      list
    ),

  // =========================================
  // GOALS
  // =========================================

  getGoals: () =>
    read(
      userKey(KEYS.GOALS),
      []
    ),

  saveGoals: (list) =>
    write(
      userKey(KEYS.GOALS),
      list
    ),

  // =========================================
  // SEED FLAG
  // =========================================

  isSeeded: () =>
    read(
      userKey(KEYS.SEEDED),
      false
    ),

  setSeeded: () =>
    write(
      userKey(KEYS.SEEDED),
      true
    ),
};