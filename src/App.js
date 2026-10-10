import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { storage } from "./utils/storage";
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
import FinBot from "./components/FinBot";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import {
  addRecentlyAccessed,
  getRecentlyAccessed,
} from "./utils/recentlyAccessed";
import translations from "./utils/translations";

export default function App() {
  const [user, setUser] = useState(() => storage.getSession());
  const [authView, setAuthView] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [language, setLanguage] = useState(
    () => localStorage.getItem("fintrack_language") || "en"
  );
  const t = translations[language] || translations.en;

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recentlyAccessed, setRecentlyAccessed] = useState([]);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txEditing, setTxEditing] = useState(null);

  // Language change handler that updates state and preserves preference without reload or logout
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem("fintrack_language", newLang);
  };

  // Load data whenever a user session becomes active.
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        // Load transactions from MongoDB
        const token = localStorage.getItem("fintrack_token");

        if (token) {
          const transactionResponse = await fetch(
            "http://localhost:5000/api/transactions",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const transactionData = await transactionResponse.json();

          if (!transactionResponse.ok) {
            throw new Error(
              transactionData.message || "Unable to load transactions"
            );
          }

          setTransactions(transactionData.transactions || []);
        } else {
          setTransactions([]);
        }

        // Load user-isolated Budgets and Goals
        setBudgets(storage.getBudgets(user));
        setGoals(storage.getGoals(user));
      } catch (error) {
        console.error("Error loading financial data:", error);
        setBudgets(storage.getBudgets(user));
        setGoals(storage.getGoals(user));
      }
    };

    loadUserData();
  }, [user]);

  // ---- Recently Accessed ----
  useEffect(() => {
    if (!user || !page) return;

    addRecentlyAccessed(user, page);
    setRecentlyAccessed(getRecentlyAccessed(user));
  }, [user, page]);

  const persistTransactions = (list) => {
    setTransactions(list);
  };

  const persistBudgets = (list) => {
    setBudgets(list);
    storage.saveBudgets(list, user);
  };

  const persistGoals = (list) => {
    setGoals(list);
    storage.saveGoals(list, user);
  };

  // ---- Derived data (recomputed automatically with language & user metrics) ----
  const summary = useMemo(() => computeSummary(transactions), [transactions]);
  const breakdown = useMemo(
    () => computeCategoryBreakdown(transactions),
    [transactions]
  );
  const trend = useMemo(
    () => computeMonthlyTrend(transactions),
    [transactions]
  );
  const budgetStatus = useMemo(
    () => computeBudgetStatus(transactions, budgets),
    [transactions, budgets]
  );
  const goalsSummary = useMemo(() => computeGoalsSummary(goals), [goals]);

  const health = useMemo(
    () => computeHealthScore({ summary, budgetStatus, goalsSummary, language }),
    [summary, budgetStatus, goalsSummary, language]
  );

  const insights = useMemo(
    () =>
      generateInsights({
        user,
        transactions,
        budgets,
        goals,
        summary,
        breakdown,
        trend,
        language,
      }),
    [user, transactions, budgets, goals, summary, breakdown, trend, language]
  );

  const improvementTips = useMemo(
    () =>
      generateImprovementTips({
        user,
        summary,
        breakdown,
        budgetStatus,
        goals,
        language,
      }),
    [user, summary, breakdown, budgetStatus, goals, language]
  );

  const notifications = useMemo(
    () =>
      generateNotifications({
        budgetStatus,
        goals,
        summary,
        language,
      }),
    [budgetStatus, goals, summary, language]
  );

  // ---- Auth handlers ----
  const handleLoggedIn = (u) => {
    const updatedUser = {
      id: u.id || u._id,
      _id: u.id || u._id,
      name: u.name,
      fullName: u.name,
      email: u.email,
      userType: u.userType,
      role: u.role || "user",
    };
    storage.setSession(updatedUser);
    setUser(updatedUser);
    setPage(updatedUser.role === "admin" ? "admin" : "dashboard");
  };

  const handleSignedUp = (u) => {
    handleLoggedIn(u);
  };

  const handleLogout = () => {
    storage.clearSession();
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setAuthView("login");
  };

  // ---- Transaction handlers ----
  const openAddTx = () => {
    setTxEditing(null);
    setTxModalOpen(true);
  };

  const openEditTx = (t) => {
    setTxEditing(t);
    setTxModalOpen(true);
  };

  const saveTx = async (tx) => {
    try {
      const token = localStorage.getItem("fintrack_token");
      const isEditing = Boolean(tx._id);

      const url = isEditing
        ? `http://localhost:5000/api/transactions/${tx._id}`
        : "http://localhost:5000/api/transactions";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: tx.type,
          title: tx.title,
          amount: Number(tx.amount),
          category: tx.category,
          date: tx.date,
          paymentMethod: tx.paymentMethod,
          description: tx.description || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save transaction");
      }

      if (isEditing) {
        setTransactions((current) =>
          current.map((transaction) =>
            transaction._id === data.transaction._id
              ? data.transaction
              : transaction
          )
        );
      } else {
        setTransactions((current) => [data.transaction, ...current]);
      }

      setTxModalOpen(false);
      setTxEditing(null);
    } catch (error) {
      console.error("Save transaction error:", error);
      alert(error.message);
    }
  };

  const deleteTx = async (id) => {
    try {
      const token = localStorage.getItem("fintrack_token");

      const response = await fetch(
        `http://localhost:5000/api/transactions/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete transaction");
      }

      setTransactions((current) =>
        current.filter((transaction) => transaction._id !== id && transaction.id !== id)
      );
    } catch (error) {
      console.error("Delete transaction error:", error);
      alert(error.message);
    }
  };

  // ---- Budget handlers ----
  const saveBudget = (data) => {
    const exists = budgets.some((b) => b.category === data.category);
    const updated = exists
      ? budgets.map((b) => (b.category === data.category ? data : b))
      : [...budgets, data];
    persistBudgets(updated);
  };

  const deleteBudget = (category) =>
    persistBudgets(budgets.filter((b) => b.category !== category));

  // ---- Goal handlers ----
  const saveGoal = (goal) => {
    const exists = goals.some((g) => g.id === goal.id);
    const updated = exists
      ? goals.map((g) => (g.id === goal.id ? goal : g))
      : [...goals, goal];
    persistGoals(updated);
  };

  const deleteGoal = (id) =>
    persistGoals(goals.filter((g) => g.id !== id));

  const addMoneyToGoal = (id, amount) => {
    persistGoals(
      goals.map((g) =>
        g.id === id ? { ...g, saved: g.saved + amount } : g
      )
    );
  };

  // ---- Profile handler ----
  const saveProfile = (updated) => {
    const updatedUser = {
      ...user,
      fullName: updated.fullName,
      name: updated.fullName,
      userType: updated.userType,
    };
    storage.setSession(updatedUser);
    setUser(updatedUser);
  };

  // Reset user data without injecting fake/sample data
  const resetData = () => {
    persistTransactions([]);
    persistBudgets([]);
    persistGoals([]);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setPage("dashboard");
  };

  // ---- Unauthenticated views ----
  if (!user) {
    return authView === "login" ? (
      <Login
        onLoggedIn={handleLoggedIn}
        onGoToSignUp={() => setAuthView("signup")}
      />
    ) : (
      <SignUp
        onSignedUp={handleSignedUp}
        onGoToLogin={() => setAuthView("login")}
      />
    );
  }

  const pageTitles = {
    dashboard: t.dashboard,
    transactions: t.transactions,
    budget: t.budget,
    savings: t.savings,
    insights: t.insights,
    assistant: t.financialAssistant,
    profile: t.profile,
    settings: t.settings,
    admin: t.adminDashboard,
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
        language={language}
      />

      <main className="app-main">
        <Header
          user={user}
          title={page === "dashboard" ? null : pageTitles[page]}
          notifications={notifications}
          onAddTransaction={
            ["dashboard", "transactions"].includes(page) ? openAddTx : null
          }
          onMenuClick={() => setMobileNavOpen(true)}
          language={language}
          onLanguageChange={handleLanguageChange}
        />

        {page === "dashboard" && (
          <Dashboard
            summary={summary}
            breakdown={breakdown}
            trend={trend}
            budgetStatus={budgetStatus}
            insights={insights}
            recentTransactions={[...transactions].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            )}
            recentlyAccessed={recentlyAccessed}
            language={language}
          />
        )}

        {page === "admin" && user.role === "admin" && (
          <AdminDashboard language={language} />
        )}

        {page === "transactions" && (
          <Transactions
            transactions={transactions}
            onEdit={openEditTx}
            onDelete={deleteTx}
            onAdd={openAddTx}
            language={language}
          />
        )}

        {page === "budget" && (
          <Budget
            budgetStatus={budgetStatus}
            budgets={budgets}
            onSave={saveBudget}
            onDelete={deleteBudget}
            language={language}
          />
        )}

        {page === "savings" && (
          <Savings
            summary={summary}
            goalsSummary={goalsSummary}
            onAddMoney={addMoneyToGoal}
            onSaveGoal={saveGoal}
            onDeleteGoal={deleteGoal}
            language={language}
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
            language={language}
          />
        )}

        {page === "profile" && (
          <Profile
            user={user}
            onSave={saveProfile}
            language={language}
          />
        )}

        {page === "settings" && (
          <Settings
            onResetData={resetData}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        )}
      </main>

      {txModalOpen && (
        <TransactionModal
          initial={txEditing}
          onClose={() => setTxModalOpen(false)}
          onSave={saveTx}
          language={language}
        />
      )}

      {/* FLOATING FINBOT CHATBOT (Visible across all authenticated pages) */}
      <FinBot
        user={user}
        transactions={transactions}
        budgets={budgets}
        goals={goals}
        language={language}
      />
    </div>
  );
}
