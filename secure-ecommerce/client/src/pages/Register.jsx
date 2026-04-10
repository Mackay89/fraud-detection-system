import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password });
      loginUser(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map(e => e.msg).join(". ") : err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link to="/" style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--accent)" }}>SecureShop</Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, marginTop: 24, marginBottom: 8 }}>Create account</h1>
          <p style={{ color: "var(--text-muted)" }}>Join thousands of happy shoppers</p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label>Full name</label>
              <input className="input" type="text" placeholder="Jane Smith" required
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label>Email address</label>
              <input className="input" type="email" placeholder="you@example.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label>Password <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(min. 6 characters)</span></label>
              <input className="input" type="password" placeholder="••••••••" required minLength={6}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label>Confirm password</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15 }} disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, color: "var(--text-muted)", fontSize: 14 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
