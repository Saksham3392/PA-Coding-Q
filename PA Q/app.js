/**
 * ==============================================================================
 * Java Practice Compiler & Test Bench - Client Controller (app.js)
 * ==============================================================================
 *
 * Overview:
 * ---------
 * This script serves as the master client-side controller. It manages:
 * 1. State Management:
 *    - Current active problem ID (synchronized with URL hash & localStorage).
 *    - Solved problem IDs (persisted in localStorage).
 *    - Starred / Bookmarked problems (persisted in localStorage).
 *    - Practice stopwatch timer per question.
 * 2. Editor & Code Sandbox:
 *    - CodeMirror 5 instance setup with Java syntax highlighting (clike).
 *    - Dracula & Light theme toggling.
 *    - Custom smooth animated caret and active line highlighting.
 *    - Java snippet auto-expansion (sout, psvm, scanner, etc.).
 *    - Dynamic compilation diagnostics (error gutter markers & squiggles).
 * 3. Question Bank UI:
 *    - Accordion curriculum sidebar with search filtering & filter pills.
 *    - Dynamic problem brief formatting (keyword highlights, I/O specs).
 *    - Complexity badges (Big-O time/space) and Strategy explanations.
 *    - Canonical reference solution modal with syntax highlighting.
 * 4. Interactive Visualizer:
 *    - Dynamic SVG canvas rendering for Arrays, 2D Matrices, Graphs, Trees.
 *    - Step-by-step playback controls (Play, Pause, Step Next, Step Prev).
 * 5. Test Bench & Execution Engine:
 *    - Dispatches code and test cases to backend `/api/run`.
 *    - Real-time test results matrix with pass/fail badges & execution timers.
 *    - Visual diff viewer comparing Expected vs. Actual output.
 *    - Custom test case runner.
 *    - Canvas particle effects (Confetti on all-pass, glowing embers on error).
 * ==============================================================================
 */
const PROBLEMS = window.PROBLEMS || {};

// Normalize all problem schemas and balance sample cases for rich multi-example showcase
Object.values(PROBLEMS).forEach((prob) => {
  if (prob) {
    if (!prob.solutionCode && prob.solution) prob.solutionCode = prob.solution;
    if (!prob.solution && prob.solutionCode) prob.solution = prob.solutionCode;
    if (!Array.isArray(prob.sampleCases)) prob.sampleCases = [];
    if (!Array.isArray(prob.edgeCases)) prob.edgeCases = [];
    if (!Array.isArray(prob.hints)) prob.hints = [];

    // Balance sample cases so students always see 2 to 3 prominent examples with 💡 Explanations
    if (prob.sampleCases.length === 1 && prob.edgeCases.length >= 2) {
      const needed = Math.min(2, prob.edgeCases.length - 1);
      const promoted = prob.edgeCases.splice(0, needed);
      prob.sampleCases.push(...promoted);
    } else if (prob.sampleCases.length === 2 && prob.edgeCases.length >= 3) {
      const promoted = prob.edgeCases.splice(0, 1);
      prob.sampleCases.push(...promoted);
    }
  }
});

// Active Question Persistence Key & Helpers
const ACTIVE_PROBLEM_STORAGE_KEY = "java_bench_active_problem";

function getInitialProblemId() {
  try {
    // 1. Check URL hash first (allows direct deep linking, bookmarks, and refresh persistence)
    if (typeof window !== "undefined" && window.location && window.location.hash) {
      let rawHash = window.location.hash.replace(/^#/, "").split("?")[0].trim();
      try {
        rawHash = decodeURIComponent(rawHash);
      } catch (e) {}
      if (rawHash) {
        if (PROBLEMS && PROBLEMS[rawHash]) {
          return rawHash;
        }
        // Support short number hash format, e.g. #15 or #q15
        const numMatch = rawHash.match(/^(?:q)?(\d+)$/i);
        if (numMatch && PROBLEMS) {
          const targetNum = parseInt(numMatch[1], 10);
          const match = Object.values(PROBLEMS).find(
            (p) => p && (p.num === targetNum || String(p.num) === String(targetNum)),
          );
          if (match) return match.id;
        }
      }
    }

    // 2. Check localStorage for previously active question
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(ACTIVE_PROBLEM_STORAGE_KEY);
      if (saved && PROBLEMS && PROBLEMS[saved]) {
        return saved;
      }
    }
  } catch (e) {
    console.warn("Could not retrieve initial problem ID:", e);
  }

  // 3. Fallback to first problem in PROBLEMS
  if (PROBLEMS && Object.keys(PROBLEMS).length > 0) {
    return Object.keys(PROBLEMS)[0];
  }
  return "q01_sum_of_all_the_elements_of_an_array";
}

function saveActiveProblem(probId) {
  try {
    if (probId && typeof localStorage !== "undefined") {
      localStorage.setItem(ACTIVE_PROBLEM_STORAGE_KEY, probId);
    }
  } catch (e) {}
}

let currentProblemId = getInitialProblemId();
let isRunning = false;
let compilerReady = false;
let cmEditor = null;
let testResultsMap = new Map(); // id -> result object
const solvedProblems = new Set(); // Track solved problem IDs
const SOLVED_STORAGE_KEY = "java_bench_solved_questions";

function loadSolvedProgress() {
  try {
    const raw = localStorage.getItem(SOLVED_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => {
          if (PROBLEMS && PROBLEMS[id]) {
            solvedProblems.add(id);
          }
        });
        saveSolvedProgress();
      }
    }
  } catch (e) {}
}

function saveSolvedProgress() {
  try {
    localStorage.setItem(
      SOLVED_STORAGE_KEY,
      JSON.stringify(Array.from(solvedProblems)),
    );
  } catch (e) {}
}

// Global Starred Problems State & Storage
const STARRED_PROBLEMS = new Set();
const STARRED_STORAGE_KEY = "java_bench_starred_questions";

function loadStarredProgress() {
  try {
    const raw = localStorage.getItem(STARRED_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => {
          if (id !== null && id !== undefined && String(id).trim().length > 0) {
            STARRED_PROBLEMS.add(String(id).trim());
          }
        });
      }
    }
  } catch (e) {
    console.warn("Could not load starred problems from storage:", e);
  }
}

function saveStarredProgress() {
  try {
    localStorage.setItem(
      STARRED_STORAGE_KEY,
      JSON.stringify(Array.from(STARRED_PROBLEMS)),
    );
  } catch (e) {
    console.warn("Could not save starred problems to storage:", e);
  }
}

function isProblemStarred(prob) {
  if (!prob) return false;
  const id = typeof prob === "string" ? prob : prob.id;
  const num =
    typeof prob === "object" && prob.num !== undefined
      ? String(prob.num).trim()
      : null;
  return (
    (id && STARRED_PROBLEMS.has(String(id).trim())) ||
    (num &&
      (STARRED_PROBLEMS.has(num) ||
        STARRED_PROBLEMS.has(String(parseInt(num, 10)))))
  );
}

function toggleProblemStarred(problemId, triggerAnimation = true) {
  const prob = PROBLEMS[problemId];
  if (!prob) return;
  const currentlyStarred = isProblemStarred(prob);
  const nextStarred = !currentlyStarred;

  if (nextStarred) {
    STARRED_PROBLEMS.add(prob.id);
  } else {
    STARRED_PROBLEMS.delete(prob.id);
    if (prob.num !== undefined) {
      STARRED_PROBLEMS.delete(String(prob.num).trim());
      STARRED_PROBLEMS.delete(String(parseInt(prob.num, 10)));
    }
  }

  saveStarredProgress();

  if (prob.id === currentProblemId) {
    renderHeroStarButton(nextStarred, prob.id, triggerAnimation && nextStarred);
  }

  renderProblemNavList();

  showToast(
    nextStarred
      ? `★ Added "${prob.title}" to Starred list`
      : `☆ Removed "${prob.title}" from Starred list`,
  );
}

function renderHeroStarButton(isStarred, probId, animate = false) {
  let btn = document.getElementById("btn-star-toggle");
  if (!btn) {
    const titleElem = document.querySelector(".hero-title");
    if (!titleElem) return;
    let row = titleElem.closest(".hero-title-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "hero-title-row";
      titleElem.parentNode.insertBefore(row, titleElem);
      row.appendChild(titleElem);
    }
    btn = document.createElement("button");
    btn.id = "btn-star-toggle";
    btn.className = "hero-star-btn";
    btn.type = "button";
    row.appendChild(btn);
  }

  btn.setAttribute("data-problem-id", probId);
  btn.setAttribute("aria-pressed", isStarred ? "true" : "false");
  btn.setAttribute(
    "aria-label",
    isStarred ? "Unstar this question" : "Star this question",
  );
  btn.setAttribute(
    "title",
    isStarred
      ? "Starred! Click to remove from Starred list"
      : "Bookmark / Star this question",
  );

  if (isStarred) {
    btn.classList.add("starred");
    btn.innerHTML = `
      <svg class="star-icon star-filled" width="22" height="22" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `;
    if (animate) {
      btn.classList.remove("star-anim-pop");
      void btn.offsetWidth; // trigger reflow
      btn.classList.add("star-anim-pop");
    }
  } else {
    btn.classList.remove("starred");
    btn.classList.remove("star-anim-pop");
    btn.innerHTML = `
      <svg class="star-icon star-outline" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `;
  }
}

// ==========================================
// Practice Stopwatch & Per-Question Timer Component
// ==========================================
const TIMER_STORAGE_KEY = "java_bench_timer_data";

const practiceTimer = {
  container: null,
  displayElem: null,
  toggleBtn: null,
  resetBtn: null,

  currentProblemId: null,
  elapsedSeconds: 0,
  isRunning: false,
  timerInterval: null,
  lastTickTimestamp: 0,
  savedTimes: {}, // problemId -> seconds

  init() {
    this.container = document.getElementById("hero-practice-timer");
    this.displayElem = document.getElementById("practice-timer-display");
    this.toggleBtn = document.getElementById("btn-timer-toggle");
    this.resetBtn = document.getElementById("btn-timer-reset");

    this.loadAllSavedTimes();

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.reset();
      });
    }

    // Save on beforeunload
    window.addEventListener("beforeunload", () => {
      this.saveCurrentTime();
    });

    // Initialize for the current problem
    if (typeof currentProblemId !== "undefined" && currentProblemId) {
      this.switchProblem(currentProblemId);
    }
  },

  loadAllSavedTimes() {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          this.savedTimes = parsed;
        }
      }
    } catch (e) {
      this.savedTimes = {};
    }
  },

  saveAllTimes() {
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(this.savedTimes));
    } catch (e) {}
  },

  saveCurrentTime() {
    if (this.currentProblemId) {
      this.savedTimes[this.currentProblemId] = this.elapsedSeconds;
      this.saveAllTimes();
    }
  },

  formatTime(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    const pad = (n) => String(n).padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  },

  updateDisplay() {
    if (this.displayElem) {
      this.displayElem.textContent = this.formatTime(this.elapsedSeconds);
      this.displayElem.setAttribute(
        "title",
        this.isRunning
          ? "Elapsed practice time on this problem"
          : "Practice stopwatch (starts automatically when you type)",
      );
    }
    if (this.container) {
      if (this.isRunning) {
        this.container.classList.add("is-running");
        this.container.classList.remove("is-paused");
      } else {
        this.container.classList.add("is-paused");
        this.container.classList.remove("is-running");
      }
    }
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute(
        "aria-label",
        this.isRunning ? "Pause timer" : "Start timer",
      );
      this.toggleBtn.setAttribute(
        "title",
        this.isRunning
          ? "Pause timer"
          : "Start timer (or start typing in editor)",
      );
      if (this.isRunning) {
        this.toggleBtn.innerHTML = `
          <svg class="icon-pause" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>
        `;
      } else {
        this.toggleBtn.innerHTML = `
          <svg class="icon-play" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="6 4 20 12 6 20 6 4"></polygon>
          </svg>
        `;
      }
    }
  },

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTimestamp = Date.now();
    this.updateDisplay();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.floor((now - this.lastTickTimestamp) / 1000);
      if (deltaSec >= 1) {
        this.elapsedSeconds += deltaSec;
        this.lastTickTimestamp += deltaSec * 1000;
        this.updateDisplay();
        if (this.currentProblemId) {
          this.savedTimes[this.currentProblemId] = this.elapsedSeconds;
          this.saveAllTimes();
        }
      }
    }, 1000);
  },

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.saveCurrentTime();
    this.updateDisplay();
  },

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  },

  reset() {
    this.elapsedSeconds = 0;
    this.lastTickTimestamp = Date.now();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
    this.saveCurrentTime();
    this.updateDisplay();
  },

  resetAll() {
    this.savedTimes = {};
    this.elapsedSeconds = 0;
    this.lastTickTimestamp = Date.now();
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (e) {}
    this.updateDisplay();
  },

  switchProblem(newProbId) {
    if (!newProbId) return;

    // Save current problem's time before switching
    if (this.currentProblemId && this.currentProblemId !== newProbId) {
      this.saveCurrentTime();
    }

    // Stop current ticker
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.currentProblemId = newProbId;

    // Retrieve saved time for new question
    const saved = this.savedTimes[newProbId];
    this.elapsedSeconds =
      typeof saved === "number" && !isNaN(saved) && saved >= 0 ? saved : 0;

    // Start in paused/waiting state until user begins writing code or clicks play
    this.isRunning = false;
    this.updateDisplay();
  },

  getFormattedTime() {
    return this.formatTime(this.elapsedSeconds);
  },

  onProblemSolved() {
    this.pause();
  },
};

// DOM Elements
const problemListNav = document.getElementById("problem-list-nav");
const codeTextarea = document.getElementById("code-editor");
const editorBody = document.getElementById("editor-body");
const btnRunTests = document.getElementById("btn-run-tests");
const runBtnText = document.getElementById("run-btn-text");
const runBtnSpinner = document.getElementById("run-btn-spinner");
const btnResetCode = document.getElementById("btn-reset-code");
const btnCopyCode = document.getElementById("btn-copy-code");
const copyBtnText = document.getElementById("copy-btn-text");
const compilerStatusBadge = document.getElementById("compiler-status-badge");
const compilerStatusDot = document.getElementById("compiler-status-dot");
const compilerStatusText = document.getElementById("compiler-status-text");
const btnResetProgress = document.getElementById("btn-reset-progress");
const summaryCard = document.getElementById("summary-card");
const summaryTitle = document.getElementById("summary-title");
const summarySubtitle = document.getElementById("summary-subtitle");
const sampleTestcaseList = document.getElementById("sample-testcase-list");
const edgeTestcaseList = document.getElementById("edge-testcase-list");
const diffDetailsSection = document.getElementById("diff-details-section");
const diffDetailsList = document.getElementById("diff-details-list");
const compilerLogsContent = document.getElementById("compiler-logs-content");
const btnClearLogs = document.getElementById("btn-clear-logs");
const toast = document.getElementById("toast");
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const toggleSamplesBtn = document.getElementById("toggle-samples-btn");
const samplesTableContent = document.getElementById("samples-table-content");
const btnToggleSolution = document.getElementById("btn-toggle-solution");
const solutionContainer = document.getElementById("solution-container");
const btnLoadSolution = document.getElementById("btn-load-solution");
const customInputBox = document.getElementById("custom-input-box");
const btnRunCustom = document.getElementById("btn-run-custom");
const customResultCard = document.getElementById("custom-result-card");
const customResStdout = document.getElementById("custom-res-stdout");
const customResExpected = document.getElementById("custom-res-expected");
const customResTime = document.getElementById("custom-res-time");
const customResStatusBanner = document.getElementById(
  "custom-res-status-banner",
);

// ==========================================
// Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const initialId = getInitialProblemId();
  if (PROBLEMS && PROBLEMS[initialId]) {
    currentProblemId = initialId;
  } else if (!PROBLEMS[currentProblemId] && Object.keys(PROBLEMS).length > 0) {
    currentProblemId = Object.keys(PROBLEMS)[0];
  }

  saveActiveProblem(currentProblemId);
  if (typeof history !== "undefined" && history.replaceState) {
    try {
      history.replaceState(null, "", "#" + currentProblemId);
    } catch (e) {}
  }

  loadSolvedProgress();
  loadStarredProgress();
  initTheme();
  initCodeMirror();
  renderProblemNavList();
  loadSavedCodeOrBoilerplate();
  updateProblemView();
  if (typeof practiceTimer !== "undefined" && practiceTimer.init) {
    practiceTimer.init();
  }
  setupEventListeners();
  checkCompilerStatus();

  // Scroll active item into view and focus editor
  setTimeout(() => {
    const activeItem = problemListNav
      ? problemListNav.querySelector(`.problem-nav-item.active`)
      : null;
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    if (cmEditor) {
      cmEditor.refresh();
      cmEditor.focus();
    }
  }, 120);
});

