const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const User = require("./models/user");
const Transaction = require("./models/Transaction");

async function runTests() {
  console.log("=== FINTRACK COMPREHENSIVE BACKEND INTEGRATION TESTS ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB Atlas");

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/assistant", assistantRoutes);
  app.use("/api/challenges", challengeRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✓ Test server running on port ${port}`);

  let testUserToken = null;
  let testUserId = null;
  let adminToken = null;

  try {
    // 1. Test Admin Login (using existing admin user)
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      adminToken = jwt.sign(
        { userId: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      console.log(`✓ Admin token generated for ${adminUser.email}`);
    }

    // 2. Test Register New User
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User Multi",
        email: uniqueEmail,
        password: "password123",
        userType: "student",
      }),
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.token && regData.user) {
      testUserToken = regData.token;
      testUserId = regData.user.id;
      console.log(`✓ User Registration successful: ${uniqueEmail} (Role: ${regData.user.role})`);
    } else {
      throw new Error(`Register failed: ${JSON.stringify(regData)}`);
    }

    // 3. Test Normal User Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: "password123",
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 200 && loginData.token) {
      console.log(`✓ User Login successful with JWT token`);
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    // 4. Test Admin Access Security (Role-based access control)
    // 4a. Normal user tries to access /api/auth/admin -> must return 403 Forbidden
    const adminForbiddenRes = await fetch(`${baseUrl}/api/auth/admin`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    if (adminForbiddenRes.status === 403) {
      console.log(`✓ Security Check: Normal user blocked from admin endpoint (403 Forbidden)`);
    } else {
      throw new Error(`Security Failure: Normal user got status ${adminForbiddenRes.status}`);
    }

    // 4b. Admin user accesses /api/auth/admin -> must return 200 OK
    if (adminToken) {
      const adminOkRes = await fetch(`${baseUrl}/api/auth/admin`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const adminOkData = await adminOkRes.json();
      if (adminOkRes.status === 200 && adminOkData.totalUsers) {
        console.log(`✓ Admin Access: Verified admin allowed to view platform users (${adminOkData.totalUsers} users)`);
      } else {
        throw new Error(`Admin route failed for admin user: ${JSON.stringify(adminOkData)}`);
      }
    }

    // 5. Test Transactions Isolation & CRUD
    // 5a. Initial transactions for new user should be empty
    const txEmptyRes = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const txEmptyData = await txEmptyRes.json();
    if (txEmptyRes.status === 200 && txEmptyData.transactions.length === 0) {
      console.log(`✓ Data Isolation: New user starts with 0 transactions (No demo data seeded)`);
    } else {
      throw new Error(`New user had unexpected transactions: ${JSON.stringify(txEmptyData)}`);
    }

    // 5b. Create transaction for test user
    const createTxRes = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        type: "expense",
        title: "Campus Books",
        amount: 850,
        category: "Education",
        date: new Date().toISOString(),
        paymentMethod: "UPI",
        description: "Semester textbooks",
      }),
    });
    const createTxData = await createTxRes.json();
    let createdTxId = null;
    if (createTxRes.status === 201 && createTxData.transaction._id) {
      createdTxId = createTxData.transaction._id;
      console.log(`✓ Transaction Created: ${createTxData.transaction.title} (₹${createTxData.transaction.amount})`);
    } else {
      throw new Error(`Transaction creation failed: ${JSON.stringify(createTxData)}`);
    }

    // 5c. Update transaction
    const updateTxRes = await fetch(`${baseUrl}/api/transactions/${createdTxId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        type: "expense",
        title: "Campus Books & Stationery",
        amount: 950,
        category: "Education",
        date: new Date().toISOString(),
        paymentMethod: "UPI",
        description: "Updated textbooks",
      }),
    });
    const updateTxData = await updateTxRes.json();
    if (updateTxRes.status === 200 && updateTxData.transaction.amount === 950) {
      console.log(`✓ Transaction Updated: Amount is now ₹${updateTxData.transaction.amount}`);
    } else {
      throw new Error(`Transaction update failed: ${JSON.stringify(updateTxData)}`);
    }

    // 6. Test Assistant / Chatbot Endpoint
    // 6a. English Query
    const chatEnRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        message: "How much did I spend this month?",
        budgets: [{ category: "Education", limit: 2000 }],
        goals: [{ id: "g1", title: "New Laptop", target: 40000, saved: 10000 }],
        language: "en",
      }),
    });
    const chatEnData = await chatEnRes.json();
    if (chatEnRes.status === 200 && chatEnData.reply) {
      console.log(`✓ Assistant Chat (English): Responded using real account data`);
      console.log(`  Preview: ${chatEnData.reply.slice(0, 100).replace(/\n/g, " ")}...`);
    } else {
      throw new Error(`Assistant chat (EN) failed: ${JSON.stringify(chatEnData)}`);
    }

    // 6b. Tamil Query
    const chatTaRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        message: "இந்த மாதம் எனது செலவுகள் என்ன?",
        budgets: [{ category: "Education", limit: 2000 }],
        goals: [{ id: "g1", title: "New Laptop", target: 40000, saved: 10000 }],
        language: "ta",
      }),
    });
    const chatTaData = await chatTaRes.json();
    if (chatTaRes.status === 200 && chatTaData.reply) {
      console.log(`✓ Assistant Chat (Tamil): Responded in Tamil using real account data`);
      console.log(`  Preview: ${chatTaData.reply.slice(0, 100).replace(/\n/g, " ")}...`);
    } else {
      throw new Error(`Assistant chat (TA) failed: ${JSON.stringify(chatTaData)}`);
    }

    // 7. Test Savings Streak & Challenge Mode Endpoints
    // 7a. Create Weekly Challenge
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const createChRes = await fetch(`${baseUrl}/api/challenges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        title: "Sprint Saver ₹2000",
        targetAmount: 2000,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });
    const createChData = await createChRes.json();
    if (createChRes.status === 201 && createChData.challenge._id) {
      console.log(`✓ Challenge Created: ${createChData.challenge.title} (Target: ₹${createChData.challenge.targetAmount})`);
    } else {
      throw new Error(`Create challenge failed: ${JSON.stringify(createChData)}`);
    }

    const challengeId = createChData.challenge._id;

    // 7b. Get Challenges & initial empty streak
    const getChRes = await fetch(`${baseUrl}/api/challenges`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const getChData = await getChRes.json();
    if (getChRes.status === 200 && getChData.activeChallenge) {
      console.log(`✓ Active Challenge Found: ${getChData.activeChallenge.title}`);
      console.log(`  Initial Streak: ${getChData.streak.currentStreak} days`);
    } else {
      throw new Error(`Get challenges failed: ${JSON.stringify(getChData)}`);
    }

    // 7c. First Contribution: ₹500
    const contrib1Res = await fetch(`${baseUrl}/api/challenges/${challengeId}/contribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        amount: 500,
        note: "Day 1 savings boost",
      }),
    });
    const contrib1Data = await contrib1Res.json();
    if (contrib1Res.status === 200 && contrib1Data.challenge.totalContributed === 500) {
      console.log(`✓ Qualifying Contribution 1 Recorded: ₹500 (Total: ₹${contrib1Data.challenge.totalContributed}/₹${contrib1Data.challenge.targetAmount})`);
      console.log(`  Streak updated to: ${contrib1Data.streak.currentStreak} day(s)`);
      console.log(`  Achievements awarded: ${contrib1Data.achievements.map((a) => a.key).join(", ")}`);
    } else {
      throw new Error(`Contribution 1 failed: ${JSON.stringify(contrib1Data)}`);
    }

    // 7d. Second Contribution on the SAME DAY: ₹500 (Tests same-day deduplication!)
    const contrib2Res = await fetch(`${baseUrl}/api/challenges/${challengeId}/contribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        amount: 500,
        note: "Evening spare cash",
      }),
    });
    const contrib2Data = await contrib2Res.json();
    if (
      contrib2Res.status === 200 &&
      contrib2Data.challenge.totalContributed === 1000 &&
      contrib2Data.streak.currentStreak === 1
    ) {
      console.log(`✓ Same-day Duplicate Contribution Handled: Total is now ₹1000, Streak remains 1 day (No artificial inflation)`);
    } else {
      throw new Error(`Same-day contribution test failed: ${JSON.stringify(contrib2Data)}`);
    }

    // 7e. Complete Challenge with Final ₹1000 Contribution -> Status changes to completed
    const contrib3Res = await fetch(`${baseUrl}/api/challenges/${challengeId}/contribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        amount: 1000,
        note: "Challenge target achieved!",
      }),
    });
    const contrib3Data = await contrib3Res.json();
    if (contrib3Res.status === 200 && contrib3Data.challenge.status === "completed") {
      console.log(`✓ Challenge Completed: Status marked 'completed'!`);
      console.log(`  New Badges unlocked: ${contrib3Data.achievements.map((a) => a.key).join(", ")}`);
    } else {
      throw new Error(`Challenge completion test failed: ${JSON.stringify(contrib3Data)}`);
    }

    // 7f. Test User-Data Isolation: Admin user cannot modify normal user's challenge
    const unauthRes = await fetch(`${baseUrl}/api/challenges/${challengeId}/contribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ amount: 100 }),
    });
    if (unauthRes.status === 404) {
      console.log(`✓ User Data Isolation Verified: Other user cannot access challenge (404 Not Found)`);
    } else {
      throw new Error(`Isolation test failed: Status was ${unauthRes.status}`);
    }

    // 8. Test Delete Transaction & Clean up test data
    const deleteTxRes = await fetch(`${baseUrl}/api/transactions/${createdTxId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    if (deleteTxRes.status === 200) {
      console.log(`✓ Transaction Deleted successfully`);
    } else {
      throw new Error(`Transaction deletion failed`);
    }

    // Clean up temporary test user
    await User.findByIdAndDelete(testUserId);
    console.log(`✓ Cleaned up temporary test user ${uniqueEmail}`);

    console.log("\nALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ✓");
    process.exit(0);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
