// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,         // key field for linking bookings
  carNumber: String,
  date: String,
  time: String,
  spot: String,
  area: String,
  paymentId: String,
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Failed"],
    default: "Pending",
  },
  ackCode: {
    type: String,
    required: true,
  },
  acknowledged: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }, // Remove `expires: 60` because we'll handle via cron

  
});

module.exports = mongoose.model("Booking", bookingSchema);