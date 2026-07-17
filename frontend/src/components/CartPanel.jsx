import { useState } from "react";

import { checkout, removeFromCart, updateCartItem } from "../api.js";
import {
  CATEGORY_ICONS,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT_FEE,
  TAX_RATE,
} from "../constants.js";

function OrderSummary({ cart, placing, onCheckout, orderMessage }) {
  const subtotal = cart.total;
  const discount = 0;
  const shipping = cart.items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : SHIPPING_FLAT_FEE;
  const tax = (subtotal - discount) * TAX_RATE;
  const finalTotal = subtotal - discount + shipping + tax;

  return (
    <aside className="order-summary" aria-label="Order summary">
      <h3>Order summary</h3>
      <dl className="summary-lines">
        <div className="summary-line">
          <dt>Subtotal</dt>
          <dd>${subtotal.toFixed(2)}</dd>
        </div>
        <div className="summary-line">
          <dt>Discount</dt>
          <dd>{discount > 0 ? `−$${discount.toFixed(2)}` : "$0.00"}</dd>
        </div>
        <div className="summary-line">
          <dt>Shipping</dt>
          <dd>{shipping > 0 ? `$${shipping.toFixed(2)}` : "Free"}</dd>
        </div>
        <div className="summary-line">
          <dt>Estimated tax</dt>
          <dd>${tax.toFixed(2)}</dd>
        </div>
      </dl>
      <div className="summary-total">
        <span>Total</span>
        <strong>${finalTotal.toFixed(2)}</strong>
      </div>
      {shipping > 0 && (
        <p className="summary-hint">
          Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping.
        </p>
      )}
      <button
        type="button"
        className="btn-checkout"
        onClick={onCheckout}
        disabled={cart.items.length === 0 || placing}
      >
        {placing ? "Placing order…" : "Proceed to checkout"}
      </button>
      {orderMessage && (
        <p
          className={orderMessage.startsWith("Order") ? "order-confirmation" : "message"}
          role="status"
        >
          {orderMessage}
        </p>
      )}
    </aside>
  );
}

function CartLineItem({ item, product, onChanged, onError }) {
  const [busy, setBusy] = useState(false);
  const stock = product?.stock ?? Infinity;
  const category = product?.category;
  const outOfStock = stock <= 0;
  const atStockLimit = item.quantity >= stock;

  const runAction = async (action) => {
    setBusy(true);
    onError("");
    try {
      await action();
      onChanged();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const increment = () => runAction(() => updateCartItem(item.product_id, item.quantity + 1));
  const decrement = () =>
    runAction(() =>
      item.quantity <= 1
        ? removeFromCart(item.product_id)
        : updateCartItem(item.product_id, item.quantity - 1)
    );
  const remove = () => runAction(() => removeFromCart(item.product_id));

  return (
    <li className="cart-item">
      <span className="cart-item-icon" aria-hidden="true">
        {CATEGORY_ICONS[category] || "🛍️"}
      </span>
      <div className="cart-item-info">
        <span className="name">{item.name}</span>
        {category && <span className="variant">{category}</span>}
        <span className={outOfStock ? "availability out" : "availability"}>
          {outOfStock ? "Out of stock" : "In stock"}
        </span>
        <div className="cart-item-actions">
          <div className="qty-stepper" role="group" aria-label={`${item.name} quantity`}>
            <button
              type="button"
              className="qty-btn"
              onClick={decrement}
              disabled={busy}
              aria-label={`Decrease quantity of ${item.name}`}
            >
              −
            </button>
            <span className="qty-value" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className="qty-btn"
              onClick={increment}
              disabled={busy || outOfStock || atStockLimit}
              aria-label={`Increase quantity of ${item.name}`}
            >
              +
            </button>
          </div>
          <button type="button" className="link" onClick={remove} disabled={busy}>
            Remove
          </button>
        </div>
      </div>
      <span className="cart-item-price">
        <span className="unit-price">${item.price.toFixed(2)} each</span>
        <span className="line-total">${(item.price * item.quantity).toFixed(2)}</span>
      </span>
    </li>
  );
}

export default function CartPanel({ cart, catalogById, onChanged, onClose }) {
  const [orderMessage, setOrderMessage] = useState("");
  const [itemError, setItemError] = useState("");
  const [placing, setPlacing] = useState(false);

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
    <section className="cart" role="dialog" aria-label="Shopping cart">
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
        <div className="cart-layout">
          <ul className="cart-items">
            {cart.items.map((item) => (
              <CartLineItem
                key={item.product_id}
                item={item}
                product={catalogById.get(item.product_id)}
                onChanged={onChanged}
                onError={setItemError}
              />
            ))}
          </ul>
          <OrderSummary
            cart={cart}
            placing={placing}
            onCheckout={placeOrder}
            orderMessage={orderMessage}
          />
        </div>
      )}

      {itemError && (
        <p className="message" role="alert">
          {itemError}
        </p>
      )}
    </section>
  );
}
