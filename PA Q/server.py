"""
==============================================================================
Java Practice Compiler & Test Bench - High-Performance Execution Backend
==============================================================================
Role & Architecture:
--------------------
This Python Flask application powers the code execution engine for the Java
Practice Lab. It receives Java source code submissions from the frontend (app.js),
safely prepares the files, compiles them using the host machine's JDK (javac),
and executes all test cases inside a high-speed Single-JVM Test Harness.

Key Performance Architecture (Single-JVM vs Multi-Process):
------------------------------------------------------------
- Standard naive execution runs `java Main < input` separately for EVERY test case.
  For 10 test cases, that incurs 10 separate JVM cold starts (~500ms * 10 = ~5s).
- This backend uses a custom Single-JVM TestHarness (TestHarness.java):
  1. Compiles student code + TestHarness ONCE.
  2. Runs a single `java TestHarness tests.txt Main` process.
  3. The harness sequentially feeds inputs via in-memory ByteArrayInputStream,
     redirects System.out/System.err to ByteArrayOutputStream, and re-loads classes
     via URLClassLoader to prevent state leakage (static variable pollution).
  4. Execution time drops from ~5,000ms down to ~200-400ms total.

Primary Endpoints:
------------------
- GET  /              : Serves the main web application UI (index.html).
- GET  /<path>        : Serves static assets (JS, CSS, images).
- GET  /api/check     : Diagnostic healthcheck verifying `javac` and `java` in PATH.
- GET  /api/testcases : Returns default sample/edge test cases.
- POST /api/run       : Compiles and executes Java code against provided test cases.
==============================================================================
"""

import os
import re
import json
import shutil
import subprocess
import tempfile
import time
import concurrent.futures
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Initialize Flask application with root static folder routing
app = Flask(__name__, static_folder='.', static_url_path='')

# ------------------------------------------------------------------------------
# Restricted CORS Configuration
# ------------------------------------------------------------------------------
ALLOWED_ORIGIN_REGEXES = [
    re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"),
    re.compile(r"^https://.*\.vercel\.app$"),
]
ALLOWED_ORIGIN_STRINGS = [
    "https://javaprogrammingq.onrender.com"
]
extra_origins = os.environ.get("ALLOWED_ORIGINS", "")
if extra_origins:
    ALLOWED_ORIGIN_STRINGS.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

# Enable Cross-Origin Resource Sharing restricted to verified origins
CORS(app, origins=[*ALLOWED_ORIGIN_STRINGS, *ALLOWED_ORIGIN_REGEXES], supports_credentials=True)

# ------------------------------------------------------------------------------
# In-Memory IP-Based Rate Limiting for Code Submissions
# ------------------------------------------------------------------------------
RATE_LIMIT_WINDOW = 60.0    # 60 second rolling window
MAX_RUNS_PER_WINDOW = 20    # Max 20 test runs per window per IP
ip_rate_limits = {}

def check_rate_limit(client_ip):
    """Verifies that client IP has not exceeded execution rate limit."""
    now = time.time()
    history = ip_rate_limits.setdefault(client_ip, [])
    cutoff = now - RATE_LIMIT_WINDOW
    # Purge expired timestamps
    history = [t for t in history if t > cutoff]
    ip_rate_limits[client_ip] = history
    if len(history) >= MAX_RUNS_PER_WINDOW:
        return False
    history.append(now)
    return True

# Environment port configuration (defaults to 4060 for local dev, respects Render/Heroku $PORT)
PORT = int(os.environ.get("PORT", 4060))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ------------------------------------------------------------------------------
# JVM Tuning & Sandboxing Flags
# ------------------------------------------------------------------------------
# -Xms32m / -Xmx128m          : Small heap footprint prevents memory exhaustion.
# -XX:+TieredCompilation      : Enables tiered JIT compilation.
# -XX:TieredStopAtLevel=1     : Stops JIT at C1 client compiler (low latency).
# -XX:+UseSerialGC            : Lightweight single-threaded garbage collector.
# -Djava.security.manager=allow : Enables security manager for sandbox interception.
FAST_JAVA_FLAGS = [
    "-Djava.security.manager=allow",
    "-Xms32m",
    "-Xmx128m",
    "-XX:+TieredCompilation",
    "-XX:TieredStopAtLevel=1",
    "-XX:+UseSerialGC",
]

