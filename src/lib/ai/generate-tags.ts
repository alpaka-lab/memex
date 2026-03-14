import { generateCompletion } from './providers';
import type { AiProvider, AiTagSuggestion } from './types';

interface GenerateTagsInput {
  provider: AiProvider;
  apiKey: string;
  title: string | null;
  description: string | null;
  url: string;
  note: string | null;
  existingTags: string[];
}

export async function generateTags(input: GenerateTagsInput): Promise<AiTagSuggestion[]> {
  const { provider, apiKey, title, description, url, note, existingTags } = input;

  const prompt = `You are a bookmark tagging assistant. Given a bookmark's metadata, suggest up to 5 relevant tags.

IMPORTANT RULES:
- Prefer matching from the user's existing tags when relevant
- Tags should be lowercase, short (1-3 words), and descriptive
- Return ONLY a JSON array, no other text
- Each item: { "name": "tag-name", "confidence": 0.0-1.0 }

User's existing tags: ${existingTags.length > 0 ? existingTags.join(', ') : '(none yet)'}

Bookmark:
- URL: ${url}
- Title: ${title ?? '(none)'}
- Description: ${description ?? '(none)'}
- Note: ${note ?? '(none)'}

Respond with ONLY the JSON array:`;

  const raw = await generateCompletion({ provider, apiKey, prompt, maxTokens: 512 });

  try {
    // Extract JSON array from response (handle markdown code blocks)
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (t: { name?: string; confidence?: number }) =>
          typeof t.name === 'string' && typeof t.confidence === 'number'
      )
      .slice(0, 5)
      .map((t: { name: string; confidence: number }) => ({
        name: t.name.toLowerCase().trim(),
        confidence: Math.min(1, Math.max(0, t.confidence)),
      }));
  } catch {
    return [];
  }
}
