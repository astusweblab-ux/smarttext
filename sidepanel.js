// sidepanel.js — SmartText Side Panel Logic
// Created by ASTUS LAB
import { initLocalAI, runAction } from './ai/index.js';
import { ACTION_META } from './ai/prompts.js';

// ---- STATE ----
let isReady = false;
let isGenerating = false;
let lastResult = '';
let lastTabId = null;
let currentAction = null;

// ---- DOM ----
const mainApp       = document.getElementById('mainApp');
const statusDot     = document.getElementById('statusDot');
const statusLabel   = document.getElementById('statusLabel');
const inputText     = document.getElementById('inputText');
const resultSection = document.getElementById('resultSection');
const resultText    = document.getElementById('resultText');
const genBar        = document.getElementById('generatingBar');
const copyResultBtn = document.getElementById('copyResultBtn');
const insertResultBtn = document.getElementById('insertResultBtn');
const clearResultBtn  = document.getElementById('clearResultBtn');
const customPrompt  = document.getElementById('customPrompt');
const customRunBtn  = document.getElementById('customRunBtn');
const historyList   = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const helpBtn       = document.getElementById('helpBtn');
const helpModal     = document.getElementById('helpModal');
const helpCloseBtn  = document.getElementById('helpCloseBtn');
const helpShortcutsList = document.getElementById('helpShortcutsList');

// ---- STATUS ----
function setStatus(state, label) {
  statusDot.className = 'status-dot ' + state;
  statusLabel.textContent = label;
}

function renderHelpShortcuts() {
  if (!helpShortcutsList) return;
  const items = Object.entries(ACTION_META)
    .filter(([, meta]) => meta.shortcut)
    .map(([id, meta]) => ({ id, label: meta.label, shortcut: meta.shortcut }));

  items.push({ id: 'esc', label: 'Закрыть плавающую панель', shortcut: 'Esc' });

  helpShortcutsList.innerHTML = items.map((item) => `
    <div class="shortcut-row">
      <div class="shortcut-name">${escHtml(item.label)}</div>
      <div class="shortcut-key">${escHtml(item.shortcut)}</div>
    </div>
  `).join('');
}

function openHelpModal() {
  if (!helpModal) return;
  renderHelpShortcuts();
  helpModal.classList.add('open');
  helpModal.setAttribute('aria-hidden', 'false');
}

function closeHelpModal() {
  if (!helpModal) return;
  helpModal.classList.remove('open');
  helpModal.setAttribute('aria-hidden', 'true');
}

// ---- TABS ----
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab)?.classList.add('active');
    if (tab.dataset.tab === 'history') renderHistory();
    if (tab.dataset.tab === 'stats') renderStats();
    if (tab.dataset.tab === 'settings') loadSettings();
  });
});

helpBtn?.addEventListener('click', openHelpModal);
helpCloseBtn?.addEventListener('click', closeHelpModal);
helpModal?.addEventListener('mousedown', (e) => {
  if (e.target === helpModal) closeHelpModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && helpModal?.classList.contains('open')) {
    closeHelpModal();
  }
});

// ---- INIT ----
async function init() {
  setStatus('', 'Проверка локального AI...');
  showMain();
  try {
    const aiState = await initLocalAI();
    if (aiState.available) {
      setStatus('ready', aiState.message || 'Локальный AI готов');
    } else {
      setStatus('error', aiState.message || 'Локальный AI недоступен');
    }
  } catch (e) {
    setStatus('error', 'Ошибка инициализации');
    console.error('SmartText local AI init error:', e);
  }
}

function showMain() {
  mainApp.style.display = 'flex';
  mainApp.style.flexDirection = 'column';
  mainApp.style.flex = '1';
  mainApp.style.overflow = 'hidden';
  isReady = true;
  checkPending();
}

