import React, { useRef, useState } from 'react';

export default function ProductSearchRecommendations({
  products,
  description,
  suggestedActions,
  onShowProduct,
  onSelectOption,
  onOpenBottomSheet,
}) {
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollToIndex = (index) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cardWidth = container.firstChild?.offsetWidth || 0;
    container.scrollTo({ left: index * (cardWidth + 8), behavior: 'smooth' });
    setCurrentIndex(index);
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cardWidth = container.firstChild?.offsetWidth || 0;
    if (cardWidth > 0) {
      const newIndex = Math.round(container.scrollLeft / (cardWidth + 8));
      setCurrentIndex(newIndex);
    }
  };

  const totalItems = products.length + 1; // +1 for "show more"
  const maxDotsVisible = Math.min(totalItems, 5);

  return (
    <div className="product-recommendations">
      {description && <p className="products-description">{description}</p>}

      <div className="product-carousel-container">
        {products.length > 1 && currentIndex > 0 && (
          <button
            className="carousel-nav-button carousel-nav-left"
            onClick={() => scrollToIndex(currentIndex - 1)}
            aria-label="Previous product"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div
          className="product-carousel"
          ref={carouselRef}
          onScroll={handleScroll}
        >
          {products.map((product) => (
            <button
              key={product.id}
              className={`product-card ${product.isBestPick ? 'best-pick' : ''}`}
              onClick={() => onShowProduct(product)}
              aria-label={product.name}
            >
              {product.isBestPick && (
                <div className="best-pick-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Best Pick
                </div>
              )}
              <div className="product-card-image-container">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="product-card-image"
                  loading="eager"
                />
              </div>
              <div className="product-card-info">
                <div className="product-card-name">{product.name}</div>
                {product.description && (
                  <div className="product-card-description">
                    {product.description}
                  </div>
                )}
                <div className="product-card-price">
                  <span>${product.price?.toFixed(2) || '—'}</span>
                  {product.originalPrice && product.originalPrice !== product.price && (
                    <span className="original-price">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  {product.outOfStock && (
                    <span className="product-card-out-of-stock">Out of Stock</span>
                  )}
                </div>
                {product.isBestPick && product.bestPickReason && (
                  <div className="best-pick-reason">{product.bestPickReason}</div>
                )}
              </div>
            </button>
          ))}
          <button className="show-more-card" aria-label="Show more products">
            <span className="show-more-icon">+</span>
            <span className="show-more-text">Show More</span>
          </button>
        </div>

        {products.length > 1 && currentIndex < totalItems - 1 && (
          <button
            className="carousel-nav-button carousel-nav-right"
            onClick={() => scrollToIndex(currentIndex + 1)}
            aria-label="Next product"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {products.length > 1 && (
        <div className="carousel-dots">
          {Array.from({ length: maxDotsVisible }).map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to product ${i + 1}`}
            />
          ))}
        </div>
      )}

      {suggestedActions && suggestedActions.length > 0 && (
        <div className="suggested-actions">
          {suggestedActions.map((action, idx) => (
            <div key={idx}>
              {action.description && (
                <p className="suggested-actions-description">{action.description}</p>
              )}
              <div className="suggested-actions-buttons">
                {action.options.slice(0, 3).map((option, optIdx) => (
                  <button
                    key={optIdx}
                    className="suggested-action-button"
                    onClick={() =>
                      onSelectOption(
                        option.utterance || option.displayValue,
                        option.isSearchRefinement
                      )
                    }
                  >
                    {option.displayValue}
                  </button>
                ))}
                {action.options.length > 3 && (
                  <button
                    className="suggested-action-button see-more"
                    onClick={() =>
                      onOpenBottomSheet({
                        title: action.description || 'Options',
                        options: action.options,
                        multiSelect: action.multiSelect || false,
                      })
                    }
                  >
                    More options...
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
