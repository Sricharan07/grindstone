"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Code2, RotateCcw, X } from "@/components/icons";
import { cn } from "@/lib/utils";

const solution = [
  "left = 0",
  "for right, value in enumerate(nums):",
  "    total += value",
  "    while total >= target:",
  "        best = min(best, right - left + 1)",
  "        total -= nums[left]",
  "        left += 1",
];

const initialBlocks = [solution[1], solution[0], solution[3], "    best = right - left", solution[2], solution[5], solution[4], solution[6]];

export function LearningMechanisms({ mastery }: { mastery: number }) {
  const [mode, setMode] = useState<"parsons" | "fading">("parsons");
  const [blocks, setBlocks] = useState(initialBlocks);
  const [checked, setChecked] = useState(false);
  const [dragged, setDragged] = useState<number | null>(null);
  const fadeLevel = mastery >= 0.78 ? 3 : mastery >= 0.58 ? 2 : mastery >= 0.38 ? 1 : 0;
  const correct = blocks.length === solution.length && blocks.every((block, index) => block === solution[index]);
  const fadedLines = useMemo(() => solution.map((line, index) => fadeLevel > 0 && index >= solution.length - fadeLevel ? "____" : line), [fadeLevel]);

  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setChecked(false);
  }

  function dropAt(index: number) {
    if (dragged === null || dragged === index) return;
    setBlocks((current) => {
      const next = [...current];
      const [item] = next.splice(dragged, 1);
      next.splice(index, 0, item);
      return next;
    });
    setDragged(null);
    setChecked(false);
  }

  return (
    <section className="learning-mechanisms" aria-labelledby="transfer-title">
      <div className="section-heading-row">
        <div><span className="context-line">Transfer lab</span><h3 id="transfer-title">Build it without the finished example.</h3></div>
        <div className="segmented" aria-label="Transfer exercise mode">
          <button type="button" className={cn(mode === "parsons" && "segmented__active")} onClick={() => setMode("parsons")}>Parsons</button>
          <button type="button" className={cn(mode === "fading" && "segmented__active")} onClick={() => setMode("fading")}>Faded example</button>
        </div>
      </div>

      {mode === "parsons" ? (
        <div className="parsons-workspace">
          <div><p>Order the minimum-window algorithm. One block is a distractor.</p><small>Drag blocks or use the arrow controls.</small></div>
          <ol className="parsons-list">
            {blocks.map((block, index) => (
              <li key={`${block}-${index}`} draggable onDragStart={() => setDragged(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropAt(index)}>
                <span>{index + 1}</span><code>{block}</code>
                <button type="button" className="icon-button" aria-label={`Move line ${index + 1} up`} onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
                <button type="button" className="icon-button" aria-label={`Move line ${index + 1} down`} onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
                <button type="button" className="icon-button" aria-label={`Remove line ${index + 1}`} onClick={() => { setBlocks((current) => current.filter((_, itemIndex) => itemIndex !== index)); setChecked(false); }}><X size={15} /></button>
              </li>
            ))}
          </ol>
          <div className="transfer-actions">
            <button type="button" className="button button--quiet" onClick={() => { setBlocks(initialBlocks); setChecked(false); }}><RotateCcw size={16} /> Reset</button>
            <button type="button" className="button button--primary" onClick={() => setChecked(true)}><Check size={16} /> Check order</button>
          </div>
          {checked && <div className={cn("feedback-box", correct ? "feedback-box--success" : "feedback-box--warning")}><strong>{correct ? "Structure is correct." : "The invariant breaks in this order."}</strong><p>{correct ? "The window expands once per right pointer and contracts only while valid." : "Remove the distractor, then make sure total changes before the validity check."}</p></div>}
        </div>
      ) : (
        <div className="fading-workspace">
          <div className="fade-meter"><Code2 size={18} /><span><strong>Fade level {fadeLevel}</strong><small>Driven by observed mastery: {Math.round(mastery * 100)}%</small></span></div>
          <pre>{fadedLines.map((line, index) => <code key={`${line}-${index}`}><span>{index + 1}</span>{line}</code>)}</pre>
          <p>{fadeLevel === 0 ? "Full scaffolding remains until the first clean retrieval." : `${fadeLevel} final step${fadeLevel === 1 ? "" : "s"} removed. Reconstruct them before checking the reference.`}</p>
        </div>
      )}
    </section>
  );
}
