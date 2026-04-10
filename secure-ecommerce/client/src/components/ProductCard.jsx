import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, onAddToCart }) {
  const { addItem } = useCart();
  const stars = "★".repeat(Math.round(product.ratings?.average || 0)) +
                "☆".repeat(5 - Math.round(product.ratings?.average || 0));

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product, 1);
    onAddToCart?.();
  };

  return (
    <Link to={`/products/${product._id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "var(--surface2)" }}>
          <img src={product.image} alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
            onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"} />
          {product.featured && <span className="badge badge-accent" style={{ position: "absolute", top: 12, left: 12 }}>Featured</span>}
          {product.stock === 0 && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Out of Stock</span>
            </div>
          )}
        </div>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{product.category}</span>
          <h3 style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: "var(--text)" }}>{product.name}</h3>
          {product.ratings?.count > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="stars">{stars}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>({product.ratings.count})</span>
            </div>
          )}
          <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--accent)" }}>${product.price.toFixed(2)}</span>
            <button className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }} onClick={handleAdd} disabled={product.stock === 0}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
