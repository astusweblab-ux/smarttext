// ai/index.js — локальный AI-движок SmartText (Chrome Built-in AI / Prompt API)
// Created by ASTUS LAB
import { PROMPTS } from './prompts.js';

const SYSTEM_PROMPT =
  'You are SmartText, a professional text editor created by ASTUS LAB. Follow the user instruction exactly. Return only processed text without explanations or quotes.';
const SUPPORTED_OUTPUT_LANGS = ['en', 'es', 'ja'];

let promptApi = null;
let session = null;
let sessionTemperature = null;
let sessionOutputLanguage = null;
let sessionInitPromise = null;

function normalizeAvailability(rawStatus) {
  const status = String(rawStatus || '').toLowerCase();
  if (status === 'available' || status === 'readily' || status === 'yes') return 'ready';
  if (status === 'downloadable' || status === 'downloading' || status === 'after-download' || status === 'after_download') return 'downloading';
  if (status === 'unavailable' || status === 'no') return 'unavailable';
  return 'unknown';
}

function getPromptApiAdapter() {
  const modernApi = globalThis.LanguageModel;
  if (modernApi && typeof modernApi.availability === 'function' && typeof modernApi.create === 'function') {
    return {
      async availability(options) {
        return modernApi.availability(options);
      },
      async create(options) {
        return modernApi.create(options);
      }
    };
  }

  const legacyRoot = globalThis.ai || globalThis.chrome?.ai || null;
  const legacyFactory = legacyRoot?.languageModel || legacyRoot?.assistant;
  if (legacyFactory && typeof legacyFactory.create === 'function') {
    return {
      async availability(options) {
        if (typeof legacyFactory.capabilities !== 'function') return 'unknown';
        const caps = await legacyFactory.capabilities(options);
        return caps?.available ?? caps?.status ?? 'unknown';
      },
      async create(options) {
        return legacyFactory.create(options);
      }
    };
  }

  return null;
}

function detectOutputLanguage() {
  const browserLang = String(globalThis.navigator?.language || '').toLowerCase();
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en';
}

function getLanguageOptionVariants(preferredLanguage = detectOutputLanguage()) {
  const preferred = SUPPORTED_OUTPUT_LANGS.includes(preferredLanguage) ? preferredLanguage : 'en';
  const fallback = 'en';
  const order = preferred === fallback ? [fallback] : [preferred, fallback];

  const variants = [];
  for (const lang of order) {
    if (!SUPPORTED_OUTPUT_LANGS.includes(lang)) continue;
    variants.push({ expectedOutputs: [{ type: 'text', languages: [lang] }] });
    variants.push({ expectedOutputLanguages: [lang] });
    variants.push({ outputLanguage: lang });
  }
  if (!variants.length) {
    variants.push({ expectedOutputs: [{ type: 'text', languages: ['en'] }] });
    variants.push({ expectedOutputLanguages: ['en'] });
    variants.push({ outputLanguage: 'en' });
  }
  return variants;
}

function toText(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(toText).join('');
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text;
    if (typeof value.output_text === 'string') return value.output_text;
    if (typeof value.content === 'string') return value.content;
    if (Array.isArray(value.content)) return value.content.map(toText).join('');
    if (typeof value.value === 'string') return value.value;
  }
  return String(value);
}

function cleanText(text) {
  return String(text || '').replace(/^assistant:\s*/i, '').trim();
}

function buildPrompt(basePrompt, maxChars) {
  return `${basePrompt}\n\nОграничение: верни только итоговый текст длиной до ${maxChars} символов.`;
}

function destroySession() {
  if (!session) return;
  try {
    session.destroy?.();
  } catch (_) {}
  session = null;
  sessionTemperature = null;
  sessionOutputLanguage = null;
}

async function getAvailability(adapter, preferredLanguage) {
  if (!adapter?.availability) return 'unknown';
  const variants = [...getLanguageOptionVariants(preferredLanguage), {}];
  for (const options of variants) {
    try {
      return normalizeAvailability(await adapter.availability(options));
    } catch (_) {}
  }
  return 'unknown';
}

