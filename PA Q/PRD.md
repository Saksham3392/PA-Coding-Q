# Product Requirements Document (PRD)
## Java Practice Compiler & Automated Algorithm Test Bench

---

## 1. Executive Summary & Vision

The **Java Practice Compiler & Test Bench** is a modern, high-performance, browser-based coding platform engineered specifically for students, computer science undergraduates, and interview candidates mastering Java and Data Structures & Algorithms (DSA).

### Core Value Proposition
- **Zero Local Configuration:** Instant in-browser Java compilation and automated grading without installing JDK, Maven, or IDEs.
- **Interactive Multi-Step Visualizer:** First-of-its-kind animated step-by-step visualizers covering Arrays, Two Pointers, Linked Lists (Singly, Doubly, Circular), Trees, Graphs, Sorting, Stacks, Queues, Backtracking, and 2D Dynamic Programming Grids.
- **Ultra-Fast Single-JVM Evaluation:** Custom in-memory Java test harness compiles student code once and isolates test executions across classloaders, evaluating complete test suites in under 250ms.
- **Comprehensive Curriculum:** 120+ curated challenges spanning foundational syntax to advanced dynamic programming, graphs, and greedy algorithms.

---

## 2. Target Audience & Personas

| Persona | Needs & Goals | Pain Points Addressed |
| :--- | :--- | :--- |
| **CS / AI Undergraduates** | Coursework practice, lab assignment validation, and exam preparation. | Heavy IDE startup times, difficult testcase debugging, and abstract pointer/DP concepts without visualization. |
| **Interview Prep Candidates** | LeetCode-style Java problem solving, time/space complexity analysis, and edge case mastery. | Lack of clear step-by-step execution traces when algorithmic solutions fail edge cases. |
| **Instructors & Tutors** | Demonstrating algorithms live in class (e.g., LCS table filling, Dijkstra relaxation, cycle detection). | Drawing diagrams on whiteboards is slow and error-prone; static slides don't convey pointer rewiring. |

---

## 3. Product Scope & Functional Requirements

### 3.1 Problem Curriculum & Management
- **120+ Curated Problems:** Categorized into 20+ modules (Basics, 1D Arrays, 2D Arrays/Matrices, Strings, Bit Manipulation, Math, Recursion, Backtracking, Linked Lists, Doubly Linked Lists, Circular Linked Lists, Stacks, Queues, Trees, Binary Search Trees, Graphs, Greedy, Dynamic Programming).
- **Search & Quick Filters:** Instant client-side fuzzy searching across title, tags, and category, with solved/unsolved filter pills.
- **Progress Tracking:** Solved challenge persistence in `localStorage`, per-topic completion counters, and global curriculum progress indicators.
- **Bookmarking & Star Rating:** Ability to bookmark favorite/challenging questions for quick review.

### 3.2 Code Editor & Authoring
- **CodeMirror 5 Engine:** Java syntax highlighting, auto-indentation, bracket matching, auto-closing tags, and auto-completion snippets (`syso`, `fori`, `psvm`, etc.).
- **Code Diagnostics:** Real-time syntax validation, line error gutters, and direct compilation error mapping to editor line numbers.
- **Boilerplate & Reset:** One-click reset to default problem template or scratch pad.
- **Reference Solution & Explanations:** Toggleable reference solutions, time/space Big-O complexity analysis, and progressive multi-level hints.

### 3.3 Test Bench & Compiler Engine
- **Automated Test Cases:** Public sample cases and hidden edge cases (null inputs, empty arrays, maximum bounds, negative values).
- **Custom Input Tester:** Interactive STDIN console to test arbitrary inputs against student code with live stdout/stderr capture.
- **Detailed Execution Metrics:** Millisecond compiler and runtime duration reporting, pass/fail status pills, diff comparisons between expected and actual output.
- **Rate-Limiting & Security:** IP-based request throttling, timeout guards (sub-process execution cutoff), and JVM security manager restrictions preventing disk or network exploitation.

### 3.4 Interactive Algorithm Visualizers
- **Dynamic Programming (2D Table Visualizer):**
  - Interactive grid filling for 0/1 Knapsack, LCS, Coin Change, Subset Sum, Min Cost Path, and Matrix paths.
  - Formula transition cards color-coding cell dependencies (`.target-cell`, `.source-top`, `.source-offset`, `.source-diag`, `.source-left`, `.backtrack-path`).
- **Linked Lists (SLL, DLL, CLL):**
  - Singly Linked List pointer rewiring (`slow`/`fast`, reversal, deletion).
  - Doubly Linked List bidirectional pointers (`prev` / `next`).
  - Circular Linked List loop closing (`last.next -> head`) and cycle detection.
- **Trees & Binary Search Trees:** SVG hierarchical node rendering with recursive call stack frames and visited traversal markers.
- **Graphs:** Interactive nodes and weighted edges showing BFS/DFS queues and Dijkstra path relaxation.
- **Sorting & Two Pointers:** Bar item heights, swap animations, left/right partition lines, and comparison badges.

---

## 4. Non-Functional Requirements (NFRs)

- **Performance:**
  - Client-side initial render under 100ms.
  - Test runner round-trip response under 300ms locally and under 800ms over cloud proxies (excluding cold-starts).
- **Security:**
  - Strict sandboxing: student code cannot access local files, write to disk outside temp sandbox, open sockets, or inspect system properties.
- **Reliability & Availability:**
  - Stateless backend deployment on cloud platforms (Render, Heroku, Docker, Vercel frontend).
  - Automatic fallback message and retry suggestions during cloud container spin-up.
- **Usability & Accessibility:**
  - Dual theme architecture (Light Clean vs Dark Dracula).
  - Responsive visualizers adapting smoothly to desktop, laptop, and tablet widths.

---

## 5. Success Metrics & Roadmap

- **Milestone 1 (Complete):** Core editor, Single-JVM test harness, 120 curriculum questions, and multi-step visualizers.
- **Milestone 2 (Current):** Enhanced 2D DP visualizer with formula cards, responsive list visualizers, and zero-scroll expanding canvas.
- **Milestone 3 (Future):**
  - User accounts and cross-device sync.
  - Custom user problem creation and community test case sharing.
  - AI Code Assistant inline debugging and automated hint generation.
