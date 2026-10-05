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
import AdminDashboard from "./pages/AdminDashboard";

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

  const loadUserData = async () => {
    try {
      // Load transactions from MongoDB
      const token = localStorage.getItem("fintrack_token");

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
          transactionData.message ||
            "Unable to load transactions"
        );
      }

      setTransactions(transactionData.transactions || []);

      // Budget and Goals still use the existing local storage
      setBudgets(storage.getBudgets());
      setGoals(storage.getGoals());
    } catch (error) {
      console.error("Error loading financial data:", error);

      // Keep budget and goals working
      setBudgets(storage.getBudgets());
      setGoals(storage.getGoals());
    }
  };

  loadUserData();
}, [user]);

const persistTransactions = (list) => {
  setTransactions(list);
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
  setUser({
    id: u.id,
    name: u.name,
    fullName: u.name,
    email: u.email,
    userType: u.userType,
    role: u.role,
  });

  setPage(u.role === "admin" ? "admin" : "dashboard");
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
 const openAddTx = () => {
  console.log("Add Transaction clicked");
  setTxEditing(null);
  setTxModalOpen(true);
};
  const openEditTx = (t) => { setTxEditing(t); setTxModalOpen(true); };
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
      throw new Error(
        data.message || "Unable to save transaction"
      );
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
      setTransactions((current) => [
        data.transaction,
        ...current,
      ]);
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
      throw new Error(
        data.message || "Unable to delete transaction"
      );
    }

    setTransactions((current) =>
      current.filter(
        (transaction) => transaction._id !== id
      )
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
        {page === "admin" && user.role === "admin" && (
  <AdminDashboard />
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
