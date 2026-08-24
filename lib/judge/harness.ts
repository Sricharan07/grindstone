import type { Language } from "./types";

const twoSumCases = [
  { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
  { nums: [3, 2, 4], target: 6, expected: [1, 2] },
  { nums: [-3, 4, 3, 90], target: 0, expected: [0, 2] },
];

function pythonHarness(code: string) {
  return `${code}

def __grindstone_check():
    cases = ${JSON.stringify(twoSumCases.map(({ nums, target, expected }) => [nums, target, expected]))}
    solution = Solution()
    for nums, target, expected in cases:
        actual = solution.twoSum(nums, target)
        if sorted(actual) != sorted(expected):
            raise AssertionError(f"expected {expected}, received {actual}")
    print(f"{len(cases)}/{len(cases)} tests passed")

__grindstone_check()`;
}

function javaHarness(code: string) {
  const insertion = `
    public static void main(String[] args) {
        Main solution = new Main();
        int[][] nums = {{2,7,11,15},{3,2,4},{-3,4,3,90}};
        int[] targets = {9,6,0};
        int[][] expected = {{0,1},{1,2},{0,2}};
        for (int i = 0; i < nums.length; i++) {
            int[] actual = solution.twoSum(nums[i], targets[i]);
            java.util.Arrays.sort(actual); java.util.Arrays.sort(expected[i]);
            if (!java.util.Arrays.equals(actual, expected[i])) throw new AssertionError("case " + i + " failed");
        }
        System.out.println("3/3 tests passed");
    }
`;
  const close = code.lastIndexOf("}");
  if (close < 0) return code;
  return `${code.slice(0, close)}${insertion}}`;
}

function cppHarness(code: string) {
  return `${code}
int main() {
    Solution solution;
    vector<vector<int>> inputs = {{2,7,11,15},{3,2,4},{-3,4,3,90}};
    vector<int> targets = {9,6,0};
    vector<vector<int>> expected = {{0,1},{1,2},{0,2}};
    for (size_t i = 0; i < inputs.size(); ++i) {
        auto actual = solution.twoSum(inputs[i], targets[i]);
        sort(actual.begin(), actual.end()); sort(expected[i].begin(), expected[i].end());
        if (actual != expected[i]) { cerr << "case " << i << " failed"; return 1; }
    }
    cout << "3/3 tests passed\\n";
}`;
}

export type HarnessProblem = "two-sum" | "two-sum-stream" | "longest-consecutive" | "first-unique" | "balanced-brackets" | "eligible-orders" | "pagination-cursor" | "retry-budget" | "daily-report" | "membership-cache" | "min-window";

function pythonMinWindowHarness(code: string) {
  return `${code}

def __grindstone_check():
    cases = [([2, 3, 1], 5, 2), ([2, 3, 1, 2, 4, 3], 7, 2), ([1, 4, 4], 4, 1), ([8], 8, 1)]
    for values, target, expected in cases:
        actual = min_len(values, target)
        if actual != expected: raise AssertionError(f"expected {expected}, received {actual}")
    print(f"{len(cases)}/{len(cases)} tests passed")
__grindstone_check()`;
}

function pythonEligibleOrdersHarness(code: string) {
  return `${code}

def __grindstone_check():
    cases = [
        ([{"id": 7, "status": "paid", "total": 50}], 50, [7]),
        ([{"id": 1, "status": "pending", "total": 90}, {"id": 2, "status": "paid", "total": 90}], 50, [2]),
        ([{"id": 1, "status": "paid", "total": 49}], 50, []),
        ([], 50, []),
    ]
    for orders, minimum, expected in cases:
        actual = eligible_orders(orders, minimum)
        if actual != expected: raise AssertionError(f"expected {expected}, received {actual}")
    print(f"{len(cases)}/{len(cases)} tests passed")
__grindstone_check()`;
}

function pythonCodebaseHarness(code: string, problem: "pagination-cursor" | "retry-budget" | "daily-report" | "membership-cache") {
  const checks = {
    "pagination-cursor": `pages = {None: ([{"id": 1}], "1"), "1": ([], "2"), "2": ([{"id": 2}], None)}
    actual = collect_rows(lambda cursor: pages[cursor])
    if actual != [{"id": 1}, {"id": 2}]: raise AssertionError(f"expected IDs 1 and 2, received {actual}")
    singleton = collect_rows(lambda cursor: ([{"id": 9}], None))
    if singleton != [{"id": 9}]: raise AssertionError(f"singleton failed: {singleton}")`,
    "retry-budget": `budget = RetryBudget(2)
    if budget.record(False) is not True: raise AssertionError("first failure should permit another attempt")
    if budget.record(True) is not True: raise AssertionError("success should restore the budget")
    if budget.record(False) is not True: raise AssertionError("failure after success should permit another attempt")
    exhausted = RetryBudget(2)
    exhausted.record(False)
    if exhausted.record(False) is not False: raise AssertionError("two consecutive failures should exhaust the budget")`,
    "daily-report": `from datetime import datetime as __dt, timezone as __tz
    events = [{"id": 1, "created_at": __dt(2026, 8, 22, 23, 59, tzinfo=__tz.utc)}, {"id": 2, "created_at": __dt(2026, 8, 23, 0, 0, tzinfo=__tz.utc)}]
    actual = event_ids_for_utc_day(events, __dt(2026, 8, 23, tzinfo=__tz.utc))
    if actual != [2]: raise AssertionError(f"expected [2], received {actual}")
    if event_ids_for_utc_day([], __dt(2026, 8, 23, tzinfo=__tz.utc)) != []: raise AssertionError("empty input failed")`,
    "membership-cache": `memberships = Memberships()
    memberships.add("u1", "g1")
    if memberships.group_members("g1") != ["u1"]: raise AssertionError("initial group lookup failed")
    memberships.remove("u1", "g1")
    if memberships.group_members("g1") != []: raise AssertionError("group cache remained stale")
    memberships.add("u2", "g1")
    if memberships.group_members("g1") != ["u2"]: raise AssertionError("add invalidation failed")`,
  } as const;
  return `${code}

def __grindstone_check():
    ${checks[problem].split("\n").map((line) => line.trim()).join("\n    ")}
    print("all repository tests passed")
__grindstone_check()`;
}

function pythonFunctionHarness(code: string, problem: "first-unique" | "balanced-brackets") {
  if (problem === "first-unique") return `${code}

def __grindstone_check():
    cases = [([4, 5, 4, 6, 5], 6), ([2, 2], None), ([-1, 3, -1], 3), ([9], 9)]
    for values, expected in cases:
        actual = first_unique(values)
        if actual != expected: raise AssertionError(f"expected {expected}, received {actual}")
    print(f"{len(cases)}/{len(cases)} tests passed")
__grindstone_check()`;
  return `${code}

def __grindstone_check():
    cases = [("([]{})", True), ("([)]", False), ("", True), ("((", False), ("{[()]}", True)]
    for value, expected in cases:
        actual = is_balanced(value)
        if actual != expected: raise AssertionError(f"expected {expected}, received {actual}")
    print(f"{len(cases)}/{len(cases)} tests passed")
__grindstone_check()`;
}

function pythonLongestConsecutiveHarness(code: string) {
  return `${code}

def __grindstone_check():
    cases = [([100, 4, 200, 1, 3, 2], 4), ([], 0), ([0, -1, 1, 2, -2], 5), ([1, 2, 0, 1], 3)]
    solution = Solution()
    for values, expected in cases:
        actual = solution.longestConsecutive(values)
        if actual != expected:
            raise AssertionError(f"expected {expected}, received {actual}")
    print(f"{len(cases)}/{len(cases)} tests passed")

__grindstone_check()`;
}

function pythonStreamHarness(code: string) {
  return `${code}

def __grindstone_check():
    cases = [(9, [2, 7, 11, 15], [0, 1]), (6, [3, 3], [0, 1]), (0, [-3, 4, 3], [0, 2])]
    for target, values, expected in cases:
        solution = Solution(target)
        actual = None
        for value in values:
            result = solution.add(value)
            if result is not None:
                actual = result
                break
        if actual != expected:
            raise AssertionError(f"expected {expected}, received {actual}")
    print(f"{len(cases)}/{len(cases)} tests passed")

__grindstone_check()`;
}

function javaStreamHarness(code: string) {
  const insertion = `
    public static void main(String[] args) {
        int[] targets = {9, 6, 0};
        int[][] values = {{2,7,11,15},{3,3},{-3,4,3}};
        int[][] expected = {{0,1},{0,1},{0,2}};
        for (int c=0;c<values.length;c++) {
            Main solution = new Main(targets[c]); int[] actual = null;
            for (int value : values[c]) { actual = solution.add(value); if (actual != null) break; }
            if (!java.util.Arrays.equals(actual, expected[c])) throw new AssertionError("case " + c + " failed");
        }
        System.out.println("3/3 tests passed");
    }
`;
  const close = code.lastIndexOf("}");
  return close < 0 ? code : `${code.slice(0, close)}${insertion}}`;
}

function cppStreamHarness(code: string) {
  return `${code}
int main(){ vector<int> targets={9,6,0}; vector<vector<int>> values={{2,7,11,15},{3,3},{-3,4,3}}; vector<vector<int>> expected={{0,1},{0,1},{0,2}}; for(size_t c=0;c<values.size();c++){ Solution solution(targets[c]); vector<int> actual; for(int value:values[c]){ actual=solution.add(value); if(!actual.empty()) break; } if(actual!=expected[c]){ cerr<<"case "<<c<<" failed"; return 1; } } cout<<"3/3 tests passed\\n"; }`;
}

export function buildProblemHarness(language: Language, code: string, problem: HarnessProblem) {
  if (problem === "min-window") {
    if (language !== "python") throw new Error("Debugging drill requires Python");
    return pythonMinWindowHarness(code);
  }
  if (problem === "eligible-orders") {
    if (language !== "python") throw new Error("Codebase fixture requires Python");
    return pythonEligibleOrdersHarness(code);
  }
  if (problem === "pagination-cursor" || problem === "retry-budget" || problem === "daily-report" || problem === "membership-cache") {
    if (language !== "python") throw new Error("Codebase fixture requires Python");
    return pythonCodebaseHarness(code, problem);
  }
  if (problem === "first-unique" || problem === "balanced-brackets") {
    if (language !== "python") throw new Error("Drive coding tasks currently require Python");
    return pythonFunctionHarness(code, problem);
  }
  if (problem === "longest-consecutive") {
    if (language !== "python") throw new Error("Longest Consecutive mock currently requires Python");
    return pythonLongestConsecutiveHarness(code);
  }
  if (problem === "two-sum-stream") {
    if (language === "python") return pythonStreamHarness(code);
    if (language === "java") return javaStreamHarness(code);
    return cppStreamHarness(code);
  }
  if (language === "python") return pythonHarness(code);
  if (language === "java") return javaHarness(code);
  return cppHarness(code);
}

const scalingSizes = [200, 400, 800, 1600, 3200];

export function buildScalingHarness(language: Language, code: string, problem: HarnessProblem) {
  if (problem === "min-window") throw new Error("The debugging drill does not use a scaling run");
  if (problem === "pagination-cursor" || problem === "retry-budget" || problem === "daily-report" || problem === "membership-cache") throw new Error("Codebase fixtures do not use a scaling run");
  if (problem === "eligible-orders") {
    if (language !== "python") throw new Error("Codebase fixture requires Python");
    return `${code}
import time
for n in ${JSON.stringify(scalingSizes)}:
    orders = [{"id": i, "status": "paid", "total": i} for i in range(n)]
    started = time.perf_counter_ns()
    for _ in range(40): eligible_orders(orders, n // 2)
    elapsed = (time.perf_counter_ns() - started) / 40000000
    print(f"{n}:{elapsed:.6f}")`;
  }
  if (problem === "first-unique" || problem === "balanced-brackets") {
    if (language !== "python") throw new Error("Drive coding tasks currently require Python");
    const setup = problem === "first-unique"
      ? "values = list(range(n)) + list(range(n - 1)); target = values"
      : "target = '(' * n + ')' * n";
    const call = problem === "first-unique" ? "first_unique(target)" : "is_balanced(target)";
    return `${code}
import time
for n in ${JSON.stringify(scalingSizes)}:
    ${setup}
    started = time.perf_counter_ns()
    for _ in range(40): ${call}
    elapsed = (time.perf_counter_ns() - started) / 40000000
    print(f"{n}:{elapsed:.6f}")`;
  }
  if (problem === "longest-consecutive") {
    if (language !== "python") throw new Error("Longest Consecutive mock currently requires Python");
    return `${code}
import random
import time
solution = Solution()
for n in ${JSON.stringify(scalingSizes)}:
    values = list(range(n))
    random.Random(17).shuffle(values)
    started = time.perf_counter_ns()
    for _ in range(40): solution.longestConsecutive(values)
    elapsed = (time.perf_counter_ns() - started) / 40000000
    print(f"{n}:{elapsed:.6f}")`;
  }
  if (problem === "two-sum-stream") {
    if (language === "python") return `${code}
import time
for n in ${JSON.stringify(scalingSizes)}:
    started = time.perf_counter_ns()
    for _ in range(40):
        solution = Solution(n * 2 - 3)
        for value in range(n): solution.add(value)
    elapsed = (time.perf_counter_ns() - started) / 40000000
    print(f"{n}:{elapsed:.6f}")`;
    if (language === "java") {
      const insertion = `
    public static void main(String[] args) { int[] sizes = {${scalingSizes.join(",")}}; for (int n : sizes) { long start=System.nanoTime(); for(int r=0;r<40;r++){ Main solution=new Main(n*2-3); for(int value=0;value<n;value++) solution.add(value); } double ms=(System.nanoTime()-start)/40000000.0; System.out.printf("%d:%.6f%n",n,ms); } }
`;
      const close = code.lastIndexOf("}"); return close < 0 ? code : `${code.slice(0, close)}${insertion}}`;
    }
    return `${code}
int main(){ vector<int> sizes={${scalingSizes.join(",")}}; for(int n:sizes){ auto start=chrono::steady_clock::now(); for(int r=0;r<40;r++){ Solution solution(n*2-3); for(int value=0;value<n;value++) solution.add(value); } auto ns=chrono::duration_cast<chrono::nanoseconds>(chrono::steady_clock::now()-start).count(); cout<<n<<":"<<fixed<<setprecision(6)<<(ns/40000000.0)<<"\\n"; } }`;
  }
  if (language === "python") return `${code}
import time
solution = Solution()
for n in ${JSON.stringify(scalingSizes)}:
    values = list(range(n))
    started = time.perf_counter_ns()
    for _ in range(40): solution.twoSum(values, n * 2 - 3)
    elapsed = (time.perf_counter_ns() - started) / 40000000
    print(f"{n}:{elapsed:.6f}")`;
  if (language === "java") {
    const insertion = `
    public static void main(String[] args) {
        Main solution = new Main(); int[] sizes = {${scalingSizes.join(",")}};
        for (int n : sizes) { int[] values = new int[n]; for (int i=0;i<n;i++) values[i]=i; long start=System.nanoTime(); for (int r=0;r<40;r++) solution.twoSum(values,n*2-3); double ms=(System.nanoTime()-start)/40000000.0; System.out.printf("%d:%.6f%n",n,ms); }
    }
`;
    const close = code.lastIndexOf("}"); return close < 0 ? code : `${code.slice(0, close)}${insertion}}`;
  }
  return `${code}
int main(){ Solution solution; vector<int> sizes={${scalingSizes.join(",")}}; for(int n:sizes){ vector<int> values(n); iota(values.begin(),values.end(),0); auto start=chrono::steady_clock::now(); for(int r=0;r<40;r++) solution.twoSum(values,n*2-3); auto ns=chrono::duration_cast<chrono::nanoseconds>(chrono::steady_clock::now()-start).count(); cout<<n<<":"<<fixed<<setprecision(6)<<(ns/40000000.0)<<"\\n"; } }`;
}

export function parseScalingOutput(output: string) {
  return output.trim().split("\n").map((line) => { const [n, durationMs] = line.trim().split(":").map(Number); return { n, durationMs }; }).filter((sample) => Number.isFinite(sample.n) && Number.isFinite(sample.durationMs) && sample.durationMs > 0);
}
