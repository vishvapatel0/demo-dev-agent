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

function buildProductQuery({ minPrice, maxPrice, sort } = {}) {
  const params = new URLSearchParams();
  if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
    params.set("min_price", minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
    params.set("max_price", maxPrice);
  }
  if (sort) {
    params.set("sort", sort);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const getProducts = (options) =>
  request(`/api/products${buildProductQuery(options)}`);
export const searchProducts = (q, options) => {
  const params = new URLSearchParams(buildProductQuery(options).slice(1));
  params.set("q", q);
  return request(`/api/products/search?${params.toString()}`);
};
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
