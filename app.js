
const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require('path')

const userRoutes = require("./src/routes/user");
const authRoutes = require("./src/routes/auth");
const paymentRoutes = require("./src/routes/payment")
const webhookRoute = require("./src/routes/webhook")

const app = express();
const DB_URL = process.env.DB_URL;






const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require("./src/models/Order"); // your order model

app.use("/webhook", webhookRoute);

// Ejs Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/payment", paymentRoutes);

// Middleware
function logger(req, res, next) {
  console.log("Request:", req.method, req.url);
  next();
}
app.use(logger);

// Global error handler
app.use((error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
  });
});

mongoose.connect(DB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

module.exports = app;
