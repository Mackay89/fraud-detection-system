import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, shipping, tax, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🛒</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 12 }}>Your cart is empty</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>Add some products to get started</p>
        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Your Cart</h1>
        <p className="page-subtitle">{items.length} item{items.length !== 1 ? "s" : ""}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
          {/* Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map((item) => (
              <div key={item._id} style={{
                display: "flex", gap: 20, alignItems: "center",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: 20,
              }}>
                <img src={item.image} alt={item.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--radius-sm)" }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/products/${item._id}`} style={{ fontWeight: 500, fontSize: 15, display: "block", marginBottom: 4 }}>
                    {item.name}
                  </Link>
                  <p style={{ color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: 18 }}>
                    ${item.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity */}
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    style={{ padding: "8px 14px", background: "transparent", color: "var(--text)", fontSize: 16, cursor: "pointer" }}>−</button>
                  <span style={{ padding: "0 12px", fontWeight: 600, minWidth: 32, textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    style={{ padding: "8px 14px", background: "transparent", color: "var(--text)", fontSize: 16, cursor: "pointer" }}>+</button>
                </div>

                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>${(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item._id)}
                    style={{ background: "transparent", color: "var(--error)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, position: "sticky", top: 80 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 24 }}>Order Summary</h3>

            {[
              { label: "Subtotal", value: subtotal },
              { label: "Shipping", value: shipping, note: shipping === 0 ? "Free!" : null },
              { label: "Tax (10%)", value: tax },
            ].map(({ label, value, note }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 14, color: "var(--text-muted)" }}>
                <span>{label}</span>
                <span style={{ color: note === "Free!" ? "var(--success)" : "var(--text)" }}>
                  {note === "Free!" ? "Free! 🎉" : `$${value.toFixed(2)}`}
                </span>
              </div>
            ))}

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8, display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Total</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--accent)" }}>${total.toFixed(2)}</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", fontSize: 15, padding: "14px" }}
              onClick={() => {
                if (!user) {
                  navigate("/login");
                } else {
                  navigate("/checkout");
                }
              }}
            >
              {user ? "Proceed to Checkout →" : "Login to Checkout"}
            </button>

            {!user && (
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                You need to be logged in to checkout
              </p>
            )}

            <Link to="/products" style={{ display: "block", textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
