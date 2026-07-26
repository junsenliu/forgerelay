import { analyzeWithGemini } from "./gemini.mjs";
import { analyzeLocally } from "./local-analyzer.mjs";

export async function analyzeRfq(input, options = {}) {
  const geminiResult = await analyzeWithGemini(input, options);
  return geminiResult ?? analyzeLocally(input);
}

