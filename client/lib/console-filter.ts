// client/lib/console-filter.ts
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const suppressedMessages = [
    'Unchecked runtime.lastError: The message port closed before a response was received.',
    'Extension context invalidated',
    'message port closed',
  ];

  console.error = (...args) => {
    const message = String(args[0]);
    if (suppressedMessages.some(sm => message.includes(sm))) {
      return;
    }
    originalError.apply(console, args);
  };
}

