import "server-only";

import { learningLesson, type LessonSlug } from "@/lib/learning/catalog";
import type { AssessmentGroup } from "@/lib/assessment/types";

export interface LessonTestCase {
  id: string;
  name: string;
  category: string;
  group: AssessmentGroup;
  input: string;
  expected: string;
  correction: string;
}

interface CaseInput {
  input: string;
  name: string;
  category: string;
  group: AssessmentGroup;
}

type LessonInputs = Record<LessonSlug, { guided: CaseInput[]; independent: CaseInput[] }>;

const CORRECT = "correctness" as const;
const EDGE = "edgeCases" as const;
const FAST = "efficiency" as const;

function c(input: string, name: string, category = "Core behavior"): CaseInput {
  return { input, name, category, group: CORRECT };
}

function e(input: string, name: string, category = "Boundary case"): CaseInput {
  return { input, name, category, group: EDGE };
}

function f(input: string, name: string, category = "Larger input"): CaseInput {
  return { input, name, category, group: FAST };
}

const inputs: LessonInputs = {
  "array-scan": {
    guided: [c("-3,7,2", "Maximum in the middle"), e("-8,-2,-5", "All values are negative", "Initialization"), e("9", "One value", "Smallest valid input"), c("4,4,1", "Repeated maximum")],
    independent: [c("5,1,9,2", "Later maximum"), c("12,3,2,1", "First value stays best"), c("0,-1,-2", "Zero is the maximum"), c("-4,6,6,2", "Tied maximum"), c("3,-7,8,-2,5", "Mixed signs"), c("11,10,9,8", "Descending values"), e("-1", "Single negative value"), e("0", "Single zero"), e("-100,-99", "Negative boundary"), e("2,2", "Two equal values"), f("1,3,5,7,9,11,13,15,17,19", "Long scan"), f("20,18,16,14,12,10,8,6,4,2", "Long descending scan")],
  },
  "hashmap-two-sum": {
    guided: [c("2,7,11,15|9", "Pair near the start"), e("3,3|6", "Duplicate values", "Check before insert"), c("-3,4,3,90|0", "Negative complement"), c("1,5,8,10|15", "Separated pair")],
    independent: [c("4,6,1,8|10", "First pair"), c("5,2,9,7|16", "Later pair"), c("-5,2,7,11|2", "Mixed-sign pair"), c("10,20,30,40|50", "Wide values"), c("1,4,6,3|7", "Stored complement"), c("8,1,2,6|14", "Outer pair"), e("0,0|0", "Two zeros"), e("-2,-2|-4", "Duplicate negatives"), e("1,-1,2|0", "Opposite values"), e("100,1|101", "Two values"), f("1,3,5,7,9,11,13,15,17,19|28", "Long lookup scan"), f("-10,-5,0,5,10,15,20,25|15", "Long mixed scan")],
  },
  "two-pointers": {
    guided: [c("1,2,3,4,6|6", "Move both boundaries"), c("2,3,4|6", "Use both ends"), e("-4,-1,0,3,9|8", "Negative values"), c("1,4,5,7,9|12", "Interior pair")],
    independent: [c("1,2,4,8,11|10", "Interior target"), c("2,5,9,12|14", "End values"), c("-8,-3,1,4,10|7", "Mixed signs"), c("0,3,6,9|9", "Zero pair"), c("1,6,8,10,14|16", "Shrink from right"), c("3,7,11,15,19|22", "Shrink from left"), e("4,9|13", "Two values"), e("-5,5|0", "Opposite values"), e("1,1,2,3|2", "Duplicate values"), e("-2,0,2|0", "Symmetric pair"), f("1,2,3,4,5,6,7,8,9,10,11,12|19", "Long sorted scan"), f("-20,-15,-10,-5,0,5,10,15,20|25", "Long mixed sorted scan")],
  },
  "prefix-sums": {
    guided: [c("1,2,3,4|1,3", "Middle range"), e("5,-2,7|0,1", "Range starts at zero", "Leading prefix"), e("4,8,-3,2|2,2", "One-element range"), c("3,1,4,1,5|1,3", "Interior range")],
    independent: [c("2,4,6,8|1,2", "Two-value range"), c("-3,5,2,-1|1,3", "Mixed values"), c("10,20,30,40|2,3", "Tail range"), c("1,1,1,1,1|0,4", "Whole range"), c("9,-4,7,2|0,2", "Prefix range"), c("6,3,8,5,2|2,4", "Suffix range"), e("7|0,0", "Single value"), e("0,0,0|1,1", "Zero range"), e("-5,-6|0,0", "One negative value"), e("-5,-6|0,1", "All-negative range"), f("1,2,3,4,5,6,7,8,9,10|2,8", "Long range query"), f("10,-9,8,-7,6,-5,4,-3,2,-1|0,9", "Long mixed query")],
  },
  "minimum-window": {
    guided: [c("2,3,1,2,4,3|7", "Shrink to the shortest window"), e("1,1,1|5", "No qualifying window", "Missing answer"), e("1,4,4|4", "One value qualifies", "Single-value window"), c("2,1,5,2,3,2|7", "Multiple qualifying windows")],
    independent: [c("1,2,3,4|6", "Prefix qualifies"), c("4,1,1,1,5|5", "Single value at the end"), c("2,2,2,2|6", "Equal values"), c("5,1,2,3|6", "Competing windows"), c("1,3,2,5,1|7", "Interior shortest window"), c("3,1,1,6,2|7", "Shrink after a large value"), e("8|8", "Single qualifying input"), e("7|8", "Single non-qualifying input"), e("1,2|3", "Whole input qualifies"), e("2,2|5", "No answer in two values"), f("1,2,1,3,1,4,1,5,1,6|11", "Long moving window"), f("2,1,2,1,2,1,2,1,9,1,2,1|10", "Long late window")],
  },
  "stack-matching": {
    guided: [c("([]{})", "Mixed valid nesting"), c("([)]", "Crossed closing order"), e("", "Empty input", "No brackets"), e("((", "Unclosed openings", "Incomplete input")],
    independent: [c("{}[]()", "Adjacent pairs"), c("{[()]}", "Deep nesting"), c("(()[]){}", "Nested and adjacent"), c("([{}])", "Three bracket types"), c("()()()", "Repeated pairs"), c("{([])}[]", "Combined structures"), e(")", "Closing without opening"), e("(", "One unclosed opening"), e("{]", "Immediate mismatch"), e("())", "Extra closing bracket"), f("(((((((((())))))))))", "Deep valid nesting"), f("{[()]}{[()]}{[()]}", "Long repeated nesting")],
  },
  "binary-search": {
    guided: [c("1,3,5,7|5", "Present middle target"), e("1,3,5,7|4", "Absent target", "Empty search range"), c("-5,0,2,9|9", "Present last target"), e("6|6", "Single present value", "Smallest input")],
    independent: [c("2,4,6,8,10|2", "First target"), c("2,4,6,8,10|10", "Last target"), c("-9,-3,0,7,12|0", "Mixed-sign target"), c("1,5,9,13,17|13", "Right-half target"), c("3,6,9,12,15|6", "Left-half target"), c("0,10,20,30|20", "Even-length input"), e("8|3", "Single absent value"), e("1,2|1", "Two values first"), e("1,2|3", "Above upper bound"), e("-4,-1,2|-5", "Below lower bound"), f("1,2,3,4,5,6,7,8,9,10,11,12,13,14,15|14", "Long successful search"), f("-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30|7", "Long absent search")],
  },
  "copy-with-intent": {
    guided: [c("72,81|94", "Copy before appending"), e("5|8", "One original value"), c("-1,0,3|7", "Mixed original values"), c("4,4|4", "Repeated values")],
    independent: [c("10,20|30", "Two-value copy"), c("1,2,3|9", "Three-value copy"), c("-5,-1|0", "Negative values"), c("0,2,4|6", "Zero in the copy"), c("8,8,9|10", "Duplicate values"), c("100,200,300|400", "Large values"), e("0|0", "Append a duplicate zero"), e("-1|-2", "Single negative value"), e("6,7|7", "Append an existing value"), e("42|99", "Single original item"), f("1,2,3,4,5,6,7,8,9,10|11", "Long collection copy"), f("-5,-4,-3,-2,-1,0,1,2,3,4,5|6", "Long mixed collection")],
  },
  "recursive-factorial": {
    guided: [c("5", "Typical factorial"), e("0", "Base case", "Recursive base case"), c("8", "Deeper recursion"), e("1", "First recursive boundary")],
    independent: [c("3", "Small factorial"), c("4", "Four recursive layers"), c("6", "Six factorial"), c("7", "Seven factorial"), c("9", "Nine factorial"), c("10", "Ten factorial"), e("2", "First multiplication"), e("02", "Leading-zero integer"), e("00", "Written base case"), e("01", "Written recursion boundary"), f("12", "Deepest allowed recursion"), f("11", "Near-maximum recursion")],
  },
  "tree-levels": {
    guided: [c("3,9,20,null,null,15,7", "Three tree levels"), e("1", "Root only", "Smallest tree"), c("1,2,3,4,null,null,5", "Uneven tree"), e("1,null,2", "Only a right child", "Missing child")],
    independent: [c("1,2,3", "Complete two-level tree"), c("5,3,8,1,4,7,9", "Complete three-level tree"), c("1,2,null,3", "Left chain"), c("1,null,2,null,3", "Right chain"), c("4,2,6,null,3,5", "Sparse branches"), c("10,5,15,2,7,null,20", "Uneven last level"), e("0", "Zero-valued root"), e("-1,-2,-3", "Negative node values"), e("1,null,2,3", "Sparse serialized tree"), e("9,8,null,7", "Single-sided depth"), f("1,2,3,4,5,6,7,8,9,10,11,12,13,14,15", "Wide complete tree"), f("1,2,null,3,null,4,null,5,null,6", "Deep narrow tree")],
  },
  "bst-validation": {
    guided: [c("2,1,3", "Valid three-node tree"), c("5,1,6,null,null,3,7", "Deep ancestor violation"), c("5,4,6,null,null,3,7", "Right subtree below root"), e("1", "Root only", "Smallest tree")],
    independent: [c("8,4,12,2,6,10,14", "Valid balanced BST"), c("10,5,15,null,null,6,20", "Deep right violation"), c("3,1,5,0,2,4,6", "Valid three levels"), c("7,3,9,null,8", "Left subtree exceeds root"), c("0,-2,2,-3,-1,1,3", "Valid mixed signs"), c("20,10,30,5,15,25,35", "Valid wide ranges"), e("2,2,3", "Duplicate on the left"), e("2,1,2", "Duplicate on the right"), e("1,null,0", "Immediate right violation"), e("-1,-2,null", "Negative valid pair"), f("16,8,24,4,12,20,28,2,6,10,14,18,22,26,30", "Large valid BST"), f("16,8,24,4,12,20,28,2,6,10,18,14,22,26,30", "Large deep violation")],
  },
  "heap-top-k": {
    guided: [c("1,1,1,2,2,3|2", "Two most frequent values"), e("4,4,5,5,6|2", "Frequency tie", "Tie ordering"), c("7,8,8,9,9,9|1", "Single top value"), c("2,2,3,3,3,4|2", "Clear ranking")],
    independent: [c("5,5,5,2,2,9|2", "Top two frequencies"), c("1,2,2,3,3,3|2", "Increasing frequencies"), c("8,8,7,7,6|2", "Tie uses value order"), c("-1,-1,-2,-3,-3,-3|2", "Negative values"), c("0,0,0,1,1,2|1", "Zero is most frequent"), c("4,5,5,6,6,6,7|3", "Top three values"), e("9|1", "One value"), e("2,1|2", "All values requested"), e("3,3,1,1|1", "Tie for one result"), e("0,-1,-1,0|2", "Mixed-sign tie"), f("1,1,1,2,2,2,3,3,4,4,4,4,5,6,6|4", "Many frequency buckets"), f("10,10,9,9,9,8,8,8,8,7,7,7,7,7,6,6|3", "Long ranked input")],
  },
  "all-subsets": {
    guided: [c("1,2,3", "Three decisions"), e("", "Empty set", "Empty input"), c("4,7,9,10", "Four decisions"), e("5", "One value", "Single decision")],
    independent: [c("1,2", "Two values"), c("1,2,3,4,5", "Five values"), c("-1,0,1", "Mixed values"), c("3,6,9,12", "Four distinct values"), c("2,4,6,8,10,12", "Six values"), c("7,8,9", "Three values"), e("42", "Single item"), e("-3,-2", "Two negative values"), e("0", "Single zero"), e("100,200", "Large item values"), f("1,2,3,4,5,6,7,8", "Eight decision levels"), f("9,8,7,6,5,4,3,2,1", "Nine decision levels")],
  },
  "graph-components": {
    guided: [c("0-1,1-2,3-4|5", "Two connected regions"), e("|3", "No edges", "Isolated nodes"), c("0-1,1-2,2-0|3", "Cycle is one component"), e("0-1|2", "Single edge", "Small graph")],
    independent: [c("0-1,2-3|4", "Two separate pairs"), c("0-1,1-2,2-3|4", "One chain"), c("0-1,0-2,3-4|5", "Branch and pair"), c("0-1,2-3,4-5|6", "Three components"), c("0-2,2-4,1-3|5", "Interleaved labels"), c("0-1,1-2,3-4,4-5,5-3|6", "Chain and cycle"), e("|1", "One isolated node"), e("|5", "Five isolated nodes"), e("0-0|1", "Self loop"), e("0-1,0-1|2", "Repeated edge"), f("0-1,1-2,2-3,3-4,5-6,6-7,7-8,8-9|10", "Two long chains"), f("0-1,0-2,0-3,0-4,5-6,5-7,5-8,5-9|10", "Two wide stars")],
  },
  "course-order": {
    guided: [c("2|1-0", "One prerequisite"), c("2|1-0,0-1", "Two-course cycle"), c("4|1-0,2-0,3-1,3-2", "Diamond dependencies"), e("1|", "One course", "No dependencies")],
    independent: [c("3|1-0,2-1", "Dependency chain"), c("3|1-0,2-1,0-2", "Three-course cycle"), c("4|1-0,2-0,3-2", "Branching DAG"), c("4|1-0,2-1,3-2", "Long DAG"), c("5|1-0,2-0,3-1,4-2", "Two branches"), c("5|1-0,2-1,3-2,1-3", "Deep back edge"), e("2|", "Two independent courses"), e("1|0-0", "Self dependency"), e("3|2-0", "Disconnected course"), e("4|1-0,1-0", "Repeated prerequisite"), f("8|1-0,2-1,3-2,4-3,5-4,6-5,7-6", "Long dependency chain"), f("8|1-0,2-0,3-1,4-1,5-2,6-2,7-3,7-4,7-5,7-6", "Wide dependency graph")],
  },
  "shortest-grid-route": {
    guided: [c("000/110/000", "Route around a wall"), e("010/111/000", "No route", "Blocked destination"), e("0", "Start is destination", "One-cell grid"), c("00/00", "Two equal shortest routes")],
    independent: [c("000/010/000", "Route around center"), c("0000/0110/0000", "Rectangular detour"), c("00/10/00", "Single turn"), c("000/001/000", "Lower detour"), c("000/100/000", "Upper detour"), c("000/010/010/000", "Long vertical wall"), e("1", "Blocked single cell"), e("01/00", "Blocked top-right"), e("00/11", "Blocked final row"), e("010/111/010", "Split grid"), f("00000/01110/00010/01010/00000", "Large winding grid"), f("000000/011110/000010/011010/000010/000000", "Long corridor grid")],
  },
  "merge-intervals": {
    guided: [c("1-3,2-6,8-10,15-18", "Overlapping middle intervals"), e("1-4,4-5", "Touching intervals", "Shared endpoint"), e("1-10,2-3", "Contained interval", "Containment"), c("5-7,1-2,2-4", "Unsorted intervals")],
    independent: [c("1-2,3-4", "Disjoint intervals"), c("2-5,1-3", "Overlapping unsorted pair"), c("1-5,2-6,7-9", "Chain then gap"), c("10-12,3-8,6-11", "Long overlap chain"), c("4-8,1-2,2-3", "Touching chain"), c("1-3,5-7,6-8", "One merged pair"), e("2-2", "Point interval"), e("1-1,1-2", "Point touches range"), e("3-5,3-5", "Duplicate intervals"), e("1-9,2-8,3-7", "Nested intervals"), f("1-2,2-3,3-4,4-5,5-6,6-7,7-8,8-9", "Long touching chain"), f("1-3,5-7,9-11,2-6,10-15,20-21,21-22", "Many mixed intervals")],
  },
  "dynamic-programming": {
    guided: [c("2,7,9,3,1", "Choose non-adjacent houses"), c("2,1,1,2", "Choose both ends"), e("", "No houses", "Empty input"), e("5", "One house", "Single value")],
    independent: [c("1,2,3,1", "Alternating choices"), c("2,5,1,3,6", "Best changes late"), c("4,1,2,7,5,3,1", "Several choices"), c("10,1,1,10", "Both ends"), c("3,8,4,9,2", "Competing middle values"), c("6,2,8,1,9", "Three selected houses"), e("0", "One zero value"), e("0,0", "Two zero values"), e("5,1", "Two values"), e("1,5", "Larger second value"), f("1,2,3,4,5,6,7,8,9,10", "Long increasing street"), f("10,1,10,1,10,1,10,1,10,1,10", "Long alternating street")],
  },
  "grid-paths": {
    guided: [c("3,7", "Three by seven grid"), c("3,2", "Small rectangle"), e("1,8", "One row", "Single dimension"), e("1,1", "Start is destination", "Smallest grid")],
    independent: [c("2,2", "Two by two grid"), c("4,4", "Square grid"), c("3,5", "Three by five grid"), c("5,3", "Rotated rectangle"), c("6,4", "Six by four grid"), c("4,7", "Four by seven grid"), e("1,10", "One long row"), e("9,1", "One long column"), e("2,1", "Two by one grid"), e("1,2", "One by two grid"), f("10,10", "Large square grid"), f("12,8", "Large rectangular grid")],
  },
  "unique-value-bits": {
    guided: [c("4,1,2,1,2", "Two cancelling pairs"), c("2,2,9", "Unique value last"), e("-3,4,4", "Negative unique value", "Signed integers"), e("0,5,5", "Zero is unique", "XOR identity")],
    independent: [c("7,3,7", "Unique value in the middle"), c("8,1,1,2,2", "Unique value first"), c("4,4,6,9,9", "Unique interior value"), c("10,3,5,3,5", "Larger unique value"), c("-1,2,2,3,3", "Negative unique value"), c("12,6,7,6,7", "Two paired values"), e("5", "Only one value"), e("0", "Single zero"), e("-8", "Single negative value"), e("0,0,11", "Zero pair"), f("1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8", "Many cancelling pairs"), f("-1,-2,-3,-4,-5,-1,-2,-3,-4,99,6,6,7,7", "Long mixed signed input")],
  },
};

