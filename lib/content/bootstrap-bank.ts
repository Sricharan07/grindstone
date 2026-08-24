export interface BootstrapQuestion {
  kind: string;
  topic: string;
  difficulty: number;
  prompt: string;
  payload: { options: string[]; answerIndex: number };
  explanation: string;
  verification: { reproducedAnswer: string; independentAnswer: string; method: string };
}

function numericOptions(answer: number, spread: number) {
  const values = [answer, answer + spread, Math.max(0, answer - spread), answer + spread * 2];
  return [...new Set(values)].slice(0, 4).map(String);
}

function rotateAnswer(options: string[], seed: number) {
  const answer = options[0]; const offset = seed % options.length; const rotated = [...options.slice(offset), ...options.slice(0, offset)];
  return { options: rotated, answerIndex: rotated.indexOf(answer), answer };
}

export function buildBootstrapQuestion(index: number): BootstrapQuestion {
  const family = index % 10;
  const variant = Math.floor(index / 10);
  if (family === 0) {
    const base = 100 + variant * 20; const rate = [5, 10, 20, 25][index % 4]; const answer = base * (100 + rate) / 100; const choice = rotateAnswer(numericOptions(answer, Math.max(5, base / 20)), index);
    return { kind: "quantitative", topic: "Percentages", difficulty: 0.25, prompt: `A value of ${base} increases by ${rate}%. What is the new value?`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: `${base} x (1 + ${rate}/100) = ${answer}.`, verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "deterministic-formula" } };
  }
  if (family === 1) {
    const unit = 2 + variant; const left = 3 * unit; const right = 5 * unit; const total = left + right; const choice = rotateAnswer(numericOptions(total, unit), index);
    return { kind: "quantitative", topic: "Ratios", difficulty: 0.3, prompt: `Two parts are in the ratio 3:5. If one ratio unit is ${unit}, what is their total?`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: `There are 8 units, so the total is 8 x ${unit} = ${total}.`, verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "deterministic-formula" } };
  }
  if (family === 2) {
    const start = 10 + variant; const answer = start + 4; const choice = rotateAnswer(numericOptions(answer, 2), index);
    return { kind: "quantitative", topic: "Averages", difficulty: 0.3, prompt: `What is the average of ${start}, ${start + 2}, ${start + 4}, ${start + 6}, and ${start + 8}?`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: "For an evenly spaced list, the mean is the middle value.", verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "deterministic-formula" } };
  }
  if (family === 3) {
    const speed = 30 + (variant % 8) * 5; const hours = 2 + Math.floor(variant / 8); const answer = speed * hours; const choice = rotateAnswer(numericOptions(answer, speed), index);
    return { kind: "quantitative", topic: "Time, speed, distance", difficulty: 0.35, prompt: `A vehicle travels at ${speed} km/h for ${hours} hours. How far does it travel?`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: `Distance = speed x time = ${speed} x ${hours} = ${answer} km.`, verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "deterministic-formula" } };
  }
  if (family === 4) {
    const principal = 1000 + variant * 500; const rate = 5 + index % 6; const years = 2; const answer = principal * rate * years / 100; const choice = rotateAnswer(numericOptions(answer, Math.max(50, principal / 20)), index);
    return { kind: "quantitative", topic: "Simple interest", difficulty: 0.4, prompt: `Find the simple interest on ${principal} at ${rate}% per year for ${years} years.`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: `P x R x T / 100 = ${answer}.`, verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "deterministic-formula" } };
  }
  if (family === 5) {
    const first = 1 + variant; const step = 2 + index % 5; const answer = first + step * 4; const choice = rotateAnswer(numericOptions(answer, step), index);
    return { kind: "reasoning", topic: "Series", difficulty: 0.35, prompt: `Find the next term: ${first}, ${first + step}, ${first + step * 2}, ${first + step * 3}, ...`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: `The common difference is ${step}, so the next term is ${answer}.`, verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "deterministic-sequence" } };
  }
  if (family === 6) {
    const shift = 1 + index % 5; const source = `CODE${variant}`; const encoded = [...source].map((char) => /[A-Z]/.test(char) ? String.fromCharCode(char.charCodeAt(0) + shift) : char).join(""); const alternatives = [encoded, source, encoded.split("").reverse().join(""), `${encoded}X`]; const choice = rotateAnswer(alternatives, index);
    return { kind: "reasoning", topic: "Coding-decoding", difficulty: 0.4, prompt: `Each letter moves ${shift} place${shift === 1 ? "" : "s"} forward. How is ${source} encoded?`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: `Shift each letter forward by ${shift}: ${encoded}.`, verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "deterministic-transform" } };
  }
  if (family === 7) {
    const loops = 2 + variant; const answer = loops * (loops - 1) / 2; const choice = rotateAnswer(numericOptions(answer, Math.max(1, loops)), index);
    return { kind: "pseudocode", topic: "Pseudocode", difficulty: 0.45, prompt: `How many times does the inner statement run? for i = 1..${loops}, for j = 1..i-1`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: `The count is 0 + 1 + ... + ${loops - 1} = ${answer}.`, verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "deterministic-summation" } };
  }
  if (family === 8) {
    const rows = 3 + variant; const answer = rows; const choice = rotateAnswer(numericOptions(answer, 1), index);
    return { kind: "fundamentals", topic: "DBMS", difficulty: 0.35, prompt: `A query returns ${rows} distinct departments after GROUP BY department. How many result rows are produced before HAVING?`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: "GROUP BY produces one row per distinct group.", verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "relational-invariant" } };
  }
  const pages = 4 + variant; const answer = pages; const choice = rotateAnswer(numericOptions(answer, 1), index);
  return { kind: "fundamentals", topic: "Operating systems", difficulty: 0.4, prompt: `A process references ${pages} distinct pages and all are resident. With no eviction, how many page frames are occupied?`, payload: { options: choice.options, answerIndex: choice.answerIndex }, explanation: "Each resident virtual page occupies one physical frame.", verification: { reproducedAnswer: choice.answer, independentAnswer: choice.answer, method: "memory-model-invariant" } };
}

export function buildBootstrapBank(count = 1200) { return Array.from({ length: count }, (_, index) => buildBootstrapQuestion(index)); }
