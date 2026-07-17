import { useEffect, useMemo, useState } from "react";

import { getCart, getProducts, searchProducts } from "./api.js";
import CartPanel from "./components/CartPanel.jsx";
import ProductCard from "./components/ProductCard.jsx";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);

  const refreshCart = () => getCart().then(setCart).catch(() => {});

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setMessage("API unreachable — is the backend running?"));
    refreshCart();
  }, []);

  const onSearch = async (event) => {
    event.preventDefault();
    try {
      const results = query.trim() ? await searchProducts(query.trim()) : await getProducts();
      setProducts(results);
      setCategory("all");
      setMessage(results.length === 0 ? "No products matched your search." : "");
    } catch (err) {
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

  return (
    <div className="layout">
      <nav className="navbar">
        <span className="brand">
          <span className="brand-mark">🛍️</span> ShopLite
        </span>
        <form onSubmit={onSearch} className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
          />
          <button type="submit">Search</button>
        </form>
      </nav>

      <section className="hero">
        <h1>Everything you need, delivered fast.</h1>
        <p>Browse curated picks across electronics, accessories, audio and more.</p>
      </section>

      <div className="categories">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? "active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      {message && <p className="message">{message}</p>}

      <main>
        <section className="grid">
          {visibleProducts.map((p) => (
            <ProductCard key={p.id} product={p} onAdded={refreshCart} />
          ))}
        </section>
      </main>

      <button className="cart-fab" onClick={() => setCartOpen(true)}>
        🛒 Cart
        <span className="badge">{itemCount}</span>
      </button>

      {cartOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setCartOpen(false)} />
          <CartPanel cart={cart} onChanged={refreshCart} onClose={() => setCartOpen(false)} />
        </>
      )}
    </div>
  );
}
