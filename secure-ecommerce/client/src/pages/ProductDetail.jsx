import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct } from "../services/api";
import { useCart } from "../context/CartContext";
import { useToast } from "../hooks/useToast.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { showToast, ToastComponent } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    getProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="spinner" /></div>;

  if (!product) return (
    <div className="page" style={{ textAlign: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Product not found.</p>
      <Link to="/products" className="btn btn-outline" style={{ marginTop: 16 }}>Back to Shop</Link>
    </div>
  );

  const stars = "★".repeat(Math.round(product.ratings?.average || 0)) + "☆".repeat(5 - Math.round(product.ratings?.average || 0));

  return (
    <div className="page">
      {ToastComponent}
      <div className="container">
        <Link to="/products" style={{ color: "var(--text-muted)", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
          ← Back to Products
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>
          {/* Image */}
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
            <img src={product.image} alt={product.name} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
          </div>

          {/* Info */}
          <div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
              {product.category}
            </span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1.1, margin: "8px 0 16px" }}>
              {product.name}
            </h1>

            {product.ratings?.count > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span className="stars" style={{ fontSize: 16 }}>{stars}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)</span>
              </div>
            )}

            <div style={{ fontSize: 40, fontFamily: "var(--font-display)", color: "var(--accent)", marginBottom: 24 }}>
              ${product.price.toFixed(2)}
            </div>

            <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 32, fontSize: 15 }}>
              {product.description}
            </p>

            {/* Stock */}
            <div style={{ marginBottom: 24 }}>
              {product.stock > 0 ? (
                <span className="badge badge-success">✓ In Stock ({product.stock} available)</span>
              ) : (
                <span className="badge badge-muted">Out of Stock</span>
              )}
            </div>

            {/* Quantity + Add */}
            {product.stock > 0 && (
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ padding: "12px 16px", background: "transparent", color: "var(--text)", fontSize: 18 }}>−</button>
                  <span style={{ padding: "0 16px", minWidth: 40, textAlign: "center", fontWeight: 600 }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    style={{ padding: "12px 16px", background: "transparent", color: "var(--text)", fontSize: 18 }}>+</button>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: 15, padding: "14px" }}
                  onClick={() => { addItem(product, qty); showToast(`${product.name} added to cart! 🛒`); }}
                >
                  Add to Cart
                </button>
              </div>
            )}

            <Link to="/cart" className="btn btn-outline" style={{ width: "100%", textAlign: "center" }}>
              View Cart →
            </Link>

            {/* Shipping info */}
            <div style={{ marginTop: 32, padding: 20, background: "var(--surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8 }}>
                <div>🚚 Free shipping on orders over $100</div>
                <div>🔒 Secure checkout with Stripe</div>
                <div>↩️ 30-day return policy</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
