// content.js — SmartText content script
// Created by ASTUS LAB
// Плавающая панель над выделением + горячие клавиши

const ALL_ACTIONS = [
  { id: 'fix',     icon: '✨' },
  { id: 'shorter', icon: '📝' },
  { id: 'longer',  icon: '📖' },
  { id: 'polite',  icon: '😊' },
  { id: 'to_ru',   icon: '🌐' },
  { id: 'to_en',   icon: '🌐' },
  { id: 'to_es',   icon: '🌐' },
  { id: 'to_de',   icon: '🌐' },
  { id: 'to_fr',   icon: '🌐' },
  { id: 'to_it',   icon: '🌐' },
  { id: 'to_pt',   icon: '🌐' },
  { id: 'to_ja',   icon: '🌐' },
  { id: 'to_uk',   icon: '🌐' },
  { id: 'to_pl',   icon: '🌐' },
  { id: 'formal',  icon: '💼' },
  { id: 'casual',  icon: '💬' },
];

const ACTION_LABELS = {
  ru: {
    fix: 'Исправить',
    shorter: 'Короче',
    longer: 'Длиннее',
    polite: 'Вежливее',
    to_ru: 'На русский',
    to_en: 'На английский',
    to_es: 'На испанский',
    to_de: 'На немецкий',
    to_fr: 'На французский',
    to_it: 'На итальянский',
    to_pt: 'На португальский',
    to_ja: 'На японский',
    to_uk: 'На украинский',
    to_pl: 'На польский',
    formal: 'Формально',
    casual: 'Просто',
  },
  en: {
    fix: 'Fix',
    shorter: 'Shorter',
    longer: 'Longer',
    polite: 'Polite',
    to_ru: 'To Russian',
    to_en: 'To English',
    to_es: 'To Spanish',
    to_de: 'To German',
    to_fr: 'To French',
    to_it: 'To Italian',
    to_pt: 'To Portuguese',
    to_ja: 'To Japanese',
    to_uk: 'To Ukrainian',
    to_pl: 'To Polish',
    formal: 'Formal',
    casual: 'Casual',
  },
  es: {
    fix: 'Corregir',
    shorter: 'Más corto',
    longer: 'Más largo',
    polite: 'Más cortés',
    to_ru: 'A ruso',
    to_en: 'A inglés',
    to_es: 'A español',
    to_de: 'A alemán',
    to_fr: 'A francés',
    to_it: 'A italiano',
    to_pt: 'A portugués',
    to_ja: 'A japonés',
    to_uk: 'A ucraniano',
    to_pl: 'A polaco',
    formal: 'Formal',
    casual: 'Casual',
  },
  de: {
    fix: 'Korrigieren',
    shorter: 'Kürzer',
    longer: 'Länger',
    polite: 'Höflicher',
    to_ru: 'Auf Russisch',
    to_en: 'Auf Englisch',
    to_es: 'Auf Spanisch',
    to_de: 'Auf Deutsch',
    to_fr: 'Auf Französisch',
    to_it: 'Auf Italienisch',
    to_pt: 'Auf Portugiesisch',
    to_ja: 'Auf Japanisch',
    to_uk: 'Auf Ukrainisch',
    to_pl: 'Auf Polnisch',
    formal: 'Formell',
    casual: 'Locker',
  },
  fr: {
    fix: 'Corriger',
    shorter: 'Plus court',
    longer: 'Plus long',
    polite: 'Plus poli',
    to_ru: 'Vers russe',
    to_en: 'Vers anglais',
    to_es: 'Vers espagnol',
    to_de: 'Vers allemand',
    to_fr: 'Vers français',
    to_it: 'Vers italien',
    to_pt: 'Vers portugais',
    to_ja: 'Vers japonais',
    to_uk: 'Vers ukrainien',
    to_pl: 'Vers polonais',
    formal: 'Formel',
    casual: 'Décontracté',
  },
  it: {
    fix: 'Correggi',
    shorter: 'Più breve',
    longer: 'Più lungo',
    polite: 'Più cortese',
    to_ru: 'In russo',
    to_en: 'In inglese',
    to_es: 'In spagnolo',
    to_de: 'In tedesco',
    to_fr: 'In francese',
    to_it: 'In italiano',
    to_pt: 'In portoghese',
    to_ja: 'In giapponese',
    to_uk: 'In ucraino',
    to_pl: 'In polacco',
    formal: 'Formale',
    casual: 'Informale',
  },
  pt: {
    fix: 'Corrigir',
    shorter: 'Mais curto',
    longer: 'Mais longo',
    polite: 'Mais educado',
    to_ru: 'Para russo',
    to_en: 'Para inglês',
    to_es: 'Para espanhol',
    to_de: 'Para alemão',
    to_fr: 'Para francês',
    to_it: 'Para italiano',
    to_pt: 'Para português',
    to_ja: 'Para japonês',
    to_uk: 'Para ucraniano',
    to_pl: 'Para polonês',
    formal: 'Formal',
    casual: 'Casual',
  },
  ja: {
    fix: '修正',
    shorter: '短く',
    longer: '長く',
    polite: '丁寧に',
    to_ru: 'ロシア語へ',
    to_en: '英語へ',
    to_es: 'スペイン語へ',
    to_de: 'ドイツ語へ',
    to_fr: 'フランス語へ',
    to_it: 'イタリア語へ',
    to_pt: 'ポルトガル語へ',
    to_ja: '日本語へ',
    to_uk: 'ウクライナ語へ',
    to_pl: 'ポーランド語へ',
    formal: 'フォーマル',
    casual: 'カジュアル',
  },
  uk: {
    fix: 'Виправити',
    shorter: 'Коротше',
    longer: 'Довше',
    polite: 'Ввічливіше',
    to_ru: 'На російську',
    to_en: 'На англійську',
    to_es: 'На іспанську',
    to_de: 'На німецьку',
    to_fr: 'На французьку',
    to_it: 'На італійську',
    to_pt: 'На португальську',
    to_ja: 'На японську',
    to_uk: 'На українську',
    to_pl: 'На польську',
    formal: 'Формально',
    casual: 'Просто',
  },
  pl: {
    fix: 'Popraw',
    shorter: 'Krócej',
    longer: 'Dłużej',
    polite: 'Uprzejmiej',
    to_ru: 'Na rosyjski',
    to_en: 'Na angielski',
    to_es: 'Na hiszpański',
    to_de: 'Na niemiecki',
    to_fr: 'Na francuski',
    to_it: 'Na włoski',
    to_pt: 'Na portugalski',
    to_ja: 'Na japoński',
    to_uk: 'Na ukraiński',
    to_pl: 'Na polski',
    formal: 'Formalnie',
    casual: 'Swobodnie',
  }
};

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
  uiLanguage: 'auto',
  enabledActions: [...DEFAULT_ENABLED_ACTIONS]
};