async function createLocalSession(adapter, temperature, preferredLanguage) {
  const optionsList = [];
  const languageVariants = getLanguageOptionVariants(preferredLanguage);

  for (const langOptions of languageVariants) {
    optionsList.push({ ...langOptions, systemPrompt: SYSTEM_PROMPT, temperature });
    optionsList.push({ ...langOptions, systemPrompt: SYSTEM_PROMPT });
  }

  // Fallback для старых реализаций, где язык вывода не обязателен.
  optionsList.push({ systemPrompt: SYSTEM_PROMPT, temperature });
  optionsList.push({ systemPrompt: SYSTEM_PROMPT });
  optionsList.push({});

  let lastError = null;
  for (const options of optionsList) {
    try {
      return await adapter.create(options);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Не удалось создать локальную AI-сессию');
}

function getPreferredOutputLanguageForAction(action) {
  if (action === 'to_es') return 'es';
  if (action === 'to_ja') return 'ja';
  return 'en';
}

async function ensureSession(temperature, preferredLanguage) {
  if (session && sessionTemperature === temperature && sessionOutputLanguage === preferredLanguage) return session;

  if (sessionInitPromise) return sessionInitPromise;

  sessionInitPromise = (async () => {
    promptApi = promptApi || getPromptApiAdapter();
    if (!promptApi) {
      throw new Error(
        'Chrome Built-in AI (Prompt API) недоступен. Обновите Chrome и включите on-device AI в chrome://flags.'
      );
    }

    const availability = await getAvailability(promptApi, preferredLanguage);
    if (availability === 'unavailable') {
      throw new Error('Локальная модель недоступна на этом устройстве.');
    }

    if (!session || sessionTemperature !== temperature || sessionOutputLanguage !== preferredLanguage) {
      destroySession();
      session = await createLocalSession(promptApi, temperature, preferredLanguage);
      sessionTemperature = temperature;
      sessionOutputLanguage = preferredLanguage;
    }

    return session;
  })();

  try {
    return await sessionInitPromise;
  } finally {
    sessionInitPromise = null;
  }
}

async function generateText(modelSession, prompt, onChunk) {
  if (typeof modelSession.promptStreaming === 'function') {
    const stream = await modelSession.promptStreaming(prompt);
    let fullText = '';
    for await (const chunk of stream) {
      const chunkText = toText(chunk);
      if (!chunkText) continue;
      if (chunkText.startsWith(fullText)) {
        fullText = chunkText;
      } else {
        fullText += chunkText;
      }
      onChunk?.(cleanText(fullText));
    }
    return cleanText(fullText);
  }

  if (typeof modelSession.prompt === 'function') {
    const out = await modelSession.prompt(prompt);
    const text = cleanText(toText(out));
    onChunk?.(text);
    return text;
  }

  throw new Error('Текущая AI-сессия не поддерживает prompt/promptStreaming');
}

export async function initLocalAI() {
  promptApi = promptApi || getPromptApiAdapter();
  if (!promptApi) {
    return {
      available: false,
      message: 'Chrome Built-in AI не найден'
    };
  }

  const availability = await getAvailability(promptApi, detectOutputLanguage());
  if (availability === 'unavailable') {
    return {
      available: false,
      message: 'Локальная модель недоступна на этом устройстве'
    };
  }

  return {
    available: true,
    message: availability === 'downloading' ? 'Локальная модель скачивается Chrome' : 'Локальный AI доступен'
  };
}

export async function warmupLocalAI() {
  const settings = await chrome.storage.sync.get({
    temperature: 0.7,
    preloadModel: true
  });

  if (!settings.preloadModel) {
    return { warmed: false, reason: 'disabled' };
  }

  try {
    await ensureSession(settings.temperature, detectOutputLanguage());
    return { warmed: true, reason: 'ready' };
  } catch (err) {
    if (err?.name === 'NotAllowedError') {
      return { warmed: false, reason: 'gesture' };
    }
    return { warmed: false, reason: err?.message || 'failed' };
  }
}

export async function runAction(action, text, instruction = '', onChunk) {
  const promptFn = PROMPTS[action];
  if (!promptFn) throw new Error('Unknown action: ' + action);

  const settings = await chrome.storage.sync.get({
    model: 'chrome-prompt-api',
    temperature: 0.7,
    maxTokens: 500
  });

  const promptBase = action === 'custom' ? PROMPTS.custom(text, instruction) : promptFn(text);
  const prompt = buildPrompt(promptBase, settings.maxTokens);
  const preferredLanguage = getPreferredOutputLanguageForAction(action);

  let modelSession;
  try {
    modelSession = await ensureSession(settings.temperature, preferredLanguage);
  } catch (err) {
    if (err?.name === 'NotAllowedError') {
      throw new Error('Нужен пользовательский жест: откройте SmartText и нажмите любое действие ещё раз.');
    }
    throw err;
  }

  try {
    return await generateText(modelSession, prompt, onChunk);
  } catch (err) {
    // Если сессия была сброшена/устарела — пересоздаём один раз и повторяем.
    destroySession();
    const retrySession = await ensureSession(settings.temperature, preferredLanguage);
    return generateText(retrySession, prompt, onChunk);
  }
}

export function resetLocalSession() {
  destroySession();
}
