const pricing = {
  generation: { inputPerMillion: Number(process.env.AI_GENERATION_INPUT_USD_PER_MILLION ?? 3), outputPerMillion: Number(process.env.AI_GENERATION_OUTPUT_USD_PER_MILLION ?? 15) },
  critic: { inputPerMillion: Number(process.env.AI_CRITIC_INPUT_USD_PER_MILLION ?? 15), outputPerMillion: Number(process.env.AI_CRITIC_OUTPUT_USD_PER_MILLION ?? 75) },
};

export function estimateAiCost(kind: keyof typeof pricing, inputTokens: number, outputTokens: number) {
  const rate = pricing[kind];
  return (inputTokens / 1_000_000) * rate.inputPerMillion + (outputTokens / 1_000_000) * rate.outputPerMillion;
}

export function estimateBatchCost(count: number, inputTokensPerItem = 1600, outputTokensPerItem = 2600) {
  const criticMaximum = estimateAiCost("critic", 4500, 420);
  return Number((count * (estimateAiCost("generation", inputTokensPerItem, outputTokensPerItem) + criticMaximum)).toFixed(2));
}
