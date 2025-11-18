require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("./models/Booking");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const emailjs = require("@emailjs/nodejs");
const cron = require("node-cron");

const authRoutes = require("./routes/auth");
const feedbackRoutes = require("./routes/feedback");
const crypto = require("crypto");
const app = express();

// ----------------- Stripe Webhook -----------------
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("🔥 Webhook hit!");
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    console.log("🔥 Event received from Stripe:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("✅ Checkout completed for session:", session.id);

      const booking = await Booking.findOneAndUpdate(
        { paymentId: session.id },
        { status: "Confirmed" },
        { new: true }
      );

      if (!booking) {
        console.log("⚠ No booking found for session:", session.id);
      } else {
        console.log("🎯 Booking updated to Confirmed:", booking);
        await sendBookingEmail(booking, "Smart Parking - Booking Confirmed ✅");
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ----------------- Middleware -----------------
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ----------------- MongoDB Connect -----------------
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });

// ----------------- Routes -----------------
app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);

// ----------------- Create Checkout Session -----------------
const authenticate = require("./middleware/authMiddleware.js");

// routes/booking.js or in your server file
app.post("/api/create-checkout-session", authenticate, async (req, res) => {
  try {
    const { name, email, phone, carNumber, date, time, spot, area } = req.body;

    // Prevent double booking
    const existing = await Booking.findOne({ spot, area, date, time, status: "Confirmed" });
    if (existing) {
      return res.status(400).json({ error: `❌ Spot ${spot} already booked for ${date} at ${time}` });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: `Parking Spot ${spot} - ${area}` },
            unit_amount: 5000, // ₹50
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard/user/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/user`,
    });
    const ackCode = crypto.randomBytes(4).toString("hex");
    // Save booking as Pending
    const booking = new Booking({
      name,
      email: req.user?.email || email,
      phone,
      carNumber,
      date,
      time,
      spot,
      area,
      paymentId: session.id,
      status: "Confirmed", // ✅ only confirm in webhook
      ackCode, 
    });
    await booking.save();
    sendBookingEmail(booking, "Smart Parking - Booking Confirmed ✅").catch(err => console.error("❌ Email failed:", err));

    res.json({ id: session.id });


  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/confirm-payment", async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const booking = await Booking.findOneAndUpdate(
        { paymentId: session.id },
        { status: "Confirmed" },
        { new: true }
      );

      if (!booking) return res.status(404).json({ error: "Booking not found" });

      return res.json({ message: "Payment confirmed ✅", booking });
    } else {
      return res.json({ message: "Payment not completed yet", session });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});


// ----------------- Manual Booking by Admin -----------------
app.post("/api/bookings/manual", async (req, res) => {
  try {
    const { name, email, contact,carNumber, slotId, area, date, time } = req.body;

    // check if already booked
    const existing = await Booking.findOne({ spot: slotId, area, date, time, status: "Confirmed" });
    if (existing) {
      return res.status(400).json({ message: `❌ Slot ${slotId} already booked for ${date} at ${time}` });
    }
    const ackCode = crypto.randomBytes(4).toString("hex");
    const booking = new Booking({
      name,
      email,
      phone: contact,
      carNumber, // admin manual
      date,
      time,
      spot: slotId,
      area,
      ackCode,
      status: "Confirmed",
      paymentId: `manual-${Date.now()}`,
    });

    await booking.save(); // ✅ save in DB

    await sendBookingEmail(booking, "Manual Booking Confirmed (Admin/Security)");

    res.json({ message: "✅ Slot booked successfully", booking });
  } catch (err) {
    console.error("Manual booking error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------- Get Booked Spots -----------------
app.get("/api/bookings", async (req, res) => {
  try {
    const { date, time, area } = req.query;
    const bookings = await Booking.find({ date, time, area, status: "Confirmed" });
    res.json({ bookedSpots: bookings.map((b) => b.spot) });
  } catch (err) {
    console.error("Fetch bookings error:", err);
    res.status(500).json({ error: "Failed to fetch booked spots" });
  }
});

// ----------------- Get User's Bookings -----------------
// ----------------- Get User's Bookings -----------------
const authMiddleware = require("./middleware/authMiddleware"); // your existing middleware

app.get("/api/my-bookings", authMiddleware, async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const userEmail = req.user.email;

    if (!userEmail) return res.status(400).json({ error: "User email not found" });

    // Case-insensitive match using regex
    const bookings = await Booking.find({ email: new RegExp(`^${userEmail}$`, "i") }).sort({ date: -1, time: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error("❌ Fetch my bookings error:", err);
    res.status(500).json({ error: "Failed to fetch my bookings" });
  }
});



// ----------------- Get All Confirmed Bookings (Admin) -----------------
app.get("/api/bookings/all", async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "Confirmed" }).sort({ date: -1, time: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("❌ Fetch all bookings error:", err);
    res.status(500).json({ error: "Failed to fetch all bookings" });
  }
});

// ----------------- EmailJS Function -----------------
//const emailjs = require("@emailjs/nodejs");
//const jwt = require("jsonwebtoken");

async function sendBookingEmail(booking, subject = "Smart Parking - Booking Confirmed ✅") {
  try {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    //const acknowledgeLink = `${clientUrl}/acknowledge/${booking.ackCode}`; // simpler than JWT if you want

    const templateParams = {
      user_name: booking.name,
      spot: booking.spot,
      area: booking.area,
      date: booking.date,
      time: booking.time,
      subject: subject,
      ack_code: String(booking.ackCode),
      //acknowledge_link: booking.acknowledgeLink,
    };

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      { privateKey: process.env.EMAILJS_PRIVATE_KEY }
    );

    console.log("📧 Email sent successfully:", response.status);
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
}
// ----------------- Free Slot Booking (Acknowledgment Code) -----------------


const bookSlot = async (req, res) => {
  try {
    const { slotId, date, time, area, userEmail, name } = req.body;

    // Prevent double booking
    const existing = await Booking.findOne({ spot: slotId, area, date, time, status: "Confirmed" });
    if (existing) {
      return res.status(400).json({ error: "❌ Slot already booked!" });
    }

    // Generate 8-char acknowledgment code
    const ackCode = crypto.randomBytes(4).toString("hex");

    const booking = new Booking({
      name,
      email: userEmail,
      spot: slotId,
      area,
      date,
      time,
      ackCode,
      acknowledged: false,
      createdAt: new Date(),
      status: "Pending", // waiting for acknowledgment
    });

    await booking.save();

    // Send email with acknowledgment link
    await sendBookingEmail(booking, "Smart Parking - Free Slot Reserved ✅");

    res.status(200).json({ message: "Booking successful. Please check your email for acknowledgment code.", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Booking failed" });
  }
};
 
app.post("/api/book-slot", bookSlot);


// server.js or routes/bookingRoutes.js
app.post("/api/acknowledge", async (req, res) => {
  try {
    const { ackCode } = req.body;

    // Find the booking that matches the given code
    const booking = await Booking.findOne({ ackCode });

    // If no booking found
    if (!booking)
      return res.status(404).json({ error: "Invalid acknowledgment code" });

    // Check if code expired (older than 15 minutes)
    const diffMinutes = (Date.now() - booking.createdAt.getTime()) / (1000 * 60);
    if (diffMinutes > 15) {
      // Free the slot
      await Booking.deleteOne({ _id: booking._id });
      return res.status(400).json({ error: "Acknowledgment expired. Slot released." });
    }

    // ✅ Mark booking as acknowledged
    booking.acknowledged = true;
    await booking.save();

    res.json({ message: "Booking acknowledged successfully!" });
  } catch (error) {
    console.error("Error acknowledging booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});
 
// Acknowledge booking via ackCode
app.post("/api/acknowledge", async (req, res) => {
  try {
    const { ackCode } = req.body;

    // Find the booking that matches the given code
    const booking = await Booking.findOne({ ackCode });

    if (!booking) {
      return res.status(404).json({ error: "Invalid acknowledgment code" });
    }

    // Check if already acknowledged
    if (booking.acknowledged) {
      return res.status(200).json({ message: "✅ Booking already acknowledged." });
    }

    // Check if code expired (older than 15 minutes)
    const diffMinutes = (Date.now() - booking.createdAt.getTime()) / (1000 * 60);
    if (diffMinutes > 15) {
      // Free the slot
      await Booking.deleteOne({ _id: booking._id });
      return res.status(400).json({ error: "Acknowledgment expired. Slot released." });
    }

    // ✅ Mark booking as acknowledged
    booking.acknowledged = true;
    await booking.save();

    res.json({ message: "✅ Booking acknowledged successfully!", booking });
  } catch (error) {
    console.error("Error acknowledging booking:", error);
    res.status(500).json({ error: "Server error" });
  }
}); 
// Free a booked slot (Admin)
app.post("/api/bookings/free-slot", async (req, res) => {
  try {
    const { place, slot } = req.body;

    if (!place || !slot) {
      return res.status(400).json({ error: "Place and slot are required" });
    }

    // Find the booking
    const booking = await Booking.findOne({ area: place, spot: slot, status: "Confirmed" });
    if (!booking) {
      return res.status(404).json({ error: `No confirmed booking found for slot ${slot} at ${place}` });
    }

    // Delete the booking
    await Booking.deleteOne({ _id: booking._id });

    res.json({ message: `✅ Slot ${slot} at ${place} is now free!` });
  } catch (err) {
    console.error("Free slot error:", err);
    res.status(500).json({ error: "Failed to free slot" });
  }
});

 
cron.schedule("* * * * *", async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15* 60 * 1000);

  try {
    const result = await Booking.deleteMany({
      acknowledged: false,
     // status: "Confirmed",
      createdAt: { $lt: fifteenMinutesAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🕒 Deleted ${result.deletedCount} unacknowledged bookings`);
    }
  } catch (err) {
    console.error("Error deleting old bookings:", err);
  }
});


// ----------------- Test Route -----------------
app.get("/", (req, res) => res.send("Smart Parking API is running 🚀"));

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
