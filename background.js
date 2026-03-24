// background.js — SmartText Service Worker
// Created by ASTUS LAB

const CORE_ACTIONS = [
  { id: 'fix' },
  { id: 'shorter' },
  { id: 'longer' },
  { id: 'polite' },
  { id: 'formal' },
  { id: 'casual' },
];

const LANGUAGE_ACTIONS = [
  { id: 'to_ru' },
  { id: 'to_en' },
  { id: 'to_es' },
  { id: 'to_de' },
  { id: 'to_fr' },
  { id: 'to_it' },
  { id: 'to_pt' },
  { id: 'to_ja' },
  { id: 'to_uk' },
  { id: 'to_pl' },
];

const ACTIONS = [...CORE_ACTIONS, ...LANGUAGE_ACTIONS, { id: 'settings' }];
const ACTION_IDS = new Set(ACTIONS.map((a) => a.id).filter((id) => id !== 'settings'));

const MENU_TEXT = {
  ru: {
    root: 'SmartText',
    languages: '🌐 Языки',
    settings: '⚙️ Настройки',
    fix: '✨ Исправить грамматику',
    shorter: '📝 Сделать короче',
    longer: '📖 Сделать длиннее',
    polite: '😊 Сделать вежливее',
    formal: '💼 Формальный стиль',
    casual: '💬 Разговорный стиль',
    to_ru: '🌐 Перевести на русский',
    to_en: '🌐 Перевести на английский',
    to_es: '🌐 Перевести на испанский',
    to_de: '🌐 Перевести на немецкий',
    to_fr: '🌐 Перевести на французский',
    to_it: '🌐 Перевести на итальянский',
    to_pt: '🌐 Перевести на португальский',
    to_ja: '🌐 Перевести на японский',
    to_uk: '🌐 Перевести на украинский',
    to_pl: '🌐 Перевести на польский'
  },
  en: {
    root: 'SmartText',
    languages: '🌐 Languages',
    settings: '⚙️ Settings',
    fix: '✨ Fix grammar',
    shorter: '📝 Make shorter',
    longer: '📖 Make longer',
    polite: '😊 Make polite',
    formal: '💼 Formal style',
    casual: '💬 Casual style',
    to_ru: '🌐 Translate to Russian',
    to_en: '🌐 Translate to English',
    to_es: '🌐 Translate to Spanish',
    to_de: '🌐 Translate to German',
    to_fr: '🌐 Translate to French',
    to_it: '🌐 Translate to Italian',
    to_pt: '🌐 Translate to Portuguese',
    to_ja: '🌐 Translate to Japanese',
    to_uk: '🌐 Translate to Ukrainian',
    to_pl: '🌐 Translate to Polish'
  },
  es: {
    root: 'SmartText',
    languages: '🌐 Idiomas',
    settings: '⚙️ Configuración',
    fix: '✨ Corregir gramática',
    shorter: '📝 Hacer más corto',
    longer: '📖 Hacer más largo',
    polite: '😊 Hacer más cortés',
    formal: '💼 Estilo formal',
    casual: '💬 Estilo casual',
    to_ru: '🌐 Traducir al ruso',
    to_en: '🌐 Traducir al inglés',
    to_es: '🌐 Traducir al español',
    to_de: '🌐 Traducir al alemán',
    to_fr: '🌐 Traducir al francés',
    to_it: '🌐 Traducir al italiano',
    to_pt: '🌐 Traducir al portugués',
    to_ja: '🌐 Traducir al japonés',
    to_uk: '🌐 Traducir al ucraniano',
    to_pl: '🌐 Traducir al polaco'
  },
  de: {
    root: 'SmartText',
    languages: '🌐 Sprachen',
    settings: '⚙️ Einstellungen',
    fix: '✨ Grammatik korrigieren',
    shorter: '📝 Kürzer machen',
    longer: '📖 Länger machen',
    polite: '😊 Höflicher machen',
    formal: '💼 Formeller Stil',
    casual: '💬 Lockerer Stil',
    to_ru: '🌐 Ins Russische übersetzen',
    to_en: '🌐 Ins Englische übersetzen',
    to_es: '🌐 Ins Spanische übersetzen',
    to_de: '🌐 Ins Deutsche übersetzen',
    to_fr: '🌐 Ins Französische übersetzen',
    to_it: '🌐 Ins Italienische übersetzen',
    to_pt: '🌐 Ins Portugiesische übersetzen',
    to_ja: '🌐 Ins Japanische übersetzen',
    to_uk: '🌐 Ins Ukrainische übersetzen',
    to_pl: '🌐 Ins Polnische übersetzen'
  },
  fr: {
    root: 'SmartText',
    languages: '🌐 Langues',
    settings: '⚙️ Paramètres',
    fix: '✨ Corriger la grammaire',
    shorter: '📝 Raccourcir',
    longer: '📖 Développer',
    polite: '😊 Rendre plus poli',
    formal: '💼 Style formel',
    casual: '💬 Style décontracté',
    to_ru: '🌐 Traduire en russe',
    to_en: '🌐 Traduire en anglais',
    to_es: '🌐 Traduire en espagnol',
    to_de: '🌐 Traduire en allemand',
    to_fr: '🌐 Traduire en français',
    to_it: '🌐 Traduire en italien',
    to_pt: '🌐 Traduire en portugais',
    to_ja: '🌐 Traduire en japonais',
    to_uk: '🌐 Traduire en ukrainien',
    to_pl: '🌐 Traduire en polonais'
  },
  it: {
    root: 'SmartText',
    languages: '🌐 Lingue',
    settings: '⚙️ Impostazioni',
    fix: '✨ Correggi grammatica',
    shorter: '📝 Rendi più breve',
    longer: '📖 Rendi più lungo',
    polite: '😊 Rendi più cortese',
    formal: '💼 Stile formale',
    casual: '💬 Stile informale',
    to_ru: '🌐 Traduci in russo',
    to_en: '🌐 Traduci in inglese',
    to_es: '🌐 Traduci in spagnolo',
    to_de: '🌐 Traduci in tedesco',
    to_fr: '🌐 Traduci in francese',
    to_it: '🌐 Traduci in italiano',
    to_pt: '🌐 Traduci in portoghese',
    to_ja: '🌐 Traduci in giapponese',
    to_uk: '🌐 Traduci in ucraino',
    to_pl: '🌐 Traduci in polacco'
  },
  pt: {
    root: 'SmartText',
    languages: '🌐 Idiomas',
    settings: '⚙️ Configurações',
    fix: '✨ Corrigir gramática',
    shorter: '📝 Encurtar texto',
    longer: '📖 Expandir texto',
    polite: '😊 Tornar mais educado',
    formal: '💼 Estilo formal',
    casual: '💬 Estilo casual',
    to_ru: '🌐 Traduzir para russo',
    to_en: '🌐 Traduzir para inglês',
    to_es: '🌐 Traduzir para espanhol',
    to_de: '🌐 Traduzir para alemão',
    to_fr: '🌐 Traduzir para francês',
    to_it: '🌐 Traduzir para italiano',
    to_pt: '🌐 Traduzir para português',
    to_ja: '🌐 Traduzir para japonês',
    to_uk: '🌐 Traduzir para ucraniano',
    to_pl: '🌐 Traduzir para polonês'
  },
  ja: {
    root: 'SmartText',
    languages: '🌐 言語',
    settings: '⚙️ 設定',
    fix: '✨ 文法を修正',
    shorter: '📝 短くする',
    longer: '📖 長くする',
    polite: '😊 丁寧にする',
    formal: '💼 フォーマル',
    casual: '💬 カジュアル',
    to_ru: '🌐 ロシア語に翻訳',
    to_en: '🌐 英語に翻訳',
    to_es: '🌐 スペイン語に翻訳',
    to_de: '🌐 ドイツ語に翻訳',
    to_fr: '🌐 フランス語に翻訳',
    to_it: '🌐 イタリア語に翻訳',
    to_pt: '🌐 ポルトガル語に翻訳',
    to_ja: '🌐 日本語に翻訳',
    to_uk: '🌐 ウクライナ語に翻訳',
    to_pl: '🌐 ポーランド語に翻訳'
  },
  uk: {
    root: 'SmartText',
    languages: '🌐 Мови',
    settings: '⚙️ Налаштування',
    fix: '✨ Виправити граматику',
    shorter: '📝 Зробити коротше',
    longer: '📖 Зробити довше',
    polite: '😊 Зробити ввічливіше',
    formal: '💼 Формальний стиль',
    casual: '💬 Розмовний стиль',
    to_ru: '🌐 Перекласти російською',
    to_en: '🌐 Перекласти англійською',
    to_es: '🌐 Перекласти іспанською',
    to_de: '🌐 Перекласти німецькою',
    to_fr: '🌐 Перекласти французькою',
    to_it: '🌐 Перекласти італійською',
    to_pt: '🌐 Перекласти португальською',
    to_ja: '🌐 Перекласти японською',
    to_uk: '🌐 Перекласти українською',
    to_pl: '🌐 Перекласти польською'
  },
  pl: {
    root: 'SmartText',
    languages: '🌐 Języki',
    settings: '⚙️ Ustawienia',
    fix: '✨ Popraw gramatykę',
    shorter: '📝 Skróć tekst',
    longer: '📖 Rozwiń tekst',
    polite: '😊 Uczyń bardziej uprzejmym',
    formal: '💼 Styl formalny',
    casual: '💬 Styl swobodny',
    to_ru: '🌐 Tłumacz na rosyjski',
    to_en: '🌐 Tłumacz na angielski',
    to_es: '🌐 Tłumacz na hiszpański',
    to_de: '🌐 Tłumacz na niemiecki',
    to_fr: '🌐 Tłumacz na francuski',
    to_it: '🌐 Tłumacz na włoski',
    to_pt: '🌐 Tłumacz na portugalski',
    to_ja: '🌐 Tłumacz na japoński',
    to_uk: '🌐 Tłumacz na ukraiński',
    to_pl: '🌐 Tłumacz na polski'
  }
};