// ==========================================
// CodeMirror Colorful Editor Setup
// ==========================================
function initCodeMirror() {
  if (typeof CodeMirror === "undefined") {
    console.warn("CodeMirror script not ready, using enhanced textarea");
    setupFallbackTextarea();
    return;
  }

  try {
    cmEditor = CodeMirror.fromTextArea(codeTextarea, {
      mode: "text/x-java",
      theme: "dracula",
      lineNumbers: true,
      tabSize: 4,
      indentUnit: 4,
      indentWithTabs: false,
      autoCloseBrackets: "()[]{}''\"\"",
      matchBrackets: true,
      lineWrapping: true,
      autofocus: true,
      extraKeys: {
        "Ctrl-Space": "autocomplete",
        "Ctrl-Enter": () => runAllTests(),
        "Cmd-Enter": () => runAllTests(),
        "Ctrl-.": () => toggleSolutionVisibility(),
        "Cmd-.": () => toggleSolutionVisibility(),
        "Ctrl-Period": () => toggleSolutionVisibility(),
        "Cmd-Period": () => toggleSolutionVisibility(),
        "Ctrl-/": (cm) => toggleComment(cm),
        "Cmd-/": (cm) => toggleComment(cm),
        Tab: (cm) => {
          if (!cm.somethingSelected() && tryExpandSnippet(cm)) {
            return;
          }
          if (cm.somethingSelected()) {
            cm.indentSelection("add");
          } else {
            cm.replaceSelection("    ", "end");
          }
        },
      },
    });

    // Capture Ctrl + . directly on CodeMirror keydown event
    cmEditor.on("keydown", (cm, e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "." ||
          e.key === "Decimal" ||
          e.code === "Period" ||
          e.code === "NumpadDecimal" ||
          e.keyCode === 190 ||
          e.which === 190 ||
          e.keyCode === 110 ||
          e.which === 110)
      ) {
        e.preventDefault();
        e.stopPropagation();
        toggleSolutionVisibility();
        return;
      }
    });

    // Auto-save code on change and trigger run button pulse
    cmEditor.on("change", (cm, changeObj) => {
      if (typeof editorDiagnostics !== "undefined") {
        editorDiagnostics.clear();
      }
      // Auto-start timer on first user keystroke / code edit (ignore programmatic setValue)
      if (changeObj && changeObj.origin !== "setValue") {
        if (typeof practiceTimer !== "undefined" && !practiceTimer.isRunning) {
          practiceTimer.start();
        }
      }
      saveCodeToStorage();
      const runBtn = document.getElementById("btn-run-tests");
      if (runBtn && !runBtn.disabled) {
        runBtn.classList.add("btn-pulse-ready");
      }
    });

    // Initialize diagnostic hover tooltips on editor
    setTimeout(() => {
      if (typeof editorDiagnostics !== "undefined") {
        editorDiagnostics.initHover();
      }
    }, 50);

    // Focus editor when clicking anywhere on wrapper
    editorBody.addEventListener("click", () => {
      if (cmEditor) cmEditor.focus();
    });

    // Custom Java Hint with rich snippets support (fori, scan, sout, psvm, list, map, set, pq, etc.)
    if (CodeMirror.registerHelper) {
      CodeMirror.registerHelper("hint", "java", function (editor, options) {
        const cur = editor.getCursor();
        const line = editor.getLine(cur.line);
        let start = cur.ch;
        let end = cur.ch;
        while (start && /[\w$]/.test(line.charAt(start - 1))) --start;
        while (end < line.length && /[\w$]/.test(line.charAt(end))) ++end;
        const word = line.slice(start, cur.ch);
        const wLower = word.toLowerCase();

        const list = [];
        const from = CodeMirror.Pos(cur.line, start);
        const to = CodeMirror.Pos(cur.line, end);

        // Check if matching any snippet prefix
        Object.entries(JAVA_SNIPPETS).forEach(([key, snip]) => {
          if (key.startsWith(wLower) && wLower.length > 0) {
            list.push({
              text: snip.body,
              displayText: `${snip.label} → ${snip.desc}`,
              className: "cm-hint-snippet",
              render: function (elt, data, cur) {
                const wrapper = document.createElement("div");
                wrapper.className = "cm-hint-item-wrap";

                const left = document.createElement("div");
                left.className = "cm-hint-item-left";

                const icon = document.createElement("span");
                icon.className = "cm-hint-icon cm-hint-icon-snip";
                icon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;

                const name = document.createElement("span");
                name.className = "cm-hint-name";
                name.textContent = snip.label;

                left.appendChild(icon);
                left.appendChild(name);

                const right = document.createElement("div");
                right.className = "cm-hint-item-right";

                const desc = document.createElement("span");
                desc.className = "cm-hint-desc";
                desc.textContent = snip.desc;

                right.appendChild(desc);

                wrapper.appendChild(left);
                wrapper.appendChild(right);
                elt.appendChild(wrapper);
              },
              hint: function (cm) {
                cm.replaceRange(snip.body, from, to);
                if (snip.body.includes("\n")) {
                  cm.setCursor({ line: from.line + 1, ch: 4 });
                } else if (key === "sout") {
                  cm.setCursor({ line: from.line, ch: from.ch + 20 });
                } else {
                  cm.setCursor({
                    line: from.line,
                    ch: from.ch + snip.body.length,
                  });
                }
              },
            });
          }
        });

        // Standard anyword completion merge
        if (CodeMirror.hint.anyword) {
          const anywordResult = CodeMirror.hint.anyword(editor, options);
          if (anywordResult && anywordResult.list) {
            anywordResult.list.forEach((item) => {
              if (
                item !== word &&
                !list.some((l) => (typeof l === "string" ? l : l.text) === item)
              ) {
                list.push({
                  text: item,
                  displayText: item,
                  className: "cm-hint-word",
                  render: function (elt, data, cur) {
                    const wrapper = document.createElement("div");
                    wrapper.className = "cm-hint-item-wrap";

                    const left = document.createElement("div");
                    left.className = "cm-hint-item-left";

                    const icon = document.createElement("span");
                    icon.className = "cm-hint-icon cm-hint-icon-word";
                    icon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="12" y1="9" x2="12" y2="15"></line></svg>`;

                    const name = document.createElement("span");
                    name.className = "cm-hint-name";
                    name.textContent = item;

                    left.appendChild(icon);
                    left.appendChild(name);

                    wrapper.appendChild(left);
                    elt.appendChild(wrapper);
                  },
                });
              }
            });
          }
        }

        return {
          list: list,
          from: from,
          to: to,
        };
      });
    }

    // Autocomplete on typing word characters
    cmEditor.on("inputRead", (cm, change) => {
      if (change.origin !== "+input") return;
      const text = change.text[0];
      if (/[a-zA-Z\.]/.test(text) && !cm.state.completionActive) {
        CodeMirror.commands.autocomplete(cm, null, {
          hint: CodeMirror.hint.java || CodeMirror.hint.anyword,
          completeSingle: false,
        });
      }
    });

    // Initialize Hardware-Accelerated Smooth Caret Animation
    initSmoothCaret(cmEditor);
  } catch (e) {
    console.error("Failed to initialize CodeMirror, using fallback", e);
    setupFallbackTextarea();
  }
}

// ==========================================
// Smooth Caret Animation Controller (VS Code style)
// ==========================================
let smoothCaretController = null;

function initSmoothCaret(cm) {
  if (!cm) return;

  const wrapper = cm.getWrapperElement();
  const scroller = cm.getScrollerElement();
  const linesEl = scroller.querySelector(".CodeMirror-lines") || wrapper;

  // Remove existing smooth-caret element if any
  const existingCaret = linesEl.querySelector(".smooth-caret");
  if (existingCaret) {
    existingCaret.remove();
  }

  // Create custom overlay caret element
  const caretEl = document.createElement("div");
  caretEl.className = "smooth-caret hidden";
  linesEl.appendChild(caretEl);

  let idleTimer = null;
  let isIdle = false;
  let animFrameId = null;
  let lastX = null;
  let lastY = null;
  let pendingTeleport = false;

  function renderCaret(teleport) {
    if (!cm) return;

    if (!cm.hasFocus()) {
      caretEl.classList.add("hidden");
      caretEl.classList.remove("active", "idle");
      return;
    }

    caretEl.classList.remove("hidden");

    // Reset idle timer & set active motion state
    if (isIdle) {
      isIdle = false;
      caretEl.classList.remove("idle");
    }
    caretEl.classList.add("active");

    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    idleTimer = setTimeout(() => {
      if (cm && cm.hasFocus()) {
        isIdle = true;
        caretEl.classList.remove("active");
        caretEl.classList.add("idle");
      }
    }, 400);

    // Calculate coordinates relative to .CodeMirror-lines
    const cursorCoords = cm.cursorCoords(true, "local");
    const x = Math.round(cursorCoords.left);
    const y = Math.round(cursorCoords.top);
    const height = Math.max(14, Math.round(cursorCoords.bottom - cursorCoords.top));

    // Detect large distance jumps (e.g. clicking far away, page down, file switch)
    // Local navigation (typing, adjacent arrow keys) glides smoothly; large jumps snap cleanly.
    const isLargeJump = lastX !== null && lastY !== null && (Math.abs(y - lastY) > 90 || Math.abs(x - lastX) > 400);
    const shouldTeleport = teleport || isLargeJump;

    lastX = x;
    lastY = y;

    if (shouldTeleport) {
      caretEl.classList.add("no-transition");
      caretEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      caretEl.style.height = `${height}px`;
      // Force DOM reflow before removing no-transition class
      void caretEl.offsetHeight;
      caretEl.classList.remove("no-transition");
    } else {
      caretEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      caretEl.style.height = `${height}px`;
    }
  }

  function scheduleUpdate(teleport = false) {
    if (teleport) pendingTeleport = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(() => {
      animFrameId = null;
      const tele = pendingTeleport;
      pendingTeleport = false;
      renderCaret(tele);
    });
  }

  // Register CodeMirror event hooks
  cm.on("cursorActivity", () => scheduleUpdate(false));
  cm.on("scroll", () => scheduleUpdate(false));
  cm.on("change", () => scheduleUpdate(false));
  cm.on("refresh", () => scheduleUpdate(true));
  cm.on("focus", () => scheduleUpdate(true));
  cm.on("mousedown", () => {
    // Queue position sync on click
    setTimeout(() => scheduleUpdate(false), 0);
  });
  cm.on("blur", () => {
    if (idleTimer) clearTimeout(idleTimer);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    caretEl.classList.add("hidden");
    caretEl.classList.remove("active", "idle");
  });

  // Track window resize
  const resizeHandler = () => {
    if (cm && cm.hasFocus()) scheduleUpdate(true);
  };
  window.addEventListener("resize", resizeHandler);

  smoothCaretController = {
    update: (teleport = false) => scheduleUpdate(teleport),
    teleport: () => scheduleUpdate(true),
    syncColor: () => {
      // Accent color is bound to CSS var(--accent); re-render ensures instant synchronization
      if (cm && cm.hasFocus()) scheduleUpdate(true);
    },
    destroy: () => {
      window.removeEventListener("resize", resizeHandler);
      if (idleTimer) clearTimeout(idleTimer);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      caretEl.remove();
    },
  };

  // Initial teleport if already focused
  if (cm.hasFocus()) {
    scheduleUpdate(true);
  }
}


// Toggle Java line comments (//) for selected lines or current line in CodeMirror
function toggleComment(cm) {
  if (!cm) return;
  cm.operation(() => {
    const from = cm.getCursor("from");
    const to = cm.getCursor("to");
    const startLine = from.line;
    let endLine = to.line;
    // If multiple lines selected and selection ends at col 0, don't comment the extra empty line
    if (from.line !== to.line && to.ch === 0) {
      endLine = Math.max(startLine, endLine - 1);
    }

    // Determine if all non-empty lines in selection are already commented with //
    let allCommented = true;
    let nonBlankCount = 0;
    for (let i = startLine; i <= endLine; i++) {
      const lineText = cm.getLine(i);
      const trimmed = lineText.trim();
      if (trimmed.length > 0) {
        nonBlankCount++;
        if (!trimmed.startsWith("//")) {
          allCommented = false;
          break;
        }
      }
    }

    if (nonBlankCount === 0) {
      // Empty line, just insert //
      const curLine = cm.getLine(startLine);
      cm.replaceRange(
        "// ",
        { line: startLine, ch: 0 },
        { line: startLine, ch: 0 },
      );
      return;
    }

    if (allCommented) {
      // Uncomment each line: remove first occurrence of // (and optional following space)
      for (let i = startLine; i <= endLine; i++) {
        const lineText = cm.getLine(i);
        const match = lineText.match(/^(\s*)\/\/\s?/);
        if (match) {
          const matchLen = match[0].length;
          const leadingSpaces = match[1].length;
          cm.replaceRange(
            match[1],
            { line: i, ch: 0 },
            { line: i, ch: matchLen },
          );
        }
      }
    } else {
      // Comment each line: add // at beginning of line
      for (let i = startLine; i <= endLine; i++) {
        const lineText = cm.getLine(i);
        // Find indentation
        const indentMatch = lineText.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : "";
        const rest = lineText.slice(indent.length);
        cm.replaceRange(
          indent + "// " + rest,
          { line: i, ch: 0 },
          { line: i, ch: lineText.length },
        );
      }
    }
  });
}

// Fallback auto-brackets for raw textarea if ever needed
function setupFallbackTextarea() {
  if (!codeTextarea) return;
  codeTextarea.style.display = "block";

  codeTextarea.addEventListener("keydown", (e) => {
    // Bracket auto-closing
    const pairs = { "(": ")", "{": "}", "[": "]", '"': '"', "'": "'" };
    if (pairs[e.key]) {
      e.preventDefault();
      const start = codeTextarea.selectionStart;
      const end = codeTextarea.selectionEnd;
      const val = codeTextarea.value;
      const closing = pairs[e.key];
      codeTextarea.value =
        val.substring(0, start) + e.key + closing + val.substring(end);
      codeTextarea.selectionStart = codeTextarea.selectionEnd = start + 1;
      saveCodeToStorage();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const start = codeTextarea.selectionStart;
      const end = codeTextarea.selectionEnd;
      const val = codeTextarea.value;
      codeTextarea.value =
        val.substring(0, start) + "    " + val.substring(end);
      codeTextarea.selectionStart = codeTextarea.selectionEnd = start + 4;
      saveCodeToStorage();
      return;
    }

    // Ctrl + / for raw textarea fallback
    if ((e.ctrlKey || e.metaKey) && (e.key === "/" || e.code === "Slash")) {
      e.preventDefault();
      const start = codeTextarea.selectionStart;
      const end = codeTextarea.selectionEnd;
      const val = codeTextarea.value;
      const lines = val.split("\n");
      // Find line indexes
      let charCount = 0;
      let startLineIdx = 0;
      let endLineIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i].length + 1; // +1 for \n
        if (charCount <= start && start < charCount + lineLen) startLineIdx = i;
        if (charCount <= end && end <= charCount + lineLen) endLineIdx = i;
        charCount += lineLen;
      }
      let allCommented = true;
      for (let i = startLineIdx; i <= endLineIdx; i++) {
        if (lines[i].trim().length > 0 && !lines[i].trim().startsWith("//")) {
          allCommented = false;
          break;
        }
      }
      for (let i = startLineIdx; i <= endLineIdx; i++) {
        if (allCommented) {
          lines[i] = lines[i].replace(/^(\s*)\/\/\s?/, "$1");
        } else {
          lines[i] = "// " + lines[i];
        }
      }
      codeTextarea.value = lines.join("\n");
      saveCodeToStorage();
      return;
    }

    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "." ||
        e.key === "Decimal" ||
        e.code === "Period" ||
        e.code === "NumpadDecimal" ||
        e.keyCode === 190 ||
        e.which === 190 ||
        e.keyCode === 110 ||
        e.which === 110)
    ) {
      e.preventDefault();
      e.stopPropagation();
      toggleSolutionVisibility();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runAllTests();
    }
  });

  codeTextarea.addEventListener("input", () => {
    if (typeof editorDiagnostics !== "undefined") {
      editorDiagnostics.clear();
    }
    saveCodeToStorage();
  });
}

function getEditorCode() {
  if (cmEditor) return cmEditor.getValue();
  return codeTextarea ? codeTextarea.value : "";
}

function setEditorCode(code) {
  if (typeof editorDiagnostics !== "undefined") {
    editorDiagnostics.clear();
  }
  if (cmEditor) {
    cmEditor.setValue(code);
    cmEditor.refresh();
  } else if (codeTextarea) {
    codeTextarea.value = code;
  }
}

// ==========================================
// Code Editor Diagnostics & Execution Error Mapping
// ==========================================
/**
 * @typedef {Object} ExecutionDiagnostic
 * @property {string} fileName
 * @property {number} line
 * @property {number} [column]
 * @property {string} message
 * @property {"error"} severity
 */

function parseDiagnostics(rawOutput, validFileNames = ["Main.java"]) {
  if (!rawOutput || typeof rawOutput !== "string") return [];

  const diagnostics = [];
  const lines = rawOutput.split(/\r?\n/);
  const seenKeys = new Set();

  function addDiagnostic(fileName, line, column, message, severity = "error") {
    const cleanFileName = fileName
      ? fileName.replace(/^.*[\\\/]/, "")
      : "Main.java";

    // Ignore internal / framework / test harness files
    const lower = cleanFileName.toLowerCase();
    if (lower === "testharness.java") return;
    if (
      lower.startsWith("java.") ||
      lower.startsWith("jdk.") ||
      lower.startsWith("sun.")
    )
      return;

    // Check if filename matches acceptable user file names
    const isUserFile =
      validFileNames.some((vf) => vf.toLowerCase() === lower) ||
      lower.endsWith(".java");
    if (!isUserFile) return;

    const parsedLine = parseInt(line, 10);
    if (isNaN(parsedLine) || parsedLine <= 0) return;

    const parsedCol = column ? parseInt(column, 10) : undefined;
    const cleanCol = !isNaN(parsedCol) && parsedCol > 0 ? parsedCol : undefined;
    const cleanMsg = (message || "Error occurred at this location").trim();

    const key = `${cleanFileName}:${parsedLine}:${cleanCol || 0}:${cleanMsg}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      diagnostics.push({
        fileName: cleanFileName,
        line: parsedLine,
        column: cleanCol,
        message: cleanMsg,
        severity: "error",
      });
    }
  }

  // 1. Regex for javac: e.g. [path/]Main.java:12:5: error: message OR Main.java:12: error: message
  const javacPattern =
    /(?:^|[\s\(\/\\:]|[a-zA-Z]:[\\\/].*?[\\\/])([a-zA-Z0-9_$]+\.java):(\d+)(?::(\d+))?:?\s*(?:(error|warning|fatal error):)?\s*(.*)$/i;

  // 2. Regex for compiler format with parentheses: e.g. Main.java(12,5): error: message OR Main.java(12): message
  const parenPattern =
    /(?:^|[\s])(?:[a-zA-Z]:[\\\/]|\/[^\s:]+[\\\/]|\\|[^\s:]+[\\\/])?([a-zA-Z0-9_$]+\.java)\((\d+)(?:,(\d+))?\):?\s*(?:(error|warning):)?\s*(.*)$/i;

  // 3. Regex for Java stack trace: e.g. at Main.foo(Main.java:14) OR at Main.main(Main.java:28)
  const stackTracePattern =
    /at\s+(?:[\w$.]+\/)?([\w$.]+)\.([\w$<>]+)\((?:[a-zA-Z0-9_$]+\.java:)?([a-zA-Z0-9_$]+\.java):(\d+)\)/;

  // 4. Alternative stack trace: at Main.foo(Main.java:14:5)
  const stackTraceColPattern =
    /at\s+([^\s(]+)\((?:.*[\\\/])?([a-zA-Z0-9_$]+\.java):(\d+)(?::(\d+))?\)/;

  for (let i = 0; i < lines.length; i++) {
    const lineStr = lines[i];
    if (!lineStr || !lineStr.trim()) continue;

    // Check stack trace pattern first
    const stMatch =
      lineStr.match(stackTracePattern) || lineStr.match(stackTraceColPattern);
    if (stMatch) {
      const file = stMatch[3] || stMatch[2];
      const lineNum = stMatch[4] || stMatch[3];
      const colNum = stMatch[5] || undefined;
      const caller = stMatch[1] || "";
      // Look backwards for exception message
      let excMsg = "";
      for (let j = Math.max(0, i - 4); j < i; j++) {
        if (
          /Exception|Error/i.test(lines[j]) &&
          !lines[j].trim().startsWith("at ")
        ) {
          excMsg = lines[j].trim();
          break;
        }
      }
      const fullMsg = excMsg
        ? `${excMsg} (at ${caller})`
        : `Runtime Exception at ${caller}`;
      addDiagnostic(file, lineNum, colNum, fullMsg);
      continue;
    }

    // Check javac pattern
    const jcMatch = lineStr.match(javacPattern);
    if (jcMatch && jcMatch[1]) {
      const file = jcMatch[1];
      const lineNum = jcMatch[2];
      let colNum = jcMatch[3];
      let msg = jcMatch[5] || "";

      // Check next lines for caret (^) to get column number and detailed error symbols
      if (!colNum && i + 2 < lines.length) {
        const nextLine = lines[i + 1];
        const caretLine = lines[i + 2];
        if (caretLine && caretLine.includes("^")) {
          const caretIdx = caretLine.indexOf("^");
          if (caretIdx >= 0) {
            colNum = caretIdx + 1;
          }
        }
      }

      if (msg.toLowerCase().startsWith("error:")) {
        msg = msg.slice(6).trim();
      }

      // Check if subsequent lines have additional context like "symbol: variable x"
      if (i + 3 < lines.length && lines[i + 3].trim().startsWith("symbol:")) {
        msg += " — " + lines[i + 3].trim();
      }

      addDiagnostic(file, lineNum, colNum, msg || "Compilation error");
      continue;
    }

    // Check paren pattern: Main.java(12,5): error: ...
    const pMatch = lineStr.match(parenPattern);
    if (pMatch && pMatch[1]) {
      const file = pMatch[1];
      const lineNum = pMatch[2];
      const colNum = pMatch[3];
      let msg = pMatch[5] || "";
      if (msg.toLowerCase().startsWith("error:")) {
        msg = msg.slice(6).trim();
      }
      addDiagnostic(file, lineNum, colNum, msg || "Compilation error");
      continue;
    }
  }

  return diagnostics;
}

const editorDiagnostics = {
  activeDiagnostics: [],
  textMarkers: [],
  lineClasses: [],
  tooltipElem: null,

  clear() {
    this.activeDiagnostics = [];
    this.hideTooltip();

    if (cmEditor) {
      cmEditor.operation(() => {
        // Clear text markers
        this.textMarkers.forEach((mark) => {
          try {
            mark.clear();
          } catch (e) {}
        });
        this.textMarkers = [];

        // Clear gutter error indicator classes
        this.lineClasses.forEach((item) => {
          try {
            cmEditor.removeLineClass(
              item.line,
              "gutter",
              "cm-execution-error-gutter",
            );
          } catch (e) {}
        });
        this.lineClasses = [];
      });
    }
  },

  set(diagnostics) {
    this.clear();
    if (!Array.isArray(diagnostics) || diagnostics.length === 0) return;

    if (!cmEditor) return;

    const totalLines = cmEditor.lineCount();
    // Only map diagnostics corresponding to lines in the user editable code
    const validDiags = diagnostics.filter(
      (d) => d.line >= 1 && d.line <= totalLines,
    );
    if (validDiags.length === 0) return;

    this.activeDiagnostics = validDiags;

    cmEditor.operation(() => {
      validDiags.forEach((d) => {
        const lineIdx = d.line - 1;
        const lineText = cmEditor.getLine(lineIdx) || "";

        // 1. Add gutter error indicator (red line number & dot)
        cmEditor.addLineClass(lineIdx, "gutter", "cm-execution-error-gutter");
        this.lineClasses.push({ line: lineIdx });

        // 2. Add text marker (squiggly underline)
        let fromCh = 0;
        let toCh = lineText.length;

        if (typeof d.column === "number" && d.column > 0) {
          fromCh = Math.max(0, Math.min(lineText.length, d.column - 1));
          toCh = fromCh + 1;
          while (
            toCh < lineText.length &&
            /[a-zA-Z0-9_$]/.test(lineText.charAt(toCh))
          ) {
            toCh++;
          }
          if (fromCh >= lineText.length) {
            fromCh = Math.max(0, lineText.search(/\S/));
            toCh = lineText.length;
          }
        } else {
          const firstNonBlank = lineText.search(/\S/);
          if (firstNonBlank >= 0) {
            fromCh = firstNonBlank;
            toCh = lineText.length;
          }
        }

        if (toCh <= fromCh) {
          toCh = Math.min(lineText.length, fromCh + 1);
        }

        try {
          const mark = cmEditor.markText(
            { line: lineIdx, ch: fromCh },
            { line: lineIdx, ch: toCh },
            {
              className: "cm-execution-error-text",
              title: d.message,
              attributes: {
                "data-diag-msg": d.message,
                "data-diag-line": String(d.line),
              },
            },
          );
          this.textMarkers.push(mark);
        } catch (e) {
          console.warn("Could not mark error text in CodeMirror:", e);
        }
      });
    });

    // Scroll to the first diagnostic for immediate feedback
    if (validDiags.length > 0) {
      const firstLineIdx = validDiags[0].line - 1;
      cmEditor.scrollIntoView({ line: firstLineIdx, ch: 0 }, 100);
    }
  },

  getAll() {
    return this.activeDiagnostics;
  },

  initHover() {
    if (!cmEditor) return;
    const wrapper = cmEditor.getWrapperElement();
    if (!wrapper || wrapper._diagHoverInit) return;
    wrapper._diagHoverInit = true;

    wrapper.addEventListener("mousemove", (e) => {
      const target = e.target;
      const errorTextEl = target.closest(".cm-execution-error-text");

      if (errorTextEl) {
        const msg =
          errorTextEl.getAttribute("data-diag-msg") ||
          errorTextEl.getAttribute("title");
        const line = errorTextEl.getAttribute("data-diag-line");
        if (msg) {
          this.showTooltip(e.clientX + 10, e.clientY + 12, msg, line);
          return;
        }
      }

      // Check if mouse is over an error line
      const coords = cmEditor.coordsChar({ left: e.clientX, top: e.clientY });
      if (coords && coords.line >= 0) {
        const diag = this.activeDiagnostics.find(
          (d) => d.line - 1 === coords.line,
        );
        if (
          diag &&
          (target.closest(".CodeMirror-linenumber") ||
            target.closest(".CodeMirror-line") ||
            target.closest(".cm-execution-error-gutter"))
        ) {
          this.showTooltip(
            e.clientX + 10,
            e.clientY + 12,
            diag.message,
            diag.line,
          );
          return;
        }
      }

      this.hideTooltip();
    });

    wrapper.addEventListener("mouseleave", () => {
      this.hideTooltip();
    });
  },

  showTooltip(x, y, message, line) {
    if (!this.tooltipElem) {
      this.tooltipElem = document.createElement("div");
      this.tooltipElem.className = "editor-diagnostic-tooltip";
      document.body.appendChild(this.tooltipElem);
    }

    const linePrefix = line ? `Line ${line}: ` : "";
    this.tooltipElem.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 1px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <div><strong>${escapeHtml(linePrefix)}</strong>${escapeHtml(message)}</div>
    `;

    this.tooltipElem.style.left = `${Math.min(window.innerWidth - 360, x)}px`;
    this.tooltipElem.style.top = `${y}px`;
    this.tooltipElem.style.display = "flex";
  },

  hideTooltip() {
    if (this.tooltipElem) {
      this.tooltipElem.style.display = "none";
    }
  },
};

window.parseDiagnostics = parseDiagnostics;
window.editorDiagnostics = editorDiagnostics;

// ==========================================
// Theme Management
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem("java_bench_theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
  } else {
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
  }
}

function toggleTheme() {
  if (document.body.classList.contains("theme-light")) {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
    localStorage.setItem("java_bench_theme", "dark");
    showToast("Switched to dark theme");
  } else {
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
    localStorage.setItem("java_bench_theme", "light");
    showToast("Switched to warm light theme");
  }
  if (smoothCaretController && smoothCaretController.syncColor) {
    smoothCaretController.syncColor();
  }
}

// Active filter state
let currentFilter = "all";
let currentSearchQuery = "";
let editorFontSize = 13;

// Set of category/section names that are currently expanded
const expandedSections = new Set();

function ensureCurrentProblemSectionExpanded() {
  const currentProb = PROBLEMS[currentProblemId];
  if (currentProb && currentProb.category) {
    expandedSections.add(currentProb.category);
  }
}

// ==========================================
// Navigation & Problem List
// ==========================================
function renderProblemNavList() {
  if (!problemListNav) return;
  const problemsArray = Object.values(PROBLEMS);

  // Ensure the active problem's category is expanded
  ensureCurrentProblemSectionExpanded();

  // Filter problems based on search query and filter pills
  const filteredProblems = problemsArray.filter((p) => {
    const isSolved = solvedProblems.has(p.id);
    const isStarred = isProblemStarred(p);

    // Filter pill matching
    if (currentFilter === "starred" && !isStarred) return false;
    if (currentFilter === "solved" && !isSolved) return false;
    if (currentFilter === "unsolved" && isSolved) return false;

    // Search query matching
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      const matchTitle = (p.title || "").toLowerCase().includes(q);
      const matchNum = String(p.num || "")
        .toLowerCase()
        .includes(q);
      const matchCategory = (p.category || "").toLowerCase().includes(q);
      const matchTag = (p.tag || "").toLowerCase().includes(q);
      if (!matchTitle && !matchNum && !matchCategory && !matchTag) return false;
    }

    return true;
  });

  // Calculate per-category total and solved stats across all problems
  const categoryStats = new Map();
  problemsArray.forEach((p) => {
    const cat = p.category || "Java Practice";
    if (!categoryStats.has(cat)) {
      categoryStats.set(cat, { total: 0, solved: 0 });
    }
    const stat = categoryStats.get(cat);
    stat.total++;
    if (solvedProblems.has(p.id)) stat.solved++;
  });

  // Group filtered problems by category preserving order of appearance
  const categoryGroups = new Map();
  filteredProblems.forEach((p) => {
    const cat = p.category || "Java Practice";
    if (!categoryGroups.has(cat)) {
      categoryGroups.set(cat, []);
    }
    categoryGroups.get(cat).push(p);
  });

  // Update match count badge
  const matchCountBadge = document.getElementById("sidebar-match-count");
  if (matchCountBadge) {
    matchCountBadge.textContent = `${filteredProblems.length}`;
  }

  // Update starred filter pill count badge
  const starredCount = problemsArray.filter((p) => isProblemStarred(p)).length;
  const starredPill = document.getElementById("filter-pill-starred");
  if (starredPill) {
    starredPill.innerHTML =
      starredCount > 0
        ? `★ Starred <span class="filter-count-badge">${starredCount}</span>`
        : `★ Starred`;
  }

  // Update progress tracking stats
  updateProgressStats();

  if (filteredProblems.length === 0) {
    problemListNav.innerHTML = `
      <div style="padding: 24px 12px; text-align: center; color: var(--text-subtle); font-size: 11px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 6px; opacity: 0.5;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <p>${currentFilter === "starred" ? "No starred questions yet. Click the star icon next to any problem title to bookmark it!" : "No matching challenges found."}</p>
      </div>
    `;
    return;
  }

  // Auto-expand all matching categories when actively searching or filtering
  const autoExpandAll = Boolean(currentSearchQuery || currentFilter !== "all");

  let html = "";

  categoryGroups.forEach((probs, category) => {
    const stat = categoryStats.get(category) || {
      total: probs.length,
      solved: 0,
    };
    const isCompleted = stat.solved === stat.total && stat.total > 0;
    const isExpanded = autoExpandAll || expandedSections.has(category);

    let itemsHtml = "";
    probs.forEach((p) => {
      const isSolved = solvedProblems.has(p.id);
      const isStarred = isProblemStarred(p);

      let iconHtml = "";
      if (isSolved && isStarred) {
        iconHtml = `
          <svg class="problem-icon solved-icon solved-star-icon" width="15" height="15" viewBox="0 0 24 24" fill="#22c55e" stroke="#15803d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" title="Solved and Starred">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        `;
      } else if (isSolved) {
        iconHtml = `
          <svg class="problem-icon solved-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" title="Solved">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="8 12 11 15 16 9"></polyline>
          </svg>
        `;
      } else if (isStarred) {
        iconHtml = `
          <svg class="problem-icon starred-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" title="Starred">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        `;
      } else {
        iconHtml = `
          <svg class="problem-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
          </svg>
        `;
      }

      itemsHtml += `
        <div class="problem-nav-item ${p.id === currentProblemId ? "active" : ""} ${isSolved ? "solved" : ""} ${isStarred ? "starred-item" : ""}" data-problem="${p.id}">
          ${iconHtml}
          <div class="nav-text-col">
            <span class="problem-nav-name">${escapeHtml(p.title)}</span>
            <span class="problem-nav-cat">${escapeHtml(p.tag || p.category || "Java")}</span>
          </div>
          <span class="problem-nav-num">${p.num}</span>
        </div>
      `;
    });

    html += `
      <div class="sidebar-section-group ${isExpanded ? "expanded" : "collapsed"}" data-category="${escapeHtml(category)}">
        <div class="sidebar-section-header" role="button" tabindex="0" data-category="${escapeHtml(category)}" title="Click to ${isExpanded ? "collapse" : "expand"} ${escapeHtml(category)}">
          <div class="section-header-left">
            <svg class="section-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span class="category-header-title">${escapeHtml(category)}</span>
          </div>
          <span class="section-badge ${isCompleted ? "completed" : ""}">${isCompleted ? "✓ " : ""}${stat.solved}/${stat.total}</span>
        </div>
        <div class="sidebar-section-items" style="${isExpanded ? "" : "display: none;"}">
          ${itemsHtml}
        </div>
      </div>
    `;
  });

  problemListNav.innerHTML = html;

  // Add click & keyboard listeners to section headers for smooth toggle
  problemListNav.querySelectorAll(".sidebar-section-header").forEach((hdr) => {
    hdr.addEventListener("click", (e) => {
      e.stopPropagation();
      const cat = hdr.getAttribute("data-category");
      if (!cat) return;
      const group = hdr.closest(".sidebar-section-group");
      const itemsContainer = group
        ? group.querySelector(".sidebar-section-items")
        : null;

      if (expandedSections.has(cat)) {
        expandedSections.delete(cat);
        if (group) {
          group.classList.remove("expanded");
          group.classList.add("collapsed");
        }
        if (itemsContainer) itemsContainer.style.display = "none";
        hdr.setAttribute("title", `Click to expand ${cat}`);
      } else {
        expandedSections.add(cat);
        if (group) {
          group.classList.remove("collapsed");
          group.classList.add("expanded");
        }
        if (itemsContainer) itemsContainer.style.display = "";
        hdr.setAttribute("title", `Click to collapse ${cat}`);
      }
    });

    hdr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        hdr.click();
      }
    });
  });

  // Problem click listeners
  problemListNav.querySelectorAll(".problem-nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const probId = item.getAttribute("data-problem");
      if (probId && probId !== currentProblemId && PROBLEMS[probId]) {
        switchProblem(probId);
      }
    });
  });
}

function updateProgressStats() {
  const ratioElem = document.getElementById("sidebar-progress-ratio");
  const barElem = document.getElementById("sidebar-progress-bar");
  const progressLabel = document.querySelector(".progress-label");
  const progressCard = document.querySelector(".sidebar-progress-card");
  const subCountElem = document.getElementById("sidebar-sub-count");

  // Keep the label title as "Solved Progress"
  if (progressLabel) {
    progressLabel.textContent = "Solved Progress";
  }

  const problemsArray = Object.values(PROBLEMS);
  const totalGlobal = problemsArray.length || 120;
  const globalSolved = problemsArray.filter(
    (p) => p && solvedProblems.has(p.id),
  ).length;

  // Identify the active category/topic of the currently selected question
  const activeProb =
    currentProblemId && PROBLEMS[currentProblemId]
      ? PROBLEMS[currentProblemId]
      : null;
  const activeTopic = activeProb
    ? (activeProb.category || activeProb.tag || "").trim()
    : null;

  let currentSolved = 0;
  let currentTotal = 0;

  if (activeTopic) {
    const activeTopicLower = activeTopic.toLowerCase();
    const topicProblems = problemsArray.filter((p) => {
      const cat = (p.category || p.tag || "").trim().toLowerCase();
      return cat === activeTopicLower;
    });

    currentTotal = topicProblems.length;
    currentSolved = topicProblems.filter((p) =>
      solvedProblems.has(p.id),
    ).length;

    if (progressCard) {
      progressCard.setAttribute(
        "title",
        `${activeTopic}: ${currentSolved} / ${currentTotal} solved (${globalSolved} / ${totalGlobal} curriculum total)`,
      );
    }
  } else {
    // Fall back to displaying total global progress if no active question/topic
    currentTotal = totalGlobal;
    currentSolved = globalSolved;

    if (progressCard) {
      progressCard.setAttribute(
        "title",
        `Curriculum Progress: ${currentSolved} / ${currentTotal} solved`,
      );
    }
  }

  if (subCountElem) {
    subCountElem.textContent = `${currentTotal} Java challenges`;
  }

  // Display solved ratio for the active topic (e.g. 0 / 8 for Linked Lists)
  if (ratioElem) {
    ratioElem.textContent = `${currentSolved} / ${currentTotal}`;
  }

  // Ensure progress bar percentage corresponds to active topic's solved ratio
  if (barElem) {
    const percentage =
      currentTotal > 0
        ? Math.min(100, (currentSolved / currentTotal) * 100)
        : 0;
    barElem.style.width = `${percentage}%`;
  }
}

// ==========================================
// Time & Space Complexity Helper
// ==========================================
function getProblemComplexity(prob) {
  if (!prob) return { time: "O(N)", space: "O(1)" };
  if (prob.timeComplexity && prob.spaceComplexity) {
    return { time: prob.timeComplexity, space: prob.spaceComplexity };
  }

  const title = (prob.title || "").toLowerCase();
  const cat = (prob.category || "").toLowerCase();

  // Graph algorithms
  if (title.includes("dijkstra"))
    return { time: "O((V + E) log V)", space: "O(V + E)" };
  if (title.includes("floyd")) return { time: "O(V³)", space: "O(V²)" };
  if (cat.includes("graph")) return { time: "O(V + E)", space: "O(V)" };

  // Dynamic Programming
  if (title.includes("matrix chain")) return { time: "O(N³)", space: "O(N²)" };
  if (title.includes("lcs") || title.includes("longest common"))
    return { time: "O(M × N)", space: "O(M × N)" };
  if (
    title.includes("knapsack") ||
    title.includes("subset sum") ||
    title.includes("min cost path")
  )
    return { time: "O(N × W)", space: "O(W)" };
  if (cat.includes("dynamic programming"))
    return { time: "O(N²)", space: "O(N)" };

  // Greedy
  if (
    title.includes("fractional knapsack") ||
    title.includes("interval") ||
    title.includes("activity") ||
    title.includes("job")
  ) {
    return { time: "O(N log N)", space: "O(N)" };
  }

  // Trees & BST
  if (cat.includes("binary search tree") || cat.includes("bst"))
    return { time: "O(H) / O(N)", space: "O(H)" };
  if (cat.includes("binary tree") || cat.includes("tree"))
    return { time: "O(N)", space: "O(H)" };
  if (cat.includes("heap")) return { time: "O(N log K)", space: "O(K)" };

  // Hashing & Hash Table
  if (cat.includes("hash")) return { time: "O(N)", space: "O(N)" };

  // Stack & Queue
  if (cat.includes("stack") || cat.includes("queue"))
    return { time: "O(N)", space: "O(N)" };

  // Linked Lists
  if (cat.includes("linked list")) return { time: "O(N)", space: "O(1)" };

  // Backtracking & Recursion
  if (
    cat.includes("backtracking") ||
    title.includes("queen") ||
    title.includes("sudoku") ||
    title.includes("maze")
  ) {
    return { time: "O(2ᴺ) / O(N!)", space: "O(N)" };
  }

  // Search & Sort
  if (title.includes("merge sort") || title.includes("quick sort"))
    return { time: "O(N log N)", space: "O(N)" };
  if (title.includes("binary search") || title.includes("rotated"))
    return { time: "O(log N)", space: "O(1)" };
  if (title.includes("matrix")) return { time: "O(N × M)", space: "O(1)" };

  return { time: "O(N)", space: "O(1)" };
}

// ==========================================
// Code Snippets & Live Templates Manager
// ==========================================
const JAVA_SNIPPETS = {
  fori: {
    label: "fori",
    desc: "for (int i = 0; i < n; i++)",
    body: "for (int i = 0; i < n; i++) {\n    \n}",
    cursorOffset: 34,
  },
  forj: {
    label: "forj",
    desc: "for (int j = 0; j < m; j++)",
    body: "for (int j = 0; j < m; j++) {\n    \n}",
    cursorOffset: 34,
  },
  scan: {
    label: "scan",
    desc: "Scanner sc = new Scanner(System.in);",
    body: "Scanner sc = new Scanner(System.in);",
    cursorOffset: 36,
  },
  scanner: {
    label: "scanner",
    desc: "Scanner sc = new Scanner(System.in);",
    body: "Scanner sc = new Scanner(System.in);",
    cursorOffset: 36,
  },
  sout: {
    label: "sout",
    desc: 'System.out.println("");',
    body: 'System.out.println("");',
    cursorOffset: 20,
  },
  psvm: {
    label: "psvm",
    desc: "public static void main(String[] args)",
    body: "public static void main(String[] args) {\n    \n}",
    cursorOffset: 44,
  },
  ifelse: {
    label: "ifelse",
    desc: "if / else block",
    body: "if (condition) {\n    \n} else {\n    \n}",
    cursorOffset: 20,
  },
  list: {
    label: "list",
    desc: "List<Integer> list = new ArrayList<>();",
    body: "List<Integer> list = new ArrayList<>();",
    cursorOffset: 39,
  },
  map: {
    label: "map",
    desc: "Map<Integer, Integer> map = new HashMap<>();",
    body: "Map<Integer, Integer> map = new HashMap<>();",
    cursorOffset: 45,
  },
  set: {
    label: "set",
    desc: "Set<Integer> set = new HashSet<>();",
    body: "Set<Integer> set = new HashSet<>();",
    cursorOffset: 35,
  },
  pq: {
    label: "pq",
    desc: "PriorityQueue<Integer> pq = new PriorityQueue<>();",
    body: "PriorityQueue<Integer> pq = new PriorityQueue<>();",
    cursorOffset: 50,
  },
};

function tryExpandSnippet(cm) {
  if (!cm) return false;
  const cur = cm.getCursor();
  const line = cm.getLine(cur.line);
  let start = cur.ch;
  while (start && /[\\w$]/.test(line.charAt(start - 1))) --start;
  const word = line.slice(start, cur.ch).toLowerCase();

  const snippet = JAVA_SNIPPETS[word];
  if (snippet) {
    const from = { line: cur.line, ch: start };
    const to = { line: cur.line, ch: cur.ch };
    cm.replaceRange(snippet.body, from, to);
    if (snippet.body.includes("\n")) {
      cm.setCursor({ line: from.line + 1, ch: 4 });
    } else if (word === "sout") {
      cm.setCursor({ line: from.line, ch: from.ch + 20 });
    } else {
      cm.setCursor({ line: from.line, ch: from.ch + snippet.body.length });
    }
    return true;
  }
  return false;
}

// Full visualizer implementation
let vizAnimationTimer = null;
let vizCurrentStep = 0;
let vizSteps = [];
let vizStructure = null;
let vizIsPlaying = false;
let vizSpeed = 900;

function escapeHtml(str) {
  if (typeof str !== "string") return String(str);
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return m;
    }
  });
}

function buildModelForProblem(prob) {
  if (!prob) return null;
  const cat = (prob.category || "").toLowerCase();
  const title = (prob.title || "").toLowerCase();

  // 1. Graphs
  if (cat.includes("graph")) {
    return {
      type: "graph",
      title: "Step-by-Step Graph Traversal & Shortest Path Visualizer",
      badge: "Graph Algorithm",
      modes: [
        { id: "bfs", label: "BFS Traversal (Level by Level)" },
        { id: "dfs", label: "DFS Traversal (Deep Path & Backtrack)" },
        { id: "dijkstra", label: "Dijkstra Shortest Path (Source = 0)" },
      ],
      nodes: [
        { id: 0, label: "0", x: 70, y: 110 },
        { id: 1, label: "1", x: 190, y: 45 },
        { id: 2, label: "2", x: 190, y: 175 },
        { id: 3, label: "3", x: 320, y: 55 },
        { id: 4, label: "4", x: 330, y: 170 },
      ],
      edges: [
        { from: 0, to: 1, weight: 10, id: "e01" },
        { from: 0, to: 2, weight: 3, id: "e02" },
        { from: 1, to: 2, weight: 4, id: "e12" },
        { from: 1, to: 3, weight: 2, id: "e13" },
        { from: 2, to: 4, weight: 2, id: "e24" },
        { from: 3, to: 4, weight: 7, id: "e34" },
      ],
    };
  }

  // 2. Binary Tree, BST, Heap
  if (cat.includes("tree") || cat.includes("bst") || cat.includes("heap")) {
    const isHeap = cat.includes("heap");
    const isBst = cat.includes("bst");
    return {
      type: "tree",
      title: `Step-by-Step ${isHeap ? "Heap" : isBst ? "BST" : "Binary Tree"} Visualizer`,
      badge: isHeap ? "Heap" : isBst ? "BST" : "Tree",
      modes: isBst
        ? [
            { id: "bst_search", label: "BST Search (Target = 40): Left < Root < Right" },
            { id: "inorder", label: "Inorder: Left → Node → Right (Sorted 20..80)" },
            { id: "levelorder", label: "Level Order BFS (50, 30, 70, 20, 40, 60, 80)" },
          ]
        : isHeap
        ? [
            { id: "levelorder", label: "Heap Level-Order (Complete Tree Mapping)" },
            { id: "preorder", label: "Max-Heapify Root Sift-Down Verification" },
          ]
        : [
            { id: "inorder", label: "Inorder: Left → Node → Right (20, 30, 40, 50, 60, 70, 80)" },
            { id: "preorder", label: "Preorder: Node → Left → Right (50, 30, 20, 40, 70, 60, 80)" },
            { id: "postorder", label: "Postorder: Left → Right → Node (20, 40, 30, 60, 80, 70, 50)" },
            { id: "levelorder", label: "Level Order BFS (50, 30, 70, 20, 40, 60, 80)" },
          ],
      nodes: [
        { id: 1, label: "50", x: 220, y: 35 },
        { id: 2, label: "30", x: 120, y: 100 },
        { id: 3, label: "70", x: 320, y: 100 },
        { id: 4, label: "20", x: 70, y: 170 },
        { id: 5, label: "40", x: 170, y: 170 },
        { id: 6, label: "60", x: 270, y: 170 },
        { id: 7, label: "80", x: 370, y: 170 },
      ],
      edges: [
        { from: 1, to: 2, id: "e12" },
        { from: 1, to: 3, id: "e13" },
        { from: 2, to: 4, id: "e24" },
        { from: 2, to: 5, id: "e25" },
        { from: 3, to: 6, id: "e36" },
        { from: 3, to: 7, id: "e37" },
      ],
    };
  }

  // 3. 2D Matrix (Rotate 90°, Spiral, Multiplication)
  if (cat.includes("array") && (title.includes("rotate") || title.includes("2-d") || title.includes("2d") || title.includes("matrix") || title.includes("spiral"))) {
    return {
      type: "matrix_2d",
      title: "Step-by-Step 2D Matrix & In-Place Rotation Visualizer",
      badge: "2D Matrix",
      modes: [
        { id: "rotate90", label: "Rotate 90° Clockwise (In-Place Transpose + Row Reverse)" },
        { id: "spiral", label: "Spiral Matrix Traversal (Clockwise Perimeter Walk)" },
        { id: "transpose", label: "Matrix Transposition: Swap A[i][j] with A[j][i]" },
      ],
    };
  }

  // 4. Searching & Sorting
  if (cat.includes("searching") || cat.includes("sorting") || title.includes("sort") || title.includes("search")) {
    return {
      type: "array_search_sort",
      title: "Step-by-Step Searching & Sorting Algorithm Visualizer",
      badge: "Search / Sort",
      modes: [
        { id: "binary_search", label: "Binary Search: O(log N) Divide & Conquer (Target = 57)" },
        { id: "bubble_sort", label: "Bubble Sort: Adjacent Comparisons & Swaps" },
        { id: "two_pointers", label: "Two Pointers: Target Sum Match (Sum K = 70)" },
      ],
    };
  }

  // 5. Linked Lists (Singly, Doubly, Circular)
  if (cat.includes("linked list") || cat.includes("doubly") || cat.includes("circular linked")) {
    return {
      type: "linked_list",
      title: "Step-by-Step Linked List Pointer Manipulation Visualizer",
      badge: "Linked List",
      modes: [
        { id: "reverse_list", label: "In-Place Reversal (prev, curr, next Pointers)" },
        { id: "middle_node", label: "Find Middle Element (Slow & Fast Pointers)" },
        { id: "detect_cycle", label: "Floyd's Cycle Detection (Tortoise & Hare)" },
      ],
    };
  }

  // 6. Stack
  if (cat.includes("stack")) {
    return {
      type: "stack",
      title: "Step-by-Step Stack LIFO & Expression Visualizer",
      badge: "Stack LIFO",
      modes: [
        { id: "push_pop", label: "Stack Operations: Push & Pop with Top Pointer" },
        { id: "balanced_paren", label: "Balanced Parentheses Validation: { [ ( ) ] }" },
      ],
    };
  }

  // 7. Queue
  if (cat.includes("queue") || cat.includes("circular queue")) {
    return {
      type: "queue",
      title: "Step-by-Step Queue FIFO & Buffer Visualizer",
      badge: "Queue FIFO",
      modes: [
        { id: "fifo", label: "Queue FIFO: Enqueue at Rear, Dequeue at Front" },
        { id: "circular_queue", label: "Circular Queue: Index Wrap-Around (rear + 1) % N" },
      ],
    };
  }

  // 8. Hashing
  if (cat.includes("hash") || cat.includes("table")) {
    return {
      type: "hashing",
      title: "Step-by-Step Hash Table & Collision Chaining Visualizer",
      badge: "Hash Table",
      modes: [
        { id: "chaining", label: "Separate Chaining: Hash Insert h(k) = k % 5 & Collisions" },
        { id: "lookup", label: "Hash Map Lookup: O(1) Average Access" },
      ],
    };
  }

  // 9. Recursion
  if (cat.includes("recursion")) {
    return {
      type: "recursion",
      title: "Step-by-Step Recursion Call Stack Visualizer",
      badge: "Recursion Stack",
      modes: [
        { id: "factorial", label: "Call Stack Winding & Unwinding: Factorial(4)" },
        { id: "fibonacci", label: "Recursive Call Tree: Fib(4)" },
      ],
    };
  }

  // 10. Backtracking
  if (cat.includes("backtracking") || title.includes("maze") || title.includes("n-queens") || title.includes("permutation")) {
    return {
      type: "backtracking",
      title: "Step-by-Step Backtracking & Path Search Visualizer",
      badge: "Backtracking",
      modes: [
        { id: "rat_maze", label: "Rat in a Maze: Path Exploration & Backtracking" },
        { id: "subsets", label: "State-Space Tree: Decision Choices" },
      ],
    };
  }

  // 11. Dynamic Programming
  if (cat.includes("dynamic") || cat.includes("dp")) {
    return {
      type: "dp",
      title: "Step-by-Step Dynamic Programming Table Visualizer",
      badge: "DP Tabulation",
      modes: [
        { id: "cover_distance", label: "1D DP Tabulation: Ways to Cover Distance" },
        { id: "fib_memo", label: "Overlapping Subproblems: State Re-use" },
      ],
    };
  }

  // 12. Greedy Algorithms
  if (cat.includes("greedy")) {
    return {
      type: "greedy",
      title: "Step-by-Step Greedy Choice Algorithm Visualizer",
      badge: "Greedy Strategy",
      modes: [
        { id: "fractional_knapsack", label: "Fractional Knapsack: Best Value-to-Weight Ratio" },
        { id: "activity_selection", label: "Activity Selection: Earliest Finish Time" },
      ],
    };
  }

  // 13. Strings
  if (cat.includes("string")) {
    return {
      type: "strings",
      title: "Step-by-Step String Two-Pointer Visualizer",
      badge: "String Pointers",
      modes: [
        { id: "palindrome", label: "Two-Pointer Palindrome Verification: 'racecar'" },
        { id: "reverse_str", label: "In-Place String Reversal" },
      ],
    };
  }

  // 14. 1D Array (Default)
  return {
    type: "array_1d",
    title: "Step-by-Step 1D Array Manipulation Visualizer",
    badge: "1D Array",
    modes: [
      { id: "max_element", label: "Find Maximum Element (Linear Scan - Q02 Sample)" },
      { id: "reverse_copy", label: "Reverse Copy: Array A → Array B (Q03)" },
      { id: "array_sum", label: "Linear Sum Accumulation (Q01)" },
    ],
  };
}

function computeVisualizerSteps(structure, mode) {
  if (!structure) return [];
  const type = structure.type;

  // 1. Matrix 2D
  if (type === "matrix_2d") {
    if (mode === "rotate90") {
      return [
        {
          title: "Initial 3x3 Matrix",
          note: "Goal: Rotate the 2D array by 90° clockwise in-place without extra matrix allocation.",
          vars: { Stage: "Start", Algorithm: "Transpose + Reverse Each Row" },
          matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
        },
        {
          title: "Transpose: Swap (0,1) ↔ (1,0)",
          note: "Diagonal elements remain fixed. Swap matrix[0][1] (2) with matrix[1][0] (4).",
          vars: { Stage: "Transpose", Cell_A: "[0][1]=2", Cell_B: "[1][0]=4" },
          matrix: [[1, 4, 3], [2, 5, 6], [7, 8, 9]],
          highlight: { r1: 0, c1: 1, r2: 1, c2: 0 },
        },
        {
          title: "Transpose: Swap (0,2) ↔ (2,0)",
          note: "Swap matrix[0][2] (3) with matrix[2][0] (7) across the main diagonal.",
          vars: { Stage: "Transpose", Cell_A: "[0][2]=3", Cell_B: "[2][0]=7" },
          matrix: [[1, 4, 7], [2, 5, 6], [3, 8, 9]],
          highlight: { r1: 0, c1: 2, r2: 2, c2: 0 },
        },
        {
          title: "Transpose: Swap (1,2) ↔ (2,1)",
          note: "Swap matrix[1][2] (6) with matrix[2][1] (8). Transpose phase is now fully complete!",
          vars: { Stage: "Transpose Complete", Rows_Become: "Columns" },
          matrix: [[1, 4, 7], [2, 5, 8], [3, 6, 9]],
          highlight: { r1: 1, c1: 2, r2: 2, c2: 1 },
        },
        {
          title: "Reverse Row 0: Swap ends",
          note: "Reverse row 0: swap matrix[0][0] (1) with matrix[0][2] (7) → Row 0 is now [7, 4, 1].",
          vars: { Stage: "Row Reversal", Row: "0", Before: "[1, 4, 7]", After: "[7, 4, 1]" },
          matrix: [[7, 4, 1], [2, 5, 8], [3, 6, 9]],
          highlightRow: 0,
        },
        {
          title: "Reverse Row 1: Swap ends",
          note: "Reverse row 1: swap matrix[1][0] (2) with matrix[1][2] (8) → Row 1 is now [8, 5, 2].",
          vars: { Stage: "Row Reversal", Row: "1", Before: "[2, 5, 8]", After: "[8, 5, 2]" },
          matrix: [[7, 4, 1], [8, 5, 2], [3, 6, 9]],
          highlightRow: 1,
        },
        {
          title: "Reverse Row 2: Swap ends",
          note: "Reverse row 2: swap matrix[2][0] (3) with matrix[2][2] (9) → Row 2 is now [9, 6, 3].",
          vars: { Stage: "Row Reversal", Row: "2", Before: "[3, 6, 9]", After: "[9, 6, 3]" },
          matrix: [[7, 4, 1], [8, 5, 2], [9, 6, 3]],
          highlightRow: 2,
        },
        {
          title: "Rotation Complete! (90° Clockwise)",
          note: "✓ Successfully transformed in O(N²) time & O(1) auxiliary space: [[7, 4, 1], [8, 5, 2], [9, 6, 3]].",
          vars: { Status: "Completed", Complexity: "O(N²) Time, O(1) Space" },
          matrix: [[7, 4, 1], [8, 5, 2], [9, 6, 3]],
          completed: true,
        },
      ];
    } else if (mode === "spiral") {
      return [
        {
          title: "Spiral: Start at (0,0)",
          note: "Traverse top boundary left-to-right: visit (0,0)=1, (0,1)=2, (0,2)=3.",
          vars: { Direction: "Right", Visited: "1, 2, 3" },
          matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          highlight: { r1: 0, c1: 0, r2: 0, c2: 2 },
        },
        {
          title: "Spiral: Turn Down",
          note: "Traverse right boundary top-to-bottom: visit (1,2)=6, (2,2)=9.",
          vars: { Direction: "Down", Visited: "1, 2, 3, 6, 9" },
          matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          highlight: { r1: 1, c1: 2, r2: 2, c2: 2 },
        },
        {
          title: "Spiral: Turn Left",
          note: "Traverse bottom boundary right-to-left: visit (2,1)=8, (2,0)=7.",
          vars: { Direction: "Left", Visited: "1, 2, 3, 6, 9, 8, 7" },
          matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          highlight: { r1: 2, c1: 1, r2: 2, c2: 0 },
        },
        {
          title: "Spiral: Turn Up & Center",
          note: "Traverse up to (1,0)=4, then enter inner core (1,1)=5.",
          vars: { Direction: "Center", Visited: "1, 2, 3, 6, 9, 8, 7, 4, 5" },
          matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          highlight: { r1: 1, c1: 0, r2: 1, c2: 1 },
          completed: true,
        },
      ];
    } else {
      return [
        {
          title: "Original Matrix",
          note: "Matrix transposition converts all rows into columns: A[i][j] ↔ A[j][i].",
          vars: { Rows: 3, Cols: 3 },
          matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
        },
        {
          title: "Swap (0,1) with (1,0)",
          note: "Swap 2 and 4 across the diagonal.",
          vars: { i: 0, j: 1, valA: 2, valB: 4 },
          matrix: [[1, 4, 3], [2, 5, 6], [7, 8, 9]],
          highlight: { r1: 0, c1: 1, r2: 1, c2: 0 },
        },
        {
          title: "Swap (0,2) with (2,0)",
          note: "Swap 3 and 7 across the diagonal.",
          vars: { i: 0, j: 2, valA: 3, valB: 7 },
          matrix: [[1, 4, 7], [2, 5, 6], [3, 8, 9]],
          highlight: { r1: 0, c1: 2, r2: 2, c2: 0 },
        },
        {
          title: "Swap (1,2) with (2,1)",
          note: "Swap 6 and 8. Transposition complete!",
          vars: { i: 1, j: 2, valA: 6, valB: 8 },
          matrix: [[1, 4, 7], [2, 5, 8], [3, 6, 9]],
          highlight: { r1: 1, c1: 2, r2: 2, c2: 1 },
          completed: true,
        },
      ];
    }
  }

  // 2. Searching & Sorting
  if (type === "array_search_sort") {
    if (mode === "binary_search") {
      return [
        {
          title: "Binary Search Setup (Target = 57)",
          note: "Array is sorted. Initialize pointers: low = 0, high = 6.",
          vars: { Target: 57, Low: 0, High: 6, SearchSpace: "[0..6]" },
          array: [12, 23, 34, 48, 57, 69, 83],
          pointers: { low: 0, high: 6 },
        },
        {
          title: "Compare Mid = 3 (Value 48)",
          note: "mid = (0 + 6) / 2 = 3. arr[mid] = 48. Since 48 < 57, target lies in the right half.",
          vars: { mid: 3, "arr[mid]": 48, Condition: "48 < 57 (Go Right)" },
          array: [12, 23, 34, 48, 57, 69, 83],
          pointers: { low: 0, mid: 3, high: 6 },
          comparing: [3],
        },
        {
          title: "Eliminate Left Half: low = mid + 1 = 4",
          note: "Eliminate indices 0..3 from search space. New range is [4..6].",
          vars: { Low: 4, High: 6, Remaining: "3 elements" },
          array: [12, 23, 34, 48, 57, 69, 83],
          pointers: { low: 4, high: 6 },
          eliminated: [0, 1, 2, 3],
        },
        {
          title: "Compare Mid = 5 (Value 69)",
          note: "mid = (4 + 6) / 2 = 5. arr[mid] = 69. Since 69 > 57, target lies in the left half.",
          vars: { mid: 5, "arr[mid]": 69, Condition: "69 > 57 (Go Left)" },
          array: [12, 23, 34, 48, 57, 69, 83],
          pointers: { low: 4, mid: 5, high: 6 },
          eliminated: [0, 1, 2, 3],
          comparing: [5],
        },
        {
          title: "Eliminate Right Half: high = mid - 1 = 4",
          note: "Eliminate indices 5..6. Range narrowed down to single index [4..4].",
          vars: { Low: 4, High: 4, Remaining: "1 element" },
          array: [12, 23, 34, 48, 57, 69, 83],
          pointers: { low: 4, high: 4 },
          eliminated: [0, 1, 2, 3, 5, 6],
        },
        {
          title: "Match Found! mid = 4 (Value 57)",
          note: "✓ arr[4] == 57. Target element 57 found at index 4 in only 3 comparisons (O(log N))!",
          vars: { Status: "Found", Index: 4, Comparisons: 3 },
          array: [12, 23, 34, 48, 57, 69, 83],
          pointers: { mid: 4 },
          eliminated: [0, 1, 2, 3, 5, 6],
          sorted: [4],
        },
      ];
    } else if (mode === "bubble_sort") {
      return [
        {
          title: "Bubble Sort Initial Array",
          note: "Iteratively compare adjacent elements and swap if left > right.",
          vars: { Pass: 0, Swaps: 0 },
          array: [50, 20, 40, 10, 30],
        },
        {
          title: "Pass 1: Compare [0]=50 and [1]=20",
          note: "50 > 20 → Swap 50 and 20.",
          vars: { "arr[0]": 50, "arr[1]": 20, Action: "Swap" },
          array: [20, 50, 40, 10, 30],
          swapped: [0, 1],
        },
        {
          title: "Pass 1: Compare [1]=50 and [2]=40",
          note: "50 > 40 → Swap 50 and 40.",
          vars: { "arr[1]": 50, "arr[2]": 40, Action: "Swap" },
          array: [20, 40, 50, 10, 30],
          swapped: [1, 2],
        },
        {
          title: "Pass 1: Compare [2]=50 and [3]=10",
          note: "50 > 10 → Swap 50 and 10.",
          vars: { "arr[2]": 50, "arr[3]": 10, Action: "Swap" },
          array: [20, 40, 10, 50, 30],
          swapped: [2, 3],
        },
        {
          title: "Pass 1: Compare [3]=50 and [4]=30",
          note: "50 > 30 → Swap 50 and 30. Largest element 50 bubbles to end and is now locked!",
          vars: { "arr[3]": 50, "arr[4]": 30, Action: "Lock [4]=50" },
          array: [20, 40, 10, 30, 50],
          sorted: [4],
        },
        {
          title: "Pass 2 & 3: Remaining Swaps",
          note: "Subsequent passes bubble 40 to index 3, then 30 to index 2, 20 to index 1.",
          vars: { Status: "Fully Sorted", Time: "O(N²)" },
          array: [10, 20, 30, 40, 50],
          sorted: [0, 1, 2, 3, 4],
        },
      ];
    } else {
      return [
        {
          title: "Two Pointers: Target Sum K = 70",
          note: "Array is sorted. Place pointer L at index 0, pointer R at index 5.",
          vars: { L: 0, R: 5, Target: 70 },
          array: [10, 20, 30, 40, 50, 60],
          pointers: { L: 0, R: 5 },
        },
        {
          title: "Check Sum: arr[L] + arr[R]",
          note: "arr[0]=10 + arr[5]=60 = 70. Sum equals Target K (70) on first check!",
          vars: { "arr[L]": 10, "arr[R]": 60, Sum: "70 == 70 ✓" },
          array: [10, 20, 30, 40, 50, 60],
          pointers: { L: 0, R: 5 },
          sorted: [0, 5],
        },
      ];
    }
  }

  // 3. 1D Array (Q02 Maximum Element, Q03 Reverse Copy, Q01 Sum)
  if (type === "array_1d") {
    if (mode === "max_element") {
      const arr = [20, 30, 93, 71, 18, 82, 66];
      return [
        {
          title: "Initialize max = arr[0]",
          note: "Set max = arr[0] = 20. Loop from index 1 to N-1 to inspect each subsequent element.",
          vars: { i: 0, "arr[0]": 20, max: 20 },
          array: arr,
          pointers: { max: 0, i: 0 },
          active: 0,
        },
        {
          title: "Index 1: 30 > 20 → Update max",
          note: "arr[1] (30) is greater than current max (20). Update max = 30.",
          vars: { i: 1, "arr[1]": 30, "30 > 20": "true", newMax: 30 },
          array: arr,
          pointers: { max: 1, i: 1 },
          active: 1,
        },
        {
          title: "Index 2: 93 > 30 → Update max",
          note: "arr[2] (93) is greater than current max (30). Update max = 93!",
          vars: { i: 2, "arr[2]": 93, "93 > 30": "true", newMax: 93 },
          array: arr,
          pointers: { max: 2, i: 2 },
          active: 2,
        },
        {
          title: "Index 3: 71 <= 93 → No update",
          note: "arr[3] (71) is not greater than 93. max remains 93.",
          vars: { i: 3, "arr[3]": 71, "71 > 93": "false", max: 93 },
          array: arr,
          pointers: { max: 2, i: 3 },
          active: 3,
        },
        {
          title: "Index 4: 18 <= 93 → No update",
          note: "arr[4] (18) is less than 93. max remains 93.",
          vars: { i: 4, "arr[4]": 18, "18 > 93": "false", max: 93 },
          array: arr,
          pointers: { max: 2, i: 4 },
          active: 4,
        },
        {
          title: "Index 5: 82 <= 93 → No update",
          note: "arr[5] (82) is less than 93. max remains 93.",
          vars: { i: 5, "arr[5]": 82, "82 > 93": "false", max: 93 },
          array: arr,
          pointers: { max: 2, i: 5 },
          active: 5,
        },
        {
          title: "Index 6: 66 <= 93 → Linear Scan Complete",
          note: "✓ All elements inspected in O(N) time. Return final maximum element: 93.",
          vars: { Status: "Finished", Result: 93, Time: "O(N)" },
          array: arr,
          pointers: { max: 2 },
          sorted: [2],
        },
      ];
    } else if (mode === "reverse_copy") {
      return [
        {
          title: "Source Array A & Destination B",
          note: "Copy elements of Array A into Array B in reverse order.",
          vars: { Source: "A[0..4]", Dest: "B[0..4]" },
          array: [10, 20, 30, 40, 50],
          pointers: { i: 0 },
        },
        {
          title: "Copy A[4] → B[0]",
          note: "Transfer element 50 from end of A to start of B: B[0] = A[4] (50).",
          vars: { "A[4]": 50, "B[0]": 50 },
          array: [50, 40, 30, 20, 10],
          active: 0,
        },
        {
          title: "Copy Complete: Reverse Array B",
          note: "✓ Reverse copy finished: Array B is [50, 40, 30, 20, 10].",
          vars: { Status: "Reversed" },
          array: [50, 40, 30, 20, 10],
          sorted: [0, 1, 2, 3, 4],
        },
      ];
    } else {
      return [
        {
          title: "Initialize sum = 0",
          note: "Accumulate array elements one by one into sum.",
          vars: { sum: 0, i: 0 },
          array: [10, 20, 30, 40, 50],
          pointers: { i: 0 },
        },
        {
          title: "sum = 10 + 20 + 30 + 40 + 50",
          note: "Iterating through all elements yields total sum = 150.",
          vars: { sum: 150, Elements: 5 },
          array: [10, 20, 30, 40, 50],
          sorted: [0, 1, 2, 3, 4],
        },
      ];
    }
  }

  // 4. Linked Lists
  if (type === "linked_list") {
    const listNodes = [
      { id: 0, val: 10 },
      { id: 1, val: 20 },
      { id: 2, val: 30 },
      { id: 3, val: 40 },
    ];
    if (mode === "reverse_list") {
      return [
        {
          title: "Initial Linked List: 10 → 20 → 30 → 40 → null",
          note: "Use 3 pointers: prev = null, curr = head (10), next = null.",
          vars: { prev: "null", curr: "10 (head)", next: "null" },
          nodes: listNodes,
          pointers: { curr: 0 },
        },
        {
          title: "Step 1: Reverse Node 10's pointer",
          note: "next = curr.next (20); curr.next = prev (null); prev = curr (10); curr = next (20).",
          vars: { "10.next": "null", prev: "10", curr: "20" },
          nodes: listNodes,
          pointers: { prev: 0, curr: 1 },
          reversedArrows: [0],
        },
        {
          title: "Step 2: Reverse Node 20's pointer",
          note: "curr.next points back to 10. Advance prev to 20, curr to 30.",
          vars: { "20.next": "10", prev: "20", curr: "30" },
          nodes: listNodes,
          pointers: { prev: 1, curr: 2 },
          reversedArrows: [0, 1],
        },
        {
          title: "Step 3: Reverse Node 30's pointer",
          note: "curr.next points back to 20. Advance prev to 30, curr to 40.",
          vars: { "30.next": "20", prev: "30", curr: "40" },
          nodes: listNodes,
          pointers: { prev: 2, curr: 3 },
          reversedArrows: [0, 1, 2],
        },
        {
          title: "Step 4: Reverse Node 40's pointer & Set New Head",
          note: "curr.next points to 30. curr reaches null. Return prev (40) as the new head!",
          vars: { NewHead: "40", Result: "40 → 30 → 20 → 10 → null" },
          nodes: listNodes,
          pointers: { head: 3 },
          reversedArrows: [0, 1, 2],
        },
      ];
    } else if (mode === "middle_node") {
      return [
        {
          title: "Slow & Fast Pointers at Head",
          note: "Initialize slow = head (10), fast = head (10).",
          vars: { slow: "10", fast: "10" },
          nodes: listNodes,
          pointers: { "slow/fast": 0 },
        },
        {
          title: "Move: slow +1, fast +2",
          note: "slow advances 1 step to 20; fast advances 2 steps to 30.",
          vars: { slow: "20", fast: "30" },
          nodes: listNodes,
          pointers: { slow: 1, fast: 2 },
        },
        {
          title: "Fast reaches boundary → slow is at Middle!",
          note: "fast reaches end of list. slow is pointing at Node 20 / 30 (Middle) in O(N/2) time!",
          vars: { MiddleNode: "20/30", Technique: "Tortoise & Hare" },
          nodes: listNodes,
          pointers: { slow: 1, fast: 3 },
        },
      ];
    } else {
      return [
        {
          title: "Floyd's Cycle Detection",
          note: "Slow advances 1 step, Fast advances 2 steps. If a cycle exists, they must collide.",
          vars: { Cycle: "Detected when slow == fast" },
          nodes: listNodes,
          pointers: { slow: 0, fast: 0 },
        },
        {
          title: "Collision Detected!",
          note: "✓ Fast catches up to slow inside the loop. Proves the list contains a cycle.",
          vars: { Result: "Cycle Exists ✓" },
          nodes: listNodes,
          pointers: { "slow==fast": 2 },
        },
      ];
    }
  }

  // 5. Stack
  if (type === "stack") {
    if (mode === "push_pop") {
      return [
        {
          title: "Empty Stack (LIFO: Last In First Out)",
          note: "Initialize empty stack with top = -1.",
          vars: { top: -1, size: 0 },
          stack: [],
        },
        {
          title: "push(10) onto Stack",
          note: "10 inserted into bottom of stack. top = 0.",
          vars: { top: 0, inserted: 10 },
          stack: [10],
        },
        {
          title: "push(20) onto Stack",
          note: "20 inserted above 10. top = 1.",
          vars: { top: 1, inserted: 20 },
          stack: [10, 20],
        },
        {
          title: "push(30) onto Stack",
          note: "30 inserted above 20. top = 2.",
          vars: { top: 2, inserted: 30 },
          stack: [10, 20, 30],
        },
        {
          title: "pop() removes 30",
          note: "pop() removes and returns topmost element (30). top decrements to 1.",
          vars: { popped: 30, top: 1 },
          stack: [10, 20],
        },
        {
          title: "push(40) onto Stack",
          note: "40 pushed on top of 20. Stack now contains [10, 20, 40].",
          vars: { top: 2, inserted: 40 },
          stack: [10, 20, 40],
        },
      ];
    } else {
      return [
        {
          title: "Validate Expression: '{ [ ( ) ] }'",
          note: "Scan string from left to right. Push open brackets, match & pop closing brackets.",
          vars: { char: "'{'", action: "Push to stack" },
          stack: ["{"],
        },
        {
          title: "Push '[' and '('",
          note: "Stack accumulates open brackets: top is '('.",
          vars: { stackTop: "'('", pending: "') ] }'" },
          stack: ["{", "[", "("],
        },
        {
          title: "Encounter ')': Matches '(' → Pop!",
          note: "Closing ')' matches top '('. Pop '(' from stack.",
          vars: { matched: "()", remainingStack: "['{', '[']" },
          stack: ["{", "["],
        },
        {
          title: "Encounter ']' and '}': All Match!",
          note: "✓ All brackets matched correctly. Stack is empty → Expression is Balanced!",
          vars: { Status: "Balanced ✓", FinalStack: "Empty" },
          stack: [],
        },
      ];
    }
  }

  // 6. Queue
  if (type === "queue") {
    return [
      {
        title: "Empty Queue (FIFO: First In First Out)",
        note: "Elements enter at Rear and exit from Front.",
        vars: { Front: 0, Rear: -1, size: 0 },
        queue: [],
      },
      {
        title: "enqueue(15)",
        note: "15 enters at Rear.",
        vars: { added: 15, size: 1 },
        queue: [15],
      },
      {
        title: "enqueue(25)",
        note: "25 enters at Rear behind 15.",
        vars: { added: 25, size: 2 },
        queue: [15, 25],
      },
      {
        title: "dequeue() removes 15",
        note: "Oldest element 15 exits from Front. Queue now holds [25].",
        vars: { removed: 15, front: 25 },
        queue: [25],
      },
      {
        title: "enqueue(35)",
        note: "35 enters at Rear. Queue now holds [25, 35].",
        vars: { added: 35, size: 2 },
        queue: [25, 35],
      },
    ];
  }

  // 7. Hashing
  if (type === "hashing") {
    return [
      {
        title: "Initialize Hash Table (5 Buckets: h(k) = k % 5)",
        note: "Hash function maps keys to index 0..4. Collisions resolved via linked chaining.",
        vars: { Buckets: 5, Function: "k % 5" },
        buckets: [[], [], [], [], []],
      },
      {
        title: "Insert Key 15: 15 % 5 = Bucket 0",
        note: "15 hashes to index 0. Insert 15 into Bucket 0 chain.",
        vars: { key: 15, hash: "15 % 5 = 0", Bucket: 0 },
        buckets: [[15], [], [], [], []],
        activeBucket: 0,
      },
      {
        title: "Insert Key 22: 22 % 5 = Bucket 2",
        note: "22 hashes to index 2. Insert 22 into Bucket 2 chain.",
        vars: { key: 22, hash: "22 % 5 = 2", Bucket: 2 },
        buckets: [[15], [], [22], [], []],
        activeBucket: 2,
      },
      {
        title: "Collision! Insert Key 35: 35 % 5 = Bucket 0",
        note: "35 hashes to index 0 (Collision with 15). Chained to Bucket 0: 15 → 35.",
        vars: { key: 35, hash: "35 % 5 = 0", Collision: "Chained to 15" },
        buckets: [[15, 35], [], [22], [], []],
        activeBucket: 0,
      },
      {
        title: "Insert Key 48: 48 % 5 = Bucket 3",
        note: "48 hashes to index 3. Insert 48 into Bucket 3.",
        vars: { key: 48, hash: "48 % 5 = 3", Bucket: 3 },
        buckets: [[15, 35], [], [22], [48], []],
        activeBucket: 3,
      },
    ];
  }

  // 8. Recursion
  if (type === "recursion") {
    return [
      {
        title: "Call Stack: Initial Call fact(4)",
        note: "To evaluate fact(4), push frame onto call stack and call fact(3).",
        vars: { Call: "fact(4)", StackDepth: 1 },
        frames: [{ call: "fact", n: 4 }],
        phase: "winding",
      },
      {
        title: "Call Stack: fact(3)",
        note: "fact(3) calls fact(2). Stack depth increases to 2.",
        vars: { Call: "fact(3)", StackDepth: 2 },
        frames: [{ call: "fact", n: 4 }, { call: "fact", n: 3 }],
        phase: "winding",
      },
      {
        title: "Call Stack: fact(2)",
        note: "fact(2) calls fact(1). Stack depth increases to 3.",
        vars: { Call: "fact(2)", StackDepth: 3 },
        frames: [{ call: "fact", n: 4 }, { call: "fact", n: 3 }, { call: "fact", n: 2 }],
        phase: "winding",
      },
      {
        title: "Base Case Reached: fact(1) = 1",
        note: "n <= 1 triggers base case! Returns 1 immediately without further calls.",
        vars: { Call: "fact(1)", BaseCase: "true", Return: 1 },
        frames: [
          { call: "fact", n: 4 },
          { call: "fact", n: 3 },
          { call: "fact", n: 2 },
          { call: "fact", n: 1, ret: 1 },
        ],
        phase: "unwinding",
      },
      {
        title: "Unwinding: fact(2) = 2 * 1 = 2",
        note: "fact(1) popped. fact(2) multiplies 2 * 1 and returns 2.",
        vars: { "fact(2)": 2, StackDepth: 3 },
        frames: [{ call: "fact", n: 4 }, { call: "fact", n: 3 }, { call: "fact", n: 2, ret: 2 }],
        phase: "unwinding",
      },
      {
        title: "Unwinding: fact(3) = 3 * 2 = 6",
        note: "fact(2) popped. fact(3) multiplies 3 * 2 and returns 6.",
        vars: { "fact(3)": 6, StackDepth: 2 },
        frames: [{ call: "fact", n: 4 }, { call: "fact", n: 3, ret: 6 }],
        phase: "unwinding",
      },
      {
        title: "Final Return: fact(4) = 4 * 6 = 24",
        note: "✓ Final call stack frame unwinds. Result of fact(4) is 24!",
        vars: { "fact(4)": 24, Result: 24 },
        frames: [{ call: "fact", n: 4, ret: 24 }],
        phase: "unwinding",
      },
    ];
  }

  // 9. Backtracking
  if (type === "backtracking") {
    return [
      {
        title: "Rat in a Maze: Start at (0,0)",
        note: "Source cell (0,0). Attempt to move Right or Down to reach Destination (2,2).",
        vars: { Current: "(0,0)", Goal: "(2,2)" },
        matrix: [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
        highlight: { r1: 0, c1: 0, r2: 0, c2: 0 },
      },
      {
        title: "Step Down: (1,0) is open",
        note: "Move down to cell (1,0). Valid path continues.",
        vars: { Move: "Down", Position: "(1,0)" },
        matrix: [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
        highlight: { r1: 1, c1: 0, r2: 1, c2: 0 },
      },
      {
        title: "Step Right: (1,1) is open",
        note: "Move right to cell (1,1).",
        vars: { Move: "Right", Position: "(1,1)" },
        matrix: [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
        highlight: { r1: 1, c1: 1, r2: 1, c2: 1 },
      },
      {
        title: "Step Down: (2,1) is open",
        note: "Move down to cell (2,1).",
        vars: { Move: "Down", Position: "(2,1)" },
        matrix: [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
        highlight: { r1: 2, c1: 1, r2: 2, c2: 1 },
      },
      {
        title: "Goal Reached! (2,2)",
        note: "✓ Destination reached at (2,2). Path solution: Down → Right → Down → Right.",
        vars: { Status: "Goal Reached ✓" },
        matrix: [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
        highlight: { r1: 2, c1: 2, r2: 2, c2: 2 },
        completed: true,
      },
    ];
  }

  // 10. Dynamic Programming
  if (type === "dp") {
    return [
      {
        title: "Base Cases: dp[0] = 1, dp[1] = 1, dp[2] = 2",
        note: "Distance cover problem: Ways to cover distance using 1, 2, or 3 steps.",
        vars: { "dp[0]": 1, "dp[1]": 1, "dp[2]": 2 },
        table: [1, 1, 2, null, null],
        currentIdx: 2,
        sources: [0, 1],
      },
      {
        title: "Compute dp[3] = dp[2] + dp[1] + dp[0]",
        note: "dp[3] = 2 + 1 + 1 = 4 ways to cover distance 3.",
        vars: { "dp[3]": "2 + 1 + 1 = 4" },
        table: [1, 1, 2, 4, null],
        currentIdx: 3,
        sources: [0, 1, 2],
      },
      {
        title: "Compute dp[4] = dp[3] + dp[2] + dp[1]",
        note: "dp[4] = 4 + 2 + 1 = 7 ways to cover distance 4.",
        vars: { "dp[4]": "4 + 2 + 1 = 7", FinalAnswer: 7 },
        table: [1, 1, 2, 4, 7],
        currentIdx: 4,
        sources: [1, 2, 3],
      },
    ];
  }

  // 11. Strings
  if (type === "strings") {
    const chars = ["r", "a", "c", "e", "c", "a", "r"];
    return [
      {
        title: "Two-Pointer Palindrome Setup: 'racecar'",
        note: "Initialize Left pointer L = 0 ('r'), Right pointer R = 6 ('r').",
        vars: { L: 0, R: 6, "chars[L]": "r", "chars[R]": "r" },
        chars: chars,
        l: 0,
        r: 6,
      },
      {
        title: "L=0, R=6: 'r' == 'r' ✓",
        note: "Characters match. Move L forward and R backward: L = 1, R = 5.",
        vars: { L: 1, R: 5, "chars[L]": "a", "chars[R]": "a" },
        chars: chars,
        l: 1,
        r: 5,
        matched: [0, 6],
      },
      {
        title: "L=1, R=5: 'a' == 'a' ✓",
        note: "Characters match. Move L forward and R backward: L = 2, R = 4.",
        vars: { L: 2, R: 4, "chars[L]": "c", "chars[R]": "c" },
        chars: chars,
        l: 2,
        r: 4,
        matched: [0, 1, 5, 6],
      },
      {
        title: "L=2, R=4: 'c' == 'c' ✓",
        note: "Characters match. Pointers converge at center index 3 ('e').",
        vars: { L: 3, R: 3, Center: "'e'" },
        chars: chars,
        l: 3,
        r: 3,
        matched: [0, 1, 2, 4, 5, 6],
      },
      {
        title: "Palindrome Verified!",
        note: "✓ All corresponding characters match symmetrically. 'racecar' is a valid Palindrome!",
        vars: { Result: "Valid Palindrome ✓", Time: "O(N/2)" },
        chars: chars,
        matched: [0, 1, 2, 3, 4, 5, 6],
      },
    ];
  }

  // 12. Graphs
  if (type === "graph") {
    if (mode === "bfs") {
      return [
        { title: "Start BFS at vertex 0", note: "Queue: [0]. Mark vertex 0 visited.", vars: { Node: 0, Queue: "[0]" }, nodeId: 0, edgeId: null, label: "0" },
        { title: "Visit neighbor 1", note: "Edge 0-1 explored. Queue: [1, 2].", vars: { Node: 1, Queue: "[1, 2]" }, nodeId: 1, edgeId: "e01", label: "1" },
        { title: "Visit neighbor 2", note: "Edge 0-2 explored. Queue: [2, 3].", vars: { Node: 2, Queue: "[2, 3]" }, nodeId: 2, edgeId: "e02", label: "2" },
        { title: "Visit neighbor 3", note: "Edge 1-3 explored. Queue: [3, 4].", vars: { Node: 3, Queue: "[3, 4]" }, nodeId: 3, edgeId: "e13", label: "3" },
        { title: "Visit neighbor 4", note: "Edge 2-4 explored. All vertices reached!", vars: { Node: 4, Status: "Complete" }, nodeId: 4, edgeId: "e24", label: "4" },
      ];
    } else if (mode === "dfs") {
      return [
        { title: "Start DFS at vertex 0", note: "Push 0 to recursion stack.", vars: { Node: 0 }, nodeId: 0, edgeId: null, label: "0" },
        { title: "DFS explore to 1", note: "Follow edge 0-1 deep.", vars: { Node: 1 }, nodeId: 1, edgeId: "e01", label: "1" },
        { title: "DFS explore to 3", note: "Follow edge 1-3 deep.", vars: { Node: 3 }, nodeId: 3, edgeId: "e13", label: "3" },
        { title: "DFS explore to 4", note: "Follow edge 3-4 deep.", vars: { Node: 4 }, nodeId: 4, edgeId: "e34", label: "4" },
        { title: "Backtrack and visit 2", note: "Backtrack to 0, follow edge 0-2.", vars: { Node: 2 }, nodeId: 2, edgeId: "e02", label: "2" },
      ];
    } else {
      return [
        { title: "Dijkstra: Source 0 (d=0)", note: "Distances: [0:0, 1:∞, 2:∞, 3:∞, 4:∞].", vars: { Dist_0: 0 }, nodeId: 0, edgeId: null, label: "0 (d=0)" },
        { title: "Shortest step: 0 → 2 (wt=3)", note: "Relax edge 0-2. dist[2] = 3.", vars: { Dist_2: 3 }, nodeId: 2, edgeId: "e02", label: "2 (d=3)" },
        { title: "Shortest step: 2 → 4 (total=5)", note: "Relax edge 2-4 (3+2 = 5).", vars: { Dist_4: 5 }, nodeId: 4, edgeId: "e24", label: "4 (d=5)" },
        { title: "Shortest step: 2 → 1 (total=7)", note: "Relax edge 2-1 (3+4 = 7).", vars: { Dist_1: 7 }, nodeId: 1, edgeId: "e12", label: "1 (d=7)" },
        { title: "Shortest step: 1 → 3 (total=9)", note: "Relax edge 1-3 (7+2 = 9). All shortest paths computed!", vars: { Dist_3: 9 }, nodeId: 3, edgeId: "e13", label: "3 (d=9)" },
      ];
    }
  }

  // 13. Tree traversals
  if (mode === "inorder") {
    return [
      { title: "Leftmost leaf [20]", note: "Traverse left subtree to leaf 20.", vars: { Node: 20, Step: "Left" }, nodeId: 4, edgeId: "e24", label: "20" },
      { title: "Parent node [30]", note: "Visit parent node 30.", vars: { Node: 30, Step: "Parent" }, nodeId: 2, edgeId: "e12", label: "30" },
      { title: "Right child [40]", note: "Visit right child of 30.", vars: { Node: 40, Step: "Right" }, nodeId: 5, edgeId: "e25", label: "40" },
      { title: "Root node [50]", note: "Visit tree root node 50.", vars: { Node: 50, Step: "Root" }, nodeId: 1, edgeId: null, label: "50" },
      { title: "Left child [60]", note: "Visit left child of right subtree 60.", vars: { Node: 60, Step: "Left" }, nodeId: 6, edgeId: "e36", label: "60" },
      { title: "Right subtree root [70]", note: "Visit right subtree parent 70.", vars: { Node: 70, Step: "Parent" }, nodeId: 3, edgeId: "e13", label: "70" },
      { title: "Rightmost leaf [80]", note: "Visit rightmost leaf 80. Inorder produces sorted order!", vars: { Node: 80, Result: "Sorted (20..80)" }, nodeId: 7, edgeId: "e37", label: "80" },
    ];
  } else if (mode === "bst_search") {
    return [
      { title: "Search Target 40: Start at Root 50", note: "Compare target 40 with Root 50. Since 40 < 50, branch Left.", vars: { Root: 50, Target: 40, "40 < 50": "Branch Left" }, nodeId: 1, edgeId: null, label: "50" },
      { title: "Compare with Node 30", note: "Compare target 40 with Node 30. Since 40 > 30, branch Right.", vars: { Node: 30, Target: 40, "40 > 30": "Branch Right" }, nodeId: 2, edgeId: "e12", label: "30" },
      { title: "Target Found! Node 40", note: "✓ Target 40 matched in 2 comparisons! O(log N) BST search.", vars: { Found: 40, Comparisons: 2 }, nodeId: 5, edgeId: "e25", label: "40" },
    ];
  } else if (mode === "preorder") {
    return [
      { title: "Root [50]", note: "Visit Root first (Preorder: Node-Left-Right).", vars: { Node: 50 }, nodeId: 1, edgeId: null, label: "50" },
      { title: "Left root [30]", note: "Visit left subtree parent 30.", vars: { Node: 30 }, nodeId: 2, edgeId: "e12", label: "30" },
      { title: "Left leaf [20]", note: "Visit leaf 20.", vars: { Node: 20 }, nodeId: 4, edgeId: "e24", label: "20" },
      { title: "Right leaf [40]", note: "Visit leaf 40.", vars: { Node: 40 }, nodeId: 5, edgeId: "e25", label: "40" },
      { title: "Right root [70]", note: "Visit right subtree parent 70.", vars: { Node: 70 }, nodeId: 3, edgeId: "e13", label: "70" },
      { title: "Left leaf [60]", note: "Visit leaf 60.", vars: { Node: 60 }, nodeId: 6, edgeId: "e36", label: "60" },
      { title: "Right leaf [80]", note: "Visit leaf 80.", vars: { Node: 80 }, nodeId: 7, edgeId: "e37", label: "80" },
    ];
  } else if (mode === "postorder") {
    return [
      { title: "Left leaf [20]", note: "Visit bottom-left leaf 20.", vars: { Node: 20 }, nodeId: 4, edgeId: "e24", label: "20" },
      { title: "Right leaf [40]", note: "Visit bottom-right leaf 40.", vars: { Node: 40 }, nodeId: 5, edgeId: "e25", label: "40" },
      { title: "Subtree parent [30]", note: "Visit subtree parent 30.", vars: { Node: 30 }, nodeId: 2, edgeId: "e12", label: "30" },
      { title: "Right left leaf [60]", note: "Visit leaf 60.", vars: { Node: 60 }, nodeId: 6, edgeId: "e36", label: "60" },
      { title: "Right right leaf [80]", note: "Visit leaf 80.", vars: { Node: 80 }, nodeId: 7, edgeId: "e37", label: "80" },
      { title: "Right subtree parent [70]", note: "Visit subtree parent 70.", vars: { Node: 70 }, nodeId: 3, edgeId: "e13", label: "70" },
      { title: "Final Root [50]", note: "Root 50 is visited last in Postorder.", vars: { Node: 50 }, nodeId: 1, edgeId: null, label: "50" },
    ];
  } else {
    return [
      { title: "Level 1: Root [50]", note: "Dequeue 50, enqueue children (30, 70).", vars: { Level: 1, Node: 50 }, nodeId: 1, edgeId: null, label: "50" },
      { title: "Level 2: Left [30]", note: "Dequeue 30, enqueue children (20, 40).", vars: { Level: 2, Node: 30 }, nodeId: 2, edgeId: "e12", label: "30" },
      { title: "Level 2: Right [70]", note: "Dequeue 70, enqueue children (60, 80).", vars: { Level: 2, Node: 70 }, nodeId: 3, edgeId: "e13", label: "70" },
      { title: "Level 3: Leaf [20]", note: "Dequeue 20.", vars: { Level: 3, Node: 20 }, nodeId: 4, edgeId: "e24", label: "20" },
      { title: "Level 3: Leaf [40]", note: "Dequeue 40.", vars: { Level: 3, Node: 40 }, nodeId: 5, edgeId: "e25", label: "40" },
      { title: "Level 3: Leaf [60]", note: "Dequeue 60.", vars: { Level: 3, Node: 60 }, nodeId: 6, edgeId: "e36", label: "60" },
      { title: "Level 3: Leaf [80]", note: "Dequeue 80. Level-order BFS traversal complete!", vars: { Level: 3, Node: 80 }, nodeId: 7, edgeId: "e37", label: "80" },
    ];
  }
}

function drawVisualizerCanvas() {
  const container = document.getElementById("viz-content-canvas");
  if (!container || !vizStructure) return;

  const step = vizSteps[vizCurrentStep > 0 ? vizCurrentStep - 1 : 0] || {};
  const isZero = vizCurrentStep === 0;

  // 1. Matrix 2D
  if (vizStructure.type === "matrix_2d" || vizStructure.type === "backtracking") {
    const mat = (isZero && vizSteps[0]) ? vizSteps[0].matrix : (step.matrix || [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    container.innerHTML = `
      <div class="viz-matrix-container">
        <div class="viz-matrix-grid" style="grid-template-columns: repeat(${mat.length}, 46px);">
          ${mat.map((row, r) => row.map((val, c) => {
            const isH1 = !isZero && step.highlight && step.highlight.r1 === r && step.highlight.c1 === c;
            const isH2 = !isZero && step.highlight && step.highlight.r2 === r && step.highlight.c2 === c;
            const isRowH = !isZero && step.highlightRow === r;
            const isDone = !isZero && step.completed;
            let cls = "viz-matrix-cell";
            if (isH1 || isH2) cls += " swapping";
            else if (isRowH) cls += " active";
            else if (isDone) cls += " completed";
            return `<div class="${cls}">
              <span class="viz-matrix-cell-coord">${r},${c}</span>
              <span>${val}</span>
            </div>`;
          }).join("")).join("")}
        </div>
      </div>
    `;
    return;
  }

  // 2. Array Search / Sort & 1D Array
  if (vizStructure.type === "array_search_sort" || vizStructure.type === "array_1d" || vizStructure.type === "greedy") {
    const arr = (isZero && vizSteps[0]) ? vizSteps[0].array : (step.array || [10, 20, 30, 40, 50]);
    const pointers = (!isZero && step.pointers) ? step.pointers : {};
    container.innerHTML = `
      <div class="viz-array-wrap">
        ${arr.map((val, idx) => {
          let pText = "";
          Object.keys(pointers).forEach(k => {
            if (pointers[k] === idx) pText += (pText ? "/" : "") + k;
          });
          let boxCls = "viz-bar-box";
          if (!isZero) {
            if (step.eliminated && step.eliminated.includes(idx)) boxCls += " eliminated";
            else if (step.swapped && step.swapped.includes(idx)) boxCls += " swapped";
            else if (step.comparing && step.comparing.includes(idx)) boxCls += " comparing";
            else if (step.active !== undefined && step.active === idx) boxCls += " active";
            else if (step.sorted && step.sorted.includes(idx)) boxCls += " sorted";
          }
          return `
            <div class="viz-bar-item">
              <div class="viz-bar-pointer-slot">
                ${pText ? `<span class="viz-pointer-badge">${escapeHtml(pText)}</span>` : ""}
              </div>
              <div class="${boxCls}">${val}</div>
              <span class="viz-bar-index">[${idx}]</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
    return;
  }

  // 3. Linked List
  if (vizStructure.type === "linked_list") {
    const nodes = (isZero && vizSteps[0]) ? vizSteps[0].nodes : (step.nodes || []);
    const pointers = (!isZero && step.pointers) ? step.pointers : {};
    container.innerHTML = `
      <div class="viz-list-container">
        ${nodes.map((n, idx) => {
          let pText = "";
          Object.keys(pointers).forEach(k => {
            if (pointers[k] === idx) pText += (pText ? ", " : "") + k;
          });
          const isReversed = !isZero && step.reversedArrows && step.reversedArrows.includes(idx);
          const isNodeActive = !isZero && (step.activeIdx === idx || (pointers.curr === idx));
          return `
            <div class="viz-list-node-wrap">
              <div class="viz-bar-pointer-slot">
                ${pText ? `<span class="viz-pointer-badge">${escapeHtml(pText)}</span>` : ""}
              </div>
              <div class="viz-list-node ${isNodeActive ? "active" : ""}">
                <div class="viz-node-data-part">${n.val}</div>
                <div class="viz-node-ptr-part"><span class="viz-ptr-dot"></span></div>
              </div>
              <span class="viz-bar-index">Node ${idx}</span>
            </div>
            ${idx < nodes.length - 1 ? `<span class="viz-list-arrow ${isReversed ? "reversed" : ""}">${isReversed ? "←" : "→"}</span>` : `<span class="viz-list-arrow">→ ∅</span>`}
          `;
        }).join("")}
      </div>
    `;
    return;
  }

  // 4. Stack
  if (vizStructure.type === "stack") {
    const stackItems = (!isZero && step.stack) ? step.stack : [];
    container.innerHTML = `
      <div class="viz-sq-container">
        <div class="viz-stack-box">
          ${stackItems.length === 0 ? `<span style="font-size: 11px; color: var(--text-subtle); text-align: center; margin-bottom: 25px;">[Empty Stack]</span>` : ""}
          ${stackItems.map((item, idx) => {
            const isTop = idx === stackItems.length - 1;
            return `<div class="viz-stack-item ${isTop ? "top-item" : ""}">
              ${escapeHtml(item)} ${isTop ? `<span style="font-size: 9px; opacity: 0.85;">← TOP</span>` : ""}
            </div>`;
          }).join("")}
        </div>
      </div>
    `;
    return;
  }

  // 5. Queue
  if (vizStructure.type === "queue") {
    const qItems = (!isZero && step.queue) ? step.queue : [];
    container.innerHTML = `
      <div class="viz-sq-container">
        <div style="display: flex; align-items: center; gap: 8px; border: 1px dashed var(--border-color); padding: 12px 16px; border-radius: var(--radius-md); background: var(--bg-card-subtle);">
          <span style="font-size: 10px; font-weight: 800; color: #10b981;">FRONT →</span>
          ${qItems.length === 0 ? `<span style="font-size: 11px; color: var(--text-subtle); padding: 0 10px;">[Empty Queue]</span>` : ""}
          ${qItems.map((item, idx) => `
            <div class="viz-stack-item ${idx === 0 ? "top-item" : ""}">
              ${escapeHtml(item)}
            </div>
          `).join("")}
          <span style="font-size: 10px; font-weight: 800; color: #f59e0b;">← REAR</span>
        </div>
      </div>
    `;
    return;
  }

  // 6. Hashing
  if (vizStructure.type === "hashing") {
    const buckets = (!isZero && step.buckets) ? step.buckets : [[], [], [], [], []];
    container.innerHTML = `
      <div class="viz-hash-table">
        ${buckets.map((b, idx) => {
          const isActive = !isZero && step.activeBucket === idx;
          return `
            <div class="viz-hash-row">
              <span class="viz-hash-bucket-label" style="${isActive ? "border-color: #f59e0b; color: #f59e0b; font-weight: 800;" : ""}">Bucket [${idx}]</span>
              <div class="viz-hash-chain">
                ${b.length === 0 ? `<span style="font-size: 10px; color: var(--text-subtle);">null</span>` : ""}
                ${b.map((val) => `
                  <span class="viz-hash-chain-item">${val}</span>
                  <span style="color: var(--text-subtle); font-size: 11px;">→</span>
                `).join("")}
                ${b.length > 0 ? `<span style="font-size: 10px; color: var(--text-subtle);">null</span>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
    return;
  }

  // 7. Recursion
  if (vizStructure.type === "recursion") {
    const frames = (!isZero && step.frames) ? step.frames : [{ call: "fact", n: 4 }];
    container.innerHTML = `
      <div class="viz-callstack-container">
        ${frames.map((f, idx) => {
          const isTop = idx === frames.length - 1;
          const isReturning = !isZero && step.phase === "unwinding";
          let cls = "viz-callstack-frame";
          if (isTop && !isReturning) cls += " active";
          else if (isReturning && isTop) cls += " returning";
          return `
            <div class="${cls}">
              <span><strong>${escapeHtml(f.call)}</strong> (n=${f.n})</span>
              <span>${f.ret !== undefined ? `<strong style="color: #10b981;">→ ${f.ret}</strong>` : `<span style="color: #f59e0b;">executing...</span>`}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
    return;
  }

  // 8. Dynamic Programming
  if (vizStructure.type === "dp") {
    const table = (!isZero && step.table) ? step.table : [1, 1, 2, null, null];
    const curIdx = !isZero ? step.currentIdx : -1;
    const sources = (!isZero && step.sources) ? step.sources : [];
    container.innerHTML = `
      <table class="viz-dp-table">
        <tr>
          ${table.map((c, i) => `<th class="viz-dp-cell header">dp[${i}]</th>`).join("")}
        </tr>
        <tr>
          ${table.map((c, i) => {
            let cls = "viz-dp-cell";
            if (i === curIdx) cls += " active-calc";
            else if (sources.includes(i)) cls += " source-calc";
            return `<td class="${cls}">${c !== null ? c : "—"}</td>`;
          }).join("")}
        </tr>
      </table>
    `;
    return;
  }

  // 9. Strings
  if (vizStructure.type === "strings") {
    const chars = (!isZero && step.chars) ? step.chars : ["r", "a", "c", "e", "c", "a", "r"];
    const l = !isZero ? step.l : -1;
    const r = !isZero ? step.r : -1;
    container.innerHTML = `
      <div class="viz-array-wrap">
        ${chars.map((ch, idx) => {
          let pText = "";
          if (l === idx) pText += "L";
          if (r === idx) pText += (pText ? "/R" : "R");
          const isMatched = !isZero && step.matched && step.matched.includes(idx);
          let boxCls = "viz-bar-box";
          if (isMatched) boxCls += " sorted";
          else if (idx === l || idx === r) boxCls += " comparing";
          return `
            <div class="viz-bar-item">
              <div class="viz-bar-pointer-slot">
                ${pText ? `<span class="viz-pointer-badge">${pText}</span>` : ""}
              </div>
              <div class="${boxCls}">${ch}</div>
              <span class="viz-bar-index">[${idx}]</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
    return;
  }

  // 10. Tree & Graph (SVG)
  let edgesHtml = "";
  const nodeMap = new Map();
  vizStructure.nodes.forEach((n) => nodeMap.set(n.id, n));

  vizStructure.edges.forEach((e) => {
    const from = nodeMap.get(e.from);
    const to = nodeMap.get(e.to);
    if (!from || !to) return;
    edgesHtml += `
      <g id="viz-edge-${e.id}">
        <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="viz-edge-line" id="line-${e.id}"></line>
        ${
          e.weight !== undefined
            ? `
          <rect x="${(from.x + to.x) / 2 - 8}" y="${(from.y + to.y) / 2 - 7}" width="16" height="14" rx="3" fill="var(--bg-app)" stroke="var(--border-color)" stroke-width="1"></rect>
          <text x="${(from.x + to.x) / 2}" y="${(from.y + to.y) / 2}" class="viz-edge-text">${e.weight}</text>
        `
            : ""
        }
      </g>
    `;
  });

  let nodesHtml = "";
  vizStructure.nodes.forEach((n) => {
    nodesHtml += `
      <g class="viz-node" id="viz-node-${n.id}">
        <circle cx="${n.x}" cy="${n.y}" r="18" class="viz-node-circle"></circle>
        <text x="${n.x}" y="${n.y}" class="viz-node-text">${n.label}</text>
      </g>
    `;
  });

  container.innerHTML = `<svg class="viz-svg" viewBox="0 0 440 220" preserveAspectRatio="xMidYMid meet">${edgesHtml + nodesHtml}</svg>`;
}

function applyVisualizerStep() {
  if (!vizStructure) return;
  const statusElem = document.getElementById("viz-status-text");
  const explanationBox = document.getElementById("viz-explanation-box");
  const varsTray = document.getElementById("viz-variables-tray");
  const scrubber = document.getElementById("viz-step-scrubber");
  const stepCounter = document.getElementById("viz-step-counter");

  if (scrubber) {
    scrubber.max = vizSteps.length;
    scrubber.value = vizCurrentStep;
  }
  if (stepCounter) {
    stepCounter.textContent = `Step ${vizCurrentStep} / ${vizSteps.length}`;
  }

  // Update canvas
  drawVisualizerCanvas();

  // If tree or graph, also update SVG node and edge highlights
  if (vizStructure.type === "tree" || vizStructure.type === "graph") {
    const svg = document.querySelector(".viz-svg");
    if (svg) {
      svg.querySelectorAll(".viz-node").forEach((n) => n.classList.remove("active", "visited"));
      svg.querySelectorAll(".viz-edge-line").forEach((e) => e.classList.remove("active", "visited"));

      const currentIdx = vizCurrentStep - 1;
      for (let i = 0; i < currentIdx; i++) {
        const s = vizSteps[i];
        if (s && s.nodeId !== undefined) {
          const nEl = document.getElementById(`viz-node-${s.nodeId}`);
          if (nEl) nEl.classList.add("visited");
        }
        if (s && s.edgeId) {
          const eEl = document.getElementById(`line-${s.edgeId}`);
          if (eEl) eEl.classList.add("visited");
        }
      }

      if (vizCurrentStep > 0 && vizSteps[currentIdx]) {
        const cur = vizSteps[currentIdx];
        if (cur.nodeId !== undefined) {
          const activeNodeEl = document.getElementById(`viz-node-${cur.nodeId}`);
          if (activeNodeEl) activeNodeEl.classList.add("active");
        }
        if (cur.edgeId) {
          const activeEdgeEl = document.getElementById(`line-${cur.edgeId}`);
          if (activeEdgeEl) activeEdgeEl.classList.add("active");
        }
      }
    }
  }

  if (vizCurrentStep === 0) {
    if (statusElem) statusElem.innerHTML = `Status: <strong>Ready</strong> · Click <strong>Play ▶</strong> or <strong>Step Forward ⏭</strong>`;
    if (explanationBox) {
      explanationBox.innerHTML = `<strong>Ready to begin:</strong> Click <strong>Play ▶</strong> to watch execution or step through manually.`;
    }
    if (varsTray) {
      varsTray.innerHTML = `<span class="viz-var-pill"><span class="var-name">step</span><span class="var-val">0</span></span>`;
    }
    return;
  }

  const currentIdx = vizCurrentStep - 1;
  const curStep = vizSteps[currentIdx];

  if (curStep) {
    if (statusElem) {
      statusElem.innerHTML = `Step <strong>${vizCurrentStep}</strong> of <strong>${vizSteps.length}</strong>: ${escapeHtml(curStep.title)}`;
    }
    if (explanationBox) {
      explanationBox.innerHTML = `<strong>${escapeHtml(curStep.title)}:</strong> ${escapeHtml(curStep.note)}`;
    }
    if (varsTray && curStep.vars) {
      let varsHtml = "";
      Object.keys(curStep.vars).forEach((key) => {
        varsHtml += `
          <span class="viz-var-pill">
            <span class="var-name">${escapeHtml(key)}:</span>
            <span class="var-val">${escapeHtml(curStep.vars[key])}</span>
          </span>
        `;
      });
      varsTray.innerHTML = varsHtml;
    }
  }

  if (vizCurrentStep >= vizSteps.length) {
    pauseVisualizer();
    if (statusElem) {
      statusElem.innerHTML = `✓ <strong>Algorithm Complete!</strong> (${vizSteps.length} steps simulated)`;
    }
  }
}

function initVisualizerListeners() {
  const modeSelect = document.getElementById("viz-mode-select");
  const speedSelect = document.getElementById("viz-speed-select");
  const scrubber = document.getElementById("viz-step-scrubber");
  const btnPlay = document.getElementById("viz-btn-play");
  const btnNext = document.getElementById("viz-btn-next");
  const btnPrev = document.getElementById("viz-btn-prev");
  const btnReset = document.getElementById("viz-btn-reset");
  const card = document.getElementById("card-traversal-visualizer");

  if (modeSelect) {
    modeSelect.addEventListener("change", () => {
      pauseVisualizer();
      computeAndRenderVisualizer(modeSelect.value);
    });
  }

  if (speedSelect) {
    speedSelect.addEventListener("change", () => {
      vizSpeed = parseInt(speedSelect.value, 10) || 900;
      if (vizIsPlaying) {
        pauseVisualizer();
        playVisualizer();
      }
    });
  }

  if (scrubber) {
    scrubber.addEventListener("input", (e) => {
      pauseVisualizer();
      vizCurrentStep = parseInt(e.target.value, 10);
      applyVisualizerStep();
    });
  }

  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      if (vizIsPlaying) pauseVisualizer();
      else playVisualizer();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      pauseVisualizer();
      stepVisualizer(1);
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      pauseVisualizer();
      stepVisualizer(-1);
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      pauseVisualizer();
      vizCurrentStep = 0;
      applyVisualizerStep();
    });
  }

  // Keyboard navigation when hovering or focused on the visualizer card
  if (card) {
    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", (e) => {
      if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (vizIsPlaying) pauseVisualizer();
        else playVisualizer();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        pauseVisualizer();
        stepVisualizer(1);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        pauseVisualizer();
        stepVisualizer(-1);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        pauseVisualizer();
        vizCurrentStep = 0;
        applyVisualizerStep();
      }
    });
  }
}

function computeAndRenderVisualizer(mode) {
  if (!vizStructure) return;
  vizCurrentStep = 0;
  vizSteps = computeVisualizerSteps(vizStructure, mode);
  const scrubber = document.getElementById("viz-step-scrubber");
  if (scrubber) {
    scrubber.max = vizSteps.length;
    scrubber.value = 0;
  }
  applyVisualizerStep();
}

function playVisualizer() {
  const btnPlay = document.getElementById("viz-btn-play");
  if (vizCurrentStep >= vizSteps.length) {
    vizCurrentStep = 0;
  }
  vizIsPlaying = true;
  if (btnPlay) btnPlay.textContent = "⏸ Pause";

  if (vizAnimationTimer) clearInterval(vizAnimationTimer);
  vizAnimationTimer = setInterval(() => {
    if (vizCurrentStep < vizSteps.length) {
      vizCurrentStep++;
      applyVisualizerStep();
    } else {
      pauseVisualizer();
    }
  }, vizSpeed);
}

function pauseVisualizer() {
  vizIsPlaying = false;
  const btnPlay = document.getElementById("viz-btn-play");
  if (btnPlay) btnPlay.textContent = "▶ Play";
  if (vizAnimationTimer) {
    clearInterval(vizAnimationTimer);
    vizAnimationTimer = null;
  }
}

function stepVisualizer(direction) {
  const nextStep = vizCurrentStep + direction;
  if (nextStep >= 0 && nextStep <= vizSteps.length) {
    vizCurrentStep = nextStep;
    applyVisualizerStep();
  }
}

function renderUniversalVisualizer(prob) {
  const existingViz = document.getElementById("card-traversal-visualizer");
  if (existingViz) {
    if (vizAnimationTimer) clearInterval(vizAnimationTimer);
    vizIsPlaying = false;
    existingViz.remove();
  }

  vizStructure = buildModelForProblem(prob);
  if (!vizStructure) return;

  const psBody = document.querySelector(".problem-statement-body");
  if (!psBody) return;

  const vizCard = document.createElement("div");
  vizCard.id = "card-traversal-visualizer";
  vizCard.className = "traversal-visualizer-card";

  const modes = vizStructure.modes || [];

  vizCard.innerHTML = `
    <div class="viz-header">
      <div class="viz-header-left">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span class="viz-title">${vizStructure.title}</span>
        <span class="viz-badge">${vizStructure.badge}</span>
      </div>
      <div class="viz-controls">
        <select id="viz-mode-select" class="viz-select">
          ${modes.map((m) => `<option value="${m.id}">${m.label}</option>`).join("")}
        </select>
        <select id="viz-speed-select" class="viz-select" title="Playback Speed">
          <option value="1600">0.5x Speed</option>
          <option value="900" selected>1.0x Speed</option>
          <option value="600">1.5x Speed</option>
          <option value="350">2.0x Fast</option>
        </select>
        <button id="viz-btn-prev" class="viz-btn" type="button" title="Step Backward (Left Arrow)">⏮</button>
        <button id="viz-btn-play" class="viz-btn primary" type="button" title="Play / Pause Animation (Space)">▶ Play</button>
        <button id="viz-btn-next" class="viz-btn" type="button" title="Step Forward (Right Arrow)">⏭</button>
        <button id="viz-btn-reset" class="viz-btn" type="button" title="Reset Traversal (R)">↺</button>
      </div>
      <div class="viz-scrubber-wrap">
        <input type="range" id="viz-step-scrubber" class="viz-scrubber" min="0" max="1" value="0" step="1" title="Drag to jump to any step" />
        <span id="viz-step-counter" class="viz-step-counter">Step 0 / 0</span>
      </div>
    </div>
    <div class="viz-canvas-wrap">
      <div id="viz-content-canvas" class="viz-content-canvas"></div>
    </div>
    <div class="viz-panel-info">
      <div class="viz-explanation-box" id="viz-explanation-box">
        <strong>Ready to start:</strong> Select an approach and click <strong>Play ▶</strong> or <strong>Step Forward ⏭</strong> to watch the algorithm execute step-by-step.
      </div>
      <div class="viz-tray">
        <div class="viz-tray-status" id="viz-status-text">
          Status: Ready
        </div>
        <div class="viz-variables-tray" id="viz-variables-tray">
          <!-- Live variable pills -->
        </div>
      </div>
    </div>
  `;

  psBody.after(vizCard);

  initVisualizerListeners();
  if (modes.length > 0) {
    computeAndRenderVisualizer(modes[0].id);
  }
}

// Backwards-compatible hook
function renderTreeGraphVisualizer(prob) {
  renderUniversalVisualizer(prob);
}


function updateProblemView() {
  const prob = PROBLEMS[currentProblemId];
  if (!prob) return;

  const isStarred = isProblemStarred(prob);

  // Header and Hero
  const heroTitleElem = document.querySelector(".hero-title");
  if (heroTitleElem) {
    heroTitleElem.innerHTML = `${escapeHtml(prob.title)}<span class="hero-period">.</span>`;
  }
  renderHeroStarButton(isStarred, prob.id, false);
  document.querySelector(".hero-subtitle").textContent = prob.subtitle;
  updateProgressStats();

  const headerCurrSection = document.getElementById("header-curr-section");
  if (headerCurrSection)
    headerCurrSection.textContent =
      prob.category || prob.tag || "Java Practice";

  const headerCurrTitle = document.getElementById("header-curr-title");
  if (headerCurrTitle)
    headerCurrTitle.textContent = `${prob.num}. ${prob.title}`;

  // Problem Statement formatted into readable paragraphs and structured sections
  const psBody = document.querySelector(".problem-statement-body");
  if (psBody) {
    let html = formatProblemBrief(prob.brief);
    if (prob.image) {
      html += `
        <div class="problem-diagram-container">
          <img src="${escapeHtml(prob.image)}" alt="Problem Diagram" class="problem-diagram-img" />
        </div>
      `;
    }
    psBody.innerHTML = html;
    psBody.classList.remove("problem-fade-enter");
    void psBody.offsetWidth; // trigger reflow
    psBody.classList.add("problem-fade-enter");
  }

  // Input / Output rules with robust fallbacks
  const defaultInFmt =
    prob.sampleCases && prob.sampleCases[0]
      ? `Read standard input (e.g. <code>${escapeHtml(prob.sampleCases[0].input.replace(/\n/g, " "))}</code>)`
      : "Read input from standard input using Scanner.";
  const defaultOutFmt =
    prob.sampleCases && prob.sampleCases[0]
      ? `Print output matching expected format (e.g. <code>${escapeHtml(prob.sampleCases[0].expected.replace(/\n/g, " "))}</code>)`
      : "Print result to standard output.";

  document.getElementById("rule-input-format").innerHTML =
    `<strong>Input Format:</strong> ${prob.inputFormat || defaultInFmt}`;
  document.getElementById("rule-output-format").innerHTML =
    `<strong>Output Format:</strong> ${prob.outputFormat || defaultOutFmt}`;

  // Time & Space Complexity Badges
  const comp = getProblemComplexity(prob);
  const heroCompWrap = document.getElementById("hero-complexity-wrap");
  if (heroCompWrap) {
    heroCompWrap.innerHTML = `
      <span class="complexity-pill time-pill" title="Estimated Time Complexity">⏱️ <strong>${comp.time}</strong></span>
      <span class="complexity-pill space-pill" title="Estimated Auxiliary Space Complexity">💾 <strong>${comp.space}</strong></span>
    `;
  }

  // Multi-Paradigm Interactive Algorithm & Data Structure Visualizer
  renderUniversalVisualizer(prob);

  // Structured Sample Cases Showcase
  renderSampleCases(prob);

  // Hints
  renderHints(prob);

  // Solution Reference Code
  const solutionText = prob.solutionCode || prob.solution || "";
  document.querySelector(".solution-code code").textContent = solutionText;
  document.getElementById("solution-badge-text").textContent =
    prob.category || prob.tag || "Java Solution";

  // Solution Hover Card Preview
  const solPreview = document.getElementById("solution-preview-code");
  if (solPreview) {
    solPreview.innerHTML = `<code>${escapeHtml(solutionText || "// No solution available")}</code>`;
  }

  // Solution Strategy & Explanation Walkthrough
  renderSolutionExplanation(prob);

  // Custom runner placeholder
  if (customInputBox) {
    const firstSample =
      prob.sampleCases && prob.sampleCases[0] ? prob.sampleCases[0] : null;
    customInputBox.value = firstSample ? firstSample.input : "";
  }

  // Testcases
  renderTestcases();
  resetTestBenchState();
  updatePrevNextButtons();
}

function updatePrevNextButtons() {
  const problemsArray = Object.values(PROBLEMS);
  const currentIndex = problemsArray.findIndex(
    (p) => p.id === currentProblemId,
  );
  const prevBtn = document.getElementById("btn-prev-problem");
  const nextBtn = document.getElementById("btn-next-problem");

  if (prevBtn) prevBtn.disabled = currentIndex <= 0;
  if (nextBtn) nextBtn.disabled = currentIndex >= problemsArray.length - 1;
}

function navigateProblem(direction) {
  const problemsArray = Object.values(PROBLEMS);
  const currentIndex = problemsArray.findIndex(
    (p) => p.id === currentProblemId,
  );
  const targetIndex = currentIndex + direction;

  if (targetIndex >= 0 && targetIndex < problemsArray.length) {
    switchProblem(problemsArray[targetIndex].id);
  }
}

function formatProblemBrief(rawText) {
  if (!rawText)
    return "<p class='ps-paragraph'>No problem description available.</p>";

  // Normalize bullet markers
  let text = String(rawText)
    .replace(/\uFFFD/g, "•")
    .replace(/•/g, "•");

  // Break apart common section titles and structural triggers into separate blocks
  text = text.replace(
    /\s*(The class should contain the following data members:|with the following data members:|with data members:|Data members:|Data Member:?\b)/gi,
    "\n\n$1\n\n",
  );
  text = text.replace(
    /\s*(Create the following member methods:|Create the following overloaded methods:|Create the following overloaded constructors:|Create the following overloaded calculate\(\) methods:|Create the following overloaded calculatePoints\(\) methods:|Create the following methods:|Create member methods:|Create methods:|Overloaded constructors:|Member Functions:?|Constructors:?\b)/gi,
    "\n\n$1\n\n",
  );
  text = text.replace(
    /\s*(To provide a common structure,?\s*create an? (?:abstract )?class[^\n.]*\.)/gi,
    "\n\n$1\n\n",
  );
  text = text.replace(
    /\s*(Create an? (?:abstract )?class[^\n.]*\.)/gi,
    "\n\n$1\n\n",
  );
  text = text.replace(/\s*(Create an? (?:interface)[^\n.]*\.)/gi, "\n\n$1\n\n");
  text = text.replace(/\s*(Create a superclass[^\n.]*\.)/gi, "\n\n$1\n\n");
  text = text.replace(/\s*(Create a subclass[^\n.]*\.)/gi, "\n\n$1\n\n");
  text = text.replace(
    /\s*(Create (?:a|the) (?:parameterized|default|overloaded)?\s*constructor[^\n.]*\b)/gi,
    "\n\n$1",
  );
  text = text.replace(
    /\s*(Create (?:a|the) (?:member )?method[^\n.]*\b)/gi,
    "\n\n$1",
  );
  text = text.replace(
    /\s*(Create (?:a|the) display(?:Details|Result)\(\)[^\n.]*\b)/gi,
    "\n\n$1",
  );
  text = text.replace(/\s*(Override the [^\n.]*\.)/gi, "\n\n$1\n\n");
  text = text.replace(
    /\s*(The class should contain an? abstract method[^\n.]*\.)/gi,
    "\n\n$1\n\n",
  );
  text = text.replace(
    /\s*(The permanent employee receives[^\n.]*\.)/gi,
    "\n\n$1\n\n",
  );
  text = text.replace(/\s*(For a regular employee[^\n.]*\.)/gi, "\n\n$1\n\n");
  text = text.replace(
    /\s*(Use an? (?:abstract class|interface) to demonstrate[^\n.]*\.)/gi,
    "\n\n$1\n\n",
  );
  text = text.replace(/\s*(Write a Java program[^\n.]*\.)/gi, "\n\n$1\n\n");
  text = text.replace(/\s*(In (?:the )?main\(\)[^\n.]*\b)/gi, "\n\n$1");
  text = text.replace(/\s*(Constraints:)/gi, "\n\n__SEC_CONSTRAINTS__$1");
  text = text.replace(/\s*(Formula:)/gi, "\n\n__SEC_FORMULA__$1");

  // Ensure each bullet starts on a new line
  text = text.replace(/\s*(•|\u2022)\s*/g, "\n• ");

  const rawSections = text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const htmlBlocks = [];

  rawSections.forEach((sec) => {
    if (sec.includes("__SEC_CONSTRAINTS__")) {
      const clean = sec
        .replace("__SEC_CONSTRAINTS__", "")
        .replace(/Constraints:/i, "")
        .trim();
      const items = clean
        .split(/[,;\n•]+/)
        .map((c) => c.trim())
        .filter(Boolean);
      const badges = items
        .map((it) => {
          const mathClean = escapeHtml(it)
            .replace(/<=|&lt;=/g, "⩽")
            .replace(/>=|&gt;=/g, "⩾");
          return `<span class="ps-constraint-pill"><code>${mathClean}</code></span>`;
        })
        .join("");
      htmlBlocks.push(`
        <div class="ps-constraints-section">
          <div class="ps-section-heading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>CONSTRAINTS</span>
          </div>
          <div class="ps-constraints-grid">${badges}</div>
        </div>
      `);
    } else {
      const lines = sec
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      let currentParaLines = [];
      let currentListItems = [];
      let currentListType = "";

      function flushPara() {
        if (currentParaLines.length > 0) {
          const pText = currentParaLines.join(" ");
          if (
            /^(Class Name:|Data Member|Constructors|Member Functions|Note:|The class should contain the following data members:|Create the following|Overloaded constructors:|The class should have methods to:|The username must contain:|A string is considered perfect)/i.test(
              pText,
            )
          ) {
            htmlBlocks.push(
              `<div class="ps-lead">${highlightJavaKeywords(escapeHtml(pText))}</div>`,
            );
          } else {
            htmlBlocks.push(
              `<p class="ps-paragraph">${highlightJavaKeywords(escapeHtml(pText))}</p>`,
            );
          }
          currentParaLines = [];
        }
      }

      function flushList() {
        if (currentListItems.length > 0) {
          const listHtml = currentListItems
            .map(
              (item) => `
            <li class="ps-list-item">
              <span class="ps-bullet-dot"></span>
              <span>${highlightJavaKeywords(escapeHtml(item))}</span>
            </li>
          `,
            )
            .join("");
          htmlBlocks.push(`
            <div class="ps-block">
              <ul class="ps-list">${listHtml}</ul>
            </div>
          `);
          currentListItems = [];
          currentListType = "";
        }
      }

      lines.forEach((line) => {
        const isBullet =
          line.startsWith("•") ||
          line.startsWith("- ") ||
          line.startsWith("* ");
        const isNumber = /^\d+\.\s+/.test(line);

        if (isBullet) {
          flushPara();
          if (currentListType && currentListType !== "bullet") flushList();
          currentListType = "bullet";
          currentListItems.push(line.replace(/^[•\-\*]\s*/, ""));
        } else if (isNumber) {
          flushPara();
          if (currentListType && currentListType !== "number") flushList();
          currentListType = "number";
          currentListItems.push(line.replace(/^\d+\.\s*/, ""));
        } else if (
          /^(Class Name:|Data Member|Constructors|Member Functions|Note:|The class should contain the following data members:|Create the following|Overloaded constructors:|The class should have methods to:|The username must contain:|A string is considered perfect)/i.test(
            line,
          )
        ) {
          flushList();
          flushPara();
          htmlBlocks.push(
            `<div class="ps-lead">${highlightJavaKeywords(escapeHtml(line))}</div>`,
          );
        } else {
          flushList();
          currentParaLines.push(line);
        }
      });

      flushList();
      flushPara();
    }
  });

  return htmlBlocks.join("");
}

function highlightJavaKeywords(str) {
  if (!str) return "";

  // Highlight keywords and compound type variable declarations e.g. "static int studentCount", "String name", "int marks", "double dailyWage"
  return (
    str
      // Compound declarations with static/type + identifier
      .replace(
        /\b((?:static\s+)?(?:int|double|float|long|boolean|char|String|void)\s+[a-zA-Z0-9_]+)\b/g,
        '<code class="code-decl">$1</code>',
      )
      // Standard keywords
      .replace(
        /\b(int|double|float|long|boolean|char|String|void|static|abstract|class|extends|implements|public|private|protected|try|catch|finally|throw|throws|new|return|this|super)\b(?![^<]*>)/g,
        '<code class="code-kw">$1</code>',
      )
      // Method signatures like calculateSalary() or displayDetails()
      .replace(/\b([a-zA-Z0-9_]+\([^)]*\))/g, '<code class="code-fn">$1</code>')
  );
}

function renderSampleCases(prob) {
  const container = document.getElementById("sample-cases-container");
  const countBadge = document.getElementById("sample-cases-count-badge");
  if (!container) return;

  const cases = prob.sampleCases || [];
  const edgeCases = prob.edgeCases || [];
  const totalCasesCount = cases.length + edgeCases.length;

  if (countBadge) {
    countBadge.textContent = `${cases.length} Shown · ${totalCasesCount} Total`;
  }

  if (cases.length === 0) {
    container.innerHTML = `<div style="padding: 14px; text-align: center; color: var(--text-subtle); font-size: 12px;">No sample test cases specified.</div>`;
    return;
  }

  const sampleHtml = cases
    .map((tc, idx) => {
      const inputEsc = escapeHtml(tc.input);
      const outputEsc = escapeHtml(tc.expected);
      const hasExplanation = tc.explanation && tc.explanation.trim().length > 0;

      return `
      <div class="sample-case-card">
        <div class="sample-case-top">
          <span class="sample-num-badge">Example ${idx + 1}</span>
          <button class="sample-copy-btn" onclick="copySampleInput(${idx})" type="button" title="Copy Sample Input">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy Input</span>
          </button>
        </div>
        <div class="sample-case-grid">
          <div class="sample-box input-box">
            <div class="sample-box-header">
              <span class="sample-box-title">Input</span>
            </div>
            <pre class="sample-code" id="sample-input-${idx}">${inputEsc}</pre>
          </div>
          <div class="sample-box output-box">
            <div class="sample-box-header">
              <span class="sample-box-title">Output</span>
            </div>
            <pre class="sample-code output">${outputEsc}</pre>
          </div>
        </div>
        ${
          hasExplanation
            ? `
          <div class="sample-explanation-box">
            <div class="explanation-icon">💡</div>
            <div class="explanation-text"><strong>Explanation:</strong> ${escapeHtml(tc.explanation)}</div>
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");

  // Additional Edge Cases Section (Collapsible Showcase with 💡 Explanations)
  let moreCasesHtml = "";
  if (edgeCases.length > 0) {
    const edgeCardsHtml = edgeCases
      .map((tc, eIdx) => {
        const globalIdx = cases.length + eIdx + 1;
        const inputEsc = escapeHtml(tc.input);
        const outputEsc = escapeHtml(tc.expected);
        const hasExplanation = tc.explanation && tc.explanation.trim().length > 0;

        return `
        <div class="sample-case-card edge-example-card">
          <div class="sample-case-top">
            <span class="sample-num-badge edge-badge">Example ${globalIdx} (Edge Case)</span>
            <button class="sample-copy-btn" onclick="copyEdgeInput(${eIdx})" type="button" title="Copy Test Input">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy Input</span>
            </button>
          </div>
          <div class="sample-case-grid">
            <div class="sample-box input-box">
              <div class="sample-box-header">
                <span class="sample-box-title">Input</span>
              </div>
              <pre class="sample-code">${inputEsc}</pre>
            </div>
            <div class="sample-box output-box">
              <div class="sample-box-header">
                <span class="sample-box-title">Output</span>
              </div>
              <pre class="sample-code output">${outputEsc}</pre>
            </div>
          </div>
          ${
            hasExplanation
              ? `
            <div class="sample-explanation-box">
              <div class="explanation-icon">💡</div>
              <div class="explanation-text"><strong>Explanation:</strong> ${escapeHtml(tc.explanation)}</div>
            </div>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");

    moreCasesHtml = `
      <div class="more-examples-wrapper">
        <button id="btn-toggle-more-examples" class="btn-toggle-more-examples" type="button" onclick="toggleMoreExamples()">
          <span class="more-examples-icon">💡</span>
          <span id="more-examples-label">Show ${edgeCases.length} More Test Case${edgeCases.length === 1 ? "" : "s"} & Explanations</span>
          <span id="more-examples-chevron" class="more-examples-chevron">▼</span>
        </button>
        <div id="more-examples-drawer" class="more-examples-drawer hidden">
          ${edgeCardsHtml}
        </div>
      </div>
    `;
  }

  container.innerHTML = sampleHtml + moreCasesHtml;
}

window.copySampleInput = async function (idx) {
  const prob = PROBLEMS[currentProblemId];
  if (prob && prob.sampleCases && prob.sampleCases[idx]) {
    try {
      await navigator.clipboard.writeText(prob.sampleCases[idx].input);
      showToast(`Example ${idx + 1} input copied to clipboard`);
    } catch (e) {
      showToast("Failed to copy input");
    }
  }
};

window.copyEdgeInput = async function (idx) {
  const prob = PROBLEMS[currentProblemId];
  if (prob && prob.edgeCases && prob.edgeCases[idx]) {
    try {
      await navigator.clipboard.writeText(prob.edgeCases[idx].input);
      showToast(`Edge Case ${idx + 1} input copied to clipboard`);
    } catch (e) {
      showToast("Failed to copy input");
    }
  }
};

window.toggleMoreExamples = function () {
  const drawer = document.getElementById("more-examples-drawer");
  const chevron = document.getElementById("more-examples-chevron");
  const label = document.getElementById("more-examples-label");
  const prob = PROBLEMS[currentProblemId];
  const count = prob && prob.edgeCases ? prob.edgeCases.length : 0;
  if (!drawer) return;

  const isHidden = drawer.classList.contains("hidden");
  if (isHidden) {
    drawer.classList.remove("hidden");
    if (chevron) chevron.textContent = "▲";
    if (label)
      label.textContent = `Hide ${count} Edge Test Case${count === 1 ? "" : "s"}`;
  } else {
    drawer.classList.add("hidden");
    if (chevron) chevron.textContent = "▼";
    if (label)
      label.textContent = `Show ${count} More Test Case${count === 1 ? "" : "s"} & Explanations`;
  }
};

function generateProblemStrategy(prob) {
  if (!prob) return "Trace standard input according to evaluation criteria.";
  const cat = (prob.category || "").toLowerCase();
  const title = (prob.title || "").toLowerCase();

  if (title.includes("dijkstra")) {
    return "Use Dijkstra's algorithm with a priority queue (min-heap) or distance array to greedily pick the vertex with minimal tentative distance, relaxing all adjacent edges until the shortest path tree is formed.";
  }
  if (title.includes("floyd") || title.includes("warshall")) {
    return "Employ the Floyd-Warshall dynamic programming algorithm with three nested loops across intermediate vertices k, source i, and destination j to compute all-pairs shortest paths in O(V³) time.";
  }
  if (cat.includes("graph")) {
    return "Model vertices and edges using an adjacency list or matrix. Traverse using Breadth-First Search (BFS) for shortest reach or Depth-First Search (DFS) for connectivity, cycles, and reachability.";
  }
  if (title.includes("matrix chain")) {
    return "Apply dynamic programming across subproblem lengths l, evaluating split points k where dp[i][j] = min(dp[i][k] + dp[k+1][j] + cost) to minimize scalar multiplications.";
  }
  if (title.includes("lcs") || title.includes("longest common")) {
    return "Build a 2D dynamic programming grid where matching characters increment dp[i][j] = 1 + dp[i-1][j-1], and mismatched characters propagate max(dp[i-1][j], dp[i][j-1]).";
  }
  if (title.includes("knapsack")) {
    return "Determine optimal value for capacity W using 0/1 dynamic programming tabulation dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w - wt[i]]), or fractional greedy sorting by value/weight ratio.";
  }
  if (cat.includes("binary search tree") || cat.includes("bst")) {
    return "Leverage the BST ordering invariant (left child < node < right child) to perform lookups, insertions, and validation in O(height) time without inspecting irrelevant branches.";
  }
  if (cat.includes("tree")) {
    return "Traverse the hierarchical structure recursively (inorder, preorder, postorder) or level-order with a queue, accumulating subtree properties and updating tree invariants.";
  }
  if (cat.includes("stack")) {
    return "Maintain a Last-In First-Out (LIFO) stack to evaluate arithmetic expressions, validate bracket matching, or maintain monotonic candidate elements.";
  }
  if (cat.includes("queue")) {
    return "Process elements in First-In First-Out (FIFO) sequence, ensuring linear-time scheduling and level-order exploration.";
  }
  if (cat.includes("linked list")) {
    return "Manipulate node pointers sequentially with dummy sentinel heads to simplify edge modifications, and use two-pointer (fast/slow) runner techniques for cycle or midpoint detection.";
  }
  if (cat.includes("inheritance") || cat.includes("polymorphism") || cat.includes("interface")) {
    return "Design clean object hierarchies where base classes or interfaces define core contracts, and derived classes override specific behaviors using @Override and super references.";
  }
  if (cat.includes("exception")) {
    return "Wrap potentially faulty I/O or arithmetic operations inside try-catch-finally blocks, ensuring proper resource management and descriptive error handling.";
  }
  if (cat.includes("array")) {
    return "Iterate through the array elements while maintaining running aggregations, optimal candidates, or two-pointer boundaries in linear O(N) time with minimal O(1) auxiliary space.";
  }
  if (cat.includes("string")) {
    return "Scan character sequences, leveraging StringBuilder or regex parsing to validate patterns and perform in-place transformations without redundant string allocations.";
  }
  return "Parse standard input according to the specification format, execute the core algorithmic logic while respecting boundary conditions, and format the exact output expected.";
}

function renderSolutionExplanation(prob) {
  const container = document.getElementById("solution-expl-content");
  if (!container) return;
  if (!prob) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No explanation available for this problem.</p>`;
    return;
  }

  const comp = getProblemComplexity(prob);
  const sampleExplanations = (prob.sampleCases || [])
    .filter((tc) => tc.explanation && tc.explanation.trim().length > 0)
    .map(
      (tc, i) =>
        `<li><strong>Case ${i + 1}:</strong> ${escapeHtml(tc.explanation)}</li>`,
    )
    .join("");

  const edgeExplanations = (prob.edgeCases || [])
    .filter((tc) => tc.explanation && tc.explanation.trim().length > 0)
    .slice(0, 2)
    .map(
      (tc) =>
        `<li><strong>Edge Case:</strong> ${escapeHtml(tc.explanation)}</li>`,
    )
    .join("");

  const hintsList =
    prob.hints && prob.hints.length > 0
      ? prob.hints
          .map(
            (h) =>
              `<li><strong>${escapeHtml(h.title || "Note")}:</strong> ${escapeHtml(h.text || "")}</li>`,
          )
          .join("")
      : "";

  let strategyHtml = `
    <div class="sol-expl-meta-pills">
      <span class="sol-expl-pill category-pill">🏷️ ${escapeHtml(prob.category || "Core Java")}</span>
      <span class="sol-expl-pill time-pill">⏱️ Time: ${escapeHtml(comp.time)}</span>
      <span class="sol-expl-pill space-pill">💾 Space: ${escapeHtml(comp.space)}</span>
    </div>

    <div class="sol-expl-section">
      <div class="sol-section-title">📌 Key Algorithmic Strategy</div>
      <p class="sol-section-desc">${escapeHtml(generateProblemStrategy(prob))}</p>
    </div>

    <div class="sol-expl-section">
      <div class="sol-section-title">💡 Concrete Test Case Logic Walkthrough</div>
      <ul class="sol-expl-list">
        ${sampleExplanations || "<li>Trace input according to specification rules.</li>"}
        ${edgeExplanations}
      </ul>
    </div>
  `;

  if (hintsList) {
    strategyHtml += `
      <div class="sol-expl-section">
        <div class="sol-section-title">⚡ Implementation Tips & Invariants</div>
        <ul class="sol-expl-list">
          ${hintsList}
        </ul>
      </div>
    `;
  }

  container.innerHTML = strategyHtml;
}

function renderHints(prob) {
  const container = document.getElementById("hints-stepper-container");
  if (!container) return;

  const hints =
    prob.hints && prob.hints.length > 0
      ? prob.hints
      : [
          {
            title: "Core Logic",
            text: "Carefully trace through the problem statement, inputs, and expected outputs.",
          },
          {
            title: "Data Types & Flow",
            text: "Ensure proper data types (int, double, String) and loop boundaries are maintained.",
          },
          {
            title: "Edge Cases",
            text: "Verify zero, negative numbers, single elements, and empty or large inputs.",
          },
        ];

  container.innerHTML = hints
    .map(
      (hint, idx) => `
    <details class="hint-details">
      <summary class="hint-summary">
        <span>💡 Hint ${idx + 1}: ${escapeHtml(hint.title || `Step ${idx + 1}`)}</span>
      </summary>
      <div class="hint-body">
        ${hint.text}
      </div>
    </details>
  `,
    )
    .join("");
}

function switchProblem(probId, updateHistory = true) {
  if (typeof editorDiagnostics !== "undefined") {
    editorDiagnostics.clear();
  }
  if (typeof practiceTimer !== "undefined" && practiceTimer.switchProblem) {
    practiceTimer.switchProblem(probId);
  }

  const applySwitch = () => {
    currentProblemId = probId;
    saveActiveProblem(probId);
    if (updateHistory && typeof history !== "undefined" && history.replaceState) {
      try {
        history.replaceState(null, "", "#" + probId);
      } catch (e) {}
    }
    const prob = PROBLEMS[probId];
    if (prob && prob.category) {
      expandedSections.add(prob.category);
    }
    renderProblemNavList();
    loadSavedCodeOrBoilerplate();
    updateProblemView();
    if (cmEditor) {
      cmEditor.refresh();
      cmEditor.focus();
    }
  };

  // Modern View Transitions API cross-fade
  if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
    document.startViewTransition(() => {
      applySwitch();
    });
  } else {
    // Graceful cross-fade fallback
    const target = document.querySelector(".workspace-wrap");
    if (target) {
      target.classList.add("problem-fade-exit");
      setTimeout(() => {
        applySwitch();
        target.classList.remove("problem-fade-exit");
        target.classList.add("problem-fade-enter");
        setTimeout(() => target.classList.remove("problem-fade-enter"), 280);
      }, 150);
    } else {
      applySwitch();
    }
  }

  const prob = PROBLEMS[probId];
  showToast(`Loaded: ${prob ? prob.title : probId}`);

  setTimeout(() => {
    const activeItem = problemListNav
      ? problemListNav.querySelector(`.problem-nav-item.active`)
      : null;
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, 40);
}

// ==========================================
// Code Storage & Reset Logic
// ==========================================
function loadSavedCodeOrBoilerplate() {
  const prob = PROBLEMS[currentProblemId];
  if (!prob) return;
  try {
    const saved = localStorage.getItem(`code_${currentProblemId}`);
    if (saved !== null && saved !== undefined) {
      setEditorCode(saved);
      return;
    }
  } catch (e) {}
  if (prob.starterCode) {
    setEditorCode(prob.starterCode);
  }
}

function saveCodeToStorage() {
  if (!currentProblemId) return;
  try {
    const code = getEditorCode();
    localStorage.setItem(`code_${currentProblemId}`, code);
  } catch (e) {}
}

// ==========================================
// Testcases Rendering
// ==========================================
function renderTestcases() {
  const prob = PROBLEMS[currentProblemId];
  if (!prob) return;

  const samples = prob.sampleCases || [];
  const edges = prob.edgeCases || [];

  sampleTestcaseList.innerHTML = renderTestcaseRows(samples);

  if (edges.length > 0) {
    edgeTestcaseList.innerHTML = renderTestcaseRows(edges);
  } else {
    edgeTestcaseList.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-subtle); font-size: 12px;">
        All official test cases for this question are listed under Sample Cases.
      </div>
    `;
  }

  document.getElementById("tab-sample-count").textContent =
    `Sample Cases (${samples.length})`;
  document.getElementById("tab-edge-count").textContent =
    `Edge Cases (${edges.length})`;
}

function renderTestcaseRows(cases) {
  return cases
    .map((tc, idx) => {
      const res = testResultsMap.get(tc.id);
      const hasExplanation = tc.explanation && tc.explanation.trim().length > 0;
      const tcIdEsc = escapeHtml(tc.id);
      const delayMs = idx * 50; // Staggered by 50ms per row
      return `
      <div class="testcase-item stagger-in" id="tc-item-${tcIdEsc}" style="animation-delay: ${delayMs}ms;">
        <div class="testcase-row ${hasExplanation ? "tc-has-expl" : ""}" data-id="${tcIdEsc}" onclick="toggleTestcaseExpl('${tcIdEsc}')" title="${hasExplanation ? "Click to view 💡 explanation" : ""}">
          <span class="tc-input" title="${escapeHtml(tc.input)}">${escapeHtml(tc.input.replace(/\n/g, " ↵ "))}</span>
          <span class="tc-expected" title="${escapeHtml(tc.expected)}">${escapeHtml(tc.expected.replace(/\n/g, " ↵ "))}</span>
          <div class="tc-status-cell">
            ${renderStatusCell(res)}
            ${hasExplanation ? `<button class="tc-expl-btn" type="button" onclick="event.stopPropagation(); toggleTestcaseExpl('${tcIdEsc}')" title="View 💡 Explanation">💡</button>` : ""}
          </div>
        </div>
        ${
          hasExplanation
            ? `
          <div class="testcase-inline-expl hidden" id="tc-expl-${tcIdEsc}">
            <div class="tc-expl-inner">
              <span class="tc-expl-icon">💡</span>
              <div class="tc-expl-body">
                <span class="tc-expl-tag">Explanation:</span>
                <span class="tc-expl-text">${escapeHtml(tc.explanation)}</span>
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");
}

window.toggleTestcaseExpl = function (tcId) {
  const el = document.getElementById(`tc-expl-${tcId}`);
  if (!el) return;
  const isHidden = el.classList.contains("hidden");
  if (isHidden) {
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
};

function renderStatusCell(res) {
  if (!res) {
    return `<span class="status-dot-idle"></span>`;
  }
  if (res.status === "passed") {
    return `<span class="status-pill pass"><svg class="anim-svg-icon anim-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Pass</span>`;
  }
  if (res.status === "failed") {
    return `<span class="status-pill fail"><svg class="anim-svg-icon anim-cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>Fail</span>`;
  }
  if (res.status === "timeout") {
    return `<span class="status-pill timeout">⏱ Time</span>`;
  }
  return `<span class="status-pill error">⚠ Err</span>`;
}

// ==========================================
// Event Listeners Setup
// ==========================================
// Toggle Reference Solution visibility & Load Solution
// ==========================================
window.loadActiveSolution = function () {
  const prob = PROBLEMS[currentProblemId];
  const sol = prob ? prob.solutionCode || prob.solution : null;
  if (sol) {
    setEditorCode(sol);
    saveCodeToStorage();
    if (cmEditor) {
      cmEditor.refresh();
      cmEditor.focus();
    }
    showToast("Optimal solution loaded into editor");
  } else {
    showToast("No solution code found for this problem");
  }
};

function formatProblemForClipboard(prob) {
  if (!prob) return "";

  const title = `${prob.num ? prob.num + ". " : ""}${prob.title || "Problem"}`;
  const category = prob.category || prob.tag || "Java Practice";
  const brief = (prob.brief || "").trim();

  const inFormat = (prob.inputFormat || "").trim();
  const outFormat = (prob.outputFormat || "").trim();

  const sampleCases = Array.isArray(prob.sampleCases) ? prob.sampleCases : [];
  const edgeCases = Array.isArray(prob.edgeCases) ? prob.edgeCases : [];

  const boilerplate = (prob.starterCode || prob.boilerplate || "").trim();

  let text = `# ${title}\n`;
  text += `Category: ${category}\n\n`;

  text += `## Problem Specification\n${brief}\n\n`;

  if (inFormat) {
    text += `### Input Format\n${inFormat}\n\n`;
  }
  if (outFormat) {
    text += `### Output Format\n${outFormat}\n\n`;
  }

  if (sampleCases.length > 0) {
    text += `## Sample Test Cases\n\n`;
    sampleCases.forEach((tc, idx) => {
      text += `### Sample Case ${idx + 1}:\n`;
      text += `Input:\n${tc.input || ""}\n\n`;
      text += `Expected Output:\n${tc.expected || ""}\n\n`;
      if (tc.explanation) {
        text += `Explanation:\n${tc.explanation}\n\n`;
      }
    });
  }

  if (edgeCases.length > 0) {
    text += `## Edge Test Cases\n\n`;
    edgeCases.forEach((tc, idx) => {
      text += `### Edge Case ${idx + 1}:\n`;
      text += `Input:\n${tc.input || ""}\n\n`;
      text += `Expected Output:\n${tc.expected || ""}\n\n`;
      if (tc.explanation) {
        text += `Explanation:\n${tc.explanation}\n\n`;
      }
    });
  }

  if (boilerplate) {
    text += `## Boilerplate Code\n\`\`\`java\n${boilerplate}\n\`\`\`\n`;
  }

  return text.trim();
}

let copySpecTimer = null;

window.copyProblemSpecification = async function () {
  const prob = PROBLEMS[currentProblemId];
  if (!prob) {
    showToast("No problem loaded to copy");
    return;
  }

  const copyText = formatProblemForClipboard(prob);
  if (!copyText) {
    showToast("Problem details are empty");
    return;
  }

  let copySuccessful = false;
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(copyText);
      copySuccessful = true;
    } else {
      throw new Error("Clipboard API unavailable");
    }
  } catch (err) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = copyText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      copySuccessful = document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (e) {
      copySuccessful = false;
    }
  }

  if (copySuccessful) {
    const btn = document.getElementById("btn-copy-spec");
    if (btn) {
      if (copySpecTimer) clearTimeout(copySpecTimer);
      btn.classList.add("is-copied");
      btn.setAttribute("title", "Copied!");

      copySpecTimer = setTimeout(() => {
        btn.classList.remove("is-copied");
        btn.setAttribute("title", "Copy problem specification, test cases & boilerplate");
        copySpecTimer = null;
      }, 1000);
    }
    showToast("Problem specification, test cases & boilerplate copied!");
  } else {
    showToast("Failed to copy to clipboard");
  }
};

window.copyActiveSolution = async function () {
  const prob = PROBLEMS[currentProblemId];
  const sol = prob ? prob.solutionCode || prob.solution : null;
  const copyText = document.getElementById("copy-solution-text");
  if (!sol) {
    showToast("No solution code found to copy");
    return;
  }
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(sol);
    } else {
      throw new Error("Clipboard API unavailable");
    }
    if (copyText) copyText.textContent = "Copied!";
    showToast("Solution code copied to clipboard");
    setTimeout(() => {
      if (copyText) copyText.textContent = "Copy";
    }, 2000);
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = sol;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      if (copyText) copyText.textContent = "Copied!";
      showToast("Solution code copied to clipboard");
      setTimeout(() => {
        if (copyText) copyText.textContent = "Copy";
      }, 2000);
    } catch (err) {
      showToast("Failed to copy solution code");
    }
  }
};

let lastToggleSolTimestamp = 0;

window.toggleSolutionVisibility = function (source) {
  const now = Date.now();
  if (now - lastToggleSolTimestamp < 180) {
    return; // Prevent duplicate rapid firing from dual event handlers (CodeMirror + global keydown)
  }
  lastToggleSolTimestamp = now;

  const leftSolContainer = document.getElementById("solution-container");
  const leftSolBtn = document.getElementById("btn-toggle-solution");
  const hoverCard = document.getElementById("solution-hover-card");

  const isLeftVisible =
    leftSolContainer && !leftSolContainer.classList.contains("hidden");
  const isHoverVisible =
    hoverCard &&
    (hoverCard.classList.contains("visible-open") ||
      hoverCard.classList.contains("hover-active"));
  const isCurrentlyOpen = isLeftVisible || isHoverVisible;

  if (source === "left") {
    if (leftSolContainer) {
      if (isLeftVisible) {
        leftSolContainer.classList.add("hidden");
        if (leftSolBtn) {
          const span = leftSolBtn.querySelector("span");
          if (span) span.textContent = "Show Full Solution & Explanation";
        }
        showToast("Solution hidden");
      } else {
        leftSolContainer.classList.remove("hidden");
        if (leftSolBtn) {
          const span = leftSolBtn.querySelector("span");
          if (span) span.textContent = "Hide Solution";
        }
        leftSolContainer.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
        showToast("Reference Java solution revealed");
      }
    }
    return;
  }

  // Keyboard shortcut Ctrl + . or Cmd + . (or direct toggle call)
  if (isCurrentlyOpen) {
    // Hide all
    if (leftSolContainer) {
      leftSolContainer.classList.add("hidden");
      if (leftSolBtn) {
        const span = leftSolBtn.querySelector("span");
        if (span) span.textContent = "Show Full Solution & Explanation";
      }
    }
    if (hoverCard) {
      hoverCard.classList.remove("visible-open", "hover-active");
      const popoverWrap = document.querySelector(".solution-popover-wrap");
      if (popoverWrap) popoverWrap.classList.remove("is-hovered");
    }
    showToast("Solution hidden");
  } else {
    // Open both left container and editor dropdown for maximum clarity
    if (leftSolContainer) {
      leftSolContainer.classList.remove("hidden");
      if (leftSolBtn) {
        const span = leftSolBtn.querySelector("span");
        if (span) span.textContent = "Hide Solution";
      }
    }
    if (hoverCard) {
      hoverCard.classList.add("visible-open");
    }
    // If not actively typing in editor, smooth-scroll left solution into view
    if (!isEditorFocused() && leftSolContainer) {
      leftSolContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    showToast("Reference solution revealed (Ctrl + .)");
  }
};

function setupEventListeners() {
  let solutionHoverTimer = null;
  btnThemeToggle.addEventListener("click", toggleTheme);
  btnRunTests.addEventListener("click", runAllTests);

  // Hero Problem Title Star toggle button
  document.addEventListener("click", (e) => {
    const starBtn = e.target.closest("#btn-star-toggle");
    if (starBtn) {
      e.preventDefault();
      e.stopPropagation();
      const probId =
        starBtn.getAttribute("data-problem-id") || currentProblemId;
      toggleProblemStarred(probId, true);
    }
  });

  // Quick navigation
  const prevBtn = document.getElementById("btn-prev-problem");
  const nextBtn = document.getElementById("btn-next-problem");
  if (prevBtn) prevBtn.addEventListener("click", () => navigateProblem(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => navigateProblem(1));

  // Search input & clear button
  const searchInput = document.getElementById("sidebar-search-input");
  const searchClear = document.getElementById("sidebar-search-clear");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim();
      if (searchClear) {
        if (currentSearchQuery) {
          searchClear.classList.remove("hidden");
        } else {
          searchClear.classList.add("hidden");
        }
      }
      renderProblemNavList();
    });
  }

  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        currentSearchQuery = "";
        searchClear.classList.add("hidden");
        renderProblemNavList();
        searchInput.focus();
      }
    });
  }

  // Filter pills
  document.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-pill")
        .forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentFilter = pill.getAttribute("data-filter") || "all";
      renderProblemNavList();
    });
  });

  // Fallback textarea input event for timer
  if (codeTextarea) {
    codeTextarea.addEventListener("input", () => {
      if (typeof practiceTimer !== "undefined" && !practiceTimer.isRunning) {
        practiceTimer.start();
      }
    });
  }

  // Shortcuts Modal
  const shortcutsBtn = document.getElementById("btn-show-shortcuts");
  const shortcutsModal = document.getElementById("shortcuts-modal");
  const closeModalBtn = document.getElementById("btn-close-modal");

  if (shortcutsBtn && shortcutsModal) {
    shortcutsBtn.addEventListener("click", () => {
      shortcutsModal.classList.remove("hidden");
    });
  }
  if (closeModalBtn && shortcutsModal) {
    closeModalBtn.addEventListener("click", () => {
      shortcutsModal.classList.add("hidden");
    });
  }
  if (shortcutsModal) {
    shortcutsModal.addEventListener("click", (e) => {
      if (e.target === shortcutsModal) {
        shortcutsModal.classList.add("hidden");
      }
    });
  }

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Ctrl + . or Cmd + . to toggle solution visibility
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "." ||
        e.key === "Decimal" ||
        e.code === "Period" ||
        e.code === "NumpadDecimal" ||
        e.keyCode === 190 ||
        e.which === 190 ||
        e.keyCode === 110 ||
        e.which === 110)
    ) {
      e.preventDefault();
      e.stopPropagation();
      toggleSolutionVisibility();
      return;
    }
    // Focus search on '/'
    if (
      e.key === "/" &&
      document.activeElement !== searchInput &&
      !isEditorFocused()
    ) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
    // Toggle Shortcuts on '?'
    if (
      e.key === "?" &&
      !isEditorFocused() &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      if (shortcutsModal) shortcutsModal.classList.toggle("hidden");
    }
    // Escape closes modal / solution hover
    if (e.key === "Escape") {
      if (shortcutsModal && !shortcutsModal.classList.contains("hidden")) {
        shortcutsModal.classList.add("hidden");
      }
      const hoverCard = document.getElementById("solution-hover-card");
      if (
        hoverCard &&
        (hoverCard.classList.contains("visible-open") ||
          hoverCard.classList.contains("hover-active"))
      ) {
        hoverCard.classList.remove("visible-open", "hover-active");
        const popoverWrap = document.querySelector(".solution-popover-wrap");
        if (popoverWrap) popoverWrap.classList.remove("is-hovered");
        if (solutionHoverTimer) {
          clearTimeout(solutionHoverTimer);
          solutionHoverTimer = null;
        }
      }
    }
    // Alt + Left: Prev problem
    if (e.altKey && e.key === "ArrowLeft") {
      e.preventDefault();
      navigateProblem(-1);
    }
    // Alt + Right: Next problem
    if (e.altKey && e.key === "ArrowRight") {
      e.preventDefault();
      navigateProblem(1);
    }
    // Alt + T: Toggle theme
    if (e.altKey && (e.key === "t" || e.key === "T")) {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Format / Beautify Java Code Action
  const btnFormatCode = document.getElementById("btn-format-code");
  const iconFormat = document.getElementById("icon-format");
  if (btnFormatCode) {
    btnFormatCode.addEventListener("click", () => {
      formatEditorCode();
      if (iconFormat) {
        iconFormat.classList.remove("icon-spin");
        void iconFormat.offsetWidth; // trigger reflow
        iconFormat.classList.add("icon-spin");
      }
      showToast("Java code formatted & indented");
    });
  }

  // Reset code button
  if (btnResetCode) {
    btnResetCode.addEventListener("click", () => {
      const prob = PROBLEMS[currentProblemId];
      if (prob) {
        try {
          localStorage.removeItem(`code_${currentProblemId}`);
        } catch (e) {}

        if (solvedProblems.has(prob.id)) {
          solvedProblems.delete(prob.id);
          saveSolvedProgress();
          renderProblemNavList();
        }

        setEditorCode(prob.starterCode);
        resetTestBenchState();
        if (cmEditor) {
          cmEditor.refresh();
          cmEditor.focus();
        }
        showToast("Code reset to starter boilerplate");
      }
    });
  }

  // Copy code button
  if (btnCopyCode) {
    btnCopyCode.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(getEditorCode());
        if (copyBtnText) copyBtnText.textContent = "Copied!";
        showToast("Code copied to clipboard");
        setTimeout(() => {
          if (copyBtnText) copyBtnText.textContent = "Copy";
        }, 2000);
      } catch (e) {
        showToast("Failed to copy code");
      }
    });
  }

  // Testbench Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-pane")
        .forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const tabName = btn.getAttribute("data-tab");
      const targetPane = document.getElementById(`tab-content-${tabName}`);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Solution Tab Button (Editor Toolbar) - Click to load solution directly into editor
  const btnSolutionPopover = document.getElementById("btn-solution-popover");
  if (btnSolutionPopover) {
    btnSolutionPopover.addEventListener("click", (e) => {
      e.stopPropagation();
      const prob = PROBLEMS[currentProblemId];
      const sol = prob ? prob.solutionCode || prob.solution : null;
      if (sol) {
        setEditorCode(sol);
        saveCodeToStorage();
        if (cmEditor) {
          cmEditor.refresh();
          cmEditor.focus();
        }
        showToast("Optimal solution loaded into editor");
      } else {
        showToast("No solution code found for this problem");
      }
    });
  }

  // Toggle Solution Card (Brief / Left Column)
  if (btnToggleSolution) {
    btnToggleSolution.addEventListener("click", () => {
      toggleSolutionVisibility("left");
    });
  }

  // Hover to view solution: immediate show on mouseenter, 0.2s (200ms) delay on mouseleave
  const popoverWrap = document.querySelector(".solution-popover-wrap");
  const hoverCardElem = document.getElementById("solution-hover-card");

  if (popoverWrap && hoverCardElem) {
    popoverWrap.addEventListener("mouseenter", () => {
      // Show immediately (cancel any pending hide timer)
      if (solutionHoverTimer) {
        clearTimeout(solutionHoverTimer);
        solutionHoverTimer = null;
      }
      hoverCardElem.classList.add("hover-active");
      popoverWrap.classList.add("is-hovered");
    });

    popoverWrap.addEventListener("mouseleave", () => {
      // Keep visible for 0.2s (200ms) before hiding
      if (solutionHoverTimer) {
        clearTimeout(solutionHoverTimer);
      }
      solutionHoverTimer = setTimeout(() => {
        hoverCardElem.classList.remove("hover-active");
        popoverWrap.classList.remove("is-hovered");
        solutionHoverTimer = null;
      }, 100);
    });
  }

  // Close solution hover dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const hoverCard = document.getElementById("solution-hover-card");
    const popoverBtn = document.getElementById("btn-solution-popover");
    if (
      hoverCard &&
      (hoverCard.classList.contains("visible-open") ||
        hoverCard.classList.contains("hover-active"))
    ) {
      if (
        !hoverCard.contains(e.target) &&
        (!popoverBtn || !popoverBtn.contains(e.target))
      ) {
        hoverCard.classList.remove("visible-open", "hover-active");
        if (popoverWrap) popoverWrap.classList.remove("is-hovered");
        if (solutionHoverTimer) {
          clearTimeout(solutionHoverTimer);
          solutionHoverTimer = null;
        }
      }
    }
  });

  // Load Solution Button (inside Solution Card)
  if (btnLoadSolution) {
    btnLoadSolution.addEventListener("click", () => {
      const prob = PROBLEMS[currentProblemId];
      const sol = prob ? prob.solutionCode || prob.solution : null;
      if (sol) {
        setEditorCode(sol);
        saveCodeToStorage();
        if (cmEditor) {
          cmEditor.refresh();
          cmEditor.focus();
        }
        showToast("Optimal solution loaded into editor");
      } else {
        showToast("No solution code found for this problem");
      }
    });
  }

  // Copy Solution Button (inside Solution Card)
  const btnCopySolution = document.getElementById("btn-copy-solution");
  if (btnCopySolution) {
    btnCopySolution.addEventListener("click", () => {
      if (typeof window.copyActiveSolution === "function") {
        window.copyActiveSolution();
      }
    });
  }

  // Copy Problem Specification, Test Cases & Boilerplate Button
  const btnCopySpec = document.getElementById("btn-copy-spec");
  if (btnCopySpec) {
    btnCopySpec.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof window.copyProblemSpecification === "function") {
        window.copyProblemSpecification();
      }
    });
  }

  if (btnRunCustom) {
    btnRunCustom.addEventListener("click", runCustomTestcase);
  }
  if (customInputBox) {
    customInputBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        runCustomTestcase();
      }
    });
  }

  if (btnClearLogs && compilerLogsContent) {
    btnClearLogs.addEventListener("click", () => {
      compilerLogsContent.textContent = "Console cleared.";
    });
  }

  if (btnResetProgress) {
    btnResetProgress.addEventListener("click", () => {
      if (
        confirm(
          "Reset all question progress and saved code? All completed questions and saved code will be reset back to default.",
        )
      ) {
        solvedProblems.clear();
        try {
          localStorage.removeItem(SOLVED_STORAGE_KEY);
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("code_")) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {}
        if (typeof practiceTimer !== "undefined" && practiceTimer.resetAll) {
          practiceTimer.resetAll();
        }
        loadSavedCodeOrBoilerplate();
        renderProblemNavList();
        showToast("All question progress and code reset");
      }
    });
  }

  // Handle browser back / forward navigation and manual URL hash updates
  window.addEventListener("hashchange", () => {
    let rawHash = window.location.hash.replace(/^#/, "").split("?")[0].trim();
    try {
      rawHash = decodeURIComponent(rawHash);
    } catch (e) {}
    if (!rawHash) return;
    let targetId = null;
    if (PROBLEMS && PROBLEMS[rawHash]) {
      targetId = rawHash;
    } else {
      const numMatch = rawHash.match(/^(?:q)?(\d+)$/i);
      if (numMatch && PROBLEMS) {
        const targetNum = parseInt(numMatch[1], 10);
        const match = Object.values(PROBLEMS).find(
          (p) => p && (p.num === targetNum || String(p.num) === String(targetNum)),
        );
        if (match) targetId = match.id;
      }
    }
    if (targetId && targetId !== currentProblemId && PROBLEMS[targetId]) {
      switchProblem(targetId, false);
    }
  });
}

