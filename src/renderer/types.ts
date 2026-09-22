export interface PaperDimensions {
  width: number;
  height: number;
}

export type PageSize = 'A4' | 'Letter';
export type PageOrientation = 'portrait' | 'landscape';
export type PenThickness = 'fine' | 'regular' | 'medium' | 'bold';
export type JitterIntensity = 'none' | 'subtle' | 'medium' | 'strong';
export type PageNumberStyle = 'x-of-y' | 'number-only' | 'page-x';

export interface HandwritingSettings {
  font: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  inkColor: string;
  penThickness: PenThickness;
  jitter: JitterIntensity;
  slant: number;
  baselineOffset: number;
  paperType: string;
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

export interface SampleTemplate {
  id: string;
  title: string;
  category: 'academic' | 'creative' | 'technical' | 'meeting' | 'letter';
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
