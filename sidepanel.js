// sidepanel.js — SmartText Side Panel Logic
// Created by ASTUS LAB
import { initLocalAI, runAction, warmupLocalAI } from './ai/index.js';
import { ACTION_META } from './ai/prompts.js';

const ALL_ACTION_IDS = Object.keys(ACTION_META);
const DEFAULT_ENABLED_ACTIONS = [...ALL_ACTION_IDS];
const DEFAULT_SETTINGS = {
  model: 'chrome-prompt-api',
  temperature: 0.7,
  maxTokens: 500,
  showPanel: true,
  panelDelay: 300,
  saveHistory: true,
  showNotify: true,
  syncHistory: false,
  preloadModel: true,
  enabledActions: DEFAULT_ENABLED_ACTIONS
};

// ---- STATE ----
let isReady = false;
let isGenerating = false;
let lastResult = '';
let lastTabId = null;
let currentAction = null;
let appSettings = { ...DEFAULT_SETTINGS };
let templates = [];

// ---- DOM ----
const mainApp = document.getElementById('mainApp');
const statusDot = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const inputText = document.getElementById('inputText');
const actionsGrid = document.getElementById('actionsGrid');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const genBar = document.getElementById('generatingBar');
const copyResultBtn = document.getElementById('copyResultBtn');
const insertResultBtn = document.getElementById('insertResultBtn');
const clearResultBtn = document.getElementById('clearResultBtn');
const customPrompt = document.getElementById('customPrompt');
const customRunBtn = document.getElementById('customRunBtn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const actionsToggleList = document.getElementById('actionsToggleList');
const settingModel = document.getElementById('settingModel');
const settingTemp = document.getElementById('settingTemp');
const tempVal = document.getElementById('tempVal');
const settingMaxTok = document.getElementById('settingMaxTok');
const maxTokVal = document.getElementById('maxTokVal');
const settingPanel = document.getElementById('settingPanel');
const settingDelay = document.getElementById('settingDelay');
const delayVal = document.getElementById('delayVal');
const settingHistory = document.getElementById('settingHistory');
const settingNotify = document.getElementById('settingNotify');
const settingSyncHistory = document.getElementById('settingSyncHistory');
const settingPreload = document.getElementById('settingPreload');
const templateNameInput = document.getElementById('templateNameInput');
const templatePromptInput = document.getElementById('templatePromptInput');
const addTemplateBtn = document.getElementById('addTemplateBtn');
const templatesList = document.getElementById('templatesList');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const helpShortcutsList = document.getElementById('helpShortcutsList');

// ---- UTILS ----
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setStatus(state, label) {
  statusDot.className = 'status-dot ' + state;
  statusLabel.textContent = label;
}

function normalizeEnabledActions(list) {
  const source = Array.isArray(list) ? list : DEFAULT_ENABLED_ACTIONS;
  const unique = [...new Set(source)];
  const filtered = unique.filter((id) => ACTION_META[id]);
  return filtered.length ? filtered : ['fix'];
}

function showMain() {
  mainApp.style.display = 'flex';
  mainApp.style.flexDirection = 'column';
  mainApp.style.flex = '1';
  mainApp.style.overflow = 'hidden';
  isReady = true;
}

function readCheckedActionsFromSettings() {
  const ids = [...actionsToggleList.querySelectorAll('input[type="checkbox"]:checked')].map((el) => el.value);
  return normalizeEnabledActions(ids);
}

function actionButtonHtml(actionId) {
  const meta = ACTION_META[actionId];
  if (!meta) return '';
  return `
    <button class="action-btn" data-action="${actionId}">
      <span class="action-icon">${meta.icon || '✦'}</span>
      <span class="action-label">${escHtml(meta.label || actionId)}</span>
      <span class="action-hint">${escHtml(meta.shortcut || '')}</span>
    </button>
  `;
}

function renderActionButtons() {
  const ids = normalizeEnabledActions(appSettings.enabledActions);
  actionsGrid.innerHTML = ids.map(actionButtonHtml).join('');
}

function renderActionToggles() {
  const enabled = new Set(normalizeEnabledActions(appSettings.enabledActions));
  actionsToggleList.innerHTML = ALL_ACTION_IDS.map((id) => {
    const meta = ACTION_META[id];
    return `
      <label class="action-toggle-item">
        <input type="checkbox" value="${id}" ${enabled.has(id) ? 'checked' : ''}>
        <span class="action-toggle-label">${escHtml(meta.icon)} ${escHtml(meta.label)}</span>
      </label>
    `;
  }).join('');
}

function applySettingsToUi() {
  const hasModelOption = [...settingModel.options].some((opt) => opt.value === appSettings.model);
  settingModel.value = hasModelOption ? appSettings.model : DEFAULT_SETTINGS.model;
  settingTemp.value = appSettings.temperature;
  tempVal.textContent = appSettings.temperature;
  settingMaxTok.value = appSettings.maxTokens;
  maxTokVal.textContent = appSettings.maxTokens;
  settingPanel.checked = appSettings.showPanel;
  settingDelay.value = appSettings.panelDelay;
  delayVal.textContent = appSettings.panelDelay;
  settingHistory.checked = appSettings.saveHistory;
  settingNotify.checked = appSettings.showNotify;
  settingSyncHistory.checked = appSettings.syncHistory;
  settingPreload.checked = appSettings.preloadModel;
  renderActionToggles();
}

async function loadSettings() {
  const s = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  appSettings = {
    ...DEFAULT_SETTINGS,
    ...s,
    enabledActions: normalizeEnabledActions(s.enabledActions)
  };
  applySettingsToUi();
  renderActionButtons();
}

function renderHelpShortcuts() {
  if (!helpShortcutsList) return;
  const enabled = new Set(normalizeEnabledActions(appSettings.enabledActions));
  const items = Object.entries(ACTION_META)
    .filter(([id, meta]) => meta.shortcut && enabled.has(id))
    .map(([, meta]) => ({ label: meta.label, shortcut: meta.shortcut }));

  items.push({ label: 'Закрыть плавающую панель', shortcut: 'Esc' });

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

function normalizeTemplates(list) {
  const source = Array.isArray(list) ? list : [];
  return source
    .map((tpl) => ({
      id: String(tpl.id || ''),
      name: String(tpl.name || '').trim().slice(0, 60),
      prompt: String(tpl.prompt || '').trim().slice(0, 400)
    }))
    .filter((tpl) => tpl.id && tpl.name && tpl.prompt)
    .slice(0, 20);
}

async function saveTemplates() {
  await chrome.storage.sync.set({ promptTemplates: templates });
}

function renderTemplates() {
  if (!templates.length) {
    templatesList.innerHTML = '<div class="empty-state">Шаблонов пока нет</div>';
    return;
  }

  templatesList.innerHTML = templates.map((tpl) => `
    <div class="template-item">
      <div class="template-name">${escHtml(tpl.name)}</div>
      <div class="template-prompt">${escHtml(tpl.prompt)}</div>
      <div class="template-actions">
        <button class="mini-btn t-run" data-id="${escAttr(tpl.id)}">▶ Применить</button>
        <button class="mini-btn danger t-del" data-id="${escAttr(tpl.id)}">Удалить</button>
      </div>
    </div>
  `).join('');
}

async function loadTemplates() {
  const data = await chrome.storage.sync.get({ promptTemplates: [] });
  templates = normalizeTemplates(data.promptTemplates);
  renderTemplates();
}

async function addTemplate() {
  const name = String(templateNameInput.value || '').trim();
  const prompt = String(templatePromptInput.value || '').trim();
  if (!name || !prompt) return;

  const entry = {
    id: 'tpl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    name: name.slice(0, 60),
    prompt: prompt.slice(0, 400)
  };

  templates.unshift(entry);
  templates = templates.slice(0, 20);
  await saveTemplates();
  renderTemplates();
  templateNameInput.value = '';
  templatePromptInput.value = '';
}

function csvEscape(value) {
  const s = String(value ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function buildExportFilename(ext) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  return `smarttext-history-${stamp}.${ext}`;
}

async function exportHistory(format) {
  const history = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
  if (!history.length) {
    setStatus('error', 'История пуста');
    return;
  }

  if (format === 'json') {
    downloadFile(
      JSON.stringify(history, null, 2),
      buildExportFilename('json'),
      'application/json;charset=utf-8'
    );
    return;
  }

  const header = ['timestamp', 'action', 'original', 'result'];
  const rows = history.map((item) => [
    new Date(item.ts || Date.now()).toISOString(),
    item.action || '',
    item.original || '',
    item.result || '',
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
  downloadFile(csv, buildExportFilename('csv'), 'text/csv;charset=utf-8');
}

function setActionsDisabled(disabled) {
  actionsGrid.querySelectorAll('.action-btn').forEach((b) => {
    b.disabled = disabled;
  });
}

async function generate(action, text, instruction = '') {
  if (isGenerating || !text.trim()) return;
  isGenerating = true;
  currentAction = action;

  setStatus('busy', 'Генерация...');
  resultSection.style.display = 'flex';
  genBar.style.display = 'block';
  resultText.textContent = '';
  resultText.style.color = '';
  setActionsDisabled(true);

  const original = text;

  try {
    lastResult = await runAction(action, text, instruction, (partial) => {
      resultText.textContent = partial;
    });
    genBar.style.display = 'none';
    setStatus('ready', 'Готово');

    if (appSettings.saveHistory) {
      chrome.runtime.sendMessage({
        type: 'SAVE_HISTORY',
        entry: { action, original, result: lastResult }
      });
    }
    chrome.runtime.sendMessage({ type: 'UPDATE_STATS', action, chars: original.length });
  } catch (e) {
    genBar.style.display = 'none';
    resultText.textContent = '⚠ Ошибка: ' + e.message;
    resultText.style.color = '#f87171';
    setStatus('error', 'Ошибка');
  }

  isGenerating = false;
  setActionsDisabled(false);
}

async function renderHistory() {
  const history = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
  historyList.innerHTML = '';
  if (!history.length) {
    historyList.innerHTML = '<div class="empty-state">История пуста</div>';
    return;
  }

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
        <div class="history-before">${escHtml(item.original?.slice(0, 140) || '')}${item.original?.length > 140 ? '…' : ''}</div>
        <div class="history-arrow">↓</div>
        <div class="history-after">${escHtml(item.result?.slice(0, 140) || '')}${item.result?.length > 140 ? '…' : ''}</div>
      </div>
      <div class="history-footer">
        <button class="mini-btn h-copy" data-text="${escAttr(item.result)}">📋 Копировать</button>
        <button class="mini-btn h-use" data-text="${escAttr(item.result)}">← Использовать</button>
      </div>
    `;
    el.querySelector('.h-copy').addEventListener('click', function () {
      navigator.clipboard.writeText(this.dataset.text);
    });
    el.querySelector('.h-use').addEventListener('click', function () {
      inputText.value = this.dataset.text;
      document.querySelector('.tab[data-tab="actions"]')?.click();
    });
    historyList.appendChild(el);
  }
}

async function renderStats() {
  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  const total = Object.entries(stats).filter(([k]) => k !== '_chars').reduce((s, [, v]) => s + v, 0);
  const chars = stats._chars || 0;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statChars').textContent = chars.toLocaleString('ru');
  document.getElementById('statTime').textContent = Math.round(total * 0.5) + ' мин';

  const grid = document.getElementById('actionStats');
  grid.innerHTML = '';
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

async function notifySettingsUpdated() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'SMARTTEXT_SETTINGS_UPDATED' }).catch(() => {});
  }
  chrome.runtime.sendMessage({ type: 'REFRESH_CONTEXT_MENUS' }).catch(() => {});
}

async function saveSettings() {
  const settings = {
    model: settingModel.value,
    temperature: parseFloat(settingTemp.value),
    maxTokens: parseInt(settingMaxTok.value, 10),
    showPanel: settingPanel.checked,
    panelDelay: parseInt(settingDelay.value, 10),
    saveHistory: settingHistory.checked,
    showNotify: settingNotify.checked,
    syncHistory: settingSyncHistory.checked,
    preloadModel: settingPreload.checked,
    enabledActions: readCheckedActionsFromSettings()
  };

  appSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    enabledActions: normalizeEnabledActions(settings.enabledActions)
  };

  await chrome.storage.sync.set(appSettings);
  renderActionButtons();
  renderHelpShortcuts();
  await notifySettingsUpdated();

  saveSettingsBtn.textContent = '✓ Сохранено';
  setTimeout(() => {
    saveSettingsBtn.textContent = 'Сохранить настройки';
  }, 1400);
}

async function checkPending() {
  const data = await chrome.storage.session.get('pendingAction');
  if (!data.pendingAction) return;

  await chrome.storage.session.remove('pendingAction');
  const { action, text, tabId } = data.pendingAction;
  inputText.value = text || '';
  lastTabId = tabId || null;
  generate(action, text);
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab)?.classList.add('active');
      if (tab.dataset.tab === 'history') renderHistory();
      if (tab.dataset.tab === 'stats') renderStats();
      if (tab.dataset.tab === 'settings') applySettingsToUi();
    });
  });
}

function bindEvents() {
  actionsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    const text = inputText.value.trim();
    if (!text) {
      inputText.focus();
      inputText.placeholder = '← Введите текст здесь';
      return;
    }
    generate(btn.dataset.action, text);
  });

  customRunBtn.addEventListener('click', () => {
    const text = inputText.value.trim();
    const instr = customPrompt.value.trim();
    if (!text || !instr) return;
    generate('custom', text, instr);
  });

  customPrompt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') customRunBtn.click();
  });

  addTemplateBtn?.addEventListener('click', addTemplate);
  templatePromptInput?.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') addTemplate();
  });

  templatesList?.addEventListener('click', (e) => {
    const runBtn = e.target.closest('.t-run');
    const delBtn = e.target.closest('.t-del');
    if (runBtn) {
      const tpl = templates.find((t) => t.id === runBtn.dataset.id);
      if (!tpl) return;
      const text = inputText.value.trim();
      if (!text) {
        inputText.focus();
        return;
      }
      customPrompt.value = tpl.prompt;
      generate('custom', text, tpl.prompt);
    }
    if (delBtn) {
      templates = templates.filter((t) => t.id !== delBtn.dataset.id);
      saveTemplates().then(renderTemplates);
    }
  });

  copyResultBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lastResult);
    copyResultBtn.textContent = '✓ Скопировано';
    setTimeout(() => {
      copyResultBtn.textContent = '📋 Копировать';
    }, 1400);
  });

  insertResultBtn.addEventListener('click', async () => {
    if (!lastResult) return;
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
            } else {
              el.textContent += text;
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
          if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            const s = el.selectionStart;
            const end = el.selectionEnd;
            el.value = el.value.slice(0, s) + text + el.value.slice(end);
            el.setSelectionRange(s, s + text.length);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
          return false;
        },
        args: [lastResult]
      }).catch(() => {});

      chrome.tabs.sendMessage(tab.id, { type: 'INSERT_RESULT', text: lastResult }).catch(() => {});
    }
    insertResultBtn.textContent = '✓ Вставлено';
    setTimeout(() => {
      insertResultBtn.textContent = '↩ Вставить';
    }, 1400);
  });

  clearResultBtn.addEventListener('click', () => {
    resultSection.style.display = 'none';
    resultText.textContent = '';
    resultText.style.color = '';
    lastResult = '';
  });

  clearHistoryBtn?.addEventListener('click', async () => {
    await chrome.storage.local.set({ history: [] });
    await chrome.storage.sync.set({ historySync: [] });
    renderHistory();
  });

  exportJsonBtn?.addEventListener('click', () => exportHistory('json'));
  exportCsvBtn?.addEventListener('click', () => exportHistory('csv'));

  saveSettingsBtn?.addEventListener('click', saveSettings);

  [settingTemp, settingMaxTok, settingDelay].forEach((el) => {
    el?.addEventListener('input', () => {
      if (el === settingTemp) tempVal.textContent = settingTemp.value;
      if (el === settingMaxTok) maxTokVal.textContent = settingMaxTok.value;
      if (el === settingDelay) delayVal.textContent = settingDelay.value;
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

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'RUN_ACTION') {
      inputText.value = msg.text || '';
      lastTabId = msg.tabId || null;
      document.querySelector('.tab[data-tab="actions"]')?.click();
      generate(msg.action, msg.text);
    }
    if (msg.type === 'NAV_SETTINGS') {
      document.querySelector('.tab[data-tab="settings"]')?.click();
    }
  });
}

async function init() {
  setupTabs();
  bindEvents();
  showMain();
  setStatus('', 'Проверка локального AI...');

  await loadSettings();
  await loadTemplates();
  await checkPending();

  try {
    const aiState = await initLocalAI();
    if (!aiState.available) {
      setStatus('error', aiState.message || 'Локальный AI недоступен');
      return;
    }

    if (appSettings.preloadModel) {
      setStatus('busy', 'Прогрев модели...');
      const warmup = await warmupLocalAI();
      if (warmup.warmed) {
        setStatus('ready', 'Модель прогрета');
      } else {
        setStatus('ready', aiState.message || 'Локальный AI доступен');
      }
    } else {
      setStatus('ready', aiState.message || 'Локальный AI доступен');
    }
  } catch (e) {
    setStatus('error', 'Ошибка инициализации');
    console.error('SmartText init error:', e);
  }
}

init();

