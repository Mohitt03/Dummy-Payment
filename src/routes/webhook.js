const express = require("express");
const Stripe = require("stripe");
const Order = require('../models/Order')

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log("❌ Webhook signature failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("🔥 Webhook received:", event.type);

    if (event.type === "checkout.session.completed") {
        console.log("🎉 Payment Success from Webhook!");

        const session = event.data.object;

        const orderId = session.metadata.orderId;
        const email = session.customer_email;

        await Order.findByIdAndUpdate(orderId, {
            email: email,
            status: "paid"
        });

        console.log("Updated Order:", orderId, "Email:", email);



    }

    res.json({ received: true });
});


module.exports = router;
