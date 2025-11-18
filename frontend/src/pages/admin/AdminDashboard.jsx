// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import bannerImg from "../../assets/banner.jpg";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate, useLocation } from "react-router-dom";

const stripePromise = loadStripe(
  "pk_test_51S66TGSEV0aa1HzM4GqH39IhHKYM1ObmfigLzgWqEn5y4UCAOL4gfmyd8gzPANb0YkipKz58PttXZUQc046KKCDB00kqXsAi0i"
);

// ---------------- Header ----------------
function Header({ admin }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <header className="header">
      <h1
        className="logo"
        onClick={() => window.location.reload()}
        style={{ cursor: "pointer" }}
      >
        🛠 Admin Panel
      </h1>
      <nav className="nav-center">
        <ul className="nav-links">
          <li>
            <button onClick={() => window.location.reload()}>Dashboard</button>
          </li>
          <li>
            <a href="#manage">Manage Booking</a>
          </li>
          <li>
            <a href="#reports">View Booking</a>
          </li>
         <li>
  <a href="/feedbacks">View Feedbacks</a>
</li>
        </ul>
      </nav>
      <div className="profile-container">
        <button className="profile-btn">👨‍💼</button>
        <div className="profile-dropdown">
          <p>
            <strong>Role:</strong> {admin?.role || "Loading..."}
          </p>
          <p>
            <strong>Email:</strong> {admin?.email || "Loading..."}
          </p>
          <button
            className="btn"
            onClick={handleLogout}
            style={{ marginTop: "10px", backgroundColor: "#d63031" }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------- Footer ----------------
function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Smart Parking | Admin Panel</p>
    </footer>
  );
}

