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
/**
 * Strips inline markdown markup symbols to compute actual visible rendered text length
 */
function getRenderedTextLength(text: string): number {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/==pink:([^=]+)==/g, '$1')
    .replace(/==green:([^=]+)==/g, '$1')
    .replace(/==blue:([^=]+)==/g, '$1')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim().length;
}

/**
 * Checks if a line is a markdown table separator/alignment row, e.g. | :--- | :---: |
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes('|') && /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed);
}

/**
 * Estimates line weight in terms of discrete notebook line units
 */
function estimateLineWeight(line: string, prevLine: string, nextLine: string, charsPerLine: number): number {
  const trimmed = line.trim();
  if (!trimmed) {
    // Blank line after heading, at start of page, or duplicate blank line doesn't occupy extra lines
    if (!prevLine || prevLine.trim() === '' || prevLine.trim().startsWith('#')) {
      return 0;
    }
    // Blank line immediately before a heading: HTML headers already provide clear vertical rhythm without extra line height
    if (nextLine && nextLine.trim().startsWith('#')) {
      return 0;
    }
    // Blank line immediately before or after a horizontal rule
    if (/^[-*_]{3,}$/.test(prevLine.trim())) {
      return 0;
    }
    if (nextLine && /^[-*_]{3,}$/.test(nextLine.trim())) {
      return 0;
    }
    return 1;
  }

  // Table separator row doesn't render as a visible row in HTML
  if (isTableSeparator(trimmed)) {
    return 0;
  }

  if (trimmed.startsWith('# ')) {
    return 3; // H1: 2 line-heights + 1 line margin below
  }
  if (/^#{2,6}\s/.test(trimmed)) {
    return 2; // H2-H6: 1 line-height + 1 line margin below
  }
  if (/^[-*_]{3,}$/.test(trimmed)) {
    return 1; // Horizontal rule: 1 line
  }
  if (trimmed.startsWith('|')) {
    return 1; // Table row: 1 line
  }

  const renderedLen = getRenderedTextLength(line);
  // Opening line naturally holds ~15% more characters before first word wrap
  const firstLineBonus = Math.round(charsPerLine * 0.15);
  if (renderedLen <= charsPerLine + firstLineBonus) {
    return 1;
  }
  return Math.max(1, Math.ceil((renderedLen - firstLineBonus) / charsPerLine));
}

/**
 * Splits a paragraph cleanly at a sentence, clause, or word boundary to fill all remaining lines on a page.
 * To ensure the bottom section of the page is NOT left empty, the split MUST target the final available line.
 */
function splitParagraphAtCapacity(text: string, targetChars: number, charsPerLine: number): [string, string] {
  if (!text || targetChars <= 0) return ['', text];
  if (text.length <= targetChars) return [text, ''];

  // The final line on the page spans [targetChars - charsPerLine, targetChars]
  // We prefer boundaries that fall on this final line to maximize utilization without overflowing.
  const finalLineStart = Math.max(0, targetChars - charsPerLine);

  // 1. Try sentence boundary (. ! ?) on the final line
  const sentenceMatches = [...text.slice(0, targetChars).matchAll(/[.!?]\s+/g)];
  for (let s = sentenceMatches.length - 1; s >= 0; s--) {
    const end = (sentenceMatches[s].index ?? 0) + sentenceMatches[s][0].length;
    if (end >= finalLineStart) {
      return [text.slice(0, end).trimEnd(), text.slice(end).trimStart()];
    }
  }

  // 2. Try punctuation / clause boundary (, ; : —) on the final line
  const punctMatches = [...text.slice(0, targetChars).matchAll(/[,;:\u2014]\s+/g)];
  for (let p = punctMatches.length - 1; p >= 0; p--) {
    const end = (punctMatches[p].index ?? 0) + punctMatches[p][0].length;
    if (end >= finalLineStart) {
      return [text.slice(0, end).trimEnd(), text.slice(end).trimStart()];
    }
  }

  // 3. Try word boundary on the final line (closest to targetChars without exceeding)
  const lastSpace = text.slice(0, targetChars).lastIndexOf(' ');
  if (lastSpace >= finalLineStart) {
    return [text.slice(0, lastSpace).trimEnd(), text.slice(lastSpace + 1).trimStart()];
  }

  // 4. Fallback: split at any space before targetChars
  if (lastSpace > 0) {
    return [text.slice(0, lastSpace).trimEnd(), text.slice(lastSpace + 1).trimStart()];
  }

  // 5. Hard split at targetChars if no spaces exist (e.g. unbroken string)
  return [text.slice(0, targetChars).trimEnd(), text.slice(targetChars).trimStart()];
}

