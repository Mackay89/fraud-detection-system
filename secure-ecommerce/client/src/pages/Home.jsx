import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFeatured } from "../services/api";
import ProductCard from "../components/ProductCard";
import { useToast } from "../hooks/useToast.jsx";

const categories = [
  { name: "Electronics", icon: "⚡", slug: "electronics" },
  { name: "Clothing", icon: "👕", slug: "clothing" },
  { name: "Books", icon: "📚", slug: "books" },
  { name: "Home", icon: "🏠", slug: "home" },
  { name: "Sports", icon: "🏋️", slug: "sports" },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    getFeatured()
      .then((res) => setFeatured(Array.isArray(res.data) ? res.data : res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {ToastComponent}

      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,197,71,0.12) 0%, transparent 60%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="container" style={{ position: "relative", zIndex: 1, padding: "120px 24px 80px" }}>
          <div style={{ maxWidth: 680 }}>
            <span className="badge badge-accent" style={{ marginBottom: 24, fontSize: 12 }}>
              Secure • Fast • Reliable
            </span>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 6vw, 5.5rem)",
              lineHeight: 1.05, marginBottom: 24, letterSpacing: "-1px",
            }}>
              Shop with<br />
              <em style={{ color: "var(--accent)", fontStyle: "italic" }}>confidence.</em>
            </h1>
            <p style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              Premium products, zero compromise on security. Your payments and data are always protected.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link to="/products" className="btn btn-primary" style={{ fontSize: 15, padding: "14px 32px" }}>
                Browse Products →
              </Link>
              <Link to="/register" className="btn btn-outline" style={{ fontSize: 15, padding: "14px 32px" }}>
                Create Account
              </Link>
            </div>

            {/* Trust signals */}
            <div style={{ display: "flex", gap: 32, marginTop: 56, flexWrap: "wrap" }}>
              {["🔒 SSL Encrypted", "💳 Stripe Payments", "🚚 Free Shipping $100+"].map((s) => (
                <span key={s} style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: "80px 0", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, marginBottom: 8 }}>Shop by Category</h2>
          <p className="page-subtitle">Find exactly what you're looking for</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "14px 24px", background: "var(--surface)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius)",
                  transition: "all 0.2s", fontSize: 14, fontWeight: 500,
                  textDecoration: "none", color: "var(--text)",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "rgba(232,197,71,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
              >
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, marginBottom: 4 }}>Featured</h2>
              <p style={{ color: "var(--text-muted)" }}>Curated picks this week</p>
            </div>
            <Link to="/products" style={{ color: "var(--accent)", fontSize: 14, fontWeight: 500 }}>View all →</Link>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : featured.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <p style={{ fontSize: 16 }}>No featured products yet.</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>
                Run <code style={{ background: "var(--surface2)", padding: "2px 8px", borderRadius: 4 }}>npm run seed</code> in the server folder to add sample products.
              </p>
            </div>
          ) : (
            <div className="grid-4">
              {featured.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onAddToCart={() => showToast(`${p.name} added to cart! 🛒`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        margin: "0 24px 80px", borderRadius: "var(--radius)",
        background: "linear-gradient(135deg, rgba(232,197,71,0.15) 0%, rgba(240,160,80,0.08) 100%)",
        border: "1px solid rgba(232,197,71,0.25)", padding: "60px 48px",
        textAlign: "center",
      }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 40, marginBottom: 12 }}>
          Ready to start shopping?
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 32 }}>
          Create a free account and get 10% off your first order.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ fontSize: 15, padding: "14px 36px" }}>
          Get Started — It's Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          © 2024 SecureShop. Built with React, Node.js, MongoDB & Stripe.
        </p>
      </footer>
    </div>
  );
}
