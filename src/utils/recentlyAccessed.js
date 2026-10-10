const MAX_RECENT_ITEMS = 6;

const getKey = (user) => {
  const id = user?.id || user?._id || user?.email;
  return `fintrack_recently_accessed_${id}`;
};

export const getRecentlyAccessed = (user) => {
  if (!user) return [];

  try {
    return JSON.parse(
      localStorage.getItem(getKey(user)) || "[]"
    );
  } catch {
    return [];
  }
};

export const addRecentlyAccessed = (user, page) => {
  if (!user || !page) return;

  const pageNames = {
    dashboard: "Dashboard",
    transactions: "Transactions",
    budget: "Budget",
    savings: "Savings & Goals",
    insights: "Financial Insights",
    assistant: "Financial Assistant",
    profile: "Profile",
    settings: "Settings",
    admin: "Admin Dashboard",
  };

  const item = {
    page,
    name: pageNames[page] || page,
    accessedAt: new Date().toISOString(),
  };

  const current = getRecentlyAccessed(user);

  const updated = [
    item,
    ...current.filter((entry) => entry.page !== page),
  ].slice(0, MAX_RECENT_ITEMS);

  localStorage.setItem(
    getKey(user),
    JSON.stringify(updated)
  );
};

export const clearRecentlyAccessed = (user) => {
  if (!user) return;
  localStorage.removeItem(getKey(user));
};