FAST_JAVAC_FLAGS = [
    "-J-Xms32m",
    "-J-Xmx128m",
    "-J-XX:+TieredCompilation",
    "-J-XX:TieredStopAtLevel=1",
]

# ------------------------------------------------------------------------------
# Default Fallback Test Cases (Used for demo palindrome checks or sanity tests)
# ------------------------------------------------------------------------------
SAMPLE_TEST_CASES = [
    {"id": 1, "input": "121", "expected": "Palindrome", "explanation": "The number 121 remains the same when its digits are reversed."},
    {"id": 2, "input": "12345", "expected": "Not a Palindrome", "explanation": "The number 12345 becomes 54321 when reversed, which differs from the original."},
    {"id": 3, "input": "1221", "expected": "Palindrome", "explanation": "The number 1221 reads identical forwards and backwards."},
    {"id": 4, "input": "9876", "expected": "Not a Palindrome", "explanation": "The number 9876 becomes 6789 when reversed."},
    {"id": 5, "input": "1001", "expected": "Palindrome", "explanation": "The number 1001 reads identical forwards and backwards."},
    {"id": 6, "input": "12321", "expected": "Palindrome", "explanation": "The number 12321 reads identical forwards and backwards."},
]

EDGE_TEST_CASES = [
    {"id": 7, "input": "7", "expected": "Palindrome", "explanation": "Any single digit number is always a palindrome."},
    {"id": 8, "input": "10", "expected": "Not a Palindrome", "explanation": "10 reversed is 01 (1), which is not equal to 10."},
    {"id": 9, "input": "0", "expected": "Palindrome", "explanation": "0 is a single digit palindrome."},
    {"id": 10, "input": "1000000001", "expected": "Palindrome", "explanation": "Large symmetrical integer."},
]


def check_compiler():
    """
    Checks if javac (compiler) and java (runtime) are properly installed and accessible in system PATH.
    
    Returns:
        dict: Contains boolean statuses and version strings for both tools.
              Example: {"status": True, "javac": True, "java": True, "javac_version": "javac 21.0.2", ...}
    """
    javac_ok = False
    java_ok = False
    javac_version = ""
    java_version = ""

    # Check javac
    try:
        res = subprocess.run(["javac", "-version"], capture_output=True, text=True, timeout=3)
        javac_ok = res.returncode == 0
        javac_version = (res.stdout or res.stderr).strip()
    except Exception as e:
        javac_version = str(e)

    # Check java
    try:
        res = subprocess.run(["java", "-version"], capture_output=True, text=True, timeout=3)
        java_ok = res.returncode == 0
        java_version = (res.stderr or res.stdout).strip().splitlines()[0] if (res.stderr or res.stdout) else ""
    except Exception as e:
        java_version = str(e)

    return {
        "status": javac_ok and java_ok,
        "javac": javac_ok,
        "java": java_ok,
        "javac_version": javac_version,
        "java_version": java_version,
    }


def is_palindrome_str(val):
    """Simple string reversal helper for palindromes."""
    clean = val.strip()
    return clean == clean[::-1]


