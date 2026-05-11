# Shift-Shaping

<p align="center">
  <img src="wolfie.svg" width="180" alt="Wolfie — the Shift-Shaping mascot" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="shapie.svg" width="180" alt="Shapie — the zen shape-up guide" />
</p>

> *Werewolves shape-shift. We shape software. And just like the full moon comes around fast, we ship even faster.*

We named this project **Shift-Shaping** because great products aren't born — they're *shaped*. Like a werewolf under a full moon, the best ideas transform rapidly from rough sketches into something powerful, alive, and ready to run. The full moon cycle is 29.5 days. We aim to beat that.

This project is inspired by Basecamp's [**Shape Up**](https://basecamp.com/shapeup/0.3-chapter-01#shaping-the-work) methodology — a product development approach where work is *shaped* before it's built. Instead of writing detailed specs or throwing vague ideas over the wall, shaping means defining the key elements of a solution at the right level of abstraction: concrete enough to be actionable, abstract enough to leave room for the builders to work out the details. Shapes have a fixed **appetite** (time budget), a clear **problem** statement, and a rough **solution** sketch — but deliberately leave out pixel-perfect mockups. The result: teams that ship confidently within cycles, not sprints that drag on forever.

---

## Meet the Mascots

**Wolfie** (left) is our friendly neighborhood werewolf. He's a purple, bespectacled shape-up buddy who helps engineers and PMs sculpt rough ideas into shippable products — one bite-sized piece at a time. Don't worry, he only bites scope creep.

**Shapie** (right) is our zen Buddha guide through the Shape Up process. He sits calmly at his desk, tea in hand, helping teams cut rabbit holes, hammer scope, and keep appetite in check. Enlightenment through shipping.

Click on either mascot in the app headers to learn more about them.

---

## Project Structure

```
shift-shaping/
├── wolfie/       — Shopper Agent: AI-powered shopping assistant chat widget
├── shapie/       — Shape-up tool: create, refine, and ship product shapes
├── skill/        — (coming soon)
├── wolfie.svg    — Wolfie illustration
├── shapie.svg    — Shapie illustration
└── README.md
```

---

## wolfie/

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
- **Change UI tab** — chat with an LLM to redesign the interface in real time (colors, typography, layout rules). The LLM can modify CSS custom properties *and* inject arbitrary CSS rules targeting specific elements. All changes persist across sessions.
- Product detail pages with variants, quantity controls, and cart management
- **Shapie integration** — when opened from a Shapie shaping session (`?shapie=<id>`), Wolfie shows a screen recorder and a back-to-Shapie button
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

---

## shapie/

A **Shape Up management tool** for creating, refining, and shipping product shapes — the structured pitches that drive development cycles. Built around the concepts from Basecamp's [Shape Up](https://basecamp.com/shapeup/0.3-chapter-01#shaping-the-work): fixed appetite, problem framing, solution sketching, rabbit-hole identification, and no-gos.

<p align="center">
  <img src="shapie.svg" width="120" alt="Shapie" />
</p>

**Key features:**
- **Shape editor** — create and edit shapes with structured fields: problem, appetite, solution, rabbit holes, no-gos
- **Shaping sessions** — collaborate with an LLM-powered shaping agent that asks probing questions, identifies risks, and helps tighten the pitch
- **Wolfie integration** — launch a live Wolfie prototype directly from a shaping session to explore the UX. Wolfie runs with session context and records screen captures back to Shapie.
- **Status workflow** — track shapes through statuses: Raw → Shaping → Shaped → Review → Accepted / Rejected
- **Report preview** — generate a polished shape-up document ready for stakeholder review
- **GUS work item export** — convert accepted shapes into GUS work items
- **Send to review** — share shapes with reviewers via Slack with one click
- **Slack channel creation** — spin up a dedicated Slack channel per shape for discussion
- **Settings panel** — configure LLM provider, model, Slack integration, and Wolfie connection
- **Persistent storage** — all shapes and config are saved to localStorage

**Tech stack:** React 19, Create React App, CSS custom properties

**Quick start:**
```bash
cd shapie
npm install
npm start        # runs on http://localhost:3100
```

To enable LLM-powered shaping sessions, configure your API key in the Settings panel (gear icon).

---

## Running Both Together

For the full experience (Shapie launching Wolfie with session context), run both apps side by side:

```bash
# Terminal 1
cd wolfie && npm start     # http://localhost:3000

# Terminal 2
cd shapie && npm start     # http://localhost:3100
```

Then in Shapie, open a shape → start a shaping session → click "Launch Wolfie" to open the Wolfie prototype with Shapie context.

### skill/

*Coming soon.* Reserved for future experiments.

---

*Built with caffeine, curiosity, and a werewolf who won't stop shipping.*
