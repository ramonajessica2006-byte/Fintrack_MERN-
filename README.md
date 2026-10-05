# FinTrack – Personal Finance Assistant

A frontend-only React prototype (no backend) built for a college project
review. All data lives in your browser's localStorage.

## Run it

```bash
cd fintrack
npm install
npm start
```

This opens the app at http://localhost:3000.

To create a production build (e.g. to deploy or zip for submission):

```bash
npm run build
```

## First run

1. You'll land on the **Sign Up** page. Create an account and pick either
   🎓 **Student** or 💼 **Working Adult** — this choice drives the
   personalization engine.
2. On first login, demo transactions/budgets/goals are seeded automatically
   (different sample data for students vs. adults) so the dashboard isn't
   empty. You can edit or delete anything, or reset it from **Settings**.
3. Everything — Dashboard, Transactions, Budget, Savings, Insights — reads
   from the same shared calculations in `src/utils/calculations.js`, so
   adding/editing a transaction updates every page automatically.

## Where the "personalization" logic lives

`src/utils/calculations.js` → `generateInsights()` is the core of the
Financial Assistant: it branches on `user.userType` and interprets the same
transaction data differently for a student (allowance/day-rate framing) vs.
an adult (fixed-expense/EMI/emergency-fund framing). This is the function
worth walking through in a viva/demo.

## Project structure

```
src/
  utils/
    storage.js        localStorage read/write helpers
    sampleData.js      demo data seeding (student vs adult)
    calculations.js    summary, budget status, health score, insights engine
  components/          reusable UI pieces (Sidebar, Header, charts, modals, cards)
  pages/                Login, SignUp, Dashboard, Transactions, Budget,
                        Savings, Insights, Profile, Settings
  App.js               top-level state + routing (no react-router — simple
                        state-based page switching, per the "keep it simple"
                        requirement)
```

## Stack

React 18, plain JS (no TypeScript), CSS, React Hooks, localStorage.
No backend, no Redux, no auth library — all intentionally left out per spec.
Charts (donut + bar) are hand-rolled SVG components, so there's no charting
library dependency to install or explain in a viva.