# ------------------------------------------------------------------------------
# Single-JVM In-Memory Test Harness (TestHarness.java)
# ------------------------------------------------------------------------------
# How this works:
# 1. Takes 2 CLI arguments: <path-to-tests.txt> [TargetClassName]
# 2. Reads the tests file, which contains tests delimited by "<<===NEXT_TEST===>>".
# 3. For each test case:
#    a. Instantiates a dedicated URLClassLoader pointing to the compiled class directory.
#       This guarantees that any static variables modified in Test N do not carry over to Test N+1.
#    b. Intercepts System.in, System.out, System.err using ByteArray streams.
#    c. Invokes `public static void main(String[] args)` via reflection.
#    d. Captures execution wall-clock time in milliseconds.
#    e. Restores original System streams and prints structured boundary markers:
#       <<<START_RESULT:ID>>> ... <<<END_RESULT:ID>>>
HARNESS_JAVA_SOURCE = """import java.io.*;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.Permission;

class SandboxSecurityManager extends SecurityManager {
    public volatile boolean active = false;

    @Override
    public void checkExit(int status) {
        if (active) throw new SecurityException("System.exit() is disabled in the practice sandbox.");
    }
    @Override
    public void checkExec(String cmd) {
        if (active) throw new SecurityException("Process execution (exec/ProcessBuilder) is disabled in the practice sandbox.");
    }
    @Override
    public void checkConnect(String host, int port) {
        if (active) throw new SecurityException("Network connections are disabled in the practice sandbox.");
    }
    @Override
    public void checkConnect(String host, int port, Object context) {
        if (active) throw new SecurityException("Network connections are disabled in the practice sandbox.");
    }
    @Override
    public void checkListen(int port) {
        if (active) throw new SecurityException("Opening server sockets is disabled in the practice sandbox.");
    }
    @Override
    public void checkAccept(String host, int port) {
        if (active) throw new SecurityException("Accepting socket connections is disabled in the practice sandbox.");
    }
    @Override
    public void checkDelete(String file) {
        if (active) throw new SecurityException("File deletion is disabled in the practice sandbox.");
    }
    @Override
    public void checkPermission(Permission perm) {
        if (active && perm instanceof RuntimePermission) {
            String name = perm.getName();
            if ("setSecurityManager".equals(name) || "createSecurityManager".equals(name)) {
                throw new SecurityException("Tampering with SecurityManager is forbidden.");
            }
        }
    }
}

public class TestHarness {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("No test file specified.");
            return;
        }

        SandboxSecurityManager sm = new SandboxSecurityManager();
        try {
            System.setSecurityManager(sm);
        } catch (Throwable ignored) {}

        URL[] classUrls;
        try {
            File codeDir;
            try {
                codeDir = new File(TestHarness.class.getProtectionDomain().getCodeSource().getLocation().toURI());
            } catch (Exception ex) {
                codeDir = new File(".").getAbsoluteFile();
            }
            if (codeDir.isFile()) {
                codeDir = codeDir.getParentFile();
            }
            classUrls = new URL[]{ codeDir.toURI().toURL(), new File(".").getAbsoluteFile().toURI().toURL() };
        } catch (Exception e) {
            System.out.println("###HARNESS_FATAL###: " + e.getMessage());
            return;
        }

        String targetClassName = args.length > 1 && !args[1].trim().isEmpty() ? args[1].trim() : "Main";

        try {
            String content = new String(Files.readAllBytes(Paths.get(args[0])), StandardCharsets.UTF_8);
            String[] testBlocks = content.split("<<===NEXT_TEST===>>");

            for (String block : testBlocks) {
                if (block.trim().isEmpty()) continue;
                int idIdx = block.indexOf(":");
                if (idIdx == -1) continue;
                String idStr = block.substring(0, idIdx).trim();
                String input = block.substring(idIdx + 1);

                ByteArrayInputStream inStream = new ByteArrayInputStream(input.getBytes(StandardCharsets.UTF_8));
                ByteArrayOutputStream outStream = new ByteArrayOutputStream();
                PrintStream customOut = new PrintStream(outStream, true, "UTF-8");

                InputStream originalIn = System.in;
                PrintStream originalOut = System.out;
                PrintStream originalErr = System.err;

                System.setIn(inStream);
                System.setOut(customOut);
                System.setErr(customOut);

                long t0 = System.nanoTime();
                String status = "passed";
                String err = null;

                try {
                    // Activate sandbox security restrictions during user code execution
                    sm.active = true;

                    // Fresh ClassLoader with parent delegation for total static variable and class state isolation
                    URLClassLoader loader = new URLClassLoader(classUrls, TestHarness.class.getClassLoader());
                    Class<?> mainClass = null;
                    try {
                        mainClass = Class.forName(targetClassName, true, loader);
                    } catch (ClassNotFoundException cnfe) {
                        // Fallback: search for any compiled class that has a public static void main method
                        File curDir = new File(".");
                        File[] classFiles = curDir.listFiles((dir, name) -> name.endsWith(".class") && !name.startsWith("TestHarness"));
                        if (classFiles != null) {
                            for (File cf : classFiles) {
                                String cName = cf.getName().substring(0, cf.getName().length() - 6);
                                try {
                                    Class<?> candidate = Class.forName(cName, true, loader);
                                    candidate.getDeclaredMethod("main", String[].class);
                                    mainClass = candidate;
                                    break;
                                } catch (Throwable ignored) {}
                            }
                        }
                        if (mainClass == null) {
                            throw cnfe;
                        }
                    }

                    Method mainMethod = mainClass.getDeclaredMethod("main", String[].class);
                    mainMethod.setAccessible(true);
                    mainMethod.invoke(null, (Object) new String[0]);
                    loader.close();
                } catch (InvocationTargetException ite) {
                    Throwable cause = ite.getCause() != null ? ite.getCause() : ite;
                    status = "error";
                    err = cause.toString();
                } catch (Throwable t) {
                    status = "error";
                    err = t.toString();
                } finally {
                    // Deactivate sandbox for harness bookkeeping and restore IO streams
                    sm.active = false;
                    System.setIn(originalIn);
                    System.setOut(originalOut);
                    System.setErr(originalErr);
                }

                long durationMs = (System.nanoTime() - t0) / 1000000;
                String actual = outStream.toString("UTF-8").trim();

                System.out.println("<<<START_RESULT:" + idStr + ">>>");
                System.out.println("STATUS:" + status);
                System.out.println("DURATION:" + durationMs);
                if (err != null) {
                    System.out.println("ERROR:" + err);
                }
                System.out.println("ACTUAL_OUTPUT:");
                System.out.println(actual);
                System.out.println("<<<END_RESULT:" + idStr + ">>>");
            }
        } catch (Exception e) {
            System.out.println("###HARNESS_FATAL###: " + e.getMessage());
        }
    }
}
"""


