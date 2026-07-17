async function request(path, options = {}) {
  const resp = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${resp.status}`);
  }
  return resp.json();
}

export const getProducts = () => request("/api/products");
export const searchProducts = (q) =>
  request(`/api/products/search?q=${encodeURIComponent(q)}`);
export const getCart = () => request("/api/cart");
export const addToCart = (productId, quantity = 1) =>
  request("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
export const updateCartItem = (productId, quantity) =>
  request(`/api/cart/items/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
export const removeFromCart = (productId) =>
  request(`/api/cart/items/${productId}`, { method: "DELETE" });
export const checkout = () => request("/api/orders", { method: "POST" });
