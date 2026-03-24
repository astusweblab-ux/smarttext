// ai/file-parsers.js — local file text extraction for SmartText
// Created by ASTUS LAB

const textDecoder = new TextDecoder('utf-8');
let pdfModulePromise = null;

function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getLowerName(file) {
  return String(file?.name || '').toLowerCase();
}

function hasExt(file, ext) {
  return getLowerName(file).endsWith(ext);
}

function getUint32LE(view, offset) {
  return view.getUint32(offset, true);
}

function getUint16LE(view, offset) {
  return view.getUint16(offset, true);
}

async function inflateRaw(data) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Браузер не поддерживает распаковку DOCX (DecompressionStream).');
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function findEocdOffset(bytes, view) {
  const EOCD_SIG = 0x06054b50;
  const minOffset = Math.max(0, bytes.length - 22 - 0xffff);
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (getUint32LE(view, i) === EOCD_SIG) return i;
  }
  return -1;
}

async function unzipSelectedEntries(bytes, namesToRead) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEocdOffset(bytes, view);
  if (eocdOffset < 0) throw new Error('Некорректный DOCX: не найден ZIP footer.');

  const centralDirSize = getUint32LE(view, eocdOffset + 12);
  const centralDirOffset = getUint32LE(view, eocdOffset + 16);
  const centralDirEnd = centralDirOffset + centralDirSize;

  if (centralDirOffset < 0 || centralDirEnd > bytes.length) {
    throw new Error('Некорректный DOCX: повреждён каталог ZIP.');
  }

  const CENTRAL_SIG = 0x02014b50;
  const LOCAL_SIG = 0x04034b50;
  const entries = new Map();

  let offset = centralDirOffset;
  while (offset + 46 <= centralDirEnd && getUint32LE(view, offset) === CENTRAL_SIG) {
    const method = getUint16LE(view, offset + 10);
    const compressedSize = getUint32LE(view, offset + 20);
    const fileNameLen = getUint16LE(view, offset + 28);
    const extraLen = getUint16LE(view, offset + 30);
    const commentLen = getUint16LE(view, offset + 32);
    const localHeaderOffset = getUint32LE(view, offset + 42);
    const nameStart = offset + 46;
    const nameEnd = nameStart + fileNameLen;
    const name = textDecoder.decode(bytes.subarray(nameStart, nameEnd));

    entries.set(name, { method, compressedSize, localHeaderOffset });
    offset = nameEnd + extraLen + commentLen;
  }

  const out = new Map();
  for (const name of namesToRead) {
    const meta = entries.get(name);
    if (!meta) continue;

    const { method, compressedSize, localHeaderOffset } = meta;
    if (localHeaderOffset + 30 > bytes.length || getUint32LE(view, localHeaderOffset) !== LOCAL_SIG) {
      continue;
    }

    const localNameLen = getUint16LE(view, localHeaderOffset + 26);
    const localExtraLen = getUint16LE(view, localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) continue;

    const compressed = bytes.subarray(dataStart, dataEnd);
    let plain;
    if (method === 0) {
      plain = compressed;
    } else if (method === 8) {
      plain = await inflateRaw(compressed);
    } else {
      throw new Error(`DOCX использует неподдерживаемое сжатие ZIP (method=${method}).`);
    }

    out.set(name, textDecoder.decode(plain));
  }

  return out;
}

function extractWordXmlText(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) return '';

  const paragraphs = Array.from(doc.getElementsByTagNameNS('*', 'p'));
  if (!paragraphs.length) {
    const chunks = Array.from(doc.getElementsByTagNameNS('*', 't')).map((n) => n.textContent || '');
    return normalizeText(chunks.join('\n'));
  }

  const lines = [];
  for (const p of paragraphs) {
    const textNodes = Array.from(p.getElementsByTagNameNS('*', 't'));
    const line = textNodes.map((n) => n.textContent || '').join('').trim();
    if (line) lines.push(line);
  }

  return normalizeText(lines.join('\n'));
}

async function parseDocxFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const xmlNames = [
    'word/document.xml',
    'word/header1.xml',
    'word/header2.xml',
    'word/header3.xml',
    'word/footer1.xml',
    'word/footer2.xml',
    'word/footer3.xml',
    'word/footnotes.xml',
    'word/endnotes.xml',
  ];

  const files = await unzipSelectedEntries(bytes, xmlNames);
  if (!files.has('word/document.xml')) {
    throw new Error('В DOCX не найден основной документ.');
  }

  const parts = [];
  for (const name of xmlNames) {
    if (!files.has(name)) continue;
    const text = extractWordXmlText(files.get(name));
    if (text) parts.push(text);
  }

  const merged = normalizeText(parts.join('\n\n'));
  if (!merged) throw new Error('Не удалось извлечь текст из DOCX.');
  return merged;
}

async function getPdfModule() {
  if (!pdfModulePromise) {
    pdfModulePromise = import('../lib/pdf.min.mjs');
  }
  return pdfModulePromise;
}

async function parsePdfFile(file) {
  const pdfjs = await getPdfModule();
  const workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.mjs');
  if (pdfjs?.GlobalWorkerOptions && pdfjs.GlobalWorkerOptions.workerSrc !== workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  }

  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => (typeof item?.str === 'string' ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) pages.push(pageText);
  }

  try {
    await pdf.destroy?.();
  } catch (_) {}

  const merged = normalizeText(pages.join('\n\n'));
  if (!merged) throw new Error('Не удалось извлечь текст из PDF.');
  return merged;
}

export async function parseUploadedFile(file) {
  if (!file) throw new Error('Файл не выбран.');

  try {
    if (hasExt(file, '.txt') || hasExt(file, '.md')) {
      const text = normalizeText(await file.text());
      if (!text) throw new Error('Файл пустой.');
      return text;
    }

    if (hasExt(file, '.docx')) {
      return parseDocxFile(file);
    }

    if (hasExt(file, '.pdf')) {
      return parsePdfFile(file);
    }
  } catch (err) {
    throw new Error(err?.message || 'Не удалось прочитать файл.');
  }

  throw new Error('Поддерживаются только TXT, MD, DOCX, PDF.');
}

