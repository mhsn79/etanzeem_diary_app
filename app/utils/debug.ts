// Debug utilities that only run in development mode
export const debugLog = (message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

export const debugWarn = (message: string, data?: any) => {
  if (__DEV__) {
    console.warn(`[DEBUG] ${message}`, data);
  }
};

export const debugError = (message: string, error?: any) => {
  if (__DEV__) {
    console.error(`[DEBUG] ${message}`, error);
  }
};

export const debugBreakpoint = () => {
  if (__DEV__) {
    debugger;
  }
}; 