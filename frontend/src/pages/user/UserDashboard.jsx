import React, { useState, useEffect } from "react";
import "./UserDashboard.css";
import { useNavigate, useLocation } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import Chatbot from "../../components/Chatbot";
import { useSearchParams } from "react-router-dom";
  import { toast } from "react-toastify";
  import emailjs from "@emailjs/browser";

// Load Stripe publishable key
const stripePromise = loadStripe(
  "pk_test_51S66TGSEV0aa1HzM4GqH39IhHKYM1ObmfigLzgWqEn5y4UCAOL4gfmyd8gzPANb0YkipKz58PttXZUQc046KKCDB00kqXsAi0i"
);

// ---------------- Header ----------------
function Header({ openAbout, openContact }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return console.error("Failed to fetch user");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="header">
      <h1
        onClick={() => window.location.reload()}
        className="logo"
        style={{ cursor: "pointer" }}
      >
        🚗 Smart Parking
      </h1>
      <nav className="nav-center">
        <ul className="nav-links">
          <li>
            <button onClick={() => window.location.reload()}>Home</button>
          </li>
          <li>
            <button onClick={openAbout}>About Us</button>
          </li>
          <li>
            <a href="#explore">Explore</a>
          </li>
          <li>
            <button onClick={openContact}>Contact Us</button>
          </li>
        </ul>
      </nav>
      <div className="profile-container">
        <button
          className="profile-btn"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          👤
        </button>
        {profileOpen && (
          <div className="profile-dropdown">
            {user ? (
              <>
                <p>
                  <strong>Name:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                {user.vehicleNumber && (
                  <p>
                    <strong>Vehicle:</strong> {user.vehicleNumber}
                  </p>
                )}
                <button onClick={handleLogout} className="btn logout-btn">
                  🚪 Logout
                </button>
              </>
            ) : (
              <p>Loading user...</p>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// ---------------- Footer ----------------
function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Smart Parking System | All Rights Reserved</p>
    </footer>
  );
}

// ---------------- Explore ----------------
function Explore({ openBooking, openMyBookings }) {
  return (
    <section id="explore" className="explore">
      <div className="card-container">
        <div className="card">
          <h3>Book a Spot</h3>
          <p>Easily book your parking spot online.</p>
          <button className="btn" onClick={openBooking}>
            Book Now
          </button>
        </div>
        <div className="card">
          <h3>My Bookings</h3>
          <p>Check and manage your existing bookings.</p>
          <button className="btn" onClick={openMyBookings}>
            View
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------- Popup ----------------
function Popup({ title, children, closePopup }) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h2 className="popup-heading">{title}</h2>
        {children}
        <div style={{ marginTop: "16px" }}>
          <button onClick={closePopup} className="btn-close">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- User Dashboard ----------------
function UserDashboard() {
  const [areaOpen, setAreaOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [spotOpen, setSpotOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false); 
  const [user, setUser] = useState(null);
  const location = useLocation();

  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookedSpots, setBookedSpots] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(""); // "", "verifying", "success", "failed"

  const [bookingData, setBookingData] = useState({
    name: "",
    email: "",
    phone: "",
    carNumber: "",
    date: "",
    time: "",
  });

  const [feedbackData, setFeedbackData] = useState({
    name: "",
    email: "",
    feedback: "",
  });

  const navigate = useNavigate();
  const [paymentPopupOpen, setPaymentPopupOpen] = useState(false); // handles all payment states
  //const [paymentStatus, setPaymentStatus] = useState(""); // "", "verifying", "success", "failed"
  const [confirmedBooking, setConfirmedBooking] = useState(null); // store booking after payment

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
  
    if (!sessionId) return;
  
    const confirmPayment = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/confirm-payment?sessionId=${sessionId}`);
        const data = await res.json();
  
        if (res.ok && data.booking) {
          setConfirmedBooking(data.booking);
          setPaymentStatus("success");
          setPaymentPopupOpen(true);
        } else {
          setPaymentStatus("failed");
          alert("Payment not completed yet");
        }
      } catch (err) {
        console.error(err);
        setPaymentStatus("failed");
      }
    };
  
    confirmPayment();
  }, [location]);
   

  // ---------------- Fetch User ----------------
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setUser(data.user);
        setBookingData({
          name: data.user.name || "",
          email: data.user.email || "",
          carNumber: "",
          phone: "",
          date: "",
          time: "",
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);
 
  // ---------------- Handlers ----------------
  const handleBookingChange = (e) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const handleFeedbackChange = (e) => {
    setFeedbackData({ ...feedbackData, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingOpen(false);
    setSpotOpen(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/bookings?date=${bookingData.date}&time=${bookingData.time}&area=${selectedArea}`
      );
      const data = await res.json();
      if (res.ok) setBookedSpots(data.bookedSpots || []);
    } catch (err) {
      console.error("Error fetching booked spots:", err);
    }
  };

  const handleSpotSelect = (spot) => {
    if (bookedSpots.includes(spot)) {
      alert(`❌ Spot ${spot} is already booked!`);
      return;
    }
    setSelectedSpot(spot);
  };

  // const handleConfirmSpot = () => {
  //   if (!selectedSpot) return alert("Select a spot first!");
  //   if (!user) return alert("⏳ Loading user info, please wait...");
  //   setSpotOpen(false);
  //   setPaymentPopupOpen(true);
  // };
  const handleConfirmSpot = async () => {
    if (!selectedSpot) return alert("Select a spot first!");
    if (!user) return alert("⏳ Loading user info, please wait...");
  
    try {
      const res = await fetch("http://localhost:5000/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          area: selectedArea,
          spot: selectedSpot,
          date: bookingData.date,
          time: bookingData.time,
          name: bookingData.name,
          email: bookingData.email,
          carNumber: bookingData.carNumber,
          phone: bookingData.phone,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) return alert("❌ Payment error: " + data.error);
  
      // ✅ Use Stripe redirect
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) alert(error.message);
  
    } catch (err) {
      console.error(err);
      alert("❌ Something went wrong with payment");
    }
  };
  
  const handlePayment = async () => {
    // Directly mark as success
    setConfirmedBooking({
      spot: selectedSpot,
      area: selectedArea,
      date: bookingData.date,
      time: bookingData.time,
    });
    setPaymentStatus("success");
  };


  const [loadingBookings, setLoadingBookings] = useState(false);

  const handleMyBookings = async () => {
    setLoadingBookings(true); // start loading

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Login required");
        setLoadingBookings(false);
        return;
      }

      const res = await fetch("http://localhost:5000/api/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setMyBookings(data.bookings || []);
        setMyBookingsOpen(true);
      } else {
        alert(data.error || "Failed to fetch bookings");
      }
    } catch (err) {
      console.error("Error fetching my bookings:", err);
      alert("❌ Something went wrong while fetching your bookings");
    } finally {
      setLoadingBookings(false); // stop loading
    }
  };
  const sendBookingEmail = async (booking, retries = 3) => {
    try {
      await emailjs.send(
        "service_h2klbcg",
        "template_b17svon",
        {
          user_name: booking.name,
          spot: booking.spot,
          area: booking.area,
          date: booking.date,
          time: booking.time,
          carNumber: booking.carNumber,
          user_email: booking.email,
          ack_code:String(booking.ackCode),

        },
        "iWtc73QQLnoGUkVhP"
      );
      toast.success("Booking details sent to your email!");
    } catch (err) {
      console.error("Email send failed:", err);
      if (retries > 0) sendBookingEmail(booking, retries - 1);
      else toast.error("Email sending failed, but booking is confirmed.");
    }
  };
  

  return (
    <div className="dashboard">
      <Header openAbout={() => setAboutOpen(true)} openContact={() => setContactOpen(true)} />

      <main className="main-content">
        <h2 className="dashboard-title">Honk Less, Park More</h2>
        <Explore openBooking={() => setAreaOpen(true)} openMyBookings={handleMyBookings} />
      </main>
      <Footer />

      {/* Popups */}
       
      {contactOpen && (
  <Popup title="Contact Us" closePopup={() => setContactOpen(false)}>
    <form
      className="contact-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const res = await fetch("http://localhost:5000/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(feedbackData),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("✅ Feedback submitted successfully!");
            setFeedbackData({ name: "", email: "", feedback: "" });
            setContactOpen(false);
          } else {
            toast.error("❌ " + (data.error || "Failed to submit feedback"));
          }
        } catch (err) {
          console.error("Feedback error:", err);
          toast.error("❌ Server error, please try again");
        }
      }}
    >
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={feedbackData.name}
        onChange={handleFeedbackChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={feedbackData.email}
        onChange={handleFeedbackChange}
        required
      />
      <textarea
        name="feedback"
        placeholder="Your feedback"
        value={feedbackData.feedback}
        onChange={handleFeedbackChange}
        required
      />
      <button type="submit" className="btn">Submit</button>
    </form>
  </Popup>
)}     
 {aboutOpen && (
  <Popup title="About Us" closePopup={() => setAboutOpen(false)}>
    <div className="about-popup">
      <h2 className="about-title">About Smart Parking</h2>
      <p className="about-intro">
        Smart Parking System is a modern solution designed to make parking 
        effortless. It helps drivers avoid the stress of searching for spaces 
        by offering real-time slot detection, quick booking options, and 
        secure online payments powered by Stripe.
      </p>

      <p>
        With this system, users can easily book or cancel their parking spaces 
        from anywhere using a simple and mobile-friendly interface. The platform 
        also sends instant email confirmations and integrates a chatbot to guide 
        users whenever they need assistance.
      </p>

      <p>
        Beyond convenience, Smart Parking contributes to reducing traffic 
        congestion inside parking areas and improves overall efficiency. 
        By combining Artificial Intelligence, IoT, and web technologies, 
        the system ensures that parking is smarter, faster, and more reliable.
      </p>
 
    </div>
  </Popup>
)}

      {areaOpen && (
        <Popup title="Choose Parking Area" closePopup={() => setAreaOpen(false)}>
          <div className="area-popup-content">
            <div className="area-grid">
              {[
                { name: "Chennai - International Airport", img: "/src/assets/chennai.png" },
                { name: "Kochin - LULU Mall", img: "/src/assets/kochi.png" },
                { name: "Bangalore - VR Bengaluru", img: "/src/assets/bangalore.png" },
              ].map((area) => (
                <div
                  key={area.name}
                  className={`area-card ${selectedArea === area.name ? "selected" : ""}`}
                  onClick={() => setSelectedArea(area.name)}
                >
                  <img src={area.img} alt={area.name} className="area-img" />
                  <h3>{area.name}</h3>
                </div>
              ))}
            </div>
            {selectedArea && (
              <button
                onClick={() => {
                  setAreaOpen(false);
                  setBookingOpen(true);
                }}
                className="btn"
              >
                Continue
              </button>
            )}
          </div>
        </Popup>
      )}

      {bookingOpen && (
        <Popup title={`Book at ${selectedArea}`} closePopup={() => setBookingOpen(false)}>
          <form className="booking-form" onSubmit={handleBookingSubmit}>
            <input type="text" name="name" placeholder="Name" value={bookingData.name} onChange={handleBookingChange} required />
            <input type="email" name="email" placeholder="Email" value={bookingData.email} onChange={handleBookingChange} required />
            <input type="text" name="carNumber" placeholder="Enter Car Number" value={bookingData.carNumber} onChange={handleBookingChange} required />
            <input type="tel" name="phone" placeholder="Phone Number" value={bookingData.phone} onChange={handleBookingChange} required />
            <input type="date" name="date" value={bookingData.date} onChange={handleBookingChange} required />
            <input type="time" name="time" value={bookingData.time} onChange={handleBookingChange} required />
            <button type="submit" className="btn">Select Spot</button>
          </form>
        </Popup>
      )}

      {spotOpen && (
        <Popup title="Select Your Parking Spot" closePopup={() => setSpotOpen(false)}>
          <div className="spot-grid">
            {Array.from({ length: 20 }, (_, i) => `S${i + 1}`).map((spot) => {
              const isBooked = bookedSpots.includes(spot);
              const isSelected = selectedSpot === spot;
              return (
                <div
                  key={spot}
                  className={`parking-spot ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => !isBooked && handleSpotSelect(spot)}
                >
                  {isBooked ? `❌ ${spot}` : `🚗 ${spot}`}
                </div>
              );
            })}
          </div>
          {selectedSpot && !bookedSpots.includes(selectedSpot) && (
            <button onClick={handleConfirmSpot} className="btn">Confirm {selectedSpot}</button>
          )}
        </Popup>
      )}

      {myBookingsOpen && (
        <Popup title="My Bookings" closePopup={() => setMyBookingsOpen(false)}>
          {loadingBookings ? (
            <p>Loading bookings...</p>
          ) : myBookings.length === 0 ? (
            <p>No bookings found.</p>
          ) : (
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Spot</th>
                  <th>Area</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b, idx) => (
                  <tr key={idx}>
                    <td>{b.spot}</td>
                    <td>{b.area}</td>
                    <td>{b.date}</td>
                    <td>{b.time}</td>
                    <td>
                      <span className={`status ${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Popup>
      )}
 
      {paymentPopupOpen && (
        <Popup
          title="✅ Payment Successful!"
          closePopup={() => {
            setPaymentPopupOpen(false);
            setPaymentStatus("");
            setConfirmedBooking(null);
          }}
        >
          <p>Your parking slot has been booked successfully. Check your details:</p>
          <ul>
            <li><strong>Spot:</strong> {confirmedBooking.spot}</li>
            <li><strong>Area:</strong> {confirmedBooking.area}</li>
            <li><strong>Date:</strong> {confirmedBooking.date}</li>
            <li><strong>Time:</strong> {confirmedBooking.time}</li>
          </ul>
          <button
            className="btn"
            onClick={() => {
              setPaymentPopupOpen(false);
              setSelectedArea(null);
              setSelectedSpot(null);
              handleMyBookings(); // refresh bookings table
            
            sendBookingEmail({
              ...confirmedBooking,
              name: bookingData.name,
              email: bookingData.email,
              carNumber: bookingData.carNumber,
            });
            }}
        
          >
            Confirm
          </button>

        </Popup>
      )}

      <Chatbot />
    </div>
  );
}

export default UserDashboard;