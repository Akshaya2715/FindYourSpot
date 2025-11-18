import React, { useState } from "react";
import "./Chatbot.css";
import botIcon from "../assets/chatbot.jpg"; // ✅ unga image va use pannunga

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    // Predefined QnA
    const questions = [
        { q: "How to book a parking spot?", a: "Go to 'Book a Spot' → select area → fill details → confirm → pay." },
        { q: "How to check my bookings?", a: "Click 'My Bookings' in dashboard, you can see your booking history." },
        { q: "How to make payment?", a: "We use Stripe. Just confirm your spot and pay securely online." },
        { q: "Can I cancel my booking?", a: "Currently, cancellation is not supported. Please contact support." },
    ];

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { sender: "user", text: input }];
        setMessages(newMessages);

        if (input.toLowerCase() === "hi") {
            // Show predefined questions
            setMessages([...newMessages, { sender: "bot", text: "Hello! Choose a question below:" }]);
        }
        setInput("");
    };

    const handleQuestionClick = (q, a) => {
        setMessages([
            ...messages,
            { sender: "user", text: q },
            { sender: "bot", text: a },
        ]);
    };

    return (
        <div className="chatbot-wrapper">
            {/* Chatbot Toggle Button */}
            <img
                src={botIcon}
                alt="Chatbot"
                className="chatbot-icon"
                onClick={() => setIsOpen(!isOpen)}
            />

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-container">
                    <div className="chat-header">🤖 SmartBot</div>
                    <div className="chat-body">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-msg ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}

                        {/* Show questions only if user said Hi */}
                        {messages.some((m) => m.text.toLowerCase() === "hi") && (
                            <div className="questions">
                                {questions.map((q, i) => (
                                    <button
                                        key={i}
                                        className="question-btn"
                                        onClick={() => handleQuestionClick(q.q, q.a)}
                                    >
                                        {q.q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="chat-footer">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        />
                        <button onClick={handleSend}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chatbot;