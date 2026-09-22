import { marked } from 'marked';

// Configure marked with GFM and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Pre-process markdown text before feeding to marked
 * - Support ==highlight== syntax
 * - Support custom page breaks <!-- pagebreak --> or [pagebreak] or ===page===
 * - Support interactive task lists [ ] and [x]
 */
export function preprocessMarkdown(rawMarkdown: string): string {
  let processed = rawMarkdown;

  // Convert ==highlighted text== to <mark class="highlight-yellow">text</mark>
  processed = processed.replace(/==([^=\n]+)==/g, '<mark class="highlight-yellow">$1</mark>');

  // Convert ==pink:text== to <mark class="highlight-pink">text</mark>
  processed = processed.replace(/==pink:([^=\n]+)==/g, '<mark class="highlight-pink">$1</mark>');

  // Convert ==green:text== to <mark class="highlight-green">text</mark>
  processed = processed.replace(/==green:([^=\n]+)==/g, '<mark class="highlight-green">$1</mark>');

  // Enhance task list items: - [ ] Task and - [x] Done
  processed = processed.replace(/^-\s*\[ \]\s*(.*)$/gm, '<li class="task-list-item"><span class="handwritten-checkbox"></span>$1</li>');
  processed = processed.replace(/^-\s*\[x\]\s*(.*)$/gim, '<li class="task-list-item"><span class="handwritten-checkbox checked"></span>$1</li>');

  return processed;
}

/**
 * Split markdown text into discrete pages
 * 1. Checks for explicit page break markers:
 *    - <!-- pagebreak -->
 *    - [pagebreak]
 *    - ===page===
 *    - \pagebreak
 * 2. If no explicit breaks exist, checks content length and divides cleanly by major sections/headers if content is very long, or returns single page.
 */
export function splitMarkdownIntoPages(markdown: string): string[] {
  // Page break regex
  const explicitBreakRegex = /(?:<!--\s*pagebreak\s*-->|\[pagebreak\]|===page===|\\pagebreak)/gi;

  if (explicitBreakRegex.test(markdown)) {
    const pages = markdown.split(explicitBreakRegex).map((p) => p.trim());
    return pages.filter((p) => p.length > 0);
  }

  // If no explicit breaks, check if content is exceptionally long (e.g. > 2500 chars or 40 lines)
  // and offer clean splitting on top-level headers (# or ##)
  const lines = markdown.split('\n');
  if (lines.length > 42) {
    const pages: string[] = [];
    let currentPageLines: string[] = [];
    let currentLineCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = /^#{1,2}\s/.test(line);

      // If page is getting tall (approx 35 lines) and we hit a major header, start a new page
      if (currentLineCount >= 34 && isHeader) {
        pages.push(currentPageLines.join('\n'));
        currentPageLines = [line];
        currentLineCount = 1;
      } else {
        currentPageLines.push(line);
        currentLineCount++;
      }
    }

    if (currentPageLines.length > 0) {
      pages.push(currentPageLines.join('\n'));
    }

    return pages;
  }

  return [markdown];
}

/**
 * Parses markdown to HTML string with custom styling hooks
 */
export function parseMarkdownToHtml(markdownText: string): string {
  const preprocessed = preprocessMarkdown(markdownText);
  const parsed = marked.parse(preprocessed);
  return typeof parsed === 'string' ? parsed : '';
}
