import React, { useState } from 'react';

export default function ProductDetails({ product, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState(() => {
    const initial = {};
    if (product.variants) {
      product.variants.forEach((variant) => {
        if (variant.options && variant.options.length > 0) {
          initial[variant.id] = variant.options[0].value;
        }
      });
    }
    return initial;
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product.images || [product.imageUrl];

  const handleVariantClick = (variantId, value) => {
    setSelectedVariants((prev) => ({ ...prev, [variantId]: value }));
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
  };

  return (
    <div className="product-details">
      {/* Image Carousel */}
      <div className="pdp-image-carousel">
        <img src={images[currentImageIndex]} alt={product.name} />
        {images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <button
                className="carousel-nav-button carousel-nav-left"
                onClick={() => setCurrentImageIndex((i) => i - 1)}
                aria-label="Previous image"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            {currentImageIndex < images.length - 1 && (
              <button
                className="carousel-nav-button carousel-nav-right"
                onClick={() => setCurrentImageIndex((i) => i + 1)}
                aria-label="Next image"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="carousel-dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === currentImageIndex ? 'active' : ''}`}
              onClick={() => setCurrentImageIndex(i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Product Content */}
      <div className="pdp-content">
        <h3 className="pdp-title">{product.name}</h3>

        {/* Pricing */}
        <div className="pdp-pricing">
          <span className="pdp-negotiated-price">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice !== product.price && (
            <span className="pdp-original-price">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <span className="pdp-tax-info">Incl. tax</span>

        {/* Description */}
        {product.description && (
          <p className="pdp-description">{product.description}</p>
        )}

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <ul className="pdp-features">
            {product.features.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        )}

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="pdp-variants">
            {product.variants.filter((v) => v.options && v.options.length > 0).map((variant) => (
              <div key={variant.id} className="variant-group">
                <div className="variant-label">
                  <span>{variant.label}:</span>
                  <span className="variant-selected-value">
                    {selectedVariants[variant.id] || ''}
                  </span>
                </div>
                <div className="variant-options">
                  {variant.options.map((option) => {
                    const isSelected = selectedVariants[variant.id] === option.value;

                    if (option.isColor) {
                      return (
                        <button
                          key={option.value}
                          className={`variant-color-button ${isSelected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                          style={{ backgroundColor: option.color }}
                          onClick={() => handleVariantClick(variant.id, option.value)}
                          aria-label={option.value}
                          aria-pressed={isSelected}
                        />
                      );
                    }

                    return (
                      <button
                        key={option.value}
                        className={`variant-button ${isSelected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                        onClick={() => handleVariantClick(variant.id, option.value)}
                        aria-pressed={isSelected}
                      >
                        {option.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity */}
        <div className="pdp-quantity">
          <span className="quantity-label">Quantity:</span>
          <button
            className="quantity-button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="quantity-value">{quantity}</span>
          <button
            className="quantity-button"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={quantity >= 10}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <div className="pdp-actions">
        <button className="add-to-cart-button" onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
