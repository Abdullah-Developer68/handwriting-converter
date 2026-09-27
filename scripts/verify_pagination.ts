import fs from 'fs';
import { splitMarkdownIntoPages } from '../src/renderer/utils/markdownParser';
import { getPageCapacity, DEFAULT_SETTINGS, PAGE_DIMENSIONS } from '../src/renderer/utils/paperStyles';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`, details ? details : '');
    failed++;
  }
}

console.log('=== TEST SUITE: Paper Line Utilization & Auto-Pagination ===\n');

// 1. Clean empty state
const emptyPages = splitMarkdownIntoPages('');
assert(emptyPages.length === 1 && emptyPages[0] === '', 'Empty input returns exactly 1 blank page');

const whitespacePages = splitMarkdownIntoPages('   \n\n   ');
assert(whitespacePages.length === 1 && whitespacePages[0] === '', 'Whitespace-only returns exactly 1 blank page');

// 2. Exact Line Capacities for different paper types & orientations
const a4Portrait = getPageCapacity({ ...DEFAULT_SETTINGS, pageSize: 'A4', orientation: 'portrait', lineHeight: 32 });
assert(a4Portrait.maxLines === 34, `A4 Portrait 32px has 34 lines capacity (got ${a4Portrait.maxLines})`);
assert(a4Portrait.charsPerLine === 79, `A4 Portrait 32px has 79 chars/line (got ${a4Portrait.charsPerLine})`);

const letterPortrait = getPageCapacity({ ...DEFAULT_SETTINGS, pageSize: 'Letter', orientation: 'portrait', lineHeight: 32 });
assert(letterPortrait.maxLines === 32, `Letter Portrait 32px has 32 lines capacity (got ${letterPortrait.maxLines})`);

const a4Landscape = getPageCapacity({ ...DEFAULT_SETTINGS, pageSize: 'A4', orientation: 'landscape', lineHeight: 32 });
assert(a4Landscape.maxLines === 23, `A4 Landscape 32px has 23 lines capacity (got ${a4Landscape.maxLines})`);

const letterLandscape = getPageCapacity({ ...DEFAULT_SETTINGS, pageSize: 'Letter', orientation: 'landscape', lineHeight: 32 });
assert(letterLandscape.maxLines === 24, `Letter Landscape 32px has 24 lines capacity (got ${letterLandscape.maxLines})`);

const a4College = getPageCapacity({ ...DEFAULT_SETTINGS, pageSize: 'A4', orientation: 'portrait', lineHeight: 26 });
assert(a4College.maxLines === 42, `A4 College Ruled (26px) has 42 lines capacity (got ${a4College.maxLines})`);

const letterCollege = getPageCapacity({ ...DEFAULT_SETTINGS, pageSize: 'Letter', orientation: 'portrait', lineHeight: 26 });
assert(letterCollege.maxLines === 39, `Letter College Ruled (26px) has 39 lines capacity (got ${letterCollege.maxLines})`);

// 3. Sample Notes Verification
const mm = fs.readFileSync('sample-notes/meeting-minutes.md', 'utf-8');
const mmPages = splitMarkdownIntoPages(mm, a4Portrait.maxLines, a4Portrait.charsPerLine);
assert(mmPages.length === 1, `meeting-minutes.md fits completely on 1 page without spilling to page 2 (got ${mmPages.length})`);

const dj = fs.readFileSync('sample-notes/daily-journal.md', 'utf-8');
const djPages = splitMarkdownIntoPages(dj, a4Portrait.maxLines, a4Portrait.charsPerLine);
assert(djPages.length === 1, `daily-journal.md fits on 1 page (got ${djPages.length})`);

const pl = fs.readFileSync('sample-notes/physics-lecture.md', 'utf-8');
const plPages = splitMarkdownIntoPages(pl, a4Portrait.maxLines, a4Portrait.charsPerLine);
assert(plPages.length === 2, `physics-lecture.md respects manual pagebreak and splits into 2 pages (got ${plPages.length})`);

// 4. Exact Capacity Test: 34 lines on A4 Portrait
const exact34Lines = Array.from({ length: 34 }, (_, i) => `Short line ${i + 1}`).join('\n');
const exact34Pages = splitMarkdownIntoPages(exact34Lines, 34, 63);
assert(exact34Pages.length === 1, `Exact 34 single-line entries fit on exactly 1 page (got ${exact34Pages.length})`);

// 5. Overflow by 1 line: 35 lines on A4 Portrait
const lines35 = Array.from({ length: 35 }, (_, i) => `Short line ${i + 1}`).join('\n');
const pages35 = splitMarkdownIntoPages(lines35, 34, 63);
assert(pages35.length === 2, `35 lines split into 2 pages (got ${pages35.length})`);
assert(pages35[0].split('\n').length === 34, `Page 1 utilizes all 34 lines (got ${pages35[0].split('\n').length})`);
assert(pages35[1].split('\n').length === 1, `Page 2 receives the 35th line (got ${pages35[1].split('\n').length})`);

// 6. Long Single Paragraph (3000 chars)
const sentences = [
  'First sentence establishing the theoretical foundation of quantum entanglement in open thermodynamic systems.',
  'Second sentence observing non-local correlation across separated detector apparatuses under cryogenic vacuum.',
  'Third sentence documenting anomalous phase transitions consistent with spontaneous symmetry breaking.',
  'Fourth sentence verifying that decoherence timescales scale inversely with environmental temperature gradients.',
  'Fifth sentence analyzing statistical deviations from classical Bell inequalities exceeding five standard deviations.',
];
const longPara = sentences.join(' ').repeat(6); // ~3100 characters
const longParaPages = splitMarkdownIntoPages(longPara, 34, 63);
assert(longParaPages.length === 2, `Long paragraph splits across 2 pages (got ${longParaPages.length})`);
assert(longParaPages[0].length >= 1800, `Page 1 utilizes full capacity before breaking (chars: ${longParaPages[0].length})`);

// 7. Huge Continuous Text (10,000 chars)
const hugeText = 'The continuous exploration of natural phenomena requires rigorous mathematical modeling. '.repeat(110);
const hugePages = splitMarkdownIntoPages(hugeText, 34, 63);
assert(hugePages.length === 5, `Huge text splits across multiple pages (got ${hugePages.length})`);
for (let p = 0; p < hugePages.length - 1; p++) {
  assert(hugePages[p].length >= 1900, `Page ${p + 1} of huge document is fully packed (chars: ${hugePages[p].length})`);
}

// 8. Markdown Table separator does not count as a line
const tableDoc = [
  '# Data Table Test',
  '',
  '| Metric | Target | Actual | Delta |',
  '| :--- | :---: | :---: | :--- |',
  '| Latency | < 50ms | 38ms | -12ms |',
  '| Throughput | > 1000 | 1420 | +420 |',
  '| Error Rate | < 0.01% | 0.002% | -0.008% |',
].join('\n');
const tablePages = splitMarkdownIntoPages(tableDoc, 34, 63);
assert(tablePages.length === 1, `Table doc fits on 1 page (got ${tablePages.length})`);

// 9. Preserves list bullet when splitting a long list item
const longListItem = '- ' + 'A very long observation that describes complex laboratory findings in great detail. '.repeat(40);
const splitListPages = splitMarkdownIntoPages(longListItem, 34, 63);
assert(splitListPages.length >= 2, `Long list item splits into multiple pages (got ${splitListPages.length})`);
assert(splitListPages[1].startsWith('- '), `Continuation on page 2 preserves list bullet (starts with: "${splitListPages[1].slice(0, 10)}")`);

// 10. Manual pagebreak with long section auto-pagination
const mixedDoc = [
  '# First Part',
  '',
  'Short introductory text.',
  '',
  '<!-- pagebreak -->',
  '',
  '# Second Part (Very Long)',
  '',
  sentences.join(' ').repeat(8),
].join('\n');
const mixedPages = splitMarkdownIntoPages(mixedDoc, 34, a4Portrait.charsPerLine);
assert(mixedPages.length >= 3, `Manual pagebreak followed by long section paginates to 3+ pages (got ${mixedPages.length})`);

// 11. Multi-paragraph line utilization: fills page down to capacity without 8-line premature drop
const paras15 = Array.from({ length: 15 }, (_, i) => 
  `Paragraph ${i + 1}: This is a typical paragraph written by a student or professional taking handwritten notes. It contains several details and explains the concepts clearly.`
).join('\n\n');
const parasPages = splitMarkdownIntoPages(paras15, 34, a4Portrait.charsPerLine);
assert(parasPages.length === 2, `15 paragraphs split into 2 pages (got ${parasPages.length})`);
assert(parasPages[0].split('\n\n').length >= 11, `Page 1 packs at least 11 paragraphs utilizing all lines (got ${parasPages[0].split('\n\n').length})`);

// 12. Single-spaced entries utilize full 34 lines
const single34 = Array.from({ length: 34 }, (_, i) => `Single line entry #${i + 1}`).join('\n');
const singlePages = splitMarkdownIntoPages(single34, 34, a4Portrait.charsPerLine);
assert(singlePages.length === 1, `Exact 34 single-spaced entries fit on 1 page (got ${singlePages.length})`);
assert(singlePages[0].split('\n').length === 34, `Page 1 has all 34 single lines (got ${singlePages[0].split('\n').length})`);

console.log(`\n========================================`);
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
