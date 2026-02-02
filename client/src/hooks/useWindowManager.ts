/**
 * Window management utilities for Tauri desktop app
 * Note: Window management is handled via Tauri commands in src-tauri/src/main.rs
 * This hook provides a placeholder for future window management features
 */
export const useWindowManager = () => {
  return {
    isMaximized: false,
    toggleMaximize: async () => console.log('Window maximize not available in web mode'),
    minimize: async () => console.log('Window minimize not available in web mode'),
    close: async () => console.log('Window close not available in web mode'),
    setAlwaysOnTop: async () => console.log('Always on top not available in web mode'),
  };
};