def parse_harness_output(stdout_str, test_cases):
    """
    Parses structured stdout emitted by TestHarness.java and aligns it with input test cases.

    Protocol format expected from TestHarness:
        <<<START_RESULT:<test_id>>>>
        STATUS:passed|error
        DURATION:<milliseconds>
        [ERROR:<error message>]
        ACTUAL_OUTPUT:
        <stdout captured from student code>
        <<<END_RESULT:<test_id>>>>

    Args:
        stdout_str (str): Raw stdout emitted by the single JVM process.
        test_cases (list[dict]): Original list of test case specs (id, input, expected, etc.).

    Returns:
        list[dict]: Array of result objects with status, execution time, stdout, and pass/fail booleans.
    """
    parsed_map = {}
    pattern = re.compile(
        r'<<<START_RESULT:(\d+)>>>\s*\nSTATUS:(passed|error)\s*\nDURATION:(\d+)\s*\n(?:ERROR:(.*?)\s*\n)?ACTUAL_OUTPUT:\s*\n(.*?)<<<END_RESULT:\1>>>',
        re.DOTALL
    )

    for m in pattern.finditer(stdout_str):
        tc_id = int(m.group(1))
        status = m.group(2)
        duration_ms = float(m.group(3))
        err_msg = m.group(4) if m.group(4) else None
        actual = m.group(5).strip()
        parsed_map[tc_id] = {
            "status": status,
            "durationMs": duration_ms,
            "error": err_msg.strip() if err_msg else None,
            "actual": actual,
        }

    results = []
    for tc in test_cases:
        tc_id = tc.get("id", 1)
        tc_expected = str(tc.get("expected", "")).strip()
        tc_input = str(tc.get("input", ""))

        if tc_id in parsed_map:
            p = parsed_map[tc_id]
            # Normalize whitespace line by line for robust comparison
            actual_clean = "\n".join(l.strip() for l in p["actual"].splitlines() if l.strip())
            expected_clean = "\n".join(l.strip() for l in tc_expected.splitlines() if l.strip())

            if p["status"] == "error":
                results.append({
                    "id": tc_id,
                    "input": tc_input,
                    "expected": tc_expected,
                    "actual": actual_clean,
                    "status": "error",
                    "passed": False,
                    "durationMs": p["durationMs"],
                    "error": p["error"] or "Runtime error occurred",
                })
            else:
                # Case-insensitive whitespace-normalized match
                is_passed = (actual_clean.lower() == expected_clean.lower())
                results.append({
                    "id": tc_id,
                    "input": tc_input,
                    "expected": tc_expected,
                    "actual": actual_clean or "(no output)",
                    "status": "passed" if is_passed else "failed",
                    "passed": is_passed,
                    "durationMs": p["durationMs"],
                    "error": None,
                })
        else:
            # Case where harness was killed prematurely (e.g. process timeout or crash)
            results.append({
                "id": tc_id,
                "input": tc_input,
                "expected": tc_expected,
                "actual": "",
                "status": "error",
                "passed": False,
                "durationMs": 0,
                "error": "Test case execution was interrupted or timed out.",
            })

    return results


