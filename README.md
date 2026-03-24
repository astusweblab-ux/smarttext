# SmartText

Chrome Extension for local AI text assistance in editable fields (Gmail, Notion, Google Docs, Telegram Web, X/Twitter, etc.).

Created by ASTUS LAB.

## Highlights

- Local AI processing via Chrome Built-in AI (Prompt API)
- No API keys required
- Floating action panel over selected text
- Context menu actions
- History and usage statistics
- Built-in in-app instructions button (`ℹ Инструкция`)
- Translation to multiple languages (RU/EN/ES/DE/FR/IT/PT/JA/UK/PL)
- Dedicated `🌐 Языки` tab for all translation actions
- Custom prompt templates (create, run, delete)
- Export history to `CSV` / `JSON`
- Configurable visible action buttons
- Multilingual UI (Auto / RU / EN / ES / DE / FR / IT / PT / JA / UK / PL) for side panel, floating panel, and context menu
- Voice input via microphone
- File upload and parsing for `TXT` / `MD` / `DOCX` / `PDF`

## Load in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this folder

## Hotkeys

- `Ctrl+Shift+G` — Fix grammar
- `Ctrl+Shift+S` — Shorten text
- `Ctrl+Shift+L` — Expand text
- `Ctrl+Shift+P` — Make text polite
- `Ctrl+Shift+R` — Translate to Russian
- `Ctrl+Shift+E` — Translate to English

## v2 Additions

- AI model preload toggle (`Settings → AI model`)
- Optional cross-device history sync (`Settings → Privacy`)
- Action button selection for floating panel and quick actions
- Dedicated `🌐 Языки` tab for translations
- Voice dictation and local document import
- Interface language selector in settings (`Auto`, `RU`, `EN`, `ES`, `DE`, `FR`, `IT`, `PT`, `JA`, `UK`, `PL`)

## Microphone access (`not-allowed`)

If you see `Ошибка микрофона: not-allowed` / `Microphone error: not-allowed`, allow microphone access for SmartText:

1. In SmartText click `🎤 Voice` once to trigger microphone permission prompt
2. Approve microphone access in the Chrome prompt
3. Click `🎤 Voice` again to start dictation
4. If permission was previously blocked: `chrome://extensions` → `SmartText` → `Details` → `Site settings`
5. Set `Microphone` to `Allow`
6. Reload extension and click `🎤 Voice` again


## License

MIT — see [LICENSE](LICENSE).
