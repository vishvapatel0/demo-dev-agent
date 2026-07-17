import { useState } from "react";

import { checkout, removeFromCart } from "../api.js";

export default function CartPanel({ cart, onChanged, onClose }) {
  const [orderMessage, setOrderMessage] = useState("");
  const [placing, setPlacing] = useState(false);

  const remove = async (productId) => {
    await removeFromCart(productId);
    onChanged();
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const order = await checkout();
      setOrderMessage(`Order #${order.id} confirmed — $${order.total.toFixed(2)}`);
      onChanged();
    } catch (err) {
      setOrderMessage(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <aside className="cart" role="dialog" aria-label="Shopping cart">
      <div className="cart-header">
        <h2>Your cart</h2>
        <button className="cart-close" onClick={onClose} aria-label="Close cart">
          ×
        </button>
      </div>

      {cart.items.length === 0 ? (
        <div className="cart-empty">
          <span className="state-icon">🛒</span>
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <ul>
          {cart.items.map((item) => (
            <li className="cart-item" key={item.product_id}>
              <span className="cart-item-icon" aria-hidden="true">
                🛍️
              </span>
              <span className="cart-item-info">
                <span className="name">{item.name}</span>
                <span className="qty">Qty {item.quantity}</span>
              </span>
              <span className="cart-item-price">
                ${item.price.toFixed(2)}
                <button className="link" onClick={() => remove(item.product_id)}>
                  remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="cart-footer">
        <p className="total">
          Total <strong>${cart.total.toFixed(2)}</strong>
        </p>
        <button
          className="btn-checkout"
          onClick={placeOrder}
          disabled={cart.items.length === 0 || placing}
        >
          {placing ? "Placing order…" : "Checkout"}
        </button>
        {orderMessage && (
          <p
            className={orderMessage.startsWith("Order") ? "order-confirmation" : "message"}
            role="status"
          >
            {orderMessage}
          </p>
        )}
      </div>
    </aside>
  );
}
