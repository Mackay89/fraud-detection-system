import { useEffect, useState } from "react";
import { getProducts, deleteProduct, createProduct, updateProduct } from "../services/api";
import { useToast } from "../hooks/useToast.jsx";

const EMPTY_PRODUCT = { name: "", description: "", price: "", category: "electronics", stock: "", image: "", featured: false };
const CATEGORIES = ["electronics", "clothing", "books", "home", "sports", "other"];

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "create" | {product}
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const load = () => {
    setLoading(true);
    getProducts({ limit: 100 })
      .then(res => setProducts(res.data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_PRODUCT); setModal("create"); };
  const openEdit = (p) => {
    setForm({ ...p, price: p.price, stock: p.stock });
    setModal(p);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (modal === "create") {
        await createProduct(data);
        showToast("Product created! ✅");
      } else {
        await updateProduct(modal._id, data);
        showToast("Product updated! ✅");
      }
      setModal(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      showToast("Product deleted");
      load();
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  return (
    <div className="page">
      {ToastComponent}
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Manage your product catalog</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
          {[
            { label: "Total Products", value: products.length, icon: "📦" },
            { label: "Featured", value: products.filter(p => p.featured).length, icon: "⭐" },
            { label: "Out of Stock", value: products.filter(p => p.stock === 0).length, icon: "⚠️" },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--accent)" }}>{value}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? <div className="spinner" /> : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Product", "Category", "Price", "Stock", "Featured", "Actions"].map(h => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img src={p.image} alt={p.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
                        <span style={{ fontSize: 14, fontWeight: 500, maxWidth: 200 }} title={p.name}>
                          {p.name.length > 30 ? p.name.slice(0, 30) + "…" : p.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span className="badge badge-muted" style={{ textTransform: "capitalize" }}>{p.category}</span>
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: 16 }}>${p.price}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ color: p.stock === 0 ? "var(--error)" : p.stock < 10 ? "var(--accent2)" : "var(--success)", fontWeight: 600, fontSize: 14 }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: 18 }}>{p.featured ? "⭐" : "—"}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => openEdit(p)}>Edit</button>
                        <button style={{ fontSize: 12, padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--error)", background: "transparent", color: "var(--error)", cursor: "pointer" }}
                          onClick={() => handleDelete(p._id, p.name)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 36, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 28 }}>
              {modal === "create" ? "Add New Product" : "Edit Product"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "name", label: "Product Name", type: "text" },
                { key: "price", label: "Price ($)", type: "number" },
                { key: "stock", label: "Stock Quantity", type: "number" },
                { key: "image", label: "Image URL", type: "url" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label>{label}</label>
                  <input className="input" type={type} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}

              <div>
                <label>Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: "capitalize" }}>{c}</option>)}
                </select>
              </div>

              <div>
                <label>Description</label>
                <textarea className="input" rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize: "vertical", minHeight: 80 }} />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                <span>Featured product</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: "13px" }} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Product"}
              </button>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
