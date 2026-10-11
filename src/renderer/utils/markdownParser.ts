import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import DOMPurify from 'dompurify';
import { PAGEBREAK_REGEX } from '../types';

// Register KaTeX extension with marked
marked.use(
  markedKatex({
    throwOnError: false,
    strict: false,
    nonStandard: true,
  })
);

/**
 * Custom renderer extensions for marked to support handwriting-specific styles and math
 */
export function preprocessMarkdown(markdown: string): string {
  let processed = markdown;

  // Obsidian image embed syntax: ![[image.webp]] or ![[image.png|alt text]]
  processed = processed.replace(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_match, src, alt) => {
    const altText = alt ? alt.trim() : src.trim();
    return `![${altText}](${src.trim()})`;
  });

  // Normalize LaTeX math expressions:
  // 1. Convert markdown-corrupted subscript asterisks like \text{RTT}*{\text{local}} -> \text{RTT}_{\text{local}}
  // 2. Normalize en-dashes / em-dashes inside math to standard hyphens
  // 3. Ensure unescaped % inside math is escaped to prevent LaTeX comment truncation
  processed = processed.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g, (math) => {
    return math
      .replace(/([a-zA-Z0-9_'\\]+)\*(\{)/g, '$1_$2')
      .replace(/([}])\*(\{)/g, '$1_$2')
      .replace(/[–—]/g, '-')
      .replace(/(?<!\\)%/g, '\\%');
  });

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
 * Strips inline markdown markup symbols and math markup to compute actual visible rendered text length
 */
function getRenderedTextLength(text: string): number {
  return text
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\math\w+\{([^}]+)\}/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
    .replace(/\\[a-zA-Z]+/g, ' ')
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
    if (!prevLine || prevLine.trim() === '' || prevLine.trim().startsWith('#')) {
      return 0;
    }
    if (nextLine && nextLine.trim().startsWith('#')) {
      return 0;
    }
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
  if (trimmed.startsWith('$$')) {
    // Display math formula: 2 lines for fractions, 1 line otherwise
    return trimmed.includes('\\frac') ? 2 : 1;
  }
  if (trimmed.startsWith('|')) {
    return 1; // Table row: 1 line
  }

  const renderedLen = getRenderedTextLength(line);
  const firstLineBonus = Math.round(charsPerLine * 0.15);
  if (renderedLen <= charsPerLine + firstLineBonus) {
    return 1;
  }
  return Math.max(1, Math.ceil((renderedLen - firstLineBonus) / charsPerLine));
}

/**
 * Checks if an index in a string is inside an unclosed inline math ($...$) delimiter
 */
function isInsideMath(text: string, index: number): boolean {
  let inMath = false;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '$' && (i === 0 || text[i - 1] !== '\\')) {
      inMath = !inMath;
    }
  }
  return inMath;
}

/**
 * Splits a paragraph cleanly at a sentence, clause, or word boundary to fill all remaining lines on a page.
 * Avoids splitting inside inline math expressions ($...$) to maintain valid formula formatting.
 */
function splitParagraphAtCapacity(text: string, targetChars: number, charsPerLine: number): [string, string] {
  if (!text || targetChars <= 0) return ['', text];
  if (text.length <= targetChars) return [text, ''];

  const finalLineStart = Math.max(0, targetChars - charsPerLine);

  // 1. Try sentence boundary (. ! ?) on the final line, outside math
  const sentenceMatches = [...text.slice(0, targetChars).matchAll(/[.!?]\s+/g)];
  for (let s = sentenceMatches.length - 1; s >= 0; s--) {
    const end = (sentenceMatches[s].index ?? 0) + sentenceMatches[s][0].length;
    if (end >= finalLineStart && !isInsideMath(text, end)) {
      return [text.slice(0, end).trimEnd(), text.slice(end).trimStart()];
    }
  }

  // 2. Try punctuation / clause boundary (, ; : —) on the final line, outside math
  const punctMatches = [...text.slice(0, targetChars).matchAll(/[,;:\u2014]\s+/g)];
  for (let p = punctMatches.length - 1; p >= 0; p--) {
    const end = (punctMatches[p].index ?? 0) + punctMatches[p][0].length;
    if (end >= finalLineStart && !isInsideMath(text, end)) {
      return [text.slice(0, end).trimEnd(), text.slice(end).trimStart()];
    }
  }

  // 3. Try word boundary on the final line outside math
  const candidateSlice = text.slice(0, targetChars);
  let spaceIndex = candidateSlice.lastIndexOf(' ');
  while (spaceIndex >= finalLineStart) {
    if (!isInsideMath(text, spaceIndex)) {
      return [text.slice(0, spaceIndex).trimEnd(), text.slice(spaceIndex + 1).trimStart()];
    }
    spaceIndex = candidateSlice.lastIndexOf(' ', spaceIndex - 1);
  }

  // 4. Fallback: split at any space before targetChars outside math
  spaceIndex = candidateSlice.lastIndexOf(' ');
  while (spaceIndex > 0) {
    if (!isInsideMath(text, spaceIndex)) {
      return [text.slice(0, spaceIndex).trimEnd(), text.slice(spaceIndex + 1).trimStart()];
    }
    spaceIndex = candidateSlice.lastIndexOf(' ', spaceIndex - 1);
  }

  // 5. Hard split if no suitable space exists
  return [text.slice(0, targetChars).trimEnd(), text.slice(targetChars).trimStart()];
}

