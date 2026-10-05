const express = require("express");
const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
  GET all transactions for the logged-in user
*/
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.userId,
    }).sort({ date: -1 });

    res.status(200).json({
      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    res.status(500).json({
      message: "Server error while fetching transactions",
    });
  }
});

/*
  CREATE a new transaction
*/
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      type,
      title,
      amount,
      category,
      date,
      paymentMethod,
      description,
    } = req.body;

    if (
      !type ||
      !title ||
      !amount ||
      !category ||
      !date ||
      !paymentMethod
    ) {
      return res.status(400).json({
        message: "Required transaction fields are missing",
      });
    }

    const transaction = await Transaction.create({
      userId: req.user.userId,
      type,
      title,
      amount,
      category,
      date,
      paymentMethod,
      description: description || "",
    });

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);

    res.status(500).json({
      message: "Server error while creating transaction",
    });
  }
});

/*
  UPDATE a transaction
*/
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const {
      type,
      title,
      amount,
      category,
      date,
      paymentMethod,
      description,
    } = req.body;

    transaction.type = type;
    transaction.title = title;
    transaction.amount = amount;
    transaction.category = category;
    transaction.date = date;
    transaction.paymentMethod = paymentMethod;
    transaction.description = description || "";

    await transaction.save();

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);

    res.status(500).json({
      message: "Server error while updating transaction",
    });
  }
});

/*
  DELETE a transaction
*/
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);

    res.status(500).json({
      message: "Server error while deleting transaction",
    });
  }
});

module.exports = router;