// ---------------- Popup ----------------
function Popup({ title, children, closePopup }) {
  return (
    <div className="popup-overlay">
      <div
        className="popup-box"
        style={{
          minWidth: "950px",
          minHeight: "500px",
          background: "#fff",
          padding: "25px",
          borderRadius: "8px",
          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>{title}</h2>
        {children}
        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button onClick={closePopup} className="btn-close">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Dashboard ----------------
function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState("");

  // const [bookSlotOpen, setBookSlotOpen] = useState(false);
  // const [slotOpen, setSlotOpen] = useState(false);
  // const [paymentOpen, setPaymentOpen] = useState(false);
  const [bookSlotOpen, setBookSlotOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Area, 2: Date/Time, 3: Slot, 4: Payment

  const [bookedSpots, setBookedSpots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

 const [bookingData, setBookingData] = useState({
  name: "",
  email: "",
  contact: "",
  carNumber: "",   // add this
  area: "",
  date: "",
  time: "",
});


  const [bookings, setBookings] = useState([]);
  const [viewBookingsOpen, setViewBookingsOpen] = useState(false);
  const [showBookingResults, setShowBookingResults] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [searchArea, setSearchArea] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [freeSlotPopup, setFreeSlotPopup] = useState(false);
  const [freeSlotData, setFreeSlotData] = useState({ place: "", slot: "" });
  
  

  
  const navigate = useNavigate();


  // ✅ Fetch logged-in admin details
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login?role=admin");
          return;
        }

        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.user) {
          setAdmin(data.user); // ✅ now admin.role and admin.email will be available
        } else {
          console.error("No user in /me response", data);
        }
      } catch (err) {
        console.error("Error fetching admin:", err);
      }
    };

    fetchAdmin();
  }, [navigate]);
  // Confirm payment success (Admin)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
    if (sessionId) confirmPayment(sessionId);
  }, [location]);

  const confirmPayment = async (sessionId) => {
    setPaymentStatus("verifying");
    try {
      const res = await fetch(`http://localhost:5000/api/confirm-payment?sessionId=${sessionId}`);
      const data = await res.json();
      if (res.ok) {
        alert("✅ Payment confirmed! Spot booked successfully.");
        setPaymentStatus("success");

        // reset after success
        setSelectedSlot(null);
        setBookingStep(1);
        setBookingData({ name: "", email: "", contact: "", area: "", date: "", time: "" });
      } else {
        console.error(data.error);
        setPaymentStatus("failed");
      }
    } catch (err) {
      console.error("Payment confirmation error:", err);
      setPaymentStatus("failed");
    }
  };


  const handleBookingChange = (e) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  // ---------------- View Bookings Fetch ----------------
  const fetchBookings = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/all`);
      const data = await res.json();
      setBookings(data);
      setShowBookingResults(true);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  return (
    <div className="dashboard">
      <Header admin={admin} />

      <section className="dashboard-banner">
        <img src={bannerImg} alt="Admin Banner" />
        <div className="banner-text">
          <h1>Welcome, Admin!</h1>
          <p>Manage Users, Bookings & Parking Effortlessly 🚗</p>
        </div>
      </section>

      <main className="main-content">
        <section className="card-container">
          <div className="card">
            <h3>Book Slot</h3>
            <p>Manually book a slot for user</p>
            <button className="btn" onClick={() => setBookSlotOpen(true)}>
              Open
            </button>
          </div>

          <div className="card">
            <h3>View Bookings</h3>
            <p>Search bookings by date/location</p>
            <button className="btn" onClick={() => setViewBookingsOpen(true)}>
              Open
            </button>
          </div>
          <div className="card">
      <h3>Live Feed</h3>
      <p>Monitor parking area in real-time</p>
      <button className="btn" onClick={() => navigate("/dashboard/admin/live-feed")}>
        Open
      </button>
    </div>
        </section>
        {/* ----------- BOOK SLOT POPUP ----------- */}
        {bookSlotOpen && (
          <Popup title={`Book at ${bookingData.area || "Select Area"}`} closePopup={() => {
            setBookSlotOpen(false);
            setBookingStep(1); // reset
            setBookingData({ name: "", email: "", contact: "", area: "", date: "", time: "" });
            setSelectedSlot(null);
          }}>
            {bookingStep === 1 && (
              // Step 1: Select Area
              <div className="area-popup-content">
                <div className="area-grid">
                  {[
                    { name: "Chennai - International Airport", img: "/src/assets/chennai.png" },
                    { name: "Kochin - LULU Mall", img: "/src/assets/kochi.png" },
                    { name: "Bangalore - VR Bengaluru", img: "/src/assets/bangalore.png" },
                  ].map((area) => (
                    <div
                      key={area.name}
                      className={`area-card ${bookingData.area === area.name ? "selected" : ""}`}
                      onClick={() => setBookingData(prev => ({ ...prev, area: area.name }))}
                    >
                      <img src={area.img} alt={area.name} className="area-img" />
                      <h3>{area.name}</h3>
                    </div>
                  ))}
                </div>
                {bookingData.area && (
                  <button className="btn" onClick={() => setBookingStep(2)}>Continue</button>
                )}
              </div>
            )}

            {bookingStep === 2 && (
              <form className="booking-form">
                <input type="text" name="name" placeholder="Name" value={bookingData.name} onChange={handleBookingChange} required />
                <input type="email" name="email" placeholder="Email" value={bookingData.email} onChange={handleBookingChange} required />
                <input
                  type="text"
                  name="carNumber"
                  placeholder="Car Number"
                  value={bookingData.carNumber || ""}
                  onChange={handleBookingChange}
                  required
                />

                <input type="text" name="contact" placeholder="Phone" value={bookingData.contact} onChange={handleBookingChange} required />
                <input type="date" name="date" value={bookingData.date} onChange={handleBookingChange} required />
                <input type="time" name="time" value={bookingData.time} onChange={handleBookingChange} required />

                <button className="btn" onClick={async (e) => {
                  e.preventDefault();
                  if (!bookingData.name || !bookingData.email || !bookingData.contact || !bookingData.date || !bookingData.time) {
                    alert("Please fill all fields!");
                    return;
                  }

                  // Fetch occupied slots for this area/date/time
                  try {
                    const res = await fetch(`http://localhost:5000/api/bookings?area=${bookingData.area}&date=${bookingData.date}&time=${bookingData.time}`);
                    const data = await res.json();

                    const allSlots = Array.from({ length: 20 }, (_, i) => `S${i + 1}`);
                    const booked = data.bookedSpots || [];

                    setAvailableSlots(allSlots.map(s => ({
                      id: s,
                      occupied: booked.includes(s)
                    })));

                    setBookingStep(3); // proceed to slot selection
                  } catch (err) {
                    console.error("Error fetching slots:", err);
                    alert("Failed to fetch slots. Try again.");
                  }
                }}>
                  Next: Select Spot
                </button>
              </form>
            )}


            {bookingStep === 3 && (
              <div>
                <div className="spot-grid">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`parking-spot ${slot.occupied ? "booked" : ""} ${selectedSlot === slot.id ? "selected" : ""}`}
                      onClick={() => !slot.occupied && setSelectedSlot(slot.id)}
                    >
                      {slot.occupied ? `❌ ${slot.id}` : `🚗 ${slot.id}`}
                    </div>
                  ))}
                </div>

                {selectedSlot && (
                  <div style={{ marginTop: "20px", textAlign: "center" }}>
                    <p>Selected Spot: <strong>{selectedSlot}</strong></p>
                    <button
                      className="btn"
                      onClick={async () => {
                        try {
                          const res = await fetch("http://localhost:5000/api/bookings/manual", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: bookingData.name,
                              email: bookingData.email,
                              contact: bookingData.contact,
                              carNumber: bookingData.carNumber, // ✅ include this
                              slotId: selectedSlot,
                              area: bookingData.area,
                              date: bookingData.date,
                              time: bookingData.time,
                            }),
                          });
                          


                          const data = await res.json();

                          if (res.ok) {
                            alert("✅ Spot booked successfully!");
                            setBookSlotOpen(false);
                            setBookingStep(1);
                            setBookingData({ name: "", email: "", contact: "", area: "", date: "", time: "" });
                            setSelectedSlot(null);
                          } else {
                            console.error(data.error);
                            alert("❌ Booking failed: " + data.error);
                          }
                        } catch (err) {
                          console.error(err);
                          alert("❌ Booking failed. Try again.");
                        }
                      }}
                    >
                      Confirm Spot
                    </button>
                  </div>
                )}
              </div>
            )}


            {bookingStep === 4 && (
              <div>
                <p>
                  Confirm booking for spot <strong>{selectedSlot}</strong> at {bookingData.area}?
                </p>
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      const res = await fetch("http://localhost:5000/api/bookings/manual", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          name: bookingData.name,
                          email: bookingData.email,
                          contact: bookingData.contact,
                          carNumber: bookingData.carNumber, // add this
                          slotId: selectedSlot,
                          area: bookingData.area,
                          date: bookingData.date,
                          time: bookingData.time
                        }),
                        
                      });


                      const data = await res.json();

                      if (res.ok) {
                        alert("✅ Spot booked successfully!");
                        // reset popup
                        setBookSlotOpen(false);
                        setBookingStep(1);
                        setBookingData({
                          name: "",
                          email: "",
                          contact: "",
                          area: "",
                          date: "",
                          time: "",
                        });
                        setSelectedSlot(null);
                      } else {
                        console.error(data.error);
                        alert("❌ Booking failed: " + data.error);
                      }
                    } catch (err) {
                      console.error(err);
                      alert("❌ Booking failed. Try again.");
                    }
                  }}
                >
                  Confirm Spot
                </button>
              </div>
            )}
            {/* 
                {paymentStatus === "verifying" && <p>⏳ Verifying payment...</p>}
                {paymentStatus === "success" && <p style={{ color: "green" }}>✅ Payment Successful!</p>}
                {paymentStatus === "failed" && <p style={{ color: "red" }}>❌ Payment Failed. Try again.</p>}

              </div>
            )} */}
          </Popup>
        )}


        {/* ----------- SEARCH POPUP ----------- */}
        {viewBookingsOpen && !showBookingResults && (
          <Popup
            title="Search Bookings"
            closePopup={() => setViewBookingsOpen(false)}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                maxWidth: "400px",
              }}
            >
              <select
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                style={{ padding: "8px", border: "1px solid #ccc" }}
              >
                <option value="">-- Select Area --</option>
                <option value="Chennai - International Airport">
                  Chennai - International Airport
                </option>
                <option value="Kochin - LULU Mall">Kochin - LULU Mall</option>
                <option value="Bangalore - VR Bengaluru">
                  Bangalore - VR Bengaluru
                </option>
              </select>

              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                style={{ padding: "8px", border: "1px solid #ccc" }}
              />

              <button
                className="btn"
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `http://localhost:5000/api/bookings/all`
                    );
                    const data = await res.json();

                    // store all bookings in localStorage
                    localStorage.setItem("bookings", JSON.stringify(data));

                    // navigate with area and date
                    navigate("/bookings", {
                      state: { selectedArea: searchArea, selectedDate: searchDate },
                    });
                  } catch (err) {
                    console.error("Error fetching bookings:", err);
                  }
                }}
              >
                Continue
              </button>
            </div>
          </Popup>
        )}

        {/* -----------             RESULTS POPUP ----------- */}
        {viewBookingsOpen && showBookingResults && (
          <Popup
            title="Bookings Results"
            closePopup={() => {
              setViewBookingsOpen(false);
              setShowBookingResults(false);
            }}
          >
            <div
              style={{
                minWidth: "100%",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "15px",
                }}
              >
                <thead>
                  <tr style={{ background: "#fbe9e7", color: "#b71c1c" }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Car Number</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>Area</th>
                    <th style={thStyle}>Spot</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings
                    .filter((b) => {
                      const matchesArea = !searchArea || b.area === searchArea;
                      const matchesDate = !searchDate || b.date === searchDate;
                      return matchesArea && matchesDate;
                    })
                    .map((b) => (
                      <tr key={b._id}>
                        <td style={tdStyle}>{b.name}</td>
                        <td style={tdStyle}>{b.carNumber}</td>
                        <td style={tdStyle}>{b.date}</td>
                        <td style={tdStyle}>{b.time}</td>
                        <td style={tdStyle}>{b.area}</td>
                        <td style={tdStyle}>{b.spot}</td>
                        <td style={tdStyle}>{b.status}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            
          </Popup>
        )}
        {freeSlotPopup && (
  <Popup title="Free a Parking Slot" closePopup={() => setFreeSlotPopup(false)}>
    <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: "400px" }}>
      {/* Select Place */}
      <select
        value={freeSlotData.place}
        onChange={(e) => setFreeSlotData({ ...freeSlotData, place: e.target.value })}
        style={{ padding: "8px", border: "1px solid #ccc" }}
      >
        <option value="">-- Select Place --</option>
        <option value="Chennai - International Airport">Chennai - International Airport</option>
        <option value="Kochin - LULU Mall">Kochin - LULU Mall</option>
        <option value="Bangalore - VR Bengaluru">Bangalore - VR Bengaluru</option>
      </select>

      {/* Slot Number */}
      <input
        type="text"
        placeholder="Enter Slot Number (e.g., S8)"
        value={freeSlotData.slot}
        onChange={(e) => setFreeSlotData({ ...freeSlotData, slot: e.target.value })}
        style={{ padding: "8px", border: "1px solid #ccc" }}
      />

      <button
        className="btn"
        onClick={async () => {
          if (!freeSlotData.place || !freeSlotData.slot) {
            alert("Please select a place and enter slot number");
            return;
          }

          try {
            const res = await fetch(`http://localhost:5000/api/bookings/free-slot`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(freeSlotData),
            });
            const data = await res.json();

            if (res.ok) {
              alert(`✅ Slot ${freeSlotData.slot} at ${freeSlotData.place} is now free!`);
              setFreeSlotPopup(false);
              setFreeSlotData({ place: "", slot: "" });
            } else {
              alert("❌ " + data.error);
            }
          } catch (err) {
            console.error(err);
            alert("❌ Failed to free slot. Try again.");
          }
        }}
      >
        Confirm
      </button>
    </div>
  </Popup>
)}


      </main>
{/* Free Slot Button */}
<div style={{ textAlign: "center", margin: "30px 0" }}>
  <button className="btn" onClick={() => setFreeSlotPopup(true)}>
    Free Slot
  </button>
</div>


      <Footer />
    </div>
  );
}

// ---------- STYLES ----------
const thStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  textAlign: "left",
  fontWeight: "600",
  borderRight: "1px solid #ddd",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  borderRight: "1px solid #ddd",
};

export default AdminDashboard;