// Category constants and helper utilities for FinTrack.
// Automatic seeding of demo transactions, budgets, and goals has been removed
// to preserve genuine user financial records and show appropriate empty states.

const EXPENSE_CATEGORIES = [
  "Food",
  "Rent",
  "Travel",
  "Education",
  "Shopping",
  "Bills",
  "Healthcare",
  "Entertainment",
  "Recharge",
  "EMI",
  "Subscription",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Interest",
  "Gift",
  "Allowance",
  "Other",
];

export { EXPENSE_CATEGORIES, INCOME_CATEGORIES };

// Safe no-op function to maintain import compatibility without seeding any demo records.
export function seedIfNeeded() {
  // Automatic sample-data seeding disabled to ensure pure user data isolation.
  return;
}
