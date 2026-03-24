// sidepanel.js — SmartText Side Panel Logic
// Created by ASTUS LAB
import { initLocalAI, runAction, warmupLocalAI } from './ai/index.js';
import { parseUploadedFile } from './ai/file-parsers.js';
import { ACTION_META } from './ai/prompts.js';

const ALL_ACTION_IDS = Object.keys(ACTION_META);
const LANGUAGE_ACTION_IDS = ALL_ACTION_IDS.filter((id) => id.startsWith('to_'));
const CORE_ACTION_IDS = ALL_ACTION_IDS.filter((id) => !id.startsWith('to_'));
const DEFAULT_ENABLED_ACTIONS = ['fix', 'shorter', 'longer', 'polite', 'to_ru', 'to_en', 'formal', 'casual'];
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
  uiLanguage: 'auto',
  enabledActions: DEFAULT_ENABLED_ACTIONS
};

const SUPPORTED_UI_LANGS = ['ru', 'en', 'es', 'de', 'fr', 'it', 'pt', 'ja', 'uk', 'pl'];
const UI_LANG_OPTION_LABELS = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  uk: 'Українська',
  pl: 'Polski'
};
const LANG_TO_LOCALE = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  ja: 'ja-JP',
  uk: 'uk-UA',
  pl: 'pl-PL'
};

const UI_TEXT = {
  ru: {
    buttonHelp: 'ℹ Инструкция',
    statusLoading: 'Загрузка...',
    statusCheckingAI: 'Проверка локального AI...',
    statusGenerating: 'Генерация...',
    statusReady: 'Готово',
    statusError: 'Ошибка',
    statusWarmup: 'Прогрев модели...',
    statusWarmed: 'Модель прогрета',
    statusHistoryEmpty: 'История пуста',
    statusNoStats: 'Ещё нет данных',
    statusSaved: '✓ Сохранено',
    statusSettingsSaved: 'Сохранить настройки',
    titleActions: '✦ Действия',
    titleLanguages: '🌐 Языки',
    titleHistory: '📋 История',
    titleStats: '📊 Статистика',
    titleSettings: '⚙️',
    labelInputText: 'ТЕКСТ ДЛЯ ОБРАБОТКИ',
    labelCustomPrompt: 'ПРОИЗВОЛЬНЫЙ ЗАПРОС',
    labelTemplates: 'ШАБЛОНЫ ПРОМПТОВ',
    labelResult: 'РЕЗУЛЬТАТ',
    labelLanguages: 'ПЕРЕВОД НА ДРУГИЕ ЯЗЫКИ',
    labelStatsByAction: 'ПО ДЕЙСТВИЯМ',
    labelStatTotal: 'Операций выполнено',
    labelStatChars: 'Символов обработано',
    labelStatTime: 'Времени сэкономлено',
    placeholderInput: 'Вставьте или введите текст здесь...\n\nИли выделите текст на любой странице и нажмите кнопку действия в плавающей панели.',
    placeholderNeedText: '← Введите текст здесь',
    placeholderCustomPrompt: 'Например: сделай текст в стиле Шекспира...',
    placeholderTemplateName: 'Название шаблона (например: HR ответ)',
    placeholderTemplatePrompt: 'Текст шаблона. Например: Перепиши в формальном деловом стиле и добавь чёткий CTA.',
    buttonVoice: '🎤 Голос',
    buttonVoiceUnavailable: '🎤 Недоступно',
    buttonVoiceStop: '⏹ Стоп',
    buttonFile: '📎 Файл',
    buttonCustomRun: '→',
    buttonAddTemplate: '+ Добавить шаблон',
    buttonCopy: '📋 Копировать',
    buttonCopied: '✓ Скопировано',
    buttonInsert: '↩ Вставить',
    buttonInserted: '✓ Вставлено',
    buttonExportJson: '⬇ JSON',
    buttonExportCsv: '⬇ CSV',
    buttonClearHistory: '🗑 Очистить историю',
    buttonSaveSettings: 'Сохранить настройки',
    buttonApplyTemplate: '▶ Применить',
    buttonDeleteTemplate: 'Удалить',
    buttonUseHistory: '← Использовать',
    emptyTemplates: 'Шаблонов пока нет',
    historyActionCopy: '📋 Копировать',
    historyActionUse: '← Использовать',
    settingsAiTitle: 'AI МОДЕЛЬ',
    settingsModel: 'Модель',
    settingsUiLanguage: 'Язык интерфейса',
    settingsUiAuto: 'Авто',
    settingsUiRu: 'Русский',
    settingsUiEn: 'English',
    settingsUiEs: 'Español',
    settingsUiDe: 'Deutsch',
    settingsUiFr: 'Français',
    settingsUiIt: 'Italiano',
    settingsUiPt: 'Português',
    settingsUiJa: '日本語',
    settingsUiUk: 'Українська',
    settingsUiPl: 'Polski',
    settingsTemperature: 'Температура',
    settingsMaxTokens: 'Макс. длина ответа',
    settingsPreload: 'Предзагрузка модели',
    settingsPanelTitle: 'ПЛАВАЮЩАЯ ПАНЕЛЬ',
    settingsPanelEnabled: 'Включить панель',
    settingsDelay: 'Задержка',
    settingsMs: 'мс',
    settingsPanelButtons: 'Кнопки в панели',
    settingsPrivacyTitle: 'ПРИВАТНОСТЬ',
    settingsSaveHistory: 'Сохранять историю',
    settingsShowNotify: 'Показывать уведомления',
    settingsSyncHistory: 'Синхронизировать историю между устройствами',
    settingsModeTitle: 'РЕЖИМ AI',
    settingsModeLocal: 'Локально, без API-ключа',
    helpKicker: 'SMARTTEXT GUIDE',
    helpTitle: 'Как пользоваться SmartText',
    helpForWhatTitle: 'Для чего это расширение',
    helpForWhatText: 'SmartText помогает быстро редактировать текст прямо в браузере: исправлять ошибки, сокращать, расширять, менять тон и переводить. Все операции выполняются локально через Chrome Built-in AI без API-ключей.',
    helpFeaturesTitle: 'Что умеет SmartText',
    helpHowToTitle: 'Как использовать',
    helpShortcutsTitle: 'Горячие клавиши',
    helpFeature1: 'Исправить грамматику и стиль',
    helpFeature2: 'Сделать текст короче или длиннее',
    helpFeature3: 'Сделать текст более вежливым',
    helpFeature4: 'Переводить на 10 языков: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Менять стиль: формальный или разговорный',
    helpFeature6: 'Выполнять произвольные инструкции и шаблоны промптов',
    helpFeature7: 'Использовать голосовой ввод и загружать файлы txt/md/docx/pdf',
    helpHowTo1: 'Выделите текст на странице и нажмите кнопку в плавающей панели SmartText.',
    helpHowTo2: 'Или выделите текст, откройте правый клик → SmartText → выберите действие.',
    helpHowTo3: 'Или вставьте текст в это окно и нажмите одну из кнопок действий.',
    helpHowTo4: 'Для переводов откройте вкладку «🌐 Языки» и выберите нужный язык.',
    helpHowTo5: 'Готовый результат можно скопировать или вставить обратно в активное поле.',
    shortcutClosePanel: 'Закрыть плавающую панель',
    voiceListening: 'Слушаю…',
    voiceListeningPreview: 'Слушаю: {preview}',
    voiceAdded: 'Добавлено: {preview}',
    voiceStopped: 'Голосовой ввод остановлен',
    voiceUnsupported: 'Голосовой ввод не поддерживается в этом браузере.',
    voiceStartFailed: 'Не удалось запустить микрофон',
    voiceNotAllowed: 'Доступ к микрофону запрещён. Нажмите «⚙️ Открыть сведения» ниже и включите микрофон.',
    voiceNoSpeech: 'Речь не распознана. Попробуйте ещё раз.',
    voiceNoDevice: 'Микрофон не найден. Проверьте устройство ввода.',
    voiceBusy: 'Микрофон уже используется другим приложением.',
    voicePermissionError: 'Не удалось получить доступ к микрофону.',
    voiceOpenSettings: '⚙️ Открыть сведения',
    voiceManualSteps: 'Как включить микрофон:\n1) Настройки сайтов\n2) Микрофон → Разрешить\n3) Обновите страницу/расширение и нажмите 🎤 снова',
    voicePermissionGranted: 'Доступ к микрофону получен. Нажмите кнопку ещё раз, чтобы начать запись.',
    voiceErrorPrefix: 'Ошибка микрофона: {error}',
    fileReading: 'Читаю файл: {name}…',
    fileNoText: 'В файле нет текста.',
    fileLoaded: 'Файл загружен: {name} ({chars} симв.)',
    fileLoadError: 'Ошибка загрузки файла.',
    initUnavailable: 'Локальный AI недоступен',
    initAvailable: 'Локальный AI доступен',
    initError: 'Ошибка инициализации',
    unitMinutes: 'мин'
  },
  en: {
    buttonHelp: 'ℹ Guide',
    statusLoading: 'Loading...',
    statusCheckingAI: 'Checking local AI...',
    statusGenerating: 'Generating...',
    statusReady: 'Done',
    statusError: 'Error',
    statusWarmup: 'Warming up model...',
    statusWarmed: 'Model warmed up',
    statusHistoryEmpty: 'History is empty',
    statusNoStats: 'No data yet',
    statusSaved: '✓ Saved',
    statusSettingsSaved: 'Save settings',
    titleActions: '✦ Actions',
    titleLanguages: '🌐 Languages',
    titleHistory: '📋 History',
    titleStats: '📊 Stats',
    titleSettings: '⚙️',
    labelInputText: 'TEXT TO PROCESS',
    labelCustomPrompt: 'CUSTOM PROMPT',
    labelTemplates: 'PROMPT TEMPLATES',
    labelResult: 'RESULT',
    labelLanguages: 'TRANSLATE TO OTHER LANGUAGES',
    labelStatsByAction: 'BY ACTION',
    labelStatTotal: 'Operations completed',
    labelStatChars: 'Characters processed',
    labelStatTime: 'Estimated time saved',
    placeholderInput: 'Paste or type text here...\n\nOr select text on any page and run an action from the SmartText floating panel.',
    placeholderNeedText: '← Enter text here',
    placeholderCustomPrompt: 'For example: rewrite in Shakespeare style...',
    placeholderTemplateName: 'Template name (for example: HR reply)',
    placeholderTemplatePrompt: 'Template text. Example: Rewrite in formal business style and add a clear CTA.',
    buttonVoice: '🎤 Voice',
    buttonVoiceUnavailable: '🎤 Unavailable',
    buttonVoiceStop: '⏹ Stop',
    buttonFile: '📎 File',
    buttonCustomRun: '→',
    buttonAddTemplate: '+ Add template',
    buttonCopy: '📋 Copy',
    buttonCopied: '✓ Copied',
    buttonInsert: '↩ Insert',
    buttonInserted: '✓ Inserted',
    buttonExportJson: '⬇ JSON',
    buttonExportCsv: '⬇ CSV',
    buttonClearHistory: '🗑 Clear history',
    buttonSaveSettings: 'Save settings',
    buttonApplyTemplate: '▶ Apply',
    buttonDeleteTemplate: 'Delete',
    buttonUseHistory: '← Use',
    emptyTemplates: 'No templates yet',
    historyActionCopy: '📋 Copy',
    historyActionUse: '← Use',
    settingsAiTitle: 'AI MODEL',
    settingsModel: 'Model',
    settingsUiLanguage: 'Interface language',
    settingsUiAuto: 'Auto',
    settingsUiRu: 'Russian',
    settingsUiEn: 'English',
    settingsUiEs: 'Spanish',
    settingsUiDe: 'German',
    settingsUiFr: 'French',
    settingsUiIt: 'Italian',
    settingsUiPt: 'Portuguese',
    settingsUiJa: 'Japanese',
    settingsUiUk: 'Ukrainian',
    settingsUiPl: 'Polish',
    settingsTemperature: 'Temperature',
    settingsMaxTokens: 'Max response length',
    settingsPreload: 'Model preload',
    settingsPanelTitle: 'FLOATING PANEL',
    settingsPanelEnabled: 'Enable panel',
    settingsDelay: 'Delay',
    settingsMs: 'ms',
    settingsPanelButtons: 'Panel buttons',
    settingsPrivacyTitle: 'PRIVACY',
    settingsSaveHistory: 'Save history',
    settingsShowNotify: 'Show notifications',
    settingsSyncHistory: 'Sync history between devices',
    settingsModeTitle: 'AI MODE',
    settingsModeLocal: 'Local mode, no API key',
    helpKicker: 'SMARTTEXT GUIDE',
    helpTitle: 'How to use SmartText',
    helpForWhatTitle: 'What this extension is for',
    helpForWhatText: 'SmartText helps you edit text faster right in the browser: fix mistakes, shorten, expand, adjust tone, and translate. Everything runs locally via Chrome Built-in AI without API keys.',
    helpFeaturesTitle: 'What SmartText can do',
    helpHowToTitle: 'How to use',
    helpShortcutsTitle: 'Hotkeys',
    helpFeature1: 'Fix grammar and style',
    helpFeature2: 'Make text shorter or longer',
    helpFeature3: 'Make text more polite',
    helpFeature4: 'Translate into 10 languages: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Change style: formal or casual',
    helpFeature6: 'Use custom instructions and prompt templates',
    helpFeature7: 'Use voice input and upload txt/md/docx/pdf files',
    helpHowTo1: 'Select text on a page and click an action in the SmartText floating panel.',
    helpHowTo2: 'Or select text, right-click → SmartText → choose action.',
    helpHowTo3: 'Or paste text into this panel and click one of the action buttons.',
    helpHowTo4: 'For translations, open the "🌐 Languages" tab and pick a target language.',
    helpHowTo5: 'You can copy the result or insert it back into the active field.',
    shortcutClosePanel: 'Close floating panel',
    voiceListening: 'Listening…',
    voiceListeningPreview: 'Listening: {preview}',
    voiceAdded: 'Added: {preview}',
    voiceStopped: 'Voice input stopped',
    voiceUnsupported: 'Voice input is not supported in this browser.',
    voiceStartFailed: 'Could not start microphone',
    voiceNotAllowed: 'Microphone access is blocked. Click "⚙️ Open details" below and allow microphone.',
    voiceNoSpeech: 'No speech detected. Try again.',
    voiceNoDevice: 'No microphone found. Check your input device.',
    voiceBusy: 'Microphone is already in use by another app.',
    voicePermissionError: 'Could not request microphone permission.',
    voiceOpenSettings: '⚙️ Open details',
    voiceManualSteps: 'How to enable microphone:\n1) Site settings\n2) Microphone → Allow\n3) Reload page/extension and click 🎤 again',
    voicePermissionGranted: 'Microphone access granted. Click again to start recording.',
    voiceErrorPrefix: 'Microphone error: {error}',
    fileReading: 'Reading file: {name}…',
    fileNoText: 'No text found in file.',
    fileLoaded: 'File loaded: {name} ({chars} chars)',
    fileLoadError: 'File upload error.',
    initUnavailable: 'Local AI is unavailable',
    initAvailable: 'Local AI is available',
    initError: 'Initialization error',
    unitMinutes: 'min'
  }
};

