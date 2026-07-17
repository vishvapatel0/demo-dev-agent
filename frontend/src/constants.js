export const CATEGORY_ICONS = {
  electronics: "💻",
  accessories: "🎒",
  audio: "🎧",
  storage: "💾",
};

export const LOW_STOCK_THRESHOLD = 5;

// Order summary math is computed client-side since the cart API only returns
// items + subtotal; there's no shipping/tax/discount endpoint to call.
export const TAX_RATE = 0.08;
export const FREE_SHIPPING_THRESHOLD = 75;
export const SHIPPING_FLAT_FEE = 5.99;