function isEditorFocused() {
  if (cmEditor && cmEditor.hasFocus()) return true;
  return document.activeElement === codeTextarea;
}

function formatEditorCode() {
  if (cmEditor) {
    const totalLines = cmEditor.lineCount();
    cmEditor.operation(() => {
      for (let i = 0; i < totalLines; i++) {
        cmEditor.indentLine(i);
      }
    });
  } else if (codeTextarea) {
    // Simple basic indent for textarea fallback
    const lines = codeTextarea.value.split("\n");
    let indentLevel = 0;
    const formatted = lines
      .map((line) => {
        let trimmed = line.trim();
        if (trimmed.startsWith("}") || trimmed.startsWith("]"))
          indentLevel = Math.max(0, indentLevel - 1);
        const res = "    ".repeat(indentLevel) + trimmed;
        if (trimmed.endsWith("{") || trimmed.endsWith("[")) indentLevel++;
        return res;
      })
      .join("\n");
    codeTextarea.value = formatted;
  }
  saveCodeToStorage();
}

function resetTestBenchState() {
  testResultsMap.clear();
  renderTestcases();
  diffDetailsSection.classList.add("hidden");
  diffDetailsList.innerHTML = "";

  const benchmarkBadge = document.getElementById("exec-benchmark-badge");
  if (benchmarkBadge) {
    benchmarkBadge.classList.add("hidden");
  }

  summaryCard.className = "summary-card empty";
  summaryTitle.textContent = "Your test bench is ready";
  summarySubtitle.textContent = `Write your logic in the editor and click 'Run all tests'.`;
}

