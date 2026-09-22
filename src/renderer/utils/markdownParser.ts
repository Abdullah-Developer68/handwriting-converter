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
 * Splits a long text paragraph into sentence or word chunks that fit within maxLines
 */
function splitLongParagraph(paragraph: string, maxLines: number, charsPerLine: number = 65): string[] {
  const estimatedLines = Math.max(1, Math.ceil(paragraph.length / charsPerLine));
  if (estimatedLines <= maxLines) {
    return [paragraph];
  }

  // Split by sentences first
  const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [paragraph];
  const chunks: string[] = [];
  let currentChunk = '';
  let currentChunkLines = 0;

  for (const sentence of sentences) {
    const sentenceLines = Math.max(1, Math.ceil(sentence.length / charsPerLine));
    if (currentChunk && currentChunkLines + sentenceLines > maxLines) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentChunkLines = sentenceLines;
    } else {
      currentChunk += sentence;
      currentChunkLines += sentenceLines;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Split markdown text into discrete pages
 * 1. Checks for explicit page break markers:
 *    - <!-- pagebreak -->
 *    - [pagebreak]
 *    - ===page===
 *    - \pagebreak
 *    - ---page---
 * 2. If content exceeds single-sheet capacity (maxLinesPerPage), automatically
 *    paginates into multiple sheets cleanly on paragraph and header boundaries.
 */
export function splitMarkdownIntoPages(markdown: string, maxLinesPerPage: number = 26): string[] {
  if (!markdown || !markdown.trim()) {
    return [''];
  }

  // Explicit page break regex
  const explicitBreakRegex = /(?:<!--\s*pagebreak\s*-->|\[pagebreak\]|===page===|\\pagebreak|---page---)/gi;

  const rawSections = markdown.split(explicitBreakRegex);
  const finalPages: string[] = [];

  for (const section of rawSections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    // Break section into individual lines to estimate rendered visual height
    const lines = trimmedSection.split('\n');
    let currentPageLines: string[] = [];
    let currentWeight = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Estimate visual lines occupied on the ruled notebook page
      let lineWeight = 1;
      if (trimmed === '') {
        lineWeight = 1; // paragraph spacing
      } else if (/^#\s/.test(trimmed)) {
        lineWeight = 3; // H1 takes 2 line-heights + margin
      } else if (/^#{2,3}\s/.test(trimmed)) {
        lineWeight = 2; // H2/H3 takes 1 line-height + margin
      } else if (/^[-*_]{3,}$/.test(trimmed)) {
        lineWeight = 2; // horizontal rule
      } else if (/^\|/.test(trimmed)) {
        lineWeight = 1.2; // table row
      } else {
        // Standard text line wraps approx every 65 characters in handwriting font on A4/Letter
        lineWeight = Math.max(1, Math.ceil(line.length / 65));
      }

      // Check if adding this line would exceed the sheet limit
      if (currentPageLines.length > 0 && currentWeight + lineWeight > maxLinesPerPage) {
        finalPages.push(currentPageLines.join('\n').trim());
        currentPageLines = [line];
        currentWeight = lineWeight;
      } else if (lineWeight > maxLinesPerPage) {
        // A single paragraph or line exceeds the full page capacity
        if (currentPageLines.length > 0) {
          finalPages.push(currentPageLines.join('\n').trim());
          currentPageLines = [];
          currentWeight = 0;
        }
        const paragraphChunks = splitLongParagraph(line, maxLinesPerPage);
        for (let c = 0; c < paragraphChunks.length - 1; c++) {
          finalPages.push(paragraphChunks[c]);
        }
        currentPageLines = [paragraphChunks[paragraphChunks.length - 1]];
        currentWeight = Math.max(1, Math.ceil(paragraphChunks[paragraphChunks.length - 1].length / 65));
      } else {
        currentPageLines.push(line);
        currentWeight += lineWeight;
      }
    }

    if (currentPageLines.length > 0) {
      const pageText = currentPageLines.join('\n').trim();
      if (pageText) {
        finalPages.push(pageText);
      }
    }
  }

  return finalPages.length > 0 ? finalPages : [''];
}

/**
 * Parses markdown to HTML string with custom styling hooks
 */
export function parseMarkdownToHtml(markdownText: string): string {
  const preprocessed = preprocessMarkdown(markdownText);
  const parsed = marked.parse(preprocessed);
  return typeof parsed === 'string' ? parsed : '';
}
