import { useState } from "react";

import { addToCart, removeFromCart, updateCartItem } from "../api.js";
import { CATEGORY_ICONS, LOW_STOCK_THRESHOLD } from "../constants.js";

export default function ProductCard({ product, quantityInCart, onAdded }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= LOW_STOCK_THRESHOLD;
  const atStockLimit = quantityInCart >= product.stock;

  const runAction = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const add = () => runAction(() => addToCart(product.id, 1));
  const increment = () => runAction(() => updateCartItem(product.id, quantityInCart + 1));
  const decrement = () =>
    runAction(() =>
      quantityInCart <= 1 ? removeFromCart(product.id) : updateCartItem(product.id, quantityInCart - 1)
    );

  return (
    <article className="card">
      <div className="card-media">
        {CATEGORY_ICONS[product.category] || "🛒"}
        <div className="card-badges">
          {product.category && <span className="tag">{product.category}</span>}
          {outOfStock && <span className="stock-badge out">Sold out</span>}
          {lowStock && <span className="stock-badge low">Low stock</span>}
        </div>
      </div>
      <h3>{product.name}</h3>
      <p className="desc">{product.description}</p>
      <p className="meta">
        <span className="price">${product.price.toFixed(2)}</span>
        <span className="stock">{outOfStock ? "Out of stock" : `${product.stock} in stock`}</span>
      </p>
      {quantityInCart > 0 ? (
        <div className="qty-stepper" role="group" aria-label={`${product.name} quantity`}>
          <button
            type="button"
            className="qty-btn"
            onClick={decrement}
            disabled={busy}
            aria-label={`Decrease quantity of ${product.name}`}
          >
            −
          </button>
          <span className="qty-value" aria-live="polite">
            {quantityInCart}
          </span>
          <button
            type="button"
            className="qty-btn"
            onClick={increment}
            disabled={busy || atStockLimit}
            aria-label={`Increase quantity of ${product.name}`}
          >
            +
          </button>
        </div>
      ) : (
        <button className="btn-add" onClick={add} disabled={busy || outOfStock}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {outOfStock ? "Sold out" : busy ? "Adding…" : "Add to cart"}
        </button>
      )}
      {error && <p className="message" role="alert">{error}</p>}
    </article>
  );
}
