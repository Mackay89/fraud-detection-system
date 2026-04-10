import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link to="/" style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--accent)" }}>SecureShop</Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, marginTop: 24, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: "var(--text-muted)" }}>Sign in to your account</p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label>Email address</label>
              <input className="input" type="email" placeholder="you@example.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label>Password</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15 }} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 20, padding: 14, background: "var(--surface2)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Demo credentials:</p>
            <p>Admin: admin@secureshop.com / admin123</p>
            <p>User: jane@example.com / password123</p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, color: "var(--text-muted)", fontSize: 14 }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent)", fontWeight: 500 }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
