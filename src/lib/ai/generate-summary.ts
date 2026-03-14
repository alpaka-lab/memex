import { generateCompletion } from './providers';
import type { AiProvider } from './types';

interface GenerateSummaryInput {
  provider: AiProvider;
  apiKey: string;
  title: string | null;
  description: string | null;
  url: string;
  note: string | null;
}

export async function generateSummary(input: GenerateSummaryInput): Promise<string> {
  const { provider, apiKey, title, description, url, note } = input;

  const prompt = `You are a bookmark summarizer. Given a bookmark's metadata, write a concise 2-3 sentence summary that captures what this page is about and why someone might have saved it.

Bookmark:
- URL: ${url}
- Title: ${title ?? '(none)'}
- Description: ${description ?? '(none)'}
- Note: ${note ?? '(none)'}

Respond with ONLY the summary text, no quotes or labels:`;

  return generateCompletion({ provider, apiKey, prompt, maxTokens: 256 });
}
