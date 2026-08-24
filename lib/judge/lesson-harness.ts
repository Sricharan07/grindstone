import "server-only";
import { LESSON_IDS, type LessonId } from "@/lib/content/lessons";
import type { Language } from "./types";

const hiddenCases: Record<LessonId, Array<[string, string]>> = {
  "copy-with-intent": [["72,81|94", "72,81"], ["5|8", "5"], ["-1,0,3|7", "-1,0,3"]],
  "array-scan": [["-3,7,2", "7"], ["-8,-2,-5", "-2"], ["9", "9"]],
  "hashmap-two-sum": [["2,7,11,15|9", "0,1"], ["3,3|6", "0,1"], ["-3,4,3,90|0", "0,2"]],
  "two-pointers": [["1,2,3,4,6|6", "1,3"], ["2,3,4|6", "0,2"], ["-4,-1,0,3,9|8", "1,4"]],
  "minimum-window": [["2,3,1,2,4,3|7", "2"], ["1,1,1|5", "0"], ["1,4,4|4", "1"]],
  "prefix-sums": [["1,2,3,4|1,3", "9"], ["5,-2,7|0,1", "3"], ["4,8,-3,2|2,2", "-3"]],
  "binary-search": [["1,3,5,7|5", "2"], ["1,3,5,7|4", "-1"], ["-5,0,2,9|9", "3"]],
  "stack-matching": [["([]{})", "true"], ["([)]", "false"], ["", "true"], ["((", "false"]],
  "recursive-factorial": [["5", "120"], ["0", "1"], ["8", "40320"]],
  "graph-components": [["0-1,1-2,3-4|5", "2"], ["|3", "3"], ["0-1,1-2,2-0|3", "1"]],
  "heap-top-k": [["1,1,1,2,2,3|2", "1,2"], ["4,4,5,5,6|2", "4,5"], ["7,8,8,9,9,9|1", "9"]],
  "dynamic-programming": [["2,7,9,3,1", "12"], ["2,1,1,2", "4"], ["", "0"], ["5", "5"]],
};

export function isLessonId(value: string): value is LessonId {
  return (LESSON_IDS as readonly string[]).includes(value);
}

function javaString(value: string) {
  return JSON.stringify(value);
}

export function buildLessonHarness(language: Language, code: string, lessonId: LessonId) {
  const cases = hiddenCases[lessonId];
  if (language === "python") {
    return `${code}\n\ndef __grindstone_check():\n    cases = ${JSON.stringify(cases)}\n    for raw, expected in cases:\n        actual = str(solve(raw)).strip().lower()\n        if actual != expected.lower():\n            raise AssertionError(f"expected {expected}, received {actual}")\n    print(f"{len(cases)}/{len(cases)} tests passed")\n\n__grindstone_check()`;
  }
  if (language === "java") {
    const caseRows = cases.map(([input, output]) => `{${javaString(input)}, ${javaString(output)}}`).join(",");
    const main = `\n    public static void main(String[] args) {\n        String[][] cases = {${caseRows}};\n        for (int i = 0; i < cases.length; i++) {\n            String actual = String.valueOf(solve(cases[i][0])).trim().toLowerCase();\n            if (!actual.equals(cases[i][1].toLowerCase())) throw new AssertionError("case " + (i + 1) + " expected " + cases[i][1] + ", received " + actual);\n        }\n        System.out.println(cases.length + "/" + cases.length + " tests passed");\n    }\n`;
    const close = code.lastIndexOf("}");
    if (close < 0) throw new Error("Java lesson code must contain a Main class");
    return `${code.slice(0, close)}${main}}`;
  }
  const caseRows = cases.map(([input, output]) => `{${JSON.stringify(input)}, ${JSON.stringify(output)}}`).join(",");
  return `${code}\nint main() {\n    Solution solution;\n    vector<pair<string,string>> cases = {${caseRows}};\n    for (size_t i = 0; i < cases.size(); ++i) {\n        string actual = solution.solve(cases[i].first);\n        transform(actual.begin(), actual.end(), actual.begin(), ::tolower);\n        if (actual != cases[i].second) { cerr << "case " << (i + 1) << " expected " << cases[i].second << ", received " << actual; return 1; }\n    }\n    cout << cases.size() << "/" << cases.size() << " tests passed\\n";\n}`;
}