const UI_TEXT_TRANSLATIONS = {
  es: {
    buttonHelp: 'ℹ Guía',
    statusLoading: 'Cargando...',
    statusCheckingAI: 'Comprobando IA local...',
    statusGenerating: 'Generando...',
    statusReady: 'Listo',
    statusError: 'Error',
    statusWarmup: 'Calentando modelo...',
    statusWarmed: 'Modelo listo',
    statusHistoryEmpty: 'El historial está vacío',
    statusNoStats: 'Sin datos todavía',
    statusSaved: '✓ Guardado',
    titleActions: '✦ Acciones',
    titleLanguages: '🌐 Idiomas',
    titleHistory: '📋 Historial',
    titleStats: '📊 Estadísticas',
    labelInputText: 'TEXTO PARA PROCESAR',
    labelCustomPrompt: 'SOLICITUD PERSONALIZADA',
    labelTemplates: 'PLANTILLAS DE PROMPTS',
    labelResult: 'RESULTADO',
    labelLanguages: 'TRADUCIR A OTROS IDIOMAS',
    labelStatsByAction: 'POR ACCIÓN',
    labelStatTotal: 'Operaciones realizadas',
    labelStatChars: 'Caracteres procesados',
    labelStatTime: 'Tiempo ahorrado',
    placeholderInput: 'Pega o escribe el texto aquí...\n\nO selecciona texto en cualquier página y ejecuta una acción desde el panel flotante de SmartText.',
    placeholderNeedText: '← Introduce texto aquí',
    placeholderCustomPrompt: 'Por ejemplo: reescribe en estilo de Shakespeare...',
    placeholderTemplateName: 'Nombre de plantilla (por ejemplo: respuesta RRHH)',
    placeholderTemplatePrompt: 'Texto de plantilla. Ejemplo: Reescribe en estilo formal y añade un CTA claro.',
    buttonVoice: '🎤 Voz',
    buttonVoiceUnavailable: '🎤 No disponible',
    buttonVoiceStop: '⏹ Detener',
    buttonFile: '📎 Archivo',
    buttonAddTemplate: '+ Añadir plantilla',
    buttonCopy: '📋 Copiar',
    buttonCopied: '✓ Copiado',
    buttonInsert: '↩ Insertar',
    buttonInserted: '✓ Insertado',
    buttonClearHistory: '🗑 Limpiar historial',
    buttonSaveSettings: 'Guardar configuración',
    buttonApplyTemplate: '▶ Aplicar',
    buttonDeleteTemplate: 'Eliminar',
    buttonUseHistory: '← Usar',
    emptyTemplates: 'Aún no hay plantillas',
    historyActionCopy: '📋 Copiar',
    historyActionUse: '← Usar',
    settingsAiTitle: 'MODELO DE IA',
    settingsModel: 'Modelo',
    settingsUiLanguage: 'Idioma de la interfaz',
    settingsUiAuto: 'Automático',
    settingsTemperature: 'Temperatura',
    settingsMaxTokens: 'Longitud máxima de respuesta',
    settingsPreload: 'Precargar modelo',
    settingsPanelTitle: 'PANEL FLOTANTE',
    settingsPanelEnabled: 'Activar panel',
    settingsDelay: 'Retraso',
    settingsMs: 'ms',
    settingsPanelButtons: 'Botones del panel',
    settingsPrivacyTitle: 'PRIVACIDAD',
    settingsSaveHistory: 'Guardar historial',
    settingsShowNotify: 'Mostrar notificaciones',
    settingsSyncHistory: 'Sincronizar historial entre dispositivos',
    settingsModeTitle: 'MODO IA',
    settingsModeLocal: 'Modo local, sin API key',
    helpTitle: 'Cómo usar SmartText',
    helpForWhatTitle: 'Para qué sirve esta extensión',
    helpForWhatText: 'SmartText te ayuda a editar texto más rápido en el navegador: corrige errores, acorta, amplía, cambia el tono y traduce. Todo funciona localmente con Chrome Built-in AI sin API keys.',
    helpFeaturesTitle: 'Qué puede hacer SmartText',
    helpHowToTitle: 'Cómo usarlo',
    helpShortcutsTitle: 'Atajos de teclado',
    helpFeature1: 'Corregir gramática y estilo',
    helpFeature2: 'Hacer el texto más corto o más largo',
    helpFeature3: 'Hacer el texto más cortés',
    helpFeature4: 'Traducir a 10 idiomas: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Cambiar estilo: formal o casual',
    helpFeature6: 'Usar instrucciones personalizadas y plantillas',
    helpFeature7: 'Usar entrada por voz y cargar archivos txt/md/docx/pdf',
    helpHowTo1: 'Selecciona texto en la página y pulsa una acción en el panel flotante de SmartText.',
    helpHowTo2: 'O selecciona texto, clic derecho → SmartText → elige acción.',
    helpHowTo3: 'O pega texto en este panel y pulsa un botón de acción.',
    helpHowTo4: 'Para traducciones, abre la pestaña "🌐 Idiomas" y elige destino.',
    helpHowTo5: 'Puedes copiar el resultado o insertarlo en el campo activo.',
    shortcutClosePanel: 'Cerrar panel flotante',
    voiceListening: 'Escuchando…',
    voiceListeningPreview: 'Escuchando: {preview}',
    voiceAdded: 'Añadido: {preview}',
    voiceStopped: 'Entrada de voz detenida',
    voiceUnsupported: 'La entrada de voz no es compatible con este navegador.',
    voiceStartFailed: 'No se pudo iniciar el micrófono',
    voiceNotAllowed: 'Acceso al micrófono bloqueado. Pulsa "⚙️ Abrir detalles" y permite el micrófono.',
    voiceNoSpeech: 'No se detectó voz. Inténtalo de nuevo.',
    voiceNoDevice: 'No se encontró micrófono. Revisa el dispositivo de entrada.',
    voiceBusy: 'El micrófono está siendo usado por otra aplicación.',
    voicePermissionError: 'No se pudo solicitar acceso al micrófono.',
    voiceOpenSettings: '⚙️ Abrir detalles',
    voiceManualSteps: 'Cómo habilitar el micrófono:\n1) Configuración del sitio\n2) Micrófono → Permitir\n3) Recarga la página/extensión y pulsa 🎤 de nuevo',
    voicePermissionGranted: 'Acceso al micrófono concedido. Pulsa de nuevo para iniciar.',
    voiceErrorPrefix: 'Error de micrófono: {error}',
    fileReading: 'Leyendo archivo: {name}…',
    fileNoText: 'No se encontró texto en el archivo.',
    fileLoaded: 'Archivo cargado: {name} ({chars} caracteres)',
    fileLoadError: 'Error al cargar archivo.',
    initUnavailable: 'La IA local no está disponible',
    initAvailable: 'La IA local está disponible',
    initError: 'Error de inicialización',
    unitMinutes: 'min'
  },
  de: {
    buttonHelp: 'ℹ Anleitung',
    statusLoading: 'Wird geladen...',
    statusCheckingAI: 'Lokale KI wird geprüft...',
    statusGenerating: 'Wird generiert...',
    statusReady: 'Fertig',
    statusError: 'Fehler',
    statusWarmup: 'Modell wird vorbereitet...',
    statusWarmed: 'Modell bereit',
    statusHistoryEmpty: 'Verlauf ist leer',
    statusNoStats: 'Noch keine Daten',
    statusSaved: '✓ Gespeichert',
    statusSettingsSaved: 'Einstellungen speichern',
    titleActions: '✦ Aktionen',
    titleLanguages: '🌐 Sprachen',
    titleHistory: '📋 Verlauf',
    titleStats: '📊 Statistik',
    labelInputText: 'TEXT ZUR VERARBEITUNG',
    labelCustomPrompt: 'BENUTZERDEFINIERTER PROMPT',
    labelTemplates: 'PROMPT-VORLAGEN',
    labelResult: 'ERGEBNIS',
    labelLanguages: 'IN ANDERE SPRACHEN ÜBERSETZEN',
    labelStatsByAction: 'NACH AKTION',
    labelStatTotal: 'Ausgeführte Vorgänge',
    labelStatChars: 'Verarbeitete Zeichen',
    labelStatTime: 'Geschätzte Zeitersparnis',
    placeholderInput: 'Text hier einfügen oder eingeben...\n\nOder Text auf einer Seite markieren und Aktion im SmartText-Panel ausführen.',
    placeholderNeedText: '← Text hier eingeben',
    placeholderCustomPrompt: 'Zum Beispiel: im Shakespeare-Stil umschreiben...',
    placeholderTemplateName: 'Vorlagenname (z.B. HR-Antwort)',
    placeholderTemplatePrompt: 'Vorlagentext. Beispiel: Formell umschreiben und klare CTA hinzufügen.',
    buttonVoice: '🎤 Stimme',
    buttonVoiceUnavailable: '🎤 Nicht verfügbar',
    buttonVoiceStop: '⏹ Stopp',
    buttonFile: '📎 Datei',
    buttonAddTemplate: '+ Vorlage hinzufügen',
    buttonCopy: '📋 Kopieren',
    buttonCopied: '✓ Kopiert',
    buttonInsert: '↩ Einfügen',
    buttonInserted: '✓ Eingefügt',
    buttonClearHistory: '🗑 Verlauf leeren',
    buttonSaveSettings: 'Einstellungen speichern',
    buttonApplyTemplate: '▶ Anwenden',
    buttonDeleteTemplate: 'Löschen',
    buttonUseHistory: '← Verwenden',
    emptyTemplates: 'Noch keine Vorlagen',
    historyActionCopy: '📋 Kopieren',
    historyActionUse: '← Verwenden',
    settingsAiTitle: 'KI-MODELL',
    settingsModel: 'Modell',
    settingsUiLanguage: 'Oberflächensprache',
    settingsUiAuto: 'Auto',
    settingsTemperature: 'Temperatur',
    settingsMaxTokens: 'Max. Antwortlänge',
    settingsPreload: 'Modell vorladen',
    settingsPanelTitle: 'SCHWEBENDES PANEL',
    settingsPanelEnabled: 'Panel aktivieren',
    settingsDelay: 'Verzögerung',
    settingsMs: 'ms',
    settingsPanelButtons: 'Panel-Schaltflächen',
    settingsPrivacyTitle: 'DATENSCHUTZ',
    settingsSaveHistory: 'Verlauf speichern',
    settingsShowNotify: 'Benachrichtigungen anzeigen',
    settingsSyncHistory: 'Verlauf zwischen Geräten synchronisieren',
    settingsModeTitle: 'KI-MODUS',
    settingsModeLocal: 'Lokal, ohne API-Schlüssel',
    helpKicker: 'SMARTTEXT-ANLEITUNG',
    helpTitle: 'SmartText verwenden',
    helpForWhatTitle: 'Wofür ist diese Erweiterung',
    helpForWhatText: 'SmartText hilft dir, Texte im Browser schneller zu bearbeiten: Fehler korrigieren, kürzen, erweitern, Ton ändern und übersetzen. Alles läuft lokal mit Chrome Built-in AI ohne API-Schlüssel.',
    helpFeaturesTitle: 'Was SmartText kann',
    helpHowToTitle: 'So verwendest du es',
    helpShortcutsTitle: 'Tastenkürzel',
    helpFeature1: 'Grammatik und Stil korrigieren',
    helpFeature2: 'Text kürzer oder länger machen',
    helpFeature3: 'Text höflicher machen',
    helpFeature4: 'In 10 Sprachen übersetzen: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Stil ändern: formal oder locker',
    helpFeature6: 'Benutzerdefinierte Anweisungen und Vorlagen verwenden',
    helpFeature7: 'Spracheingabe und Upload von txt/md/docx/pdf',
    helpHowTo1: 'Text auf der Seite markieren und eine Aktion im SmartText-Panel anklicken.',
    helpHowTo2: 'Oder Text markieren, Rechtsklick → SmartText → Aktion wählen.',
    helpHowTo3: 'Oder Text in dieses Panel einfügen und einen Aktionsknopf drücken.',
    helpHowTo4: 'Für Übersetzungen den Tab "🌐 Sprachen" öffnen und Zielsprache wählen.',
    helpHowTo5: 'Ergebnis kopieren oder in das aktive Feld einfügen.',
    shortcutClosePanel: 'Schwebendes Panel schließen',
    voiceListening: 'Höre zu…',
    voiceListeningPreview: 'Höre zu: {preview}',
    voiceAdded: 'Hinzugefügt: {preview}',
    voiceStopped: 'Spracheingabe gestoppt',
    voiceUnsupported: 'Spracheingabe wird in diesem Browser nicht unterstützt.',
    voiceStartFailed: 'Mikrofon konnte nicht gestartet werden',
    voiceNotAllowed: 'Mikrofonzugriff blockiert. Klicke "⚙️ Details öffnen" und erlaube das Mikrofon.',
    voiceNoSpeech: 'Keine Sprache erkannt. Versuche es erneut.',
    voiceNoDevice: 'Kein Mikrofon gefunden. Eingabegerät prüfen.',
    voiceBusy: 'Mikrofon wird bereits von einer anderen App verwendet.',
    voicePermissionError: 'Mikrofonzugriff konnte nicht angefordert werden.',
    voiceOpenSettings: '⚙️ Details öffnen',
    voiceManualSteps: 'So aktivierst du das Mikrofon:\n1) Website-Einstellungen\n2) Mikrofon → Zulassen\n3) Seite/Erweiterung neu laden und erneut 🎤 drücken',
    voicePermissionGranted: 'Mikrofonzugriff gewährt. Klicke erneut zum Starten.',
    voiceErrorPrefix: 'Mikrofonfehler: {error}',
    fileReading: 'Datei wird gelesen: {name}…',
    fileNoText: 'Kein Text in der Datei gefunden.',
    fileLoaded: 'Datei geladen: {name} ({chars} Zeichen)',
    fileLoadError: 'Datei-Upload-Fehler.',
    initUnavailable: 'Lokale KI ist nicht verfügbar',
    initAvailable: 'Lokale KI ist verfügbar',
    initError: 'Initialisierungsfehler',
    unitMinutes: 'Min'
  },
  fr: {
    buttonHelp: 'ℹ Guide',
    statusLoading: 'Chargement...',
    statusCheckingAI: 'Vérification de l’IA locale...',
    statusGenerating: 'Génération...',
    statusReady: 'Terminé',
    statusError: 'Erreur',
    statusWarmup: 'Préparation du modèle...',
    statusWarmed: 'Modèle prêt',
    statusHistoryEmpty: 'Historique vide',
    statusNoStats: 'Aucune donnée pour le moment',
    statusSaved: '✓ Enregistré',
    titleActions: '✦ Actions',
    titleLanguages: '🌐 Langues',
    titleHistory: '📋 Historique',
    titleStats: '📊 Statistiques',
    labelInputText: 'TEXTE À TRAITER',
    labelCustomPrompt: 'INSTRUCTION PERSONNALISÉE',
    labelTemplates: 'MODÈLES DE PROMPTS',
    labelResult: 'RÉSULTAT',
    labelLanguages: 'TRADUIRE VERS D’AUTRES LANGUES',
    labelStatsByAction: 'PAR ACTION',
    labelStatTotal: 'Opérations effectuées',
    labelStatChars: 'Caractères traités',
    labelStatTime: 'Temps économisé',
    placeholderInput: 'Collez ou saisissez le texte ici...\n\nOu sélectionnez du texte sur une page et lancez une action depuis le panneau flottant SmartText.',
    placeholderNeedText: '← Saisissez le texte ici',
    placeholderCustomPrompt: 'Par exemple : réécrire dans le style de Shakespeare...',
    placeholderTemplateName: 'Nom du modèle (par ex. : réponse RH)',
    placeholderTemplatePrompt: 'Texte du modèle. Ex : réécrire en style professionnel et ajouter un CTA clair.',
    buttonVoice: '🎤 Voix',
    buttonVoiceUnavailable: '🎤 Indisponible',
    buttonVoiceStop: '⏹ Stop',
    buttonFile: '📎 Fichier',
    buttonAddTemplate: '+ Ajouter un modèle',
    buttonCopy: '📋 Copier',
    buttonCopied: '✓ Copié',
    buttonInsert: '↩ Insérer',
    buttonInserted: '✓ Inséré',
    buttonClearHistory: '🗑 Vider l’historique',
    buttonSaveSettings: 'Enregistrer les paramètres',
    buttonApplyTemplate: '▶ Appliquer',
    buttonDeleteTemplate: 'Supprimer',
    buttonUseHistory: '← Utiliser',
    emptyTemplates: 'Aucun modèle pour l’instant',
    historyActionCopy: '📋 Copier',
    historyActionUse: '← Utiliser',
    settingsAiTitle: 'MODÈLE IA',
    settingsModel: 'Modèle',
    settingsUiLanguage: 'Langue de l’interface',
    settingsUiAuto: 'Auto',
    settingsTemperature: 'Température',
    settingsMaxTokens: 'Longueur max. de réponse',
    settingsPreload: 'Précharger le modèle',
    settingsPanelTitle: 'PANNEAU FLOTTANT',
    settingsPanelEnabled: 'Activer le panneau',
    settingsDelay: 'Délai',
    settingsMs: 'ms',
    settingsPanelButtons: 'Boutons du panneau',
    settingsPrivacyTitle: 'CONFIDENTIALITÉ',
    settingsSaveHistory: 'Enregistrer l’historique',
    settingsShowNotify: 'Afficher les notifications',
    settingsSyncHistory: 'Synchroniser l’historique entre appareils',
    settingsModeTitle: 'MODE IA',
    settingsModeLocal: 'Mode local, sans clé API',
    helpTitle: 'Comment utiliser SmartText',
    helpForWhatTitle: 'À quoi sert cette extension',
    helpForWhatText: 'SmartText vous aide à éditer du texte plus vite dans le navigateur : corriger des erreurs, raccourcir, développer, ajuster le ton et traduire. Tout fonctionne localement via Chrome Built-in AI sans clé API.',
    helpFeaturesTitle: 'Ce que SmartText peut faire',
    helpHowToTitle: 'Comment l’utiliser',
    helpShortcutsTitle: 'Raccourcis clavier',
    helpFeature1: 'Corriger la grammaire et le style',
    helpFeature2: 'Rendre le texte plus court ou plus long',
    helpFeature3: 'Rendre le texte plus poli',
    helpFeature4: 'Traduire en 10 langues : RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Changer le style : formel ou décontracté',
    helpFeature6: 'Utiliser des instructions personnalisées et des modèles',
    helpFeature7: 'Utiliser la dictée vocale et charger des fichiers txt/md/docx/pdf',
    helpHowTo1: 'Sélectionnez du texte sur la page puis cliquez une action dans le panneau SmartText.',
    helpHowTo2: 'Ou sélectionnez du texte, clic droit → SmartText → choisissez une action.',
    helpHowTo3: 'Ou collez le texte dans ce panneau puis cliquez un bouton d’action.',
    helpHowTo4: 'Pour les traductions, ouvrez l’onglet "🌐 Langues" et choisissez la langue cible.',
    helpHowTo5: 'Vous pouvez copier le résultat ou l’insérer dans le champ actif.',
    shortcutClosePanel: 'Fermer le panneau flottant',
    voiceListening: 'Écoute…',
    voiceListeningPreview: 'Écoute : {preview}',
    voiceAdded: 'Ajouté : {preview}',
    voiceStopped: 'Saisie vocale arrêtée',
    voiceUnsupported: 'La saisie vocale n’est pas prise en charge dans ce navigateur.',
    voiceStartFailed: 'Impossible de démarrer le micro',
    voiceNotAllowed: 'Accès micro bloqué. Cliquez sur "⚙️ Ouvrir les détails" puis autorisez le micro.',
    voiceNoSpeech: 'Aucune voix détectée. Réessayez.',
    voiceNoDevice: 'Aucun micro détecté. Vérifiez le périphérique.',
    voiceBusy: 'Le micro est déjà utilisé par une autre application.',
    voicePermissionError: 'Impossible de demander l’accès au micro.',
    voiceOpenSettings: '⚙️ Ouvrir les détails',
    voiceManualSteps: 'Activer le micro :\n1) Paramètres du site\n2) Microphone → Autoriser\n3) Recharger la page/extension puis cliquer à nouveau sur 🎤',
    voicePermissionGranted: 'Accès micro accordé. Cliquez de nouveau pour démarrer.',
    voiceErrorPrefix: 'Erreur micro : {error}',
    fileReading: 'Lecture du fichier : {name}…',
    fileNoText: 'Aucun texte trouvé dans le fichier.',
    fileLoaded: 'Fichier chargé : {name} ({chars} caractères)',
    fileLoadError: 'Erreur de chargement du fichier.',
    initUnavailable: 'IA locale indisponible',
    initAvailable: 'IA locale disponible',
    initError: 'Erreur d’initialisation',
    unitMinutes: 'min',
    helpKicker: 'GUIDE SMARTTEXT'
  },
  it: {
    buttonHelp: 'ℹ Guida',
    statusLoading: 'Caricamento...',
    statusCheckingAI: 'Verifica IA locale...',
    statusGenerating: 'Generazione...',
    statusReady: 'Pronto',
    statusError: 'Errore',
    statusWarmup: 'Riscaldamento modello...',
    statusWarmed: 'Modello pronto',
    statusHistoryEmpty: 'Cronologia vuota',
    statusNoStats: 'Nessun dato ancora',
    statusSaved: '✓ Salvato',
    titleActions: '✦ Azioni',
    titleLanguages: '🌐 Lingue',
    titleHistory: '📋 Cronologia',
    titleStats: '📊 Statistiche',
    labelInputText: 'TESTO DA ELABORARE',
    labelCustomPrompt: 'PROMPT PERSONALIZZATO',
    labelTemplates: 'MODELLI PROMPT',
    labelResult: 'RISULTATO',
    labelLanguages: 'TRADUCI IN ALTRE LINGUE',
    labelStatsByAction: 'PER AZIONE',
    labelStatTotal: 'Operazioni eseguite',
    labelStatChars: 'Caratteri elaborati',
    labelStatTime: 'Tempo risparmiato',
    placeholderInput: 'Incolla o scrivi il testo qui...\n\nOppure seleziona testo su una pagina e lancia un’azione dal pannello SmartText.',
    placeholderNeedText: '← Inserisci testo qui',
    placeholderCustomPrompt: 'Per esempio: riscrivi in stile Shakespeare...',
    placeholderTemplateName: 'Nome modello (esempio: risposta HR)',
    placeholderTemplatePrompt: 'Testo modello. Esempio: riscrivi in stile formale e aggiungi una CTA chiara.',
    buttonVoice: '🎤 Voce',
    buttonVoiceUnavailable: '🎤 Non disponibile',
    buttonVoiceStop: '⏹ Stop',
    buttonFile: '📎 File',
    buttonCustomRun: '→',
    buttonAddTemplate: '+ Aggiungi modello',
    buttonCopy: '📋 Copia',
    buttonCopied: '✓ Copiato',
    buttonInsert: '↩ Inserisci',
    buttonInserted: '✓ Inserito',
    buttonExportJson: '⬇ JSON',
    buttonExportCsv: '⬇ CSV',
    buttonClearHistory: '🗑 Svuota cronologia',
    buttonSaveSettings: 'Salva impostazioni',
    buttonApplyTemplate: '▶ Applica',
    buttonDeleteTemplate: 'Elimina',
    buttonUseHistory: '← Usa',
    emptyTemplates: 'Nessun modello per ora',
    historyActionCopy: '📋 Copia',
    historyActionUse: '← Usa',
    settingsAiTitle: 'MODELLO IA',
    settingsModel: 'Modello',
    settingsUiLanguage: 'Lingua interfaccia',
    settingsUiAuto: 'Auto',
    settingsTemperature: 'Temperatura',
    settingsMaxTokens: 'Lunghezza massima risposta',
    settingsPreload: 'Precarica modello',
    settingsPanelTitle: 'PANNELLO MOBILE',
    settingsPanelEnabled: 'Abilita pannello',
    settingsDelay: 'Ritardo',
    settingsMs: 'ms',
    settingsPanelButtons: 'Pulsanti pannello',
    settingsPrivacyTitle: 'PRIVACY',
    settingsSaveHistory: 'Salva cronologia',
    settingsShowNotify: 'Mostra notifiche',
    settingsSyncHistory: 'Sincronizza cronologia tra dispositivi',
    settingsModeTitle: 'MODALITÀ IA',
    settingsModeLocal: 'Locale, senza chiave API',
    helpKicker: 'GUIDA SMARTTEXT',
    helpTitle: 'Come usare SmartText',
    helpForWhatTitle: 'A cosa serve questa estensione',
    helpForWhatText: 'SmartText ti aiuta a modificare testi più velocemente nel browser: correggere errori, accorciare, espandere, cambiare tono e tradurre. Tutto funziona in locale tramite Chrome Built-in AI senza API key.',
    helpFeaturesTitle: 'Cosa può fare SmartText',
    helpHowToTitle: 'Come usarlo',
    helpShortcutsTitle: 'Scorciatoie',
    helpFeature1: 'Correggere grammatica e stile',
    helpFeature2: 'Rendere il testo più corto o più lungo',
    helpFeature3: 'Rendere il testo più cortese',
    helpFeature4: 'Tradurre in 10 lingue: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Cambiare stile: formale o informale',
    helpFeature6: 'Usare istruzioni personalizzate e modelli',
    helpFeature7: 'Usare input vocale e caricare file txt/md/docx/pdf',
    helpHowTo1: 'Seleziona testo su una pagina e premi un’azione nel pannello SmartText.',
    helpHowTo2: 'Oppure seleziona testo, clic destro → SmartText → scegli azione.',
    helpHowTo3: 'Oppure incolla il testo in questo pannello e premi un pulsante azione.',
    helpHowTo4: 'Per traduzioni, apri la scheda "🌐 Lingue" e scegli la lingua target.',
    helpHowTo5: 'Puoi copiare il risultato o inserirlo nel campo attivo.',
    shortcutClosePanel: 'Chiudi pannello mobile',
    voiceListening: 'In ascolto…',
    voiceListeningPreview: 'In ascolto: {preview}',
    voiceAdded: 'Aggiunto: {preview}',
    voiceStopped: 'Dettatura interrotta',
    voiceUnsupported: 'Dettatura non supportata in questo browser.',
    voiceStartFailed: 'Impossibile avviare il microfono',
    voiceNotAllowed: 'Accesso al microfono bloccato. Premi "⚙️ Apri dettagli" e consenti il microfono.',
    voiceNoSpeech: 'Nessun parlato rilevato. Riprova.',
    voiceNoDevice: 'Microfono non trovato. Controlla il dispositivo.',
    voiceBusy: 'Il microfono è già usato da un’altra app.',
    voicePermissionError: 'Impossibile richiedere accesso al microfono.',
    voiceOpenSettings: '⚙️ Apri dettagli',
    voiceManualSteps: 'Come abilitare il microfono:\n1) Impostazioni sito\n2) Microfono → Consenti\n3) Ricarica pagina/estensione e premi di nuovo 🎤',
    voicePermissionGranted: 'Accesso al microfono consentito. Premi di nuovo per avviare.',
    voiceErrorPrefix: 'Errore microfono: {error}',
    fileReading: 'Lettura file: {name}…',
    fileNoText: 'Nessun testo trovato nel file.',
    fileLoaded: 'File caricato: {name} ({chars} caratteri)',
    fileLoadError: 'Errore caricamento file.',
    initUnavailable: 'IA locale non disponibile',
    initAvailable: 'IA locale disponibile',
    initError: 'Errore di inizializzazione',
    unitMinutes: 'min'
  },
  pt: {
    buttonHelp: 'ℹ Guia',
    statusLoading: 'Carregando...',
    statusCheckingAI: 'Verificando IA local...',
    statusGenerating: 'Gerando...',
    statusReady: 'Pronto',
    statusError: 'Erro',
    statusWarmup: 'Aquecendo modelo...',
    statusWarmed: 'Modelo pronto',
    statusHistoryEmpty: 'Histórico vazio',
    statusNoStats: 'Ainda sem dados',
    statusSaved: '✓ Salvo',
    titleActions: '✦ Ações',
    titleLanguages: '🌐 Idiomas',
    titleHistory: '📋 Histórico',
    titleStats: '📊 Estatísticas',
    labelInputText: 'TEXTO PARA PROCESSAR',
    labelCustomPrompt: 'PROMPT PERSONALIZADO',
    labelTemplates: 'MODELOS DE PROMPT',
    labelResult: 'RESULTADO',
    labelLanguages: 'TRADUZIR PARA OUTROS IDIOMAS',
    labelStatsByAction: 'POR AÇÃO',
    labelStatTotal: 'Operações concluídas',
    labelStatChars: 'Caracteres processados',
    labelStatTime: 'Tempo economizado',
    placeholderInput: 'Cole ou digite o texto aqui...\n\nOu selecione texto em qualquer página e execute uma ação pelo painel do SmartText.',
    placeholderNeedText: '← Digite o texto aqui',
    placeholderCustomPrompt: 'Por exemplo: reescreva no estilo de Shakespeare...',
    placeholderTemplateName: 'Nome do modelo (exemplo: resposta RH)',
    placeholderTemplatePrompt: 'Texto do modelo. Exemplo: reescreva em estilo formal e adicione CTA claro.',
    buttonVoice: '🎤 Voz',
    buttonVoiceUnavailable: '🎤 Indisponível',
    buttonVoiceStop: '⏹ Parar',
    buttonFile: '📎 Arquivo',
    buttonCustomRun: '→',
    buttonAddTemplate: '+ Adicionar modelo',
    buttonCopy: '📋 Copiar',
    buttonCopied: '✓ Copiado',
    buttonInsert: '↩ Inserir',
    buttonInserted: '✓ Inserido',
    buttonExportJson: '⬇ JSON',
    buttonExportCsv: '⬇ CSV',
    buttonClearHistory: '🗑 Limpar histórico',
    buttonSaveSettings: 'Salvar configurações',
    buttonApplyTemplate: '▶ Aplicar',
    buttonDeleteTemplate: 'Excluir',
    buttonUseHistory: '← Usar',
    emptyTemplates: 'Ainda não há modelos',
    historyActionCopy: '📋 Copiar',
    historyActionUse: '← Usar',
    settingsAiTitle: 'MODELO DE IA',
    settingsModel: 'Modelo',
    settingsUiLanguage: 'Idioma da interface',
    settingsUiAuto: 'Automático',
    settingsTemperature: 'Temperatura',
    settingsMaxTokens: 'Comprimento máximo da resposta',
    settingsPreload: 'Pré-carregar modelo',
    settingsPanelTitle: 'PAINEL FLUTUANTE',
    settingsPanelEnabled: 'Ativar painel',
    settingsDelay: 'Atraso',
    settingsMs: 'ms',
    settingsPanelButtons: 'Botões do painel',
    settingsPrivacyTitle: 'PRIVACIDADE',
    settingsSaveHistory: 'Salvar histórico',
    settingsShowNotify: 'Mostrar notificações',
    settingsSyncHistory: 'Sincronizar histórico entre dispositivos',
    settingsModeTitle: 'MODO IA',
    settingsModeLocal: 'Local, sem chave API',
    helpKicker: 'GUIA SMARTTEXT',
    helpTitle: 'Como usar o SmartText',
    helpForWhatTitle: 'Para que serve esta extensão',
    helpForWhatText: 'O SmartText ajuda você a editar textos mais rápido no navegador: corrigir erros, encurtar, expandir, ajustar tom e traduzir. Tudo funciona localmente com Chrome Built-in AI sem chave API.',
    helpFeaturesTitle: 'O que o SmartText faz',
    helpHowToTitle: 'Como usar',
    helpShortcutsTitle: 'Atalhos',
    helpFeature1: 'Corrigir gramática e estilo',
    helpFeature2: 'Deixar o texto mais curto ou mais longo',
    helpFeature3: 'Deixar o texto mais educado',
    helpFeature4: 'Traduzir para 10 idiomas: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Mudar estilo: formal ou casual',
    helpFeature6: 'Usar instruções personalizadas e modelos',
    helpFeature7: 'Usar voz e enviar arquivos txt/md/docx/pdf',
    helpHowTo1: 'Selecione texto na página e clique em uma ação no painel SmartText.',
    helpHowTo2: 'Ou selecione texto, clique com botão direito → SmartText → escolha ação.',
    helpHowTo3: 'Ou cole texto neste painel e clique em um botão de ação.',
    helpHowTo4: 'Para traduções, abra a aba "🌐 Idiomas" e escolha o idioma de destino.',
    helpHowTo5: 'Você pode copiar o resultado ou inserir no campo ativo.',
    shortcutClosePanel: 'Fechar painel flutuante',
    voiceListening: 'Ouvindo…',
    voiceListeningPreview: 'Ouvindo: {preview}',
    voiceAdded: 'Adicionado: {preview}',
    voiceStopped: 'Entrada por voz parada',
    voiceUnsupported: 'Entrada por voz não é suportada neste navegador.',
    voiceStartFailed: 'Não foi possível iniciar o microfone',
    voiceNotAllowed: 'Acesso ao microfone bloqueado. Clique em "⚙️ Abrir detalhes" e permita o microfone.',
    voiceNoSpeech: 'Nenhuma fala detectada. Tente novamente.',
    voiceNoDevice: 'Microfone não encontrado. Verifique o dispositivo.',
    voiceBusy: 'O microfone já está em uso por outro app.',
    voicePermissionError: 'Não foi possível solicitar acesso ao microfone.',
    voiceOpenSettings: '⚙️ Abrir detalhes',
    voiceManualSteps: 'Como ativar o microfone:\n1) Configurações do site\n2) Microfone → Permitir\n3) Recarregue página/extensão e clique em 🎤 novamente',
    voicePermissionGranted: 'Acesso ao microfone concedido. Clique novamente para iniciar.',
    voiceErrorPrefix: 'Erro do microfone: {error}',
    fileReading: 'Lendo arquivo: {name}…',
    fileNoText: 'Nenhum texto encontrado no arquivo.',
    fileLoaded: 'Arquivo carregado: {name} ({chars} caracteres)',
    fileLoadError: 'Erro ao carregar arquivo.',
    initUnavailable: 'IA local indisponível',
    initAvailable: 'IA local disponível',
    initError: 'Erro de inicialização',
    unitMinutes: 'min'
  },
  ja: {
    buttonHelp: 'ℹ ガイド',
    statusLoading: '読み込み中...',
    statusCheckingAI: 'ローカルAIを確認中...',
    statusGenerating: '生成中...',
    statusReady: '完了',
    statusError: 'エラー',
    statusWarmup: 'モデルをウォームアップ中...',
    statusWarmed: 'モデル準備完了',
    statusHistoryEmpty: '履歴は空です',
    statusNoStats: 'まだデータがありません',
    statusSaved: '✓ 保存済み',
    titleActions: '✦ アクション',
    titleLanguages: '🌐 言語',
    titleHistory: '📋 履歴',
    titleStats: '📊 統計',
    labelInputText: '処理するテキスト',
    labelCustomPrompt: 'カスタムプロンプト',
    labelTemplates: 'プロンプトテンプレート',
    labelResult: '結果',
    labelLanguages: '他言語へ翻訳',
    labelStatsByAction: 'アクション別',
    labelStatTotal: '実行回数',
    labelStatChars: '処理文字数',
    labelStatTime: '節約時間',
    placeholderInput: 'ここにテキストを貼り付けるか入力してください...\n\nまたはページ上のテキストを選択し、SmartTextパネルからアクションを実行してください。',
    placeholderNeedText: '← ここにテキストを入力',
    placeholderCustomPrompt: '例: シェイクスピア風に書き直して...',
    placeholderTemplateName: 'テンプレート名（例: HR返信）',
    placeholderTemplatePrompt: 'テンプレート本文。例: ビジネス向けに書き直し、明確なCTAを追加。',
    buttonVoice: '🎤 音声',
    buttonVoiceUnavailable: '🎤 利用不可',
    buttonVoiceStop: '⏹ 停止',
    buttonFile: '📎 ファイル',
    buttonCustomRun: '→',
    buttonAddTemplate: '+ テンプレート追加',
    buttonCopy: '📋 コピー',
    buttonCopied: '✓ コピー済み',
    buttonInsert: '↩ 挿入',
    buttonInserted: '✓ 挿入済み',
    buttonExportJson: '⬇ JSON',
    buttonExportCsv: '⬇ CSV',
    buttonClearHistory: '🗑 履歴を消去',
    buttonSaveSettings: '設定を保存',
    buttonApplyTemplate: '▶ 適用',
    buttonDeleteTemplate: '削除',
    buttonUseHistory: '← 使用',
    emptyTemplates: 'テンプレートはまだありません',
    historyActionCopy: '📋 コピー',
    historyActionUse: '← 使用',
    settingsAiTitle: 'AIモデル',
    settingsModel: 'モデル',
    settingsUiLanguage: 'インターフェース言語',
    settingsUiAuto: '自動',
    settingsTemperature: '温度',
    settingsMaxTokens: '最大応答長',
    settingsPreload: 'モデルを事前読み込み',
    settingsPanelTitle: 'フローティングパネル',
    settingsPanelEnabled: 'パネルを有効化',
    settingsDelay: '遅延',
    settingsMs: 'ms',
    settingsPanelButtons: 'パネルのボタン',
    settingsPrivacyTitle: 'プライバシー',
    settingsSaveHistory: '履歴を保存',
    settingsShowNotify: '通知を表示',
    settingsSyncHistory: '履歴をデバイス間で同期',
    settingsModeTitle: 'AIモード',
    settingsModeLocal: 'ローカル、APIキー不要',
    helpKicker: 'SMARTTEXTガイド',
    helpTitle: 'SmartTextの使い方',
    helpForWhatTitle: 'この拡張機能の目的',
    helpForWhatText: 'SmartTextはブラウザ内でテキスト編集を高速化します。誤り修正、短縮、拡張、トーン調整、翻訳をローカルで実行します。APIキーは不要です。',
    helpFeaturesTitle: 'SmartTextでできること',
    helpHowToTitle: '使い方',
    helpShortcutsTitle: 'ショートカット',
    helpFeature1: '文法とスタイルを修正',
    helpFeature2: '文章を短く/長くする',
    helpFeature3: 'より丁寧な表現にする',
    helpFeature4: '10言語へ翻訳: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: '文体を変更: フォーマル/カジュアル',
    helpFeature6: 'カスタム指示とテンプレートを利用',
    helpFeature7: '音声入力と txt/md/docx/pdf の読込',
    helpHowTo1: 'ページ上のテキストを選択し、SmartTextパネルのアクションを押します。',
    helpHowTo2: 'またはテキスト選択後、右クリック → SmartText → アクションを選択。',
    helpHowTo3: 'またはこのパネルにテキストを貼り付け、アクションボタンを押します。',
    helpHowTo4: '翻訳は「🌐 言語」タブを開き、対象言語を選択します。',
    helpHowTo5: '結果はコピー、または入力欄へ挿入できます。',
    shortcutClosePanel: 'フローティングパネルを閉じる',
    voiceListening: '聞き取り中…',
    voiceListeningPreview: '聞き取り中: {preview}',
    voiceAdded: '追加: {preview}',
    voiceStopped: '音声入力を停止しました',
    voiceUnsupported: 'このブラウザは音声入力に対応していません。',
    voiceStartFailed: 'マイクを開始できませんでした',
    voiceNotAllowed: 'マイクアクセスがブロックされています。"⚙️ 詳細を開く" を押して許可してください。',
    voiceNoSpeech: '音声を検出できませんでした。もう一度お試しください。',
    voiceNoDevice: 'マイクが見つかりません。入力デバイスを確認してください。',
    voiceBusy: 'マイクは他のアプリで使用中です。',
    voicePermissionError: 'マイクアクセスを要求できませんでした。',
    voiceOpenSettings: '⚙️ 詳細を開く',
    voiceManualSteps: 'マイク有効化手順:\n1) サイト設定\n2) マイク → 許可\n3) ページ/拡張機能を再読み込みし、再度🎤を押す',
    voicePermissionGranted: 'マイクアクセスが許可されました。もう一度押すと開始します。',
    voiceErrorPrefix: 'マイクエラー: {error}',
    fileReading: 'ファイル読み込み中: {name}…',
    fileNoText: 'ファイル内にテキストがありません。',
    fileLoaded: 'ファイル読み込み完了: {name} ({chars} 文字)',
    fileLoadError: 'ファイル読み込みエラー。',
    initUnavailable: 'ローカルAIは利用できません',
    initAvailable: 'ローカルAIは利用可能です',
    initError: '初期化エラー',
    unitMinutes: '分'
  },
  uk: {
    buttonHelp: 'ℹ Інструкція',
    statusLoading: 'Завантаження...',
    statusCheckingAI: 'Перевірка локального AI...',
    statusGenerating: 'Генерація...',
    statusReady: 'Готово',
    statusError: 'Помилка',
    statusWarmup: 'Прогрів моделі...',
    statusWarmed: 'Модель прогріта',
    statusHistoryEmpty: 'Історія порожня',
    statusNoStats: 'Ще немає даних',
    statusSaved: '✓ Збережено',
    titleActions: '✦ Дії',
    titleLanguages: '🌐 Мови',
    titleHistory: '📋 Історія',
    titleStats: '📊 Статистика',
    labelInputText: 'ТЕКСТ ДЛЯ ОБРОБКИ',
    labelCustomPrompt: 'ДОВІЛЬНИЙ ЗАПИТ',
    labelTemplates: 'ШАБЛОНИ ПРОМПТІВ',
    labelResult: 'РЕЗУЛЬТАТ',
    labelLanguages: 'ПЕРЕКЛАД НА ІНШІ МОВИ',
    labelStatsByAction: 'ЗА ДІЯМИ',
    labelStatTotal: 'Виконано операцій',
    labelStatChars: 'Оброблено символів',
    labelStatTime: 'Заощаджено часу',
    placeholderInput: 'Вставте або введіть текст тут...\n\nАбо виділіть текст на будь-якій сторінці та запустіть дію з плаваючої панелі SmartText.',
    placeholderNeedText: '← Введіть текст тут',
    placeholderCustomPrompt: 'Наприклад: перепиши в стилі Шекспіра...',
    placeholderTemplateName: 'Назва шаблону (наприклад: HR відповідь)',
    placeholderTemplatePrompt: 'Текст шаблону. Наприклад: перепиши у формальному діловому стилі та додай чіткий CTA.',
    buttonVoice: '🎤 Голос',
    buttonVoiceUnavailable: '🎤 Недоступно',
    buttonVoiceStop: '⏹ Стоп',
    buttonFile: '📎 Файл',
    buttonCustomRun: '→',
    buttonAddTemplate: '+ Додати шаблон',
    buttonCopy: '📋 Копіювати',
    buttonCopied: '✓ Скопійовано',
    buttonInsert: '↩ Вставити',
    buttonInserted: '✓ Вставлено',
    buttonExportJson: '⬇ JSON',
    buttonExportCsv: '⬇ CSV',
    buttonClearHistory: '🗑 Очистити історію',
    buttonSaveSettings: 'Зберегти налаштування',
    buttonApplyTemplate: '▶ Застосувати',
    buttonDeleteTemplate: 'Видалити',
    buttonUseHistory: '← Використати',
    emptyTemplates: 'Шаблонів поки немає',
    historyActionCopy: '📋 Копіювати',
    historyActionUse: '← Використати',
    settingsAiTitle: 'AI МОДЕЛЬ',
    settingsModel: 'Модель',
    settingsUiLanguage: 'Мова інтерфейсу',
    settingsUiAuto: 'Авто',
    settingsTemperature: 'Температура',
    settingsMaxTokens: 'Макс. довжина відповіді',
    settingsPreload: 'Попереднє завантаження моделі',
    settingsPanelTitle: 'ПЛАВАЮЧА ПАНЕЛЬ',
    settingsPanelEnabled: 'Увімкнути панель',
    settingsDelay: 'Затримка',
    settingsMs: 'мс',
    settingsPanelButtons: 'Кнопки в панелі',
    settingsPrivacyTitle: 'ПРИВАТНІСТЬ',
    settingsSaveHistory: 'Зберігати історію',
    settingsShowNotify: 'Показувати сповіщення',
    settingsSyncHistory: 'Синхронізувати історію між пристроями',
    settingsModeTitle: 'РЕЖИМ AI',
    settingsModeLocal: 'Локально, без API-ключа',
    helpKicker: 'SMARTTEXT GUIDE',
    helpTitle: 'Як користуватися SmartText',
    helpForWhatTitle: 'Для чого це розширення',
    helpForWhatText: 'SmartText допомагає швидко редагувати текст у браузері: виправляти помилки, скорочувати, розширювати, змінювати тон і перекладати. Усе працює локально через Chrome Built-in AI без API-ключів.',
    helpFeaturesTitle: 'Що вміє SmartText',
    helpHowToTitle: 'Як використовувати',
    helpShortcutsTitle: 'Гарячі клавіші',
    helpFeature1: 'Виправляти граматику і стиль',
    helpFeature2: 'Робити текст коротшим або довшим',
    helpFeature3: 'Робити текст ввічливішим',
    helpFeature4: 'Перекладати на 10 мов: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Змінювати стиль: формальний або розмовний',
    helpFeature6: 'Використовувати довільні інструкції та шаблони',
    helpFeature7: 'Використовувати голосове введення і завантаження txt/md/docx/pdf',
    helpHowTo1: 'Виділіть текст на сторінці та натисніть дію у панелі SmartText.',
    helpHowTo2: 'Або виділіть текст, правий клік → SmartText → виберіть дію.',
    helpHowTo3: 'Або вставте текст у цю панель і натисніть кнопку дії.',
    helpHowTo4: 'Для перекладів відкрийте вкладку "🌐 Мови" і виберіть цільову мову.',
    helpHowTo5: 'Результат можна скопіювати або вставити у активне поле.',
    shortcutClosePanel: 'Закрити плаваючу панель',
    voiceListening: 'Слухаю…',
    voiceListeningPreview: 'Слухаю: {preview}',
    voiceAdded: 'Додано: {preview}',
    voiceStopped: 'Голосове введення зупинено',
    voiceUnsupported: 'Голосове введення не підтримується у цьому браузері.',
    voiceStartFailed: 'Не вдалося запустити мікрофон',
    voiceNotAllowed: 'Доступ до мікрофона заблоковано. Натисніть "⚙️ Відкрити відомості" і дозвольте мікрофон.',
    voiceNoSpeech: 'Мовлення не розпізнано. Спробуйте ще раз.',
    voiceNoDevice: 'Мікрофон не знайдено. Перевірте пристрій введення.',
    voiceBusy: 'Мікрофон уже використовується іншим застосунком.',
    voicePermissionError: 'Не вдалося запросити доступ до мікрофона.',
    voiceOpenSettings: '⚙️ Відкрити відомості',
    voiceManualSteps: 'Як увімкнути мікрофон:\n1) Налаштування сайту\n2) Мікрофон → Дозволити\n3) Оновіть сторінку/розширення і натисніть 🎤 ще раз',
    voicePermissionGranted: 'Доступ до мікрофона отримано. Натисніть ще раз для старту.',
    voiceErrorPrefix: 'Помилка мікрофона: {error}',
    fileReading: 'Читаю файл: {name}…',
    fileNoText: 'У файлі немає тексту.',
    fileLoaded: 'Файл завантажено: {name} ({chars} симв.)',
    fileLoadError: 'Помилка завантаження файлу.',
    initUnavailable: 'Локальний AI недоступний',
    initAvailable: 'Локальний AI доступний',
    initError: 'Помилка ініціалізації',
    unitMinutes: 'хв'
  },
  pl: {
    buttonHelp: 'ℹ Instrukcja',
    statusLoading: 'Ładowanie...',
    statusCheckingAI: 'Sprawdzanie lokalnego AI...',
    statusGenerating: 'Generowanie...',
    statusReady: 'Gotowe',
    statusError: 'Błąd',
    statusWarmup: 'Rozgrzewanie modelu...',
    statusWarmed: 'Model gotowy',
    statusHistoryEmpty: 'Historia jest pusta',
    statusNoStats: 'Brak danych',
    statusSaved: '✓ Zapisano',
    titleActions: '✦ Akcje',
    titleLanguages: '🌐 Języki',
    titleHistory: '📋 Historia',
    titleStats: '📊 Statystyki',
    labelInputText: 'TEKST DO PRZETWORZENIA',
    labelCustomPrompt: 'WŁASNY PROMPT',
    labelTemplates: 'SZABLONY PROMPTÓW',
    labelResult: 'WYNIK',
    labelLanguages: 'TŁUMACZENIE NA INNE JĘZYKI',
    labelStatsByAction: 'WG AKCJI',
    labelStatTotal: 'Wykonane operacje',
    labelStatChars: 'Przetworzone znaki',
    labelStatTime: 'Zaoszczędzony czas',
    placeholderInput: 'Wklej lub wpisz tekst tutaj...\n\nAlbo zaznacz tekst na stronie i uruchom akcję z panelu SmartText.',
    placeholderNeedText: '← Wpisz tekst tutaj',
    placeholderCustomPrompt: 'Na przykład: przepisz w stylu Szekspira...',
    placeholderTemplateName: 'Nazwa szablonu (np. odpowiedź HR)',
    placeholderTemplatePrompt: 'Treść szablonu. Przykład: przepisz formalnie i dodaj wyraźne CTA.',
    buttonVoice: '🎤 Głos',
    buttonVoiceUnavailable: '🎤 Niedostępne',
    buttonVoiceStop: '⏹ Stop',
    buttonFile: '📎 Plik',
    buttonCustomRun: '→',
    buttonAddTemplate: '+ Dodaj szablon',
    buttonCopy: '📋 Kopiuj',
    buttonCopied: '✓ Skopiowano',
    buttonInsert: '↩ Wstaw',
    buttonInserted: '✓ Wstawiono',
    buttonExportJson: '⬇ JSON',
    buttonExportCsv: '⬇ CSV',
    buttonClearHistory: '🗑 Wyczyść historię',
    buttonSaveSettings: 'Zapisz ustawienia',
    buttonApplyTemplate: '▶ Zastosuj',
    buttonDeleteTemplate: 'Usuń',
    buttonUseHistory: '← Użyj',
    emptyTemplates: 'Brak szablonów',
    historyActionCopy: '📋 Kopiuj',
    historyActionUse: '← Użyj',
    settingsAiTitle: 'MODEL AI',
    settingsModel: 'Model',
    settingsUiLanguage: 'Język interfejsu',
    settingsUiAuto: 'Auto',
    settingsTemperature: 'Temperatura',
    settingsMaxTokens: 'Maks. długość odpowiedzi',
    settingsPreload: 'Wstępne ładowanie modelu',
    settingsPanelTitle: 'PŁYWAJĄCY PANEL',
    settingsPanelEnabled: 'Włącz panel',
    settingsDelay: 'Opóźnienie',
    settingsMs: 'ms',
    settingsPanelButtons: 'Przyciski panelu',
    settingsPrivacyTitle: 'PRYWATNOŚĆ',
    settingsSaveHistory: 'Zapisuj historię',
    settingsShowNotify: 'Pokaż powiadomienia',
    settingsSyncHistory: 'Synchronizuj historię między urządzeniami',
    settingsModeTitle: 'TRYB AI',
    settingsModeLocal: 'Lokalnie, bez klucza API',
    helpKicker: 'PRZEWODNIK SMARTTEXT',
    helpTitle: 'Jak używać SmartText',
    helpForWhatTitle: 'Do czego służy to rozszerzenie',
    helpForWhatText: 'SmartText pomaga szybciej edytować tekst w przeglądarce: poprawiać błędy, skracać, rozwijać, zmieniać ton i tłumaczyć. Wszystko działa lokalnie przez Chrome Built-in AI bez kluczy API.',
    helpFeaturesTitle: 'Co potrafi SmartText',
    helpHowToTitle: 'Jak używać',
    helpShortcutsTitle: 'Skróty klawiszowe',
    helpFeature1: 'Poprawianie gramatyki i stylu',
    helpFeature2: 'Skracanie i rozwijanie tekstu',
    helpFeature3: 'Uprzejmiejszy ton',
    helpFeature4: 'Tłumaczenie na 10 języków: RU, EN, ES, DE, FR, IT, PT, JA, UK, PL',
    helpFeature5: 'Zmiana stylu: formalny lub swobodny',
    helpFeature6: 'Własne instrukcje i szablony',
    helpFeature7: 'Wprowadzanie głosowe i pliki txt/md/docx/pdf',
    helpHowTo1: 'Zaznacz tekst na stronie i kliknij akcję w panelu SmartText.',
    helpHowTo2: 'Lub zaznacz tekst, kliknij PPM → SmartText → wybierz akcję.',
    helpHowTo3: 'Lub wklej tekst do panelu i kliknij przycisk akcji.',
    helpHowTo4: 'Do tłumaczeń otwórz zakładkę "🌐 Języki" i wybierz język docelowy.',
    helpHowTo5: 'Wynik możesz skopiować lub wstawić do aktywnego pola.',
    shortcutClosePanel: 'Zamknij pływający panel',
    voiceListening: 'Słucham…',
    voiceListeningPreview: 'Słucham: {preview}',
    voiceAdded: 'Dodano: {preview}',
    voiceStopped: 'Dyktowanie zatrzymane',
    voiceUnsupported: 'Dyktowanie nie jest wspierane w tej przeglądarce.',
    voiceStartFailed: 'Nie udało się uruchomić mikrofonu',
    voiceNotAllowed: 'Dostęp do mikrofonu jest zablokowany. Kliknij "⚙️ Otwórz szczegóły" i zezwól na mikrofon.',
    voiceNoSpeech: 'Nie wykryto mowy. Spróbuj ponownie.',
    voiceNoDevice: 'Nie znaleziono mikrofonu. Sprawdź urządzenie wejściowe.',
    voiceBusy: 'Mikrofon jest już używany przez inną aplikację.',
    voicePermissionError: 'Nie udało się poprosić o dostęp do mikrofonu.',
    voiceOpenSettings: '⚙️ Otwórz szczegóły',
    voiceManualSteps: 'Jak włączyć mikrofon:\n1) Ustawienia witryny\n2) Mikrofon → Zezwól\n3) Odśwież stronę/rozszerzenie i kliknij 🎤 ponownie',
    voicePermissionGranted: 'Dostęp do mikrofonu przyznany. Kliknij ponownie, aby uruchomić.',
    voiceErrorPrefix: 'Błąd mikrofonu: {error}',
    fileReading: 'Czytanie pliku: {name}…',
    fileNoText: 'Nie znaleziono tekstu w pliku.',
    fileLoaded: 'Plik wczytany: {name} ({chars} znaków)',
    fileLoadError: 'Błąd wczytywania pliku.',
    initUnavailable: 'Lokalne AI jest niedostępne',
    initAvailable: 'Lokalne AI jest dostępne',
    initError: 'Błąd inicjalizacji',
    unitMinutes: 'min'
  }
};

