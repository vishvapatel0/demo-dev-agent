import { useEffect, useMemo, useState } from "react";

import { getCart, getProducts, searchProducts } from "./api.js";
import CartPanel from "./components/CartPanel.jsx";
import ProductCard from "./components/ProductCard.jsx";

const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function App() {
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [priceRangeError, setPriceRangeError] = useState("");

  const priceFilterActive = appliedMinPrice !== "" || appliedMaxPrice !== "";

  const refreshCart = () => {
    getCart().then(setCart).catch(() => {});
    getProducts().then(setCatalog).catch(() => {});
  };

  const loadProducts = (overrides = {}) => {
    const options = {
      minPrice: overrides.minPrice ?? appliedMinPrice,
      maxPrice: overrides.maxPrice ?? appliedMaxPrice,
      sort: overrides.sort ?? sortOption,
    };
    const activeQuery = overrides.query ?? query;
    setStatus("loading");
    const request = activeQuery.trim()
      ? searchProducts(activeQuery.trim(), options)
      : getProducts(options);
    request
      .then((data) => {
        setProducts(data);
        setCatalog(data);
        setMessage("");
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "API unreachable — is the backend running?");
      });
  };

  useEffect(() => {
    loadProducts();
    refreshCart();
  }, []);

  const applyPriceFilter = (event) => {
    event.preventDefault();
    const min = minPriceInput.trim();
    const max = maxPriceInput.trim();
    if ((min !== "" && Number(min) < 0) || (max !== "" && Number(max) < 0)) {
      setPriceRangeError("Price can't be negative.");
      return;
    }
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      setPriceRangeError("Minimum price can't be greater than maximum price.");
      return;
    }
    setPriceRangeError("");
    setAppliedMinPrice(min);
    setAppliedMaxPrice(max);
    loadProducts({ minPrice: min, maxPrice: max });
  };

  const clearPriceFilter = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setPriceRangeError("");
    loadProducts({ minPrice: "", maxPrice: "" });
  };

  const onSortChange = (event) => {
    const value = event.target.value;
    setSortOption(value);
    loadProducts({ sort: value });
  };

  const catalogById = useMemo(
    () => new Map(catalog.map((p) => [p.id, p])),
    [catalog]
  );

  const onSearch = (event) => {
    event.preventDefault();
    setCategory("all");
    loadProducts();
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

      <form className="price-filter" onSubmit={applyPriceFilter} aria-label="Filter by price">
        <div className="price-filter-inputs">
          <label htmlFor="min-price" className="sr-only">
            Minimum price
          </label>
          <input
            id="min-price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Min price"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
          />
          <span className="price-filter-sep">–</span>
          <label htmlFor="max-price" className="sr-only">
            Maximum price
          </label>
          <input
            id="max-price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Max price"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
          />
          <button type="submit">Apply</button>
          {priceFilterActive && (
            <button type="button" className="link" onClick={clearPriceFilter}>
              Clear
            </button>
          )}
        </div>

        <label htmlFor="sort-select" className="sort-control">
          <span>Sort by</span>
          <select id="sort-select" value={sortOption} onChange={onSortChange}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </form>

      {priceRangeError && (
        <p className="message price-filter-error" role="alert">
          {priceRangeError}
        </p>
      )}

      {priceFilterActive && !priceRangeError && (
        <div className="active-filters" aria-live="polite">
          <span className="filter-chip">
            Price: {appliedMinPrice !== "" ? `$${Number(appliedMinPrice).toFixed(2)}` : "$0.00"}
            {" – "}
            {appliedMaxPrice !== "" ? `$${Number(appliedMaxPrice).toFixed(2)}` : "Any"}
            <button
              type="button"
              className="filter-chip-remove"
              onClick={clearPriceFilter}
              aria-label="Remove price filter"
            >
              ×
            </button>
          </span>
        </div>
      )}

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
            <button onClick={() => loadProducts()}>Try again</button>
          </div>
        )}

        {status === "ready" && visibleProducts.length === 0 && (
          <div className="state-panel">
            <span className="state-icon">🔍</span>
            <h3>No products found</h3>
            <p>
              {priceFilterActive
                ? "No products match the selected price range. Try widening it or clearing the filter."
                : "Try a different search term or category."}
            </p>
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