let panel = null;
let showTimer = null;
let lastTarget = null;
let uiLang = 'ru';
const SUPPORTED_UI_LANGS = ['ru', 'en', 'es', 'de', 'fr', 'it', 'pt', 'ja', 'uk', 'pl'];

function resolveUiLanguage(configValue) {
  if (SUPPORTED_UI_LANGS.includes(configValue)) return configValue;
  const browserLang = String(globalThis.navigator?.language || '').toLowerCase();
  for (const lang of SUPPORTED_UI_LANGS) {
    if (browserLang.startsWith(`${lang}-`) || browserLang === lang) return lang;
  }
  return 'en';
}

function getActionLabel(actionId) {
  return ACTION_LABELS[uiLang]?.[actionId] || ACTION_LABELS.en[actionId] || actionId;
}

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
    uiLanguage: 'auto',
    enabledActions: DEFAULT_ENABLED_ACTIONS
  });

  panelSettings.showPanel = !!s.showPanel;
  panelSettings.panelDelay = Math.min(1000, Math.max(100, Number(s.panelDelay) || 300));
  panelSettings.uiLanguage = s.uiLanguage || 'auto';
  uiLang = resolveUiLanguage(panelSettings.uiLanguage);
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
        ${actions.map((a) => {
          const label = getActionLabel(a.id);
          return `<button class="st-btn" data-action="${a.id}" title="${label}">${a.icon} ${label}</button>`;
        }).join('')}
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
  if (changes.showPanel || changes.panelDelay || changes.enabledActions || changes.uiLanguage) {
    loadPanelSettings().catch(() => {});
  }
});

loadPanelSettings().catch(() => {});
