import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function AcknowledgeBooking() {
  const [code, setCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/acknowledge", { ackCode: code });
      toast.success(response.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid or expired code");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Confirm Your Booking</h2>
      <p>Enter your acknowledgment code below:</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ padding: "10px", width: "200px" }}
          required
        />
        <br /><br />
        <button type="submit" style={{ padding: "10px 20px" }}>Confirm</button>
      </form>
    </div>
  );
}

export default AcknowledgeBooking;