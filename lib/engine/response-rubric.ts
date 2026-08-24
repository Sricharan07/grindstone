export type ResponseRubric = "behavioral" | "communication" | "coding_communication" | "codebase" | "system_design" | "ai_fluency" | "lld" | "teach_back";

const rules: Record<ResponseRubric, Array<{ label: string; pattern: RegExp }>> = {
  behavioral: [
    { label: "personal ownership", pattern: /\bI\b/i },
    { label: "specific action", pattern: /\b(built|changed|created|led|implemented|decided|reduced|resolved|shipped|tested)\b/i },
    { label: "measured result", pattern: /\b\d+(?:\.\d+)?\s*(?:%|percent|hours?|days?|users?|requests?|dollars?)?\b/i },
    { label: "reflection", pattern: /\b(learned|changed|since then|next time|would now)\b/i },
    { label: "conflict or failure named", pattern: /\b(fail|missed|conflict|mistake|risk|blocked|disagree)\w*\b/i },
  ],
  communication: [
    { label: "position framed", pattern: /\b(position|argue|depends|define|frame|claim)\b/i },
    { label: "counterpoint", pattern: /\b(however|although|counterpoint|on the other hand|while)\b/i },
    { label: "concrete evidence", pattern: /\b(example|evidence|study|data|because|for instance)\b/i },
    { label: "invites others", pattern: /\b(what do you think|invite|build on|hear from|your view)\b/i },
    { label: "synthesis", pattern: /\b(in summary|therefore|overall|synthesize|common ground)\b/i },
  ],
  coding_communication: [
    { label: "approach stated", pattern: /\b(approach|scan|iterate|traverse|use|build)\w*\b/i },
    { label: "data structure or invariant", pattern: /\b(map|set|hash|stack|queue|window|invariant|complement)\w*\b/i },
    { label: "complexity named", pattern: /\bo\([^)]+\)|\blinear\b|\bconstant space\b/i },
    { label: "edge case", pattern: /\b(edge|empty|duplicate|negative|boundary|test case)\w*\b/i },
    { label: "tradeoff or correctness", pattern: /\b(tradeoff|correct|because|ensures|guarantee|instead)\w*\b/i },
  ],
  codebase: [
    { label: "reproduction", pattern: /\b(reproduce|failing test|request|input)\b/i },
    { label: "error evidence", pattern: /\b(stack|log|error|trace|diff)\b/i },
    { label: "localization", pattern: /\b(bisect|localize|boundary|module|commit|breakpoint)\b/i },
    { label: "testable hypothesis", pattern: /\b(hypothesis|because|suspect|predict)\b/i },
    { label: "single change and verification", pattern: /\b(one change|smallest|verify|regression test|hidden test)\b/i },
  ],
  system_design: [
    { label: "requirements", pattern: /\b(requirement|scope|user|latency|availability)\b/i },
    { label: "estimates", pattern: /\b(qps|rps|traffic|storage|bandwidth|million|billion|gb|tb)\b/i },
    { label: "interface and data", pattern: /\b(api|endpoint|schema|table|key|model)\b/i },
    { label: "failure handling", pattern: /\b(fail|retry|timeout|backpressure|outage|idempoten|replica)\w*\b/i },
    { label: "tradeoff", pattern: /\b(tradeoff|instead|versus|consistency|availability|cost)\b/i },
  ],
  ai_fluency: [
    { label: "constraints requested", pattern: /\b(constraint|preserve|require)\w*\b/i },
    { label: "complexity requested", pattern: /\bcomplexity|o\([^)]+\)/i },
    { label: "tests requested", pattern: /\b(test|edge case|adversarial)\w*\b/i },
    { label: "nested-range defect identified", pattern: /\b(max|larger|nested|contained|containment)\b/i },
    { label: "adversarial containment case", pattern: /(?:1\s*,\s*10|\[1\s*,\s*10\])[\s\S]*(?:2\s*,\s*3|\[2\s*,\s*3\])/i },
  ],
  lld: [
    { label: "public contract", pattern: /\b(command|query|api|method|input|output|return)\w*\b/i },
    { label: "invariants and errors", pattern: /\b(invariant|invalid|error|exception|reject|must|cannot)\w*\b/i },
    { label: "owned responsibilities", pattern: /\b(owns|responsib|entity|service|repository|class)\w*\b/i },
    { label: "change or concurrency pressure", pattern: /\b(race|concurr|thread|lock|change|extend|new requirement)\w*\b/i },
    { label: "behavioral tests", pattern: /\b(test|assert|happy path|edge case|invalid transition)\w*\b/i },
  ],
  teach_back: [
    { label: "shared object", pattern: /\b(same|shared|one)\s+(?:list|object)|\balias\w*\b/i },
    { label: "references", pattern: /\b(reference|point|address)\w*\b/i },
    { label: "mutation", pattern: /\b(mutat|append|in place|change the list)\w*\b/i },
    { label: "assignment semantics", pattern: /\bassign\w*\b[\s\S]{0,50}\b(cop|reference|point)\w*\b/i },
    { label: "independent copy", pattern: /\.copy\(|\bslic\w*\b|\bcopy the list\b/i },
  ],
};

export function gradeResponse(kind: ResponseRubric, response: string) {
  const dimensions = rules[kind].map((rule) => ({ label: rule.label, met: rule.pattern.test(response) }));
  const evidenceScore = dimensions.filter((item) => item.met).length / dimensions.length;
  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;
  const depthFactor = Math.min(1, wordCount / (kind === "system_design" || kind === "lld" ? 80 : 45));
  const score = Math.round((evidenceScore * 0.8 + depthFactor * 0.2) * 100);
  return {
    score,
    dimensions,
    wordCount,
    feedback: dimensions.filter((item) => !item.met).map((item) => item.label),
  };
}