function resolveUiLanguage(configValue) {
  const supported = ['ru', 'en', 'es', 'de', 'fr', 'it', 'pt', 'ja', 'uk', 'pl'];
  if (supported.includes(configValue)) return configValue;
  const browserLang = String(globalThis.navigator?.language || '').toLowerCase();
  for (const lang of supported) {
    if (browserLang.startsWith(`${lang}-`) || browserLang === lang) return lang;
  }
  return 'en';
}

function menuLabel(key, uiLang) {
  return MENU_TEXT[uiLang]?.[key] || MENU_TEXT.en[key] || key;
}

function compactHistoryEntry(entry) {
  return {
    action: entry.action || 'custom',
    original: String(entry.original || '').slice(0, 160),
    result: String(entry.result || '').slice(0, 160),
    ts: Number(entry.ts) || Date.now()
  };
}

function mergeHistory(localHistory, syncHistory) {
  const map = new Map();
  [...localHistory, ...syncHistory].forEach((item) => {
    const safe = {
      action: item.action || 'custom',
      original: String(item.original || ''),
      result: String(item.result || ''),
      ts: Number(item.ts) || Date.now()
    };
    const key = `${safe.ts}|${safe.action}|${safe.original.slice(0, 40)}|${safe.result.slice(0, 40)}`;
    if (!map.has(key)) map.set(key, safe);
  });
  return Array.from(map.values()).sort((a, b) => b.ts - a.ts).slice(0, 50);
}

