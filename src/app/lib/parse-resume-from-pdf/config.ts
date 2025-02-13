export const PARSER_CONFIG = {
  model: {
    type: 'mistral',
    // Model settings
    temperature: 0.1,
    maxTokens: 512,
    // Cache settings
    enableCache: true,
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  },
  // ... other config
}; 