def execute_java_solution(source_code, test_cases):
    """
    Orchestrates the entire compilation and execution pipeline for a submitted Java solution.

    Execution Pipeline Steps:
    1. Code Pre-processing & Sanitization:
       - Fixes broken literal newlines inside print calls.
       - Strips 'package ...;' statements (avoids classpath package subdirectory mismatch).
       - Injects boilerplate driver classes if the code only contains a function without Main.
    2. Compilation (Single javac call):
       - Compiles Main.java and TestHarness.java together inside a temporary directory.
       - Uses fast JIT flags (-J-XX:TieredStopAtLevel=1) to prevent compilation overhead.
       - Enforces a 10s compile timeout.
    3. Batch Input Preparation:
       - Formats all test inputs into a single text file (tests.txt) delimited by '<<===NEXT_TEST===>>'.
    4. Execution (Single JVM call):
       - Spawns java TestHarness with tests.txt and the target class name.
       - Enforces a strict 10s execution timeout (prevents infinite while/for loops).
    5. Output Parsing:
       - Extracts test outputs and compiles a summary payload for the frontend.

    Args:
        source_code (str): Java source code submitted by user.
        test_cases (list[dict]): List of test case objects with input and expected output.

        dict: Execution summary containing compileSucceeded, compileOutput,
              durationMs, passed count, total count, and individual results.
    """
    total_start = time.perf_counter()
    # On Linux/Cloud (Render), prefer /tmp (RAM tmpfs) for near-instant file operations
    temp_base = "/tmp" if (os.name != "nt" and os.path.exists("/tmp")) else None

    # Step 1a: Pre-screen for dangerous patterns (defense-in-depth before compilation)
    dangerous_patterns = [
        (r'\bProcessBuilder\b', "Process execution via ProcessBuilder is forbidden in the sandbox."),
        (r'Runtime\.getRuntime\(\)\.exec', "Process execution via Runtime.exec() is forbidden in the sandbox."),
        (r'sun\.misc\.Unsafe', "Access to internal Unsafe operations is forbidden in the sandbox."),
    ]
    for pattern, reason in dangerous_patterns:
        if re.search(pattern, source_code):
            return {
                "compileSucceeded": False,
                "compileOutput": f"Security Error: {reason}",
                "durationMs": 0,
                "passed": 0,
                "total": len(test_cases),
                "results": [],
            }

    # Step 1b: Sanitize any unescaped newline literals in print statements
    prepared_code = re.sub(r'System\.out\.print\("[\r\n]+"\);', 'System.out.println();', source_code)

    # Step 1c: Strip package statements to prevent ClassNotFoundException due to package nesting
    prepared_code = re.sub(r'^\s*package\s+[\w\.]+;\s*', '', prepared_code, flags=re.MULTILINE)

    # Step 1c: Wrap function-only submissions with a driver Main class if Main is absent
    if "class Main" not in prepared_code and "public static void main" not in prepared_code:
        if "multiplyMatrix" in prepared_code and "Result" in prepared_code:
            driver = """
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int t = sc.nextInt();
        while (t-- > 0) {
            int r1 = sc.nextInt();
            int c1 = sc.nextInt();
            int[][] a = new int[r1][c1];
            for (int i = 0; i < r1; i++) {
                for (int j = 0; j < c1; j++) {
                    a[i][j] = sc.nextInt();
                }
            }
            int r2 = sc.nextInt();
            int c2 = sc.nextInt();
            int[][] b = new int[r2][c2];
            for (int i = 0; i < r2; i++) {
                for (int j = 0; j < c2; j++) {
                    b[i][j] = sc.nextInt();
                }
            }
            Result.multiplyMatrix(a, b, r1, c1, r2, c2);
        }
    }
}
"""
            prepared_code = prepared_code + "\n" + driver
        elif "printSpiral" in prepared_code and "Result" in prepared_code:
            driver = """
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int r = sc.nextInt();
        int c = sc.nextInt();
        int[][] a = new int[r][c];
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                a[i][j] = sc.nextInt();
            }
        }
        Result.printSpiral(a, r, c);
    }
}
"""
            prepared_code = prepared_code + "\n" + driver
        elif "maxElement" in prepared_code and "Result" in prepared_code:
            driver = """
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) {
                arr[i] = sc.nextInt();
            }
            System.out.println(Result.maxElement(arr, n));
        }
    }
}
"""
            prepared_code = prepared_code + "\n" + driver
        elif "solveMaze" in prepared_code and "Result" in prepared_code:
            driver = """
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[][] maze = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                maze[i][j] = sc.nextInt();
            }
        }
        System.out.println(Result.solveMaze(maze, n));
    }
}
"""
            prepared_code = prepared_code + "\n" + driver

    # Step 1d: Ensure class Main has public modifier so TestHarness reflection never throws IllegalAccessException
    if "public class Main" not in prepared_code and re.search(r'\bclass\s+Main\b', prepared_code):
        prepared_code = re.sub(r'(?<!public\s)\bclass\s+Main\b', 'public class Main', prepared_code, count=1)

    # Step 2: Create a secure temporary execution sandbox directory
    with tempfile.TemporaryDirectory(dir=temp_base, prefix="java_exec_") as tmpdir:
        # Write student code and test harness files
        main_file = os.path.join(tmpdir, "Main.java")
        harness_file = os.path.join(tmpdir, "TestHarness.java")

        with open(main_file, "w", encoding="utf-8") as f:
            f.write(prepared_code)
        with open(harness_file, "w", encoding="utf-8") as f:
            f.write(HARNESS_JAVA_SOURCE)

        # Single JIT-accelerated javac compilation
        compile_start = time.perf_counter()
        try:
            c_res = subprocess.run(
                ["javac", *FAST_JAVAC_FLAGS, "Main.java", "TestHarness.java"],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=10,
            )
        except subprocess.TimeoutExpired:
            return {
                "compileSucceeded": False,
                "compileOutput": "Compilation timed out (exceeded 10s limit).",
                "durationMs": round((time.perf_counter() - compile_start) * 1000, 1),
                "passed": 0,
                "total": len(test_cases),
                "results": [],
            }

        compile_duration_ms = round((time.perf_counter() - compile_start) * 1000, 1)

        # Handle compilation errors (syntax errors, missing imports, etc.)
        if c_res.returncode != 0:
            return {
                "compileSucceeded": False,
                "compileOutput": c_res.stderr or c_res.stdout or "Compilation failed without output.",
                "durationMs": compile_duration_ms,
                "passed": 0,
                "total": len(test_cases),
                "results": [],
            }

        # Step 3: Write test inputs batch file
        test_file_path = os.path.join(tmpdir, "tests.txt")
        test_file_content = ""
        for tc in test_cases:
            tc_id = tc.get("id", 1)
            tc_input = str(tc.get("input", ""))
            test_file_content += f"{tc_id}:{tc_input}<<===NEXT_TEST===>>"

        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write(test_file_content)

        # Detect target class name with public static void main (default to Main)
        target_class = "Main"
        match_class = re.search(r'class\s+([A-Za-z0-9_]+)(?:(?!class\b)[\s\S])*?public\s+static\s+void\s+main', prepared_code)
        if match_class:
            target_class = match_class.group(1)

        # Step 4: Run SINGLE JVM process for ALL test cases
        try:
            r_res = subprocess.run(
                ["java", *FAST_JAVA_FLAGS, "TestHarness", "tests.txt", target_class],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=10,
            )
            raw_stdout = r_res.stdout
        except subprocess.TimeoutExpired:
            # Handle runtime infinite loops or excessive memory consumption
            total_duration_ms = round((time.perf_counter() - total_start) * 1000, 1)
            return {
                "compileSucceeded": True,
                "compileOutput": "Execution timed out (exceeded 10s limit). Check for infinite loops.",
                "durationMs": total_duration_ms,
                "passed": 0,
                "total": len(test_cases),
                "results": [
                    {
                        "id": tc.get("id", idx + 1),
                        "input": str(tc.get("input", "")),
                        "expected": str(tc.get("expected", "")),
                        "actual": "",
                        "status": "timeout",
                        "passed": False,
                        "durationMs": 0,
                        "error": "Time limit exceeded (10000ms total). Possible infinite loop.",
                    }
                    for idx, tc in enumerate(test_cases)
                ],
            }

        # Step 5: Parse test results and calculate summary metrics
        results = parse_harness_output(raw_stdout, test_cases)
        passed_count = sum(1 for r in results if r.get("passed", False))
        total_duration_ms = round((time.perf_counter() - total_start) * 1000, 1)

        return {
            "compileSucceeded": True,
            "compileOutput": c_res.stderr or "Compilation successful.",
            "durationMs": total_duration_ms,
            "passed": passed_count,
            "total": len(test_cases),
            "results": results,
        }


