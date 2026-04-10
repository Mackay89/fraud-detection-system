import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../services/api";

const STATUS_COLORS = {
  pending: "var(--text-muted)",
  paid: "var(--success)",
  processing: "var(--accent2)",
  shipped: "var(--accent)",
  delivered: "var(--success)",
  cancelled: "var(--error)",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>📦</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 12 }}>No orders yet</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>Start shopping to see your orders here</p>
            <Link to="/products" className="btn btn-primary">Shop Now</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {orders.map((order) => (
              <div key={order._id} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: 24,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Order ID</p>
                    <p style={{ fontFamily: "monospace", fontSize: 14, color: "var(--text)" }}>#{order._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      display: "inline-block", padding: "4px 12px", borderRadius: 100,
                      fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                      background: `${STATUS_COLORS[order.status]}22`,
                      color: STATUS_COLORS[order.status],
                    }}>
                      {order.status}
                    </span>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                      {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Items preview */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  {order.items.slice(0, 4).map((item) => (
                    <div key={item._id} style={{ position: "relative" }}>
                      <img src={item.image} alt={item.name}
                        style={{ width: 52, height: 52, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }} />
                      {item.quantity > 1 && (
                        <span style={{
                          position: "absolute", top: -6, right: -6,
                          background: "var(--accent)", color: "#0c0c0e",
                          borderRadius: "50%", width: 18, height: 18,
                          fontSize: 10, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{item.quantity}</span>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div style={{
                      width: 52, height: 52, borderRadius: "var(--radius-sm)",
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: "var(--text-muted)",
                    }}>
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--accent)" }}>${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <Link to={`/products`} className="btn btn-outline" style={{ fontSize: 13, padding: "8px 20px" }}>
                    Buy Again
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
