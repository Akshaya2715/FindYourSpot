Smart Parking Management System 
This project detects free and occupied parking slots in real time using CCTV camera feeds and the YOLOv8 object detection model. The system eliminates the need for physical sensors and provides a complete end-to-end parking automation solution with booking, payment, user dashboard, admin dashboard, email notifications, and real-time updates.

⭐ Features
🔹 1. Real-Time Parking Slot Detection

Uses YOLOv8 + OpenCV to detect occupied/free slots.

CCTV frames are processed continuously.

Free slots → Green, Occupied slots → Red.

🔹 2. Dual Booking System

Online Pre-Booking: Users select date, time, and enter car details.

On-Spot Booking: Admin can book directly for walk-in users via live feed.

🔹 3. Secure Online Payments

Integrated with Stripe Payment Gateway.

After payment, users receive instant confirmation.

🔹 4. Email Acknowledgment System

User receives booking details + acknowledgment code via email.

User must confirm within 15 minutes.

If not confirmed, slot is automatically released to avoid blocking.

🔹 5. Live Real-Time Updates (SocketIO)

Slot status updates without refreshing the page.

Users and admins see instant changes.

🔹 6. User Dashboard

View available slots

Booking history

Payment status

Slot confirmation popup

🔹 7. Admin Dashboard (Security Panel)

Live CCTV video feed

Manual booking for walk-in users

Free slot option when a car leaves

View all bookings by date/location

Generate PDF parking reports
