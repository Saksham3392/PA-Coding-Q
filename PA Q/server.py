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

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

PORT = int(os.environ.get("PORT", 4060))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FAST_JAVA_FLAGS = [
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
    """Checks if javac and java are available in PATH."""
    javac_ok = False
    java_ok = False
    javac_version = ""
    java_version = ""

    try:
        res = subprocess.run(["javac", "-version"], capture_output=True, text=True, timeout=3)
        javac_ok = res.returncode == 0
        javac_version = (res.stdout or res.stderr).strip()
    except Exception as e:
        javac_version = str(e)

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
    clean = val.strip()
    return clean == clean[::-1]


HARNESS_JAVA_SOURCE = """import java.io.*;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

public class TestHarness {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("No test file specified.");
            return;
        }

        File currentDir = new File(".");
        URL[] classUrls;
        try {
            classUrls = new URL[]{ currentDir.toURI().toURL() };
        } catch (Exception e) {
            System.out.println("###HARNESS_FATAL###: " + e.getMessage());
            return;
        }

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
                    // Fresh ClassLoader for total static variable and class state isolation
                    URLClassLoader loader = new URLClassLoader(classUrls, null);
                    Class<?> mainClass = Class.forName("Main", true, loader);
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
    """Parses structured test outputs from Single-JVM TestHarness."""
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
    Single-JVM Test Harness Execution Pipeline:
    1. Uses /tmp RAM tmpfs for ultra-fast I/O.
    2. Compiles Main.java + TestHarness.java ONCE with JIT compilation acceleration.
    3. Runs ALL test cases inside a SINGLE JVM execution with classloader-level static isolation.
    4. Global subprocess timeout of 10s.
    """
    total_start = time.perf_counter()
    temp_base = "/tmp" if (os.name != "nt" and os.path.exists("/tmp")) else None

    # Sanitize any unescaped newline literals in print statements
    prepared_code = re.sub(r'System\.out\.print\("[\r\n]+"\);', 'System.out.println();', source_code)

    # Wrap function-based submissions with driver Main class if Main is absent
    if "class Main" not in prepared_code and "public static void main" not in prepared_code:
        if "multiplyMatrix" in prepared_code and "Result" in prepared_code:
            driver = """
class Main {
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
class Main {
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
class Main {
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

    with tempfile.TemporaryDirectory(dir=temp_base, prefix="java_exec_") as tmpdir:
        # 1. Write student code and test harness
        main_file = os.path.join(tmpdir, "Main.java")
        harness_file = os.path.join(tmpdir, "TestHarness.java")

        with open(main_file, "w", encoding="utf-8") as f:
            f.write(prepared_code)
        with open(harness_file, "w", encoding="utf-8") as f:
            f.write(HARNESS_JAVA_SOURCE)

        # 2. Single JIT-accelerated javac compilation
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

        if c_res.returncode != 0:
            return {
                "compileSucceeded": False,
                "compileOutput": c_res.stderr or c_res.stdout or "Compilation failed without output.",
                "durationMs": compile_duration_ms,
                "passed": 0,
                "total": len(test_cases),
                "results": [],
            }

        # 3. Write test inputs batch file
        test_file_path = os.path.join(tmpdir, "tests.txt")
        test_file_content = ""
        for tc in test_cases:
            tc_id = tc.get("id", 1)
            tc_input = str(tc.get("input", ""))
            test_file_content += f"{tc_id}:{tc_input}<<===NEXT_TEST===>>"

        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write(test_file_content)

        # 4. Run SINGLE JVM process for ALL test cases
        try:
            r_res = subprocess.run(
                ["java", *FAST_JAVA_FLAGS, "TestHarness", "tests.txt"],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=10,
            )
            raw_stdout = r_res.stdout
        except subprocess.TimeoutExpired:
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

        # 5. Parse test results
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


@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    file_path = os.path.join(BASE_DIR, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(BASE_DIR, path)
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/api/check', methods=['GET'])
@app.route('/api/health', methods=['GET'])
@app.route('/api/status', methods=['GET'])
def get_status():
    data = check_compiler()
    return jsonify(data)

@app.route('/api/testcases', methods=['GET'])
def get_testcases():
    data = {
        "sample": SAMPLE_TEST_CASES,
        "edge": EDGE_TEST_CASES,
    }
    return jsonify(data)

@app.route('/api/run', methods=['POST'])
def run_code():
    try:
        payload = request.get_json(force=True)
        if not payload:
            return jsonify({"error": "Invalid or empty JSON payload"}), 400
            
        source_code = payload.get("sourceCode", "")
        test_cases = payload.get("testCases")

        if test_cases is None:
            test_cases = SAMPLE_TEST_CASES
        elif isinstance(test_cases, list) and len(test_cases) > 0 and isinstance(test_cases[0], (str, int)):
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