for (const [lang, translations] of Object.entries(UI_TEXT_TRANSLATIONS)) {
  UI_TEXT[lang] = { ...UI_TEXT.en, ...translations };
}

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
    casual: 'Просто'
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
    casual: 'Casual'
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
    casual: 'Casual'
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
    casual: 'Locker'
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
    casual: 'Décontracté'
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
    casual: 'Informale'
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
    casual: 'Casual'
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
    casual: 'カジュアル'
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
    casual: 'Просто'
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
    casual: 'Swobodnie'
  }
};

// ---- STATE ----
let isReady = false;
let isGenerating = false;
let lastResult = '';
let lastTabId = null;
let currentAction = null;
let appSettings = { ...DEFAULT_SETTINGS };
let templates = [];
let recognition = null;
let isListening = false;
let uiLang = 'ru';
let microphoneAccessState = 'unknown';

// ---- DOM ----
const mainApp = document.getElementById('mainApp');
const statusDot = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const inputText = document.getElementById('inputText');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const uploadFileBtn = document.getElementById('uploadFileBtn');
const fileInput = document.getElementById('fileInput');
const inputToolStatus = document.getElementById('inputToolStatus');
const micHelpBtn = document.getElementById('micHelpBtn');
const micHelpText = document.getElementById('micHelpText');
const actionsGrid = document.getElementById('actionsGrid');
const languagesGrid = document.getElementById('languagesGrid');
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
const settingUILang = document.getElementById('settingUILang');
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
const helpKicker = document.getElementById('helpKicker');
const helpBody = document.getElementById('helpBody');

