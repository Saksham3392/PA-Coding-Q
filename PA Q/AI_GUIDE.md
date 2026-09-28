# 🤖 AI & Developer Architecture Guide (Java Practice Compiler)

> **Purpose:** This document is designed to immediately orient any AI coding assistant or human developer on the architecture, workflows, data models, and conventions of this codebase so you can debug, modify, or extend it with maximum speed and zero guesswork.

---

## 🏛️ High-Level System Architecture

This repository is an interactive, browser-based **Java Programming Practice Workbench & Automated Test Bench**. It enables students and programmers to solve algorithmic challenges (arrays, strings, matrices, recursion, graphs) in Java directly from the browser with zero local IDE setup.

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Browser Client                         │
 │                                                             │
 │   index.html  ◄──►  style.css  ◄──►  questions.js           │
 │        ▲                                   ▲                │
 │        │                                   │                │
 │        ▼                                   ▼                │
 │   app.js (UI Controller, CodeMirror, Visualizer, Bench)     │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTP POST /api/run
                                │ (JSON: sourceCode + testCases)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                Python Flask Backend (server.py)             │
 │                                                             │
 │   1. Code Sanitization (strips package, wraps drivers)      │
 │   2. Temp Sandbox Creation (/tmp or tempfile)               │
 │   3. Single javac invocation (Main.java + TestHarness.java) │
 │   4. Single java invocation (Single-JVM TestHarness)        │
 │   5. ClassLoader Isolation per test case                    │
 │   6. Regex parsing of stdout <<<START_RESULT:ID>>>          │
 │   7. JSON Response returned to browser client               │
 └─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure & Responsibilities

| File | Purpose | Key Details |
| :--- | :--- | :--- |
| **`server.py`** | **Execution Engine & API Server** | Flask app running at `http://localhost:4060`. Compiles Java solutions using `javac` and executes all test cases inside a **Single-JVM Test Harness** (`TestHarness.java`) with `SandboxSecurityManager` restrictions, IP rate-limiting, and origin-scoped CORS. |
| **`app.py`** | **WSGI Proxy Entry Point** | Cloud-hosting entry point for Render/Heroku/Gunicorn. Imports `app` from `server.py` and binds to `$PORT`. |
| **`app.js`** | **Frontend Application Controller** | ~5,000 lines of client logic: initializes CodeMirror 5, manages active question state, handles syntax diagnostics, controls the SVG Algorithm Visualizer, handles Render cold-start wakeups, native View Transitions, and staggered test case animations. |
| **`questions.js`** | **Curriculum & Question Bank** | Defines `window.PROBLEMS`. Over 120 challenges across 20 categories with starter boilerplate, reference solutions, hints, sample test cases, and hidden edge test cases. |
| **`index.html`** | **Single Page Application UI** | Three-column layout: Left (accordion curriculum list & filters), Center (problem brief, hints, strategy, and algorithm visualizer), Right (CodeMirror editor, test bench matrix, custom runner, console logs). |
| **`style.css`** | **Design System & Stylesheet** | Complete design system supporting Light and Dark (Dracula) themes, responsive layouts, syntax highlighting, animated carets, shimmer skeletons, and smooth scoped animations. |
| **`run.bat`** | **Windows Launcher** | Double-clickable batch file to set port `4060`, open default browser, and run `server.py`. |
| **`Dockerfile`** | **Container Spec** | Production container based on `python:3.11-slim` running as a sandboxed, low-privilege non-root user (`appuser`). |
| **`requirements.txt`**| **Python Dependencies** | `flask`, `flask-cors`, `gunicorn`. |

---

## ⚡ How Code Execution Works (Single-JVM vs Naive Subprocesses)

### Why Single-JVM TestHarness?
In traditional online judges, if a problem has 10 test cases, executing `java Main < in.txt` 10 times launches 10 separate JVM instances. Because each JVM takes ~300–600ms to boot, 10 tests take **3 to 6 seconds**.

In `server.py`, we use an in-memory **`TestHarness.java`**:
1. Student code (`Main.java`) and `TestHarness.java` are compiled **once** using fast JIT flags:
   `-J-Xms32m -J-Xmx128m -J-XX:+TieredCompilation -J-XX:TieredStopAtLevel=1`
2. All test cases are bundled into `tests.txt` separated by `<<===NEXT_TEST===>>`.
3. A **single JVM** process is spawned:
   `java TestHarness tests.txt Main`
