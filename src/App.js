import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { storage } from "./utils/storage";
import { seedIfNeeded } from "./utils/sampleData";
import {
  computeSummary,
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeBudgetStatus,
  computeGoalsSummary,
  computeHealthScore,
  generateInsights,
  generateImprovementTips,
  generateNotifications,
} from "./utils/calculations";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import TransactionModal from "./components/TransactionModal";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budget from "./pages/Budget";
import Savings from "./pages/Savings";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

export default function App() {
  const [user, setUser] = useState(() => storage.getSession());
  const [authView, setAuthView] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txEditing, setTxEditing] = useState(null);

  // Load data whenever a user session becomes active.
  useEffect(() => {
    if (!user) return;
    seedIfNeeded(user.userType);
    setTransactions(storage.getTransactions());
    setBudgets(storage.getBudgets());
    setGoals(storage.getGoals());
  }, [user]);

  const persistTransactions = (list) => {
    setTransactions(list);
    storage.saveTransactions(list);
  };
  const persistBudgets = (list) => {
    setBudgets(list);
    storage.saveBudgets(list);
  };
  const persistGoals = (list) => {
    setGoals(list);
    storage.saveGoals(list);
  };

  // ---- Derived data (recomputed automatically whenever the underlying data changes) ----
  const summary = useMemo(() => computeSummary(transactions), [transactions]);
  const breakdown = useMemo(() => computeCategoryBreakdown(transactions), [transactions]);
  const trend = useMemo(() => computeMonthlyTrend(transactions), [transactions]);
  const budgetStatus = useMemo(() => computeBudgetStatus(transactions, budgets), [transactions, budgets]);
  const goalsSummary = useMemo(() => computeGoalsSummary(goals), [goals]);
  const health = useMemo(
    () => computeHealthScore({ summary, budgetStatus, goalsSummary }),
    [summary, budgetStatus, goalsSummary]
  );
  const insights = useMemo(
    () => generateInsights({ user, transactions, budgets, goals, summary, breakdown }),
    [user, transactions, budgets, goals, summary, breakdown]
  );
  const improvementTips = useMemo(
    () => generateImprovementTips({ user, summary, breakdown, budgetStatus, goals }),
    [user, summary, breakdown, budgetStatus, goals]
  );
  const notifications = useMemo(
    () => generateNotifications({ budgetStatus, goals, summary }),
    [budgetStatus, goals, summary]
  );

  // ---- Auth handlers ----
  const handleLoggedIn = (u) => {
    setUser({ fullName: u.fullName, email: u.email, userType: u.userType });
    setPage("dashboard");
  };
  const handleSignedUp = (u) => {
    setUser({ fullName: u.fullName, email: u.email, userType: u.userType });
    setPage("dashboard");
  };
  const handleLogout = () => {
    storage.clearSession();
    setUser(null);
    setAuthView("login");
  };

  // ---- Transaction handlers ----
  const openAddTx = () => { setTxEditing(null); setTxModalOpen(true); };
  const openEditTx = (t) => { setTxEditing(t); setTxModalOpen(true); };
  const saveTx = (tx) => {
    const exists = transactions.some((t) => t.id === tx.id);
    const updated = exists ? transactions.map((t) => (t.id === tx.id ? tx : t)) : [tx, ...transactions];
    persistTransactions(updated);
    setTxModalOpen(false);
  };
  const deleteTx = (id) => persistTransactions(transactions.filter((t) => t.id !== id));

  // ---- Budget handlers ----
  const saveBudget = (data) => {
    const exists = budgets.some((b) => b.category === data.category);
    const updated = exists
      ? budgets.map((b) => (b.category === data.category ? data : b))
      : [...budgets, data];
    persistBudgets(updated);
  };
  const deleteBudget = (category) => persistBudgets(budgets.filter((b) => b.category !== category));

  // ---- Goal handlers ----
  const saveGoal = (goal) => {
    const exists = goals.some((g) => g.id === goal.id);
    const updated = exists ? goals.map((g) => (g.id === goal.id ? goal : g)) : [...goals, goal];
    persistGoals(updated);
  };
  const deleteGoal = (id) => persistGoals(goals.filter((g) => g.id !== id));
  const addMoneyToGoal = (id, amount) => {
    persistGoals(goals.map((g) => (g.id === id ? { ...g, saved: g.saved + amount } : g)));
  };

  // ---- Profile handler ----
  const saveProfile = (updated) => {
    const users = storage.getUsers().map((u) =>
      u.email === updated.email ? { ...u, fullName: updated.fullName, userType: updated.userType } : u
    );
    storage.saveUsers(users);
    storage.setSession({ fullName: updated.fullName, email: updated.email, userType: updated.userType });
    setUser({ fullName: updated.fullName, email: updated.email, userType: updated.userType });
  };

  const resetData = () => {
    persistTransactions([]);
    persistBudgets([]);
    persistGoals([]);
    localStorage.removeItem(storage.KEYS.SEEDED);
    seedIfNeeded(user.userType);
    setTransactions(storage.getTransactions());
    setBudgets(storage.getBudgets());
    setGoals(storage.getGoals());
    setPage("dashboard");
  };

  // ---- Unauthenticated views ----
  if (!user) {
    return authView === "login" ? (
      <Login onLoggedIn={handleLoggedIn} onGoToSignUp={() => setAuthView("signup")} />
    ) : (
      <SignUp onSignedUp={handleSignedUp} onGoToLogin={() => setAuthView("login")} />
    );
  }

  const pageTitles = {
    transactions: "Transactions",
    budget: "Budget",
    savings: "Savings & Goals",
    insights: "Financial Insights",
    profile: "Profile",
    settings: "Settings",
  };

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onNavigate={setPage}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <main className="app-main">
        <Header
          user={user}
          title={page === "dashboard" ? null : pageTitles[page]}
          notifications={notifications}
          onAddTransaction={["dashboard", "transactions"].includes(page) ? openAddTx : null}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        {page === "dashboard" && (
          <Dashboard
            summary={summary}
            breakdown={breakdown}
            trend={trend}
            budgetStatus={budgetStatus}
            insights={insights}
            recentTransactions={[...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))}
          />
        )}

        {page === "transactions" && (
          <Transactions transactions={transactions} onEdit={openEditTx} onDelete={deleteTx} onAdd={openAddTx} />
        )}

        {page === "budget" && (
          <Budget budgetStatus={budgetStatus} budgets={budgets} onSave={saveBudget} onDelete={deleteBudget} />
        )}

        {page === "savings" && (
          <Savings
            summary={summary}
            goalsSummary={goalsSummary}
            onAddMoney={addMoneyToGoal}
            onSaveGoal={saveGoal}
            onDeleteGoal={deleteGoal}
          />
        )}

        {page === "insights" && (
          <Insights
            summary={summary}
            breakdown={breakdown}
            budgetStatus={budgetStatus}
            goalsSummary={goalsSummary}
            health={health}
            insights={insights}
            improvementTips={improvementTips}
            trend={trend}
          />
        )}

        {page === "profile" && <Profile user={user} onSave={saveProfile} />}

        {page === "settings" && <Settings onResetData={resetData} />}
      </main>

      {txModalOpen && (
        <TransactionModal initial={txEditing} onClose={() => setTxModalOpen(false)} onSave={saveTx} />
      )}
    </div>
  );
}