// ---- UTILS ----
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function resolveUiLanguage(configValue) {
  if (SUPPORTED_UI_LANGS.includes(configValue)) return configValue;
  const browserLang = String(globalThis.navigator?.language || '').toLowerCase();
  for (const lang of SUPPORTED_UI_LANGS) {
    if (browserLang.startsWith(`${lang}-`) || browserLang === lang) return lang;
  }
  return 'en';
}

function localeCode() {
  return LANG_TO_LOCALE[uiLang] || 'en-US';
}

function t(key, vars = {}) {
  const dict = UI_TEXT[uiLang] || UI_TEXT.en;
  const fallback = UI_TEXT.en;
  const template = (dict && key in dict ? dict[key] : fallback[key]) || key;
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token) => String(vars[token] ?? ''));
}

function getActionLabel(actionId) {
  return ACTION_LABELS[uiLang]?.[actionId] || ACTION_LABELS.en[actionId] || ACTION_META[actionId]?.label || actionId;
}

function getActionMeta(actionId) {
  const fallback = ACTION_META[actionId] || { icon: '✦', shortcut: '' };
  return {
    ...fallback,
    label: getActionLabel(actionId)
  };
}

function updateVoiceButtonText() {
  if (!voiceInputBtn) return;
  if (voiceInputBtn.disabled) {
    voiceInputBtn.textContent = t('buttonVoiceUnavailable');
    return;
  }
  voiceInputBtn.textContent = isListening ? t('buttonVoiceStop') : t('buttonVoice');
}

