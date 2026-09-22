/// <reference types="vite/client" />

export {};

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
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

declare global {
  interface Window {
    electronAPI?: {
      openFile: () => Promise<{ content: string; filename: string; path: string } | null>;
      saveFile: (content: string, defaultPath?: string) => Promise<{ success: boolean; path?: string }>;
      exportPdf: (options: { pageSize: string; landscape: boolean; printBackground: boolean }) => Promise<{ success: boolean; path?: string; error?: string }>;
      importDocument: () => Promise<ParsedDocument | null>;
      parseDocumentBuffer: (buffer: Uint8Array, filename: string) => Promise<ParsedDocument>;
      showItemInFolder: (path: string) => Promise<void>;
      platform: string;
    };
  }
}
