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

  to_es: (text) =>
    `Traduce el texto al español, conservando el estilo y el significado. Devuelve solo la traducción sin explicaciones.\n\nTexto: ${text}`,

  to_de: (text) =>
    `Übersetze den Text ins Deutsche und bewahre Stil und Bedeutung. Gib nur die Übersetzung ohne Erklärungen zurück.\n\nText: ${text}`,

  to_fr: (text) =>
    `Traduis le texte en français en conservant le style et le sens. Renvoie uniquement la traduction sans explication.\n\nTexte: ${text}`,

  to_it: (text) =>
    `Traduci il testo in italiano mantenendo stile e significato. Restituisci solo la traduzione senza spiegazioni.\n\nTesto: ${text}`,

  to_pt: (text) =>
    `Traduza o texto para português, preservando o estilo e o significado. Retorne apenas a tradução sem explicações.\n\nTexto: ${text}`,

  to_ja: (text) =>
    `Translate the text to Japanese, keeping style and meaning. Return only the translation with no explanations.\n\nText: ${text}`,

  to_uk: (text) =>
    `Переклади текст українською мовою, зберігши стиль і зміст. Поверни лише переклад без пояснень.\n\nТекст: ${text}`,

  to_pl: (text) =>
    `Przetłumacz tekst na język polski, zachowując styl i znaczenie. Zwróć wyłącznie tłumaczenie bez wyjaśnień.\n\nTekst: ${text}`,

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
  to_ru:    { label: 'На русский', icon: '🌐', shortcut: 'Ctrl+Shift+R' },
  to_en:    { label: 'На English', icon: '🌐', shortcut: 'Ctrl+Shift+E' },
  to_es:    { label: 'На Spanish', icon: '🌐', shortcut: '' },
  to_de:    { label: 'На German',  icon: '🌐', shortcut: '' },
  to_fr:    { label: 'На French',  icon: '🌐', shortcut: '' },
  to_it:    { label: 'На Italian', icon: '🌐', shortcut: '' },
  to_pt:    { label: 'На Portuguese', icon: '🌐', shortcut: '' },
  to_ja:    { label: 'На Japanese', icon: '🌐', shortcut: '' },
  to_uk:    { label: 'На украинский', icon: '🌐', shortcut: '' },
  to_pl:    { label: 'На польский', icon: '🌐', shortcut: '' },
  formal:   { label: 'Формально',  icon: '💼', shortcut: '' },
  casual:   { label: 'Просто',     icon: '💬', shortcut: '' },
};
