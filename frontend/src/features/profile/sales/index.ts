// Sales feature module - centralized exports
export * from './types/sales';
export * from './salesThunks';
export * from './salesSlice';
export * from './salesSelectors';

// Re-export reducer for store configuration
export { default as salesReducer } from './salesSlice';