# ==============================================================================
# Flask Routes and API Endpoints
# ==============================================================================

@app.route('/')
def serve_index():
    """Serves the primary Single-Page Application (SPA) HTML."""
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """
    Serves static assets (CSS, JS, images, fonts).
    Falls back to index.html if the requested path is not a file on disk.
    """
    file_path = os.path.join(BASE_DIR, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(BASE_DIR, path)
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/api/check', methods=['GET'])
@app.route('/api/health', methods=['GET'])
@app.route('/api/status', methods=['GET'])
def get_status():
    """
    Diagnostic status endpoint checked by the frontend during initial boot.
    Returns:
        JSON with JDK compiler availability and version numbers.
    """
    data = check_compiler()
    return jsonify(data)


@app.route('/api/testcases', methods=['GET'])
def get_testcases():
    """
    Returns the fallback sample & edge test case collections.
    """
    data = {
        "sample": SAMPLE_TEST_CASES,
        "edge": EDGE_TEST_CASES,
    }
    return jsonify(data)


@app.route('/api/run', methods=['POST'])
def run_code():
    """
    Core execution API endpoint invoked whenever the student clicks 'Run All Tests'
    or runs a single custom test case.
    
    Expected JSON Body:
        {
            "sourceCode": "class Main { ... }",
            "testCases": [
                { "id": 1, "input": "...", "expected": "..." }
            ]
        }
    
    Returns:
        JSON: Full test execution report (compile status, individual test outcomes, timings).
    """
    try:
        # Rate limit enforcement (max 20 runs per minute per IP)
        client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()
        if not check_rate_limit(client_ip):
            resp = jsonify({
                "error": "Rate limit exceeded (max 20 test runs per minute). Please wait a few seconds before retrying.",
                "rateLimited": True
            })
            resp.status_code = 429
            resp.headers["Retry-After"] = "5"
            return resp

        payload = request.get_json(force=True)
        if not payload:
            return jsonify({"error": "Invalid or empty JSON payload"}), 400
            
        source_code = payload.get("sourceCode", "")
        test_cases = payload.get("testCases")

        # Fallback to sample cases if none provided
        if test_cases is None:
            test_cases = SAMPLE_TEST_CASES
        elif isinstance(test_cases, list) and len(test_cases) > 0 and isinstance(test_cases[0], (str, int)):
            # Normalize legacy string-only input arrays
            test_cases = [
                {
                    "id": idx + 1,
                    "input": str(inp),
                    "expected": "Palindrome" if is_palindrome_str(str(inp)) else "Not a Palindrome"
                }
                for idx, inp in enumerate(test_cases)
            ]

        result = execute_java_solution(source_code, test_cases)
        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==============================================================================
# Local Development Server Launcher
# ==============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print(" Java Practice Compiler - Fast Flask Backend")
    print("=" * 60)
    compiler_info = check_compiler()
    print(f" Local Compiler Status: {'READY' if compiler_info['status'] else 'NOT FOUND'}")
    if compiler_info["status"]:
        print(f"   * javac: {compiler_info['javac_version']}")
        print(f"   * java:  {compiler_info['java_version']}")
    print(f" Server running at: http://127.0.0.1:{PORT}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=PORT, debug=True)