async function rebuildContextMenus() {
  const { uiLanguage = 'auto' } = await chrome.storage.sync.get({ uiLanguage: 'auto' });
  const lang = resolveUiLanguage(uiLanguage);

  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'smarttext', title: menuLabel('root', lang), contexts: ['selection'] });
  for (const a of CORE_ACTIONS) {
    chrome.contextMenus.create({ id: a.id, parentId: 'smarttext', title: menuLabel(a.id, lang), contexts: ['selection'] });
  }
  chrome.contextMenus.create({
    id: 'languages',
    parentId: 'smarttext',
    title: menuLabel('languages', lang),
    contexts: ['selection']
  });
  for (const a of LANGUAGE_ACTIONS) {
    chrome.contextMenus.create({ id: a.id, parentId: 'languages', title: menuLabel(a.id, lang), contexts: ['selection'] });
  }
  chrome.contextMenus.create({
    id: 'settings',
    parentId: 'smarttext',
    title: menuLabel('settings', lang),
    contexts: ['selection']
  });
}

// ---- CONTEXT MENU ----
chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  rebuildContextMenus().catch(() => {});
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.uiLanguage) {
    rebuildContextMenus().catch(() => {});
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'settings') {
    await chrome.sidePanel.open({ tabId: tab.id });
    setTimeout(() => chrome.runtime.sendMessage({ type: 'NAV_SETTINGS' }).catch(() => {}), 600);
    return;
  }
  if (ACTION_IDS.has(info.menuItemId) && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'RUN_ACTION',
        action: info.menuItemId,
        text: info.selectionText
      }).catch(() => {
        chrome.storage.session.set({ pendingAction: { action: info.menuItemId, text: info.selectionText } });
      });
    }, 700);
  }
});

