import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(12,12,14,0.85)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: 32 }}>
        {/* Logo */}
        <Link to="/" style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.5px", color: "var(--accent)" }}>
          SecureShop
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          <Link to="/products" className="btn btn-ghost" style={{ fontSize: 14 }}>Shop</Link>
          {user?.role === "admin" && (
            <Link to="/admin" className="btn btn-ghost" style={{ fontSize: 14 }}>Admin</Link>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Cart */}
          <Link to="/cart" className="btn btn-ghost" style={{ position: "relative", fontSize: 20 }}>
            🛒
            {count > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                background: "var(--accent)", color: "#0c0c0e",
                borderRadius: "50%", width: 18, height: 18,
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{count}</span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link to="/orders" className="btn btn-ghost" style={{ fontSize: 14 }}>
                Hi, {user.name.split(" ")[0]}
              </Link>
              <button className="btn btn-outline" style={{ fontSize: 13, padding: "8px 16px" }} onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/login" className="btn btn-ghost" style={{ fontSize: 14 }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ fontSize: 13, padding: "8px 18px" }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
