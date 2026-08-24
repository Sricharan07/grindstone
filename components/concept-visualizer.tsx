"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "@/components/icons";
import type { LessonSlug } from "@/lib/learning/catalog";
import { cn } from "@/lib/utils";

interface VisualStep {
  title: string;
  note: string;
  active?: number;
  left?: number;
  right?: number;
  values?: Array<string | number>;
  secondary?: Array<string | number>;
  labels?: string[];
}

const baseSteps: Partial<Record<LessonSlug, VisualStep[]>> = {
  "array-scan": [
    { title: "Initialize from real data", note: "best starts at -3, not zero.", active: 0, values: [-3, 7, 2], secondary: [-3] },
    { title: "Inspect 7", note: "7 is larger, so best becomes 7.", active: 1, values: [-3, 7, 2], secondary: [7] },
    { title: "Inspect 2", note: "2 cannot replace 7. The prefix invariant still holds.", active: 2, values: [-3, 7, 2], secondary: [7] },
  ],
  "hashmap-two-sum": [
    { title: "Read 2", note: "Need 7. It is not stored yet, so store 2 -> 0.", active: 0, values: [2, 7, 11, 15], secondary: ["2 -> 0"] },
    { title: "Read 7", note: "Need 2. The map returns index 0 immediately.", active: 1, values: [2, 7, 11, 15], secondary: ["2 -> 0"] },
    { title: "Return the indexes", note: "The earlier index is 0 and the current index is 1.", left: 0, right: 1, values: [2, 7, 11, 15], secondary: ["0, 1"] },
  ],
  "two-pointers": [
    { title: "Start at both ends", note: "1 + 6 is too large for target 6.", left: 0, right: 4, values: [1, 2, 3, 4, 6] },
    { title: "Move the right pointer", note: "1 + 4 is too small, so the current left value can be discarded.", left: 0, right: 3, values: [1, 2, 3, 4, 6] },
    { title: "Move left and match", note: "2 + 4 equals 6.", left: 1, right: 3, values: [1, 2, 3, 4, 6] },
  ],
  "prefix-sums": [
    { title: "Build with a leading zero", note: "Each prefix is the total before its aligned input position.", active: 0, values: [1, 2, 3, 4], secondary: [0, 1, 3, 6, 10] },
    { title: "Choose range 1 through 3", note: "The range ends at prefix index 4 and starts at prefix index 1.", left: 1, right: 4, values: [0, 1, 3, 6, 10], secondary: ["10 - 1"] },
    { title: "Subtract two snapshots", note: "10 - 1 gives the range total 9.", values: [0, 1, 3, 6, 10], secondary: [9] },
  ],
  "minimum-window": [
    { title: "Grow until valid", note: "2 + 3 + 1 + 2 reaches target 7.", left: 0, right: 3, values: [2, 3, 1, 2, 4, 3], secondary: [8] },
    { title: "Shrink while valid", note: "Removing 2 leaves 6, so that shrink went too far.", left: 1, right: 3, values: [2, 3, 1, 2, 4, 3], secondary: [6] },
    { title: "Find the best window", note: "The final [4, 3] window has length 2.", left: 4, right: 5, values: [2, 3, 1, 2, 4, 3], secondary: [7, "best = 2"] },
  ],
  "stack-matching": [
    { title: "Push openings", note: "The stack remembers the only opening allowed to close next.", active: 2, values: ["(", "[", "{", "}", "]", ")"], secondary: ["(", "[", "{"] },
    { title: "Match the top", note: "} matches {. Pop exactly one opening.", active: 3, values: ["(", "[", "{", "}", "]", ")"], secondary: ["(", "["] },
    { title: "Finish empty", note: "Every close matched the latest opening, so the stack is empty.", active: 5, values: ["(", "[", "{", "}", "]", ")"], secondary: ["empty"] },
  ],
  "binary-search": [
    { title: "Inspect the midpoint", note: "5 is below target 7, so discard it and everything left of it.", left: 0, right: 4, active: 2, values: [1, 3, 5, 7, 9] },
    { title: "Keep the possible half", note: "The target must be inside indexes 3 through 4.", left: 3, right: 4, active: 3, values: [1, 3, 5, 7, 9] },
    { title: "Match", note: "Index 3 contains 7.", left: 3, right: 3, active: 3, values: [1, 3, 5, 7, 9] },
  ],
  "copy-with-intent": [
    { title: "Assignment aliases", note: "scores and backup both point to list A.", values: ["scores -> A", "backup -> A"], secondary: ["A: [72, 81]"] },
    { title: "Copy the outer list", note: "backup now points to an independent list B.", values: ["scores -> A", "backup -> B"], secondary: ["A: [72, 81]", "B: [72, 81]"] },
    { title: "Mutate scores", note: "Only list A receives 94. B remains unchanged.", values: ["scores -> A", "backup -> B"], secondary: ["A: [72, 81, 94]", "B: [72, 81]"] },
  ],
  "recursive-factorial": [
    { title: "Call smaller problems", note: "Each frame waits for the answer below it.", values: ["factorial(4)", "factorial(3)", "factorial(2)", "factorial(1)"] },
    { title: "Reach the base case", note: "factorial(0) returns 1 directly.", values: ["factorial(2)", "factorial(1)", "factorial(0) = 1"] },
    { title: "Combine while returning", note: "1, 2, 6, then 24 travel back up the stack.", values: ["1 x 1 = 1", "2 x 1 = 2", "3 x 2 = 6", "4 x 6 = 24"] },
  ],
  "tree-levels": [
    { title: "Queue the root", note: "The current level contains one node.", active: 0, values: [3, 9, 20, 15, 7], labels: ["root", "left", "right", "left-right", "right-right"] },
    { title: "Process the second level", note: "Capture queue size 2 before adding children.", left: 1, right: 2, values: [3, 9, 20, 15, 7] },
    { title: "Process the third level", note: "15 and 7 form the final level.", left: 3, right: 4, values: [3, 9, 20, 15, 7] },
  ],
  "bst-validation": [
    { title: "Start with open bounds", note: "Root 5 may use the full number line.", active: 0, values: [5, 1, 6, 3, 7], secondary: ["-inf < 5 < +inf"] },
    { title: "Inherit the root bound", note: "Every node in the right subtree must stay above 5.", active: 2, values: [5, 1, 6, 3, 7], secondary: ["5 < 6 < +inf"] },
    { title: "Reject the deep violation", note: "3 is below its inherited lower bound 5.", active: 3, values: [5, 1, 6, 3, 7], secondary: ["5 < 3 is false"] },
  ],
  "heap-top-k": [
    { title: "Count frequencies", note: "Selection starts only after each candidate has a count.", values: ["1 -> 3", "2 -> 2", "3 -> 1"] },
    { title: "Build priority", note: "The root exposes the next highest-frequency value.", active: 0, values: ["1 x3", "2 x2", "3 x1"] },
    { title: "Take exactly k", note: "For k = 2, return 1 then 2.", left: 0, right: 1, values: ["1 x3", "2 x2", "3 x1"] },
  ],
  "all-subsets": [
    { title: "Choose 1", note: "The include branch adds 1 to the current path.", values: ["[]", "[1]"], secondary: ["next: 2"] },
    { title: "Choose 2", note: "The path [1, 2] becomes one leaf before returning.", values: ["[]", "[1]", "[1, 2]"] },
    { title: "Undo before the sibling", note: "Pop 2, then explore the branch that excludes it.", values: ["[1, 2]", "pop 2", "[1]"] },
  ],
  "graph-components": [
    { title: "Start at node 0", note: "One traversal reaches 0, 1, and 2.", left: 0, right: 2, values: [0, 1, 2, 3, 4] },
    { title: "Choose the next unvisited node", note: "Node 3 starts the second component.", left: 3, right: 4, values: [0, 1, 2, 3, 4] },
    { title: "Count two components", note: "Every node belongs to exactly one completed traversal.", values: ["{0,1,2}", "{3,4}"], secondary: ["count = 2"] },
  ],
  "course-order": [
    { title: "Count prerequisites", note: "Only course 0 has zero incoming requirements.", active: 0, values: ["0:0", "1:1", "2:1", "3:2"] },
    { title: "Remove completed edges", note: "Completing 0 makes courses 1 and 2 available.", left: 1, right: 2, values: ["0 done", "1:0", "2:0", "3:2"] },
    { title: "Finish the order", note: "After 1 and 2, course 3 reaches indegree zero.", active: 3, values: [0, 1, 2, 3], secondary: ["order complete"] },
  ],
  "shortest-grid-route": [
    { title: "Distance zero", note: "The start is the only cell in the first layer.", values: [0, -1, -1, 1, 1, -1, -1, -1, -1], active: 0 },
    { title: "Expand equal-distance layers", note: "Every queued neighbor is exactly one move farther.", values: [0, 1, 2, 1, 1, 3, 6, 5, 4], active: 5 },
    { title: "First arrival is shortest", note: "The target is reached in four moves.", values: [0, 1, 2, 1, 1, 3, 6, 5, 4], active: 8, secondary: ["distance = 4"] },
  ],
  "merge-intervals": [
    { title: "Sort by start", note: "The next possible overlap is now adjacent.", values: ["1-3", "2-6", "8-10", "15-18"] },
    { title: "Extend the last result", note: "2 begins before 3 ends, so 1-3 becomes 1-6.", left: 0, right: 1, values: ["1-3", "2-6", "8-10", "15-18"], secondary: ["1-6"] },
    { title: "Append separated ranges", note: "8 starts after 6, so it begins a new result interval.", values: ["1-6", "8-10", "15-18"], secondary: ["merged"] },
  ],
  "dynamic-programming": [
    { title: "Name the state", note: "current is the best non-adjacent sum in the prefix.", active: 0, values: [2, 7, 9, 3, 1], secondary: ["previous = 0", "current = 0"] },
    { title: "Compare take and skip", note: "At 9, take gives 2 + 9 = 11; skip gives 7.", active: 2, values: [2, 7, 9, 3, 1], secondary: ["take = 11", "skip = 7"] },
    { title: "Roll the two states", note: "The final best result is 12.", active: 4, values: [2, 7, 9, 3, 1], secondary: ["best = 12"] },
  ],
  "grid-paths": [
    { title: "Initialize one boundary", note: "Every top-row cell has one route from the start.", values: [1, 1, 1, 1, 0, 0, 1, 0, 0] },
    { title: "Add top and left", note: "Each interior cell sums the two ways of entering it.", active: 4, values: [1, 1, 1, 1, 2, 3, 1, 3, 6] },
    { title: "Read the destination", note: "A 3 by 3 grid has six right-and-down routes.", active: 8, values: [1, 1, 1, 1, 2, 3, 1, 3, 6] },
  ],
  "unique-value-bits": [
    { title: "Start from zero", note: "Zero is the identity for XOR.", active: 0, values: [4, 1, 2, 1, 2], secondary: ["000 XOR 100 = 100"] },
    { title: "Let equal pairs cancel", note: "The two 1 values and two 2 values toggle themselves off.", left: 1, right: 4, values: [4, 1, 2, 1, 2], secondary: ["001 XOR 001 = 000", "010 XOR 010 = 000"] },
    { title: "Keep the unmatched value", note: "Only the bit pattern for 4 remains.", active: 0, values: [4, 1, 2, 1, 2], secondary: ["unique = 4"] },
  ],
};

