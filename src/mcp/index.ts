// Model-Context Protocol (MCP) - Main Exports
export * from './server';
export * from './client';

// Re-export commonly used instances
import { workoutHistoryClient } from './client';
import { workoutHistoryFixer } from './server';

export { workoutHistoryClient, workoutHistoryFixer };

// Export default client for easier imports
export default workoutHistoryClient;