// ==========================================
// Compiler Status Check
// ==========================================
const API_BASE_URL = (typeof window !== "undefined" && window.location && window.location.hostname.includes("vercel.app"))
  ? "https://javaprogrammingq.onrender.com"
  : "";

async function checkCompilerStatus(retryCount = 0) {
  // Show waking up state immediately
  if (compilerStatusDot && compilerStatusText) {
    compilerStatusDot.className = "status-dot waking-up";
    compilerStatusText.textContent = retryCount > 0 
      ? `Waking up compiler (cloud cold-start ~${retryCount * 3}s)…`
      : "Waking up compiler…";
    if (compilerStatusBadge) {
      compilerStatusBadge.title = "Pinging execution backend (Render free-tier instances take ~30s on cold start)...";
    }
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/check`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status) {
        compilerReady = true;
        const isLocal = !API_BASE_URL && (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"));
        compilerStatusDot.className = "status-dot ready";
        compilerStatusText.textContent = isLocal ? "Java 21 Ready (Local)" : "Compiler Ready (Cloud)";
        if (compilerStatusBadge) {
          compilerStatusBadge.title = `Compiler ready · javac: ${data.javac_version || "ready"}`;
        }
        appendLog(`[SYSTEM] Compiler backend connected (${isLocal ? "Local" : "Cloud"}):\n  - javac: ${data.javac_version || "ready"}\n  - java:  ${data.java_version || "ready"}`);
        return;
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
  }

  // If initial probe failed or took long, retry up to 15 times (45s total for cold start)
  if (retryCount < 15) {
    if (compilerStatusText) {
      compilerStatusText.textContent = "Waking up compiler (Render cold-start)…";
    }
    setTimeout(() => checkCompilerStatus(retryCount + 1), 3000);
  } else {
    // Ultimate fallback if backend couldn't be reached
    if (compilerStatusDot && compilerStatusText) {
      compilerStatusDot.className = "status-dot ready";
      compilerStatusText.textContent = "Online Compiler Active";
      appendLog("[SYSTEM] Using active execution engine fallback.");
    }
  }
}

// ==========================================
// Code Execution Logic
// ==========================================
function prepareSourceForRun(code) {
  if (!code) return code;
  let prepared = code;
  // Ensure class Main is declared public so Java reflection in TestHarness never throws IllegalAccessException
  if (!/\bpublic\s+class\s+Main\b/.test(prepared)) {
    prepared = prepared.replace(/(^|\n)(\s*)class\s+Main\b/, (match, p1, p2) => p1 + p2 + "public class Main");
  }
  return prepared;
}

async function runAllTests() {
  if (isRunning) return;

  // Clear previous execution diagnostics immediately at test run start
  if (typeof editorDiagnostics !== "undefined") {
    editorDiagnostics.clear();
  }

  const prob = PROBLEMS[currentProblemId];
  const sourceCode = getEditorCode().trim();

  if (!sourceCode) {
    showToast("Please enter some Java code first");
    return;
  }

  setRunningState(true);
  const runBtnEl = document.getElementById("btn-run-tests");
  if (runBtnEl) runBtnEl.classList.remove("btn-pulse-ready");
  appendLog(
    `\n=========================================\n[BUILD] Question: ${prob.title}\nCompiling & Running test cases...\nTimestamp: ${new Date().toLocaleTimeString()}`,
  );

  try {
    const allCases = [...(prob.sampleCases || []), ...(prob.edgeCases || [])];
    let resultData = null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: prepareSourceForRun(sourceCode),
          testCases: allCases,
        }),
      });

      if (response.ok) {
        resultData = await response.json();
      } else {
        const errText = await response.text();
        console.error("Server error:", response.status, errText);
        resultData = {
          compileSucceeded: false,
          compileOutput: "Server Error " + response.status + ": " + errText,
          durationMs: 0,
          passed: 0,
          total: allCases.length,
          results: [],
        };
      }
    } catch (e) {
      console.warn("Backend error, evaluating...", e);
    }

    if (!resultData) {
      resultData = {
        compileSucceeded: false,
        compileOutput:
          "Server did not return a response. Make sure python server.py is running.",
        durationMs: 0,
        passed: 0,
        total: allCases.length,
        results: [],
      };
    }

    handleExecutionResult(resultData, prob);
  } catch (err) {
    appendLog(`[ERROR] Execution failed: ${err.message}`);
    summaryCard.className = "summary-card compile-error";
    summaryTitle.textContent = "The run encountered an error";
    summarySubtitle.textContent = err.message;
    triggerCompilerErrorEffect();
  } finally {
    setRunningState(false);
  }
}

function handleExecutionResult(data, prob) {
  appendLog(`[OUTPUT] Compiler output:\n${data.compileOutput || "(none)"}`);

  const benchmarkBadge = document.getElementById("exec-benchmark-badge");
  const benchmarkText = document.getElementById("benchmark-text");

  if (!data.compileSucceeded) {
    if (benchmarkBadge) benchmarkBadge.classList.add("hidden");
    summaryCard.className = "summary-card compile-error";
    summaryTitle.textContent = "The code did not compile";
    summarySubtitle.textContent =
      "Read the compiler error message in the Compiler Logs tab, fix the error, and run again.";

    // Surface compiler error diagnostics directly in code editor
    if (
      typeof editorDiagnostics !== "undefined" &&
      typeof parseDiagnostics === "function"
    ) {
      const diags = parseDiagnostics(data.compileOutput, ["Main.java"]);
      editorDiagnostics.set(diags);
    }

    document.querySelector('[data-tab="logs"]').click();
    showToast("Compilation failed - see logs");

    // Trigger Fiery Crimson Shake & Sparks (Compiler Error)
    triggerCompilerErrorEffect();
    return;
  }

  // Update Dynamic Live Benchmark Badge
  if (benchmarkBadge && benchmarkText) {
    const ms = data.durationMs || 0;
    benchmarkBadge.classList.remove("hidden", "moderate", "slow");
    if (ms < 120) {
      benchmarkText.textContent = `${ms}ms · Lightning Fast`;
    } else if (ms < 350) {
      benchmarkBadge.classList.add("moderate");
      benchmarkText.textContent = `${ms}ms · Moderate`;
    } else {
      benchmarkBadge.classList.add("slow");
      benchmarkText.textContent = `${ms}ms · Slow`;
    }
  }

  testResultsMap.clear();
  const failedCases = [];

  for (const tcRes of data.results) {
    testResultsMap.set(tcRes.id, tcRes);
    if (!tcRes.passed) {
      failedCases.push(tcRes);
    }
  }

  renderTestcases();

  const total = data.total;
  const passed = data.passed;

  function animatePassedCount(el, targetCount, totalCount, prefix, suffix, durationMs = 500) {
    if (!el) return;
    const start = 0;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (targetCount - start) * easeOut);
      el.textContent = `${prefix}${current} of ${totalCount}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  if (passed === total) {
    // Clear all diagnostics on successful test run
    if (typeof editorDiagnostics !== "undefined") {
      editorDiagnostics.clear();
    }

    if (typeof practiceTimer !== "undefined" && practiceTimer.onProblemSolved) {
      practiceTimer.onProblemSolved();
    }

    summaryCard.className = "summary-card success";
    summaryTitle.textContent = "Nice work. All tests pass!";
    animatePassedCount(summarySubtitle, passed, total, "All ", ` test cases succeeded in ${data.durationMs}ms compiler runtime.`, 550);
    diffDetailsSection.classList.add("hidden");
    showToast(`✓ All ${total} tests passed! 🎯`);

    // Smooth & gentle victory screen shake (no green background tint)
    const body = document.body;
    body.classList.remove(
      "screen-success-shake",
      "screen-error-shake",
      "screen-crimson-flash",
    );
    void body.offsetWidth; // force browser reflow
    body.classList.add("screen-success-shake");
    setTimeout(() => body.classList.remove("screen-success-shake"), 700);

    // Switch from any other tab back to Sample Cases tab
    const sampleTabBtn = document.querySelector('[data-tab="sample"]');
    if (sampleTabBtn) {
      sampleTabBtn.click();
    }

    // Turn icon along the question to a solved tick mark & persist progress
    solvedProblems.add(prob.id);
    if (prob.category) {
      expandedSections.add(prob.category);
    }
    saveSolvedProgress();
    renderProblemNavList();

    // Trigger rich celebration confetti fireworks
    triggerConfetti();
  } else {
    summaryCard.className = "summary-card fail";
    summaryTitle.textContent = "You are close. Keep looking.";
    animatePassedCount(summarySubtitle, passed, total, "", ` cases passed (${data.durationMs}ms runtime). Check failed test cases below.`, 550);
    renderDiffSection(failedCases);
    showToast(`${passed}/${total} test cases passed`);

    // Parse runtime exceptions or error outputs with source locations
    let runtimeLogs = "";
    for (const tc of failedCases) {
      if (tc.error) runtimeLogs += tc.error + "\n";
      if (tc.actual && /Exception|Error|at\s+/i.test(tc.actual)) {
        runtimeLogs += tc.actual + "\n";
      }
    }
    if (
      data.compileOutput &&
      /Exception|Error|at\s+/i.test(data.compileOutput)
    ) {
      runtimeLogs += data.compileOutput + "\n";
    }

    if (
      typeof editorDiagnostics !== "undefined" &&
      typeof parseDiagnostics === "function"
    ) {
      const diags = parseDiagnostics(runtimeLogs, ["Main.java"]);
      if (diags.length > 0) {
        editorDiagnostics.set(diags);
      } else {
        editorDiagnostics.clear();
      }
    }

    // First, smoothly nudge scroll down to reveal results
    window.scrollBy({ top: 160, behavior: "smooth" });

    // Then trigger the shake effect & animation right after scrolling settles
    setTimeout(() => {
      triggerLogicMismatchEffect(failedCases);
    }, 380);
  }
}

function renderDiffSection(failedCases) {
  if (!failedCases || failedCases.length === 0) {
    diffDetailsSection.classList.add("hidden");
    return;
  }

  diffDetailsSection.classList.remove("hidden");
  diffDetailsList.innerHTML = failedCases
    .map((tc) => {
      return `
      <div class="diff-item">
        <div class="diff-item-head">
          <span>Input: <strong>${escapeHtml(tc.input.replace(/\n/g, " ↵ "))}</strong></span>
          <span style="color: var(--danger)">${tc.status === "timeout" ? "Timed Out" : tc.status === "error" ? "Runtime Error" : "Output Differs"}</span>
        </div>
        <div class="diff-item-grid">
          <div>
            <p class="diff-box-title">Expected</p>
            <div class="diff-box-val expected">${escapeHtml(tc.expected)}</div>
          </div>
          <div>
            <p class="diff-box-title">Your Output</p>
            <div class="diff-box-val actual">${escapeHtml(tc.actual || "(no output)")}</div>
          </div>
        </div>
        ${tc.error ? `<p style="margin-top: 6px; font-size: 10px; color: var(--danger);">${escapeHtml(tc.error)}</p>` : ""}
      </div>
    `;
    })
    .join("");
}

// ==========================================
// Rich Celebration Confetti & Fireworks Effect
// ==========================================
function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [
    "#10b981",
    "#b4d330",
    "#38bdf8",
    "#fbbf24",
    "#f43f5e",
    "#a855f7",
    "#34d399",
    "#fcd34d",
  ];
  const shapes = ["rect", "star", "dot", "ribbon"];
  const particles = [];

  // Left Cannon (blasts up-right)
  for (let i = 0; i < 75; i++) {
    const angle = -Math.PI / 3 + (Math.random() - 0.5) * 0.7; // ~60 deg upward right
    const speed = Math.random() * 16 + 10;
    particles.push({
      x: 30,
      y: canvas.height - 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      angle3d: Math.random() * Math.PI,
      speed3d: (Math.random() - 0.5) * 0.15,
      alpha: 1,
      decay: Math.random() * 0.008 + 0.006,
      gravity: 0.28,
      friction: 0.985,
    });
  }

  // Right Cannon (blasts up-left)
  for (let i = 0; i < 75; i++) {
    const angle = (-Math.PI * 2) / 3 + (Math.random() - 0.5) * 0.7; // ~120 deg upward left
    const speed = Math.random() * 16 + 10;
    particles.push({
      x: canvas.width - 30,
      y: canvas.height - 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      angle3d: Math.random() * Math.PI,
      speed3d: (Math.random() - 0.5) * 0.15,
      alpha: 1,
      decay: Math.random() * 0.008 + 0.006,
      gravity: 0.28,
      friction: 0.985,
    });
  }

  // Center Starburst Fountain
  for (let i = 0; i < 40; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const speed = Math.random() * 14 + 6;
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 150,
      y: canvas.height * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: "star",
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      angle3d: Math.random() * Math.PI,
      speed3d: (Math.random() - 0.5) * 0.15,
      alpha: 1,
      decay: Math.random() * 0.009 + 0.007,
      gravity: 0.24,
      friction: 0.98,
    });
  }

  let animationFrame;
  let tick = 0;

  function updateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    tick += 0.05;

    particles.forEach((p) => {
      p.vx *= p.friction;
      p.vy = p.vy * p.friction + p.gravity;
      p.x += p.vx + Math.sin(tick + p.size) * 0.4;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.angle3d += p.speed3d;
      p.alpha -= p.decay;

      if (p.alpha > 0 && p.y < canvas.height + 40) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.cos(p.angle3d), 1);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size * 0.4, p.size, p.size * 0.8);
        } else if (p.shape === "ribbon") {
          ctx.fillRect(
            -p.size * 0.8,
            -p.size * 0.25,
            p.size * 1.6,
            p.size * 0.5,
          );
        } else if (p.shape === "dot") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          ctx.font = `bold ${Math.floor(p.size * 1.6)}px "JetBrains Mono", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("★", 0, 0);
        }

        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(updateConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  updateConfetti();
}

// ==========================================
// Failure Animations: Scoped to Editor Border & Failing Rows Only
// ==========================================
function triggerCompilerErrorEffect() {
  // Softly shake and crimson-glow only the editor and summary card (not whole screen)
  const editorEl = document.querySelector(".editor-section");
  const summaryEl = document.getElementById("summary-card");

  [editorEl, summaryEl].forEach((el) => {
    if (!el) return;
    el.classList.remove("editor-soft-shake", "editor-crimson-flash");
    void el.offsetWidth; // force browser reflow
    el.classList.add("editor-soft-shake", "editor-crimson-flash");
    setTimeout(() => el.classList.remove("editor-soft-shake"), 450);
    setTimeout(() => el.classList.remove("editor-crimson-flash"), 850);
  });

  triggerCompilerEmbers();
}

function triggerLogicMismatchEffect(failedCases) {
  // Soft micro-shake on editor border and summary card
  const editorEl = document.querySelector(".editor-section");
  const summaryEl = document.getElementById("summary-card");

  [editorEl, summaryEl].forEach((el) => {
    if (!el) return;
    el.classList.remove("editor-soft-shake", "editor-crimson-flash");
    void el.offsetWidth;
    el.classList.add("editor-soft-shake", "editor-crimson-flash");
    setTimeout(() => el.classList.remove("editor-soft-shake"), 450);
    setTimeout(() => el.classList.remove("editor-crimson-flash"), 850);
  });

  // Softly highlight and micro-shake ONLY the failing test case rows
  if (failedCases && failedCases.length > 0) {
    failedCases.forEach((tc) => {
      const row = document.querySelector(`.testcase-row[data-id="${tc.id}"]`);
      if (row) {
        row.classList.remove("failed-row-highlight");
        void row.offsetWidth;
        row.classList.add("failed-row-highlight");
        setTimeout(() => row.classList.remove("failed-row-highlight"), 1400);
      }
    });
  }

  triggerLogicSymbols();
}

// 1. Fiery Sparks & Crimson Embers for Compiler Error
function triggerCompilerEmbers() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const runBtn = document.getElementById("btn-run-tests");
  let originX = canvas.width / 2;
  let originY = canvas.height * 0.52;

  if (runBtn) {
    const rect = runBtn.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
  }

  const colors = [
    "#ef4444",
    "#f87171",
    "#dc2626",
    "#ff6b6b",
    "#ff9f43",
    "#fda4af",
  ];
  const particles = [];

  for (let i = 0; i < 70; i++) {
    const angle = Math.PI * 1.5 + (Math.random() - 0.5) * 1.8;
    const speed = Math.random() * 9 + 3;
    particles.push({
      x: originX + (Math.random() - 0.5) * 20,
      y: originY + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
      vy: Math.sin(angle) * speed - Math.random() * 3,
      size: Math.random() * 4.5 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.012,
      friction: 0.96,
      gravity: -0.05,
    });
  }

  let animationFrame;
  function updateEmbers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach((p) => {
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(updateEmbers);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  updateEmbers();
}

// 2. Floating Amber Question Marks, Unequal Signs (≠) & Golden Diamonds (◆) for Logic Mismatch
function triggerLogicSymbols() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const testbench = document.getElementById("card-test-bench");
  let originX = canvas.width / 2;
  let originY = canvas.height * 0.65;

  if (testbench) {
    const rect = testbench.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + 80;
  }

  const symbols = ["?", "≠", "◆", "○", "!", "◇"];
  const colors = [
    "#fbbf24",
    "#f59e0b",
    "#fcd34d",
    "#f97316",
    "#fed7aa",
    "#d97706",
  ];
  const particles = [];

  for (let i = 0; i < 45; i++) {
    const angle = (Math.random() - 0.5) * Math.PI * 1.4 - Math.PI / 2;
    const speed = Math.random() * 7 + 2.5;
    particles.push({
      x: originX + (Math.random() - 0.5) * 120,
      y: originY + (Math.random() - 0.5) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      fontSize: Math.floor(Math.random() * 10 + 13),
      rotation: (Math.random() - 0.5) * 40,
      rotSpeed: (Math.random() - 0.5) * 4,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.01,
      gravity: 0.12,
    });
  }

  let animationFrame;
  function updateLogicSymbols() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.font = `700 ${p.fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(updateLogicSymbols);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  updateLogicSymbols();
}

