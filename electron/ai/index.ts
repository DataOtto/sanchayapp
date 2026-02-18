import Store from 'electron-store';
import { gmail_v1 } from 'googleapis';
import { AIProvider } from './provider';
import { AIProviderType, AIProviderConfig, AIProviderStatus, ParsedEmail } from './types';
import { OllamaProvider } from './providers/ollama';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { OpenRouterProvider } from './providers/openrouter';
import { logger } from '../logger';

// Re-export types
export * from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Store() as any;

// Provider factory
function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}

// Default configs for each provider
const DEFAULT_CONFIGS: Record<AIProviderType, Partial<AIProviderConfig>> = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-flash',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.2-3b-instruct:free',
  },
};

// Get current AI configuration
export function getAIConfig(): AIProviderConfig {
  const type = store.get('ai_provider_type', 'ollama') as AIProviderType;
  const enabled = store.get('ai_enabled', false) as boolean;
  const apiKey = store.get(`ai_${type}_api_key`) as string | undefined;
  const baseUrl = store.get(`ai_${type}_base_url`, DEFAULT_CONFIGS[type].baseUrl) as string;
  const model = store.get(`ai_${type}_model`, DEFAULT_CONFIGS[type].model) as string;

  return {
    type,
    enabled,
    apiKey,
    baseUrl,
    model,
  };
}

// Set AI configuration
export function setAIConfig(config: Partial<AIProviderConfig>): void {
  if (config.type !== undefined) {
    store.set('ai_provider_type', config.type);
  }
  if (config.enabled !== undefined) {
    store.set('ai_enabled', config.enabled);
  }

  const type = config.type || (store.get('ai_provider_type', 'ollama') as AIProviderType);

  if (config.apiKey !== undefined) {
    if (config.apiKey) {
      store.set(`ai_${type}_api_key`, config.apiKey);
    } else {
      store.delete(`ai_${type}_api_key`);
    }
  }
  if (config.baseUrl !== undefined) {
    store.set(`ai_${type}_base_url`, config.baseUrl);
  }
  if (config.model !== undefined) {
    store.set(`ai_${type}_model`, config.model);
  }
}

// Clear AI configuration
export function clearAIConfig(): void {
  const types: AIProviderType[] = ['ollama', 'openai', 'gemini', 'openrouter'];

  store.delete('ai_provider_type');
  store.delete('ai_enabled');

  for (const type of types) {
    store.delete(`ai_${type}_api_key`);
    store.delete(`ai_${type}_base_url`);
    store.delete(`ai_${type}_model`);
  }
}

// Check provider status
export async function checkAIStatus(type?: AIProviderType): Promise<AIProviderStatus> {
  const config = getAIConfig();
  const providerType = type || config.type;

  const providerConfig: AIProviderConfig = {
    type: providerType,
    enabled: true,
    apiKey: store.get(`ai_${providerType}_api_key`) as string | undefined,
    baseUrl: store.get(`ai_${providerType}_base_url`, DEFAULT_CONFIGS[providerType].baseUrl) as string,
    model: store.get(`ai_${providerType}_model`, DEFAULT_CONFIGS[providerType].model) as string,
  };

  try {
    const provider = createProvider(providerConfig);
    return await provider.checkStatus();
  } catch (error) {
    return { available: false, error: (error as Error).message };
  }
}

// Get available models for a provider
export async function getProviderModels(type: AIProviderType): Promise<string[]> {
  const status = await checkAIStatus(type);
  return status.models || [];
}

// Parse email with configured AI provider
export async function parseEmailWithAI(message: gmail_v1.Schema$Message): Promise<ParsedEmail> {
  const config = getAIConfig();

  if (!config.enabled) {
    return { transactions: [] };
  }

  try {
    logger.debug('AI', `Parsing email with ${config.type} (${config.model})`);
    const provider = createProvider(config);
    const result = await provider.parseEmail(message);

    if (result.transactions.length > 0) {
      logger.info('AI', `AI found ${result.transactions.length} transaction(s)`);
    }
    if (result.subscription) {
      logger.info('AI', `AI detected subscription: ${result.subscription.name}`);
    }

    return result;
  } catch (error) {
    logger.error('AI', 'AI parsing error', (error as Error).message);
    return { transactions: [] };
  }
}

// Batch parse multiple emails
export async function parseEmailsWithAI(
  messages: gmail_v1.Schema$Message[],
  onProgress?: (processed: number, total: number) => void
): Promise<ParsedEmail[]> {
  const results: ParsedEmail[] = [];
  const total = messages.length;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const parsed = await parseEmailWithAI(message);
    results.push(parsed);

    if (onProgress) {
      onProgress(i + 1, total);
    }

    // Small delay between requests
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  return results;
}

// Get masked API key for display
export function getMaskedApiKey(type: AIProviderType): string | null {
  const key = store.get(`ai_${type}_api_key`) as string | undefined;
  if (!key) return null;
  return '••••••••' + key.slice(-4);
}

// Provider info for UI
export const PROVIDER_INFO: Record<AIProviderType, { name: string; description: string; requiresKey: boolean }> = {
  ollama: {
    name: 'Ollama',
    description: 'Free, local AI - runs on your machine',
    requiresKey: false,
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT-4o Mini - fast and accurate',
    requiresKey: true,
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Gemini 1.5 Flash - free tier available',
    requiresKey: true,
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access multiple models with one API key',
    requiresKey: true,
  },
};
