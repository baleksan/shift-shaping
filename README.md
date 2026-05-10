# Shift-Shaping

<p align="center">
  <img src="wolfie.svg" width="200" alt="Wolfie — the Shift-Shaping mascot" />
</p>

> *Werewolves shape-shift. We shape software. And just like the full moon comes around fast, we ship even faster.*

We named this project **Shift-Shaping** because great products aren't born — they're *shaped*. Like a werewolf under a full moon, the best ideas transform rapidly from rough sketches into something powerful, alive, and ready to run. The full moon cycle is 29.5 days. We aim to beat that.

---

## Meet Wolfie

Wolfie is our friendly neighborhood werewolf and the mascot of this project. He's a purple, bespectacled shape-up buddy who helps engineers and PMs sculpt rough ideas into shippable products — one bite-sized piece at a time.

Don't worry, he only bites scope creep.

You'll find him in the header of every app we build. Click on him and he'll tell you a bit about himself. He sits at his desk with a laptop and coffee, happily shipping features while the moon rises outside.

---

## Project Structure

```
shift-shaping/
├── wolfie/       — Shopper Agent: AI-powered shopping assistant chat widget
├── skill/        — (coming soon)
├── shapie/       — (coming soon)
└── README.md
```

### wolfie/

A fully interactive **Shopper Agent** prototype — a mobile-friendly chat widget that lets users search for products, get AI-powered explanations, and add items to their cart.

**Key features:**
- Chat widget UI faithful to Salesforce Commerce Messaging (MIAW) components
- Natural language product search with intent detection
- **Cimulate Search API** integration with real product catalogs (Cephora, NTO)
- **AI Product Search** fallback via LLM-generated results
- **Prompt Engine** with 3 customizable prompts:
  - *Explanation* — 3-sentence summary of search results
  - *Best Pick* — selects the single best product with reasoning
  - *Query Reformulations* — generates refinement pills to narrow search
- **Salesforce AI Model Gateway** integration with 13+ models (GPT, Claude, Gemini)
- User-editable prompt templates and settings panel
- Product detail pages with variants, quantity controls, and cart management
- All prompts run in parallel where possible for speed

**Tech stack:** React 19, Create React App, CSS custom properties

**Quick start:**
```bash
cd wolfie
npm install
npm start        # runs on http://localhost:3000
```

To enable AI features, set your gateway key in `.env.local`:
```
REACT_APP_LLM_API_KEY=sk-your-key-here
```

### skill/

*Coming soon.* Reserved for future experiments.

### shapie/

*Coming soon.* Reserved for future experiments.

---

*Built with caffeine, curiosity, and a werewolf who won't stop shipping.*