/**
 * Split markdown text into discrete pages
 * 1. Checks for explicit page break markers (<!-- pagebreak -->, ===page===, etc.)
 * 2. Automatically paginates content so all lines on the paper are utilized without wasting space.
 */
export function splitMarkdownIntoPages(
  markdown: string, 
  maxLinesPerPage: number = 34,
  charsPerLine: number = 63
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
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const prevLine = currentPageLines.length > 0 ? currentPageLines[currentPageLines.length - 1] : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      const weight = estimateLineWeight(line, prevLine, nextLine, charsPerLine);

      // Line fits completely on current page
      if (currentWeight + weight <= maxLinesPerPage) {
        // Avoid starting a page with an empty line
        if (currentPageLines.length === 0 && !line.trim()) {
          i++;
          continue;
        }
        currentPageLines.push(line);
        currentWeight += weight;
        i++;
        continue;
      }

      // Line exceeds current page capacity
      const remaining = maxLinesPerPage - currentWeight;
      const tr = line.trim();
      const isHeading = tr.startsWith('#');
      const isTable = tr.startsWith('|');
      const isHr = /^[-*_]{3,}$/.test(tr);

      // Can we split this line to fill all remaining lines on this page?
      if (!isHeading && !isTable && !isHr && remaining >= 1) {
        const targetChars = remaining * charsPerLine;
        const [part1, part2] = splitParagraphAtCapacity(line, targetChars, charsPerLine);

        if (part1 && part2 && part1.length > 0 && part2.length > 0) {
          currentPageLines.push(part1);
          finalPages.push(currentPageLines.join('\n').trim());
          currentPageLines = [];
          currentWeight = 0;

          // Preserve markdown formatting prefix if applicable (e.g. list, blockquote)
          let prefix = '';
          if (/^[-*]\s+/.test(line)) prefix = '- ';
          else if (/^\d+\.\s+/.test(line)) prefix = '1. ';
          else if (/^>\s+/.test(line)) prefix = '> ';

          lines[i] = (prefix && !part2.startsWith(prefix) ? prefix : '') + part2;
          // Do NOT increment i: re-evaluate part2 on the new page!
          continue;
        } else if (part1 && (!part2 || part2.length === 0)) {
          currentPageLines.push(part1);
          currentWeight += estimateLineWeight(part1, prevLine, nextLine, charsPerLine);
          i++;
          continue;
        }
      }

      // If cannot split or no remaining space, finalize current page
      if (currentPageLines.length > 0) {
        while (currentPageLines.length > 0 && !currentPageLines[currentPageLines.length - 1].trim()) {
          currentPageLines.pop();
        }
        if (currentPageLines.length > 0) {
          finalPages.push(currentPageLines.join('\n').trim());
        }
        currentPageLines = [];
        currentWeight = 0;
        // Do not increment i: line moves to next page
      } else {
        // Single atomic element (e.g. huge table or long heading) at top of page
        currentPageLines.push(line);
        finalPages.push(currentPageLines.join('\n').trim());
        currentPageLines = [];
        currentWeight = 0;
        i++;
      }
    }

    if (currentPageLines.length > 0) {
      while (currentPageLines.length > 0 && !currentPageLines[currentPageLines.length - 1].trim()) {
        currentPageLines.pop();
      }
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
  const parsed = marked.parse(preprocessed, { async: false, breaks: true, gfm: true });
  const rawHtml = typeof parsed === 'string' ? parsed : '';

  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['mark'],
    ADD_ATTR: ['class', 'target'],
  });
}

