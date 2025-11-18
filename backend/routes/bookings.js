// routes/bookings.js or your booking route file
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("./models/Booking");

// POST create Stripe session
router.post("/create-checkout-session", async (req, res) => {
    const { area, spot, date, time, name, email, carNumber, phone, userId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: `Parking Spot ${spot} at ${area}`,
                        },
                        unit_amount: 5000, // ₹50 in paise
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard`,
            metadata: { area, spot, date, time, name, email, carNumber, phone, userId },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Stripe session creation failed" });
    }
});

// POST webhook to store booking after payment success
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { area, spot, date, time, name, email, carNumber, phone, userId } = session.metadata;

        await Booking.create({
            user: userId,
            area,
            spot,
            date,
            time,
            name,
            email,
            carNumber,
            phone,
            status: "Confirmed",
        });
    }

    res.json({ received: true });
});

module.exports = router;