4. For each test:
   - Memory streams intercept `System.in` and `System.out`.
   - A new `URLClassLoader` loads the class so **static variable modifications in Test 1 do not contaminate Test 2**.
   - `Main.main(new String[0])` is called via reflection.
   - Execution time is measured in nanoseconds.
   - Structured tokens are emitted:
     ```
     <<<START_RESULT:1>>>
     STATUS:passed
     DURATION:4
     ACTUAL_OUTPUT:
     59
     <<<END_RESULT:1>>>
     ```
5. `server.py` regex parses these tokens and returns clean JSON to `app.js` in **~200ms total**!

---

## 📋 Question Schema Reference (`questions.js`)

When adding or editing challenges in `questions.js`, adhere to this exact schema:

```javascript
window.PROBLEMS["q99_example_problem"] = {
  id: "q99_example_problem",        // Unique key slug
  num: "99",                         // Problem display number (string or number)
  title: "Example Problem Title",    // Full display title
  tag: "1D Arrays",                  // Topic pill (e.g. "Strings", "2D Arrays", "Recursion")
  category: "Arrays in Java",        // Section heading in sidebar accordion
  subtitle: "Technique Focus",       // Short subtext under the title
  brief: `Markdown/Text description of the task, input, and output formats.`,
  inputFormat: "Description of input structure.",
  outputFormat: "Description of expected output.",
  starterCode: `import java.util.*;\nclass Main {\n  public static void main(String[] args) {\n    // Write code here\n  }\n}`,
  solutionCode: `import java.util.*;\nclass Main {\n  public static void main(String[] args) {\n    // Reference solution\n  }\n}`,
  hints: [
    { title: "Hint 1 Title", text: "Hint text (supports <code> tags)" }
  ],
  sampleCases: [
    { id: 1, input: "3\n1 2 3", expected: "6", explanation: "1+2+3 = 6." }
  ],
  edgeCases: [
    { id: 2, input: "0", expected: "0", explanation: "Zero input boundary case." }
  ]
};
```

---

## 🧭 Developer & AI Workflow Guide

### 1. Adding a New Question
1. Open `questions.js`.
2. Insert a new entry under `window.PROBLEMS` conforming to the schema above.
3. Make sure:
   - `input` uses `\n` to represent line breaks.
   - `expected` matches the exact string output of `System.out.println` (whitespace trimmed).
   - `starterCode` provides `class Main` with `public static void main(String[] args)`.

### 2. Modifying Execution Parameters or Security Limits
- Check `server.py`:
  - `FAST_JAVA_FLAGS` and `FAST_JAVAC_FLAGS`: memory and JIT tuning.
  - Subprocess timeouts (`timeout=10` in compilation and run calls) protect against infinite loops.
  - If supporting method-only submissions (like HackerRank style `Result.solve()`), add a driver template in `execute_java_solution()`.

### 3. Modifying Editor or UI Behavior
- Check `app.js`:
  - `initCodeMirror()`: Configures tab size, keymaps, brackets matching, and autocomplete.
  - `parseDiagnostics()`: Regex parser that turns `javac` error output (`Main.java:5: error: ...`) into red wavy underlines and gutter tooltips in CodeMirror.
  - `computeAndRenderVisualizer()`: Visualizer state generator for Arrays, Matrices, and Graphs.
  - `runAllTests()`: Builds payload and initiates `fetch('/api/run')`.

---

## ⚠️ Known Quirks & Common Traps for AI Agents

1. **Package Declarations:**
   - In Java, `package com.foo;` requires compiled `.class` files to be in `com/foo/Main.class`. Because student code is compiled directly in `tmpdir`, package declarations cause `ClassNotFoundException`.
   - `server.py` automatically strips `package ...;` before compiling. **Do not remove this stripping logic.**
2. **Main Class Name Detection:**
   - If a student names their class something other than `Main` (e.g. `class Solution`), `server.py` uses regex `class\s+([A-Za-z0-9_]+)[\s\S]*?public\s+static\s+void\s+main` to dynamically identify the target class name.
3. **URL Hash Routing:**
   - `app.js` reads `window.location.hash` on load (e.g. `#q01_sum_of_all_the_elements_of_an_array` or `#01`). This ensures page refresh retains the student's active question.
4. **Vercel vs Render Cross-Origin API:**
   - If the frontend is hosted on Vercel (`*.vercel.app`), `API_BASE_URL` in `app.js` automatically points to the Render backend (`https://javaprogrammingq.onrender.com`).
   - When running locally via `run.bat` or `python server.py`, `API_BASE_URL` is empty string `""` (same origin).
