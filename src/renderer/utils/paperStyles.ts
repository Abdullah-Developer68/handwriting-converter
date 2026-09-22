import { HandwritingFont, PaperType, HandwritingSettings } from '../types';

export interface FontOption {
  id: HandwritingFont;
  name: string;
  category: 'Casual Print' | 'Neat Handwriting' | 'Cursive & Script' | 'Architect / Technical' | 'Chalk & Marker';
  preview: string;
}

export const HANDWRITING_FONTS: FontOption[] = [
  { id: 'Caveat', name: 'Caveat', category: 'Neat Handwriting', preview: 'The quick brown fox jumps over the lazy dog' },
  { id: 'Patrick Hand', name: 'Patrick Hand', category: 'Casual Print', preview: 'Clean and friendly student notebook handwriting' },
  { id: 'Shadows Into Light', name: 'Shadows Into Light', category: 'Neat Handwriting', preview: 'Graceful feminine rounded strokes' },
  { id: 'Indie Flower', name: 'Indie Flower', category: 'Casual Print', preview: 'Bubbly, relaxed, cheerful handwriting' },
  { id: 'Homemade Apple', name: 'Homemade Apple', category: 'Cursive & Script', preview: 'Classic flowing penmanship and cursive script' },
  { id: 'Architects Daughter', name: 'Architects Daughter', category: 'Architect / Technical', preview: 'Crisp drafting handwriting of an architect' },
  { id: 'Kalam', name: 'Kalam', category: 'Casual Print', preview: 'Expressive ballpoint pen lettering' },
  { id: 'Cedarville Cursive', name: 'Cedarville Cursive', category: 'Cursive & Script', preview: 'Fast, authentic cursive pen flow' },
  { id: 'Marck Script', name: 'Marck Script', category: 'Cursive & Script', preview: 'Elegant fountain pen signature style' },
  { id: 'Gloria Hallelujah', name: 'Gloria Hallelujah', category: 'Chalk & Marker', preview: 'Bold and lively blackboard chalk style' },
  { id: 'Reenie Beanie', name: 'Reenie Beanie', category: 'Casual Print', preview: 'Quick casual scribbler jotting notes' },
  { id: 'Nothing You Could Do', name: 'Nothing You Could Do', category: 'Casual Print', preview: 'Raw, authentic, energetic scribbles' },
  { id: 'Rock Salt', name: 'Rock Salt', category: 'Chalk & Marker', preview: 'Felt-tip marker and bold whiteboard writing' },
  { id: 'Just Another Hand', name: 'Just Another Hand', category: 'Casual Print', preview: 'Tall and narrow spontaneous handwriting' },
  { id: 'Nanum Pen Script', name: 'Nanum Pen Script', category: 'Casual Print', preview: 'Delicate fountain pen lettering' },
];

/**
 * Calibrated baseline offsets (in px) for each font
 * Ensures that lowercase letters rest cleanly 2-4px above the bottom ruled line
 */
export const FONT_BASELINE_OFFSETS: Record<HandwritingFont, number> = {
  'Caveat': 5,
  'Patrick Hand': 5,
  'Shadows Into Light': 4,
  'Indie Flower': 6,
  'Homemade Apple': 6,
  'Architects Daughter': 5,
  'Kalam': 4,
  'Gloria Hallelujah': 4,
  'Reenie Beanie': 5,
  'Nothing You Could Do': 5,
  'Marck Script': 4,
  'Rock Salt': 6,
  'Cedarville Cursive': 5,
  'Just Another Hand': 6,
  'Nanum Pen Script': 5,
};

/**
 * Computes the total vertical shift needed to position words on the line space
 * right above the bottom line for any font, font size, and line height.
 */
export function getComputedBaselineShift(
  font: HandwritingFont | string,
  fontSize: number,
  lineHeight: number,
  userOffset: number = 0
): number {
  const base = (FONT_BASELINE_OFFSETS as Record<string, number>)[font] ?? 5;
  // Account for font-size vs default 20px leading
  const sizeAdjustment = (20 - fontSize) * 0.35;
  // Account for line-height vs default 32px
  const lineAdjustment = (lineHeight - 32) * 0.45;
  return Math.round(base + sizeAdjustment + lineAdjustment + userOffset);
}

export interface PaperOption {
  id: PaperType;
  name: string;
  description: string;
  bgColor: string;
  lineDescription: string;
}