function Cells({ step, grid = false }: { step: VisualStep; grid?: boolean }) {
  return (
    <div className={cn("visual-cells", grid && "visual-cells--grid")}>
      {(step.values ?? []).map((value, index) => {
        const ranged = step.left !== undefined && step.right !== undefined && index >= step.left && index <= step.right;
        return <span key={`${value}-${index}`} className={cn(index === step.active && "is-active", ranged && "is-ranged", value === -1 && "is-blocked", value === 1 && grid && "is-wall")}>{value === -1 ? "" : value}</span>;
      })}
    </div>
  );
}

export function ConceptVisualizer({ slug }: { slug: LessonSlug }) {
  const steps = useMemo(() => baseSteps[slug] ?? baseSteps["array-scan"]!, [slug]);
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isGrid = slug === "shortest-grid-route" || slug === "grid-paths";
  const isStack = slug === "stack-matching" || slug === "recursive-factorial";

  return (
    <section className={cn("concept-visualizer", isStack && "concept-visualizer--stack")} aria-labelledby="visual-step-title">
      <header>
        <div><span>Step {index + 1} of {steps.length}</span><h3 id="visual-step-title">{step.title}</h3></div>
        <div className="visual-controls">
          <button type="button" className="icon-button" title="Restart visualization" aria-label="Restart visualization" disabled={index === 0} onClick={() => setIndex(0)}><RotateCcw size={16} /></button>
          <button type="button" className="icon-button" title="Previous step" aria-label="Previous visualization step" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}><ArrowLeft size={16} /></button>
          <button type="button" className="icon-button" title="Next step" aria-label="Next visualization step" disabled={index === steps.length - 1} onClick={() => setIndex((value) => Math.min(steps.length - 1, value + 1))}><ArrowRight size={16} /></button>
        </div>
      </header>
      <div className={cn("visual-stage", isGrid && "visual-stage--grid")}>
        <Cells step={step} grid={isGrid} />
        {step.secondary?.length ? <div className="visual-secondary">{step.secondary.map((value, valueIndex) => <span key={`${value}-${valueIndex}`}>{value}</span>)}</div> : null}
      </div>
      <p>{step.note}</p>
      <div className="visual-stepper" aria-hidden="true">{steps.map((_, stepIndex) => <span key={stepIndex} className={cn(stepIndex <= index && "is-active")} />)}</div>
    </section>
  );
}

