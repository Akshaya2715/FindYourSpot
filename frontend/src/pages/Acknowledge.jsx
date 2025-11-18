// src/pages/Acknowledge.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Acknowledge.css";

function Acknowledge() {
  const { token } = useParams();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/acknowledge/${token}`);
        const text = await res.text();
        setStatus(text);
      } catch (err) {
        setStatus("❌ Failed to verify");
      }
    };
    verify();
  }, [token]);

  const getStatusClass = () => {
    if (status.includes("✅")) return "success";
    if (status.includes("❌") || status.includes("⚠️")) return "error";
    return "pending";
  };

  return (
    <div className="container">
      <div className={`ack-box ${getStatusClass()}`}>
        <h2>{status}</h2>
        <p>
          {status.includes("✅")
            ? "Your booking has been acknowledged successfully. Thank you!"
            : status.includes("❌")
            ? "Sorry, this acknowledgment link is invalid or expired."
            : "Please wait while we verify your booking..."}
        </p>
      </div>
    </div>
  );
}

export default Acknowledge;