export const PAPER_TYPES: PaperOption[] = [
  { id: 'ruled', name: 'Classic Ruled', description: 'Standard blue lines with red left margin', bgColor: '#fdfbf7', lineDescription: '32px horizontal ruling' },
  { id: 'college', name: 'College Ruled', description: 'Tighter blue lines with red margin', bgColor: '#fafbfc', lineDescription: '26px narrow ruling' },
  { id: 'grid', name: 'Engineering Grid', description: 'Graph squared paper for math and drawings', bgColor: '#fcfcfb', lineDescription: 'Squared grid pattern' },
  { id: 'dots', name: 'Bullet Journal (Dots)', description: 'Subtle dot matrix for flexible notes', bgColor: '#fcfbf9', lineDescription: 'Dot grid matrix' },
  { id: 'legal', name: 'Yellow Legal Pad', description: 'Canary yellow paper with double red margin', bgColor: '#fef8d8', lineDescription: 'Classic attorney legal pad' },
  { id: 'parchment', name: 'Vintage Parchment', description: 'Warm sepia aged manuscript paper', bgColor: '#f5eedc', lineDescription: 'Antique warm lined texture' },
  { id: 'blank', name: 'Clean Blank Sheet', description: 'Minimalist white stationery without lines', bgColor: '#ffffff', lineDescription: 'Unruled paper' },
  { id: 'chalkboard', name: 'Slate Chalkboard', description: 'Dark slate background for chalk notes', bgColor: '#1e293b', lineDescription: 'Subtle chalk guide lines' },
];

export interface InkColorOption {
  name: string;
  hex: string;
  color: string;
}

export const INK_COLORS: InkColorOption[] = [
  { name: 'Royal Blue', hex: '#1e3a8a', color: '#1e3a8a' },
  { name: 'Classic Navy', hex: '#172554', color: '#172554' },
  { name: 'Gel Pen Black', hex: '#18181b', color: '#18181b' },
  { name: 'Graphite Pencil', hex: '#4b5563', color: '#4b5563' },
  { name: 'Teacher Red', hex: '#b91c1c', color: '#b91c1c' },
  { name: 'Forest Emerald', hex: '#065f46', color: '#065f46' },
  { name: 'Royal Purple', hex: '#6b21a8', color: '#6b21a8' },
  { name: 'Sepia Brown', hex: '#78350f', color: '#78350f' },
  { name: 'Chalk White', hex: '#f8fafc', color: '#f8fafc' },
];

export const DEFAULT_SETTINGS: HandwritingSettings = {
  font: 'Caveat',
  fontSize: 20,
  lineHeight: 32,
  letterSpacing: 0.5,
  wordSpacing: 1.5,
  inkColor: '#1e3a8a',
  paperType: 'ruled',
  paperColor: '#fdfbf7',
  pageSize: 'A4',
  orientation: 'portrait',
  penThickness: 'regular',
  jitter: 'subtle',
  slant: -0.5,
  baselineOffset: 0,
  showMarginLine: true,
  marginLineWidth: 70,
  showHoles: true,
  showHeader: false,
  headerDate: '',
  headerSubject: '',
  showPageNumbers: false,
  pageNumberStyle: 'x-of-y',
};

// Dimensions in pixels for standard screen rendering (exact 1:1.414 ratio for A4)
export const PAGE_DIMENSIONS = {
  A4: {
    portrait: { width: 794, height: 1123 }, // standard 96 DPI A4
    landscape: { width: 1123, height: 794 },
  },
  Letter: {
    portrait: { width: 816, height: 1056 }, // standard 96 DPI Letter
    landscape: { width: 1056, height: 816 },
  },
};

/**
 * Computes the page line capacity and characters per line based on paper settings.
 */
export function getPageCapacity(settings: HandwritingSettings): { maxLines: number; charsPerLine: number } {
  const pageSize = settings?.pageSize && PAGE_DIMENSIONS[settings.pageSize] ? settings.pageSize : 'A4';
  const orientation = settings?.orientation === 'landscape' ? 'landscape' : 'portrait';
  const pageDims = PAGE_DIMENSIONS[pageSize][orientation];

  const lineHeight = settings?.lineHeight || 32;
  const availHeight = pageDims.height - (settings?.showHeader ? 120 : 80);
  const maxLines = Math.max(16, Math.floor(availHeight / lineHeight));

  const marginLeft = settings?.showMarginLine ? (settings?.marginLineWidth || 70) + 16 : 48;
  const availWidth = pageDims.width - marginLeft - 48;
  const fontSize = settings?.fontSize || 20;
  const charWidth = Math.max(8, fontSize * 0.52);
  const charsPerLine = Math.max(40, Math.floor(availWidth / charWidth));

  return { maxLines, charsPerLine };
}