/**
 * Split markdown text into discrete pages
 * 1. Checks for explicit page break markers (<!-- pagebreak -->, ===page===, etc.)
 * 2. Automatically paginates content so all lines on the paper are utilized without wasting space.
 * 3. Handles table splitting across pages by repeating the table header/separator rows on continuation pages.
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

      // Table handling: detect markdown table start (header + separator row)
      if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headerLine = line;
        const separatorLine = lines[i + 1];
        let j = i + 2;
        const dataRows: string[] = [];
        while (j < lines.length && lines[j].trim().startsWith('|')) {
          dataRows.push(lines[j]);
          j++;
        }

        const remaining = maxLinesPerPage - currentWeight;
        // If fewer than 3 lines remain on current page, defer table to next page so header is never orphaned
        if (remaining < 3 && currentPageLines.length > 0) {
          while (currentPageLines.length > 0 && !currentPageLines[currentPageLines.length - 1].trim()) {
            currentPageLines.pop();
          }
          if (currentPageLines.length > 0) {
            finalPages.push(currentPageLines.join('\n').trim());
          }
          currentPageLines = [];
          currentWeight = 0;
        }

        // Fit as many rows as possible on the current page
        let rowIndex = 0;
        let rowsForThisPage: string[] = [];
        let tableWeightForThisPage = 2; // header + separator allowance

        while (rowIndex < dataRows.length) {
          const rowWeight = estimateLineWeight(dataRows[rowIndex], '', '', charsPerLine);
          if (currentWeight + tableWeightForThisPage + rowWeight <= maxLinesPerPage) {
            rowsForThisPage.push(dataRows[rowIndex]);
            tableWeightForThisPage += rowWeight;
            rowIndex++;
          } else {
            break;
          }
        }

        if (rowsForThisPage.length > 0) {
          currentPageLines.push(headerLine, separatorLine, ...rowsForThisPage);
          currentWeight += tableWeightForThisPage;
        }

        // If data rows remain, paginate them across continuation pages with repeated header
        if (rowIndex < dataRows.length) {
          if (currentPageLines.length > 0) {
            finalPages.push(currentPageLines.join('\n').trim());
          }
          currentPageLines = [];
          currentWeight = 0;

          while (rowIndex < dataRows.length) {
            rowsForThisPage = [];
            tableWeightForThisPage = 2; // repeated header + separator
            while (rowIndex < dataRows.length) {
              const rowWeight = estimateLineWeight(dataRows[rowIndex], '', '', charsPerLine);
              if (tableWeightForThisPage + rowWeight <= maxLinesPerPage) {
                rowsForThisPage.push(dataRows[rowIndex]);
                tableWeightForThisPage += rowWeight;
                rowIndex++;
              } else {
                if (rowsForThisPage.length === 0) {
                  rowsForThisPage.push(dataRows[rowIndex]);
                  tableWeightForThisPage += rowWeight;
                  rowIndex++;
                }
                break;
              }
            }

            currentPageLines.push(headerLine, separatorLine, ...rowsForThisPage);
            currentWeight = tableWeightForThisPage;

            if (rowIndex < dataRows.length) {
              finalPages.push(currentPageLines.join('\n').trim());
              currentPageLines = [];
              currentWeight = 0;
            }
          }
        }

        i = j;
        continue;
      }

      const prevLine = currentPageLines.length > 0 ? currentPageLines[currentPageLines.length - 1] : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      const weight = estimateLineWeight(line, prevLine, nextLine, charsPerLine);

      // Line fits completely on current page
      if (currentWeight + weight <= maxLinesPerPage) {
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
      const isDisplayMath = tr.startsWith('$$');

      // Can we split this line to fill all remaining lines on this page?
      if (!isHeading && !isTable && !isHr && !isDisplayMath && remaining >= 1) {
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
        // Single atomic element at top of page
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
 * Parses markdown to HTML string with custom styling hooks, KaTeX math typesetting, and XSS sanitization
 */
export function parseMarkdownToHtml(markdownText: string): string {
  const preprocessed = preprocessMarkdown(markdownText);
  const parsed = marked.parse(preprocessed, { async: false, breaks: true, gfm: true });
  const rawHtml = typeof parsed === 'string' ? parsed : '';

  const sanitizeFn = typeof DOMPurify?.sanitize === "function" 
    ? DOMPurify.sanitize 
    : typeof window !== "undefined" && typeof DOMPurify === "function"
      ? (DOMPurify as any)(window).sanitize
      : (html: string) => html;

  return sanitizeFn(rawHtml, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    ADD_TAGS: ['mark'],
    ADD_ATTR: ['class', 'target', 'style', 'align', 'aria-hidden'],
    ALLOW_DATA_ATTR: true,
  });
}
