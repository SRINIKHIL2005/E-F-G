import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";

// E-F-G Platform v2.1.0 - Force rebuild with registration validation fixes
export default defineConfig(({ mode }) => {
  const isRenderDeployment = process.env.VITE_RENDER_DEPLOYMENT === 'true' || mode === 'production';
  
  return {
    base: isRenderDeployment ? '/' : '/EDUGALXY/', 
    build: {
      outDir: isRenderDeployment ? 'dist' : 'docs',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          }
        }
      },
      sourcemap: false, // Disable for production
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      assetsDir: 'assets',
      target: 'es2015'
    },
    server: {
      host: "0.0.0.0", // Important for Render deployment
      port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
      strictPort: false, // Allow port flexibility on Render
      proxy: {
        "/api": {
          target: process.env.VITE_API_BASE_URL || "http://localhost:5000",
          changeOrigin: true,
          secure: true,
          timeout: 30000, // Increased timeout for Render
        },
      },
      headers: {
        "Cross-Origin-Opener-Policy": "unsafe-none",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
      hmr: {
        overlay: false
      },
    },
    preview: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "8080"),
      strictPort: true,
      allowedHosts: ["e-f-g-1.onrender.com", ".onrender.com"],
      headers: {
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Opener-Policy": "unsafe-none",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
    },
    plugins: [
      react(),
      NodeGlobalsPolyfillPlugin({
        process: true,
        buffer: true,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        process: "process/browser",
      },
    },
    define: {
      "process.env": {},
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
  };
});
