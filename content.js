// content.js — SmartText content script
// Created by ASTUS LAB
// Плавающая панель над выделением + горячие клавиши

const ACTIONS = [
  { id: 'fix',     label: 'Исправить', icon: '✨' },
  { id: 'shorter', label: 'Короче',    icon: '📝' },
  { id: 'longer',  label: 'Длиннее',   icon: '📖' },
  { id: 'polite',  label: 'Вежливее',  icon: '😊' },
  { id: 'to_ru',   label: 'На русский',icon: '🌍' },
  { id: 'to_en',   label: 'English',   icon: '🌍' },
  { id: 'formal',  label: 'Формально', icon: '💼' },
];

let panel = null;
let showTimer = null;
let lastTarget = null;

// ---- CREATE PANEL ----
function createPanel() {
  if (panel) panel.remove();
  panel = document.createElement('div');
  panel.id = '__smarttext_panel__';
  panel.innerHTML = `
    <div class="st-inner">
      <div class="st-logo">✦ SmartText</div>
      <div class="st-actions">
        ${ACTIONS.map(a => `<button class="st-btn" data-action="${a.id}" title="${a.label}">${a.icon} ${a.label}</button>`).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  panel.querySelectorAll('.st-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const action = btn.dataset.action;
      const text = window.getSelection().toString().trim();
      if (text) {
        triggerAction(action, text);
      }
      hidePanel();
    });
  });

  return panel;
}

// ---- POSITION PANEL ----
function positionPanel(rect) {
  if (!panel) return;
  const panelW = panel.offsetWidth || 480;
  const panelH = panel.offsetHeight || 44;
  const margin = 8;

  let top = rect.top + window.scrollY - panelH - margin;
  let left = rect.left + window.scrollX + rect.width / 2 - panelW / 2;

  // clamp
  left = Math.max(margin, Math.min(left, window.innerWidth - panelW - margin));
  if (top < window.scrollY + margin) top = rect.bottom + window.scrollY + margin;

  panel.style.top = top + 'px';
  panel.style.left = left + 'px';
  panel.style.opacity = '1';
  panel.style.transform = 'translateY(0) scale(1)';
}

// ---- SHOW / HIDE ----
function showPanel(rect) {
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
  setTimeout(() => { if (panel) panel.style.display = 'none'; }, 200);
}

// ---- TRIGGER ACTION ----
function triggerAction(action, text) {
  // remember target for injection
  lastTarget = document.activeElement;
  if (lastTarget) lastTarget.classList.add('__smarttext_target__');

  chrome.runtime.sendMessage({
    type: 'CONTENT_ACTION',
    action,
    text,
  });
}

// ---- SELECTION HANDLER ----
document.addEventListener('mouseup', (e) => {
  if (e.target.closest('#__smarttext_panel__')) return;
  clearTimeout(showTimer);
  showTimer = setTimeout(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 2) { hidePanel(); return; }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showPanel(rect);
  }, 300);
});

document.addEventListener('mousedown', (e) => {
  if (e.target.closest('#__smarttext_panel__')) return;
  clearTimeout(showTimer);
  hidePanel();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hidePanel();

  // hotkeys
  if (e.ctrlKey && e.shiftKey) {
    const map = { g: 'fix', s: 'shorter', l: 'longer', p: 'polite', r: 'to_ru', e: 'to_en' };
    const action = map[e.key.toLowerCase()];
    if (action) {
      const text = window.getSelection().toString().trim();
      if (text) { e.preventDefault(); triggerAction(action, text); }
    }
  }
});

// ---- RECEIVE RESULT FROM SIDEPANEL ----
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'INSERT_RESULT') {
    const target = document.querySelector('.__smarttext_target__') || document.activeElement;
    if (!target) return;
    target.classList.remove('__smarttext_target__');
    const text = msg.text;
    if (target.isContentEditable) {
      // contenteditable
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
      const s = target.selectionStart, end = target.selectionEnd;
      target.value = target.value.slice(0, s) + text + target.value.slice(end);
      target.setSelectionRange(s, s + text.length);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
});
