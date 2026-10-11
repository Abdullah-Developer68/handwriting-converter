/// <reference types="vite/client" />

import type { ElectronAPI } from './renderer/types';

export {};

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'marked-katex-extension' {
  import type { MarkedExtension } from 'marked';
  import type { KatexOptions } from 'katex';
  export interface MarkedKatexOptions extends KatexOptions {
    nonStandard?: boolean;
  }
  export default function markedKatex(options?: MarkedKatexOptions): MarkedExtension;
}

export type {
  ParsedPage,
  ParsedDocument,
  InsertionTarget,
  InsertionConfig,
  ElectronAPI,
} from './renderer/types';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
