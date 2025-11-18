// src/pages/register.jsx
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";  // ✅ axios import
import "../styles/register.css";

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useMemo(
    () => new URLSearchParams(location.search).get("role") || "user",
    [location.search]
  );

  const brand = role === "admin" ? "Admin" : "User";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(""); // ✅ success/error message

  function validate() {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 8) e.password = "Min 8 characters";
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      e.password = (e.password ? e.password + "; " : "") + "Use A–Z and 0–9";
    }
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    if (!form.agree) e.agree = "Please accept terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role, // ✅ role (user/admin)
      });

      setMessage("✅ Registered Successfully!");
      // navigate to login after 1.5 sec
      setTimeout(() => navigate(`/login?role=${role}`), 1500);
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Something went wrong"));
    }
  }

  return (
    <div className="auth-wrap register-bg">
      <div className="auth-card">
        <div className="auth-head">
          <h2>{brand} Registration</h2>
          <p>Create your account and start parking like a pro.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className={`field ${errors.name ? "has-error" : ""}`}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g., Alex Morgan"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className={`field ${errors.email ? "has-error" : ""}`}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className={`field ${errors.password ? "has-error" : ""}`}>
            <label>Password</label>
            <div className="password-row">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="ghost"
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className={`field ${errors.confirm ? "has-error" : ""}`}>
            <label>Confirm Password</label>
            <div className="password-row">
              <input
                type={showPwd2 ? "text" : "password"}
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
              <button
                type="button"
                className="ghost"
                onClick={() => setShowPwd2((s) => !s)}
              >
                {showPwd2 ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirm && (
              <span className="error-text">{errors.confirm}</span>
            )}
          </div>

          <label className={`agree ${errors.agree ? "has-error" : ""}`}>
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setForm({ ...form, agree: e.target.checked })}
            />
            I agree to the Terms & Privacy Policy
          </label>
          {errors.agree && <span className="error-text">{errors.agree}</span>}

          <button
            className={`cta ${role === "admin" ? "admin" : "user"}`}
            type="submit"
          >
            Create account
          </button>
        </form>

        {message && <p className="popup-message">{message}</p>}

        <div className="auth-foot">
          <p>
            Already have an account?{" "}
            <Link className="link" to={`/login?role=${role}`}>
              Sign in
            </Link>
          </p>
          <p className="muted">
            Not {brand}?{" "}
            <button
              className="link ghost"
              onClick={() =>
                navigate(`/register?role=${role === "admin" ? "user" : "admin"}`)
              }
            >
              Switch to {role === "admin" ? "User" : "Admin"} register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
