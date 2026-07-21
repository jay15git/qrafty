exports.config = {
  namespace: 'qr-code',
  excludeSrc: [
    '**/*.spec.ts',
    '**/*.test.ts',
  ],
  outputTargets: [
    {
      type: 'dist',
    },
    {
      type: 'www',
      serviceWorker: false,
    },
  ],
};
