import { useEffect, useState } from "react";

import { getCart, getProducts, searchProducts } from "./api.js";
import CartPanel from "./components/CartPanel.jsx";
import ProductCard from "./components/ProductCard.jsx";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

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
      setMessage(results.length === 0 ? "No products matched your search." : "");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="layout">
      <header>
        <h1>🛒 ShopLite</h1>
        <form onSubmit={onSearch} className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {message && <p className="message">{message}</p>}

      <main>
        <section className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdded={refreshCart} />
          ))}
        </section>
        <CartPanel cart={cart} onChanged={refreshCart} />
      </main>
    </div>
  );
}
