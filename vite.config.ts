import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'defer-heavy-modulepreloads',
      enforce: 'post',
      transformIndexHtml(html: string) {
        // Keep the entry and React runtime eager, but let route-only vendors
        // load through their lazy route imports instead of delaying first paint.
        return html.replace(
          /\s*<link rel="modulepreload"[^>]*href="[^"]*\/(?:vendor-animation|vendor-charts|vendor-dnd|vendor-swiper|hls-)[^"]*"[^>]*>\s*/g,
          '\n',
        );
      },
    },
  ],
  build: {
    // Target modern browsers — smaller output, no legacy transforms
    target: 'esnext',
    // Minify CSS as well
    cssMinify: true,
    // Skip compressed-size calculation — speeds up build output display
    reportCompressedSize: false,
    // Warn at 700KB (uncompressed) — realistic for a feature-rich SPA
    chunkSizeWarningLimit: 700,
    // Route chunks and their heavy vendors are fetched by native ESM imports
    // only when needed. Vite's generated modulepreload list otherwise pulls
    // animation/charts/lecture vendors into the first page load.
    modulePreload: false,
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting — stable vendor libraries get their own
         * long-cached chunk so app-code changes don't invalidate the
         * framework cache. Route-level splitting is already in place via
         * React.lazy() in AppRouter.tsx.
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;

          // Core React — loaded on every page, cached aggressively
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }

          // Animation libs — heavy but stable; separate chunk avoids
          // invalidating react cache when animation code is tweaked
          if (
            id.includes('/framer-motion/') ||
            id.includes('/motion/') ||
            id.includes('/gsap/') ||
            id.includes('/lenis/')
          ) {
            return 'vendor-animation';
          }

          // Data visualisation — recharts is ~500KB alone; isolate it
          // so the dashboard bundle doesn't pollute student-facing pages
          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'vendor-charts';
          }

          // DnD kit — only used in the curriculum drag-and-drop editor
          if (id.includes('/@dnd-kit/')) {
            return 'vendor-dnd';
          }

          // Swiper — only used in course sliders
          if (id.includes('/swiper/')) {
            return 'vendor-swiper';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    // Don't overlay the page with build errors — show in console instead
    hmr: { overlay: false },
  },
})
