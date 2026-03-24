// background.js — SmartText Service Worker
// Created by ASTUS LAB

const CORE_ACTIONS = [
  { id: 'fix',        title: '✨ Исправить грамматику' },
  { id: 'shorter',    title: '📝 Сделать короче' },
  { id: 'longer',     title: '📖 Сделать длиннее' },
  { id: 'polite',     title: '😊 Сделать вежливее' },
  { id: 'formal',     title: '💼 Формальный стиль' },
  { id: 'casual',     title: '💬 Разговорный стиль' },
];

const LANGUAGE_ACTIONS = [
  { id: 'to_ru',      title: '🌐 Перевести на русский' },
  { id: 'to_en',      title: '🌐 Перевести на английский' },
  { id: 'to_es',      title: '🌐 Перевести на испанский' },
  { id: 'to_de',      title: '🌐 Перевести на немецкий' },
  { id: 'to_fr',      title: '🌐 Перевести на французский' },
  { id: 'to_it',      title: '🌐 Перевести на итальянский' },
  { id: 'to_pt',      title: '🌐 Перевести на португальский' },
  { id: 'to_ja',      title: '🌐 Перевести на японский' },
  { id: 'to_uk',      title: '🌐 Перевести на украинский' },
  { id: 'to_pl',      title: '🌐 Перевести на польский' },
];

const ACTIONS = [
  ...CORE_ACTIONS,
  ...LANGUAGE_ACTIONS,
  { id: 'settings',   title: '⚙️ Настройки' },
];
const ACTION_IDS = new Set(ACTIONS.map((a) => a.id).filter((id) => id !== 'settings'));

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
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'smarttext', title: 'SmartText', contexts: ['selection'] });
  for (const a of CORE_ACTIONS) {
    chrome.contextMenus.create({ id: a.id, parentId: 'smarttext', title: a.title, contexts: ['selection'] });
  }
  chrome.contextMenus.create({ id: 'languages', parentId: 'smarttext', title: '🌐 Языки', contexts: ['selection'] });
  for (const a of LANGUAGE_ACTIONS) {
    chrome.contextMenus.create({ id: a.id, parentId: 'languages', title: a.title, contexts: ['selection'] });
  }
  chrome.contextMenus.create({ id: 'settings', parentId: 'smarttext', title: '⚙️ Настройки', contexts: ['selection'] });
}

// ---- CONTEXT MENU ----
chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  rebuildContextMenus().catch(() => {});
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
