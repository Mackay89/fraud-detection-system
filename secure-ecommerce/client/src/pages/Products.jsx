import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard";
import { useToast } from "../hooks/useToast.jsx";

const CATEGORIES = ["all", "electronics", "clothing", "books", "home", "sports", "other"];
const SORTS = [
  { label: "Newest", value: "-createdAt" },
  { label: "Price: Low → High", value: "price" },
  { label: "Price: High → Low", value: "-price" },
  { label: "Top Rated", value: "-ratings.average" },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const { showToast, ToastComponent } = useToast();

  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "-createdAt";
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    setLoading(true);
    const params = { sort, page, limit: 12 };
    if (category !== "all") params.category = category;
    if (search) params.search = search;

    getProducts(params)
      .then((res) => {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 0 });
      })
      .catch(() => {
        setProducts([]);
        setPagination({ total: 0, page: 1, pages: 0 });
      })
      .finally(() => setLoading(false));
  }, [category, sort, search, page]);

  const update = (key, value) => {
    const p = new URLSearchParams(searchParams);
    p.set(key, value);
    if (key !== "page") p.set("page", "1");
    setSearchParams(p);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    update("search", searchInput);
  };

  return (
    <div className="page">
      {ToastComponent}
      <div className="container">
        <h1 className="page-title">All Products</h1>
        <p className="page-subtitle">{pagination.total || 0} items available</p>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search products…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "12px 20px", fontSize: 14 }}>
            Search
          </button>
          {search && (
            <button type="button" className="btn btn-outline" style={{ padding: "12px 20px", fontSize: 14 }}
              onClick={() => { setSearchInput(""); update("search", ""); }}>
              Clear
            </button>
          )}
        </form>

        {/* Filters row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => update("category", cat)}
                style={{
                  padding: "8px 16px", borderRadius: "100px", fontSize: 13, fontWeight: 500,
                  border: "1.5px solid", cursor: "pointer", transition: "all 0.2s",
                  textTransform: "capitalize",
                  borderColor: category === cat ? "var(--accent)" : "var(--border)",
                  background: category === cat ? "rgba(232,197,71,0.1)" : "transparent",
                  color: category === cat ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
            style={{
              padding: "9px 14px", background: "var(--surface2)",
              border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
              color: "var(--text)", fontSize: 13, fontFamily: "inherit", cursor: "pointer",
            }}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="spinner" />
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No products found</p>
            <p style={{ fontSize: 14 }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid-4">
            {products.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onAddToCart={() => showToast(`${p.name} added to cart! 🛒`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 48 }}>
            <button
              onClick={() => update("page", page - 1)}
              disabled={page === 1}
              className="btn btn-outline"
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              ← Prev
            </button>
            {Array.from({ length: pagination.pages || 0 }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => update("page", p)}
                style={{
                  width: 40, height: 40, borderRadius: "var(--radius-sm)",
                  border: "1.5px solid", fontWeight: 500, fontSize: 14, cursor: "pointer",
                  borderColor: p === page ? "var(--accent)" : "var(--border)",
                  background: p === page ? "rgba(232,197,71,0.1)" : "transparent",
                  color: p === page ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => update("page", page + 1)}
              disabled={page === pagination.pages}
              className="btn btn-outline"
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
