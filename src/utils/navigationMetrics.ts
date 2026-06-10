const nowMs = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

export const startNavigationMetric = (label: string) => {
  const startedAt = nowMs();
  return () => {
    const elapsedMs = Math.round(nowMs() - startedAt);
    if (__DEV__) {
      console.log(`[NavMetric] ${label}: ${elapsedMs}ms`);
    }
  };
};
