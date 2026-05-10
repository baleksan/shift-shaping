import React, { useState } from 'react';

export default function CartSummary({ cart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-summary">
      {/* Header */}
      <div className="cart-summary-header">
        <div className="cart-summary-title">Your Cart</div>
        <button
          className="cart-summary-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="cart-summary-content"
        >
          <span>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} &middot; ${cart.total.toFixed(2)}
          </span>
          <span className={`caret-icon ${isExpanded ? 'expanded' : ''}`}>
            &#9662;
          </span>
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div id="cart-summary-content">
          {/* Cart Items */}
          <div className="cart-items">
            {cart.items.map((item, idx) => (
              <div key={idx} className="cart-item">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <span className="cart-item-name">{item.name}</span>
                  {item.facets && (
                    <span className="cart-item-facets">
                      {item.facets.map((f) => `${f.label}: ${f.value}`).join(' | ')}
                    </span>
                  )}
                  <span className="cart-item-quantity">Qty: {item.quantity}</span>
                </div>
                <div>
                  <span className="cart-item-price">${item.price.toFixed(2)}</span>
                  {item.originalPrice && item.originalPrice !== item.price && (
                    <div className="cart-item-original-price">
                      ${item.originalPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="cart-totals">
            <div className="cart-totals-row">
              <span>Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            {cart.promotions && (
              <div className="cart-totals-row">
                <span>Promotions</span>
                <span>-${cart.promotions.toFixed(2)}</span>
              </div>
            )}
            <div className="cart-totals-row">
              <span>Shipping</span>
              <span>{cart.shipping === 0 ? 'Free' : `$${cart.shipping.toFixed(2)}`}</span>
            </div>
            <div className="cart-totals-row">
              <span>Tax</span>
              <span>${cart.tax.toFixed(2)}</span>
            </div>
            <div className="cart-totals-row total">
              <span>Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Action */}
      <div className="cart-actions">
        <button className="checkout-button">
          Checkout
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>

      <div className="cart-footer">
        Secure checkout powered by Salesforce Commerce
      </div>
    </div>
  );
}
