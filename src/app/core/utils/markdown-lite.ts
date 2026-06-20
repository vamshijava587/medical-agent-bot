/**
 * Minimal markdown-to-HTML renderer for assistant responses.
 * Deliberately small: handles the subset Spring AI / LLM responses
 * typically produce (paragraphs, bold, italics, inline code, bullet
 * and numbered lists) without pulling in a full markdown library.
 */
export function renderLiteMarkdown(raw: string): string {
  const escaped = escapeHtml(raw);
  const blocks = escaped.split(/\n{2,}/);

  const html = blocks
    .map((block) => renderBlock(block.trim()))
    .filter((b) => b.length > 0)
    .join('');

  return html;
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

  const lines = block.split('\n').map((l) => l.trim());
  const isBulletList = lines.every((l) => /^[-*]\s+/.test(l));
  const isNumberedList = lines.every((l) => /^\d+[.)]\s+/.test(l));

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

  return `<p>${renderInline(block)}</p>`;
}
