const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Booking = require("../models/Booking");

router.get("/acknowledge/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const booking = await Booking.findById(decoded.bookingId);
    if (!booking) return res.status(404).send("Booking not found");

    booking.acknowledged = true;
    booking.acknowledgedAt = new Date();
    await booking.save();

    res.send("<h2>✅ Booking Confirmed! Thank you for acknowledging.</h2>");
  } catch (err) {
    res.status(400).send("<h2>❌ Link expired or invalid.</h2>");
  }
});

module.exports = router;