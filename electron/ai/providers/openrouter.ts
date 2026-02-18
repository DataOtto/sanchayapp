import { AIProvider } from '../provider';
import { AIProviderConfig, AIProviderStatus, AIParseResult } from '../types';

const DEFAULT_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

export class OpenRouterProvider extends AIProvider {
  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || DEFAULT_URL,
      model: config.model || DEFAULT_MODEL,
    });
  }

  async checkStatus(): Promise<AIProviderStatus> {
    if (!this.config.apiKey) {
      return { available: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return { available: false, error: 'Invalid API key' };
      }

      return {
        available: true,
        models: [
          'meta-llama/llama-3.2-3b-instruct:free',
          'google/gemini-flash-1.5',
          'openai/gpt-4o-mini',
          'anthropic/claude-3-haiku',
        ],
      };
    } catch (error) {
      return { available: false, error: 'Failed to connect to OpenRouter' };
    }
  }

  async parseContent(prompt: string): Promise<AIParseResult | null> {
    if (!this.config.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://sanchay.app',
          'X-Title': 'Sanchay',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a financial email parser. Extract transaction details from emails accurately. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        console.error('OpenRouter API error:', response.status);
        return null;
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        return null;
      }

      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      return JSON.parse(jsonMatch[0]) as AIParseResult;
    } catch (error) {
      console.error('OpenRouter parse error:', error);
      return null;
    }
  }
}
