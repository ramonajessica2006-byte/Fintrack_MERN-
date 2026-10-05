// Generates realistic starter data so the app isn't empty on first login.
// Runs once per browser (guarded by storage.isSeeded) and only if no
// transactions exist yet, so it never overwrites real data.

import { storage } from "./storage";

function iso(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

let uid = 1;
const nextId = () => `t${Date.now()}${uid++}`;

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

function studentSeed() {
  const transactions = [
    { id: nextId(), type: "income", title: "Monthly Allowance", amount: 12000, category: "Allowance", date: iso(27), paymentMethod: "Bank Transfer", description: "From parents" },
    { id: nextId(), type: "income", title: "Freelance Design Gig", amount: 3000, category: "Freelance", date: iso(14), paymentMethod: "UPI", description: "Logo design for a friend's shop" },
    { id: nextId(), type: "expense", title: "Hostel Mess Top-up", amount: 1800, category: "Food", date: iso(25), paymentMethod: "UPI", description: "" },
    { id: nextId(), type: "expense", title: "Canteen & Outside Food", amount: 3200, category: "Food", date: iso(18), paymentMethod: "UPI", description: "Eating out with friends" },
    { id: nextId(), type: "expense", title: "Weekend Cafe", amount: 950, category: "Food", date: iso(6), paymentMethod: "Cash", description: "" },
    { id: nextId(), type: "expense", title: "Bus Pass", amount: 600, category: "Travel", date: iso(24), paymentMethod: "Cash", description: "" },
    { id: nextId(), type: "expense", title: "Weekend Trip Share", amount: 1400, category: "Travel", date: iso(10), paymentMethod: "UPI", description: "" },
    { id: nextId(), type: "expense", title: "Course Notes & Printouts", amount: 700, category: "Education", date: iso(20), paymentMethod: "Cash", description: "" },
    { id: nextId(), type: "expense", title: "Online Course", amount: 1200, category: "Education", date: iso(9), paymentMethod: "Debit Card", description: "" },
    { id: nextId(), type: "expense", title: "New Earphones", amount: 1100, category: "Shopping", date: iso(16), paymentMethod: "UPI", description: "" },
    { id: nextId(), type: "expense", title: "Mobile Recharge", amount: 399, category: "Recharge", date: iso(5), paymentMethod: "UPI", description: "" },
    { id: nextId(), type: "expense", title: "Movie Night", amount: 650, category: "Entertainment", date: iso(12), paymentMethod: "UPI", description: "" },
    { id: nextId(), type: "expense", title: "Spotify Subscription", amount: 119, category: "Subscription", date: iso(3), paymentMethod: "Debit Card", description: "" },
  ];

  const budgets = [
    { category: "Food", limit: 4500 },
    { category: "Travel", limit: 2000 },
    { category: "Education", limit: 2000 },
    { category: "Shopping", limit: 1500 },
    { category: "Entertainment", limit: 1000 },
  ];

  const goals = [
    { id: "g1", title: "New Laptop", target: 60000, saved: 23100 },
    { id: "g2", title: "Emergency Fund", target: 15000, saved: 6000 },
  ];

  return { transactions, budgets, goals };
}

function adultSeed() {
  const transactions = [
    { id: nextId(), type: "income", title: "Monthly Salary", amount: 65000, category: "Salary", date: iso(28), paymentMethod: "Bank Transfer", description: "" },
    { id: nextId(), type: "income", title: "Freelance Project", amount: 8000, category: "Freelance", date: iso(11), paymentMethod: "Bank Transfer", description: "" },
    { id: nextId(), type: "expense", title: "House Rent", amount: 18000, category: "Rent", date: iso(27), paymentMethod: "Bank Transfer", description: "" },
    { id: nextId(), type: "expense", title: "Car EMI", amount: 9500, category: "EMI", date: iso(26), paymentMethod: "Bank Transfer", description: "" },
    { id: nextId(), type: "expense", title: "Groceries", amount: 4200, category: "Food", date: iso(20), paymentMethod: "Credit Card", description: "" },
    { id: nextId(), type: "expense", title: "Dining Out", amount: 2600, category: "Food", date: iso(8), paymentMethod: "Credit Card", description: "" },
    { id: nextId(), type: "expense", title: "Electricity & Water", amount: 2200, category: "Bills", date: iso(22), paymentMethod: "UPI", description: "" },
    { id: nextId(), type: "expense", title: "Internet & Mobile", amount: 1400, category: "Bills", date: iso(19), paymentMethod: "UPI", description: "" },
    { id: nextId(), type: "expense", title: "Fuel", amount: 3200, category: "Travel", date: iso(15), paymentMethod: "Debit Card", description: "" },
    { id: nextId(), type: "expense", title: "Health Insurance Premium", amount: 2800, category: "Healthcare", date: iso(17), paymentMethod: "Bank Transfer", description: "" },
    { id: nextId(), type: "expense", title: "Weekend Shopping", amount: 3600, category: "Shopping", date: iso(9), paymentMethod: "Credit Card", description: "" },
    { id: nextId(), type: "expense", title: "Streaming Subscriptions", amount: 899, category: "Subscription", date: iso(4), paymentMethod: "Credit Card", description: "" },
    { id: nextId(), type: "expense", title: "Movie & Dinner", amount: 1800, category: "Entertainment", date: iso(6), paymentMethod: "UPI", description: "" },
  ];

  const budgets = [
    { category: "Food", limit: 8000 },
    { category: "Bills", limit: 4000 },
    { category: "Travel", limit: 4000 },
    { category: "Shopping", limit: 4000 },
    { category: "Entertainment", limit: 2500 },
  ];

  const goals = [
    { id: "g1", title: "Emergency Fund", target: 200000, saved: 78000 },
    { id: "g2", title: "Vacation Fund", target: 50000, saved: 21000 },
  ];

  return { transactions, budgets, goals };
}

export function seedIfNeeded(userType) {
  if (storage.getTransactions().length > 0) return;
  const seed = userType === "student" ? studentSeed() : adultSeed();
  storage.saveTransactions(seed.transactions);
  storage.saveBudgets(seed.budgets);
  storage.saveGoals(seed.goals);
  storage.setSeeded();
}
