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
  TOKEN: "fintrack_token",
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
*/
function getCurrentUser() {
  const user = read(KEYS.CURRENT_USER, null);

  if (user) {
    return user;
  }

  return read(KEYS.SESSION, null);
}

/*
  Create a unique identifier for the user.
  Prefers MongoDB user ID, then email, falling back to 'guest'.
*/
function getUserIdentifier(explicitUser) {
  const user = explicitUser || getCurrentUser();

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
  Generate a strictly user-specific storage key.
*/
function userKey(baseKey, user) {
  const userId = getUserIdentifier(user);
  return `${baseKey}_${userId}`;
}

export const storage = {
  KEYS,

  // =========================================
  // ACCOUNTS & SESSION
  // =========================================

  getUsers: () => read(KEYS.USERS, []),

  saveUsers: (users) => write(KEYS.USERS, users),

  getSession: () => getCurrentUser(),

  setSession: (user) => {
    write(KEYS.SESSION, user);
    write(KEYS.CURRENT_USER, user);
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.SESSION);
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.TOKEN);
  },

  getCurrentUser: () => getCurrentUser(),

  getUserIdentifier: (user) => getUserIdentifier(user),

  // =========================================
  // USER-SPECIFIC TRANSACTIONS (Offline/Local Cache)
  // =========================================

  getTransactions: (user) => read(userKey(KEYS.TRANSACTIONS, user), []),

  saveTransactions: (list, user) => write(userKey(KEYS.TRANSACTIONS, user), list),

  // =========================================
  // USER-SPECIFIC BUDGETS
  // =========================================

  getBudgets: (user) => read(userKey(KEYS.BUDGETS, user), []),

  saveBudgets: (list, user) => write(userKey(KEYS.BUDGETS, user), list),

  // =========================================
  // USER-SPECIFIC GOALS
  // =========================================

  getGoals: (user) => read(userKey(KEYS.GOALS, user), []),

  saveGoals: (list, user) => write(userKey(KEYS.GOALS, user), list),

  // =========================================
  // SEED FLAG
  // =========================================

  isSeeded: (user) => read(userKey(KEYS.SEEDED, user), false),

  setSeeded: (user) => write(userKey(KEYS.SEEDED, user), true),
};