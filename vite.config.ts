import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': ['@/components/ui'],
          'dashboard-core': ['@/components/dashboard', '@/hooks/useAuth', '@/hooks/useWorkoutTracking'],
          'data-hooks': ['@/hooks/useWorkoutStats', '@/hooks/useWorkoutSchedule', '@/hooks/useNutrition'],
          'exercise-features': ['@/components/workout', '@/services/exerciseService'],
          'auth-related': ['@/pages/Login', '@/pages/Signup'],
          'ai-features': [
            '@/pages/ai/AIWorkoutsPage',
            '@/pages/ai/AIWorkoutDetailPage',
            '@/pages/ai/AIWorkoutGenerationPage'
          ]
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
