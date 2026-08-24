export interface AptitudeItem {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: number;
  targetSeconds: number;
}

type Family = "percentage" | "ratio" | "average" | "speed" | "sequence" | "syllogism" | "direction" | "probability" | "critical" | "data" | "sufficiency" | "reading" | "assumption" | "verbal" | "sql";

function rotate(correct: string, distractors: string[], seed: number) {
  const values = [correct, ...distractors.filter((value) => value !== correct)].slice(0, 4);
  const offset = seed % values.length;
  const options = [...values.slice(offset), ...values.slice(0, offset)];
  return { options, answerIndex: options.indexOf(correct) };
}

function numeric(answer: number, spread: number, seed: number) {
  return rotate(String(answer), [String(answer + spread), String(Math.max(0, answer - spread)), String(answer + spread * 2)], seed);
}

function gcd(left: number, right: number): number { return right ? gcd(right, left % right) : left; }

function buildFamily(family: Family, variant: number, seed: number): Omit<AptitudeItem, "id"> {
  if (family === "percentage") {
    const base = 100 + variant * 20; const rate = [5, 10, 20, 25][variant % 4]; const answer = base * (100 + rate) / 100; const choice = numeric(answer, Math.max(5, base / 20), seed);
    return { topic: "Percentages", prompt: `A service processes ${base} requests and volume increases by ${rate}%. What is the new request count?`, ...choice, explanation: `Multiply ${base} by 1 + ${rate}/100 to get ${answer}.`, difficulty: 0.3, targetSeconds: 60 };
  }
  if (family === "ratio") {
    const unit = 2 + variant; const answer = unit * 8; const choice = numeric(answer, unit, seed);
    return { topic: "Ratios and proportions", prompt: `Frontend and backend tasks are in the ratio 3:5. If one ratio unit is ${unit}, how many tasks are there in total?`, ...choice, explanation: `The ratio has 3 + 5 = 8 units, so the total is 8 x ${unit} = ${answer}.`, difficulty: 0.34, targetSeconds: 65 };
  }
  if (family === "average") {
    const start = 8 + variant; const answer = start + 4; const choice = numeric(answer, 2, seed);
    return { topic: "Averages", prompt: `What is the average latency of ${start}, ${start + 2}, ${start + 4}, ${start + 6}, and ${start + 8} milliseconds?`, ...choice, explanation: `An evenly spaced five-value list has the middle value as its mean: ${answer}.`, difficulty: 0.35, targetSeconds: 65 };
  }
  if (family === "speed") {
    const speed = 30 + (variant % 8) * 5; const hours = 2 + (variant % 3); const answer = speed * hours; const choice = numeric(answer, speed, seed);
    return { topic: "Time, work, speed, and distance", prompt: `A test vehicle travels at ${speed} km/h for ${hours} hours. How far does it travel?`, ...choice, explanation: `Distance = speed x time = ${speed} x ${hours} = ${answer} km.`, difficulty: 0.38, targetSeconds: 70 };
  }
  if (family === "sequence") {
    const first = 2 + variant; const step = 2 + (variant % 5); const answer = first + step * 4; const choice = numeric(answer, step, seed);
    return { topic: "Number and letter sequences", prompt: `Find the next term: ${first}, ${first + step}, ${first + step * 2}, ${first + step * 3}, ...`, ...choice, explanation: `Each term increases by ${step}, so the next term is ${answer}.`, difficulty: 0.4, targetSeconds: 65 };
  }
  if (family === "direction") {
    const unit = 1 + variant; const east = 3 * unit; const north = 4 * unit; const answer = 5 * unit; const choice = numeric(answer, unit, seed);
    return { topic: "Directions and arrangements", prompt: `A runner moves ${east} m east and then ${north} m north. How far is the runner from the start?`, ...choice, explanation: `The path forms a 3-4-5 right triangle scaled by ${unit}, so the distance is ${answer} m.`, difficulty: 0.42, targetSeconds: 75 };
  }
  if (family === "probability") {
    const red = 2 + variant; const blue = 3 + (variant % 5); const divisor = gcd(red, red + blue); const correct = `${red / divisor}/${(red + blue) / divisor}`; const choice = rotate(correct, [`${blue}/${red + blue}`, `${red}/${blue}`, `1/${red + blue}`], seed);
    return { topic: "Probability and counting", prompt: `A bag has ${red} red and ${blue} blue tokens. What is the probability of drawing a red token once?`, ...choice, explanation: `Favorable outcomes are ${red} out of ${red + blue}; reduce the fraction to ${correct}.`, difficulty: 0.43, targetSeconds: 75 };
  }
  if (family === "data") {
    const first = 20 + variant * 2; const second = first + 5; const third = first - 3; const answer = first + second + third; const choice = numeric(answer, 5, seed);
    return { topic: "Data interpretation", prompt: `A dashboard shows ${first}, ${second}, and ${third} successful deployments across three months. How many succeeded in total?`, ...choice, explanation: `Add all three values: ${first} + ${second} + ${third} = ${answer}.`, difficulty: 0.4, targetSeconds: 70 };
  }
  if (family === "syllogism") {
    const groups = [["APIs", "services", "files"], ["indexes", "structures", "requests"], ["models", "programs", "tables"], ["queues", "buffers", "databases"], ["tokens", "credentials", "logs"], ["routes", "handlers", "schemas"], ["tests", "checks", "deployments"], ["vectors", "arrays", "sessions"]];
    const nouns = groups[variant % groups.length];
    const correct = `No ${nouns[0]} are ${nouns[2]}.`; const choice = rotate(correct, [`Some ${nouns[0]} are ${nouns[2]}.`, `All ${nouns[2]} are ${nouns[0]}.`, "No certain conclusion follows."], seed);
    return { topic: "Deductive reasoning and syllogisms", prompt: `All ${nouns[0]} are ${nouns[1]}. No ${nouns[1]} are ${nouns[2]}. Which conclusion must be true?`, ...choice, explanation: `If every ${nouns[0]} is inside ${nouns[1]}, and ${nouns[1]} excludes ${nouns[2]}, then ${nouns[0]} also excludes ${nouns[2]}.`, difficulty: 0.5, targetSeconds: 85 };
  }
  if (family === "critical") {
    const release = 10 + variant; const correct = "A comparable group without the change did not improve."; const choice = rotate(correct, ["The team expected an improvement.", `The release was version ${release}.`, "Users liked the new color."], seed);
    return { topic: "Critical reasoning", prompt: `After release ${release}, checkout failures fell. Which fact most strengthens the claim that the release caused the decrease?`, ...choice, explanation: "A comparable control separates the effect of the release from a general trend or coincidence.", difficulty: 0.56, targetSeconds: 95 };
  }
  if (family === "sufficiency") {
    const threshold = 10 + variant; const exact = threshold + 2; const correct = "Statement 1 alone is sufficient."; const choice = rotate(correct, ["Statement 2 alone is sufficient.", "Both statements together are required.", "The statements are not sufficient."], seed);
    return { topic: "Data sufficiency", prompt: `Is x greater than ${threshold}? (1) x = ${exact}. (2) y = ${threshold - 1}.`, ...choice, explanation: `Statement 1 fixes x at ${exact}, which answers the question. Statement 2 says nothing about x.`, difficulty: 0.52, targetSeconds: 90 };
  }
  if (family === "reading") {
    const total = 40 + variant; const failed = 3 + (variant % 4); const correct = `${total - failed} jobs succeeded.`; const choice = rotate(correct, [`${failed} jobs succeeded.`, `All ${total} jobs succeeded.`, "The passage gives no success count."], seed);
    return { topic: "Reading comprehension", prompt: `A batch ran ${total} jobs. Exactly ${failed} failed and every other job succeeded. Which statement is supported?`, ...choice, explanation: `Subtract the ${failed} failed jobs from ${total}: ${total - failed} succeeded.`, difficulty: 0.44, targetSeconds: 75 };
  }
  if (family === "assumption") {
    const correct = "At least some observed failures are temporary."; const choice = rotate(correct, ["Every request always succeeds.", "Retries have no cost.", "The service has unlimited capacity."], seed);
    return { topic: "Assumptions and conclusions", prompt: `A team proposes bounded retries to reduce transient request failures in service ${variant + 1}. Which assumption is necessary?`, ...choice, explanation: "Retries can help only if at least some failures may succeed on a later attempt.", difficulty: 0.54, targetSeconds: 90 };
  }
  if (family === "verbal") {
    const subjects = ["The tests", "The services", "The indexes", "The results"]; const subject = subjects[variant % subjects.length]; const correct = `${subject} are ready.`; const choice = rotate(correct, [`${subject} is ready.`, `${subject} be ready.`, `${subject} has ready.`], seed);
    return { topic: "Verbal ability", prompt: `Choose the grammatically correct sentence for deployment note ${variant + 1}.`, ...choice, explanation: `The plural subject “${subject}” takes the plural verb “are.”`, difficulty: 0.4, targetSeconds: 55 };
  }
  const groups = 3 + variant; const answer = groups; const choice = numeric(answer, 1, seed);
  return { topic: "SQL and DBMS", prompt: `A query groups rows into ${groups} distinct departments. How many rows exist immediately after GROUP BY and before HAVING?`, ...choice, explanation: `GROUP BY produces one result row per distinct group, so there are ${answer}.`, difficulty: 0.45, targetSeconds: 70 };
}