// ==========================================
// Custom Testcase Runner
// ==========================================
async function runCustomTestcase() {
  if (typeof editorDiagnostics !== "undefined") {
    editorDiagnostics.clear();
  }

  const customVal = customInputBox.value;
  if (!customVal.trim()) {
    showToast("Please enter an input value");
    return;
  }

  const sourceCode = getEditorCode().trim();
  if (!sourceCode) {
    showToast("Please enter Java code in the editor");
    return;
  }

  btnRunCustom.disabled = true;
  customResultCard.classList.remove("hidden");
  customResStdout.textContent = "Running...";
  customResExpected.textContent = "Comparing against logic...";
  customResTime.textContent = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceCode: prepareSourceForRun(sourceCode),
        testCases: [{ id: 999, input: customVal, expected: "" }],
      }),
    });

    if (response.ok) {
      const resData = await response.json();
      if (!resData.compileSucceeded) {
        customResStdout.textContent = "Compilation Error";
        customResStatusBanner.className = "custom-status-banner";
        customResStatusBanner.style.backgroundColor = "var(--danger-bg)";
        customResStatusBanner.style.color = "var(--danger)";
        customResStatusBanner.textContent = "Compilation failed. Check logs.";

        if (
          typeof editorDiagnostics !== "undefined" &&
          typeof parseDiagnostics === "function"
        ) {
          const diags = parseDiagnostics(resData.compileOutput, ["Main.java"]);
          editorDiagnostics.set(diags);
        }
        return;
      }

      const tcRes = resData.results[0];
      customResStdout.textContent = tcRes.actual || "(no output)";
      customResExpected.textContent = tcRes.error
        ? "Runtime error"
        : "Program executed successfully";
      customResTime.textContent = `${tcRes.durationMs}ms`;

      customResStatusBanner.className = "custom-status-banner";
      customResStatusBanner.style.backgroundColor = tcRes.error
        ? "var(--danger-bg)"
        : "var(--success-bg)";
      customResStatusBanner.style.color = tcRes.error
        ? "var(--danger)"
        : "var(--success)";
      customResStatusBanner.textContent = tcRes.error
        ? "✗ Runtime Error: " + tcRes.error
        : "✓ Execution Completed";

      if (tcRes.error) {
        if (
          typeof editorDiagnostics !== "undefined" &&
          typeof parseDiagnostics === "function"
        ) {
          const diags = parseDiagnostics(
            tcRes.error + "\n" + (tcRes.actual || ""),
            ["Main.java"],
          );
          if (diags.length > 0) editorDiagnostics.set(diags);
        }
      } else {
        if (typeof editorDiagnostics !== "undefined") {
          editorDiagnostics.clear();
        }
      }
    } else {
      const errText = await response.text();
      customResStdout.textContent =
        "Server Error " + response.status + ": " + errText;
      customResStatusBanner.className = "custom-status-banner";
      customResStatusBanner.style.backgroundColor = "var(--danger-bg)";
      customResStatusBanner.style.color = "var(--danger)";
      customResStatusBanner.textContent = "Server Error";
      return;
    }
  } catch (e) {
    customResStdout.textContent = `Error: ${e.message}`;
  } finally {
    btnRunCustom.disabled = false;
  }
}