// ---- SIDE PANEL OPEN on icon click ----
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// ---- MESSAGES ----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SHOW_NOTIFICATION') {
    const id = `smarttext_${Date.now()}`;
    chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: String(msg.title || 'SmartText'),
      message: String(msg.message || '')
    }, () => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'REFRESH_CONTEXT_MENUS') {
    rebuildContextMenus().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (msg.type === 'GET_STATS') {
    chrome.storage.local.get(['stats'], r => sendResponse(r.stats || {}));
    return true;
  }
  if (msg.type === 'UPDATE_STATS') {
    chrome.storage.local.get(['stats'], r => {
      const stats = r.stats || {};
      stats[msg.action] = (stats[msg.action] || 0) + 1;
      stats._chars = (stats._chars || 0) + (msg.chars || 0);
      chrome.storage.local.set({ stats });
    });
    return true;
  }
  if (msg.type === 'SAVE_HISTORY') {
    const entry = { ...msg.entry, ts: Date.now() };
    chrome.storage.local.get(['history'], r => {
      const history = r.history || [];
      history.unshift(entry);
      if (history.length > 50) history.length = 50;
      chrome.storage.local.set({ history });
    });

    chrome.storage.sync.get({ syncHistory: false, historySync: [] }, (s) => {
      if (!s.syncHistory) return;
      const syncHistory = Array.isArray(s.historySync) ? s.historySync : [];
      syncHistory.unshift(compactHistoryEntry(entry));
      if (syncHistory.length > 20) syncHistory.length = 20;
      chrome.storage.sync.set({ historySync: syncHistory }, () => {});
    });
    return true;
  }
  if (msg.type === 'GET_HISTORY') {
    chrome.storage.local.get(['history'], (r) => {
      const localHistory = r.history || [];
      chrome.storage.sync.get({ syncHistory: false, historySync: [] }, (s) => {
        if (!s.syncHistory) {
          sendResponse(localHistory);
          return;
        }
        const syncHistory = Array.isArray(s.historySync) ? s.historySync : [];
        sendResponse(mergeHistory(localHistory, syncHistory));
      });
    });
    return true;
  }
  if (msg.type === 'CONTENT_ACTION') {
    // From content script — forward to sidepanel
    chrome.runtime.sendMessage({ type: 'RUN_ACTION', action: msg.action, text: msg.text, tabId: sender.tab?.id })
      .catch(() => {
        chrome.storage.session.set({ pendingAction: { action: msg.action, text: msg.text, tabId: sender.tab?.id } });
        chrome.sidePanel.open({ tabId: sender.tab?.id });
      });
    return true;
  }
  if (msg.type === 'INJECT_TEXT') {
    // Inject text back to page
    const tabId = msg.tabId;
    if (tabId) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: (text) => {
          const el = document.querySelector('.__smarttext_target__') || document.activeElement;
          if (!el) return;
          if (el.isContentEditable) {
            document.execCommand('insertText', false, text);
          } else if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            const start = el.selectionStart, end = el.selectionEnd;
            el.value = el.value.slice(0, start) + text + el.value.slice(end);
            el.setSelectionRange(start, start + text.length);
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        args: [msg.text]
      });
    }
  }
});
