export interface PaperDimensions {
  width: number;
  height: number;
}

export type PageSize = 'A4' | 'Letter';
export type PageOrientation = 'portrait' | 'landscape';
export type PenThickness = 'fine' | 'regular' | 'medium' | 'bold';
export type JitterIntensity = 'none' | 'subtle' | 'medium' | 'strong';
export type PageNumberStyle = 'x-of-y' | 'number-only' | 'page-x';

export type HandwritingFont =
  | 'Caveat'
  | 'Patrick Hand'
  | 'Shadows Into Light'
  | 'Indie Flower'
  | 'Homemade Apple'
  | 'Architects Daughter'
  | 'Kalam'
  | 'Cedarville Cursive'
  | 'Marck Script'
  | 'Gloria Hallelujah'
  | 'Reenie Beanie'
  | 'Nothing You Could Do'
  | 'Rock Salt'
  | 'Just Another Hand'
  | 'Nanum Pen Script';

export type PaperType =
  | 'ruled'
  | 'college'
  | 'grid'
  | 'dots'
  | 'legal'
  | 'parchment'
  | 'blank'
  | 'chalkboard';

export const PAGEBREAK_REGEX = /(?:<!--\s*pagebreak\s*-->|\[pagebreak\]|===page===|\\pagebreak|---page---)/i;

export interface HandwritingSettings {
  font: HandwritingFont | string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  inkColor: string;
  penThickness: PenThickness;
  jitter: JitterIntensity;
  slant: number;
  baselineOffset: number;
  paperType: PaperType | string;
  paperColor?: string;
  showMarginLine: boolean;
  marginLineWidth: number;
  showHoles: boolean;
  showHeader: boolean;
  headerDate?: string;
  headerSubject?: string;
  showPageNumbers: boolean;
  pageNumberStyle: PageNumberStyle;
  pageSize: PageSize;
  orientation: PageOrientation;
}

export type TemplateCategory =
  | 'academic'
  | 'creative'
  | 'technical'
  | 'meeting'
  | 'letter'
  | 'Education'
  | 'Business'
  | 'Personal'
  | 'Culinary'
  | 'Engineering';

export interface SampleTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  markdown: string;
  recommendedSettings: Partial<HandwritingSettings>;
}

export interface PdfExportOptions {
  pageSize: PageSize;
  landscape: boolean;
  printBackground: boolean;
}

export interface ParsedPage {
  pageNumber: number;
  text: string;
  preview: string;
  imageUrl?: string;
}

export interface ParsedDocument {
  type: 'pdf' | 'docx' | 'markdown' | 'text';
  filename: string;
  path?: string;
  totalPages: number;
  pages: ParsedPage[];
  fullContent: string;
  error?: string;
}

export type InsertionTarget = 'start' | 'end' | 'specific-page' | 'cursor' | 'replace' | 'new-page' | 'prepend' | 'append';

export interface InsertionConfig {
  target: InsertionTarget;
  pageNumber?: number;
  position?: 'before' | 'after';
  importFormat?: 'handwritten' | 'visual';
}

export interface ElectronAPI {
  openFile: () => Promise<{ content: string; filename: string; path: string } | null>;
  saveFile: (content: string, defaultPath?: string) => Promise<{ success: boolean; path?: string }>;
  exportPdf: (options: PdfExportOptions) => Promise<{ success: boolean; path?: string; error?: string }>;
  importDocument: () => Promise<ParsedDocument | null>;
  parseDocumentBuffer: (buffer: Uint8Array, filename: string) => Promise<ParsedDocument>;
  showItemInFolder: (path: string) => Promise<void>;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