function nums(value: string) {
  return value === "" ? [] : value.split(",").map(Number);
}

function splitPipe(raw: string) {
  const index = raw.indexOf("|");
  return index < 0 ? [raw, ""] as const : [raw.slice(0, index), raw.slice(index + 1)] as const;
}

function buildTree(raw: string) {
  type Node = { value: number; left: Node | null; right: Node | null };
  const values = raw.split(",");
  if (!values[0] || values[0] === "null") return null;
  const root: Node = { value: Number(values[0]), left: null, right: null };
  const queue = [root];
  let index = 1;
  while (queue.length && index < values.length) {
    const node = queue.shift()!;
    for (const side of ["left", "right"] as const) {
      const value = values[index++];
      if (value !== undefined && value !== "null") {
        node[side] = { value: Number(value), left: null, right: null };
        queue.push(node[side]!);
      }
    }
  }
  return root;
}

export function solveLessonReference(slug: LessonSlug, raw: string): string {
  if (slug === "array-scan") return String(Math.max(...nums(raw)));
  if (slug === "hashmap-two-sum") {
    const [left, targetText] = splitPipe(raw);
    const values = nums(left);
    const target = Number(targetText);
    const seen = new Map<number, number>();
    for (let index = 0; index < values.length; index++) {
      const prior = seen.get(target - values[index]);
      if (prior !== undefined) return `${prior},${index}`;
      seen.set(values[index], index);
    }
    return "";
  }
  if (slug === "two-pointers") {
    const [leftText, targetText] = splitPipe(raw);
    const values = nums(leftText);
    const target = Number(targetText);
    let left = 0;
    let right = values.length - 1;
    while (left < right) {
      const sum = values[left] + values[right];
      if (sum === target) return `${left},${right}`;
      if (sum < target) left++; else right--;
    }
    return "";
  }
  if (slug === "prefix-sums") {
    const [valuesText, rangeText] = splitPipe(raw);
    const values = nums(valuesText);
    const [left, right] = nums(rangeText);
    return String(values.slice(left, right + 1).reduce((sum, value) => sum + value, 0));
  }
  if (slug === "minimum-window") {
    const [valuesText, targetText] = splitPipe(raw);
    const values = nums(valuesText);
    const target = Number(targetText);
    let left = 0;
    let total = 0;
    let best = Infinity;
    for (let right = 0; right < values.length; right++) {
      total += values[right];
      while (total >= target) {
        best = Math.min(best, right - left + 1);
        total -= values[left++];
      }
    }
    return String(Number.isFinite(best) ? best : 0);
  }
  if (slug === "stack-matching") {
    const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    const stack: string[] = [];
    for (const symbol of raw) {
      if (!(symbol in pairs)) stack.push(symbol);
      else if (stack.pop() !== pairs[symbol]) return "false";
    }
    return String(stack.length === 0);
  }
  if (slug === "binary-search") {
    const [valuesText, targetText] = splitPipe(raw);
    const values = nums(valuesText);
    const target = Number(targetText);
    let left = 0;
    let right = values.length - 1;
    while (left <= right) {
      const middle = left + Math.floor((right - left) / 2);
      if (values[middle] === target) return String(middle);
      if (values[middle] < target) left = middle + 1; else right = middle - 1;
    }
    return "-1";
  }
  if (slug === "copy-with-intent") return splitPipe(raw)[0];
  if (slug === "recursive-factorial") {
    let answer = 1;
    for (let value = 2; value <= Number(raw); value++) answer *= value;
    return String(answer);
  }
  if (slug === "tree-levels") {
    const root = buildTree(raw);
    if (!root) return "";
    const queue = [root];
    const levels: string[] = [];
    while (queue.length) {
      const size = queue.length;
      const level: number[] = [];
      for (let index = 0; index < size; index++) {
        const node = queue.shift()!;
        level.push(node.value);
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }
      levels.push(level.join(","));
    }
    return levels.join("|");
  }
  if (slug === "bst-validation") {
    const root = buildTree(raw);
    function valid(node: ReturnType<typeof buildTree>, low: number, high: number): boolean {
      return !node || (node.value > low && node.value < high && valid(node.left, low, node.value) && valid(node.right, node.value, high));
    }
    return String(valid(root, -Infinity, Infinity));
  }
  if (slug === "heap-top-k") {
    const [valuesText, kText] = splitPipe(raw);
    const counts = new Map<number, number>();
    for (const value of nums(valuesText)) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, Number(kText)).map(([value]) => value).join(",");
  }
  if (slug === "all-subsets") return String(2 ** nums(raw).length);
  if (slug === "graph-components") {
    const [edgesText, countText] = splitPipe(raw);
    const count = Number(countText);
    const graph = Array.from({ length: count }, () => [] as number[]);
    if (edgesText) for (const edge of edgesText.split(",")) {
      const [a, b] = edge.split("-").map(Number);
      graph[a].push(b);
      graph[b].push(a);
    }
    const seen = new Set<number>();
    let components = 0;
    for (let start = 0; start < count; start++) {
      if (seen.has(start)) continue;
      components++;
      const stack = [start];
      seen.add(start);
      while (stack.length) for (const next of graph[stack.pop()!]) if (!seen.has(next)) { seen.add(next); stack.push(next); }
    }
    return String(components);
  }
  if (slug === "course-order") {
    const [countText, edgesText] = splitPipe(raw);
    const count = Number(countText);
    const graph = Array.from({ length: count }, () => [] as number[]);
    const indegree = Array(count).fill(0) as number[];
    if (edgesText) for (const edge of edgesText.split(",")) {
      const [course, prerequisite] = edge.split("-").map(Number);
      graph[prerequisite].push(course);
      indegree[course]++;
    }
    const queue = indegree.flatMap((degree, index) => degree === 0 ? [index] : []);
    let taken = 0;
    while (queue.length) {
      const course = queue.shift()!;
      taken++;
      for (const next of graph[course]) if (--indegree[next] === 0) queue.push(next);
    }
    return String(taken === count);
  }
  if (slug === "shortest-grid-route") {
    const grid = raw.split("/").map((row) => [...row].map(Number));
    if (grid[0]?.[0] !== 0 || grid.at(-1)?.at(-1) !== 0) return "-1";
    const queue: Array<[number, number, number]> = [[0, 0, 0]];
    const seen = new Set(["0,0"]);
    while (queue.length) {
      const [row, column, distance] = queue.shift()!;
      if (row === grid.length - 1 && column === grid[0].length - 1) return String(distance);
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = row + dr;
        const nc = column + dc;
        const key = `${nr},${nc}`;
        if (grid[nr]?.[nc] === 0 && !seen.has(key)) { seen.add(key); queue.push([nr, nc, distance + 1]); }
      }
    }
    return "-1";
  }
  if (slug === "merge-intervals") {
    const intervals = raw.split(",").map((value) => value.split("-").map(Number) as [number, number]).sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const interval of intervals) {
      const last = merged.at(-1);
      if (!last || interval[0] > last[1]) merged.push([...interval]);
      else last[1] = Math.max(last[1], interval[1]);
    }
    return merged.map((value) => value.join("-")).join(",");
  }
  if (slug === "dynamic-programming") {
    let previous = 0;
    let current = 0;
    for (const value of nums(raw)) [previous, current] = [current, Math.max(current, previous + value)];
    return String(current);
  }
  if (slug === "grid-paths") {
    const [rows, columns] = nums(raw);
    const ways = Array(columns).fill(1) as number[];
    for (let row = 1; row < rows; row++) for (let column = 1; column < columns; column++) ways[column] += ways[column - 1];
    return String(ways[columns - 1]);
  }
  let answer = 0;
  for (const value of nums(raw)) answer ^= value;
  return String(answer);
}

