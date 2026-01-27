import { Middleware } from 'redux';

// Token refresh is handled centrally (apiClient + refresh orchestrator).
// Keep middleware as a no-op to avoid extra refresh calls.
const authMiddleware = (() => {
  return (next) => (action) => next(action);
}) as Middleware;

export default authMiddleware;