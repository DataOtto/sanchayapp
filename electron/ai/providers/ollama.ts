import { AIProvider } from '../provider';
import { AIProviderConfig, AIProviderStatus, AIParseResult } from '../types';

const DEFAULT_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

export class OllamaProvider extends AIProvider {
  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || DEFAULT_URL,
      model: config.model || DEFAULT_MODEL,
    });
  }

  async checkStatus(): Promise<AIProviderStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) {
        return { available: false, error: 'Ollama not responding' };
      }
      const data = await response.json() as { models?: Array<{ name: string }> };
      const models = data.models?.map((m) => m.name) || [];
      return { available: true, models };
    } catch (error) {
      return { available: false, error: 'Ollama not running' };
    }
  }

  async parseContent(prompt: string): Promise<AIParseResult | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a financial email parser. Extract transaction details from emails accurately. Always respond with valid JSON only, no explanations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: false,
          options: {
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        console.error('Ollama API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json() as { message?: { content?: string } };
      const content = data.message?.content?.trim();

      if (!content) {
        return null;
      }

      // Parse JSON response
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in Ollama response');
        return null;
      }

      return JSON.parse(jsonMatch[0]) as AIParseResult;
    } catch (error) {
      console.error('Ollama parse error:', error);
      return null;
    }
  }
}
