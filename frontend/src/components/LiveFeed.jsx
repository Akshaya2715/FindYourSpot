// src/components/LiveFeed.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./LiveFeed.css";

function LiveFeed() {
  const navigate = useNavigate();

  return (
    <div className="live-feed-page">
      <header className="header">
        <button className="btn" onClick={() => navigate("/dashboard/admin")}>
          ⬅ Back to Dashboard
        </button>
        <h1>📺 Live Parking Feed</h1>
      </header>

      <main className="live-content">
       <img
  src="http://127.0.0.1:5000/video"
  alt="Live Parking Feed"
  className="video-feed"
/>

      </main>
    </div>
  );
}

export default LiveFeed;