// ---- RUN ACTION ----
async function generate(action, text, instruction = '') {
  if (isGenerating || !text.trim()) return;
  isGenerating = true;
  currentAction = action;

  setStatus('busy', 'Генерация...');
  resultSection.style.display = 'flex';
  genBar.style.display = 'block';
  resultText.textContent = '';
  resultText.style.color = '';
  document.querySelectorAll('.action-btn').forEach(b => b.disabled = true);

  const original = text;

  try {
    lastResult = await runAction(action, text, instruction, (partial) => {
      resultText.textContent = partial;
    });
    genBar.style.display = 'none';
    setStatus('ready', 'Готово');

    // save history
    const saveH = await chrome.storage.sync.get({ saveHistory: true });
    if (saveH.saveHistory) {
      chrome.runtime.sendMessage({
        type: 'SAVE_HISTORY',
        entry: { action, original, result: lastResult }
      });
    }
    // update stats
    chrome.runtime.sendMessage({ type: 'UPDATE_STATS', action, chars: original.length });

  } catch(e) {
    genBar.style.display = 'none';
    resultText.textContent = '⚠ Ошибка: ' + e.message;
    resultText.style.color = '#f87171';
    setStatus('error', 'Ошибка');
  }

  isGenerating = false;
  document.querySelectorAll('.action-btn').forEach(b => b.disabled = false);
}

// Action button clicks
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (!text) { inputText.focus(); inputText.placeholder = '← Введите текст здесь'; return; }
    generate(btn.dataset.action, text);
  });
});

// Custom
customRunBtn.addEventListener('click', () => {
  const text = inputText.value.trim();
  const instr = customPrompt.value.trim();
  if (!text || !instr) return;
  generate('custom', text, instr);
});
customPrompt.addEventListener('keydown', e => { if (e.key === 'Enter') customRunBtn.click(); });

// Result actions
copyResultBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(lastResult);
  copyResultBtn.textContent = '✓ Скопировано';
  setTimeout(() => { copyResultBtn.textContent = '📋 Копировать'; }, 1500);
});

insertResultBtn.addEventListener('click', async () => {
  if (!lastResult) return;
  // try inject into active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {
        const el = document.querySelector('.__smarttext_target__') || document.activeElement;
        if (!el) return false;
        if (el.isContentEditable) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount) {
            const r = sel.getRangeAt(0);
            r.deleteContents();
            r.insertNode(document.createTextNode(text));
          } else { el.textContent += text; }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const s = el.selectionStart, end = el.selectionEnd;
          el.value = el.value.slice(0, s) + text + el.value.slice(end);
          el.setSelectionRange(s, s + text.length);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      },
      args: [lastResult]
    }).catch(() => {});
    // also send to content script
    chrome.tabs.sendMessage(tab.id, { type: 'INSERT_RESULT', text: lastResult }).catch(() => {});
  }
  insertResultBtn.textContent = '✓ Вставлено';
  setTimeout(() => { insertResultBtn.textContent = '↩ Вставить'; }, 1500);
});

clearResultBtn.addEventListener('click', () => {
  resultSection.style.display = 'none';
  resultText.textContent = '';
  resultText.style.color = '';
  lastResult = '';
});

// ---- RECEIVE FROM BACKGROUND ----
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'RUN_ACTION') {
    inputText.value = msg.text || '';
    lastTabId = msg.tabId || null;
    // switch to actions tab
    document.querySelector('.tab[data-tab="actions"]')?.click();
    generate(msg.action, msg.text);
  }
  if (msg.type === 'NAV_SETTINGS') {
    document.querySelector('.tab[data-tab="settings"]')?.click();
  }
});

async function checkPending() {
  const data = await chrome.storage.session.get('pendingAction');
  if (data.pendingAction) {
    await chrome.storage.session.remove('pendingAction');
    const { action, text, tabId } = data.pendingAction;
    inputText.value = text || '';
    lastTabId = tabId || null;
    generate(action, text);
  }
}

