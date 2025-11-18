// src/pages/login.jsx
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useMemo(
    () => new URLSearchParams(location.search).get("role") || "user",
    [location.search]
  );

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const brand = role === "admin" ? "Admin" : "User";

  function validate() {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
  ev.preventDefault();
  if (!validate()) return;

  setLoading(true);
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email: form.email,
      password: form.password,
      role,
    });

    alert("✅ Login successful!");
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    if (res.data.user.role === "admin") {
      navigate("/dashboard/admin");   // ✅ correct path
    } else {
      navigate("/dashboard/user");    // ✅ correct path
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "❌ Login failed. Please try again.");
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="auth-wrap login-bg">
      <div className="auth-card">
        <div className="auth-head">
          <h2>{brand} Login</h2>
          <p>Welcome back! Let’s get you parked faster.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className={`field ${errors.email ? "has-error" : ""}`}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoFocus
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className={`field ${errors.password ? "has-error" : ""}`}>
            <label>Password</label>
            <div className="password-row">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="ghost"
                onClick={() => setShowPwd((s) => !s)}
                aria-label="toggle password visibility"
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className="row-between">
            <label className="remember">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) =>
                  setForm({ ...form, remember: e.target.checked })
                }
              />
              Remember me
            </label>
            <a className="link" href="#" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          <button
            className={`cta ${role === "admin" ? "admin" : "user"}`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="divider"><span>or</span></div>

          <button
            type="button"
            className="outline"
            onClick={() => alert("Google OAuth placeholder")}
          >
            Continue with Google
          </button>
        </form>

        <div className="auth-foot">
          <p>
            New {brand}?{" "}
            <Link to={`/register?role=${role}`} className="link">
              Create an account
            </Link>
          </p>
          <p className="muted">
            Not {brand}?{" "}
            <button
              className="link ghost"
              onClick={() =>
                navigate(`/login?role=${role === "admin" ? "user" : "admin"}`)
              }
            >
              Switch to {role === "admin" ? "User" : "Admin"} login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
