import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    cors: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Prevent empty chunks
    chunkSizeWarningLimit: 1000,
    // Generate smaller CSS files
    cssCodeSplit: true,
    // Ensure more reliable chunk loading
    outDir: 'dist',
    // Reduce the number of chunks and ensure they're loaded correctly
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Create a vendor chunk for node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
          
          // Create custom chunks for different parts of the app
          if (id.includes('/components/dashboard/')) {
            return 'dashboard-components';
          }
          if (id.includes('/components/workout/')) {
            return 'workout-components';
          }
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/pages/ai/')) {
            return 'ai-features';
          }
          
          // Default chunk for the main app code
          return undefined;
        },
        // Ensure chunk file names are consistent between builds
        chunkFileNames: 'assets/[name]-[hash].js',
        // Prevent hash differences for unchanged files
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    sourcemap: true,
    // Minimize to reduce file size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    }
  }
}));
