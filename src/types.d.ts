/// <reference types="vite/client" />

import type { ElectronAPI } from './renderer/types';

export {};

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
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

