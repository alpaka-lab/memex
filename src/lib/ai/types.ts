export type AiProvider = 'anthropic' | 'openai' | 'gemini';

export interface AiGenerateOptions {
  provider: AiProvider;
  apiKey: string;
  prompt: string;
  maxTokens?: number;
}

export interface AiTagSuggestion {
  name: string;
  confidence: number;
}

export interface AiSummaryResult {
  summary: string;
}