function renderHelpContent() {
  if (!helpBody) return;
  helpBody.innerHTML = `
    <div class="help-section">
      <div class="help-label">${escHtml(t('helpForWhatTitle'))}</div>
      <p>${escHtml(t('helpForWhatText'))}</p>
    </div>
    <div class="help-section">
      <div class="help-label">${escHtml(t('helpFeaturesTitle'))}</div>
      <ul class="help-list">
        <li>${escHtml(t('helpFeature1'))}</li>
        <li>${escHtml(t('helpFeature2'))}</li>
        <li>${escHtml(t('helpFeature3'))}</li>
        <li>${escHtml(t('helpFeature4'))}</li>
        <li>${escHtml(t('helpFeature5'))}</li>
        <li>${escHtml(t('helpFeature6'))}</li>
        <li>${escHtml(t('helpFeature7'))}</li>
      </ul>
    </div>
    <div class="help-section">
      <div class="help-label">${escHtml(t('helpHowToTitle'))}</div>
      <ul class="help-list">
        <li>${escHtml(t('helpHowTo1'))}</li>
        <li>${escHtml(t('helpHowTo2'))}</li>
        <li>${escHtml(t('helpHowTo3'))}</li>
        <li>${escHtml(t('helpHowTo4'))}</li>
        <li>${escHtml(t('helpHowTo5'))}</li>
      </ul>
    </div>
    <div class="help-section">
      <div class="help-label">${escHtml(t('helpShortcutsTitle'))}</div>
      <div class="shortcut-list" id="helpShortcutsList"></div>
    </div>
  `;
}

