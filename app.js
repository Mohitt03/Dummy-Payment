
const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require('path')

const userRoutes = require("./src/routes/user");
const authRoutes = require("./src/routes/auth");
const paymentRoutes = require("./src/routes/payment")

const app = express();
const DB_URL = process.env.DB_URL;


// Ejs Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require("./src/models/Order"); // your order model

// ⭐ WEBHOOK ROUTE (Stripe will trigger this)
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      // If not verifying signature during development:
      event = JSON.parse(req.body);

      // If verifying signature (recommended in production)
      /*
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      */
    } catch (err) {
      console.log("Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ⭐ TRIGGERED AUTOMATICALLY AFTER SUCCESSFUL PAYMENT
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Extract user details
      const email = session.customer_details.email;
      const name = session.customer_details.name;
      const amount = session.amount_total;
      const currency = session.currency;
      const stripeSessionId = session.id;
      const paymentIntentId = session.payment_intent;
      const orderId = session.metadata.orderId; // Your order ID

      console.log("🎉 Payment Success Webhook Triggered!");
      console.log("User Email:", email);
      console.log("Order ID:", orderId);

      // ⭐ UPDATE ORDER IN MONGODB
      await Order.findByIdAndUpdate(orderId, {
        email,
        name,
        amount,
        currency,
        stripeSessionId,
        paymentIntentId,
        paymentStatus: "paid",
      });

      console.log("✅ Order updated successfully in DB!");
    }

    res.json({ received: true });
  }
);




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
