import { useEffect, useMemo, useState } from "react";

import { getCart, getProducts, searchProducts } from "./api.js";
import CartPanel from "./components/CartPanel.jsx";
import ProductCard from "./components/ProductCard.jsx";

export default function App() {
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  const refreshCart = () => {
    getCart().then(setCart).catch(() => {});
    getProducts().then(setCatalog).catch(() => {});
  };

  const loadProducts = () => {
    setStatus("loading");
    getProducts()
      .then((data) => {
        setProducts(data);
        setCatalog(data);
        setMessage("");
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
        setMessage("API unreachable — is the backend running?");
      });
  };

  useEffect(() => {
    loadProducts();
    refreshCart();
  }, []);

  const catalogById = useMemo(
    () => new Map(catalog.map((p) => [p.id, p])),
    [catalog]
  );

  const onSearch = async (event) => {
    event.preventDefault();
    try {
      setStatus("loading");
      const results = query.trim() ? await searchProducts(query.trim()) : await getProducts();
      setProducts(results);
      setCategory("all");
      setMessage("");
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  const categories = useMemo(
    () => ["all", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const visibleProducts = useMemo(
    () => (category === "all" ? products : products.filter((p) => p.category === category)),
    [products, category]
  );

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const cartQuantities = useMemo(
    () => new Map(cart.items.map((item) => [item.product_id, item.quantity])),
    [cart.items]
  );

  return (
    <div className="layout">
      <nav className="navbar">
        <span className="brand">
          <span className="brand-mark">🛍️</span> ShopLite
        </span>
        <form onSubmit={onSearch} className="search" role="search">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            id="product-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
          />
          <button type="submit">Search</button>
        </form>
        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn cart-trigger"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          >
            🛒
            {itemCount > 0 && <span className="badge">{itemCount}</span>}
          </button>
        </div>
      </nav>

      <section className="hero">
        <p className="hero-eyebrow">✨ Curated for you</p>
        <h1>Everything you need, delivered fast.</h1>
        <p>Browse curated picks across electronics, accessories, audio and more.</p>
      </section>

      <div className="categories" role="tablist" aria-label="Product categories">
        {categories.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            className="chip"
            onClick={() => setCategory(c)}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <div className="section-header">
        <h2>{category === "all" ? "Featured products" : category}</h2>
        {status === "ready" && <span className="count">{visibleProducts.length} items</span>}
      </div>

      <main>
        {status === "loading" && (
          <section className="skeleton-grid" aria-label="Loading products">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="skeleton-card" key={i} />
            ))}
          </section>
        )}

        {status === "error" && (
          <div className="state-panel error" role="alert">
            <span className="state-icon">⚠️</span>
            <h3>Something went wrong</h3>
            <p>{message || "Unable to load products."}</p>
            <button onClick={loadProducts}>Try again</button>
          </div>
        )}

        {status === "ready" && visibleProducts.length === 0 && (
          <div className="state-panel">
            <span className="state-icon">🔍</span>
            <h3>No products found</h3>
            <p>Try a different search term or category.</p>
          </div>
        )}

        {status === "ready" && visibleProducts.length > 0 && (
          <section className="grid">
            {visibleProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                quantityInCart={cartQuantities.get(p.id) || 0}
                onAdded={refreshCart}
              />
            ))}
          </section>
        )}
      </main>

      <button
        className="cart-fab"
        onClick={() => setCartOpen(true)}
        aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      >
        🛒 Cart
        <span className="badge">{itemCount}</span>
      </button>

      {cartOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setCartOpen(false)} />
          <CartPanel
            cart={cart}
            catalogById={catalogById}
            onChanged={refreshCart}
            onClose={() => setCartOpen(false)}
          />
        </>
      )}
    </div>
  );
}
