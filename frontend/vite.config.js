import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/@react-three/") || id.includes("/node_modules/three/") || id.includes("/node_modules/maath/")) {
            return "three-vendor";
          }
          if (id.includes("/node_modules/gsap/")) {
            return "motion-vendor";
          }
        },
      },
    },
  },
});