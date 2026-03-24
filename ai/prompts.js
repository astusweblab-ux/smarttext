// ai/prompts.js — промпты для всех действий SmartText
// Created by ASTUS LAB

export const PROMPTS = {
  fix: (text) =>
    `Исправь грамматические, орфографические и стилистические ошибки в тексте. Сохрани смысл и структуру. Верни только исправленный текст без пояснений.\n\nТекст: ${text}`,

  shorter: (text) =>
    `Сократи текст, оставив только самую важную информацию. Убери лишние слова и повторения. Верни только сокращённый текст без пояснений.\n\nТекст: ${text}`,

  longer: (text) =>
    `Раскрой мысль, добавь детали, примеры и пояснения. Сделай текст более развёрнутым. Верни только расширенный текст без пояснений.\n\nТекст: ${text}`,

  polite: (text) =>
    `Перепиши текст в более вежливом, уважительном и дружелюбном тоне. Верни только переписанный текст без пояснений.\n\nТекст: ${text}`,

  to_ru: (text) =>
    `Переведи текст на русский язык, сохранив стиль и смысл. Верни только перевод без пояснений.\n\nТекст: ${text}`,

  to_en: (text) =>
    `Translate the following text to English, preserving the style and meaning. Return only the translation without any explanation.\n\nText: ${text}`,

  formal: (text) =>
    `Перепиши текст в официально-деловом стиле. Убери разговорные выражения. Верни только переписанный текст без пояснений.\n\nТекст: ${text}`,

  casual: (text) =>
    `Перепиши текст в лёгком, разговорном и дружеском стиле. Верни только переписанный текст без пояснений.\n\nТекст: ${text}`,

  custom: (text, instruction) =>
    `${instruction}\n\nТекст: ${text}`,
};

export const ACTION_META = {
  fix:      { label: 'Исправить',  icon: '✨', shortcut: 'Ctrl+Shift+G' },
  shorter:  { label: 'Короче',     icon: '📝', shortcut: 'Ctrl+Shift+S' },
  longer:   { label: 'Длиннее',    icon: '📖', shortcut: 'Ctrl+Shift+L' },
  polite:   { label: 'Вежливее',   icon: '😊', shortcut: 'Ctrl+Shift+P' },
  to_ru:    { label: 'В русский',  icon: '🌍', shortcut: 'Ctrl+Shift+R' },
  to_en:    { label: 'In English', icon: '🌍', shortcut: 'Ctrl+Shift+E' },
  formal:   { label: 'Формально',  icon: '💼', shortcut: '' },
  casual:   { label: 'Просто',     icon: '💬', shortcut: '' },
};