function applyStaticTranslations() {
  document.documentElement.lang = uiLang;

  const textMap = {
    helpBtn: 'buttonHelp',
    tabActionsBtn: 'titleActions',
    tabLanguagesBtn: 'titleLanguages',
    tabHistoryBtn: 'titleHistory',
    tabStatsBtn: 'titleStats',
    tabSettingsBtn: 'titleSettings',
    labelInputText: 'labelInputText',
    labelCustomPrompt: 'labelCustomPrompt',
    labelTemplates: 'labelTemplates',
    labelResult: 'labelResult',
    labelLanguages: 'labelLanguages',
    labelStatTotal: 'labelStatTotal',
    labelStatChars: 'labelStatChars',
    labelStatTime: 'labelStatTime',
    labelStatsByAction: 'labelStatsByAction',
    titleGroupAi: 'settingsAiTitle',
    labelModel: 'settingsModel',
    labelUILang: 'settingsUiLanguage',
    labelTemperature: 'settingsTemperature',
    labelMaxTokens: 'settingsMaxTokens',
    labelPreload: 'settingsPreload',
    titleGroupPanel: 'settingsPanelTitle',
    labelPanelEnabled: 'settingsPanelEnabled',
    labelPanelDelay: 'settingsDelay',
    labelMs: 'settingsMs',
    labelPanelButtons: 'settingsPanelButtons',
    titleGroupPrivacy: 'settingsPrivacyTitle',
    labelSaveHistory: 'settingsSaveHistory',
    labelShowNotify: 'settingsShowNotify',
    labelSyncHistory: 'settingsSyncHistory',
    titleGroupMode: 'settingsModeTitle',
    labelModeLocal: 'settingsModeLocal',
    copyResultBtn: 'buttonCopy',
    insertResultBtn: 'buttonInsert',
    exportJsonBtn: 'buttonExportJson',
    exportCsvBtn: 'buttonExportCsv',
    clearHistoryBtn: 'buttonClearHistory',
    saveSettingsBtn: 'buttonSaveSettings',
    helpTitle: 'helpTitle',
    helpKicker: 'helpKicker',
    uploadFileBtn: 'buttonFile',
    addTemplateBtn: 'buttonAddTemplate'
  };

  Object.entries(textMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  });

  if (clearResultBtn) clearResultBtn.textContent = '✕';
  if (customRunBtn) customRunBtn.textContent = t('buttonCustomRun');
  updateVoiceButtonText();
  if (micHelpBtn && micHelpBtn.style.display !== 'none') {
    micHelpBtn.textContent = t('voiceOpenSettings');
  }
  if (micHelpText && micHelpText.style.display !== 'none') {
    micHelpText.textContent = t('voiceManualSteps');
  }

  if (inputText) inputText.placeholder = t('placeholderInput');
  if (customPrompt) customPrompt.placeholder = t('placeholderCustomPrompt');
  if (templateNameInput) templateNameInput.placeholder = t('placeholderTemplateName');
  if (templatePromptInput) templatePromptInput.placeholder = t('placeholderTemplatePrompt');

  if (settingUILang) {
    const autoOpt = settingUILang.querySelector('option[value="auto"]');
    if (autoOpt) autoOpt.textContent = t('settingsUiAuto');
    Object.entries(UI_LANG_OPTION_LABELS).forEach(([value, label]) => {
      const opt = settingUILang.querySelector(`option[value="${value}"]`);
      if (opt) opt.textContent = label;
    });
  }

  renderHelpContent();
}

