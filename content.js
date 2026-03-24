// content.js — SmartText content script
// Created by ASTUS LAB
// Плавающая панель над выделением + горячие клавиши

const ALL_ACTIONS = [
  { id: 'fix',     label: 'Исправить',    icon: '✨' },
  { id: 'shorter', label: 'Короче',       icon: '📝' },
  { id: 'longer',  label: 'Длиннее',      icon: '📖' },
  { id: 'polite',  label: 'Вежливее',     icon: '😊' },
  { id: 'to_ru',   label: 'На русский',   icon: '🌐' },
  { id: 'to_en',   label: 'На English',   icon: '🌐' },
  { id: 'to_es',   label: 'На Spanish',   icon: '🌐' },
  { id: 'to_de',   label: 'На German',    icon: '🌐' },
  { id: 'to_fr',   label: 'На French',    icon: '🌐' },
  { id: 'to_it',   label: 'На Italian',   icon: '🌐' },
  { id: 'to_pt',   label: 'На Portuguese', icon: '🌐' },
  { id: 'to_ja',   label: 'На Japanese',  icon: '🌐' },
  { id: 'to_uk',   label: 'На украинский', icon: '🌐' },
  { id: 'to_pl',   label: 'На польский',  icon: '🌐' },
  { id: 'formal',  label: 'Формально',    icon: '💼' },
  { id: 'casual',  label: 'Просто',       icon: '💬' },
];

const ACTION_MAP = new Map(ALL_ACTIONS.map((a) => [a.id, a]));
const DEFAULT_ENABLED_ACTIONS = ['fix', 'shorter', 'longer', 'polite', 'to_ru', 'to_en', 'formal', 'casual'];
const HOTKEY_MAP = {
  g: 'fix',
  s: 'shorter',
  l: 'longer',
  p: 'polite',
  r: 'to_ru',
  e: 'to_en'
};

const panelSettings = {
  showPanel: true,
  panelDelay: 300,
  enabledActions: [...DEFAULT_ENABLED_ACTIONS]
};

let panel = null;
let showTimer = null;
let lastTarget = null;

function normalizeEnabledActions(list) {
  const source = Array.isArray(list) ? list : DEFAULT_ENABLED_ACTIONS;
  const unique = [...new Set(source)];
  const filtered = unique.filter((id) => ACTION_MAP.has(id));
  return filtered.length ? filtered : ['fix'];
}

function getVisibleActions() {
  return panelSettings.enabledActions
    .map((id) => ACTION_MAP.get(id))
    .filter(Boolean);
}

async function loadPanelSettings() {
  const s = await chrome.storage.sync.get({
    showPanel: true,
    panelDelay: 300,
    enabledActions: DEFAULT_ENABLED_ACTIONS
  });

  panelSettings.showPanel = !!s.showPanel;
  panelSettings.panelDelay = Math.min(1000, Math.max(100, Number(s.panelDelay) || 300));
  panelSettings.enabledActions = normalizeEnabledActions(s.enabledActions);

  if (panel) createPanel();
}

function createPanel() {
  if (panel) panel.remove();

  const actions = getVisibleActions();
  panel = document.createElement('div');
  panel.id = '__smarttext_panel__';
  panel.innerHTML = `
    <div class="st-inner">
      <div class="st-logo">✦ SmartText</div>
      <div class="st-actions">
        ${actions.map((a) => `<button class="st-btn" data-action="${a.id}" title="${a.label}">${a.icon} ${a.label}</button>`).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  panel.querySelectorAll('.st-btn').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const action = btn.dataset.action;
      const text = window.getSelection().toString().trim();
      if (text) triggerAction(action, text);
      hidePanel();
    });
  });

  return panel;
}

function positionPanel(rect) {
  if (!panel) return;
  const panelW = panel.offsetWidth || 540;
  const panelH = panel.offsetHeight || 44;
  const margin = 8;

  let top = rect.top + window.scrollY - panelH - margin;
  let left = rect.left + window.scrollX + rect.width / 2 - panelW / 2;

  left = Math.max(margin, Math.min(left, window.innerWidth - panelW - margin));
  if (top < window.scrollY + margin) top = rect.bottom + window.scrollY + margin;

  panel.style.top = top + 'px';
  panel.style.left = left + 'px';
  panel.style.opacity = '1';
  panel.style.transform = 'translateY(0) scale(1)';
}

function showPanel(rect) {
  if (!panelSettings.showPanel) return;
  if (!getVisibleActions().length) return;
  if (!panel || !document.getElementById('__smarttext_panel__')) createPanel();

  panel.style.opacity = '0';
  panel.style.transform = 'translateY(-4px) scale(0.97)';
  panel.style.display = 'block';
  requestAnimationFrame(() => positionPanel(rect));
}

function hidePanel() {
  if (!panel) return;
  panel.style.opacity = '0';
  panel.style.transform = 'translateY(-4px) scale(0.97)';
  setTimeout(() => {
    if (panel) panel.style.display = 'none';
  }, 200);
}

function triggerAction(action, text) {
  lastTarget = document.activeElement;
  if (lastTarget) lastTarget.classList.add('__smarttext_target__');

  chrome.runtime.sendMessage({
    type: 'CONTENT_ACTION',
    action,
    text,
  });
}

document.addEventListener('mouseup', (e) => {
  if (e.target.closest('#__smarttext_panel__')) return;
  clearTimeout(showTimer);
  showTimer = setTimeout(() => {
    if (!panelSettings.showPanel) {
      hidePanel();
      return;
    }
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 2) {
      hidePanel();
      return;
    }
    if (!sel.rangeCount) {
      hidePanel();
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showPanel(rect);
  }, panelSettings.panelDelay);
});

document.addEventListener('mousedown', (e) => {
  if (e.target.closest('#__smarttext_panel__')) return;
  clearTimeout(showTimer);
  hidePanel();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hidePanel();

  if (e.ctrlKey && e.shiftKey) {
    const action = HOTKEY_MAP[e.key.toLowerCase()];
    if (action && panelSettings.enabledActions.includes(action)) {
      const text = window.getSelection().toString().trim();
      if (text) {
        e.preventDefault();
        triggerAction(action, text);
      }
    }
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'INSERT_RESULT') {
    const target = document.querySelector('.__smarttext_target__') || document.activeElement;
    if (!target) return;
    target.classList.remove('__smarttext_target__');
    const text = msg.text;
    if (target.isContentEditable) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        sel.deleteFromDocument();
        sel.getRangeAt(0).insertNode(document.createTextNode(text));
        sel.collapseToEnd();
      } else {
        target.textContent += text;
      }
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      const s = target.selectionStart;
      const end = target.selectionEnd;
      target.value = target.value.slice(0, s) + text + target.value.slice(end);
      target.setSelectionRange(s, s + text.length);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  if (msg.type === 'SMARTTEXT_SETTINGS_UPDATED') {
    loadPanelSettings().catch(() => {});
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;
  if (changes.showPanel || changes.panelDelay || changes.enabledActions) {
    loadPanelSettings().catch(() => {});
  }
});

loadPanelSettings().catch(() => {});
