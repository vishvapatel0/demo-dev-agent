import { useState } from "react";

import { checkout, removeFromCart } from "../api.js";

export default function CartPanel({ cart, onChanged, onClose }) {
  const [orderMessage, setOrderMessage] = useState("");

  const remove = async (productId) => {
    await removeFromCart(productId);
    onChanged();
  };

  const placeOrder = async () => {
    try {
      const order = await checkout();
      setOrderMessage(`Order #${order.id} confirmed — $${order.total.toFixed(2)}`);
      onChanged();
    } catch (err) {
      setOrderMessage(err.message);
    }
  };

  return (
    <aside className="cart">
      <div className="cart-header">
        <h2>Your cart</h2>
        <button className="cart-close" onClick={onClose} aria-label="Close cart">
          ×
        </button>
      </div>
      {cart.items.length === 0 && <p>Cart is empty.</p>}
      <ul>
        {cart.items.map((item) => (
          <li key={item.product_id}>
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>
              ${item.price.toFixed(2)}
              <button className="link" onClick={() => remove(item.product_id)}>
                remove
              </button>
            </span>
          </li>
        ))}
      </ul>
      <p className="total">
        Total: <strong>${cart.total.toFixed(2)}</strong>
      </p>
      <button onClick={placeOrder} disabled={cart.items.length === 0}>
        Checkout
      </button>
      {orderMessage && <p className="message">{orderMessage}</p>}
    </aside>
  );
}