function setStatus(state, label) {
  statusDot.className = 'status-dot ' + state;
  statusLabel.textContent = label;
}

function hideMicHelp() {
  if (micHelpBtn) micHelpBtn.style.display = 'none';
  if (micHelpText) {
    micHelpText.style.display = 'none';
    micHelpText.className = 'input-tool-help';
    micHelpText.textContent = '';
  }
}

function showMicHelp() {
  if (micHelpBtn) {
    micHelpBtn.style.display = 'inline-flex';
    micHelpBtn.textContent = t('voiceOpenSettings');
  }
  if (micHelpText) {
    micHelpText.style.display = 'block';
    micHelpText.className = 'input-tool-help error';
    micHelpText.textContent = t('voiceManualSteps');
  }
}

async function openMicDetailsPage() {
  const detailsUrl = `chrome://extensions/?id=${chrome.runtime.id}`;
  try {
    await chrome.tabs.create({ url: detailsUrl });
  } catch (_) {
    setInputToolStatus(`${t('voiceManualSteps')}\n${detailsUrl}`, 'error');
  }
}

function setInputToolStatus(text, kind = '') {
  if (!inputToolStatus) return;
  inputToolStatus.textContent = text || '';
  inputToolStatus.className = 'input-tool-status';
  if (kind) inputToolStatus.classList.add(kind);
  if (kind !== 'error') {
    hideMicHelp();
  }
}

function appendTextToInput(insertText) {
  const text = String(insertText || '').trim();
  if (!text) return;

  const start = typeof inputText.selectionStart === 'number' ? inputText.selectionStart : inputText.value.length;
  const end = typeof inputText.selectionEnd === 'number' ? inputText.selectionEnd : inputText.value.length;
  const left = inputText.value.slice(0, start);
  const right = inputText.value.slice(end);
  const needsLeftGap = left && !/\s$/.test(left);
  const needsRightGap = right && !/^\s/.test(right);
  const insertion = `${needsLeftGap ? ' ' : ''}${text}${needsRightGap ? ' ' : ''}`;

  inputText.value = left + insertion + right;
  const caret = (left + insertion).length;
  inputText.setSelectionRange(caret, caret);
  inputText.dispatchEvent(new Event('input', { bubbles: true }));
}

function resetVoiceButton() {
  if (!voiceInputBtn) return;
  voiceInputBtn.classList.remove('voice-active');
  voiceInputBtn.textContent = voiceInputBtn.disabled ? t('buttonVoiceUnavailable') : t('buttonVoice');
}

function shortPreview(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return '';
  return trimmed.length > 50 ? `${trimmed.slice(0, 50)}…` : trimmed;
}

function speechLanguage() {
  if (SUPPORTED_UI_LANGS.includes(appSettings.uiLanguage)) {
    return LANG_TO_LOCALE[appSettings.uiLanguage] || 'en-US';
  }
  return navigator.language || 'en-US';
}

function mapSpeechError(errorCode) {
  switch (String(errorCode || '').toLowerCase()) {
    case 'not-allowed':
    case 'service-not-allowed':
      return t('voiceNotAllowed');
    case 'no-speech':
      return t('voiceNoSpeech');
    case 'audio-capture':
      return t('voiceNoDevice');
    case 'aborted':
      return t('voiceStopped');
    case 'network':
      return t('voiceBusy');
    default:
      return t('voiceErrorPrefix', { error: errorCode || 'unknown' });
  }
}

async function getMicPermissionState() {
  try {
    if (!navigator.permissions?.query) return 'unknown';
    const result = await navigator.permissions.query({ name: 'microphone' });
    return result?.state || 'unknown';
  } catch (_) {
    return 'unknown';
  }
}

async function ensureMicrophonePermission() {
  if (microphoneAccessState === 'granted') return { ok: true, newlyGranted: false };

  const permissionState = await getMicPermissionState();
  if (permissionState === 'granted') {
    microphoneAccessState = 'granted';
    return { ok: true, newlyGranted: false };
  }
  if (permissionState === 'denied') {
    microphoneAccessState = 'denied';
    setInputToolStatus(t('voiceNotAllowed'), 'error');
    showMicHelp();
    return { ok: false, newlyGranted: false };
  }

  const api = globalThis.navigator?.mediaDevices?.getUserMedia;
  if (typeof api !== 'function') {
    setInputToolStatus(t('voicePermissionError'), 'error');
    return { ok: false, newlyGranted: false };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    microphoneAccessState = 'granted';
    return { ok: true, newlyGranted: true };
  } catch (err) {
    const name = String(err?.name || '').toLowerCase();
    if (name === 'notallowederror' || name === 'securityerror') {
      microphoneAccessState = 'denied';
      setInputToolStatus(t('voiceNotAllowed'), 'error');
      showMicHelp();
      return { ok: false, newlyGranted: false };
    }
    if (name === 'notfounderror') {
      microphoneAccessState = 'denied';
      setInputToolStatus(t('voiceNoDevice'), 'error');
      return { ok: false, newlyGranted: false };
    }
    microphoneAccessState = 'unknown';
    setInputToolStatus(t('voicePermissionError'), 'error');
    return { ok: false, newlyGranted: false };
  }
}

