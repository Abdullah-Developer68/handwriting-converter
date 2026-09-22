export {};

declare global {
  interface Window {
    electronAPI?: {
      openFile: () => Promise<{ content: string; filename: string; path: string } | null>;
      saveFile: (content: string, defaultPath?: string) => Promise<{ success: boolean; path?: string }>;
      exportPdf: (options: { pageSize: string; landscape: boolean; printBackground: boolean }) => Promise<{ success: boolean; path?: string; error?: string }>;
      showItemInFolder: (path: string) => Promise<void>;
      platform: string;
    };
  }
}
