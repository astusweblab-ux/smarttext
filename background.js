// background.js — SmartText Service Worker
// Created by ASTUS LAB

const ACTIONS = [
  { id: 'fix',        title: '✨ Исправить грамматику' },
  { id: 'shorter',    title: '📝 Сделать короче' },
  { id: 'longer',     title: '📖 Сделать длиннее' },
  { id: 'polite',     title: '😊 Сделать вежливее' },
  { id: 'to_ru',      title: '🌍 Перевести на русский' },
  { id: 'to_en',      title: '🌍 Перевести на английский' },
  { id: 'formal',     title: '💼 Формальный стиль' },
  { id: 'settings',   title: '⚙️ Настройки' },
];

// ---- CONTEXT MENU ----
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'smarttext', title: 'SmartText', contexts: ['selection'] });
  for (const a of ACTIONS) {
    chrome.contextMenus.create({ id: a.id, parentId: 'smarttext', title: a.title, contexts: ['selection'] });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'settings') {
    await chrome.sidePanel.open({ tabId: tab.id });
    setTimeout(() => chrome.runtime.sendMessage({ type: 'NAV_SETTINGS' }).catch(() => {}), 600);
    return;
  }
  if (ACTIONS.find(a => a.id === info.menuItemId) && info.selectionText) {
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
    chrome.storage.local.get(['history'], r => {
      const history = r.history || [];
      history.unshift({ ...msg.entry, ts: Date.now() });
      if (history.length > 50) history.length = 50;
      chrome.storage.local.set({ history });
    });
    return true;
  }
  if (msg.type === 'GET_HISTORY') {
    chrome.storage.local.get(['history'], r => sendResponse(r.history || []));
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
