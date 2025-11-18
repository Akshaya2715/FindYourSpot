import React, { useEffect, useState } from "react";
import "./FeedbacksPage.css";

function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/feedback")
      .then((res) => res.json())
      .then((data) => setFeedbacks(data))
      .catch((err) => console.error("Error fetching feedbacks:", err));
  }, []);

  return (
    <div className="feedbacks-page">
      <h2>User Feedbacks</h2>
      <table className="feedbacks-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Feedback</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.length > 0 ? (
            feedbacks.map((fb) => (
              <tr key={fb._id}>
                <td>{fb.name}</td>
                <td>{fb.email}</td>
                <td>{fb.feedback}</td>
                <td>{new Date(fb.createdAt).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No feedback available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default FeedbacksPage;
