const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    stripeSessionId: String,
    amount: Number,
    currency: String,
    status: { type: String, default: "created" },
    items: Array,
    customerEmail: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