function correctionFor(slug: LessonSlug, group: AssessmentGroup) {
  const lesson = learningLesson(slug);
  if (group === EDGE) return lesson.hints[0];
  if (group === FAST) return `${lesson.complexity} Avoid restarting work for every input position.`;
  return `${lesson.hints[1]} ${lesson.hints[2]}`;
}

function materialize(slug: LessonSlug, mode: "guided" | "independent", cases: CaseInput[]): LessonTestCase[] {
  return cases.map((item, index) => ({
    ...item,
    id: `${slug}-${mode}-${index + 1}`,
    expected: solveLessonReference(slug, item.input),
    correction: correctionFor(slug, item.group),
  }));
}

export function guidedLessonCases(slug: LessonSlug) {
  return materialize(slug, "guided", inputs[slug].guided);
}

export function independentLessonPool(slug: LessonSlug) {
  return materialize(slug, "independent", inputs[slug].independent);
}

function seededValue(seed: string) {
  let value = 2166136261;
  for (const character of seed) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

function pick(cases: LessonTestCase[], count: number, seed: string) {
  return [...cases]
    .map((item) => ({ item, rank: seededValue(`${seed}:${item.id}`) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map(({ item }) => item);
}

export function selectIndependentCases(slug: LessonSlug, seed: string) {
  const pool = independentLessonPool(slug);
  return [
    ...pick(pool.filter((item) => item.group === CORRECT), 4, `${seed}:correct`),
    ...pick(pool.filter((item) => item.group === EDGE), 3, `${seed}:edge`),
    ...pick(pool.filter((item) => item.group === FAST), 1, `${seed}:fast`),
  ];
}
