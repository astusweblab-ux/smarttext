# Chrome Web Store Resubmission Checklist (SmartText)

## 1. Why the draft was rejected
- Violation ID: `Red Potassium`
- Reason: metadata does not match actual product functionality.
- Risk keyword from report: `media`

## 2. Safe metadata (RU) to paste into CWS
- Name: `SmartText — локальный AI-редактор текста`
- Short description: `Локальное улучшение текста в браузере: исправление, сокращение, перевод и смена стиля.`
- Full description:
  `SmartText — расширение для локальной обработки текста в браузере. Работает с выделенным текстом и текстом в панели расширения. Доступные функции: исправление грамматики, сокращение и расширение текста, перевод на несколько языков, формальный/разговорный стиль, произвольные промпты, шаблоны, история, статистика, голосовой ввод (если поддерживается браузером), импорт TXT/MD/DOCX/PDF и настраиваемые темы интерфейса. Обработка выполняется локально через Chrome Built-in AI.`

## 3. What NOT to claim in metadata
- Do not claim features you do not implement directly.
- Do not use vague `media` claims (for example: photo/video/audio editing, downloader, player).
- Do not claim impossible or unverifiable features.
- Do not claim official affiliation/endorsement by third parties.

## 4. Screenshots and promo text
- Screenshots must show real SmartText UI only.
- Screenshots should match listed features: actions, translations, settings, themes, history.
- Remove any text on screenshots that implies unsupported functionality.

## 5. Reviewer test instructions (paste into CWS)
1. Open any page with an editable field.
2. Select text and run SmartText from right-click context menu.
3. Open side panel and run actions (`Fix`, `Shorter`, `Longer`, `Polite`, `Translate`).
4. Open `Settings` and verify panel options, UI language, and theme customization.
5. Verify history export (`JSON`/`CSV`) and optional voice/file tools.

## 6. Permissions mapping (for reviewer clarity)
- `activeTab`: on-demand access to current tab after user action.
- `scripting`: inject content script and CSS only when user launches SmartText.
- `contextMenus`: right-click actions on selected text.
- `storage`: local/sync settings, history, statistics.
- `notifications`: completion/error notifications.
- `sidePanel`: extension side panel UI.

## 7. Final pre-submit checks
1. Uploaded package version equals `manifest.json` version.
2. Description text matches actual features in code.
3. Privacy policy text matches implementation.
4. Test instructions are concrete and reproducible.

## Policy references
- Chrome Web Store Program Policies: https://developer.chrome.com/docs/webstore/program-policies/policies
- Deceptive installation tactics FAQ: https://developer.chrome.com/docs/webstore/program-policies/deceptive-installation-tactics-faq
