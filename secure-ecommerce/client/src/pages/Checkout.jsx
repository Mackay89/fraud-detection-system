import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/api";

export default function Checkout() {
  const { items, subtotal, shipping, tax, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: address, 2: review, 3: success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState({
    fullName: "", address: "", city: "", postalCode: "", country: "",
  });

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const orderItems = items.map((i) => ({
        product: i._id,
        quantity: i.quantity,
      }));

      await createOrder({
        items: orderItems,
        shippingAddress: address,
        paymentResult: {
          id: `sim_${Date.now()}`,
          status: "succeeded",
          email: "simulated@payment.com",
        },
      });

      clearCart();
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, marginBottom: 12 }}>Order Placed!</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>
            Your order has been successfully placed. You'll receive a confirmation shortly.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => navigate("/orders")}>View My Orders</button>
            <button className="btn btn-outline" onClick={() => navigate("/products")}>Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 900 }}>
        <h1 className="page-title">Checkout</h1>

        {/* Steps indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, alignItems: "center" }}>
          {["Shipping", "Review & Pay"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                background: step > i + 1 ? "var(--success)" : step === i + 1 ? "var(--accent)" : "var(--surface2)",
                color: step >= i + 1 ? "#0c0c0e" : "var(--text-muted)",
              }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 14, color: step === i + 1 ? "var(--text)" : "var(--text-muted)", fontWeight: step === i + 1 ? 600 : 400 }}>
                {s}
              </span>
              {i === 0 && <span style={{ color: "var(--border)", margin: "0 8px" }}>→</span>}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40, alignItems: "start" }}>
          <div>
            {step === 1 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 32 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 24 }}>Shipping Address</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { key: "fullName", label: "Full Name", placeholder: "Jane Smith" },
                    { key: "address", label: "Street Address", placeholder: "123 Main St, Apt 4B" },
                    { key: "city", label: "City", placeholder: "New York" },
                    { key: "postalCode", label: "Postal Code", placeholder: "10001" },
                    { key: "country", label: "Country", placeholder: "United States" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label>{label}</label>
                      <input className="input" placeholder={placeholder} required
                        value={address[key]} onChange={e => setAddress(a => ({ ...a, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 24, width: "100%", padding: "14px", fontSize: 15 }}
                  onClick={() => {
                    if (Object.values(address).some(v => !v.trim())) {
                      setError("Please fill in all fields.");
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                >
                  Continue to Review →
                </button>
                {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}
              </div>
            )}

            {step === 2 && (
              <div>
                {/* Shipping address review */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontWeight: 600 }}>Shipping to</h3>
                    <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>
                    {address.fullName}<br />
                    {address.address}<br />
                    {address.city}, {address.postalCode}<br />
                    {address.country}
                  </p>
                </div>

                {/* Items review */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Order Items</h3>
                  {items.map(item => (
                    <div key={item._id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                      <img src={item.image} alt={item.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Qty: {item.quantity}</p>
                      </div>
                      <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Payment note */}
                <div style={{ background: "rgba(76,175,130,0.08)", border: "1px solid rgba(76,175,130,0.2)", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: "var(--success)" }}>
                    🔒 Payment is simulated in this demo. In production, Stripe PaymentElement would appear here.
                  </p>
                </div>

                {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "16px", fontSize: 16 }}
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? "Placing Order…" : `Place Order — $${total.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, position: "sticky", top: 80 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 20 }}>Summary</h3>
            {[
              { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
              { label: "Shipping", value: shipping === 0 ? "Free" : `$${shipping.toFixed(2)}` },
              { label: "Tax", value: `$${tax.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: "var(--text-muted)" }}>
                <span>{label}</span><span style={{ color: "var(--text)" }}>{value}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--accent)" }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
