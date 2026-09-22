export type PaperType = 
  | 'ruled'
  | 'college'
  | 'grid'
  | 'dots'
  | 'legal'
  | 'parchment'
  | 'blank'
  | 'chalkboard';

export type HandwritingFont = 
  | 'Caveat'
  | 'Patrick Hand'
  | 'Shadows Into Light'
  | 'Indie Flower'
  | 'Homemade Apple'
  | 'Architects Daughter'
  | 'Kalam'
  | 'Gloria Hallelujah'
  | 'Reenie Beanie'
  | 'Nothing You Could Do'
  | 'Marck Script'
  | 'Rock Salt'
  | 'Cedarville Cursive'
  | 'Just Another Hand'
  | 'Nanum Pen Script';

export type JitterIntensity = 'none' | 'subtle' | 'medium' | 'strong';

export type PageSize = 'A4' | 'Letter';
export type PageOrientation = 'portrait' | 'landscape';

export interface HandwritingSettings {
  font: HandwritingFont;
  fontSize: number; // in px
  lineHeight: number; // in px, aligns with paper ruling
  letterSpacing: number; // in px
  wordSpacing: number; // in px
  inkColor: string;
  penThickness: 'fine' | 'regular' | 'medium' | 'bold';
  paperType: PaperType;
  paperColor?: string; // override
  jitter: JitterIntensity;
  pageSize: PageSize;
  orientation: PageOrientation;
  showMarginLine: boolean;
  marginLineWidth: number; // px from left
  showHoles: boolean;
  showHeader: boolean;
  headerDate: string;
  headerSubject: string;
  showPageNumbers: boolean;
  pageNumberStyle: 'page-x' | 'x-of-y' | 'number-only';
  slant: number; // deg slant -5 to +15 deg
  baselineOffset: number; // px vertical shift to sit right above ruled line
}

export interface PdfExportOptions {
  pageSize: PageSize;
  landscape: boolean;
  marginsType?: number;
  printBackground: boolean;
}

export interface SampleTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  markdown: string;
  recommendedSettings?: Partial<HandwritingSettings>;
}

export interface ParsedPage {
  pageNumber: number;
  text: string;
  preview: string;
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

export type InsertionTarget = 'cursor' | 'new-page' | 'append' | 'prepend' | 'replace';

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
