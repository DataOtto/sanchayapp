import { AIProvider } from '../provider';
import { AIProviderConfig, AIProviderStatus, AIParseResult } from '../types';

const DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-1.5-flash';

export class GeminiProvider extends AIProvider {
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
      const response = await fetch(
        `${this.config.baseUrl}/models?key=${this.config.apiKey}`
      );

      if (!response.ok) {
        return { available: false, error: 'Invalid API key' };
      }

      return {
        available: true,
        models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'],
      };
    } catch (error) {
      return { available: false, error: 'Failed to connect to Gemini' };
    }
  }

  async parseContent(prompt: string): Promise<AIParseResult | null> {
    if (!this.config.apiKey) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a financial email parser. Extract transaction details from emails accurately. Always respond with valid JSON only.\n\n${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error('Gemini API error:', response.status);
        return null;
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

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
      console.error('Gemini parse error:', error);
      return null;
    }
  }
}
