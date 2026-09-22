import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { PAGEBREAK_REGEX } from '../types';

/**
 * Custom renderer extensions for marked to support handwriting-specific styles
 */
export function preprocessMarkdown(markdown: string): string {
  let processed = markdown;

  // Highlight syntax: ==yellow text== -> <mark class="highlight-yellow">text</mark>
  processed = processed.replace(/==([^=\n]+)==/g, '<mark class="highlight-yellow">$1</mark>');

  // Color highlight syntax: ==pink:text==, ==green:text==, ==blue:text==
  processed = processed.replace(/==pink:([^=\n]+)==/g, '<mark class="highlight-pink">$1</mark>');
  processed = processed.replace(/==green:([^=\n]+)==/g, '<mark class="highlight-green">$1</mark>');
  processed = processed.replace(/==blue:([^=\n]+)==/g, '<mark class="highlight-blue">$1</mark>');

  // Enhance task list items: - [ ] Task and - [x] Done
  processed = processed.replace(/^-\s*\[ \]\s*(.*)$/gm, '<li class="task-list-item"><span class="handwritten-checkbox"></span>$1</li>');
  processed = processed.replace(/^-\s*\[x\]\s*(.*)$/gim, '<li class="task-list-item"><span class="handwritten-checkbox checked"></span>$1</li>');

  return processed;
}

/**
 * Strips inline markdown markup symbols to compute actual visible rendered text length
 */
function getRenderedTextLength(text: string): number {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim().length;
}

/**
 * Estimates line weight in terms of notebook line units
 */
function estimateLineWeight(line: string, prevLine: string, charsPerLine: number): number {
  const trimmed = line.trim();
  if (!trimmed) {
    // Blank line after heading or at the start of a page doesn't occupy extra lines
    if (!prevLine || prevLine.trim().startsWith('#')) {
      return 0;
    }
    return 0.8;
  }

  if (trimmed.startsWith('# ')) {
    return 2.5; // H1
  }
  if (trimmed.startsWith('## ')) {
    return 2.0; // H2
  }
  if (trimmed.startsWith('### ')) {
    return 1.5; // H3
  }
  if (/^[-*_]{3,}$/.test(trimmed)) {
    return 1.5; // horizontal rule
  }
  if (trimmed.startsWith('|')) {
    return 1.2; // table row
  }

  const renderedLen = getRenderedTextLength(line);
  return Math.max(1.0, Math.ceil(renderedLen / charsPerLine));
}

/**
 * Splits a paragraph cleanly at a sentence or clause boundary to fill all remaining lines on a page
 */
function splitParagraphAtCapacity(text: string, targetChars: number): [string, string] {
  const minSplit = Math.floor(targetChars * 0.55);

  // Try sentence boundary (. ! ?)
  const sentenceMatches = [...text.slice(0, targetChars).matchAll(/[.!?]\s+/g)];
  if (sentenceMatches.length > 0) {
    const last = sentenceMatches[sentenceMatches.length - 1];
    const end = (last.index ?? 0) + last[0].length;
    if (end >= minSplit) {
      return [text.slice(0, end).trimEnd(), text.slice(end).trimStart()];
    }
  }

  // Try punctuation boundary (, ; :)
  const punctMatches = [...text.slice(0, targetChars).matchAll(/[,;:]\s+/g)];
  if (punctMatches.length > 0) {
    const last = punctMatches[punctMatches.length - 1];
    const end = (last.index ?? 0) + last[0].length;
    if (end >= minSplit) {
      return [text.slice(0, end).trimEnd(), text.slice(end).trimStart()];
    }
  }

  // Try word boundary
  const lastSpace = text.slice(0, targetChars).lastIndexOf(' ');
  if (lastSpace >= minSplit) {
    return [text.slice(0, lastSpace).trimEnd(), text.slice(lastSpace + 1).trimStart()];
  }

  // Fallback to closest word boundary forward
  const nextSpace = text.indexOf(' ', targetChars);
  if (nextSpace !== -1 && nextSpace < targetChars + 35) {
    return [text.slice(0, nextSpace).trimEnd(), text.slice(nextSpace + 1).trimStart()];
  }

  return [text, ''];
}

/**
 * Split markdown text into discrete pages
 * 1. Checks for explicit page break markers (<!-- pagebreak -->, ===page===, etc.)
 * 2. Automatically paginates content so all lines on the paper are utilized without wasting space.
 */
export function splitMarkdownIntoPages(
  markdown: string, 
  maxLinesPerPage: number = 32,
  charsPerLine: number = 82
): string[] {
  if (!markdown || !markdown.trim()) {
    return [''];
  }

  const rawSections = markdown.split(PAGEBREAK_REGEX);
  const finalPages: string[] = [];

  for (const section of rawSections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    // Preserve inserted full visual PDF pages
    if (trimmedSection.includes('visual-page-embed')) {
      finalPages.push(trimmedSection);
      continue;
    }

    const lines = trimmedSection.split('\n');
    let currentPageLines: string[] = [];
    let currentWeight = 0;
    let prevLine = '';
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const weight = estimateLineWeight(line, prevLine, charsPerLine);

      // Line fits on the current page
      if (currentWeight + weight <= maxLinesPerPage) {
        currentPageLines.push(line);
        currentWeight += weight;
        prevLine = line;
        i++;
        continue;
      }

      // Line exceeds current page capacity
      const remaining = maxLinesPerPage - currentWeight;
      const tr = line.trim();
      const isHeading = tr.startsWith('#');
      const isTable = tr.startsWith('|');
      const renderedLen = getRenderedTextLength(line);

      // If page still has lines available, split the text to utilize the remaining lines
      if (!isHeading && !isTable && remaining >= 1.0 && renderedLen > charsPerLine * 1.2) {
        const targetChars = Math.floor(remaining * charsPerLine);
        const [part1, part2] = splitParagraphAtCapacity(line, targetChars);

        if (part1 && part2 && part1.length > 0 && part2.length > 0) {
          currentPageLines.push(part1);
          finalPages.push(currentPageLines.join('\n').trim());
          currentPageLines = [part2];
          currentWeight = estimateLineWeight(part2, '', charsPerLine);
          prevLine = part2;
          i++;
          continue;
        }
      }

      // Finalize current page and start a fresh page
      if (currentPageLines.length > 0) {
        finalPages.push(currentPageLines.join('\n').trim());
        currentPageLines = [];
        currentWeight = 0;
        prevLine = '';
      } else {
        currentPageLines.push(line);
        finalPages.push(currentPageLines.join('\n').trim());
        currentPageLines = [];
        currentWeight = 0;
        prevLine = '';
        i++;
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
 * Parses markdown to HTML string with custom styling hooks and XSS sanitization
 */
export function parseMarkdownToHtml(markdownText: string): string {
  const preprocessed = preprocessMarkdown(markdownText);
  const parsed = marked.parse(preprocessed, { async: false });
  const rawHtml = typeof parsed === 'string' ? parsed : '';

  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['mark'],
    ADD_ATTR: ['class', 'target'],
  });
}

