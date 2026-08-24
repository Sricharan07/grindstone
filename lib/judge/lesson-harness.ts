import "server-only";
import { LESSON_SLUGS, type LessonSlug } from "@/lib/learning/catalog";
import type { Language } from "./types";

const hiddenCases: Record<LessonSlug, Array<[string, string]>> = {
  "array-scan": [["-3,7,2", "7"], ["-8,-2,-5", "-2"], ["9", "9"]],
  "hashmap-two-sum": [["2,7,11,15|9", "0,1"], ["3,3|6", "0,1"], ["-3,4,3,90|0", "0,2"]],
  "two-pointers": [["1,2,3,4,6|6", "1,3"], ["2,3,4|6", "0,2"], ["-4,-1,0,3,9|8", "1,4"]],
  "prefix-sums": [["1,2,3,4|1,3", "9"], ["5,-2,7|0,1", "3"], ["4,8,-3,2|2,2", "-3"]],
  "minimum-window": [["2,3,1,2,4,3|7", "2"], ["1,1,1|5", "0"], ["1,4,4|4", "1"]],
  "stack-matching": [["([]{})", "true"], ["([)]", "false"], ["", "true"], ["((", "false"]],
  "binary-search": [["1,3,5,7|5", "2"], ["1,3,5,7|4", "-1"], ["-5,0,2,9|9", "3"]],
  "copy-with-intent": [["72,81|94", "72,81"], ["5|8", "5"], ["-1,0,3|7", "-1,0,3"]],
  "recursive-factorial": [["5", "120"], ["0", "1"], ["8", "40320"]],
  "tree-levels": [["3,9,20,null,null,15,7", "3|9,20|15,7"], ["1", "1"], ["1,2,3,4,null,null,5", "1|2,3|4,5"]],
  "bst-validation": [["2,1,3", "true"], ["5,1,6,null,null,3,7", "false"], ["5,4,6,null,null,3,7", "false"]],
  "heap-top-k": [["1,1,1,2,2,3|2", "1,2"], ["4,4,5,5,6|2", "4,5"], ["7,8,8,9,9,9|1", "9"]],
  "all-subsets": [["1,2,3", "8"], ["", "1"], ["4,7,9,10", "16"]],
  "graph-components": [["0-1,1-2,3-4|5", "2"], ["|3", "3"], ["0-1,1-2,2-0|3", "1"]],
  "course-order": [["2|1-0", "true"], ["2|1-0,0-1", "false"], ["4|1-0,2-0,3-1,3-2", "true"]],
  "shortest-grid-route": [["000/110/000", "4"], ["010/111/000", "-1"], ["0", "0"]],
  "merge-intervals": [["1-3,2-6,8-10,15-18", "1-6,8-10,15-18"], ["1-4,4-5", "1-5"], ["1-10,2-3", "1-10"]],
  "dynamic-programming": [["2,7,9,3,1", "12"], ["2,1,1,2", "4"], ["", "0"], ["5", "5"]],
  "grid-paths": [["3,7", "28"], ["3,2", "3"], ["1,8", "1"]],
  "unique-value-bits": [["4,1,2,1,2", "4"], ["2,2,9", "9"], ["-3,4,4", "-3"]],
};

export function isLessonSlug(value: string): value is LessonSlug {
  return (LESSON_SLUGS as readonly string[]).includes(value);
}
export function lessonCases(slug: LessonSlug) {
  return hiddenCases[slug].map(([input, output]) => ({ input, output }));
}

export function buildLessonHarness(language: Language, code: string, slug: LessonSlug) {
  const cases = hiddenCases[slug];
  if (language === "python") {
    return `${code}\n\ndef __grindstone_check():\n    cases = ${JSON.stringify(cases)}\n    for raw, expected in cases:\n        actual = str(solve(raw)).strip().lower()\n        if actual != expected.lower():\n            raise AssertionError(f"expected {expected}, received {actual}")\n    print(f"{len(cases)}/{len(cases)} tests passed")\n\n__grindstone_check()`;
  }

  const rows = cases.map(([input, output]) => `{${JSON.stringify(input)}, ${JSON.stringify(output)}}`).join(",");
  const main = `\n    public static void main(String[] args) {\n        String[][] cases = {${rows}};\n        for (int i = 0; i < cases.length; i++) {\n            String actual = String.valueOf(solve(cases[i][0])).trim().toLowerCase();\n            if (!actual.equals(cases[i][1].toLowerCase())) throw new AssertionError("case " + (i + 1) + " expected " + cases[i][1] + ", received " + actual);\n        }\n        System.out.println(cases.length + "/" + cases.length + " tests passed");\n    }\n`;
  const close = code.lastIndexOf("}");
  if (close < 0) throw new Error("Java lesson code must contain a Main class");
  return `${code.slice(0, close)}${main}}`;
}
