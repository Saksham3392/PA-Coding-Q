# Design System & Component Guidelines (DESIGN_SYSTEM.md)
## Java Practice Compiler & Test Bench

> **Philosophy:** Ultra-clean developer workbench aesthetic inspired by Linear, Dracula, and modern IDEs. Optimized for high contrast, rapid visual scanning, fluid transitions, and delightful micro-interactions.

---

## 1. Color Palette & Theming Tokens

The interface implements a strict dual-theme CSS custom property architecture (`:root` for Dark Dracula and `.theme-light` for Clean Studio Light).

### 1.1 Color Tokens

| Variable | Dark Theme (Dracula) | Light Theme (Studio) | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-main` | `#1e1e2e` / `#181825` | `#f8fafc` | Primary canvas & desk background |
| `--bg-card` | `#24273a` / `#1e2030` | `#ffffff` | Elevated cards, sidebars, panes |
| `--bg-card-subtle` | `rgba(255, 255, 255, 0.03)` | `rgba(0, 0, 0, 0.02)` | Inner input boxes, formula math backdrops |
| `--text-main` | `#cad3f5` / `#f8fafc` | `#0f172a` | Primary headings, code, and active items |
| `--text-muted` | `#a5adcb` | `#64748b` | Paragraphs, labels, and metadata |
| `--text-subtle` | `#6e738d` | `#94a3b8` | Disabled text, row index numbers, borders |
| `--border-color` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` | Structural dividers, card borders |
| `--accent` | `#38bdf8` / `#3b82f6` | `#2563eb` | Primary interactive brand color |
| `--accent-hover` | `#60a5fa` | `#1d4ed8` | Interactive hover & focus glow states |

### 1.2 State & Semantic Status Colors

- **Success (Green):** `#10b981` / `#34d399` (`Passed test cases`, `Circular list closed loop`, `Match diag`)
- **Warning / Active (Amber):** `#f59e0b` / `#fbbf24` (`Active scrubber pointer`, `Target DP cell`, `Top stack item`)
- **Danger / Error (Rose/Red):** `#ef4444` / `#f43f5e` (`Failed test cases`, `Compilation error`, `CLL broken loop`)
- **Information / Cyan:** `#0ea5e9` / `#38bdf8` (`Top exclude lookups`, `Head pointers`)
- **Purple / Auxiliary:** `#a855f7` / `#c084fc` (`Offset include lookups`, `DLL prev pointers`)

---

## 2. Typography Hierarchy

The system pairs modern geometric sans for interfaces with clean monospaced typefaces for code and algorithmic representations.

```css
--font-sans: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-display: 'Space Grotesk', var(--font-sans);
--font-mono: 'JetBrains Mono', 'DM Mono', Consolas, monospace;
```

### Hierarchy Breakdown
- **Display Titles (Hero & Headers):** `Space Grotesk`, `700` weight, `-0.02em` letter spacing.
- **Section Headers & UI Labels:** `Manrope`, `600` to `700` weight, `13px` to `15px`.
- **Badges & Mini-Tags:** `JetBrains Mono`, `800` weight, `10px` to `11px`, `uppercase`, `letter-spacing: 0.5px`.
- **Code & Table Values:** `JetBrains Mono`, `700` weight, tabular figures (`font-variant-numeric: tabular-nums`).

---

## 3. Spacing & Elevation

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-full: 9999px;
```

### Elevation & Shadow Layers
- **Subtle Inset (Canvases):** `inset 0 2px 8px rgba(0, 0, 0, 0.25)`
- **Card Surface:** `0 4px 14px rgba(0, 0, 0, 0.15)`
- **Interactive Elevated Hover:** `0 10px 30px -10px rgba(0, 0, 0, 0.35), 0 0 1px 1px rgba(255, 255, 255, 0.05)`
- **Neon Accent Glow:** `0 0 14px rgba(59, 130, 246, 0.55)`

---

## 4. Component Standards

### 4.1 Step-by-Step Visualizer Canvas
- **Wrapper (`.viz-canvas-wrap`):**
  - Subtle dot-matrix radial background (`18px 18px` grid).
  - Vertical height expands naturally: `height: auto; max-height: none; overflow-y: visible; align-items: stretch;`.
  - Horizontal scrolling enabled with slim scrollbars on narrow screens.
- **Scrubber Bar (`.viz-scrubber`):**
  - Smooth slider track with dynamic gradient fill calculated via CSS variable `--scrub-percent`.
  - Spring-scale circular thumb on hover (`transform: scale(1.35)`).

### 4.2 Dynamic Programming (2D Table Visualizer)
- **Cell Dimensions (`.viz-dp-cell`):**
  - `min-width: 42px; height: 40px;` with `5px` border spacing.
  - Numbers centered with bold mono font (`13.5px`).
- **Dedicated Row Headers (`.viz-dp-row-hdr`):**
  - Separate column to ensure row labels never clash or overlap with grid numbers.
- **Formula Decision Card (`.viz-dp-formula-card`):**
  - Math formula pill showing the exact dynamic programming transition (e.g. `dp[i][w] = max(dp[i-1][w], val + dp[i-1][w-wt])`).
  - Color-matched chips corresponding to table cells.

### 4.3 Buttons & Interactive Controls
- **Primary Action Button (`.viz-btn.primary`):**
  - Gradient background: `linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)`.
  - Subtle translateY on hover: `transform: translateY(-2px) scale(1.03)`.
  - Active press depression: `transform: translateY(0) scale(0.97)`.