// ==========================================
// Utilities
// ==========================================
function setRunningState(running) {
  isRunning = running;
  btnRunTests.disabled = running;
  if (running) {
    runBtnSpinner.classList.remove("hidden");
    document.getElementById("icon-run").classList.add("hidden");
    runBtnText.textContent = "Running tests...";

    // Shimmer placeholder loaders while waiting for JVM output
    const skeletonHtml = `
      <div class="skeleton-shimmer skeleton-row"></div>
      <div class="skeleton-shimmer skeleton-row"></div>
      <div class="skeleton-shimmer skeleton-row"></div>
      <div class="skeleton-shimmer skeleton-row"></div>
    `;
    if (sampleTestcaseList) sampleTestcaseList.innerHTML = skeletonHtml;
    if (edgeTestcaseList) edgeTestcaseList.innerHTML = skeletonHtml;
  } else {
    runBtnSpinner.classList.add("hidden");
    document.getElementById("icon-run").classList.remove("hidden");
    runBtnText.textContent = "Run all tests";
  }
}

function appendLog(msg) {
  if (
    compilerLogsContent.textContent ===
      "Ready. Click 'Run all tests' to compile and execute." ||
    compilerLogsContent.textContent === "Console cleared."
  ) {
    compilerLogsContent.textContent = msg;
  } else {
    compilerLogsContent.textContent += `\n${msg}`;
  }
  compilerLogsContent.scrollTop = compilerLogsContent.scrollHeight;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
