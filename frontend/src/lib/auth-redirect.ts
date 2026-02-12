let handler: (() => void) | null = null;

export function registerAuthRedirectHandler(newHandler: () => void) {
  handler = newHandler;
}

export function triggerAuthRedirect() {
  if (handler) {
    handler();
  } else if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

