import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work on any static host (Vercel, Netlify,
// GitHub Pages project sites, etc.) by using relative asset paths.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    // Proxy API calls to the local backend during development.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