function stopVoiceInput() {
  isListening = false;
  try {
    recognition?.stop();
  } catch (_) {}
  resetVoiceButton();
}

function ensureVoiceRecognition() {
  if (recognition) return recognition;

  const RecognitionCtor = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!RecognitionCtor) return null;

  recognition = new RecognitionCtor();
  recognition.lang = speechLanguage();
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    isListening = true;
    voiceInputBtn?.classList.add('voice-active');
    if (voiceInputBtn) voiceInputBtn.textContent = t('buttonVoiceStop');
    setInputToolStatus(t('voiceListening'), 'ok');
  };

  recognition.onresult = (event) => {
    let finalText = '';
    let interimText = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const phrase = event.results[i]?.[0]?.transcript || '';
      if (event.results[i].isFinal) {
        finalText += phrase + ' ';
      } else {
        interimText += phrase + ' ';
      }
    }

    if (finalText.trim()) {
      appendTextToInput(finalText);
      const preview = shortPreview(finalText);
      setInputToolStatus(t('voiceAdded', { preview }), 'ok');
      return;
    }

    if (interimText.trim()) {
      const preview = shortPreview(interimText);
      setInputToolStatus(t('voiceListeningPreview', { preview }));
    }
  };

  recognition.onerror = (event) => {
    const code = String(event?.error || '').toLowerCase();
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      microphoneAccessState = 'denied';
      showMicHelp();
    }
    const msg = mapSpeechError(event?.error);
    setInputToolStatus(msg, 'error');
    isListening = false;
    resetVoiceButton();
  };

  recognition.onend = () => {
    if (isListening) {
      setInputToolStatus(t('voiceStopped'));
    }
    isListening = false;
    resetVoiceButton();
  };

  return recognition;
}

async function toggleVoiceInput() {
  const rec = ensureVoiceRecognition();
  if (!rec) {
    setInputToolStatus(t('voiceUnsupported'), 'error');
    return;
  }

  if (isListening) {
    stopVoiceInput();
    return;
  }

  const permission = await ensureMicrophonePermission();
  if (!permission.ok) return;
  if (permission.newlyGranted) {
    setInputToolStatus(t('voicePermissionGranted'), 'ok');
    return;
  }

  try {
    rec.lang = speechLanguage();
    rec.start();
  } catch (err) {
    const name = String(err?.name || '').toLowerCase();
    let msg = err?.message || t('voiceStartFailed');
    if (name === 'notallowederror' || name === 'securityerror') {
      msg = t('voiceNotAllowed');
      showMicHelp();
    } else if (name === 'notfounderror') {
      msg = t('voiceNoDevice');
    }
    setInputToolStatus(msg, 'error');
  }
}

async function handleSelectedFile(file) {
  if (!file) return;
  setInputToolStatus(t('fileReading', { name: file.name }));

  try {
    const text = await parseUploadedFile(file);
    if (!text.trim()) {
      throw new Error(t('fileNoText'));
    }

    if (inputText.value.trim()) {
      inputText.value += '\n\n' + text;
    } else {
      inputText.value = text;
    }
    inputText.dispatchEvent(new Event('input', { bubbles: true }));
    setInputToolStatus(t('fileLoaded', { name: file.name, chars: text.length }), 'ok');
  } catch (err) {
    setInputToolStatus(err?.message || t('fileLoadError'), 'error');
  } finally {
    if (fileInput) fileInput.value = '';
  }
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
  const meta = getActionMeta(actionId);
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
  if (!actionsGrid) return;
  actionsGrid.innerHTML = CORE_ACTION_IDS.map(actionButtonHtml).join('');
}

function renderLanguageButtons() {
  if (!languagesGrid) return;
  languagesGrid.innerHTML = LANGUAGE_ACTION_IDS.map(actionButtonHtml).join('');
}

function renderActionToggles() {
  const enabled = new Set(normalizeEnabledActions(appSettings.enabledActions));
  actionsToggleList.innerHTML = ALL_ACTION_IDS.map((id) => {
    const meta = getActionMeta(id);
    return `
      <label class="action-toggle-item">
        <input type="checkbox" value="${id}" ${enabled.has(id) ? 'checked' : ''}>
        <span class="action-toggle-label">${escHtml(meta.icon)} ${escHtml(meta.label)}</span>
      </label>
    `;
  }).join('');
}

function applySettingsToUi() {
  uiLang = resolveUiLanguage(appSettings.uiLanguage);
  applyStaticTranslations();

  const hasModelOption = [...settingModel.options].some((opt) => opt.value === appSettings.model);
  settingModel.value = hasModelOption ? appSettings.model : DEFAULT_SETTINGS.model;
  const hasLangOption = [...settingUILang.options].some((opt) => opt.value === appSettings.uiLanguage);
  settingUILang.value = hasLangOption ? appSettings.uiLanguage : DEFAULT_SETTINGS.uiLanguage;
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
  renderLanguageButtons();
}

function renderHelpShortcuts() {
  const helpShortcutsList = document.getElementById('helpShortcutsList');
  if (!helpShortcutsList) return;
  const enabled = new Set(normalizeEnabledActions(appSettings.enabledActions));
  const items = Object.entries(ACTION_META)
    .filter(([id, meta]) => meta.shortcut && enabled.has(id))
    .map(([id, meta]) => ({ label: getActionLabel(id), shortcut: meta.shortcut }));

  items.push({ label: t('shortcutClosePanel'), shortcut: 'Esc' });

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
    templatesList.innerHTML = `<div class="empty-state">${escHtml(t('emptyTemplates'))}</div>`;
    return;
  }

  templatesList.innerHTML = templates.map((tpl) => `
    <div class="template-item">
      <div class="template-name">${escHtml(tpl.name)}</div>
      <div class="template-prompt">${escHtml(tpl.prompt)}</div>
      <div class="template-actions">
        <button class="mini-btn t-run" data-id="${escAttr(tpl.id)}">${escHtml(t('buttonApplyTemplate'))}</button>
        <button class="mini-btn danger t-del" data-id="${escAttr(tpl.id)}">${escHtml(t('buttonDeleteTemplate'))}</button>
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
    setStatus('error', t('statusHistoryEmpty'));
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
  [actionsGrid, languagesGrid].forEach((grid) => {
    if (!grid) return;
    grid.querySelectorAll('.action-btn').forEach((b) => {
      b.disabled = disabled;
    });
  });
}

async function generate(action, text, instruction = '') {
  if (isGenerating || !text.trim()) return;
  if (isListening) stopVoiceInput();
  isGenerating = true;
  currentAction = action;

  setStatus('busy', t('statusGenerating'));
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
    setStatus('ready', t('statusReady'));

    if (appSettings.saveHistory) {
      chrome.runtime.sendMessage({
        type: 'SAVE_HISTORY',
        entry: { action, original, result: lastResult }
      });
    }
    chrome.runtime.sendMessage({ type: 'UPDATE_STATS', action, chars: original.length });
    if (appSettings.showNotify) {
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'SmartText',
        message: `${getActionLabel(action)}: ${t('statusReady')}`
      }).catch(() => {});
    }
  } catch (e) {
    genBar.style.display = 'none';
    resultText.textContent = `⚠ ${t('statusError')}: ${e.message}`;
    resultText.style.color = '#f87171';
    setStatus('error', t('statusError'));
    if (appSettings.showNotify) {
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'SmartText',
        message: `${t('statusError')}: ${String(e?.message || '')}`
      }).catch(() => {});
    }
  }

  isGenerating = false;
  setActionsDisabled(false);
}

async function renderHistory() {
  const history = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
  historyList.innerHTML = '';
  if (!history.length) {
    historyList.innerHTML = `<div class="empty-state">${escHtml(t('statusHistoryEmpty'))}</div>`;
    return;
  }

  for (const item of history) {
    const meta = getActionMeta(item.action) || { label: item.action, icon: '✦' };
    const date = new Date(item.ts);
    const timeStr = date.toLocaleTimeString(localeCode(), { hour: '2-digit', minute: '2-digit' });
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
        <button class="mini-btn h-copy" data-text="${escAttr(item.result)}">${escHtml(t('historyActionCopy'))}</button>
        <button class="mini-btn h-use" data-text="${escAttr(item.result)}">${escHtml(t('historyActionUse'))}</button>
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
  document.getElementById('statChars').textContent = chars.toLocaleString(localeCode());
  document.getElementById('statTime').textContent = `${Math.round(total * 0.5)} ${t('unitMinutes')}`;

  const grid = document.getElementById('actionStats');
  grid.innerHTML = '';
  for (const [action, count] of Object.entries(stats)) {
    if (action === '_chars' || !count) continue;
    const meta = getActionMeta(action) || { label: action, icon: '✦' };
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
  if (!grid.children.length) grid.innerHTML = `<div class="empty-state">${escHtml(t('statusNoStats'))}</div>`;
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
    uiLanguage: settingUILang.value,
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

  applySettingsToUi();
  renderActionButtons();
  renderLanguageButtons();
  renderTemplates();
  renderHelpShortcuts();

  await chrome.storage.sync.set(appSettings);
  await notifySettingsUpdated();

  saveSettingsBtn.textContent = t('statusSaved');
  setTimeout(() => {
    saveSettingsBtn.textContent = t('buttonSaveSettings');
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
  const speechSupported = !!(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);
  if (!speechSupported && voiceInputBtn) {
    voiceInputBtn.disabled = true;
    voiceInputBtn.textContent = t('buttonVoiceUnavailable');
  }

  voiceInputBtn?.addEventListener('click', toggleVoiceInput);
  micHelpBtn?.addEventListener('click', () => {
    openMicDetailsPage().catch(() => {});
  });

  uploadFileBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    await handleSelectedFile(file);
  });

  const actionGridClickHandler = (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    const text = inputText.value.trim();
    if (!text) {
      inputText.focus();
      inputText.placeholder = t('placeholderNeedText');
      return;
    }
    generate(btn.dataset.action, text);
  };

  actionsGrid?.addEventListener('click', actionGridClickHandler);
  languagesGrid?.addEventListener('click', actionGridClickHandler);

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
    copyResultBtn.textContent = t('buttonCopied');
    setTimeout(() => {
      copyResultBtn.textContent = t('buttonCopy');
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
    insertResultBtn.textContent = t('buttonInserted');
    setTimeout(() => {
      insertResultBtn.textContent = t('buttonInsert');
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

  settingUILang?.addEventListener('change', () => {
    uiLang = resolveUiLanguage(settingUILang.value);
    applyStaticTranslations();
    renderActionButtons();
    renderLanguageButtons();
    renderActionToggles();
    renderTemplates();
    renderHelpShortcuts();
    renderHistory().catch(() => {});
    renderStats().catch(() => {});
  });

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
      const targetTab = String(msg.action || '').startsWith('to_') ? 'languages' : 'actions';
      document.querySelector(`.tab[data-tab="${targetTab}"]`)?.click();
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

  await loadSettings();
  await loadTemplates();
  setStatus('', t('statusCheckingAI'));
  await checkPending();

  try {
    const aiState = await initLocalAI();
    if (!aiState.available) {
      setStatus('error', t('initUnavailable'));
      return;
    }

    if (appSettings.preloadModel) {
      setStatus('busy', t('statusWarmup'));
      const warmup = await warmupLocalAI();
      if (warmup.warmed) {
        setStatus('ready', t('statusWarmed'));
      } else {
        setStatus('ready', t('initAvailable'));
      }
    } else {
      setStatus('ready', t('initAvailable'));
    }
  } catch (e) {
    setStatus('error', t('initError'));
    console.error('SmartText init error:', e);
  }
}

init();
