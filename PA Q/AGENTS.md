# AI Coding Agent Guidelines & Operating Manual (AGENTS.md)
## Java Practice Compiler & Test Bench

> **Target Audience:** AI Coding Assistants (Antigravity, Claude, ChatGPT, Cursor, Copilot) and Human Collaborators.  
> **Rule 0:** Follow this manual strictly to ensure code integrity, prevent regressions, and uphold performance standards.

---

## 1. Core Engineering Principles

1. **Maintain Zero-Regression Integrity:**
   - Always run `node -c app.js` before and after making JavaScript changes.
   - When editing `questions.js`, verify with Node that `window.PROBLEMS` parses with 0 syntax errors and that all question IDs match their keys.
   - Do not break existing DOM IDs and CSS classes used across `app.js` and `style.css`.
2. **Never Break Single-JVM Security & Compilation:**
   - In `server.py` and `TestHarness.java`, student code must be kept in sandboxed execution with clean classloader reloading.
   - Ensure `Main.java` has a `public static void main(String[] args)` or accessible test entry point.
3. **Responsive Visualizer Rule ("No slide rather than longer it"):**
   - Visualizer cards and canvases must expand naturally in vertical height (`height: auto; max-height: none; overflow-y: visible;`).
   - Do **NOT** introduce nested vertical scrollbars inside the canvas wrapper (`.viz-canvas-wrap`). Let the page or card grow vertically.
   - Horizontal scrolling is permitted only for wide grids on smaller viewports (`overflow-x: auto;`).

---

## 2. Codebase Conventions & Guidelines

### 2.1 JavaScript (`app.js`)
- **Vanilla JS & Modular Controllers:**
  - Avoid adding heavy external libraries. CodeMirror 5 extensions are loaded statically via `<script>` tags in `index.html`.
  - Use `escapeHtml()` when interpolating any user-provided or unverified strings into innerHTML templates.
  - Keep visualizer step generation deterministic and immutable (generate fresh state per step rather than mutating previous step arrays).
- **Progress & LocalStorage:**
  - Solved problem IDs are stored in a `Set` backed by `localStorage.getItem("pa_solved_problems")`.
  - Bookmarked IDs are stored in `localStorage.getItem("pa_bookmarked_problems")`.

### 2.2 CSS & Design System (`style.css`)
- **CSS Custom Properties (Variables):**
  - Always use theme tokens (`var(--bg-main)`, `var(--bg-card)`, `var(--text-main)`, `var(--accent)`, `var(--border-color)`) instead of raw hex values so both Dark (Dracula) and Light themes render seamlessly.
- **Micro-Animations & Smooth Physics:**
  - Use cubic-bezier easing `cubic-bezier(0.34, 1.56, 0.64, 1)` for interactive scaling, badge reveals, and card hover states.
  - Visualizer scrubber tracks update via CSS variables `--scrub-percent` dynamically computed in `app.js`.

### 2.3 Backend API (`server.py` & `app.py`)
- **Single-JVM Test Runner:**
  - Student code is written to `Main.java`.
  - Test harness writes test payloads into `tests.txt` delimited by `<<===NEXT_TEST===>>`.
  - Fast JIT flags: `-J-Xms32m -J-Xmx128m -J-XX:+TieredCompilation -J-XX:TieredStopAtLevel=1`.
  - Response format must always adhere to:
    ```json
    {
      "success": true,
      "results": [
        {
          "id": 1,
          "status": "passed",
          "actual": "...",
          "expected": "...",
          "durationMs": 4.2
        }
      ],
      "compilerDurationMs": 140.5
    }
    ```

---

## 3. Question Bank Guidelines (`questions.js`)

When creating or revising a question:
1. **Unique ID & Slugs:** `q<number>_<snake_case_title>` (e.g., `q45_reverse_a_linked_list`).
2. **Mandatory Fields:**
   - `id`, `num`, `title`, `tag`, `category`, `subtitle`
   - `brief` (clear markdown problem description)
   - `inputFormat`, `outputFormat`
   - `starterCode` (well-commented Java boilerplate using standard I/O)
   - `solutionCode` (clean, optimal Java reference solution with Big-O comments)
   - `testCases` (minimum 3-5 comprehensive test cases, including edge bounds)
   - `hints` (array of progressive hints from nudge to algorithmic walkthrough)
3. **Visualizer Mapping:**
   - If adding a step visualizer, ensure `vizStructure` in `app.js` matches the question ID or category.

---

## 4. Testing & Verification Checklist

Before reporting completion on any task:
- [ ] Run `node -c app.js` to ensure zero syntax errors.
- [ ] Verify both Light and Dark themes look visually balanced without contrast clipping.
- [ ] Check console in browser/DevTools for any unhandled exceptions.
- [ ] Test the affected question's test cases in the test bench to confirm compilation and execution pass.
