import React, { useState, useRef, useEffect, useCallback } from 'react';
import CommerceHeader from './components/CommerceHeader';
import MessageBubble from './components/MessageBubble';
import ProductSearchRecommendations from './components/ProductSearchRecommendations';
import ProductDetails from './components/ProductDetails';
import CartSummary from './components/CartSummary';
import BottomSheet from './components/BottomSheet';
import PromptSettings from './components/PromptSettings';
import { initialConversation, isProductSearchRequest } from './data/mockData';
import { searchProducts } from './services/searchApi';
import { processSearchResults } from './services/promptEngine';

// Unique msg id generator
let nextId = 100;
const uid = () => ++nextId;

// Load config from localStorage, with env-var defaults
const ENV_LLM_KEY = process.env.REACT_APP_LLM_API_KEY || '';

function loadConfig() {
  try {
    const stored = localStorage.getItem('shopperAgentConfig');
    const parsed = stored ? JSON.parse(stored) : {};
    // Migrate: default to cimulate search
    if (!parsed.searchProvider || parsed.searchProvider === 'local' || parsed.searchProvider === 'google_free') {
      parsed.searchProvider = 'cimulate';
    }
    // Auto-populate LLM key from env if not set or if it doesn't look like a key
    if (!parsed.llmApiKey || !parsed.llmApiKey.startsWith('sk-')) {
      if (ENV_LLM_KEY) {
        parsed.llmApiKey = ENV_LLM_KEY;
      }
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveConfig(config) {
  try {
    localStorage.setItem('shopperAgentConfig', JSON.stringify(config));
  } catch {
    // ignore
  }
}

export default function App() {
  const [messages, setMessages] = useState(initialConversation);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [bottomSheet, setBottomSheet] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(loadConfig);
  const [cart, setCart] = useState({ items: [], subtotal: 0, promotions: 0, shipping: 0, tax: 0, total: 0 });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist config
  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  // ------------------------------------------------------------------
  // Core: execute a product search and render results
  // ------------------------------------------------------------------
  const executeSearch = useCallback(async (searchQuery) => {
    const thinkingId = uid();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, sender: 'Agent', type: 'text', content: 'Searching for products...' },
    ]);

    try {
      // 1) Search API
      const searchConfig = {
        provider: config.searchProvider || 'cimulate',
        catalog: config.searchCatalog || 'cephora',
        llmApiKey: config.llmApiKey || undefined,
        llmApiUrl: config.llmApiUrl || undefined,
        llmModel: config.llmModel || undefined,
        maxResults: config.maxResults || 8,
      };
      const { products, source } = await searchProducts(searchQuery, searchConfig);

      // 2) Prompt Engine — process results
      const llmConfig = {
        apiKey: config.llmApiKey || undefined,
        apiUrl: config.llmApiUrl || undefined,
        model: config.llmModel || 'gpt-4o-mini',
      };
      const { explanation, bestPick, reformulations } = await processSearchResults(
        searchQuery,
        products,
        config.prompts || {},
        llmConfig
      );

      // 3) Build suggested actions from reformulations
      const suggestedActions = reformulations && reformulations.length > 0
        ? [{
            description: 'Narrow your search:',
            options: reformulations.map((r) => ({
              displayValue: r.label,
              utterance: r.query,
              isSearchRefinement: true,
            })),
            multiSelect: false,
          }]
        : [];

      // 4) Mark the best pick in the product list
      const productsWithBestPick = products.map((p) => ({
        ...p,
        isBestPick: bestPick?.product?.id === p.id || bestPick?.product?.name === p.name,
        bestPickReason: bestPick?.product?.id === p.id || bestPick?.product?.name === p.name
          ? bestPick.reason
          : undefined,
      }));

      // 5) Replace "thinking" message with explanation + carousel
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingId);
        return [
          ...filtered,
          {
            id: uid(),
            sender: 'Agent',
            type: 'text',
            content: explanation,
          },
          {
            id: uid(),
            sender: 'Agent',
            type: 'productRecommendations',
            content: {
              description: source === 'google'
                ? `Results from Google Shopping:`
                : null,
              products: productsWithBestPick,
              suggestedActions,
            },
          },
        ];
      });
    } catch (err) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingId);
        return [
          ...filtered,
          {
            id: uid(),
            sender: 'Agent',
            type: 'text',
            content: `Sorry, something went wrong while searching: ${err.message}. Please try again.`,
          },
        ];
      });
    }
  }, [config]);

  // ------------------------------------------------------------------
  // Process a user message — detect intent or nudge
  // ------------------------------------------------------------------
  const processUserMessage = useCallback(async (text) => {
    if (!isProductSearchRequest(text)) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            sender: 'Agent',
            type: 'text',
            content:
              "I'm here to help you shop! Try something like:\n" +
              '**\"I want running shoes\"**, **\"buy earbuds\"**, or **\"I\'m looking for gym equipment\"**.',
          },
        ]);
      }, 400);
      return;
    }
    await executeSearch(text);
  }, [executeSearch]);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const addUserMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setMessages((prev) => [
        ...prev,
        { id: uid(), sender: 'EndUser', type: 'text', content: trimmed },
      ]);
      processUserMessage(trimmed);
    },
    [processUserMessage]
  );

  const handleSend = () => {
    addUserMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedAction = useCallback(
    (utterance, isSearchRefinement) => {
      if (isSearchRefinement) {
        // Refinement pill tapped — show it as a user message, then
        // directly execute a search (skip intent detection)
        const trimmed = utterance.trim();
        setMessages((prev) => [
          ...prev,
          { id: uid(), sender: 'EndUser', type: 'text', content: trimmed },
        ]);
        executeSearch(trimmed);
      } else {
        addUserMessage(utterance);
      }
    },
    [addUserMessage, executeSearch]
  );

  const handleShowProduct = (product) => {
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        sender: 'Agent',
        type: 'text',
        content: `Here are the details for **${product.name}**:`,
      },
      {
        id: uid(),
        sender: 'Agent',
        type: 'productDetails',
        content: product,
      },
    ]);
  };

  const handleAddToCart = (product, quantity) => {
    setMessages((prev) => [
      ...prev,
      { id: uid(), sender: 'EndUser', type: 'text', content: `Add ${quantity}x ${product.name} to cart` },
    ]);

    setCart((prev) => {
      const existingIdx = prev.items.findIndex((i) => i.id === product.id);
      let newItems;
      if (existingIdx >= 0) {
        newItems = prev.items.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        newItems = [
          ...prev.items,
          {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            price: product.price,
            originalPrice: product.originalPrice,
            quantity,
            facets: [],
          },
        ];
      }

      const subtotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const tax = +(subtotal * 0.08).toFixed(2);
      const shipping = subtotal >= 75 ? 0 : 7.99;
      const total = +(subtotal + tax + shipping).toFixed(2);
      const newCart = { items: newItems, subtotal, promotions: 0, shipping, tax, total };

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: uid(), sender: 'Agent', type: 'text', content: `Done! I've added **${quantity}x ${product.name}** to your cart.` },
          { id: uid(), sender: 'Agent', type: 'cartSummary', content: newCart },
        ]);
      }, 500);

      return newCart;
    });
  };

  const handleOpenBottomSheet = (cfg) => setBottomSheet(cfg);
  const handleCloseBottomSheet = () => setBottomSheet(null);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (isMinimized) {
    return (
      <div className="widget-minimized" onClick={() => setIsMinimized(false)}>
        <div className="widget-minimized-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="widget-minimized-text">Shopper Agent</span>
      </div>
    );
  }

  return (
    <div className="widget-container">
      <div className="widget-window">
        <CommerceHeader
          title="Shopper Agent"
          onMinimize={() => setIsMinimized(true)}
          onEndChat={() => {
            setMessages(initialConversation);
            setCart({ items: [], subtotal: 0, promotions: 0, shipping: 0, tax: 0, total: 0 });
          }}
          onSettings={() => setShowSettings(true)}
        />

        <div className="messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
              {msg.type === 'text' && (
                <MessageBubble sender={msg.sender} content={msg.content} />
              )}
              {msg.type === 'productRecommendations' && (
                <MessageBubble sender={msg.sender}>
                  <ProductSearchRecommendations
                    products={msg.content.products}
                    description={msg.content.description}
                    suggestedActions={msg.content.suggestedActions}
                    onShowProduct={handleShowProduct}
                    onSelectOption={handleSuggestedAction}
                    onOpenBottomSheet={handleOpenBottomSheet}
                  />
                </MessageBubble>
              )}
              {msg.type === 'productDetails' && (
                <MessageBubble sender={msg.sender}>
                  <ProductDetails product={msg.content} onAddToCart={handleAddToCart} />
                </MessageBubble>
              )}
              {msg.type === 'cartSummary' && (
                <MessageBubble sender={msg.sender}>
                  <CartSummary cart={msg.content} />
                </MessageBubble>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            className="message-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="send-button" onClick={handleSend} disabled={!inputText.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {bottomSheet && (
        <BottomSheet
          title={bottomSheet.title}
          options={bottomSheet.options}
          multiSelect={bottomSheet.multiSelect}
          onSelect={(selected) => { handleSuggestedAction(selected, true); handleCloseBottomSheet(); }}
          onClose={handleCloseBottomSheet}
        />
      )}

      {showSettings && (
        <PromptSettings
          config={config}
          onConfigChange={handleConfigChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