// ---- HISTORY ----
async function renderHistory() {
  const history = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
  historyList.innerHTML = '';
  if (!history.length) { historyList.innerHTML = '<div class="empty-state">История пуста</div>'; return; }
  for (const item of history) {
    const meta = ACTION_META[item.action] || { label: item.action, icon: '✦' };
    const date = new Date(item.ts);
    const timeStr = date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <div class="history-head">
        <span class="history-action">${meta.icon} ${meta.label.toUpperCase()}</span>
        <span class="history-ts">${timeStr}</span>
      </div>
      <div class="history-body">
        <div class="history-before">${escHtml(item.original?.slice(0, 120) || '')}${item.original?.length > 120 ? '…' : ''}</div>
        <div class="history-arrow">↓</div>
        <div class="history-after">${escHtml(item.result?.slice(0, 120) || '')}${item.result?.length > 120 ? '…' : ''}</div>
      </div>
      <div class="history-footer">
        <button class="mini-btn h-copy" data-text="${escAttr(item.result)}">📋 Копировать</button>
        <button class="mini-btn h-use" data-text="${escAttr(item.result)}">← Использовать</button>
      </div>
    `;
    el.querySelector('.h-copy').addEventListener('click', function() {
      navigator.clipboard.writeText(this.dataset.text);
    });
    el.querySelector('.h-use').addEventListener('click', function() {
      inputText.value = this.dataset.text;
      document.querySelector('.tab[data-tab="actions"]')?.click();
    });
    historyList.appendChild(el);
  }
}

clearHistoryBtn?.addEventListener('click', async () => {
  await chrome.storage.local.set({ history: [] });
  renderHistory();
});

// ---- STATS ----
async function renderStats() {
  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  const total = Object.entries(stats).filter(([k]) => k !== '_chars').reduce((s, [,v]) => s + v, 0);
  const chars = stats._chars || 0;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statChars').textContent = chars.toLocaleString('ru');
  document.getElementById('statTime').textContent = Math.round(total * 0.5) + ' мин';

  const grid = document.getElementById('actionStats');
  grid.innerHTML = '';
  const max = Math.max(...Object.values(stats).filter((v,_,arr) => true).filter((v,i,a) => true), 1);
  for (const [action, count] of Object.entries(stats)) {
    if (action === '_chars' || !count) continue;
    const meta = ACTION_META[action] || { label: action, icon: '✦' };
    const pct = Math.round((count / (total || 1)) * 100);
    const row = document.createElement('div');
    row.className = 'as-row';
    row.innerHTML = `
      <div class="as-name">${meta.icon} ${meta.label}</div>
      <div class="as-bar-wrap"><div class="as-bar" style="width:${pct}%"></div></div>
      <div class="as-count">${count}</div>
    `;
    grid.appendChild(row);
  }
  if (!grid.children.length) grid.innerHTML = '<div class="empty-state">Ещё нет данных</div>';
}

// ---- SETTINGS ----
async function loadSettings() {
  const s = await chrome.storage.sync.get({
    model: 'chrome-prompt-api',
    temperature: 0.7,
    maxTokens: 500,
    showPanel: true,
    panelDelay: 300,
    saveHistory: true,
    showNotify: true,
  });
  const modelSelect = document.getElementById('settingModel');
  const hasModelOption = Array.from(modelSelect.options).some((opt) => opt.value === s.model);
  modelSelect.value = hasModelOption ? s.model : 'chrome-prompt-api';
  document.getElementById('settingTemp').value = s.temperature;
  document.getElementById('tempVal').textContent = s.temperature;
  document.getElementById('settingMaxTok').value = s.maxTokens;
  document.getElementById('maxTokVal').textContent = s.maxTokens;
  document.getElementById('settingPanel').checked = s.showPanel;
  document.getElementById('settingDelay').value = s.panelDelay;
  document.getElementById('delayVal').textContent = s.panelDelay;
  document.getElementById('settingHistory').checked = s.saveHistory;
  document.getElementById('settingNotify').checked = s.showNotify;
}

['settingTemp','settingMaxTok','settingDelay'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', function() {
    const map = { settingTemp: 'tempVal', settingMaxTok: 'maxTokVal', settingDelay: 'delayVal' };
    document.getElementById(map[id]).textContent = this.value;
  });
});

saveSettingsBtn?.addEventListener('click', async () => {
  const settings = {
    model:       document.getElementById('settingModel').value,
    temperature: parseFloat(document.getElementById('settingTemp').value),
    maxTokens:   parseInt(document.getElementById('settingMaxTok').value),
    showPanel:   document.getElementById('settingPanel').checked,
    panelDelay:  parseInt(document.getElementById('settingDelay').value),
    saveHistory: document.getElementById('settingHistory').checked,
    showNotify:  document.getElementById('settingNotify').checked,
  };
  await chrome.storage.sync.set(settings);
  saveSettingsBtn.textContent = '✓ Сохранено';
  setTimeout(() => { saveSettingsBtn.textContent = 'Сохранить настройки'; }, 1500);
});

// ---- UTILS ----
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(str) {
  return (str || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ---- START ----
init();
