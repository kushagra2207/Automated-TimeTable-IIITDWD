import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sun, Moon, ArrowRight, AlertCircle } from "lucide-react";
import Logo from "../components/ui/Logo";
import { useTheme } from "../hooks/useTheme";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Animated dot-grid background
function DotGrid() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Grid pattern */}
      <div
        className="dot-pattern"
        style={{ position: "absolute", inset: 0, opacity: 0.5 }}
      />

      {/* Radial gradient mask */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, var(--bg-base) 100%)",
      }} />

      {/* Floating accent orbs */}
      <div style={{
        position: "absolute", top: "15%", left: "20%",
        width: "200px", height: "200px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        animation: "orbit 20s linear infinite",
        transformOrigin: "center",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", right: "15%",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)",
        animation: "orbit 28s linear infinite reverse",
        transformOrigin: "center",
      }} />
    </div>
  );
}

// Floating label input
function FloatingInput({ id, type: initialType, label, value, onChange, required, error }) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = initialType === "password";
  const type = isPassword ? (showPass ? "text" : "password") : initialType;
  const lifted = focused || value.length > 0;

  return (
    <div style={{ position: "relative" }}>
      <label
        htmlFor={id}
        style={{
          position: "absolute",
          left: "14px",
          top: lifted ? "6px" : "50%",
          transform: lifted ? "none" : "translateY(-50%)",
          fontSize: lifted ? "0.67rem" : "0.9rem",
          fontWeight: lifted ? 600 : 400,
          color: error
            ? "var(--error)"
            : focused
            ? "var(--text-accent)"
            : "var(--text-muted)",
          letterSpacing: lifted ? "0.06em" : "0",
          textTransform: lifted ? "uppercase" : "none",
          fontFamily: lifted ? "var(--font-display)" : "var(--font-body)",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        autoComplete={isPassword ? "current-password" : "username"}
        style={{
          width: "100%",
          background: "var(--bg-elevated)",
          border: `1.5px solid ${error ? "var(--error)" : focused ? "var(--accent)" : "var(--border-default)"}`,
          borderRadius: "10px",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          padding: "24px 14px 8px",
          paddingRight: isPassword ? "44px" : "14px",
          outline: "none",
          transition: "all 0.2s ease",
          boxShadow: focused
            ? `0 0 0 3px ${error ? "var(--error-muted)" : "var(--accent-muted)"}`
            : "none",
        }}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPass((v) => !v)}
          tabIndex={-1}
          style={{
            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", display: "flex", alignItems: "center",
            padding: "4px",
          }}
        >
          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid credentials");
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      navigate("/generate");
    } catch (err) {
      setError(err.message);
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "var(--bg-base)",
      fontFamily: "var(--font-body)",
    }}>
      {/* ─── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div
        style={{
          flex: "0 0 48%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px",
          position: "relative",
          overflow: "hidden",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
        }}
        className="login-left-panel"
      >
        <DotGrid />

        {/* Logo */}
        <div className="animate-fade-up" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              padding: "8px",
              background: "var(--accent-muted)",
              borderRadius: "10px",
              border: "1px solid var(--border-default)",
              color: "var(--accent)",
            }}>
              <Logo size={28} />
            </div>
            <div>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--text-primary)",
              }}>
                IIIT DWD
              </span>
              <span style={{
                display: "block", fontFamily: "var(--font-mono)",
                fontSize: "0.62rem", color: "var(--text-muted)",
                letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "-2px",
              }}>
                Scheduler v2
              </span>
            </div>
          </div>
        </div>

        {/* Main pitch */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            className="animate-fade-up delay-100"
            style={{ marginBottom: "24px" }}
          >
            <div className="badge badge-accent" style={{ marginBottom: "16px" }}>
              Academic Year 2024–25
            </div>
            <h1
              className="text-display"
              style={{ color: "var(--text-primary)", marginBottom: "16px", lineHeight: 1.05 }}
            >
              Automated<br />
              <span style={{ color: "var(--text-accent)" }}>Scheduling</span><br />
              for IIIT Dharwad
            </h1>
            <p style={{
              fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              maxWidth: "380px",
            }}>
              Upload course and room data. The constraint solver handles the rest —
              generating clash-free timetables for all batches and faculty in seconds.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="animate-fade-up delay-300"
          style={{ position: "relative", zIndex: 1 }}
        >
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            Indian Institute of Information Technology · Dharwad, Karnataka
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        background: "var(--bg-base)",
      }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="btn btn-ghost btn-sm"
          style={{ position: "absolute", top: "24px", right: "24px" }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Form container */}
        <div
          key={shakeKey}
          className={`animate-fade-up ${error ? "animate-shake" : ""}`}
          style={{
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h2 className="text-heading" style={{ marginBottom: "8px" }}>
              Admin Login
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Sign in to access the timetable generator.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Error */}
            {error && (
              <div
                className="animate-slide-in"
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 14px", borderRadius: "10px",
                  background: "var(--error-muted)", border: "1px solid rgba(248,113,113,0.25)",
                  color: "var(--error)", fontSize: "0.83rem", fontWeight: 500,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <FloatingInput
              id="username"
              type="text"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              error={!!error}
            />

            <FloatingInput
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              error={!!error}
            />

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: "8px", position: "relative", overflow: "hidden" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Authenticating…
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  Sign in
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p style={{
            marginTop: "32px", fontSize: "0.72rem", color: "var(--text-muted)",
            textAlign: "center", lineHeight: 1.6,
          }}>
            Restricted access · IIIT Dharwad administrators only
          </p>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}