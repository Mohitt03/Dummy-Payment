const express = require("express");
const Stripe = require("stripe");
const Order = require("../models/Order.js");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


router.get("/", (req, res, next) => {
    try {
        const PRODUCTS = [
            { id: "p1", name: "Test Product", amount: 50000 }
        ];

        res.render("index", { products: PRODUCTS });
    } catch (error) {
        next(error)
    }
});

router.get("/success", (req, res) => res.send("success"));
router.get("/cancel", (req, res) => res.render("cancel"));




router.get("/create-checkout-session/:id", async (req, res) => {
    try {
        const { productId } = req.params.id;

        const product = { name: "Test Product", amount: 50000 };

        const order = await Order.create({
            amount: product.amount,
            currency: "inr",
            items: [{ id: productId }],
        });
        console.log(order._id.toString());


        // const session = await stripe.checkout.sessions.create({
        //     payment_method_types: ["card"],
        //     mode: "payment",
        //     line_items: [
        //         {
        //             price_data: {
        //                 currency: "inr",
        //                 unit_amount: product.amount,
        //                 product_data: { name: product.name }
        //             },
        //             quantity: 1,
        //         }
        //     ],
        //     metadata: { orderId: order._id.toString() },
        //     success_url: `${process.env.BASE_URL}/success`,
        //     cancel_url: `${process.env.BASE_URL}/cancel`,
        // });



        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        unit_amount: product.amount,
                        product_data: { name: product.name }
                    },
                    quantity: 1,
                }
            ],
            metadata: { orderId: order._id.toString() },
            success_url: `${process.env.BASE_URL}/success`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });




        order.stripeSessionId = session.id;
        await order.save();
        // console.log(session.customer_details.email);

        // res.json({ url: session.url });
        res.redirect(session.url)
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router