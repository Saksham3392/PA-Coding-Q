/**
 * Java Practice Compiler & Test Bench
 */
const PROBLEMS = window.PROBLEMS || {};

// Normalize all problem schemas across all sections
Object.values(PROBLEMS).forEach((prob) => {
  if (prob) {
    if (!prob.solutionCode && prob.solution) prob.solutionCode = prob.solution;
    if (!prob.solution && prob.solutionCode) prob.solution = prob.solutionCode;
    if (!Array.isArray(prob.sampleCases)) prob.sampleCases = [];
    if (!Array.isArray(prob.edgeCases)) prob.edgeCases = [];
    if (!Array.isArray(prob.hints)) prob.hints = [];
  }
});

let currentProblemId =
  Object.keys(PROBLEMS)[0] || "q01_sum_of_all_the_elements_of_an_array";
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
  if (!PROBLEMS[currentProblemId] && Object.keys(PROBLEMS).length > 0) {
    currentProblemId = Object.keys(PROBLEMS)[0];
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

  // Focus and refresh editor
  setTimeout(() => {
    if (cmEditor) {
      cmEditor.refresh();
      cmEditor.focus();
    }
  }, 100);
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
  } catch (e) {
    console.error("Failed to initialize CodeMirror, using fallback", e);
    setupFallbackTextarea();
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

// ==========================================
// Interactive Tree & Graph Traversal Visualizer
// ==========================================
let vizAnimationTimer = null;
let vizCurrentStep = 0;
let vizSteps = [];
let vizStructure = null;
let vizIsPlaying = false;

function buildModelForProblem(prob) {
  const cat = (prob.category || "").toLowerCase();

  if (cat.includes("graph")) {
    return {
      type: "graph",
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
  } else {
    return {
      type: "tree",
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
}

function renderTreeGraphVisualizer(prob) {
  const cat = (prob.category || "").toLowerCase();
  const isTreeOrGraph =
    cat.includes("tree") ||
    cat.includes("bst") ||
    cat.includes("heap") ||
    cat.includes("graph");

  const existingViz = document.getElementById("card-traversal-visualizer");
  if (existingViz) {
    if (vizAnimationTimer) clearInterval(vizAnimationTimer);
    vizIsPlaying = false;
    existingViz.remove();
  }

  if (!isTreeOrGraph) return;

  vizStructure = buildModelForProblem(prob);
  if (!vizStructure || !vizStructure.nodes.length) return;

  const psBody = document.querySelector(".problem-statement-body");
  if (!psBody) return;

  const vizCard = document.createElement("div");
  vizCard.id = "card-traversal-visualizer";
  vizCard.className = "traversal-visualizer-card";

  const isGraph = vizStructure.type === "graph";
  const modes = isGraph
    ? [
        { id: "bfs", label: "BFS Traversal (0 → 1 → 2 → 3 → 4)" },
        { id: "dfs", label: "DFS Traversal (0 → 1 → 3 → 4 → 2)" },
        { id: "dijkstra", label: "Dijkstra Shortest Path (from 0)" },
      ]
    : [
        {
          id: "inorder",
          label: "Inorder: Left → Node → Right (20, 30, 40, 50, 60, 70, 80)",
        },
        {
          id: "preorder",
          label: "Preorder: Node → Left → Right (50, 30, 20, 40, 70, 60, 80)",
        },
        {
          id: "postorder",
          label: "Postorder: Left → Right → Node (20, 40, 30, 60, 80, 70, 50)",
        },
        {
          id: "levelorder",
          label: "Level Order BFS (50, 30, 70, 20, 40, 60, 80)",
        },
      ];

  vizCard.innerHTML = `
    <div class="viz-header">
      <div class="viz-header-left">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);">
          <circle cx="12" cy="5" r="3"></circle>
          <line x1="12" y1="8" x2="6" y2="15"></line>
          <line x1="12" y1="8" x2="18" y2="15"></line>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="18" r="3"></circle>
        </svg>
        <span class="viz-title">Step-by-Step ${isGraph ? "Graph" : "Tree"} Traversal Visualizer</span>
        <span class="viz-badge">${isGraph ? "Graph" : "Tree"}</span>
      </div>
      <div class="viz-controls">
        <select id="viz-mode-select" class="viz-select">
          ${modes.map((m) => `<option value="${m.id}">${m.label}</option>`).join("")}
        </select>
        <button id="viz-btn-prev" class="viz-btn" type="button" title="Step Backward">⏮</button>
        <button id="viz-btn-play" class="viz-btn primary" type="button" title="Play / Pause Animation">▶ Play</button>
        <button id="viz-btn-next" class="viz-btn" type="button" title="Step Forward">⏭</button>
        <button id="viz-btn-reset" class="viz-btn" type="button" title="Reset Traversal">↺</button>
      </div>
    </div>
    <div class="viz-canvas-wrap">
      <svg id="viz-svg-canvas" class="viz-svg" viewBox="0 0 440 220" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
    <div class="viz-tray">
      <div class="viz-tray-status" id="viz-status-text">
        Ready · Click <strong>Play</strong> or <strong>Step Forward ⏭</strong> to watch traversal
      </div>
      <div class="viz-tray-chips" id="viz-chips-container">
        <!-- Live chips -->
      </div>
    </div>
  `;

  psBody.after(vizCard);

  initVisualizerListeners();
  computeAndRenderVisualizer(modes[0].id);
}

function initVisualizerListeners() {
  const modeSelect = document.getElementById("viz-mode-select");
  const btnPlay = document.getElementById("viz-btn-play");
  const btnNext = document.getElementById("viz-btn-next");
  const btnPrev = document.getElementById("viz-btn-prev");
  const btnReset = document.getElementById("viz-btn-reset");

  if (modeSelect) {
    modeSelect.addEventListener("change", () => {
      pauseVisualizer();
      computeAndRenderVisualizer(modeSelect.value);
    });
  }

  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      if (vizIsPlaying) {
        pauseVisualizer();
      } else {
        playVisualizer();
      }
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
}

function computeAndRenderVisualizer(mode) {
  if (!vizStructure) return;
  vizCurrentStep = 0;
  vizSteps = [];

  if (vizStructure.type === "graph") {
    if (mode === "bfs") {
      vizSteps = [
        { nodeId: 0, edgeId: null, label: "0", note: "Start at vertex 0" },
        {
          nodeId: 1,
          edgeId: "e01",
          label: "1",
          note: "Visit neighbor 1 (via edge 0-1)",
        },
        {
          nodeId: 2,
          edgeId: "e02",
          label: "2",
          note: "Visit neighbor 2 (via edge 0-2)",
        },
        {
          nodeId: 3,
          edgeId: "e13",
          label: "3",
          note: "Visit neighbor 3 (via edge 1-3)",
        },
        {
          nodeId: 4,
          edgeId: "e24",
          label: "4",
          note: "Visit neighbor 4 (via edge 2-4)",
        },
      ];
    } else if (mode === "dfs") {
      vizSteps = [
        { nodeId: 0, edgeId: null, label: "0", note: "Start DFS at vertex 0" },
        { nodeId: 1, edgeId: "e01", label: "1", note: "Explore deep into 1" },
        { nodeId: 3, edgeId: "e13", label: "3", note: "Explore deep into 3" },
        { nodeId: 4, edgeId: "e34", label: "4", note: "Explore neighbor 4" },
        { nodeId: 2, edgeId: "e24", label: "2", note: "Backtrack and visit 2" },
      ];
    } else {
      // Dijkstra
      vizSteps = [
        {
          nodeId: 0,
          edgeId: null,
          label: "0 (d=0)",
          note: "Source vertex 0 (distance = 0)",
        },
        {
          nodeId: 2,
          edgeId: "e02",
          label: "2 (d=3)",
          note: "Shortest step: 0 → 2 (wt = 3)",
        },
        {
          nodeId: 4,
          edgeId: "e24",
          label: "4 (d=5)",
          note: "Shortest step: 2 → 4 (wt = 2, total = 5)",
        },
        {
          nodeId: 1,
          edgeId: "e01",
          label: "1 (d=7)",
          note: "Shortest step: 2 → 1 (0→2→1, total = 7)",
        },
        {
          nodeId: 3,
          edgeId: "e13",
          label: "3 (d=9)",
          note: "Shortest step: 1 → 3 (0→2→1→3, total = 9)",
        },
      ];
    }
  } else {
    // Tree modes
    if (mode === "inorder") {
      vizSteps = [
        {
          nodeId: 4,
          edgeId: "e24",
          label: "20",
          note: "Leftmost leaf node [20]",
        },
        { nodeId: 2, edgeId: "e12", label: "30", note: "Parent node [30]" },
        {
          nodeId: 5,
          edgeId: "e25",
          label: "40",
          note: "Right child of 30 [40]",
        },
        { nodeId: 1, edgeId: null, label: "50", note: "Root node [50]" },
        {
          nodeId: 6,
          edgeId: "e36",
          label: "60",
          note: "Left child of 70 [60]",
        },
        {
          nodeId: 3,
          edgeId: "e13",
          label: "70",
          note: "Right child of root [70]",
        },
        {
          nodeId: 7,
          edgeId: "e37",
          label: "80",
          note: "Rightmost leaf node [80]",
        },
      ];
    } else if (mode === "preorder") {
      vizSteps = [
        { nodeId: 1, edgeId: null, label: "50", note: "Visit Root [50]" },
        {
          nodeId: 2,
          edgeId: "e12",
          label: "30",
          note: "Visit Left subtree root [30]",
        },
        { nodeId: 4, edgeId: "e24", label: "20", note: "Visit Left leaf [20]" },
        {
          nodeId: 5,
          edgeId: "e25",
          label: "40",
          note: "Visit Right leaf [40]",
        },
        {
          nodeId: 3,
          edgeId: "e13",
          label: "70",
          note: "Visit Right subtree root [70]",
        },
        { nodeId: 6, edgeId: "e36", label: "60", note: "Visit Left leaf [60]" },
        {
          nodeId: 7,
          edgeId: "e37",
          label: "80",
          note: "Visit Right leaf [80]",
        },
      ];
    } else if (mode === "postorder") {
      vizSteps = [
        { nodeId: 4, edgeId: "e24", label: "20", note: "Left leaf [20]" },
        { nodeId: 5, edgeId: "e25", label: "40", note: "Right leaf [40]" },
        { nodeId: 2, edgeId: "e12", label: "30", note: "Subtree parent [30]" },
        {
          nodeId: 6,
          edgeId: "e36",
          label: "60",
          note: "Right subtree left leaf [60]",
        },
        {
          nodeId: 7,
          edgeId: "e37",
          label: "80",
          note: "Right subtree right leaf [80]",
        },
        {
          nodeId: 3,
          edgeId: "e13",
          label: "70",
          note: "Right subtree root [70]",
        },
        { nodeId: 1, edgeId: null, label: "50", note: "Final Root [50]" },
      ];
    } else {
      // Level Order
      vizSteps = [
        { nodeId: 1, edgeId: null, label: "50", note: "Level 1: Root [50]" },
        { nodeId: 2, edgeId: "e12", label: "30", note: "Level 2: Left [30]" },
        { nodeId: 3, edgeId: "e13", label: "70", note: "Level 2: Right [70]" },
        { nodeId: 4, edgeId: "e24", label: "20", note: "Level 3: [20]" },
        { nodeId: 5, edgeId: "e25", label: "40", note: "Level 3: [40]" },
        { nodeId: 6, edgeId: "e36", label: "60", note: "Level 3: [60]" },
        { nodeId: 7, edgeId: "e37", label: "80", note: "Level 3: [80]" },
      ];
    }
  }

  drawVisualizerSVG();
  applyVisualizerStep();
}

function drawVisualizerSVG() {
  const svg = document.getElementById("viz-svg-canvas");
  if (!svg || !vizStructure) return;

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

  svg.innerHTML = edgesHtml + nodesHtml;
}

function applyVisualizerStep() {
  if (!vizStructure) return;
  const svg = document.getElementById("viz-svg-canvas");
  const statusElem = document.getElementById("viz-status-text");
  const chipsContainer = document.getElementById("viz-chips-container");
  if (!svg || !statusElem || !chipsContainer) return;

  svg
    .querySelectorAll(".viz-node")
    .forEach((n) => n.classList.remove("active", "visited"));
  svg
    .querySelectorAll(".viz-edge-line")
    .forEach((e) => e.classList.remove("active", "visited"));

  if (vizCurrentStep === 0) {
    statusElem.innerHTML = `Ready · Click <strong>Play ▶</strong> or <strong>Step Forward ⏭</strong> to begin`;
    chipsContainer.innerHTML = `<span class="viz-chip" style="opacity: 0.5;">No nodes visited yet</span>`;
    return;
  }

  const currentIdx = vizCurrentStep - 1;
  const curStep = vizSteps[currentIdx];

  for (let i = 0; i < currentIdx; i++) {
    const s = vizSteps[i];
    const nEl = document.getElementById(`viz-node-${s.nodeId}`);
    if (nEl) nEl.classList.add("visited");
    if (s.edgeId) {
      const eEl = document.getElementById(`line-${s.edgeId}`);
      if (eEl) eEl.classList.add("visited");
    }
  }

  if (curStep) {
    const activeNodeEl = document.getElementById(`viz-node-${curStep.nodeId}`);
    if (activeNodeEl) activeNodeEl.classList.add("active");
    if (curStep.edgeId) {
      const activeEdgeEl = document.getElementById(`line-${curStep.edgeId}`);
      if (activeEdgeEl) activeEdgeEl.classList.add("active");
    }

    statusElem.innerHTML = `Step <strong>${vizCurrentStep}</strong> of <strong>${vizSteps.length}</strong>: ${escapeHtml(curStep.note)}`;
  }

  let chipsHtml = "";
  for (let i = 0; i < vizCurrentStep; i++) {
    const s = vizSteps[i];
    const isCurrent = i === currentIdx;
    chipsHtml += `<span class="viz-chip ${isCurrent ? "current" : "visited"}">${escapeHtml(s.label)}</span>`;
  }
  chipsContainer.innerHTML = chipsHtml;

  if (vizCurrentStep >= vizSteps.length) {
    pauseVisualizer();
    statusElem.innerHTML = `✓ Traversal Complete (${vizSteps.length} nodes visited in order)`;
  }
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
  }, 900);
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

  // Interactive Tree & Graph Traversal Visualizer
  renderTreeGraphVisualizer(prob);

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
  if (countBadge) {
    countBadge.textContent = `${cases.length} Example${cases.length === 1 ? "" : "s"}`;
  }

  if (cases.length === 0) {
    container.innerHTML = `<div style="padding: 14px; text-align: center; color: var(--text-subtle); font-size: 12px;">No sample test cases specified.</div>`;
    return;
  }

  container.innerHTML = cases
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

function switchProblem(probId) {
  if (typeof editorDiagnostics !== "undefined") {
    editorDiagnostics.clear();
  }
  if (typeof practiceTimer !== "undefined" && practiceTimer.switchProblem) {
    practiceTimer.switchProblem(probId);
  }
  currentProblemId = probId;
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

  sampleTestcaseList.innerHTML = samples
    .map((tc) => {
      const res = testResultsMap.get(tc.id);
      return `
      <div class="testcase-row" data-id="${tc.id}">
        <span class="tc-input" title="${escapeHtml(tc.input)}">${escapeHtml(tc.input.replace(/\n/g, " ↵ "))}</span>
        <span class="tc-expected" title="${escapeHtml(tc.expected)}">${escapeHtml(tc.expected.replace(/\n/g, " ↵ "))}</span>
        <div class="tc-status-cell">
          ${renderStatusCell(res)}
        </div>
      </div>
    `;
    })
    .join("");

  if (edges.length > 0) {
    edgeTestcaseList.innerHTML = edges
      .map((tc) => {
        const res = testResultsMap.get(tc.id);
        return `
        <div class="testcase-row" data-id="${tc.id}">
          <span class="tc-input" title="${escapeHtml(tc.input)}">${escapeHtml(tc.input.replace(/\n/g, " ↵ "))}</span>
          <span class="tc-expected" title="${escapeHtml(tc.expected)}">${escapeHtml(tc.expected.replace(/\n/g, " ↵ "))}</span>
          <div class="tc-status-cell">
            ${renderStatusCell(res)}
          </div>
        </div>
      `;
      })
      .join("");
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

function renderStatusCell(res) {
  if (!res) {
    return `<span class="status-dot-idle"></span>`;
  }
  if (res.status === "passed") {
    return `<span class="status-pill pass">✓ Pass</span>`;
  }
  if (res.status === "failed") {
    return `<span class="status-pill fail">✗ Fail</span>`;
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
async function checkCompilerStatus() {
  try {
    const res = await fetch("./api/status");
    if (res.ok) {
      const data = await res.json();
      if (data.status) {
        compilerReady = true;
        compilerStatusDot.className = "status-dot ready";
        compilerStatusText.textContent = "Java 21 Ready (Local)";
        appendLog(
          `[SYSTEM] Local Java Compiler detected:\n  - javac: ${data.javac_version}\n  - java:  ${data.java_version}`,
        );
        return;
      }
    }
  } catch (err) {
    // Fallback indicator
  }

  compilerStatusDot.className = "status-dot ready";
  compilerStatusText.textContent = "Online Compiler Active";
  appendLog("[SYSTEM] Using active execution engine.");
}

// ==========================================
// Code Execution Logic
// ==========================================
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
      const response = await fetch("./api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: sourceCode,
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

  if (passed === total) {
    // Clear all diagnostics on successful test run
    if (typeof editorDiagnostics !== "undefined") {
      editorDiagnostics.clear();
    }

    let solveTimeSuffix = "";
    if (typeof practiceTimer !== "undefined" && practiceTimer.onProblemSolved) {
      practiceTimer.onProblemSolved();
      solveTimeSuffix = ` in ${practiceTimer.getFormattedTime()}`;
    }

    summaryCard.className = "summary-card success";
    summaryTitle.textContent = "Nice work. All tests pass!";
    summarySubtitle.textContent = `All ${passed} of ${total} test cases succeeded${solveTimeSuffix} (${data.durationMs}ms compiler runtime).`;
    diffDetailsSection.classList.add("hidden");
    showToast(`✓ All ${total} tests passed${solveTimeSuffix}! 🎯`);

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
    summarySubtitle.textContent = `${passed} of ${total} cases passed (${data.durationMs}ms runtime). Check failed test cases below.`;
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
// Failure Animations (Compiler Error vs. Logic Mismatch)
// ==========================================
function triggerCompilerErrorEffect() {
  // Whole screen shake & crimson flash
  const body = document.body;
  body.classList.remove("screen-error-shake", "screen-crimson-flash");
  void body.offsetWidth; // force browser reflow
  body.classList.add("screen-error-shake", "screen-crimson-flash");
  setTimeout(() => body.classList.remove("screen-error-shake"), 550);
  setTimeout(() => body.classList.remove("screen-crimson-flash"), 900);

  const elements = [
    document.querySelector(".editor-section"),
    document.getElementById("summary-card"),
  ];

  elements.forEach((el) => {
    if (!el) return;
    el.classList.remove(
      "haptic-shake",
      "glow-crimson",
      "logic-mismatch-bounce",
    );
    void el.offsetWidth; // force browser reflow
    el.classList.add("haptic-shake", "glow-crimson");
    setTimeout(() => el.classList.remove("haptic-shake"), 550);
    setTimeout(() => el.classList.remove("glow-crimson"), 1000);
  });

  triggerCompilerEmbers();
}

function triggerLogicMismatchEffect(failedCases) {
  const elements = [
    document.getElementById("summary-card"),
    document.getElementById("card-test-bench"),
  ];

  elements.forEach((el) => {
    if (!el) return;
    el.classList.remove(
      "haptic-shake",
      "glow-crimson",
      "logic-mismatch-bounce",
    );
    void el.offsetWidth; // force browser reflow
    el.classList.add("logic-mismatch-bounce");
    setTimeout(() => el.classList.remove("logic-mismatch-bounce"), 650);
  });

  // Highlight the failed test case rows in the table
  if (failedCases && failedCases.length > 0) {
    failedCases.forEach((tc) => {
      const row = document.querySelector(`.testcase-row[data-id="${tc.id}"]`);
      if (row) {
        row.classList.remove("failed-row-highlight");
        void row.offsetWidth;
        row.classList.add("failed-row-highlight");
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
    const response = await fetch("./api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceCode: sourceCode,
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