const focusByDay: Record<number, Family[]> = {
  1: ["percentage", "ratio", "average", "sequence", "data", "reading", "sql", "critical"],
  2: ["percentage"], 3: ["ratio"], 4: ["average"], 5: ["speed"], 6: ["data"],
  7: ["percentage", "ratio", "average", "speed", "sequence", "data", "reading", "sql"],
  8: ["sequence"], 9: ["syllogism"], 10: ["direction"], 11: ["probability"], 12: ["critical"],
  13: ["percentage", "ratio", "sequence", "syllogism", "direction", "probability", "critical", "sql"],
  14: ["ratio", "sequence", "syllogism", "probability", "critical", "data", "sufficiency", "sql"],
  15: ["data"], 16: ["sufficiency"], 17: ["reading"], 18: ["assumption"], 19: ["data"],
  20: ["percentage", "average", "sequence", "critical", "data", "sufficiency", "reading", "sql"],
  21: ["data", "sufficiency", "reading", "assumption", "critical", "verbal", "sequence", "sql"],
  22: ["percentage", "average", "speed"], 23: ["sequence", "syllogism", "direction", "critical"], 24: ["verbal"],
  25: ["percentage", "sequence", "syllogism", "data", "sufficiency", "reading", "verbal", "sql"],
  26: ["percentage", "ratio", "average", "speed", "sequence", "critical", "data", "verbal"],
  27: ["average", "sequence", "reading", "data"],
  28: ["percentage", "ratio", "sequence", "critical", "data", "reading", "verbal", "sql"],
};

export function buildAptitudeItem(day: number, offset: number): AptitudeItem {
  const families = focusByDay[day] ?? focusByDay[1];
  const family = families[offset % families.length];
  const variant = day * 12 + offset;
  return { id: `aptitude-${day}-${offset}`, ...buildFamily(family, variant, day + offset) };
}

export function aptitudeSet(day: number, count = 8) {
  return Array.from({ length: count }, (_, offset) => buildAptitudeItem(day, offset));
}
