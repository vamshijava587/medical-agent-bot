/**
 * Minimal markdown-to-HTML renderer for assistant responses.
 * Deliberately small: handles the subset Spring AI / LLM responses
 * typically produce (paragraphs, bold, italics, inline code, bullet
 * and numbered lists) without pulling in a full markdown library.
 */
export function renderLiteMarkdown(raw: string): string {
  const normalized = normalizeStructure(raw);
  const escaped = escapeHtml(normalized);
  const blocks = escaped.split(/\n{2,}/);

  const html = blocks
    .map((block) => renderBlock(block.trim()))
    .filter((b) => b.length > 0)
    .join('');

  return html;
}

/**
 * Some models/streaming setups emit plain prose with no real paragraph or
 * list breaks at all — e.g. "...levels.There are types, including:1. Type 1
 * diabetes: ...2. Type 2 diabetes: ...". There's no newline for the
 * block-splitter to find, so we recover structure heuristically:
 *  - a numbered marker like "1." or "2)" that appears after a colon or
 *    period (not at the start of the text) gets pushed onto its own line,
 *    so the existing list-detection logic in renderBlock can pick it up.
 *  - a sentence-ending period immediately followed by a capital letter
 *    with no space ("levels.There") gets a space restored, since that
 *    pattern is a streaming artifact, not intentional formatting.
 */
function normalizeStructure(text: string): string {
  return text
    // restore missing space after a period followed by a capital letter
    .replace(/([a-z0-9)])\.(?=[A-Z])/g, '$1. ')
    // if a numbered marker appears immediately after punctuation (colon/period), push it to a new line
    .replace(/(?<=[:.]\s?)(\d{1,2}[.)]\s*)/g, '\n$1')
    // if a numbered marker is directly appended to a word (e.g. "Fever2. Chills"), insert a newline
    .replace(/([a-zA-Z0-9])(\d{1,2}[.)]\s*)/g, '$1\n$2')
    // ensure a trailing 'Note', 'NOTE', or variants attached to the previous line
    // (e.g. "...children)Note:", "...children)NOTE -", "...children)Note —")
    // become their own paragraph by inserting a blank line before them.
    .replace(/([^\n\s])(?=\bNote\b\s*(?:[:\u2014\u2013-]|$))/gi, '$1\n\n')
    // collapse excessive blank lines
    .replace(/\n{3,}/g, '\n\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function renderBlock(block: string): string {
  if (!block) return '';

  const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const isBulletList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));
  const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l));

  if (isBulletList) {
    const items = lines.map((l) => `<li>${renderInline(l.replace(/^[-*]\s+/, ''))}</li>`).join('');
    return `<ul>${items}</ul>`;
  }

  if (isNumberedList) {
    const items = lines.map((l) => `<li>${renderInline(l.replace(/^\d+[.)]\s+/, ''))}</li>`).join('');
    return `<ol>${items}</ol>`;
  }

  if (/^#{1,4}\s+/.test(block)) {
    const level = block.match(/^#+/)?.[0].length ?? 3;
    const text = block.replace(/^#+\s+/, '');
    const tag = `h${Math.min(level + 2, 6)}`;
    return `<${tag}>${renderInline(text)}</${tag}>`;
  }

  // Mixed block: some lines are numbered-list items (recovered by
  // normalizeStructure), others are plain prose. Split into a leading
  // paragraph plus a trailing <ol>, so structure still renders even when
  // it isn't a "pure" list block.
  if (lines.length > 1 && lines.some((l) => /^\d+[.)]\s+/.test(l))) {
    const proseLines: string[] = [];
    const itemLines: string[] = [];
    let seenItem = false;

    for (const line of lines) {
      if (/^\d+[.)]\s+/.test(line)) {
        seenItem = true;
        itemLines.push(line);
      } else if (!seenItem) {
        proseLines.push(line);
      } else {
        // Continuation text that belongs to the previous numbered item.
        itemLines[itemLines.length - 1] += ` ${line}`;
      }
    }

    const proseHtml = proseLines.length ? `<p>${renderInline(proseLines.join(' '))}</p>` : '';
    const itemsHtml = itemLines.length
      ? `<ol>${itemLines.map((l) => `<li>${renderInline(l.replace(/^\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`
      : '';

    return proseHtml + itemsHtml;
  }

  return `<p>${renderInline(lines.join(' '))}</p>`;
}
