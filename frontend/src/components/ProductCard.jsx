import { useState } from "react";

import { addToCart } from "../api.js";

export default function ProductCard({ product, onAdded }) {
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      await addToCart(product.id, 1);
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card">
      <h3>{product.name}</h3>
      <p className="desc">{product.description}</p>
      <p className="meta">
        <span className="price">${product.price.toFixed(2)}</span>
        <span className="stock">{product.stock} in stock</span>
      </p>
      <button onClick={add} disabled={busy}>
        {busy ? "Adding…" : "Add to cart"}
      </button>
    </article>
  );
}
